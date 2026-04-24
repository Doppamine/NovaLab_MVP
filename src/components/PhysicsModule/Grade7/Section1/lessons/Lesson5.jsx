import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function Lesson5({ onComplete, goToNext }) {
  const [step, setStep] = useState(1); // 1: Теория, 2: Практика (Линейка), 3: Практика (Мензурка)
  const [val1, setVal1] = useState('');
  const [val2, setVal2] = useState('');
  const [divisions, setDivisions] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isDone, setIsDone] = useState(false);

  const checkCalculation = (correctC) => {
    const a = parseFloat(val1);
    const b = parseFloat(val2);
    const n = parseInt(divisions);

    if (isNaN(a) || isNaN(b) || isNaN(n)) {
      setFeedback({ type: 'error', text: "Заполни все поля числами!" });
      return;
    }
    if (n <= 0) {
      setFeedback({ type: 'error', text: "Количество делений должно быть больше нуля. На ноль делить нельзя!" });
      return;
    }
    if (a >= b) {
      setFeedback({ type: 'error', text: "Второе значение должно быть больше первого (B > A)." });
      return;
    }

    const userC = (b - a) / n;

    if (Math.abs(userC - correctC) < 0.01) {
      setFeedback({ type: 'success', text: `Верно! Цена деления (C) = ${userC}. +25 XP` });
      setTimeout(() => {
        if (step === 2) {
          setStep(3);
          setVal1(''); setVal2(''); setDivisions(''); setFeedback(null);
        } else {
          setIsDone(true);
          onComplete(50);
        }
      }, 2000);
    } else {
      setFeedback({ 
        type: 'error', 
        text: `Ошибка. Твой результат: ${userC.toFixed(2)}. Используй формулу: (Значение 2 - Значение 1) / Кол-во делений.` 
      });
    }
  };

  if (step === 1) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: '#38bdf8' }}>Урок 5. Шкала и цена деления</h1>
        <div style={{ background: '#1e293b', padding: '30px', borderRadius: '20px', margin: '30px 0', textAlign: 'left' }}>
          <p>Чтобы считать показания прибора, нужно знать <b>цену деления</b> — это значение самого маленького промежутка на шкале.</p>
          <div style={{ background: '#0f172a', padding: '15px', borderRadius: '10px', border: '1px solid #fbbf24', color: '#fbbf24', fontFamily: 'monospace', textAlign: 'center', fontSize: '1.2rem' }}>
            C = (B - A) / n
          </div>
          <ul style={{ marginTop: '15px', fontSize: '0.9rem', color: '#94a3b8' }}>
            <li><b>A, B</b> — два ближайших числа на шкале</li>
            <li><b>n</b> — количество промежутков (штрихов) между ними</li>
          </ul>
        </div>
        <button onClick={() => setStep(2)} style={mainBtnStyle}>Попробовать на линейке →</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Практика: {step === 2 ? 'Виртуальная линейка' : 'Шкала мензурки'}</h2>
      
      {/* ВИЗУАЛЬНЫЙ ПРИБОР */}
      <div style={{ height: '150px', background: '#f3f4f6', margin: '30px 0', borderRadius: '10px', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '0 20px', border: '4px solid #333' }}>
        {step === 2 ? (
            /* Рендер линейки */
            <>
              {[0, 1, 2, 3, 4, 5].map(x => (
                <div key={x} style={{ position: 'absolute', left: `${x * 20}%`, bottom: 0, width: '2px', height: '60px', background: '#000' }}>
                  <span style={{ position: 'absolute', top: '-25px', left: '-5px', color: '#000', fontWeight: 'bold' }}>{x * 10}</span>
                  {/* Маленькие деления */}
                  {x < 5 && [1,2,3,4,5].map(i => (
                    <div key={i} style={{ position: 'absolute', left: `${i * 3.3}%`, bottom: 0, width: '1px', height: '30px', background: '#555' }} />
                  ))}
                </div>
              ))}
              <div style={{ position: 'absolute', top: '50px', left: '20%', width: '20%', height: '5px', background: 'rgba(56, 189, 248, 0.5)', borderRadius: '5px' }}>
                <span style={{ position: 'absolute', top: '-20px', left: '40%', color: '#0284c7', fontWeight: 'bold' }}>n = 5</span>
              </div>
            </>
        ) : (
            /* Рендер мензурки */
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column-reverse' }}>
                {[100, 200, 300].map(v => (
                    <div key={v} style={{ height: '50px', borderTop: '2px solid #000', position: 'relative' }}>
                        <span style={{ position: 'absolute', right: '10px', top: '-10px', color: '#000' }}>{v} мл</span>
                        <div style={{ position: 'absolute', top: '25px', right: '10px', width: '20px', height: '1px', background: '#888' }} />
                    </div>
                ))}
            </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: '#1e293b', padding: '20px', borderRadius: '15px' }}>
        <div>
          <label style={{ fontSize: '0.8rem' }}>Значение A</label>
          <input type="number" value={val1} onChange={e => setVal1(e.target.value)} style={inputStyle} placeholder="Напр: 10" />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem' }}>Значение B</label>
          <input type="number" value={val2} onChange={e => setVal2(e.target.value)} style={inputStyle} placeholder="Напр: 20" />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem' }}>Кол-во делений (n)</label>
          <input type="number" value={divisions} onChange={e => setDivisions(e.target.value)} style={inputStyle} placeholder="Напр: 5" />
        </div>
      </div>

      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '20px', padding: '15px', borderRadius: '10px', background: feedback.type === 'success' ? '#065f46' : '#991b1b' }}>
          {feedback.text}
        </motion.div>
      )}

      {!isDone ? (
        <button onClick={() => checkCalculation(step === 2 ? 2 : 50)} style={{ ...mainBtnStyle, width: '100%', marginTop: '20px' }}>ВЫЧИСЛИТЬ ЦЕНУ ДЕЛЕНИЯ</button>
      ) : (
        <button onClick={goToNext} style={{ ...mainBtnStyle, background: '#10b981', width: '100%', marginTop: '20px' }}>ОТЛИЧНО! К ЛАБОРАТОРНОЙ №1 →</button>
      )}
    </div>
  );
}

const inputStyle = { width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '8px', marginTop: '5px', boxSizing: 'border-box' };
const mainBtnStyle = { padding: '15px 40px', background: '#38bdf8', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem', color: '#000' };