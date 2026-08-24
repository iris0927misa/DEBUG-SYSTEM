function laneY(lane, height) {
    const ratio = lane === 0 ? CONFIG.upperYRatio : CONFIG.lowerYRatio;
    return height * ratio;
}

function playerX(width) {
    return width * CONFIG.playerXRatio;
}

function playerRadius(height) {
    return Math.max(CONFIG.minRadius, height * CONFIG.playerRadiusRatio);
}

function moveLane(state) {
    if (state.player.controlInvert) return 1 - state.player.lane;
    return state.player.lane;
}

function togglePlayerLane(state) {
    if (state.status !== "running") return;
    state.player.lane = 1 - state.player.lane;
}

function updatePlayer(state, dt, world) {
    if (world.height < 2) return;
    const targetY = laneY(moveLane(state), world.height);
    if (!state.player.initialized) {
        state.player.y = targetY;
        state.player.initialized = true;
        return;
    }
    const t = 1 - Math.exp(-CONFIG.playerMoveSpeed * dt);
    state.player.y += (targetY - state.player.y) * t;
    state.player.hitFlash = Math.max(0, state.player.hitFlash - dt);
    state.player.collectFlash = Math.max(0, state.player.collectFlash - dt);
    if (state.player.invertTimer > 0) {
        state.player.invertTimer = Math.max(0, state.player.invertTimer - dt);
        if (state.player.invertTimer === 0) {
            state.player.controlInvert = false;
        }
    }
}

function playerHitbox(state, world) {
    return {
        x: playerX(world.width),
        y: state.player.y,
        r: playerRadius(world.height) * CONFIG.playerCollisionScale,
    };
}

function activateControlInvert(state) {
    state.player.controlInvert = true;
    state.player.invertTimer = CONFIG.difficulty.invertDuration;
    state.glitchFlash = 0.45;
    state.shake = Math.max(state.shake, 0.28);
}
