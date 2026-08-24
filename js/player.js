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

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function updatePlayer(state, dt, world) {
    if (world.height < 2) return;

    if (state.status === "boss-warning" || state.status === "boss" || state.status === "boss-defeat") {
        if (!state.player.initialized) {
            state.player.x = world.width * 0.18;
            state.player.y = world.height * 0.5;
            state.player.initialized = true;
        }

        const inputX = state.player.moveInputX || 0;
        const inputY = state.player.moveInputY || 0;
        const speed = CONFIG.bossPlayerSpeed;

        if (Math.abs(inputX) + Math.abs(inputY) > 0) {
            state.player.x += inputX * speed * dt;
            state.player.y += inputY * speed * dt;
        } else if (state.player.pointerActive && state.player.pointerTarget) {
            const target = state.player.pointerTarget;
            const dx = target.x - state.player.x;
            const dy = target.y - state.player.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 3) {
                const step = Math.min(distance, CONFIG.bossPointerSpeed * dt);
                state.player.x += (dx / distance) * step;
                state.player.y += (dy / distance) * step;
            }
        }

        const r = playerRadius(world.height) * 1.25;
        state.player.x = clamp(state.player.x, r, world.width - r);
        state.player.y = clamp(state.player.y, r, world.height - r);
    } else {
        const targetY = laneY(moveLane(state), world.height);

        if (!state.player.initialized) {
            state.player.x = playerX(world.width);
            state.player.y = targetY;
            state.player.initialized = true;
            return;
        }

        const t = 1 - Math.exp(-CONFIG.playerMoveSpeed * dt);
        state.player.x += (playerX(world.width) - state.player.x) * t;
        state.player.y += (targetY - state.player.y) * t;
    }

    state.player.hitFlash = Math.max(0, state.player.hitFlash - dt);
    state.player.collectFlash = Math.max(0, state.player.collectFlash - dt);

    if (state.player.invertTimer > 0) {
        state.player.invertTimer = Math.max(0, state.player.invertTimer - dt);
        if (state.player.invertTimer === 0) {
            state.player.controlInvert = false;
        }
    }

    if (state.player.dashTimer > 0) {
        state.player.dashTimer = Math.max(0, state.player.dashTimer - dt);

        const progress = 1 - state.player.dashTimer / state.player.dashDuration;
        const eased = 1 - Math.pow(1 - progress, 3);
        state.player.dashOffset = state.player.dashStartOffset + state.player.dashDistance * eased;

        if (state.player.dashTimer === 0) {
            state.player.dashOffset = state.player.dashStartOffset + state.player.dashDistance;
        }
    } else if (state.player.dashOffset !== 0) {
        const returnT = 1 - Math.exp(-18 * dt);
        state.player.dashOffset += (0 - state.player.dashOffset) * returnT;
        if (Math.abs(state.player.dashOffset) < 0.5) {
            state.player.dashOffset = 0;
        }
    }
}

function startDash(state) {
    if (state.status !== "running" && state.status !== "boss") return false;
    if (state.player.dashTimer > 0) return false;

    state.player.dashDuration = CONFIG.dashDuration;
    state.player.dashTimer = CONFIG.dashDuration;
    state.player.dashStartOffset = state.player.dashOffset;
    state.player.dashDistance = CONFIG.dashDistance;
    state.shake = Math.max(state.shake, 0.12);
    state.player.collectFlash = Math.max(state.player.collectFlash, CONFIG.dashDuration);
    return true;
}

function isPlayerDashing(state) {
    return state.player.dashTimer > 0;
}

function playerWorldX(state, world) {
    return state.player.x + state.player.dashOffset;
}

function playerHitbox(state, world) {
    return {
        x: playerWorldX(state, world),
        y: state.player.y,
        r: playerRadius(world.height) * CONFIG.playerCollisionScale,
    };
}

function setBossPointerTarget(state, x, y) {
    if (state.status !== "boss-warning" && state.status !== "boss") return;
    state.player.pointerActive = true;
    state.player.pointerTarget = { x, y };
}

function setBossMoveInput(state, x, y) {
    state.player.moveInputX = x;
    state.player.moveInputY = y;
}

function activateControlInvert(state) {
    state.player.controlInvert = true;
    state.player.invertTimer = CONFIG.difficulty.invertDuration;
    state.glitchFlash = 0.45;
    state.shake = Math.max(state.shake, 0.28);
}
