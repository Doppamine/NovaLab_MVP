/**
 * PumpSFX — звуковые эффекты насоса через Web Audio API.
 * Нулевые внешние зависимости, все звуки генерируются программно.
 */

let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

// ═══════════════════════════════════════════
// 1. Щелчок сборки — короткий "клик"
// ═══════════════════════════════════════════
export function playAssembleClick() {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
}

// ═══════════════════════════════════════════
// 2. Щелчок снятия — обратный "клик"
// ═══════════════════════════════════════════
export function playRemoveClick() {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
}

// ═══════════════════════════════════════════
// 3. Скрип ручки насоса — циклический
// ═══════════════════════════════════════════
let creakInterval = null;

function playCreak() {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Фильтрованный шум → скрип
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin(i / bufferSize * Math.PI);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800 + Math.random() * 400;
    filter.Q.value = 5;

    const gain = ctx.createGain();
    gain.gain.value = 0.08;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
}

export function startPumpLoop(cycleSpeed = 1) {
    stopPumpLoop();
    const interval = (1000 / cycleSpeed) / 2; // Скрип 2 раза за цикл
    creakInterval = setInterval(playCreak, interval);
}

export function stopPumpLoop() {
    if (creakInterval) {
        clearInterval(creakInterval);
        creakInterval = null;
    }
}

// ═══════════════════════════════════════════
// 4. Плеск воды — при начале прокачки
// ═══════════════════════════════════════════
export function playWaterSplash() {
    const ctx = getAudioContext();
    const duration = 0.6;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        // Шум с затуханием + низкочастотная модуляция → булькание
        data[i] = (Math.random() * 2 - 1)
            * Math.exp(-t * 5)
            * (0.5 + 0.5 * Math.sin(t * 200));
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1500;

    const gain = ctx.createGain();
    gain.gain.value = 0.15;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
}

// ═══════════════════════════════════════════
// 5. Тяжёлое дыхание — при высокой усталости
// ═══════════════════════════════════════════
let breathInterval = null;

function playBreath(intensity) {
    const ctx = getAudioContext();
    const duration = 0.8;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        // Вдох-выдох: огибающая синуса
        const envelope = Math.sin(t * Math.PI);
        data[i] = (Math.random() * 2 - 1) * envelope * 0.5;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.value = Math.min(intensity * 0.12, 0.15);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
}

export function startBreathing(intensity = 0.5) {
    stopBreathing();
    if (intensity < 0.5) return; // Нет дыхания при низкой усталости
    breathInterval = setInterval(() => playBreath(intensity), 1200);
}

export function stopBreathing() {
    if (breathInterval) {
        clearInterval(breathInterval);
        breathInterval = null;
    }
}

// ═══════════════════════════════════════════
// 6. Звук ошибки
// ═══════════════════════════════════════════
export function playError() {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
}

// ═══════════════════════════════════════════
// 7. Фанфара (миссия выполнена)
// ═══════════════════════════════════════════
export function playFanfare() {
    const ctx = getAudioContext();
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + i * 0.15;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.5);
    });
}
