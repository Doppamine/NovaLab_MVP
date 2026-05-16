import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function Lesson7({ onComplete, goToNext }) {
  const [step, setStep] = useState(1); // 1: Теория, 2: Практика
  const [val, setVal] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isDone, setIsDone] = useState(false);

  const checkResult = () => {
    const userV = parseFloat(val.replace(',', '.'));
    const userE = parseFloat(error.replace(',', '.'));

    // Вспоминаем данные из Урока 6: Длина была 12.5 см, цена деления 0.1 см.
    // Погрешность обычно равна половине цены деления: 0.1 / 2 = 0.05
    if (userV === 12.5 && (userE === 0.1 || userE === 0.05)) {
      setFeedback({ 
        type: 'success', 
        text: `Идеально! Запись ${userV} ± ${userE} означает, что реальная длина находится в диапазоне от ${userV - userE} до ${userV + userE} см. +40 XP` 
      });
      setIsDone(true);
      onComplete(40);
    } else if (userV !== 12.5) {
      setFeedback({ type: 'error', text: "Значение величины (a) должно быть 12.5 (результат из прошлой лабораторной)." });
    } else {
      setFeedback({ type: 'error', text: "Погрешность (Δa) обычно равна цене деления или её половине. Попробуй 0.1 или 0.05." });
    }
  };

  if (step === 1) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: '#38bdf8' }}>Урок 7. Погрешность измерений</h1>
        <div style={{ background: '#1e293b', padding: '30px', borderRadius: '20px', textAlign: 'left', margin: '30px 0' }}>
          <p>Даже самый точный прибор имеет предел. В физике результат измерения всегда записывают с учётом <b>погрешности</b> (ошибки).</p>
          <div style={{ background: '#000', padding: '20px', borderRadius: '10px', color: '#fbbf24', textAlign: 'center', fontSize: '1.8rem', fontFamily: 'monospace', border: '1px solid #334155' }}>
            A = a ± Δa
          </div>
          <ul style={{ marginTop: '20px', opacity: 0.8, lineHeight: '1.6' }}>
            <li><b>a</b> — то, что показал прибор (например, 12.5 см)</li>
            <li><b>Δa</b> — погрешность (обычно цена деления прибора)</li>
            <li><b>±</b> — знак, означающий "чуть больше или чуть меньше"</li>
          </ul>
        </div>
        <button onClick={() => setStep(2)} style={mainBtnStyle}>ЗАПИСАТЬ РЕЗУЛЬТАТ →</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Практика: Оформление результата</h2>
      <p>Вспомни результат измерения карандаша (<b>12.5 см</b>) и цену деления линейки (<b>0.1 см</b>).</p>
      
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        gap: '15px', margin: '40px 0', background: '#0f172a', padding: '40px', borderRadius: '20px' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#38bdf8', marginBottom: '5px' }}>Величина (a)</label>
          <input type="text" value={val} onChange={e => setVal(e.target.value)} style={inputStyle} placeholder="12.5" />
        </div>
        
        <div style={{ fontSize: '2.5rem', marginTop: '20px', color: '#64748b' }}>±</div>
        
        <div style={{ textAlign: 'center' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#f87171', marginBottom: '5px' }}>Погрешность (Δa)</label>
          <input type="text" value={error} onChange={e => setError(e.target.value)} style={inputStyle} placeholder="0.1" />
        </div>
        
        <div style={{ fontSize: '1.5rem', marginTop: '20px', fontWeight: 'bold' }}>см</div>
      </div>

      <div style={{ 
        background: '#000', padding: '15px', borderRadius: '10px', 
        marginBottom: '20px', fontSize: '1.5rem', fontFamily: 'monospace', color: '#4ade80', minHeight: '60px' 
      }}>
        {val && error ? `${val} ± ${error} см` : "Ожидание ввода..."}
      </div>

      {feedback && (
        <div style={{ padding: '15px', borderRadius: '10px', background: feedback.type === 'success' ? '#065f46' : '#991b1b', marginBottom: '20px' }}>
          {feedback.text}
        </div>
      )}

      {!isDone ? (
        <button onClick={checkResult} style={{ ...mainBtnStyle, width: '100%' }}>ПРОВЕРИТЬ ЗАПИСЬ</button>
      ) : (
        <button onClick={goToNext} style={{ ...mainBtnStyle, background: '#10b981', width: '100%' }}>ОТЛИЧНО! К ОБЪЁМУ ТЕЛА →</button>
      )}
    </div>
  );
}

const inputStyle = { 
  width: '100px', padding: '15px', background: '#020617', border: '2px solid #334155', 
  color: 'white', borderRadius: '10px', textAlign: 'center', fontSize: '1.4rem' 
};

const mainBtnStyle = { 
  padding: '15px 40px', background: '#38bdf8', border: 'none', borderRadius: '10px', 
  fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem', color: '#000' 
};