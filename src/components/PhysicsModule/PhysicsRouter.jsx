import React, { useState } from 'react';
import SectionManager from './Grade7/Section1/SectionManager';

export default function PhysicsRouter() {
  const [grade, setGrade] = useState(null);
  const [section, setSection] = useState(null);

  if (grade === 7 && section === 1) {
    return <SectionManager onBack={() => setSection(null)} />;
  }

  return (
    <div style={{ padding: '40px', color: 'white', background: '#050a15', minHeight: '90vh' }}>
      <h1>🎓 NovaLab: Академия Физики</h1>
      {!grade ? (
        <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
          <div onClick={() => setGrade(7)} style={{ padding: '40px', background: '#1e293b', borderRadius: '20px', cursor: 'pointer', border: '2px solid #38bdf8' }}>
            <h2>7 КЛАСС</h2>
            <p>Введение, Движение, Давление</p>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '30px' }}>
           <button onClick={() => setGrade(null)} style={{ color: '#38bdf8', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px' }}>← К выбору класса</button>
           <h2>7 КЛАСС: РАЗДЕЛ 1</h2>
           <div 
             onClick={() => setSection(1)}
             style={{ padding: '20px', background: '#38bdf8', color: '#000', borderRadius: '10px', display: 'inline-block', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px' }}
           >
             Введение в физику (9 уроков)
           </div>
        </div>
      )}
    </div>
  );
}