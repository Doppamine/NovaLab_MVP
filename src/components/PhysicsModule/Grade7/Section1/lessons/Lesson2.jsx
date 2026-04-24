import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Lesson2({ onComplete, goToNext }) {
  const [step, setStep] = useState(1); // 1: Сравнение, 2: Теория, 3: Практика, 4: Творчество, 5: Финал
  const [quizIndex, setQuizIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [userIdea, setUserIdea] = useState("");
  const [isDone, setIsDone] = useState(false);

  const quizData = [
    { text: "Запись времени заката солнца в блокнот", type: "observation", hint: "Мы можем ускорить закат? Нет. Значит, только смотрим." },
    { text: "Бросание перышка и камня с одинаковой высоты", type: "experiment", hint: "Мы сами выбрали высоту и предметы. Это наше вмешательство!" },
    { text: "Наблюдение за Луной в телескоп", type: "observation", hint: "Луна далеко, мы на неё никак не влияем." },
    { text: "Растягивание пружины разными грузами", type: "experiment", hint: "Мы меняем грузы, чтобы увидеть результат." }
  ];

  // Логика проверки творческого задания (упрощенный AI-фильтр)
  const analyzeIdea = () => {
    const actionWords = ["сделаю", "возьму", "нагрею", "брошу", "изменю", "поставлю", "сравню", "ударит"];
    const text = userIdea.toLowerCase();
    const hasAction = actionWords.some(word => text.includes(word));

    if (text.length < 10) {
      setFeedback({ type: 'error', text: "Опиши поподробнее, что именно ты хочешь сделать?" });
    } else if (hasAction) {
      setFeedback({ type: 'success', text: "Отлично! Это настоящий эксперимент, потому что ты планируешь действие. +50 XP" });
      setIsDone(true);
      onComplete(50);
    } else {
      setFeedback({ type: 'error', text: "Это больше похоже на наблюдение. Добавь активное действие: что ты изменишь или куда нажмешь?" });
    }
  };

  const handleQuiz = (choice) => {
    if (choice === quizData[quizIndex].type) {
      setFeedback({ type: 'success', text: "Верно! " + quizData[quizIndex].hint });
      setTimeout(() => {
        if (quizIndex < quizData.length - 1) {
          setQuizIndex(prev => prev + 1);
          setFeedback(null);
        } else {
          setStep(4);
          setFeedback(null);
        }
      }, 3000);
    } else {
      setFeedback({ type: 'error', text: `Ошибка. Ответь на вопрос: человек в этой ситуации просто смотрит или он специально что-то меняет?` });
    }
  };

  return (
    <div className="lesson-container" style={{ color: 'white' }}>
      
      {/* ШАГ 1: ВИЗУАЛЬНОЕ СРАВНЕНИЕ */}
      {step === 1 && (
        <div style={{ textAlign: 'center' }}>
          <h2>На что это похоже?</h2>
          <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
            <motion.div whileHover={{ scale: 1.05 }} style={cardStyle} onClick={() => setStep(2)}>
              <div style={{ fontSize: '4rem' }}>🌧️</div>
              <p>Человек смотрит на дождь</p>
              <button style={btnStyle}>Это наблюдение</button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} style={cardStyle} onClick={() => setStep(2)}>
              <div style={{ fontSize: '4rem' }}>🧪</div>
              <p>Ученик смешивает реагенты</p>
              <button style={btnStyle}>Это эксперимент</button>
            </motion.div>
          </div>
        </div>
      )}

      {/* ШАГ 2: ОБЪЯСНЕНИЕ */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#38bdf8' }}>В чем разница?</h2>
          <div style={{ background: '#1e293b', padding: '30px', borderRadius: '20px', margin: '20px 0', textAlign: 'left' }}>
            <p>👁️ <b>Наблюдение</b> — это изучение природы без вмешательства в неё. Мы просто фиксируем то, что происходит само по себе.</p>
            <p>🧪 <b>Эксперимент (Опыт)</b> — это когда мы специально создаем условия, меняем их и смотрим на результат.</p>
          </div>
          <button onClick={() => setStep(3)} style={mainBtnStyle}>Понятно, давай практику! →</button>
        </motion.div>
      )}

      {/* ШАГ 3: ПРАКТИКА (КЛАССИФИКАЦИЯ) */}
      {step === 3 && (
        <div style={{ textAlign: 'center' }}>
          <h2>Уровень: Классификатор</h2>
          <motion.div key={quizIndex} initial={{ x: 50 }} animate={{ x: 0 }} style={quizCardStyle}>
            <h3>{quizData[quizIndex].text}</h3>
          </motion.div>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <button onClick={() => handleQuiz('observation')} style={{ ...btnStyle, background: '#0ea5e9' }}>НАБЛЮДЕНИЕ</button>
            <button onClick={() => handleQuiz('experiment')} style={{ ...btnStyle, background: '#8b5cf6' }}>ЭКСПЕРИМЕНТ</button>
          </div>
          {feedback && <p style={{ color: feedback.type === 'success' ? '#4ade80' : '#f87171', marginTop: '20px' }}>{feedback.text}</p>}
        </div>
      )}

      {/* ШАГ 4: ТВОРЧЕСТВО */}
      {step === 4 && (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#fbbf24' }}>💡 Твоя очередь!</h2>
          <p>Придумай и коротко опиши свой эксперимент. <br/>Например: "Я возьму магнит и проверю, притянет ли он монету".</p>
          <textarea 
            value={userIdea}
            onChange={(e) => setUserIdea(e.target.value)}
            placeholder="Напиши свою идею здесь..."
            style={textareaStyle}
          />
          <br />
          {!isDone ? (
            <button onClick={analyzeIdea} style={mainBtnStyle}>ОТПРАВИТЬ НА ПРОВЕРКУ AI</button>
          ) : (
            <button onClick={goToNext} style={{...mainBtnStyle, background: '#10b981'}}>ШИКАРНО, К УРОКУ 3! →</button>
          )}
          {feedback && <p style={{ color: feedback.type === 'success' ? '#4ade80' : '#f87171', marginTop: '20px' }}>{feedback.text}</p>}
        </div>
      )}

    </div>
  );
}

// Стили компонентов
const cardStyle = {
  flex: 1, background: '#1e293b', padding: '30px', borderRadius: '20px', border: '1px solid #334155', cursor: 'pointer'
};

const quizCardStyle = {
  background: '#0f172a', padding: '40px', borderRadius: '20px', border: '2px solid #38bdf8', marginBottom: '30px'
};

const btnStyle = {
  padding: '12px 24px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', background: '#334155'
};

const mainBtnStyle = {
  padding: '15px 40px', background: '#38bdf8', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem', color: '#000'
};

const textareaStyle = {
  width: '100%', height: '100px', padding: '15px', borderRadius: '10px', background: '#0f172a', color: 'white', border: '1px solid #334155', marginTop: '20px', fontFamily: 'inherit'
};