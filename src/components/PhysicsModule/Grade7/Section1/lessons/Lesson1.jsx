import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TASKS = [
  { id: 't1', text: "Кипение воды", correct: "Тепловые" },
  { id: 't2', text: "Полет самолета", correct: "Механические" },
  { id: 't3', text: "Свет от фонарика", correct: "Световые" },
  { id: 't4', text: "Звонок будильника", correct: "Звуковые" }
];

export default function Lesson1({ onComplete, goToNext }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState(false);

  const checkResults = () => {
    const isCorrect = TASKS.every(t => answers[t.id] === t.correct);
    if (isCorrect) {
      setIsDone(true);
      setError(false);
      onComplete(50);
    } else {
      setError(true);
    }
  };

  if (step === 1) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: '#38bdf8' }}>Что изучает физика?</h1>
        <p style={{ fontSize: '1.2rem', margin: '30px 0', color: '#94a3b8' }}>Физика изучает явления природы: от падения яблока до блеска далеких звезд.</p>
        <button onClick={() => setStep(2)} style={{ padding: '15px 40px', background: '#38bdf8', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Начать практику →</button>
      </div>
    );
  }

  return (
    <div style={{ background: '#1e293b', padding: '30px', borderRadius: '20px', border: '1px solid #334155' }}>
      <h2>Классификация явлений</h2>
      <div style={{ margin: '20px 0' }}>
        {TASKS.map(task => (
          <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>{task.text}</span>
            <select disabled={isDone} onChange={(e) => setAnswers({...answers, [task.id]: e.target.value})} style={{ background: '#0f172a', color: 'white', border: '1px solid #38bdf8', borderRadius: '5px' }}>
              <option value="">Выбери...</option>
              <option value="Механические">Механические</option>
              <option value="Тепловые">Тепловые</option>
              <option value="Световые">Световые</option>
              <option value="Звуковые">Звуковые</option>
            </select>
          </div>
        ))}
      </div>

      {!isDone ? (
        <button onClick={checkResults} style={{ width: '100%', padding: '15px', background: '#38bdf8', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>ПРОВЕРИТЬ</button>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#4ade80', marginBottom: '15px', fontWeight: 'bold' }}>✅ Отлично! +50 XP начислено.</div>
          <button onClick={goToNext} style={{ width: '100%', padding: '15px', background: '#10b981', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: 'white' }}>СЛЕДУЮЩИЙ УРОК →</button>
        </div>
      )}
      {error && <div style={{ color: '#f87171', marginTop: '10px', textAlign: 'center' }}>Есть ошибки, попробуй еще раз!</div>}
    </div>
  );
}