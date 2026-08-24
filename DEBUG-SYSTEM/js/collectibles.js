function dataRadius(height) {
    return Math.max(CONFIG.minRadius - 2, height * CONFIG.dataRadiusRatio);
}

function glitchRadius(height) {
    return Math.max(CONFIG.minRadius - 1, height * CONFIG.glitchRadiusRatio);
}

function spawnData(state, world, options) {
    const lane = options.lane;
    const speed = options.speed;
    state.dataItems.push({
        x: options.x,
        y: laneY(lane, world.height),
        r: dataRadius(world.height),
        lane,
        speed,
        pulse: Math.random() * Math.PI * 2,
    });
}

function spawnGlitch(state, world, options) {
    const lane = options.lane;
    state.glitches.push({
        x: options.x,
        y: laneY(lane, world.height),
        r: glitchRadius(world.height),
        lane,
        speed: options.speed,
        pulse: Math.random() * Math.PI * 2,
    });
}

function updateCollectibles(state, dt, world) {
    for (const item of state.dataItems) {
        item.x += -item.speed * dt;
        item.y = laneY(item.lane, world.height);
        item.r = dataRadius(world.height);
        item.pulse += dt * 5;
    }
    state.dataItems = state.dataItems.filter((item) => item.x > -item.r - 24);

    for (const item of state.glitches) {
        item.x += -item.speed * dt;
        item.y = laneY(item.lane, world.height);
        item.r = glitchRadius(world.height);
        item.pulse += dt * 8;
    }
    state.glitches = state.glitches.filter((item) => item.x > -item.r - 24);
}

function removeData(state, item) {
    const index = state.dataItems.indexOf(item);
    if (index >= 0) state.dataItems.splice(index, 1);
}

function removeGlitch(state, item) {
    const index = state.glitches.indexOf(item);
    if (index >= 0) state.glitches.splice(index, 1);
}
