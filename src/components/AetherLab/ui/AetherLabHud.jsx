import React, { startTransition, useMemo } from 'react';
import { AETHER_LEVELS } from '../systems/LevelManager';
import { TOOL_LIBRARY } from '../systems/ToolSystem';
import { getDamageProfile } from '../systems/DamageSystem';
import { useAetherLabStore } from '../store/useAetherLabStore';
import { aetherXRStore } from '../scene/aetherXRStore';

function EntityInspector({ level, analysis, selectedEntity, measurement }) {
  const selectedTarget = useMemo(() => {
    if (!selectedEntity) {
      return null;
    }

    return selectedEntity.type === 'wire'
      ? level.wires.find((wire) => wire.id === selectedEntity.id)
      : level.nodes.find((node) => node.id === selectedEntity.id);
  }, [level.nodes, level.wires, selectedEntity]);

  if (!selectedTarget) {
    return (
      <div className="aether-panel-card">
        <h3>Inspector</h3>
        <p>Select a wire or node to inspect its state, fault profile, and measured values.</p>
      </div>
    );
  }

  const damageProfile = selectedEntity.type === 'wire' ? getDamageProfile(selectedTarget, { xrayEnabled: level.xrayEnabled }) : null;

  return (
    <div className="aether-panel-card">
      <h3>Inspector</h3>
      <p className="aether-muted">{selectedEntity.type === 'wire' ? 'Wire entity' : 'Node entity'}</p>
      <div className="aether-kv">
        <span>Name</span>
        <strong>{selectedTarget.label}</strong>
      </div>
      {'material' in selectedTarget && (
        <div className="aether-kv">
          <span>Material</span>
          <strong>{selectedTarget.material}</strong>
        </div>
      )}
      {'integrity' in selectedTarget && (
        <div className="aether-kv">
          <span>Integrity</span>
          <strong>{selectedTarget.integrity}%</strong>
        </div>
      )}
      {damageProfile && (
        <>
          <div className="aether-kv">
            <span>External damage</span>
            <strong>{damageProfile.external.length ? damageProfile.external.map((item) => item.label).join(', ') : 'none'}</strong>
          </div>
          <div className="aether-kv">
            <span>Internal damage</span>
            <strong>
              {damageProfile.hiddenInternal.length
                ? 'hidden until X-Ray'
                : damageProfile.internal.length
                  ? damageProfile.internal.map((item) => item.label).join(', ')
                  : 'none'}
            </strong>
          </div>
        </>
      )}
      {measurement && (
        <div className="aether-measurement">
          <h4>Latest measurement</h4>
          {measurement.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}
      {selectedEntity.type === 'node' && analysis.gateStates[selectedTarget.id] && (
        <div className="aether-kv">
          <span>Gate state</span>
          <strong>{analysis.gateStates[selectedTarget.id].open ? 'open' : 'closed'}</strong>
        </div>
      )}
    </div>
  );
}

function PostLevelOverlay({ report, onNextLevel, onReset }) {
  if (!report) {
    return null;
  }

  return (
    <div className="aether-postlevel">
      <div className="aether-postlevel-card">
        <span className="aether-badge success">Circuit Restored</span>
        <h2>{report.title}</h2>
        <p>{report.summary}</p>

        <div className="aether-post-grid">
          <div>
            <h3>Mistakes</h3>
            {report.mistakes.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
          <div>
            <h3>Correct Logic</h3>
            {report.correctLogic.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
          <div>
            <h3>Physics Explanation</h3>
            {report.physicsExplanation.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>

        <div className="aether-post-actions">
          <button className="aether-action-btn secondary" onClick={onReset}>Replay Level</button>
          <button className="aether-action-btn" onClick={onNextLevel}>Next Mission</button>
        </div>
      </div>
    </div>
  );
}

export default function AetherLabHud({ onClose }) {
  const activeToolId = useAetherLabStore((state) => state.activeToolId);
  const level = useAetherLabStore((state) => state.level);
  const analysis = useAetherLabStore((state) => state.analysis);
  const selectedEntity = useAetherLabStore((state) => state.selectedEntity);
  const measurement = useAetherLabStore((state) => state.measurement);
  const feedback = useAetherLabStore((state) => state.feedback);
  const actionLog = useAetherLabStore((state) => state.actionLog);
  const postLevelAnalysis = useAetherLabStore((state) => state.postLevelAnalysis);
  const levelComplete = useAetherLabStore((state) => state.levelComplete);
  const selectTool = useAetherLabStore((state) => state.selectTool);
  const loadLevel = useAetherLabStore((state) => state.loadLevel);
  const toggleXRay = useAetherLabStore((state) => state.toggleXRay);
  const runCircuitTest = useAetherLabStore((state) => state.runCircuitTest);
  const resetLevel = useAetherLabStore((state) => state.resetLevel);
  const nextLevel = useAetherLabStore((state) => state.nextLevel);
  const dismissFeedback = useAetherLabStore((state) => state.dismissFeedback);

  const pathSummary = analysis.bestPath?.path?.wireIds?.length
    ? analysis.bestPath.path.wireIds.join(' -> ')
    : 'No closed path to target yet';

  return (
    <>
      <div className="aether-topbar">
        <div>
          <span className="aether-eyebrow">NoLab WebXR Training Module</span>
          <h1>{level.name}</h1>
          <p>{level.subtitle}</p>
        </div>
        <div className="aether-topbar-actions">
          <button
            className="aether-action-btn secondary"
            onClick={() => {
              if (typeof aetherXRStore.enterVR === 'function') {
                aetherXRStore.enterVR();
              }
            }}
          >
            Enter VR
          </button>
          <button className="aether-action-btn danger" onClick={onClose}>Exit Mission</button>
        </div>
      </div>

      <div className="aether-side aether-left">
        <div className="aether-panel-card">
          <h3>Mission Flow</h3>
          <p>{level.objectiveText}</p>
          <div className="aether-status-row">
            <span className={`aether-badge ${analysis.success ? 'success' : 'warning'}`}>
              {analysis.success ? 'Closed Circuit' : 'Open Circuit'}
            </span>
            <span className="aether-badge neutral">
              {analysis.voltageAtTarget.toFixed(2)} V / {analysis.currentAtTarget.toFixed(2)} A
            </span>
          </div>
        </div>

        <div className="aether-panel-card">
          <h3>Levels</h3>
          <div className="aether-level-list">
            {AETHER_LEVELS.map((entry) => (
              <button
                key={entry.id}
                className={`aether-level-btn ${entry.id === level.id ? 'active' : ''}`}
                onClick={() => {
                  startTransition(() => loadLevel(entry.id));
                }}
              >
                <strong>{entry.name}</strong>
                <span>{entry.subtitle}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="aether-panel-card">
          <h3>Tool Rack</h3>
          <div className="aether-tool-grid">
            {level.tools.map((toolId) => {
              const tool = TOOL_LIBRARY[toolId];
              const isActive = tool.id === activeToolId;

              return (
                <button
                  key={tool.id}
                  className={`aether-tool-btn ${isActive ? 'active' : ''}`}
                  onClick={() => selectTool(tool.id)}
                >
                  <strong>{tool.label}</strong>
                  <span>{tool.hand.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
          <p className="aether-muted">{TOOL_LIBRARY[activeToolId]?.description}</p>
        </div>
      </div>

      <div className="aether-side aether-right">
        <EntityInspector level={level} analysis={analysis} selectedEntity={selectedEntity} measurement={measurement} />

        <div className="aether-panel-card">
          <h3>Live Analysis</h3>
          <div className="aether-kv">
            <span>Best path</span>
            <strong>{pathSummary}</strong>
          </div>
          <div className="aether-kv">
            <span>Reachable nodes</span>
            <strong>{analysis.reachableNodeIds.length}</strong>
          </div>
          <div className="aether-kv">
            <span>Overloaded wires</span>
            <strong>{analysis.overloadedWireIds.length}</strong>
          </div>
          <div className="aether-learning">
            {analysis.learningFeedback.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>

        <div className="aether-panel-card">
          <h3>Action Log</h3>
          {actionLog.length ? (
            actionLog.map((item) => <p key={item}>{item}</p>)
          ) : (
            <p>No actions yet. Start with diagnostics.</p>
          )}
        </div>
      </div>

      <div className="aether-bottom">
        <div className="aether-feedback-list">
          {feedback.map((item) => (
            <button key={item.id} className={`aether-feedback ${item.tone}`} onClick={() => dismissFeedback(item.id)}>
              {item.message}
            </button>
          ))}
        </div>

        <div className="aether-bottom-actions">
          <button className={`aether-action-btn ${level.xrayEnabled ? 'active' : 'secondary'}`} onClick={() => toggleXRay()}>
            {level.xrayEnabled ? 'Disable X-Ray' : 'Enable X-Ray'}
          </button>
          <button className="aether-action-btn secondary" onClick={resetLevel}>Reset Level</button>
          <button className="aether-action-btn secondary" onClick={nextLevel} disabled={!levelComplete}>Skip to Next</button>
          <button className="aether-action-btn primary" onClick={runCircuitTest}>Test Current Flow</button>
        </div>
      </div>

      <PostLevelOverlay
        report={postLevelAnalysis}
        onNextLevel={() => startTransition(() => nextLevel())}
        onReset={resetLevel}
      />
    </>
  );
}
