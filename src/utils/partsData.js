// Parts Data Structure for NovaLab Constructor
// Defines all available parts with their properties, slots, and connection rules

export const PARTS_DATA = {
    // ========== ELECTRICAL / PHYSICS PARTS ==========

    battery: {
        id: 'battery',
        name: 'Батарейка',
        category: 'electrical',
        icon: '🔋',
        description: 'Источник питания для механизмов',
        size: { width: 60, height: 100 },
        slots: [
            {
                id: 'output',
                type: 'power_output',
                position: { x: 30, y: 0 }, // top center
                accepts: ['power_input'],
                color: '#00ff9f'
            }
        ]
    },

    bulb: {
        id: 'bulb',
        name: 'Лампочка',
        category: 'electrical',
        icon: '💡',
        description: 'Светится при подключении к источнику питания',
        size: { width: 60, height: 80 },
        slots: [
            {
                id: 'input',
                type: 'power_input',
                position: { x: 30, y: 80 }, // bottom center
                accepts: ['power_output', 'wire_output'],
                color: '#00f2ff'
            }
        ],
        state: {
            powered: false
        }
    },

    wire: {
        id: 'wire',
        name: 'Провод',
        category: 'electrical',
        icon: '🔌',
        description: 'Соединяет электрические компоненты',
        size: { width: 80, height: 20 },
        slots: [
            {
                id: 'input',
                type: 'wire_input',
                position: { x: 0, y: 10 },
                accepts: ['power_output', 'wire_output'],
                color: '#00f2ff'
            },
            {
                id: 'output',
                type: 'wire_output',
                position: { x: 80, y: 10 },
                accepts: ['power_input', 'wire_input'],
                color: '#00ff9f'
            }
        ]
    },

    motor: {
        id: 'motor',
        name: 'Мотор',
        category: 'electrical',
        icon: '⚙️',
        description: 'Преобразует электричество в движение',
        size: { width: 80, height: 80 },
        slots: [
            {
                id: 'power_input',
                type: 'power_input',
                position: { x: 0, y: 40 }, // left center
                accepts: ['power_output', 'wire_output'],
                color: '#00f2ff'
            },
            {
                id: 'shaft_output',
                type: 'mechanical_output',
                position: { x: 80, y: 40 }, // right center
                accepts: ['mechanical_input'],
                color: '#ff006e'
            }
        ],
        state: {
            powered: false,
            rotating: false
        }
    },

    propeller: {
        id: 'propeller',
        name: 'Пропеллер',
        category: 'electrical',
        icon: '/icons/propeller.png',
        description: 'Вращается при подключении к мотору',
        size: { width: 100, height: 100 },
        slots: [
            {
                id: 'shaft_input',
                type: 'mechanical_input',
                position: { x: 50, y: 50 },
                accepts: ['mechanical_output'],
                color: '#9d4edd'
            }
        ],
        state: {
            spinning: false,
            speed: 0
        }
    },

    // ========== CAR PARTS ==========

    chassis: {
        id: 'chassis',
        name: 'Шасси',
        category: 'car',
        icon: '🏗️',
        description: 'Основа автомобиля',
        size: { width: 200, height: 100 },
        slots: [
            {
                id: 'wheel_slot_fl',
                type: 'wheel_mount',
                position: { x: 30, y: 90 }, // front-left
                accepts: ['wheel_connector'],
                color: '#00f2ff'
            },
            {
                id: 'wheel_slot_fr',
                type: 'wheel_mount',
                position: { x: 170, y: 90 }, // front-right
                accepts: ['wheel_connector'],
                color: '#00f2ff'
            },
            {
                id: 'wheel_slot_rl',
                type: 'wheel_mount',
                position: { x: 30, y: 10 }, // rear-left
                accepts: ['wheel_connector'],
                color: '#00f2ff'
            },
            {
                id: 'wheel_slot_rr',
                type: 'wheel_mount',
                position: { x: 170, y: 10 }, // rear-right
                accepts: ['wheel_connector'],
                color: '#00f2ff'
            },
            {
                id: 'engine_mount',
                type: 'engine_mount',
                position: { x: 100, y: 50 }, // center
                accepts: ['engine_connector'],
                color: '#ff006e'
            },
            {
                id: 'body_mount',
                type: 'body_mount',
                position: { x: 100, y: 20 },
                accepts: ['body_connector'],
                color: '#9d4edd'
            }
        ]
    },

    wheel: {
        id: 'wheel',
        name: 'Колесо',
        category: 'car',
        icon: '🛞',
        description: 'Колесо для автомобиля',
        size: { width: 40, height: 40 },
        slots: [
            {
                id: 'mount',
                type: 'wheel_connector',
                position: { x: 20, y: 20 }, // center
                accepts: ['wheel_mount'],
                color: '#00f2ff'
            }
        ],
        state: {
            rotating: false
        }
    },

    engine: {
        id: 'engine',
        name: 'Двигатель',
        category: 'car',
        icon: '🔧',
        description: 'Двигатель автомобиля',
        size: { width: 80, height: 60 },
        slots: [
            {
                id: 'chassis_connector',
                type: 'engine_connector',
                position: { x: 40, y: 60 }, // bottom center
                accepts: ['engine_mount'],
                color: '#ff006e'
            },
            {
                id: 'battery_input',
                type: 'power_input',
                position: { x: 10, y: 30 },
                accepts: ['power_output'],
                color: '#00f2ff'
            },
            {
                id: 'controller_input',
                type: 'control_input',
                position: { x: 70, y: 30 },
                accepts: ['control_output'],
                color: '#9d4edd'
            }
        ],
        state: {
            powered: false,
            running: false
        }
    },

    carBattery: {
        id: 'carBattery',
        name: 'Аккумулятор',
        category: 'car',
        icon: '🔋',
        description: 'Питание для двигателя автомобиля',
        size: { width: 60, height: 40 },
        slots: [
            {
                id: 'output',
                type: 'power_output',
                position: { x: 30, y: 0 }, // top
                accepts: ['power_input'],
                color: '#00ff9f'
            }
        ]
    },

    controller: {
        id: 'controller',
        name: 'Пульт управления',
        category: 'car',
        icon: '🎮',
        description: 'Система управления автомобилем',
        size: { width: 60, height: 60 },
        slots: [
            {
                id: 'control_output',
                type: 'control_output',
                position: { x: 30, y: 60 }, // bottom
                accepts: ['control_input'],
                color: '#9d4edd'
            }
        ]
    },

    body: {
        id: 'body',
        name: 'Кузов',
        category: 'car',
        icon: '🚗',
        description: 'Корпус автомобиля',
        size: { width: 180, height: 80 },
        slots: [
            {
                id: 'chassis_connector',
                type: 'body_connector',
                position: { x: 90, y: 80 }, // bottom center
                accepts: ['body_mount'],
                color: '#9d4edd'
            }
        ]
    },

    // ========== ROCKET PARTS (Simplified 7-part design) ==========

    engine_cluster: {
        id: 'engine_cluster',
        name: 'Кластер двигателей',
        category: 'rocket',
        icon: '🔥',
        description: 'База ракеты - 3 мощных сопла',
        size: { width: 140, height: 80 }
    },

    first_stage: {
        id: 'first_stage',
        name: 'Первая ступень',
        category: 'rocket',
        icon: '🚀',
        description: 'Центральный бак с 4 стабилизаторами',
        size: { width: 120, height: 200 }
    },

    booster: {
        id: 'booster',
        name: 'Ускоритель',
        category: 'rocket',
        icon: '⚡',
        description: 'Боковой ускоритель (нужно 4 шт)',
        size: { width: 60, height: 150 }
    },

    inter_stage: {
        id: 'inter_stage',
        name: 'Переходник',
        category: 'rocket',
        icon: '🔗',
        description: 'Соединяет 1-ю и 2-ю ступени',
        size: { width: 100, height: 40 }
    },

    second_stage: {
        id: 'second_stage',
        name: 'Вторая ступень',
        category: 'rocket',
        icon: '🛰️',
        description: 'Верхняя ступень с вакуумным двигателем',
        size: { width: 90, height: 160 }
    },

    command_module: {
        id: 'command_module',
        name: 'Командный модуль',
        category: 'rocket',
        icon: '🎛️',
        description: 'Капсула управления с иллюминаторами',
        size: { width: 80, height: 60 }
    },

    fairing: {
        id: 'fairing',
        name: 'Обтекатель',
        category: 'rocket',
        icon: '🔻',
        description: 'Защитный конус для полезной нагрузки',
        size: { width: 85, height: 100 }
    }

};


