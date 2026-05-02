import React, { useMemo, useState } from 'react';
import './PhysicsXRay.css';

/**
 * <PhysicsXRay />
 *
 * Visual diff between the student's mental model and reality. Renders the
 * governing formula as a row of interactive tiles; each tile is a variable;
 * wrong tiles pulse red; the single biggest error "shakes".
 *
 * Props:
 *   formula      : { lhs: "Q", rhs: ["c", "m", "ΔT"], op: "·" }
 *   variables    : [{ symbol, unit, expected, given, tooltip }]
 *   result       : { symbol, unit, expected, given, tooltip }  // answer tile
 *   seesaw       : { left, right, labels?: [string, string] }  // Level 1
 *   loss         : { P_total, P_useful, P_loss, eta }          // Level 3
 *   summary      : string  (one-line verdict — terse, like an exam comment)
 *   success      : boolean (render in green, celebratory)
 */
export default function PhysicsXRay({
    formula,
    variables = [],
    result = null,
    seesaw = null,
    loss = null,
    summary = '',
    success = false,
}) {
    // Find the variable with the largest relative error — we "shake" that one.
    const worstIdx = useMemo(() => {
        let idx = -1;
        let worst = 0;
        const diagnosticItems = result ? [...variables, result] : variables;
        diagnosticItems.forEach((v, i) => {
            if (v.given === null || v.given === undefined) return;
            const rel = v.expected !== 0
                ? Math.abs((v.given - v.expected) / v.expected)
                : Math.abs(v.given - v.expected);
            if (rel > worst) { worst = rel; idx = i; }
        });
        return worst > 0.01 ? idx : -1;
    }, [variables, result]);

    const hasStudentVariables = variables.some(v => v.given !== null && v.given !== undefined);
    const hasStudentResult = result?.given !== null && result?.given !== undefined;

    return (
        <div className={`xray ${success ? 'xray-success' : ''}`}>
            <div className="xray-title">
                <span className="xray-icon">🔬</span>
                <span>Физический Рентген</span>
            </div>

            {/* Formula row: truth */}
            {formula && (
                <div className="xray-formula-row xray-truth">
                    <FormulaLabel symbol={formula.lhs} kind="lhs" />
                    <span className="xray-eq">=</span>
                    <FormulaTerms formula={formula} variables={variables} mode="truth" />
                    {result && (
                        <>
                            <span className="xray-arrow">⇒</span>
                            <VariableTile
                                mode="truth"
                                symbol={result.symbol}
                                unit={result.unit}
                                value={result.expected}
                                tooltip={result.tooltip}
                            />
                        </>
                    )}
                </div>
            )}

            {/* Formula row: student */}
            {formula && (hasStudentVariables || hasStudentResult) && (
                <div className="xray-formula-row xray-student">
                    <FormulaLabel symbol="Ты" kind="lhs-student" />
                    <span className="xray-eq">=</span>
                    {hasStudentVariables ? (
                        <>
                            <FormulaTerms
                                formula={formula}
                                variables={variables}
                                mode="student"
                                worstIdx={worstIdx}
                            />
                            {result && (
                                <>
                                    <span className="xray-arrow">⇒</span>
                                    <VariableTile
                                        mode="student"
                                        symbol={result.symbol}
                                        unit={result.unit}
                                        value={result.given}
                                        expected={result.expected}
                                        wrong={isWrong(result)}
                                        shaking={worstIdx === variables.length}
                                        tooltip={result.tooltip}
                                    />
                                </>
                            )}
                        </>
                    ) : (
                        <VariableTile
                            mode="student"
                            symbol={result.symbol}
                            unit={result.unit}
                            value={result.given}
                            expected={result.expected}
                            wrong={isWrong(result)}
                            shaking={worstIdx === variables.length}
                            tooltip={result.tooltip}
                        />
                    )}
                </div>
            )}

            {/* Heat Seesaw — Level 1 only */}
            {seesaw && <HeatSeesaw {...seesaw} />}

            {/* Loss bar — Level 3 only */}
            {loss && <LossBar {...loss} />}

            {summary && (
                <div className={`xray-summary ${success ? 'success' : ''}`}>
                    {summary}
                </div>
            )}
        </div>
    );
}

function FormulaTerms({ formula, variables, mode, worstIdx = -1 }) {
    return variables.map((v, i) => {
        const wrong = mode === 'student' && isWrong(v);
        return (
            <React.Fragment key={`${mode}-${i}`}>
                <VariableTile
                    mode={mode}
                    symbol={v.symbol}
                    unit={v.unit}
                    value={mode === 'truth' ? v.expected : v.given}
                    expected={v.expected}
                    wrong={wrong}
                    shaking={i === worstIdx}
                    tooltip={v.tooltip}
                />
                {i < variables.length - 1 && (
                    <span className="xray-op">{formula.op || '·'}</span>
                )}
            </React.Fragment>
        );
    });
}

function isWrong(v) {
    return v?.given !== null
        && v?.given !== undefined
        && Math.abs(v.given - v.expected) > (v.tolerance ?? 1e-6);
}

