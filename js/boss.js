function createBossState() {
    return {
        hp: CONFIG.bossHp,
        maxHp: CONFIG.bossHp,
        x: 0,
        y: 0,
        warningTimer: 1.8,
        fireTimer: 0.75,
        pulse: 0,
        defeated: false,
        bullets: [],
        damageFlash: 0,
        dataTimer: 0.55,
        defeatTimer: 0,
    };
}

function isBossMode(state) {
    return state.status === "boss-warning" || state.status === "boss" || state.status === "boss-defeat" || state.status === "victory";
}

function startBossEncounter(state, world) {
    if (state.boss || state.status !== "running") return false;

    state.status = "boss-warning";
    state.boss = createBossState();
    state.boss.x = world.width * 0.82;
    state.boss.y = world.height * 0.5;
    state.errors.length = 0;
    state.dataItems.length = 0;
    state.glitches.length = 0;
    state.spawnQueue.length = 0;
    state.patternReadyAt = Infinity;
    state.shake = Math.max(state.shake, 0.18);
    if (typeof debugAudio !== "undefined") debugAudio.bossWarning();
    return true;
}

function spawnBossBullet(state, world, options = {}) {
    if (!state.boss) return;

    const lane = options.lane == null
        ? (Math.random() < 0.5 ? 0 : 1)
        : options.lane;

    const speed = options.speed || CONFIG.bossBulletSpeed;
    const y = laneY(lane, world.height);

    state.boss.bullets.push({
        x: state.boss.x - 34,
        y,
        r: Math.max(8, world.height * 0.018),
        lane,
        speed,
        phase: Math.random() * Math.PI * 2,
        life: 0,
    });
}

function fireBossPattern(state, world) {
    if (!state.boss) return;

    const pattern = Math.random();

    if (pattern < 0.58) {
        spawnBossBullet(state, world, {
            lane: Math.random() < 0.5 ? 0 : 1,
        });
        return;
    }

    if (pattern < 0.88) {
        spawnBossBullet(state, world, { lane: 0, speed: 245 });
        spawnBossBullet(state, world, { lane: 1, speed: 245 });
        return;
    }

    const lane = Math.random() < 0.5 ? 0 : 1;
    spawnBossBullet(state, world, { lane, speed: 310 });
}

function damageBoss(state, amount) {
    if (!state.boss || state.status !== "boss" || amount <= 0) return;

    state.boss.hp = Math.max(0, state.boss.hp - amount);
    state.boss.damageFlash = 0.18;
    if (typeof debugAudio !== "undefined") debugAudio.bossHit();
    state.shake = Math.max(state.shake, 0.08);

    if (state.boss.hp <= 0) {
        state.boss.defeated = true;
        state.boss.bullets.length = 0;
        state.boss.defeatTimer = 2.25;
        state.status = "boss-defeat";
        state.shake = Math.max(state.shake, 0.35);
        if (typeof debugAudio !== "undefined") debugAudio.victory();
        for (let i = 0; i < 5; i += 1) {
            burst(
                state,
                state.boss.x + (Math.random() - 0.5) * 80,
                state.boss.y + (Math.random() - 0.5) * 100,
                i % 2 === 0 ? "#7dffc3" : "#5ce1ff"
            );
        }
    }
}

function convertBossBulletsToDamage(state, bullets) {
    if (!state.boss || state.status !== "boss") return;

    for (const bullet of bullets) {
        burst(state, bullet.x, bullet.y, "#7dffc3");
        damageBoss(state, 1);
        state.score += CONFIG.scorePerData;
    }
}

function updateBoss(state, dt, world) {
    if (!state.boss) return;

    state.boss.x = world.width * 0.82;
    state.boss.y = world.height * 0.5;
    state.boss.pulse += dt * 3.5;
    state.boss.damageFlash = Math.max(0, state.boss.damageFlash - dt);

    if (state.status === "boss-warning") {
        state.boss.warningTimer = Math.max(0, state.boss.warningTimer - dt);
        if (state.boss.warningTimer === 0) {
            state.status = "boss";
            state.boss.fireTimer = CONFIG.bossFireInterval * 0.75;
        }
        return;
    }

    if (state.status === "boss-defeat") {
        state.boss.defeatTimer = Math.max(0, state.boss.defeatTimer - dt);
        if (state.boss.defeatTimer === 0) {
            state.status = "victory";
            if (typeof debugAudio !== "undefined") debugAudio.stopMusic();
        }
        return;
    }

    if (state.status !== "boss") return;

    state.boss.dataTimer -= dt;
    if (state.boss.dataTimer <= 0) {
        state.dataItems.push({
            x: world.width + 35,
            y: Math.max(24, Math.min(world.height - 24, world.height * (0.14 + Math.random() * 0.72))),
            r: dataRadius(world.height),
            lane: 0,
            speed: 155 + Math.random() * 55,
            pulse: Math.random() * Math.PI * 2,
        });
        state.boss.dataTimer = 0.72 + Math.random() * 0.42;
    }

    state.boss.fireTimer -= dt;
    if (state.boss.fireTimer <= 0) {
        fireBossPattern(state, world);
        state.boss.fireTimer = CONFIG.bossFireInterval;
    }

    for (const bullet of state.boss.bullets) {
        bullet.x -= bullet.speed * dt;
        bullet.life += dt;
    }

    state.boss.bullets = state.boss.bullets.filter(
        (bullet) => bullet.x > -bullet.r - 30
    );
}

function resolveBossCollisions(state, world) {
    if (!state.boss || state.status !== "boss") return;

    const agent = playerHitbox(state, world);

    if (isPlayerDashing(state)) {
        const hitBullets = state.boss.bullets.filter(
            (bullet) => circlesOverlap(agent, bullet)
        );

        if (hitBullets.length) {
            convertBossBulletsToDamage(state, hitBullets);
            state.boss.bullets = state.boss.bullets.filter(
                (bullet) => !hitBullets.includes(bullet)
            );
        }
        return;
    }

    const hitBullet = findFirstHit(agent, state.boss.bullets);
    if (!hitBullet) return;

    state.hp -= 1;
    state.player.hitFlash = 0.28;
    state.shake = Math.max(state.shake, 0.22);
    burst(state, hitBullet.x, hitBullet.y, "#ff6b78");
    state.boss.bullets.splice(state.boss.bullets.indexOf(hitBullet), 1);

    if (state.hp <= 0) {
        state.hp = 0;
        state.status = "gameover";
        if (typeof debugAudio !== "undefined") {
            debugAudio.stopMusic();
            debugAudio.gameOver();
        }
    }
}
