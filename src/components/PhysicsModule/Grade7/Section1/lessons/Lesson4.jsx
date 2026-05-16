import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SI_DATA = [
  { id: 1, label: "3 км", unit: "м", factor: 1000, correct: 3000, hint: "1 км = 1000 м. Значит, 3 * 1000 = ..." },
  { id: 2, label: "750 г", unit: "кг", factor: 0.001, correct: 0.75, hint: "1 кг = 1000 г. Чтобы перевести в кг, нужно разделить на 1000." },
  { id: 3, label: "2 мин", unit: "с", factor: 60, correct: 120, hint: "1 мин = 60 с. Значит, 2 * 60 = ..." },
  { id: 4, label: "50 см", unit: "м", factor: 0.01, correct: 0.5, hint: "1 м = 100 см. Нужно разделить на 100." }
];

export default function Lesson4({ onComplete, goToNext }) {
  const [step, setStep] = useState(1); // 1: Теория, 2: Практика
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState({}); // 'correct' или 'error'
  const [isDone, setIsDone] = useState(false);

  const checkConversion = (id, value, correct) => {
    const numValue = parseFloat(value.replace(',', '.'));
    if (numValue === correct) {
      setResults(prev => ({ ...prev, [id]: 'correct' }));
    } else {
      setResults(prev => ({ ...prev, [id]: 'error' }));
    }
  };

  const validateAll = () => {
    const allCorrect = SI_DATA.every(item => parseFloat(userAnswers[item.id]) === item.correct);
    if (allCorrect) {
      setIsDone(true);
      onComplete(50);
    }
  };

  if (step === 1) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: '#38bdf8' }}>Урок 4. Единицы СИ</h1>
        <p>В физике используют Международную систему единиц (СИ), чтобы ученые всего мира понимали друг друга.</p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', margin: '30px 0' }}>
          <div style={siCard}><b>Метр (м)</b><br/>Длина</div>
          <div style={siCard}><b>Килограмм (кг)</b><br/>Масса</div>
          <div style={siCard}><b>Секунда (с)</b><br/>Время</div>
        </div>
        <button onClick={() => setStep(2)} style={mainBtnStyle}>Перейти к конвертеру →</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Интерактивный конвертер СИ</h2>
      <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Переведи величины в основные единицы СИ:</p>

      <div style={{ display: 'grid', gap: '20px', maxWidth: '500px', margin: '0 auto' }}>
        {SI_DATA.map(item => (
          <div key={item.id} style={{ textAlign: 'left', background: '#1e293b', padding: '20px', borderRadius: '15px', border: `1px solid ${results[item.id] === 'correct' ? '#10b981' : results[item.id] === 'error' ? '#ef4444' : '#334155'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{item.label} = </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="..." 
                  style={inputStyle}
                  onChange={(e) => setUserAnswers({ ...userAnswers, [item.id]: e.target.value })}
                  onBlur={(e) => checkConversion(item.id, e.target.value, item.correct)}
                />
                <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{item.unit}</span>
              </div>
            </div>
            {results[item.id] === 'error' && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '10px', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '5px' }}>
                💡 Подсказка: {item.hint}
              </motion.p>
            )}
          </div>
        ))}
      </div>

      {!isDone ? (
        <button onClick={validateAll} style={{ ...mainBtnStyle, width: '100%', marginTop: '30px' }}>ПРОВЕРИТЬ ВСЕ</button>
      ) : (
        <button onClick={goToNext} style={{ ...mainBtnStyle, background: '#10b981', width: '100%', marginTop: '30px' }}>ОТЛИЧНО! К ЦЕНЕ ДЕЛЕНИЯ →</button>
      )}
    </div>
  );
}

const siCard = { padding: '20px', background: '#0f172a', border: '1px solid #38bdf8', borderRadius: '12px', flex: 1 };
const inputStyle = { width: '80px', padding: '10px', background: '#020617', border: '1px solid #334155', color: 'white', borderRadius: '8px', textAlign: 'center' };
const mainBtnStyle = { padding: '15px 40px', background: '#38bdf8', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem', color: '#000' };