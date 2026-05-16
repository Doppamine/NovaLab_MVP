import React, { useState } from 'react';
import { motion } from 'framer-motion';

const OBJECTS_DATA = [
  {
    id: 1,
    name: "Стеклянная колба",
    image: "🧪",
    options: {
      bodies: ["Колба", "Жидкость", "Воздух"],
      substances: ["Стекло", "Металл", "Пластик"],
      quantities: ["Масса", "Объём", "Высота", "Цвет", "Цена"]
    },
    correct: {
      body: "Колба",
      substance: "Стекло",
      quantities: ["Масса", "Объём", "Высота"]
    }
  },
  {
    id: 2,
    name: "Железный гвоздь",
    image: "📍",
    options: {
      bodies: ["Гвоздь", "Молоток", "Стена"],
      substances: ["Железо", "Дерево", "Резина"],
      quantities: ["Длина", "Масса", "Диаметр", "Запах", "Красота"]
    },
    correct: {
      body: "Гвоздь",
      substance: "Железо",
      quantities: ["Длина", "Масса", "Диаметр"]
    }
  }
];

export default function Lesson3({ onComplete, goToNext }) {
  const [objIndex, setObjIndex] = useState(0);
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState({ body: null, substance: null, quantities: [] });
  const [feedback, setFeedback] = useState(null);
  const [isDone, setIsDone] = useState(false);

  const currentObj = OBJECTS_DATA[objIndex];

  const toggleQuantity = (q) => {
    setSelections(prev => {
      const exists = prev.quantities.includes(q);
      if (exists) return { ...prev, quantities: prev.quantities.filter(item => item !== q) };
      return { ...prev, quantities: [...prev.quantities, q] };
    });
  };

  const checkAnswer = () => {
    const isBodyCorrect = selections.body === currentObj.correct.body;
    const isSubstanceCorrect = selections.substance === currentObj.correct.substance;
    const correctQuantitiesSelected = selections.quantities.filter(q => currentObj.correct.quantities.includes(q));
    const wrongQuantitiesSelected = selections.quantities.filter(q => !currentObj.correct.quantities.includes(q));

    if (isBodyCorrect && isSubstanceCorrect && correctQuantitiesSelected.length >= 2 && wrongQuantitiesSelected.length === 0) {
      setFeedback({ type: 'success', text: "Верно! Объект разобран правильно." });
      setTimeout(() => {
        if (objIndex < OBJECTS_DATA.length - 1) {
          setObjIndex(prev => prev + 1);
          setSelections({ body: null, substance: null, quantities: [] });
          setFeedback(null);
        } else {
          setIsDone(true);
          onComplete(50);
        }
      }, 1500);
    } else {
      setFeedback({ type: 'error', text: "Ошибка в классификации. Проверь тело, вещество и измеряемые величины." });
    }
  };

  if (step === 1) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: '#38bdf8' }}>Урок 3. Тело, Вещество, Величина</h1>
        <p>Нужно уметь отличать сам предмет от того, из чего он сделан.</p>
        <button onClick={() => setStep(2)} style={{ padding: '15px 30px', background: '#38bdf8', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>Начать разбор!</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '4rem' }}>{currentObj.image}</div>
      <h3>{currentObj.name}</h3>
      <div style={{ textAlign: 'left', marginTop: '20px', background: '#1e293b', padding: '20px', borderRadius: '15px' }}>
        <p><b>Физ. тело:</b> {currentObj.options.bodies.map(b => (
          <button key={b} onClick={() => setSelections({...selections, body: b})} style={{ margin: '5px', padding: '5px 10px', background: selections.body === b ? '#38bdf8' : '#0f172a', color: selections.body === b ? '#000' : '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>{b}</button>
        ))}</p>
        <p><b>Вещество:</b> {currentObj.options.substances.map(s => (
          <button key={s} onClick={() => setSelections({...selections, substance: s})} style={{ margin: '5px', padding: '5px 10px', background: selections.substance === s ? '#38bdf8' : '#0f172a', color: selections.substance === s ? '#000' : '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>{s}</button>
        ))}</p>
        <p><b>Величины:</b> {currentObj.options.quantities.map(q => (
          <button key={q} onClick={() => toggleQuantity(q)} style={{ margin: '5px', padding: '5px 10px', background: selections.quantities.includes(q) ? '#38bdf8' : '#0f172a', color: selections.quantities.includes(q) ? '#000' : '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>{q}</button>
        ))}</p>
      </div>
      {feedback && <div style={{ color: feedback.type === 'success' ? '#4ade80' : '#f87171', margin: '15px' }}>{feedback.text}</div>}
      {!isDone ? <button onClick={checkAnswer} style={{ width: '100%', padding: '15px', background: '#38bdf8', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ПРОВЕРИТЬ</button>
               : <button onClick={goToNext} style={{ width: '100%', padding: '15px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ДАЛЕЕ →</button>}
    </div>
  );
}