import React, { useEffect, useRef, useState } from 'react';

/**
 * AnimatedCounter — плавно нарастающее число.
 * Когда value меняется, число плавно перетекает от старого к новому.
 */
export default function AnimatedCounter({ value, duration = 800, prefix = '', suffix = '' }) {
    const [display, setDisplay] = useState(0);
    const animRef = useRef(null);
    const startRef = useRef(0);
    const targetRef = useRef(0);

    useEffect(() => {
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;

        if (animRef.current) cancelAnimationFrame(animRef.current);

        startRef.current = display;
        targetRef.current = numValue;
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Easing: ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = startRef.current + (targetRef.current - startRef.current) * eased;

            setDisplay(current);

            if (progress < 1) {
                animRef.current = requestAnimationFrame(animate);
            }
        };

        animRef.current = requestAnimationFrame(animate);

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [value, duration]);

    // Форматирование: если целое — без десятичных, иначе 1 знак
    const formatted = Number.isInteger(targetRef.current)
        ? Math.round(display).toLocaleString()
        : display.toFixed(1);

    return <>{prefix}{formatted}{suffix}</>;
}
