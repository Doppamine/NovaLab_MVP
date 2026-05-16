import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Импорты всех 9 уроков
import Lesson1 from './lessons/Lesson1';
import Lesson2 from './lessons/Lesson2';
import Lesson3 from './lessons/Lesson3';
import Lesson4 from './lessons/Lesson4';
import Lesson5 from './lessons/Lesson5';
import Lesson7 from './lessons/Lesson7';
import Lesson8 from './lessons/Lesson8';
import Lesson9 from './lessons/Lesson9';
import Lesson10 from './lessons/Lesson10';

export default function SectionManager({ onBack }) {
  const [currentLesson, setCurrentLesson] = useState(1);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [completedLessons, setCompletedLessons] = useState([]);

  const lessons = [
    { id: 1, title: "Явления", component: Lesson1 },
    { id: 2, title: "Методы", component: Lesson2 },
    { id: 3, title: "Тело/Вещество", component: Lesson3 },
    { id: 4, title: "Система СИ", component: Lesson4 },
    { id: 5, title: "Цена деления", component: Lesson5 },
    { id: 6, title: "Погрешность", component: Lesson7 },
    { id: 7, title: "Объём тела", component: Lesson8 },
    { id: 8, title: "Лаб №2: Объём", component: Lesson9 },
    { id: 9, title: "КОНТРОЛЬ", component: Lesson10 },
  ];

  const addXp = (amount) => {
    setXp(prev => {
      const newXp = prev + amount;
      if (newXp >= level * 100) setLevel(l => l + 1);
      return newXp;
    });
  };

  const handleLessonComplete = (points) => {
    addXp(points);
    if (!completedLessons.includes(currentLesson)) {
      setCompletedLessons([...completedLessons, currentLesson]);
    }
  };

  const renderLesson = () => {
    const lesson = lessons.find(l => l.id === currentLesson);
    if (!lesson || !lesson.component) return <div>Загрузка...</div>;

    const LessonComponent = lesson.component;
    return (
      <motion.div key={currentLesson} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
        <LessonComponent 
            onComplete={handleLessonComplete} 
            goToNext={() => setCurrentLesson(prev => Math.min(prev + 1, 9))}
            onBack={onBack}
        />
      </motion.div>
    );
  };

  return (
    <div style={{ background: '#020617', minHeight: '100vh', color: 'white', position: 'fixed', top: 0, left: 0, width: '100vw', zIndex: 100, overflowY: 'auto' }}>
      
      {/* HUD HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
        <button onClick={onBack} style={{ background: '#334155', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>⬅️ Меню</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 'bold' }}>LEVEL {level}</div>
            <div style={{ width: '120px', height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${(xp % 100)}%`, height: '100%', background: '#38bdf8', transition: '0.5s' }} />
            </div>
          </div>
          <div style={{ fontWeight: 'bold', color: '#fbbf24' }}>✨ {xp} XP</div>
        </div>
      </div>

      {/* NAVIGATION */}
      <div style={{ display: 'flex', gap: '10px', padding: '10px 30px', background: '#020617', overflowX: 'auto', borderBottom: '1px solid #1e293b' }}>
        {lessons.map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => setCurrentLesson(lesson.id)}
            style={{
              padding: '8px 15px', borderRadius: '20px', border: '1px solid',
              borderColor: currentLesson === lesson.id ? '#38bdf8' : '#334155',
              background: currentLesson === lesson.id ? 'rgba(56, 189, 248, 0.1)' : completedLessons.includes(lesson.id) ? '#064e3b' : 'transparent',
              color: currentLesson === lesson.id ? '#38bdf8' : completedLessons.includes(lesson.id) ? '#4ade80' : '#64748b',
              whiteSpace: 'nowrap', cursor: 'pointer', fontSize: '0.8rem'
            }}
          >
            {completedLessons.includes(lesson.id) ? '✅' : lesson.id + '.'} {lesson.title}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px 100px 20px' }}>
        <AnimatePresence mode="wait">
          {renderLesson()}
        </AnimatePresence>
      </div>
    </div>
  );
}