import React from 'react';

export default function ForceGraph({ impactForce, crumpleZone, speed, isSafe, forceLimit }) {
  // duration = distance / speed
  const duration = crumpleZone / speed; 
  
  // SVG dimensions
  const width = 300;
  const height = 180;
  
  // We want to scale the graph so that ForceLimit is always at a specific height.
  // We'll scale the Y-axis to accommodate the peak force + 20% padding, or at least 1.5x the limit.
  const maxDisplayForce = Math.max(forceLimit * 1.5, impactForce * 1.2);
  
  const scaleY = (force) => height - (force / maxDisplayForce) * height;
  
  // X axis scales based on a "max reasonable duration" to show width differences
  // Soft foam: d=1.0, v=5 -> t=0.2s
  // Rigid: d=0.1, v=40 -> t=0.0025s
  const maxDisplayTime = 0.25; 
  
  // Calculate points
  const peakY = scaleY(impactForce);
  const limitY = scaleY(forceLimit);
  
  // Triangle impulse centered in the graph
  const startX = width * 0.05; 
  // ensure it has at least a small width for visibility
  const durationWidth = Math.max(2, (duration / maxDisplayTime) * (width * 0.9));
  const endX = startX + durationWidth;
  const peakX = startX + (durationWidth / 2);
  
  const basePath = `M ${startX},${height} L ${peakX},${peakY} L ${endX},${height}`;
  
  // Color logic
  const strokeColor = isSafe ? '#10b981' : '#ef4444';
  const fillGradient = isSafe ? 'url(#safeGradient)' : 'url(#dangerGradient)';

  return (
    <div className="crash-force-graph">
      <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#ccc' }}>
        Force vs. Time
      </div>
      <div style={{ position: 'relative', width: '100%', height: `${height}px`, background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="safeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="dangerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Limit Line */}
          <line x1="0" y1={limitY} x2={width} y2={limitY} stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" opacity="0.6" />
          <text x="5" y={limitY - 5} fill="#ef4444" fontSize="10" opacity="0.8">LIMIT: {forceLimit.toLocaleString()} N</text>
          
          {/* Impulse Graph */}
          <path d={`${basePath} Z`} fill={fillGradient} />
          <path d={basePath} fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#888', marginTop: '4px' }}>
        <span>0s</span>
        <span>Collision Duration: {(duration * 1000).toFixed(1)} ms</span>
        <span>{(maxDisplayTime * 1000).toFixed(0)}ms</span>
      </div>
    </div>
  );
}
