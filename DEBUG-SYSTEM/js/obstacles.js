function errorRadius(height) {
    return Math.max(CONFIG.minRadius, height * CONFIG.errorRadiusRatio);
}

function spawnLeadX(world, speed, minReaction) {
    const px = playerX(world.width);
    return Math.max(world.width + 40, px + speed * minReaction);
}

function spawnError(state, world, options) {
    const lane = options.lane;
    const speed = options.speed;
    const kind = options.kind || "normal";
    const x = options.x != null ? options.x : spawnLeadX(world, speed, options.minReaction);
    state.errors.push({
        x,
        y: laneY(lane, world.height),
        r: errorRadius(world.height),
        lane,
        kind,
        speed,
        rot: Math.random() * Math.PI,
        phase: Math.random() * Math.PI * 2,
        baseY: laneY(lane, world.height),
    });
    return state.errors[state.errors.length - 1];
}

function updateObstacles(state, dt, world) {
    const span = Math.abs(laneY(1, world.height) - laneY(0, world.height));
    const wobbleAmp = span * CONFIG.difficulty.wobbleLaneFraction;
    for (const error of state.errors) {
        error.x += -error.speed * dt;
        error.r = errorRadius(world.height);
        error.baseY = laneY(error.lane, world.height);
        error.rot += dt * (error.kind === "fast" ? 2.4 : 1.4);
        if (error.kind === "wobble") {
            error.y = error.baseY + Math.sin(state.time * 6.2 + error.phase) * wobbleAmp;
        } else {
            error.y = error.baseY;
        }
    }
    state.errors = state.errors.filter((error) => error.x > -error.r - 24);
}

function removeError(state, error) {
    const index = state.errors.indexOf(error);
    if (index >= 0) state.errors.splice(index, 1);
}
