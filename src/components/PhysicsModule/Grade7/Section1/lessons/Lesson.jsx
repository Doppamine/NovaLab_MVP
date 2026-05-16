import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function Lesson6({ onComplete, goToNext }) {
  const [step, setStep] = useState(1); // 1: Инструктаж, 2: Лабораторная
  const [pencilX, setPencilX] = useState(100); // Позиция карандаша
  const [userValue, setUserValue] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isDone, setIsDone] = useState(false);

  // Параметры шкалы (в пикселях)
  const pxPerCm = 40; // 1 см = 40 пикселей
  const rulerZeroX = 50; // Координата нуля на экране
  const pencilLengthCm = 12.5; // Реальная длина карандаша

  const checkMeasurement = () => {
    // 1. Проверка выравнивания (начало карандаша должно быть на нуле)
    const currentStartCm = (pencilX - rulerZeroX) / pxPerCm;
    const isAligned = Math.abs(currentStartCm) < 0.2; // Допуск 2мм

    if (!isAligned) {
      setFeedback({ type: 'error', text: "Ошибка выравнивания! Совмести левый край карандаша с отметкой '0' на линейке." });
      return;
    }

    // 2. Проверка считанного значения
    const val = parseFloat(userValue.replace(',', '.'));
    if (isNaN(val)) {
      setFeedback({ type: 'error', text: "Введи числовое значение длины." });
      return;
    }

    const diff = Math.abs(val - pencilLengthCm);
    if (diff <= 0.1) { // Допуск 1мм (погрешность прибора)
      setFeedback({ type: 'success', text: `Верно! Длина карандаша l = ${val} см. Точность соблюдена. +50 XP` });
      setIsDone(true);
      onComplete(50);
    } else {
      setFeedback({ type: 'error', text: `Неточно. Посмотри внимательнее: конец карандаша находится на отметке ${pencilLengthCm}. Твой ответ: ${val}` });
    }
  };

  if (step === 1) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: '#38bdf8' }}>Лабораторная работа №1</h1>
        <h2>Тема: Измерение длины предмета</h2>
        <div style={{ background: '#1e293b', padding: '25px', borderRadius: '20px', margin: '30px 0', textAlign: 'left' }}>
          <h4 style={{ color: '#fbbf24', marginTop: 0 }}>📜 Порядок действий:</h4>
          <ol style={{ lineHeight: '1.6' }}>
            <li>Совмести левый конец предмета с <b>нулевым делением</b> шкалы.</li>
            <li>Определи, против какого деления находится правый конец предмета.</li>
            <li>Учитывай цену деления (здесь она 0.1 см = 1 мм).</li>
          </ol>
        </div>
        <button onClick={() => setStep(2)} style={mainBtnStyle}>ПРИСТУПИТЬ К ИЗМЕРЕНИЯМ</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h3>Перетащи карандаш к линейке:</h3>
      
      {/* СИМУЛЯЦИЯ ЛИНЕЙКИ И ПРЕДМЕТА */}
      <div style={{ height: '250px', background: '#0f172a', borderRadius: '20px', position: 'relative', overflow: 'hidden', border: '1px solid #334155', margin: '20px 0' }}>
        
        {/* ЛИНЕЙКА */}
        <div style={{ position: 'absolute', top: '150px', left: `${rulerZeroX}px`, height: '80px', width: '700px', background: '#facc15', border: '2px solid #a16207', display: 'flex', alignItems: 'flex-start' }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', left: `${i * pxPerCm}px`, height: '40px', width: '2px', background: '#422006' }}>
              <span style={{ position: 'absolute', bottom: '-25px', left: '-5px', fontSize: '0.8rem', color: '#422006', fontWeight: 'bold' }}>{i}</span>
              {/* Миллиметры */}
              {i < 15 && Array.from({ length: 9 }).map((_, m) => (
                <div key={m} style={{ position: 'absolute', left: `${(m + 1) * (pxPerCm / 10)}px`, height: m === 4 ? '25px' : '15px', width: '1px', background: '#78350f' }} />
              ))}
            </div>
          ))}
          <span style={{ position: 'absolute', right: '10px', top: '10px', color: '#78350f', fontSize: '0.7rem' }}>см (1 div = 1mm)</span>
        </div>

        {/* КАРАНДАШ (Drag-объект) */}
        <motion.div
          drag="x"
          dragMomentum={false}
          onDrag={(e, info) => setPencilX(pencilX + info.delta.x)}
          style={{
            position: 'absolute',
            top: '80px',
            left: `${pencilX}px`,
            width: `${pencilLengthCm * pxPerCm}px`,
            height: '30px',
            background: 'linear-gradient(to bottom, #ef4444, #b91c1c)',
            borderRadius: '2px 10px 10px 2px',
            cursor: 'grab',
            zIndex: 10,
            boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
          }}
        >
          {/* Кончик карандаша */}
          <div style={{ position: 'absolute', left: '-20px', top: 0, width: 0, height: 0, borderTop: '15px solid transparent', borderBottom: '15px solid transparent', borderRight: '20px solid #fdba74' }} />
          <div style={{ position: 'absolute', left: '-20px', top: '12px', width: '5px', height: '6px', background: '#000', borderRadius: '50%' }} />
          <div style={{ padding: '5px', color: 'white', fontSize: '0.6rem', textAlign: 'center' }}>ОБЪЕКТ ИЗМЕРЕНИЯ</div>
        </motion.div>

        {/* Маркер нуля (подсказка) */}
        <div style={{ position: 'absolute', top: '140px', left: `${rulerZeroX}px`, width: '2px', height: '100px', borderLeft: '2px dashed #38bdf8', opacity: 0.5, pointerEvents: 'none' }} />
      </div>

      {/* ФОРМА ОТВЕТА */}
      <div style={{ background: '#1e293b', padding: '20px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <label>Длина l = </label>
        <input 
          type="text" 
          value={userValue} 
          onChange={e => setUserValue(e.target.value)}
          placeholder="0.0" 
          style={inputStyle}
          disabled={isDone}
        />
        <span style={{ fontWeight: 'bold' }}>см</span>
        {!isDone && <button onClick={checkMeasurement} style={btnCheck}>ЗАФИКСИРОВАТЬ</button>}
      </div>

      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '20px', padding: '15px', borderRadius: '10px', background: feedback.type === 'success' ? '#065f46' : '#991b1b' }}>
          {feedback.text}
        </motion.div>
      )}

      {isDone && (
        <button onClick={goToNext} style={{ ...mainBtnStyle, background: '#10b981', width: '100%', marginTop: '20px' }}>ПЕРЕЙТИ К ПОГРЕШНОСТИ →</button>
      )}
    </div>
  );
}

const inputStyle = { width: '80px', padding: '10px', background: '#0f172a', border: '1px solid #38bdf8', color: 'white', borderRadius: '8px', textAlign: 'center', fontSize: '1.2rem' };
const btnCheck = { padding: '10px 20px', background: '#38bdf8', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#000' };
const mainBtnStyle = { padding: '15px 40px', background: '#38bdf8', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem', color: '#000' };