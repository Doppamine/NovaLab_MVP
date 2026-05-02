const DEG_TO_RAD = Math.PI / 180;

export const MODEL_REFERENCES = [
  {
    label: 'Rothermel, 1972',
    title: 'A mathematical model for predicting fire spread in wildland fuels',
    url: 'https://research.fs.usda.gov/treesearch/32533',
  },
  {
    label: 'Anderson, 1982',
    title: 'Aids to determining fuel models for estimating fire behavior',
    url: 'https://research.fs.usda.gov/treesearch/6447',
  },
];

export const FUEL_MODELS = {
  pineLitter: {
    label: 'Pine litter',
    color: '#3f6f3d',
    baseRateMps: 0.026,
    fuelLoadKgM2: 0.74,
    heatContentKjKg: 18600,
    packingRatio: 0.021,
    extinctionMoisture: 0.3,
    windCoefficient: 0.043,
    treeDensity: 0.32,
  },
  denseUnderstory: {
    label: 'Dense understory',
    color: '#2f5a31',
    baseRateMps: 0.034,
    fuelLoadKgM2: 1.08,
    heatContentKjKg: 19200,
    packingRatio: 0.027,
    extinctionMoisture: 0.34,
    windCoefficient: 0.051,
    treeDensity: 0.48,
  },
  dryMeadow: {
    label: 'Dry meadow',
    color: '#91884b',
    baseRateMps: 0.047,
    fuelLoadKgM2: 0.46,
    heatContentKjKg: 17800,
    packingRatio: 0.015,
    extinctionMoisture: 0.28,
    windCoefficient: 0.058,
    treeDensity: 0.08,
  },
  wetDraw: {
    label: 'Wet draw',
    color: '#2d6c62',
    baseRateMps: 0.013,
    fuelLoadKgM2: 0.92,
    heatContentKjKg: 18400,
    packingRatio: 0.025,
    extinctionMoisture: 0.4,
    windCoefficient: 0.024,
    moistureOffset: 0.13,
    treeDensity: 0.18,
  },
  defensibleSpace: {
    label: 'Cleared grass',
    color: '#8b7f57',
    baseRateMps: 0.009,
    fuelLoadKgM2: 0.18,
    heatContentKjKg: 16800,
    packingRatio: 0.011,
    extinctionMoisture: 0.32,
    windCoefficient: 0.018,
    moistureOffset: 0.05,
    treeDensity: 0.02,
  },
};

export const WILDFIRE_SCENARIO = {
  gridCount: 39,
  cellSize: 5,
  housePosition: [0, 0],
  houseRadiusM: 9,
  ignitionPosition: [-74, -61],
  ignitionRadiusM: 9,
  fuelMoisture: 0.12,
  windSpeedMps: 6.2,
  windDirectionDeg: 42,
  slopePercent: 13,
  slopeDirectionDeg: 35,
  timeScale: 55,
};

export function createWildfireSimulation(scenario = WILDFIRE_SCENARIO) {
  const cells = createCells(scenario);
  const ignitionCellIds = cells
    .filter((cell) => distance2D(cell, positionToCellLike(scenario.ignitionPosition)) <= scenario.ignitionRadiusM)
    .map((cell) => cell.id);

  const { arrivalTimes, previousCellIds } = solveArrivalTimes(cells, ignitionCellIds, scenario);
  const targetCells = cells.filter((cell) => (
    distance2D(cell, positionToCellLike(scenario.housePosition)) <= scenario.houseRadiusM
  ));

  const houseCell = targetCells.reduce((best, cell) => (
    arrivalTimes[cell.id] < arrivalTimes[best.id] ? cell : best
  ), targetCells[0]);

  const pathCellIds = reconstructPath(previousCellIds, houseCell?.id);
  const headFireMetrics = calculateDirectionalSpread({
    from: positionToCellLike(scenario.ignitionPosition),
    to: positionToCellLike(scenario.housePosition),
    fuel: FUEL_MODELS.denseUnderstory,
    moisture: scenario.fuelMoisture,
    scenario,
  });

  return {
    scenario,
    cells,
    ignitionCellIds,
    arrivalTimes,
    previousCellIds,
    houseCellId: houseCell?.id,
    houseArrivalSec: houseCell ? arrivalTimes[houseCell.id] : Infinity,
    pathCellIds,
    headFireMetrics,
    forestAssets: createForestAssets(cells, arrivalTimes, scenario),
    rockAssets: createRockAssets(cells, scenario),
  };
}