// Connection compatibility matrix
export const CONNECTION_RULES = {
    power_output: ['power_input', 'wire_input'],
    power_input: ['power_output', 'wire_output'],
    wire_output: ['power_input', 'wire_input'],
    wire_input: ['power_output', 'wire_output'],
    mechanical_output: ['mechanical_input'],
    mechanical_input: ['mechanical_output'],
    wheel_mount: ['wheel_connector'],
    wheel_connector: ['wheel_mount'],
    engine_mount: ['engine_connector'],
    engine_connector: ['engine_mount'],
    body_mount: ['body_connector'],
    body_connector: ['body_mount'],
    control_output: ['control_input'],
    control_input: ['control_output'],

    // Rocket Rules
    rocket_engine_slot: ['rocket_engine_top'],
    rocket_engine_top: ['rocket_engine_slot', 'separator_top', 'rocket_top'], // Allow chaining if needed
    separator_top: ['rocket_engine_top'], // Special connection for upper stage engine

    rocket_body_slot: ['rocket_body_bottom'],
    rocket_body_bottom: ['rocket_body_slot', 'rocket_top'],
    rocket_top: ['rocket_body_bottom'], // General stacking top-to-bottom

    fin_mount: ['fin_connector'],
    fin_connector: ['fin_mount']
};

// Car assembly requirements
export const CAR_REQUIREMENTS = {
    chassis: 1,
    wheel: 4,
    engine: 1,
    carBattery: 1,
    controller: 1,

    body: 1,
    // Add rocket requirements if needed later, or make them separate
    // For now validating via RocketConstructor specific logic

};

// Helper function to check if two slot types are compatible
export function areSlotTypesCompatible(slotType1, slotType2) {
    const compatible = CONNECTION_RULES[slotType1];
    return compatible && compatible.includes(slotType2);
}

// Helper function to get part by ID
export function getPartData(partId) {
    return PARTS_DATA[partId];
}

// Get all parts by category
export function getPartsByCategory(category) {
    return Object.values(PARTS_DATA).filter(part => part.category === category);
}
