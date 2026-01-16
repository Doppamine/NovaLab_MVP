import React from 'react';

/**
 * RocketPart3DModel - Реалистичные 3D модели ракеты (8 деталей)
 * Упрощённый дизайн с максимальной визуальной детализацией
 */

// ============ 1. ENGINE_CLUSTER (Кластер двигателей) ============
// База ракеты - платформа с 3 соплами
export function EngineClusterModel({ highlightedSockets = [] }) {
    return (
        <group>
            {/* Платформа крепления */}
            <mesh position={[0, 0.3, 0]} castShadow>
                <cylinderGeometry args={[1.4, 1.5, 0.4, 32]} />
                <meshStandardMaterial color="#2a2a3a" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Центральное сопло (большое) */}
            <group position={[0, -0.8, 0]}>
                <mesh castShadow>
                    <coneGeometry args={[0.8, 1.8, 32, 1, true]} />
                    <meshStandardMaterial color="#444455" metalness={0.9} roughness={0.1} side={2} />
                </mesh>
                {/* Внутреннее свечение */}
                <mesh position={[0, 0.3, 0]}>
                    <coneGeometry args={[0.6, 1.2, 32]} />
                    <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={0.6} />
                </mesh>
            </group>

            {/* 2 боковых сопла */}
            {[-0.9, 0.9].map((x, i) => (
                <group key={i} position={[x, -0.6, 0]}>
                    <mesh castShadow>
                        <coneGeometry args={[0.5, 1.4, 24, 1, true]} />
                        <meshStandardMaterial color="#444455" metalness={0.9} roughness={0.1} side={2} />
                    </mesh>
                    <mesh position={[0, 0.2, 0]}>
                        <coneGeometry args={[0.35, 0.9, 24]} />
                        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={0.5} />
                    </mesh>
                </group>
            ))}

            {/* Socket индикатор - верх */}
            <mesh position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.8, 1.0, 32]} />
                <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={0.4} side={2} />
            </mesh>
        </group>
    );
}

// ============ 2. FIRST_STAGE (Первая ступень) ============
// Большой центральный бак + 4 встроенных стабилизатора
export function FirstStageModel({ highlightedSockets = [] }) {
    return (
        <group>
            {/* Основной цилиндрический бак */}
            <mesh castShadow>
                <cylinderGeometry args={[1.2, 1.2, 8, 32]} />
                <meshStandardMaterial color="#E8E8E8" metalness={0.3} roughness={0.5} />
            </mesh>

            {/* Панельные швы (вертикальные линии) */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <mesh key={i} position={[Math.cos((Math.PI / 4) * i) * 1.21, 0, Math.sin((Math.PI / 4) * i) * 1.21]}>
                    <boxGeometry args={[0.02, 8, 0.02]} />
                    <meshStandardMaterial color="#888888" />
                </mesh>
            ))}

            {/* Горизонтальные полосы (маркировка) */}
            {[-3, 0, 3].map((y, i) => (
                <mesh key={i} position={[0, y, 0]}>
                    <cylinderGeometry args={[1.22, 1.22, 0.1, 32]} />
                    <meshStandardMaterial color={i === 1 ? "#FF6600" : "#333344"} />
                </mesh>
            ))}

            {/* Верхняя полусфера */}
            <mesh position={[0, 4, 0]} castShadow>
                <sphereGeometry args={[1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#E8E8E8" metalness={0.3} roughness={0.5} />
            </mesh>

            {/* Нижнее кольцо (к engine_cluster) */}
            <mesh position={[0, -4, 0]} castShadow>
                <cylinderGeometry args={[1.3, 1.4, 0.3, 32]} />
                <meshStandardMaterial color="#2a2a3a" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* 4 стабилизатора (встроены) */}
            {[0, 1, 2, 3].map((i) => {
                const angle = (Math.PI / 2) * i + Math.PI / 4;
                return (
                    <group key={i} position={[Math.cos(angle) * 1.3, -3.5, Math.sin(angle) * 1.3]} rotation={[0, -angle, 0]}>
                        {/* Основное крыло */}
                        <mesh castShadow rotation={[0, 0, -0.1]}>
                            <boxGeometry args={[1.2, 1.5, 0.08]} />
                            <meshStandardMaterial color="#333344" metalness={0.5} roughness={0.4} />
                        </mesh>
                    </group>
                );
            })}

            {/* 4 точки крепления бустеров (визуальные) */}
            {[0, 1, 2, 3].map((i) => {
                const angle = (Math.PI / 2) * i;
                return (
                    <mesh key={`mount-${i}`} position={[Math.cos(angle) * 1.25, 0, Math.sin(angle) * 1.25]}>
                        <boxGeometry args={[0.4, 0.6, 0.3]} />
                        <meshStandardMaterial color="#444455" metalness={0.6} roughness={0.4} />
                    </mesh>
                );
            })}
        </group>
    );
}