function createCells(scenario) {
  const cells = [];
  const half = (scenario.gridCount - 1) / 2;

  for (let row = 0; row < scenario.gridCount; row += 1) {
    for (let col = 0; col < scenario.gridCount; col += 1) {
      const x = (col - half) * scenario.cellSize;
      const z = (row - half) * scenario.cellSize;
      const id = toCellId(col, row);
      const fuelKey = chooseFuelModel(x, z, scenario);
      const fuel = FUEL_MODELS[fuelKey];
      const microMoisture = (noise2D(x * 0.08, z * 0.08) - 0.5) * 0.035;

      cells.push({
        id,
        col,
        row,
        x,
        z,
        height: terrainHeightAt(x, z, scenario),
        fuelKey,
        moisture: clamp(
          scenario.fuelMoisture + (fuel.moistureOffset || 0) + microMoisture,
          0.04,
          0.42,
        ),
        neighbors: getNeighborIds(col, row, scenario.gridCount),
      });
    }
  }

  return cells;
}

function solveArrivalTimes(cells, ignitionCellIds, scenario) {
  const cellById = new Map(cells.map((cell) => [cell.id, cell]));
  const arrivalTimes = Object.fromEntries(cells.map((cell) => [cell.id, Infinity]));
  const previousCellIds = {};
  const queue = new MinHeap();

  ignitionCellIds.forEach((cellId) => {
    arrivalTimes[cellId] = 0;
    queue.push({ id: cellId, priority: 0 });
  });

  while (queue.size > 0) {
    const current = queue.pop();

    if (!current || current.priority > arrivalTimes[current.id]) {
      continue;
    }

    const currentCell = cellById.get(current.id);

    currentCell.neighbors.forEach((neighborId) => {
      const neighbor = cellById.get(neighborId);

      if (!neighbor) {
        return;
      }

      const directionDistance = distance2D(currentCell, neighbor);
      const fuel = blendFuelModels(FUEL_MODELS[currentCell.fuelKey], FUEL_MODELS[neighbor.fuelKey]);
      const moisture = (currentCell.moisture + neighbor.moisture) / 2;
      const spread = calculateDirectionalSpread({
        from: currentCell,
        to: neighbor,
        fuel,
        moisture,
        scenario,
      });
      const candidateTime = arrivalTimes[current.id] + directionDistance / spread.rateMps;

      if (candidateTime < arrivalTimes[neighborId]) {
        arrivalTimes[neighborId] = candidateTime;
        previousCellIds[neighborId] = current.id;
        queue.push({ id: neighborId, priority: candidateTime });
      }
    });
  }

  return { arrivalTimes, previousCellIds };
}

export function calculateDirectionalSpread({ from, to, fuel, moisture, scenario }) {
  const direction = normalize2D({ x: to.x - from.x, z: to.z - from.z });
  const windVector = directionFromDegrees(scenario.windDirectionDeg);
  const slopeVector = directionFromDegrees(scenario.slopeDirectionDeg);
  const windAlignment = Math.max(0, dot2D(direction, windVector));
  const slopeAlignment = Math.max(0, dot2D(direction, slopeVector));

  // Rothermel moisture damping polynomial: eta_M = 1 - 2.59r + 5.11r^2 - 3.52r^3.
  const moistureRatio = clamp(moisture / fuel.extinctionMoisture, 0, 1);
  const moistureDamping = clamp(
    1 - (2.59 * moistureRatio) + (5.11 * moistureRatio ** 2) - (3.52 * moistureRatio ** 3),
    0.05,
    1,
  );

  const windFactor = fuel.windCoefficient * (scenario.windSpeedMps ** 1.34) * (windAlignment ** 1.7);
  const slopeAngle = Math.atan(scenario.slopePercent / 100);
  const slopeFactor = 5.275 * (fuel.packingRatio ** -0.3) * (Math.tan(slopeAngle) ** 2) * (slopeAlignment ** 2);
  const rateMps = clamp(fuel.baseRateMps * moistureDamping * (1 + windFactor + slopeFactor), 0.002, 0.18);
  const firelineIntensityKwM = fuel.heatContentKjKg * fuel.fuelLoadKgM2 * rateMps;
  const flameLengthM = 0.0775 * (firelineIntensityKwM ** 0.46);

  return {
    rateMps,
    rateMMin: rateMps * 60,
    moistureDamping,
    windFactor,
    slopeFactor,
    firelineIntensityKwM,
    flameLengthM,
  };
}

