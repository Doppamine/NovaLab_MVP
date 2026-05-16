import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Lesson9({ onComplete, goToNext }) {
  const [step, setStep] = useState(1); // 1: Выбор прибора, 2: Цена деления, 3: V1, 4: Погружение, 5: V2, 6: Итог
  const [divValue, setDivValue] = useState(''); // Цена деления (C)
  const [v1, setV1] = useState('');
  const [v2, setV2] = useState('');
  const [finalResult, setFinalResult] = useState({ v: '', err: '' });
  const [isObjectIn, setIsObjectIn] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Параметры опыта: Цена деления = 2 мл. 
  // V1 = 44 мл (22 деления)
  // Объект = 14 мл
  // V2 = 58 мл
  const targetC = 2;
  const targetV1 = 44;
  const targetV2 = 58;
  const targetVBody = 14;
  const targetErr = 1; // Половина цены деления

  const validateStep = (currentStep, userVal, targetVal, nextStep) => {
    if (parseFloat(userVal) === targetVal) {
      setFeedback({ type: 'success', text: "✅ Данные приняты. Переходим к следующему этапу." });
      setTimeout(() => {
        setStep(nextStep);
        setFeedback(null);
      }, 1500);
    } else {
      setFeedback({ type: 'error', text: "❌ Неверно. Проверь расчеты или внимательно посмотри на шкалу." });
    }
  };

  return (
    <div style={{ padding: '10px', color: 'white' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#38bdf8', margin: 0 }}>🔬 Профессиональная Лаборатория</h2>
        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Раздел: Гидростатика. Протокол №24-Б</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px' }}>
        
        {/* ВИЗУАЛЬНАЯ ЧАСТЬ (МЕНЗУРКА) */}
        <div style={{ position: 'relative', width: '100px', height: '400px', background: 'rgba(255,255,255,0.05)', border: '4px solid #94a3b8', borderRadius: '0 0 25px 25px' }}>
          {/* ВОДА */}
          <motion.div 
            animate={{ height: step >= 3 ? (step >= 4 && isObjectIn ? '58%' : '44%') : '0%' }}
            style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(56, 189, 248, 0.5)', borderTop: '2px solid #fff' }}
          />
          
          {/* ШКАЛА (Цена деления 2 мл) */}
          {Array.from({ length: 51 }).map((_, i) => (
            <div key={i} style={{ 
                position: 'absolute', 
                bottom: `${i * 2}%`, 
                right: 0, 
                width: i % 5 === 0 ? '25px' : '10px', 
                height: '1px', 
                background: i % 5 === 0 ? '#fff' : 'rgba(255,255,255,0.3)' 
            }}>
                {i % 10 === 0 && (
                    <span style={{ position: 'absolute', right: '35px', top: '-8px', fontSize: '0.7rem', fontWeight: 'bold' }}>{i * 2}</span>
                )}
            </div>
          ))}

          {/* ОБЪЕКТ */}
          {isObjectIn && (
            <motion.div initial={{ y: -200 }} animate={{ y: 260 }} style={{ position: 'absolute', left: '25px', fontSize: '2.5rem' }}>🔩</motion.div>
          )}
        </div>

        {/* ИНТЕРФЕЙС УПРАВЛЕНИЯ (БЕЛАЯ КАРТОЧКА) */}
        <div style={{ width: '450px', background: '#fff', borderRadius: '20px', padding: '25px', color: '#1e293b', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          
          {step === 1 && (
            <div>
              <h3 style={{ color: '#0284c7' }}>Этап 1: Цена деления</h3>
              <p>Прежде чем начать замер, определи цену деления этого прибора.</p>
              <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '15px' }}>
                Между отметками <b>0</b> и <b>20</b> находится <b>10</b> делений.
              </div>
              <label>Цена деления (C), мл:</label>
              <input type="number" value={divValue} onChange={e => setDivValue(e.target.value)} style={inputStyle} placeholder="C = ?" />
              <button onClick={() => validateStep(1, divValue, targetC, 2)} style={btnStyle}>ПОДТВЕРДИТЬ</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ color: '#0284c7' }}>Этап 2: Наполнение</h3>
              <p>Налей воду. Обрати внимание, что уровень воды остановился на <b>два деления выше</b> отметки 40.</p>
              <button onClick={() => setStep(3)} style={{ ...btnStyle, background: '#10b981' }}>НАЛИТЬ ВОДУ</button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={{ color: '#0284c7' }}>Этап 3: Замер V1</h3>
              <p>Учитывая, что цена деления = {targetC} мл, определи точный объём воды.</p>
              <input type="number" value={v1} onChange={e => setV1(e.target.value)} style={inputStyle} placeholder="V1 = ?" />
              <button onClick={() => validateStep(3, v1, targetV1, 4)} style={btnStyle}>ЗАПИСАТЬ V1</button>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 style={{ color: '#0284c7' }}>Этап 4: Погружение</h3>
              <p>Погрузи тело в жидкость и зафиксируй новый уровень (V2).</p>
              {!isObjectIn ? (
                <button onClick={() => setIsObjectIn(true)} style={btnStyle}>БРОСИТЬ ДЕТАЛЬ</button>
              ) : (
                <div style={{ marginTop: '15px' }}>
                    <input type="number" value={v2} onChange={e => setV2(e.target.value)} style={inputStyle} placeholder="V2 = ?" />
                    <button onClick={() => validateStep(4, v2, targetV2, 5)} style={btnStyle}>ЗАПИСАТЬ V2</button>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div>
              <h3 style={{ color: '#0284c7' }}>Этап 5: Научный отчет</h3>
              <p>Вычисли объём тела и укажи погрешность (равную половине цены деления: {targetC}/2 = {targetErr}).</p>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '20px 0' }}>
                <input type="number" value={finalResult.v} onChange={e => setFinalResult({...finalResult, v: e.target.value})} style={inputStyle} placeholder="V" />
                <span style={{ fontSize: '1.5rem' }}>±</span>
                <input type="number" value={finalResult.err} onChange={e => setFinalResult({...finalResult, err: e.target.value})} style={inputStyle} placeholder="ΔV" />
                <span style={{ fontWeight: 'bold' }}>мл</span>
              </div>

              <button onClick={() => {
                if (parseInt(finalResult.v) === targetVBody && parseInt(finalResult.err) === targetErr) {
                    setStep(6);
                    onComplete(100);
                } else {
                    setFeedback({ type: 'error', text: "Ошибка в отчете. Перепроверь разность (V2-V1) и погрешность." });
                }
              }} style={{ ...btnStyle, background: '#ef4444' }}>СФОРМИРОВАТЬ ОТЧЕТ</button>
            </div>
          )}

          {step === 6 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem' }}>⭐</div>
              <h2 style={{ color: '#16a34a' }}>РАБОТА ПРИНЯТА</h2>
              <p>Ты провел идеальное измерение с учетом всех физических норм.</p>
              <p style={{ background: '#f1f5f9', padding: '10px', borderRadius: '10px', fontWeight: 'bold' }}>
                Результат: {targetVBody} ± {targetErr} мл
              </p>
              <button onClick={goToNext} style={{ ...btnStyle, background: '#000', marginTop: '20px' }}>ПЕРЕЙТИ К ФИНАЛЬНОМУ ТЕСТУ →</button>
            </div>
          )}

          {feedback && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: '15px', padding: '12px', borderRadius: '10px', background: feedback.type === 'success' ? '#dcfce7' : '#fee2e2', color: feedback.type === 'success' ? '#166534' : '#991b1b', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center' }}
            >
              {feedback.text}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px', border: '2px solid #cbd5e1', borderRadius: '10px', fontSize: '1.2rem', textAlign: 'center', outline: 'none', color: '#1e293b', fontWeight: 'bold' };
const btnStyle = { width: '100%', padding: '15px', background: '#38bdf8', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };