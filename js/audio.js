// Lightweight procedural audio: no external files are required.
// Browsers only allow audio after a user gesture, so the game starts it from TAP TO START.
(function () {
    let ctx = null;
    let master = null;
    let musicTimer = null;
    let musicStep = 0;

    function ensure() {
        if (!ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return false;
            ctx = new AudioContext();
            master = ctx.createGain();
            master.gain.value = 0.055;
            master.connect(ctx.destination);
        }
        if (ctx.state === "suspended") ctx.resume();
        return true;
    }

    function tone(freq, duration, type = "sine", volume = 0.16, when = 0) {
        if (!ensure()) return;
        const now = ctx.currentTime + when;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + duration + 0.02);
    }

    function startMusic() {
        if (!ensure() || musicTimer) return;
        const notes = [220, 277.18, 329.63, 277.18, 246.94, 329.63, 369.99, 329.63];
        musicStep = 0;
        const tick = () => {
            tone(notes[musicStep % notes.length], 0.18, "triangle", 0.035);
            if (musicStep % 4 === 0) tone(notes[(musicStep + 2) % notes.length] / 2, 0.3, "sine", 0.022);
            musicStep += 1;
        };
        tick();
        musicTimer = window.setInterval(tick, 360);
    }

    function stopMusic() {
        if (musicTimer) {
            clearInterval(musicTimer);
            musicTimer = null;
        }
    }

    window.debugAudio = {
        startMusic,
        stopMusic,
        collect() { tone(660, 0.07, "triangle", 0.08); },
        skill() { tone(520, 0.12, "square", 0.08); tone(780, 0.16, "triangle", 0.055, 0.05); },
        dash() { tone(180, 0.16, "sawtooth", 0.09); tone(360, 0.2, "triangle", 0.05, 0.07); },
        beam() { tone(900, 0.14, "sawtooth", 0.07); },
        bossWarning() { tone(110, 0.24, "sawtooth", 0.09); tone(165, 0.3, "square", 0.055, 0.22); },
        bossHit() { tone(95, 0.08, "square", 0.075); },
        victory() { tone(392, 0.18, "triangle", 0.08); tone(523.25, 0.22, "triangle", 0.08, 0.12); tone(659.25, 0.32, "triangle", 0.08, 0.28); },
        gameOver() { tone(180, 0.22, "sawtooth", 0.07); tone(110, 0.38, "sine", 0.055, 0.18); },
    };
})();