function chooseFuelModel(x, z, scenario) {
  const houseDistance = distance2D({ x, z }, positionToCellLike(scenario.housePosition));
  const diagonalDraw = Math.abs((z + 24) - (x * 0.34));
  const noise = noise2D(x * 0.045 + 9.7, z * 0.045 - 2.1);

  if (houseDistance < 17) {
    return 'defensibleSpace';
  }

  if (diagonalDraw < 8 && z > -54) {
    return 'wetDraw';
  }

  if (noise > 0.72) {
    return 'dryMeadow';
  }

  if (noise < 0.3 || (x > -35 && z < 34 && z > -48)) {
    return 'denseUnderstory';
  }

  return 'pineLitter';
}

export function terrainHeightAt(x, z, scenario = WILDFIRE_SCENARIO) {
  const slope = scenario.slopePercent / 100;
  const slopeDirection = directionFromDegrees(scenario.slopeDirectionDeg);
  const slopeHeight = (x * slopeDirection.x + z * slopeDirection.z) * slope;
  const ridge = Math.sin((x + 18) * 0.055) * 1.8 + Math.cos((z - 12) * 0.05) * 1.4;
  const roughness = (noise2D(x * 0.08, z * 0.08) - 0.5) * 2.5;

  return slopeHeight + ridge + roughness;
}

function createForestAssets(cells, arrivalTimes, scenario) {
  const trees = [];

  cells.forEach((cell) => {
    const fuel = FUEL_MODELS[cell.fuelKey];
    const nearHouse = distance2D(cell, positionToCellLike(scenario.housePosition)) < 15;
    const nearIgnition = distance2D(cell, positionToCellLike(scenario.ignitionPosition)) < 8;
    const densitySample = noise2D(cell.x * 0.19 + 4.3, cell.z * 0.19 - 8.9);

    if (nearHouse || nearIgnition || densitySample > fuel.treeDensity) {
      return;
    }

    const clusters = fuel.treeDensity > 0.4 && densitySample < 0.08 ? 2 : 1;

    for (let index = 0; index < clusters; index += 1) {
      const jitterX = (noise2D(cell.x + index * 8.1, cell.z - 3.4) - 0.5) * scenario.cellSize * 0.7;
      const jitterZ = (noise2D(cell.x - 5.8, cell.z + index * 9.2) - 0.5) * scenario.cellSize * 0.7;
      const x = cell.x + jitterX;
      const z = cell.z + jitterZ;
      const seed = noise2D(x * 0.33, z * 0.33);

      trees.push({
        id: `tree-${cell.id}-${index}`,
        x,
        z,
        height: terrainHeightAt(x, z, scenario),
        scale: 0.78 + seed * 0.72,
        rotation: seed * Math.PI * 2,
        type: seed > 0.78 || cell.fuelKey === 'dryMeadow' ? 'birch' : 'pine',
        fuelKey: cell.fuelKey,
        arrivalTime: arrivalTimes[cell.id],
      });
    }
  });

  return trees;
}