// ============ 3. BOOSTER (Боковой ускоритель) ============
// Отдельный бустер (×4 нужно)
export function BoosterModel({ highlightedSockets = [] }) {
    return (
        <group>
            {/* Носовой конус */}
            <mesh position={[0, 2.5, 0]} castShadow>
                <coneGeometry args={[0.5, 1.5, 24]} />
                <meshStandardMaterial color="#D0D0D0" metalness={0.4} roughness={0.5} />
            </mesh>

            {/* Основной цилиндр */}
            <mesh castShadow>
                <cylinderGeometry args={[0.5, 0.5, 5, 24]} />
                <meshStandardMaterial color="#D0D0D0" metalness={0.4} roughness={0.5} />
            </mesh>

            {/* Оранжевая полоса */}
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.52, 0.52, 0.3, 24]} />
                <meshStandardMaterial color="#FF6600" />
            </mesh>

            {/* Точка крепления (сбоку) */}
            <mesh position={[0.4, 0, 0]}>
                <boxGeometry args={[0.3, 0.5, 0.3]} />
                <meshStandardMaterial color="#444455" metalness={0.7} />
            </mesh>

            {/* Сопло бустера */}
            <group position={[0, -3, 0]}>
                <mesh castShadow>
                    <coneGeometry args={[0.45, 1, 24, 1, true]} />
                    <meshStandardMaterial color="#444455" metalness={0.9} roughness={0.1} side={2} />
                </mesh>
                <mesh position={[0, 0.2, 0]}>
                    <coneGeometry args={[0.3, 0.6, 24]} />
                    <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={0.4} />
                </mesh>
            </group>
        </group>
    );
}

// ============ 4. INTER_STAGE (Переходник ступеней) ============
export function InterStageModel({ highlightedSockets = [] }) {
    return (
        <group>
            {/* Усечённый конус */}
            <mesh castShadow>
                <cylinderGeometry args={[0.9, 1.2, 1.5, 32]} />
                <meshStandardMaterial color="#1a1a2a" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Белые полосы */}
            {[-0.4, 0.4].map((y, i) => (
                <mesh key={i} position={[0, y, 0]}>
                    <cylinderGeometry args={[0.95 + y * 0.1, 0.95 + y * 0.1, 0.08, 32]} />
                    <meshStandardMaterial color="#FFFFFF" />
                </mesh>
            ))}

            {/* Механизм разделения */}
            <mesh position={[0, 0, 0]}>
                <torusGeometry args={[1.0, 0.08, 8, 32]} />
                <meshStandardMaterial color="#FF0000" emissive="#AA0000" emissiveIntensity={0.3} />
            </mesh>
        </group>
    );
}

