import React, { useState } from 'react';
import { motion } from 'framer-motion';

const EXAM_QUESTIONS = [
  {
    id: 1,
    type: 'choice',
    q: "Какое из этих явлений относится к СВЕТОВЫМ?",
    options: ["Таяние снега", "Радуга", "Полет мяча", "Эхо"],
    correct: "Радуга"
  },
  {
    id: 2,
    type: 'choice',
    q: "Что из перечисленного является ВЕЩЕСТВОМ?",
    options: ["Стакан", "Линейка", "Медь", "Автомобиль"],
    correct: "Медь"
  },
  {
    id: 3,
    type: 'input',
    q: "Переведи в систему СИ: 5 км = ... м (введи только число)",
    correct: "5000"
  },
  {
    id: 4,
    type: 'input',
    q: "Рассчитай цену деления: на шкале между 10 и 20 находится 5 делений. C = ?",
    correct: "2"
  },
  {
    id: 5,
    type: 'input',
    q: "Объём воды V1=50мл. После погружения камня V2=74мл. Каков объём камня?",
    correct: "24"
  },
  {
    id: 6,
    type: 'choice',
    q: "Какая запись результата измерения с погрешностью Δa=0.1 верна?",
    options: ["15.5 + 0.1", "15.5 ± 0.1", "15.5 - 0.1", "15.5 / 0.1"],
    correct: "15.5 ± 0.1"
  }
];

export default function Lesson10({ onComplete, onBack }) {
  const [step, setStep] = useState(1); // 1: Интро, 2: Тест, 3: Результат
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);

  const handleAnswer = (val) => {
    setAnswers({ ...answers, [EXAM_QUESTIONS[currentQ].id]: val });
    if (currentQ < EXAM_QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      finishExam();
    }
  };

  const finishExam = () => {
    let score = 0;
    const report = EXAM_QUESTIONS.map(q => {
      const isCorrect = answers[q.id] === q.correct || 
                       (answers[q.id]?.toString().replace(',', '.') === q.correct);
      if (isCorrect) score++;
      return { ...q, isCorrect, userAns: answers[q.id] };
    });
    setResults({ score, report });
    setStep(3);
    if (score >= 4) onComplete(100); // Даем больше XP за экзамен
  };

  if (step === 1) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: '#fbbf24' }}>🏆 Финальный контроль</h1>
        <p>Пришло время доказать, что ты готов стать настоящим физиком.</p>
        <div style={{ background: '#1e293b', padding: '30px', borderRadius: '20px', margin: '30px 0' }}>
          <p>• 6 вопросов по всем темам<br/>• Без подсказок<br/>• Минимум 4 верных ответа для зачета</p>
        </div>
        <button onClick={() => setStep(2)} style={mainBtnStyle}>НАЧАТЬ ЭКЗАМЕН</button>
      </div>
    );
  }

  if (step === 2) {
    const q = EXAM_QUESTIONS[currentQ];
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#64748b', marginBottom: '10px' }}>Вопрос {currentQ + 1} из {EXAM_QUESTIONS.length}</div>
        <h2 style={{ marginBottom: '30px' }}>{q.q}</h2>
        
        {q.type === 'choice' ? (
          <div style={{ display: 'grid', gap: '10px' }}>
            {q.options.map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)} style={btnOption}>{opt}</button>
            ))}
          </div>
        ) : (
          <div>
            <input 
              type="text" 
              placeholder="Введи ответ..." 
              onKeyDown={(e) => e.key === 'Enter' && handleAnswer(e.target.value)}
              style={inputStyle} 
              autoFocus
            />
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '10px' }}>Нажми Enter для подтверждения</p>
          </div>
        )}
      </div>
    );
  }

  const isPassed = results.score >= 4;

  return (
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ color: isPassed ? '#4ade80' : '#f87171' }}>
        {isPassed ? 'ЭКЗАМЕН СДАН!' : 'НУЖНО ПОВТОРИТЬ'}
      </h1>
      <div style={{ fontSize: '4rem', margin: '20px' }}>{isPassed ? '🎓' : '📚'}</div>
      <h2>Твой результат: {results.score} из {EXAM_QUESTIONS.length}</h2>
      
      <div style={{ textAlign: 'left', background: '#1e293b', padding: '20px', borderRadius: '15px', margin: '20px 0' }}>
        {results.report.map((r, i) => (
          <div key={i} style={{ marginBottom: '10px', color: r.isCorrect ? '#4ade80' : '#f87171', borderBottom: '1px solid #334155', paddingBottom: '5px' }}>
            {r.isCorrect ? '✅' : '❌'} {r.q} <br/>
            <small style={{ color: '#94a3b8' }}>Твой ответ: {r.userAns || 'нет'} | Правильно: {r.correct}</small>
          </div>
        ))}
      </div>

      {isPassed ? (
        <div>
            <p>Поздравляем! Ты успешно завершил Раздел 1 "Введение в физику".</p>
            <button onClick={() => window.location.reload()} style={{ ...mainBtnStyle, background: '#10b981' }}>ВЕРНУТЬСЯ В ГЛАВНОЕ МЕНЮ</button>
        </div>
      ) : (
        <button onClick={() => window.location.reload()} style={mainBtnStyle}>ПОПРОБОВАТЬ СНОВА</button>
      )}
    </div>
  );
}

const btnOption = { padding: '15px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', fontSize: '1rem' };
const inputStyle = { width: '100%', padding: '15px', background: '#0f172a', border: '2px solid #38bdf8', color: 'white', borderRadius: '10px', textAlign: 'center', fontSize: '1.2rem' };
const mainBtnStyle = { padding: '15px 40px', background: '#fbbf24', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem', color: '#000' };