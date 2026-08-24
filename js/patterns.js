function queueEvent(state, delay, job) {
    state.spawnQueue.push({ at: state.time + delay, job });
}

function maybeDataBait(state, world, diff, error, speed) {
    if (Math.random() > diff.dataBaitChance) return;
    const lead = Math.max(diff.dataLead, CONFIG.difficulty.minSwitchWindow + 0.12);
    const gap = speed * lead;
    const x = error.x - gap;
    if (x < playerX(world.width) + 90) return;
    spawnData(state, world, {
        lane: error.lane,
        speed,
        x,
    });
}

function maybeGlitchOrb(state, world, diff, speed, avoidLane) {
    if (Math.random() > diff.glitchChance) return;
    const lane = avoidLane == null ? (Math.random() < 0.5 ? 0 : 1) : 1 - avoidLane;
    const x = spawnLeadX(world, speed, diff.minReaction + 0.25);
    spawnGlitch(state, world, { lane, speed, x });
}

function startPattern(state, world, diff) {
    const pattern = pickWeighted(diff.weights);
    const speed = diff.scrollSpeed * world.speedScale;
    const fastSpeed = speed * diff.fastMult;
    const delay = Math.max(diff.altDelay, CONFIG.difficulty.minSwitchWindow + 0.08);
    const stagger = Math.max(diff.doubleStagger, CONFIG.difficulty.minSwitchWindow + 0.12);

    if (pattern === "single") {
        const lane = Math.random() < 0.5 ? 0 : 1;
        const error = spawnError(state, world, {
            lane,
            speed,
            kind: "normal",
            minReaction: diff.minReaction,
        });
        maybeDataBait(state, world, diff, error, speed);
        maybeGlitchOrb(state, world, diff, speed, lane);
        state.patternReadyAt = state.time + diff.spawnGap;
        state.lastSpawnLane = lane;
        return;
    }

    if (pattern === "alt" || pattern === "reverseAlt") {
        const first = pattern === "alt" ? 0 : 1;
        const lanes = [first, 1 - first, first];
        lanes.forEach((lane, index) => {
            queueEvent(state, delay * index, (st, wr) => {
                const error = spawnError(st, wr, {
                    lane,
                    speed,
                    kind: "normal",
                    minReaction: diff.minReaction,
                });
                if (index === 1) maybeDataBait(st, wr, diff, error, speed);
            });
        });
        state.patternReadyAt = state.time + delay * 2 + diff.spawnGap;
        state.lastSpawnLane = first;
        return;
    }

    if (pattern === "double") {
        const nearLane = Math.random() < 0.5 ? 0 : 1;
        const farLane = 1 - nearLane;
        const offset = speed * stagger;
        const near = spawnError(state, world, {
            lane: nearLane,
            speed,
            kind: "normal",
            minReaction: diff.minReaction,
        });
        spawnError(state, world, {
            lane: farLane,
            speed,
            kind: "normal",
            minReaction: diff.minReaction,
            x: near.x + offset,
        });
        maybeDataBait(state, world, diff, near, speed);
        state.patternReadyAt = state.time + stagger + diff.spawnGap;
        state.lastSpawnLane = farLane;
        return;
    }

    if (pattern === "fast") {
        const lane = Math.random() < 0.5 ? 0 : 1;
        spawnError(state, world, {
            lane,
            speed: fastSpeed,
            kind: "fast",
            minReaction: diff.minReaction,
        });
        maybeGlitchOrb(state, world, diff, speed, lane);
        state.patternReadyAt = state.time + diff.spawnGap;
        state.lastSpawnLane = lane;
        return;
    }

    if (pattern === "wobble") {
        const lane = Math.random() < 0.5 ? 0 : 1;
        const error = spawnError(state, world, {
            lane,
            speed,
            kind: "wobble",
            minReaction: diff.minReaction,
        });
        maybeDataBait(state, world, diff, error, speed);
        state.patternReadyAt = state.time + diff.spawnGap;
        state.lastSpawnLane = lane;
    }
}

function updatePatterns(state, world, diff) {
    state.spawnQueue.sort((a, b) => a.at - b.at);
    while (state.spawnQueue.length && state.spawnQueue[0].at <= state.time) {
        const event = state.spawnQueue.shift();
        event.job(state, world, diff);
    }
    if (state.time >= state.patternReadyAt && state.spawnQueue.length === 0) {
        startPattern(state, world, diff);
    }
}