function createRockAssets(cells, scenario) {
  return cells
    .filter((cell) => {
      const sample = noise2D(cell.x * 0.13 - 2.3, cell.z * 0.13 + 7.1);
      const awayFromHouse = distance2D(cell, positionToCellLike(scenario.housePosition)) > 18;
      return sample > 0.93 && awayFromHouse;
    })
    .slice(0, 38)
    .map((cell) => ({
      id: `rock-${cell.id}`,
      x: cell.x + (noise2D(cell.x, cell.z) - 0.5) * 2,
      z: cell.z + (noise2D(cell.z, cell.x) - 0.5) * 2,
      height: cell.height,
      scale: 0.45 + noise2D(cell.x * 0.7, cell.z * 0.7) * 0.75,
      rotation: noise2D(cell.x * 1.7, cell.z * 1.7) * Math.PI,
    }));
}

function reconstructPath(previousCellIds, endCellId) {
  if (!endCellId) {
    return [];
  }

  const path = [];
  let cursor = endCellId;

  while (cursor) {
    path.unshift(cursor);
    cursor = previousCellIds[cursor];
  }

  return path;
}

function blendFuelModels(a, b) {
  if (a === b) {
    return a;
  }

  return {
    label: `${a.label} / ${b.label}`,
    color: a.color,
    baseRateMps: (a.baseRateMps + b.baseRateMps) / 2,
    fuelLoadKgM2: (a.fuelLoadKgM2 + b.fuelLoadKgM2) / 2,
    heatContentKjKg: (a.heatContentKjKg + b.heatContentKjKg) / 2,
    packingRatio: (a.packingRatio + b.packingRatio) / 2,
    extinctionMoisture: (a.extinctionMoisture + b.extinctionMoisture) / 2,
    windCoefficient: (a.windCoefficient + b.windCoefficient) / 2,
  };
}

function getNeighborIds(col, row, gridCount) {
  const neighbors = [];

  for (let dCol = -1; dCol <= 1; dCol += 1) {
    for (let dRow = -1; dRow <= 1; dRow += 1) {
      if (dCol === 0 && dRow === 0) {
        continue;
      }

      const nextCol = col + dCol;
      const nextRow = row + dRow;

      if (nextCol >= 0 && nextCol < gridCount && nextRow >= 0 && nextRow < gridCount) {
        neighbors.push(toCellId(nextCol, nextRow));
      }
    }
  }

  return neighbors;
}

function toCellId(col, row) {
  return `${col}:${row}`;
}

function positionToCellLike(position) {
  return { x: position[0], z: position[1] };
}

function directionFromDegrees(degrees) {
  const radians = degrees * DEG_TO_RAD;
  return {
    x: Math.sin(radians),
    z: Math.cos(radians),
  };
}

function normalize2D(vector) {
  const length = Math.hypot(vector.x, vector.z) || 1;
  return {
    x: vector.x / length,
    z: vector.z / length,
  };
}

function dot2D(a, b) {
  return a.x * b.x + a.z * b.z;
}

function distance2D(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function noise2D(x, z) {
  const value = Math.sin((x * 127.1) + (z * 311.7)) * 43758.5453123;
  return value - Math.floor(value);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

class MinHeap {
  constructor() {
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  push(item) {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
  }

  pop() {
    if (this.items.length === 0) {
      return null;
    }

    const top = this.items[0];
    const last = this.items.pop();

    if (this.items.length > 0) {
      this.items[0] = last;
      this.bubbleDown(0);
    }

    return top;
  }

  bubbleUp(index) {
    let current = index;

    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);

      if (this.items[parent].priority <= this.items[current].priority) {
        break;
      }

      [this.items[parent], this.items[current]] = [this.items[current], this.items[parent]];
      current = parent;
    }
  }

  bubbleDown(index) {
    let current = index;

    while (true) {
      const left = (current * 2) + 1;
      const right = left + 1;
      let smallest = current;

      if (left < this.items.length && this.items[left].priority < this.items[smallest].priority) {
        smallest = left;
      }

      if (right < this.items.length && this.items[right].priority < this.items[smallest].priority) {
        smallest = right;
      }

      if (smallest === current) {
        break;
      }

      [this.items[current], this.items[smallest]] = [this.items[smallest], this.items[current]];
      current = smallest;
    }
  }
}
