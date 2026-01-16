// Snap Logic - Handles snapping parts to slots and grid

const SNAP_RADIUS = 30; // pixels - distance to trigger snap
const GRID_SIZE = 20; // pixels - grid cell size

/**
 * Calculate distance between two points
 */
export function calculateDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Snap position to grid
 */
export function snapToGrid(position, gridSize = GRID_SIZE) {
    return {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize
    };
}

/**
 * Check if a dragged part can snap to any existing parts
 * Returns the target slot and part if snap is possible
 */
export function checkSlotSnap(draggedPart, draggedSlot, allParts, connectionRules) {
    for (const part of allParts) {
        if (part.id === draggedPart.id) continue; // Skip self

        for (const slot of part.slots) {
            // Calculate absolute slot positions
            const draggedSlotPos = {
                x: draggedPart.position.x + draggedSlot.position.x,
                y: draggedPart.position.y + draggedSlot.position.y
            };

            const targetSlotPos = {
                x: part.position.x + slot.position.x,
                y: part.position.y + slot.position.y
            };

            const distance = calculateDistance(draggedSlotPos, targetSlotPos);

            // Check if within snap radius and types are compatible
            if (distance < SNAP_RADIUS) {
                const canConnect = areTypesCompatible(
                    draggedSlot.type,
                    slot.type,
                    connectionRules
                );

                if (canConnect) {
                    return {
                        shouldSnap: true,
                        targetPart: part,
                        targetSlot: slot,
                        snapPosition: {
                            x: part.position.x + slot.position.x - draggedSlot.position.x,
                            y: part.position.y + slot.position.y - draggedSlot.position.y
                        }
                    };
                } else {
                    return {
                        shouldSnap: false,
                        invalid: true,
                        targetSlot: slot
                    };
                }
            }
        }
    }

    return { shouldSnap: false };
}

/**
 * Check if two slot types are compatible
 */
function areTypesCompatible(type1, type2, connectionRules) {
    const compatible = connectionRules[type1];
    return compatible && compatible.includes(type2);
}

/**
 * Find nearest slot to cursor position
 */
export function findNearestSlot(cursorPos, part) {
    let nearestSlot = null;
    let minDistance = Infinity;

    for (const slot of part.slots) {
        const slotAbsPos = {
            x: part.position.x + slot.position.x,
            y: part.position.y + slot.position.y
        };

        const distance = calculateDistance(cursorPos, slotAbsPos);

        if (distance < minDistance) {
            minDistance = distance;
            nearestSlot = slot;
        }
    }

    return { slot: nearestSlot, distance: minDistance };
}

/**
 * Get all slots for a part in absolute coordinates
 */
export function getAbsoluteSlotPositions(part) {
    return part.slots.map(slot => ({
        ...slot,
        absolutePosition: {
            x: part.position.x + slot.position.x,
            y: part.position.y + slot.position.y
        }
    }));
}
