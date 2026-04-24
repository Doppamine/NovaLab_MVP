import React, { useState } from 'react';

const QUESTIONS = [
  {
    q: "Если коэффициент сопротивления (Cd) увеличивается, что происходит с силой сопротивления воздуха?",
    options: ["Она уменьшается", "Она увеличивается", "Она остается прежней"],
    ans: 1
  },
  {
    q: "Если левые колеса машины больше правых, что произойдет при ускорении?",
    options: ["Машина поедет идеально прямо", "Машину будет уводить влево", "Машину будет уводить вправо"],
    ans: 2
  },
  {
    q: "Посмотрите на формулу сопротивления (F = ½ ρ v² Cd A). Какой фактор имеет наибольшее (экспоненциальное) влияние?",
    options: ["Плотность воздуха (ρ)", "Площадь поверхности (A)", "Скорость автомобиля (v)"],
    ans: 2
  }
];

export default function QuizModule({ setPhase, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const handleAnswer = (index) => {
    if (index === QUESTIONS[current].ans) setScore(score + 1);
    if (current + 1 < QUESTIONS.length) setCurrent(current + 1);
    else setDone(true);
  };

  return (
    <div className="quiz-container">
      <div className="quiz-card">
        {!done ? (
          <>
            <h2>🧪 Проверка Физики ({current + 1}/{QUESTIONS.length})</h2>
            <p className="question-text">{QUESTIONS[current].q}</p>
            <div className="options">
              {QUESTIONS[current].options.map((opt, i) => (
                <button key={i} onClick={() => handleAnswer(i)}>{opt}</button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2>🎉 Модуль успешно завершен!</h2>
            <p>Твой балл по физике: {score} / {QUESTIONS.length}</p>
            <div className="actions">
              <button onClick={() => setPhase('build')}>Пересобрать машину</button>
              <button onClick={onComplete} className="primary">Выйти в Главное Меню</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}