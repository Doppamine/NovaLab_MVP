import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function Lesson8({ onComplete, goToNext }) {
  const [step, setStep] = useState(1); // 1: Теория, 2: Лаба
  const [v1, setV1] = useState('');
  const [v2, setV2] = useState('');
  const [result, setResult] = useState('');
  const [objectInWater, setObjectInWater] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isDone, setIsDone] = useState(false);

  // Константы опыта
  const initialVolume = 50; 
  const objectVolume = 18; // Объем нашего болта
  const finalVolume = initialVolume + objectVolume;

  const checkResult = () => {
    const userV1 = parseFloat(v1);
    const userV2 = parseFloat(v2);
    const userRes = parseFloat(result);

    if (userV1 !== initialVolume) {
      setFeedback({ type: 'error', text: `Ошибка в V1. Посмотри на мензурку до погружения: вода на отметке ${initialVolume}.` });
      return;
    }
    if (userV2 !== finalVolume) {
      setFeedback({ type: 'error', text: `Ошибка в V2. После погружения уровень поднялся до ${finalVolume}.` });
      return;
    }
    if (userRes !== (userV2 - userV1)) {
      setFeedback({ type: 'error', text: `Математическая ошибка! V = V2 - V1. Вычти из ${userV2} число ${userV1}.` });
      return;
    }

    setFeedback({ type: 'success', text: "Верно! Ты вычислил объём тела методом вытеснения жидкости. +50 XP" });
    setIsDone(true);
    onComplete(50);
  };

  if (step === 1) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: '#38bdf8' }}>Урок 8. Измерение объёма</h1>
        <div style={{ background: '#1e293b', padding: '30px', borderRadius: '20px', textAlign: 'left', margin: '30px 0' }}>
          <p>Как измерить объём камня или детали неправильной формы? С помощью воды!</p>
          <h2 style={{ color: '#fbbf24', textAlign: 'center' }}>V<sub>тела</sub> = V<sub>2</sub> - V<sub>1</sub></h2>
          <p style={{ marginTop: '20px', opacity: 0.8 }}>Где V1 — начальный объём воды, а V2 — объём воды вместе с погруженным телом.</p>
        </div>
        <button onClick={() => setStep(2)} style={mainBtnStyle}>ПЕРЕЙТИ К МЕНЗУРКЕ →</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '30px' }}>
        
        {/* ВИЗУАЛЬНАЯ МЕНЗУРКА */}
        <div style={{ position: 'relative', width: '120px', height: '300px', background: 'rgba(255,255,255,0.1)', border: '4px solid #fff', borderTop: 'none', borderRadius: '0 0 20px 20px', overflow: 'hidden' }}>
          {/* Вода */}
          <motion.div 
            animate={{ height: objectInWater ? `${(finalVolume/100) * 100}%` : `${(initialVolume/100) * 100}%` }}
            style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(56, 189, 248, 0.6)', borderTop: '2px solid #fff' }}
          />
          
          {/* Шкала */}
          { [0, 20, 40, 60, 80, 100].map(val => (
            <div key={val} style={{ position: 'absolute', bottom: `${val}%`, right: 0, width: '30px', height: '2px', background: '#fff' }}>
              <span style={{ position: 'absolute', right: '35px', top: '-10px', fontSize: '0.7rem' }}>{val}</span>
            </div>
          ))}

          {/* Объект внутри воды */}
          {objectInWater && (
            <motion.div initial={{ y: -100 }} animate={{ y: 220 }} style={{ position: 'absolute', left: '35px', fontSize: '2.5rem' }}>⚙️</motion.div>
          )}
        </div>

        {/* ПАНЕЛЬ ДЕЙСТВИЙ */}
        <div style={{ textAlign: 'left', width: '300px' }}>
          <h3>Лабораторный стол:</h3>
          {!objectInWater ? (
            <div 
                onClick={() => setObjectInWater(true)}
                style={{ padding: '20px', background: '#1e293b', border: '2px dashed #38bdf8', borderRadius: '15px', cursor: 'pointer', textAlign: 'center' }}
            >
                <div style={{ fontSize: '3rem' }}>⚙️</div>
                <p>Бросить деталь в воду</p>
            </div>
          ) : (
            <div style={{ color: '#4ade80', fontWeight: 'bold' }}>✅ Деталь погружена!</div>
          )}
          
          <div style={{ marginTop: '20px', display: 'grid', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8rem' }}>V1 (Начальный), мл:</label>
              <input type="number" value={v1} onChange={e => setV1(e.target.value)} style={inputStyle} placeholder="?" />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem' }}>V2 (С телом), мл:</label>
              <input type="number" value={v2} onChange={e => setV2(e.target.value)} style={inputStyle} placeholder="?" disabled={!objectInWater} />
            </div>
            <div style={{ borderTop: '1px solid #333', paddingTop: '10px', marginTop: '10px' }}>
              <label style={{ fontSize: '0.8rem', color: '#fbbf24' }}>V тела (Итог):</label>
              <input type="number" value={result} onChange={e => setResult(e.target.value)} style={{ ...inputStyle, borderColor: '#fbbf24' }} placeholder="V2 - V1" />
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div style={{ padding: '15px', borderRadius: '10px', background: feedback.type === 'success' ? '#065f46' : '#991b1b', marginBottom: '20px' }}>
          {feedback.text}
        </div>
      )}

      {!isDone ? (
        <button onClick={checkResult} style={{ ...mainBtnStyle, width: '100%' }}>ПРОВЕРИТЬ РАСЧЕТЫ</button>
      ) : (
        <button onClick={goToNext} style={{ ...mainBtnStyle, background: '#10b981', width: '100%' }}>К ЛАБОРАТОРНОЙ №2 →</button>
      )}
    </div>
  );
}

const inputStyle = { width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '8px', marginTop: '5px', boxSizing: 'border-box' };
const mainBtnStyle = { padding: '15px 40px', background: '#38bdf8', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem', color: '#000' };