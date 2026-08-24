function lerp(a, b, t) {
    return a + (b - a) * t;
}

function lerpWeights(a, b, t) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    const out = {};
    keys.forEach((key) => {
        out[key] = lerp(a[key] || 0, b[key] || 0, t);
    });
    return out;
}

function getDifficulty(time) {
    const bands = CONFIG.difficulty.bands;
    if (time <= bands[0].t) return { ...bands[0], weights: { ...bands[0].weights } };
    const last = bands[bands.length - 1];
    if (time >= last.t) return { ...last, weights: { ...last.weights } };

    let i = 0;
    while (i < bands.length - 1 && time > bands[i + 1].t) i += 1;
    const from = bands[i];
    const to = bands[i + 1];
    const t = (time - from.t) / (to.t - from.t);
    return {
        t: time,
        scrollSpeed: lerp(from.scrollSpeed, to.scrollSpeed, t),
        spawnGap: lerp(from.spawnGap, to.spawnGap, t),
        altDelay: lerp(from.altDelay, to.altDelay, t),
        doubleStagger: lerp(from.doubleStagger, to.doubleStagger, t),
        fastMult: lerp(from.fastMult, to.fastMult, t),
        minReaction: lerp(from.minReaction, to.minReaction, t),
        dataBaitChance: lerp(from.dataBaitChance, to.dataBaitChance, t),
        dataLead: lerp(from.dataLead, to.dataLead, t),
        glitchChance: lerp(from.glitchChance, to.glitchChance, t),
        weights: lerpWeights(from.weights, to.weights, t),
    };
}

function pickWeighted(weights) {
    let total = 0;
    const entries = Object.entries(weights).filter(([, value]) => value > 0);
    for (const [, value] of entries) total += value;
    if (total <= 0) return "single";
    let roll = Math.random() * total;
    for (const [key, value] of entries) {
        roll -= value;
        if (roll <= 0) return key;
    }
    return entries[entries.length - 1][0];
}