// ──────────────────────────────────────────────────────────────
// VariableTile
// ──────────────────────────────────────────────────────────────

function VariableTile({ mode, symbol, unit, value, expected, wrong, shaking, tooltip }) {
    const [open, setOpen] = useState(false);
    const formatted = formatValue(value);

    return (
        <div
            className={[
                'xray-tile',
                `xray-tile-${mode}`,
                wrong ? 'wrong' : '',
                shaking ? 'shake' : '',
            ].join(' ')}
        >
            <div className="xray-tile-symbol">{symbol}</div>
            <div className="xray-tile-value">{formatted}</div>
            <div className="xray-tile-unit">{unit}</div>

            {tooltip && (
                <button
                    className="xray-tile-info"
                    onClick={() => setOpen(o => !o)}
                    aria-label="Объяснение"
                >?</button>
            )}

            {mode === 'student' && wrong && expected !== undefined && (
                <div className="xray-tile-correction">
                    → {formatValue(expected)}
                </div>
            )}

            {open && tooltip && (
                <div className="xray-tile-tooltip">{tooltip}</div>
            )}
        </div>
    );
}

function FormulaLabel({ symbol, kind }) {
    return <div className={`xray-lhs ${kind}`}>{symbol}</div>;
}

function formatValue(v) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    const abs = Math.abs(v);
    if (abs >= 1000) return v.toFixed(0);
    if (abs >= 10) return v.toFixed(1);
    if (abs >= 1) return v.toFixed(2);
    if (abs >= 0.01) return v.toFixed(3);
    return v.toExponential(2);
}

// ──────────────────────────────────────────────────────────────
// HeatSeesaw — literal balance-scale visualization for Level 1.
// Left pan: heat released (|ΣCdT| for coolers).
// Right pan: heat absorbed (ΣCdT for heaters).
// ──────────────────────────────────────────────────────────────

function HeatSeesaw({ left, right, labels }) {
    const total = Math.max(Math.abs(left), Math.abs(right), 1);
    const bias = (right - left) / total; // -1..+1
    const angle = Math.max(-18, Math.min(18, bias * 18)); // clamp tilt

    const leftLabel = labels?.[0] ?? 'Отдано';
    const rightLabel = labels?.[1] ?? 'Получено';

    return (
        <div className="xray-seesaw">
            <div className="xray-seesaw-title">Весы Тепла</div>
            <div className="xray-seesaw-stage">
                <div className="xray-seesaw-pivot" />
                <div
                    className="xray-seesaw-beam"
                    style={{ transform: `rotate(${angle}deg)` }}
                >
                    <div className="xray-pan left">
                        <div className="xray-pan-weight"
                            style={{ height: `${Math.min(120, Math.abs(left) / total * 120)}px` }}
                        />
                        <div className="xray-pan-label">
                            {leftLabel}<br />
                            <strong>{formatEnergy(left)}</strong>
                        </div>
                    </div>
                    <div className="xray-pan right">
                        <div className="xray-pan-weight"
                            style={{ height: `${Math.min(120, Math.abs(right) / total * 120)}px` }}
                        />
                        <div className="xray-pan-label">
                            {rightLabel}<br />
                            <strong>{formatEnergy(right)}</strong>
                        </div>
                    </div>
                </div>
            </div>
            <div className="xray-seesaw-hint">
                {Math.abs(bias) < 0.03
                    ? '⚖️ Весы уравновешены — энергия сохранена.'
                    : bias > 0
                        ? '← Левая чаша слишком лёгкая: ты недооценил отдачу тепла.'
                        : '→ Правая чаша слишком лёгкая: ты недооценил поглощение.'}
            </div>
        </div>
    );
}

function formatEnergy(joules) {
    const a = Math.abs(joules);
    if (a >= 1_000_000) return `${(joules / 1_000_000).toFixed(2)} МДж`;
    if (a >= 1000) return `${(joules / 1000).toFixed(2)} кДж`;
    return `${joules.toFixed(0)} Дж`;
}

// ──────────────────────────────────────────────────────────────
// LossBar — Level 3 efficiency visualization.
// ──────────────────────────────────────────────────────────────

function LossBar({ P_total, P_useful, P_loss, eta }) {
    const usefulPct = Math.max(0, Math.min(100, (P_useful / P_total) * 100));
    const lossPct = 100 - usefulPct;
    return (
        <div className="xray-lossbar">
            <div className="xray-lossbar-title">КПД нагревателя η</div>
            <div className="xray-lossbar-track">
                <div
                    className="xray-lossbar-useful"
                    style={{ width: `${usefulPct}%` }}
                >
                    <span>Полезно: {(P_useful / 1000).toFixed(1)} кВт</span>
                </div>
                <div
                    className="xray-lossbar-loss"
                    style={{ width: `${lossPct}%` }}
                >
                    <span>Потери: {(P_loss / 1000).toFixed(1)} кВт</span>
                </div>
            </div>
            <div className="xray-lossbar-eta">
                η = {(eta * 100).toFixed(1)}%&nbsp;·&nbsp;
                доля потерь = {(lossPct).toFixed(1)}%
            </div>
        </div>
    );
}