// ============ 5. SECOND_STAGE (Вторая ступень) ============
export function SecondStageModel({ highlightedSockets = [] }) {
    return (
        <group>
            {/* Основной бак */}
            <mesh castShadow>
                <cylinderGeometry args={[0.9, 0.9, 5, 32]} />
                <meshStandardMaterial color="#F0F0F0" metalness={0.3} roughness={0.5} />
            </mesh>

            {/* Верхняя полусфера */}
            <mesh position={[0, 2.5, 0]} castShadow>
                <sphereGeometry args={[0.9, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#F0F0F0" metalness={0.3} roughness={0.5} />
            </mesh>

            {/* Панельные швы */}
            {[0, 1, 2, 3].map((i) => (
                <mesh key={i} position={[Math.cos((Math.PI / 2) * i) * 0.91, 0, Math.sin((Math.PI / 2) * i) * 0.91]}>
                    <boxGeometry args={[0.02, 5, 0.02]} />
                    <meshStandardMaterial color="#888888" />
                </mesh>
            ))}

            {/* Вакуумное сопло (большое, встроено) */}
            <group position={[0, -3.2, 0]}>
                <mesh castShadow>
                    <coneGeometry args={[0.8, 1.5, 32, 1, true]} />
                    <meshStandardMaterial color="#333344" metalness={0.9} roughness={0.1} side={2} />
                </mesh>
                {/* Рёбра охлаждения */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <mesh key={i} position={[Math.cos((Math.PI / 3) * i) * 0.65, 0, Math.sin((Math.PI / 3) * i) * 0.65]} rotation={[0, -(Math.PI / 3) * i, 0]}>
                        <boxGeometry args={[0.02, 1.3, 0.2]} />
                        <meshStandardMaterial color="#555566" />
                    </mesh>
                ))}
            </group>

            {/* Переходное кольцо снизу */}
            <mesh position={[0, -2.5, 0]}>
                <cylinderGeometry args={[0.95, 0.9, 0.2, 32]} />
                <meshStandardMaterial color="#2a2a3a" metalness={0.7} />
            </mesh>
        </group>
    );
}

// ============ 6. COMMAND_MODULE (Командный модуль) ============
export function CommandModuleModel({ highlightedSockets = [] }) {
    return (
        <group>
            {/* Основной корпус (цилиндр) */}
            <mesh castShadow>
                <cylinderGeometry args={[0.8, 0.85, 1.2, 32]} />
                <meshStandardMaterial color="#E0E0E0" metalness={0.4} roughness={0.5} />
            </mesh>

            {/* Конусный верх */}
            <mesh position={[0, 0.9, 0]} castShadow>
                <coneGeometry args={[0.8, 0.8, 32]} />
                <meshStandardMaterial color="#E0E0E0" metalness={0.4} roughness={0.5} />
            </mesh>

            {/* Иллюминаторы (3 штуки) */}
            {[0, 1, 2].map((i) => {
                const angle = (Math.PI * 2 / 3) * i;
                return (
                    <mesh key={i} position={[Math.cos(angle) * 0.82, 0.2, Math.sin(angle) * 0.82]} rotation={[0, -angle, 0]}>
                        <circleGeometry args={[0.15, 16]} />
                        <meshStandardMaterial color="#003366" emissive="#001144" emissiveIntensity={0.5} />
                    </mesh>
                );
            })}

            {/* Антенна */}
            <mesh position={[0, 1.5, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
                <meshStandardMaterial color="#666666" metalness={0.8} />
            </mesh>

            {/* RCS сопла */}
            {[0, 1, 2, 3].map((i) => {
                const angle = (Math.PI / 2) * i;
                return (
                    <mesh key={i} position={[Math.cos(angle) * 0.9, 0, Math.sin(angle) * 0.9]} rotation={[0, -angle, Math.PI / 2]}>
                        <coneGeometry args={[0.06, 0.15, 8]} />
                        <meshStandardMaterial color="#666666" metalness={0.7} />
                    </mesh>
                );
            })}
        </group>
    );
}

// ============ 7. FAIRING (Обтекатель) ============
export function FairingModel({ highlightedSockets = [] }) {
    return (
        <group>
            {/* Основной конус */}
            <mesh castShadow>
                <coneGeometry args={[0.85, 3, 32]} />
                <meshStandardMaterial color="#FFFFFF" metalness={0.2} roughness={0.6} />
            </mesh>

            {/* Линия разделения */}
            <mesh position={[0, -0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.7, 0.03, 8, 32]} />
                <meshStandardMaterial color="#FF0000" />
            </mesh>

            {/* Носовой колпачок */}
            <mesh position={[0, 1.6, 0]} castShadow>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial color="#CCCCCC" metalness={0.5} />
            </mesh>

            {/* Вертикальная линия разделения */}
            <mesh position={[0, 0, 0.01]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.02, 3, 0.02]} />
                <meshStandardMaterial color="#333333" />
            </mesh>
        </group>
    );
}

// ============ Маппинг моделей по типу детали ============
const RocketPartModels = {
    engine_cluster: EngineClusterModel,
    first_stage: FirstStageModel,
    booster: BoosterModel,
    inter_stage: InterStageModel,
    second_stage: SecondStageModel,
    command_module: CommandModuleModel,
    fairing: FairingModel,
};

export default RocketPartModels;
