function pad(value) {
    return String(Math.max(0, value | 0)).padStart(4, "0");
}

function hpText(hp) {
    return "❤️".repeat(Math.max(0, hp));
}

function burst(state, x, y, color) {
    for (let i = 0; i < 10; i += 1) {
        const angle = (Math.PI * 2 * i) / 10;

        state.particles.push({
            x,
            y,
            vx: Math.cos(angle) * (70 + Math.random() * 90),
            vy: Math.sin(angle) * (70 + Math.random() * 90),
            life: 0.35 + Math.random() * 0.2,
            maxLife: 0.55,
            color,
        });
    }
}

function createGame(canvas, hud) {
    const ctx = canvas.getContext("2d");

    let state = createInitialState();

    let world = {
        width: 1,
        height: 1,
        speedScale: 1,
        dpr: 1,
    };

    let lastTime = 0;
    let running = false;

    function syncHud() {
        hud.score.textContent = pad(state.score);
        hud.dataCount.textContent = pad(state.dataCount);
        hud.hp.textContent = hpText(state.hp);

        hud.finalScore.textContent = pad(state.score);
        hud.finalData.textContent = pad(state.dataCount);

        hud.gameOver.classList.toggle(
            "hidden",
            state.status !== "gameover"
        );

        if (hud.startScreen) {
            hud.startScreen.classList.toggle(
                "hidden",
                state.status !== "start"
            );
        }

        if (hud.bossHud) {
            const showBoss = !!state.boss &&
                (state.status === "boss-warning" || state.status === "boss" || state.status === "boss-defeat");
            hud.bossHud.classList.toggle("hidden", !showBoss);

            if (state.boss) {
                const ratio = state.boss.maxHp > 0
                    ? state.boss.hp / state.boss.maxHp
                    : 0;
                hud.bossHpFill.style.transform = `scaleX(${Math.max(0, ratio)})`;
                hud.bossHpText.textContent = `BOSS ${state.boss.hp} / ${state.boss.maxHp}`;
            }
        }

        if (hud.bossWarning) {
            hud.bossWarning.classList.toggle(
                "hidden",
                state.status !== "boss-warning"
            );
        }

        if (hud.victory) {
            hud.victory.classList.toggle(
                "hidden",
                state.status !== "victory"
            );
            hud.victoryScore.textContent = pad(state.score);
            hud.victoryData.textContent = pad(state.dataCount);
        }

        if (hud.hudBar) {
            hud.hudBar.classList.toggle(
                "inverted",
                state.player.controlInvert
            );
        }
    }

    function syncSkillHud() {
        if (!hud.skillButtons) return;

        for (const [name, button] of Object.entries(hud.skillButtons)) {
            if (!button) continue;

            const skill = state.skills[name];
            if (!skill) continue;

            const status = button.querySelector(".skill-status");

            button.classList.remove(
                "cooldown",
                "not-enough-data"
            );

            if (skill.cooldown > 0) {
                button.classList.add("cooldown");
                status.textContent = skill.cooldown.toFixed(1);
            } else if (state.dataCount < skill.cost) {
                button.classList.add("not-enough-data");
                status.textContent = `DATA ${skill.cost}`;
            } else {
                status.textContent = "READY";
            }
        }
    }

    function resolveCollisions() {
        const agent = playerHitbox(state, world);

        // During S2 dash, the player is invincible and every ERROR touched
        // during the dash is converted into DATA instead of causing damage.
        if (isPlayerDashing(state)) {
            const hitErrors = state.errors.filter((error) => circlesOverlap(agent, error));
            for (const error of hitErrors) {
                burst(state, error.x, error.y, "#7dffc3");
                state.dataCount += 1;
                state.score += CONFIG.scorePerData;
                removeError(state, error);
            }
        } else {
            const hitError = findFirstHit(
                agent,
                state.errors
            );

            if (hitError) {
            state.hp -= 1;

            state.player.hitFlash = 0.28;
            state.shake = 0.22;

            burst(
                state,
                hitError.x,
                hitError.y,
                "#ff6b78"
            );

            removeError(state, hitError);

                if (state.hp <= 0) {
                    state.hp = 0;
                    state.status = "gameover";
                    if (typeof debugAudio !== "undefined") {
                        debugAudio.stopMusic();
                        debugAudio.gameOver();
                    }
                }

                return;
            }
        }

        const hitGlitch = findFirstHit(
            agent,
            state.glitches
        );

        if (hitGlitch) {
            burst(
                state,
                hitGlitch.x,
                hitGlitch.y,
                "#c77dff"
            );

            activateControlInvert(state);
            removeGlitch(state, hitGlitch);
        }

        const hitData = findFirstHit(
            agent,
            state.dataItems
        );

        if (hitData) {
            state.score += CONFIG.scorePerData;
            state.dataCount += 1;

            state.player.collectFlash = 0.18;

            burst(
                state,
                hitData.x,
                hitData.y,
                "#7dffc3"
            );

            removeData(state, hitData);
            if (typeof debugAudio !== "undefined") debugAudio.collect();
        }
    }

    function resolveS3Beam() {
        if (state.player.s3Timer <= 0) return;

        const agent = playerHitbox(state, world);
        const beamStartX = agent.x + agent.r * 0.6;

        if (state.status === "boss") {
            if (!state.player.s3HitBoss && state.boss) {
                const bossRadius = Math.max(34, world.height * 0.075);
                if (state.boss.x + bossRadius >= beamStartX) {
                    damageBoss(state, CONFIG.s3Damage);
                    state.player.s3HitBoss = true;
                    burst(state, state.boss.x, state.boss.y, "#7dffc3");
                }
            }
            return;
        }

        if (state.status !== "running") return;

        const hitErrors = state.errors.filter((error) =>
            error.x >= beamStartX && error.y >= agent.y - agent.r * 1.35 && error.y <= agent.y + agent.r * 1.35
        );

        for (const error of hitErrors) {
            burst(state, error.x, error.y, "#7dffc3");
            state.dataCount += 1;
            state.score += CONFIG.scorePerData;
            removeError(state, error);
        }
    }

    function updateParticles(dt) {
        for (const particle of state.particles) {
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.life -= dt;
        }

        state.particles = state.particles.filter(
            (particle) => particle.life > 0
        );
    }

    function updateSkillCooldowns(dt) {
        state.player.s3Timer = Math.max(0, state.player.s3Timer - dt);
        if (state.player.s3Timer === 0) {
            state.player.s3HitBoss = false;
        }
        for (const skill of Object.values(state.skills)) {
            skill.cooldown = Math.max(
                0,
                skill.cooldown - dt
            );
        }
    }

    function update(dt) {
        if (world.width < 2 || world.height < 2) {
            return;
        }

        updateSkillCooldowns(dt);

        world.speedScale = Math.max(
            0.85,
            world.width / 900
        );

        const diff = getDifficulty(state.time);

        state.time += dt;

        state.scrollOffset +=
            diff.scrollSpeed *
            world.speedScale *
            dt;

        state.shake = Math.max(
            0,
            state.shake - dt
        );

        state.glitchFlash = Math.max(
            0,
            state.glitchFlash - dt
        );

        updatePlayer(
            state,
            dt,
            world
        );

        if (state.status === "start") {
            updateParticles(dt);
            return;
        }

        if (state.status === "boss-warning" || state.status === "boss" || state.status === "boss-defeat") {
            updateBoss(state, dt, world);
            updateCollectibles(state, dt, world);
            resolveCollisions();
            resolveS3Beam();
            resolveBossCollisions(state, world);
            updateParticles(dt);
            return;
        }

        if (state.status === "victory" || state.status === "gameover") {
            updateParticles(dt);
            return;
        }

        updatePatterns(
            state,
            world,
            diff
        );

        updateObstacles(
            state,
            dt,
            world
        );

        updateCollectibles(
            state,
            dt,
            world
        );

        resolveCollisions();
        resolveS3Beam();

        if (
            state.status === "running" &&
            state.score >= CONFIG.bossScore
        ) {
            startBossEncounter(state, world);
        }

        updateParticles(dt);
    }

    function frame(now) {
        if (!running) return;

        const dt = Math.min(
            0.033,
            (now - lastTime) / 1000 || 0.016
        );

        lastTime = now;

        ctx.setTransform(
            world.dpr,
            0,
            0,
            world.dpr,
            0,
            0
        );

        update(dt);

        renderFrame(
            ctx,
            state,
            world
        );

        syncHud();
        syncSkillHud();

        requestAnimationFrame(frame);
    }

    function resize(
        cssWidth,
        cssHeight,
        dpr
    ) {
        const width = Math.max(
            1,
            Math.round(cssWidth)
        );

        const height = Math.max(
            1,
            Math.round(cssHeight)
        );

        const nextDpr = Math.max(
            1,
            dpr || 1
        );

        if (
            width === world.width &&
            height === world.height &&
            nextDpr === world.dpr
        ) {
            return;
        }

        const wasInvalid =
            world.height < 2;

        world.dpr = nextDpr;

        canvas.width = Math.max(
            1,
            Math.floor(width * world.dpr)
        );

        canvas.height = Math.max(
            1,
            Math.floor(height * world.dpr)
        );

        ctx.setTransform(
            world.dpr,
            0,
            0,
            world.dpr,
            0,
            0
        );

        world.width = width;
        world.height = height;

        if (
            wasInvalid &&
            height >= 2
        ) {
            state.player.initialized = false;

            updatePlayer(
                state,
                0,
                world
            );
        }
    }

    function switchPosition() {
        togglePlayerLane(state);
    }

    function handleSpace() {
        if (state.status === "start") {
            begin();
            return;
        }
        if (state.status === "gameover" || state.status === "victory") {
            restart();
            return;
        }
        switchPosition();
    }

    function useSkill(skillName) {
        if (
            state.status !== "running" &&
            state.status !== "boss"
        ) {
            return;
        }

        const skill = state.skills[skillName];

        if (!skill) {
            return;
        }

        // Skill is cooling down.
        if (skill.cooldown > 0) {
            return;
        }

        // Not enough DATA.
        if (state.dataCount < skill.cost) {
            return;
        }

        // =========================
        // S1
        // =========================

        if (skillName === "S1") {
            if (state.status === "boss") {
                if (!state.boss || state.boss.bullets.length === 0) {
                    return;
                }

                state.dataCount -= skill.cost;
                const bulletsToConvert = [...state.boss.bullets];
                convertBossBulletsToDamage(state, bulletsToConvert);
                state.boss.bullets = state.boss.bullets.filter(
                    (bullet) => !bulletsToConvert.includes(bullet)
                );
                skill.cooldown = skill.maxCooldown;
                if (typeof debugAudio !== "undefined") debugAudio.skill();
                return;
            }

            if (state.errors.length === 0) {
                return;
            }

            state.dataCount -= skill.cost;

            const errorsToConvert = [...state.errors];

            for (const error of errorsToConvert) {
                burst(
                    state,
                    error.x,
                    error.y,
                    "#7dffc3"
                );

                state.dataCount += 1;
                state.score += CONFIG.scorePerData;
            }

            state.errors.length = 0;
            skill.cooldown = skill.maxCooldown;
            if (typeof debugAudio !== "undefined") debugAudio.skill();
            return;
        }

        // =========================
        // S2
        // =========================

        if (skillName === "S2") {
            // DASH: move forward, become invincible, and convert
            // every ERROR touched during the dash into DATA.
            if (!startDash(state)) {
                return;
            }

            state.dataCount -= skill.cost;
            skill.cooldown = skill.maxCooldown;
            if (typeof debugAudio !== "undefined") debugAudio.dash();
            return;
        }

        // =========================
        // S3
        // =========================

        if (skillName === "S3") {
            state.dataCount -= skill.cost;
            state.player.s3Timer = CONFIG.s3Duration;
            state.player.s3HitBoss = false;
            skill.cooldown = CONFIG.s3Cooldown;
            if (typeof debugAudio !== "undefined") debugAudio.beam();
            state.shake = Math.max(state.shake, 0.08);
            return;
        }
    }

    function setPointerPosition(x, y) {
        if (state.status !== "boss-warning" && state.status !== "boss") return;
        setBossPointerTarget(state, x, y);
    }

    function setMoveInput(x, y) {
        if (state.status !== "boss-warning" && state.status !== "boss") {
            return;
        }
        setBossMoveInput(state, x, y);
    }

    function begin() {
        if (state.status !== "start") return;
        state.status = "running";
        if (typeof debugAudio !== "undefined") debugAudio.startMusic();
        state.time = 0;
        state.patternReadyAt = 0.45;
        state.player.initialized = false;
        updatePlayer(state, 0, world);
        syncHud();
        syncSkillHud();
    }

    function restart() {
        if (state.status !== "gameover" && state.status !== "victory") {
            return;
        }

        state = createInitialState();

        updatePlayer(
            state,
            0,
            world
        );

        syncHud();
        syncSkillHud();
    }

    function start() {
        if (running) {
            return;
        }

        running = true;
        lastTime = performance.now();

        syncHud();
        syncSkillHud();

        requestAnimationFrame(frame);
    }

    return {
        resize,
        begin,
        switchPosition,
        handleSpace,
        useSkill,
        setPointerPosition,
        setMoveInput,
        restart,
        start,
        syncSkillHud,
    };
}