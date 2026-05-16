import React from 'react';
import AetherLabScene from './scene/AetherLabScene';
import AetherLabHud from './ui/AetherLabHud';
import './AetherLab.css';

export default function AetherLabModule({ onClose }) {
  return (
    <div className="aether-lab-shell">
      <AetherLabScene />
      <AetherLabHud onClose={onClose} />
    </div>
  );
}
