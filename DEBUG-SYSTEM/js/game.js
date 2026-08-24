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
            }

            return;
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

        if (state.status !== "running") {
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
        if (state.status === "gameover") {
            restart();
            return;
        }

        switchPosition();
    }

    function useSkill(skillName) {
        if (state.status !== "running") {
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
        // S1: ERROR -> DATA
        // =========================

        if (skillName === "S1") {
            if (state.errors.length === 0) {
                return;
            }

            state.dataCount -= skill.cost;

            const errorsToConvert = [
                ...state.errors
            ];

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

            return;
        }

        // =========================
        // S2
        // =========================

        if (skillName === "S2") {
            // 暫時保留技能入口。
            // 真正的衝刺 / 無敵效果下一步實作。

            state.dataCount -= skill.cost;

            skill.cooldown = skill.maxCooldown;

            return;
        }

        // =========================
        // S3
        // =========================

        if (skillName === "S3") {
            // 暫時保留技能入口。
            // 真正的程序光束下一步實作。

            state.dataCount -= skill.cost;

            skill.cooldown = skill.maxCooldown;

            return;
        }
    }

    function restart() {
        if (state.status !== "gameover") {
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
        switchPosition,
        handleSpace,
        useSkill,
        restart,
        start,
        syncSkillHud,
    };
}