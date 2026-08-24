function clearCanvas(ctx, world) {
    ctx.fillStyle = "#071018";
    ctx.fillRect(0, 0, world.width, world.height);
}

function drawEnvironment(ctx, world, state) {
    const { width, height } = world;
    const offset = state.scrollOffset;
    if (width < 2 || height < 2) return;

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#0a1624");
    bg.addColorStop(0.5, "#071018");
    bg.addColorStop(1, "#0b1220");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = "#3ad7ff";
    ctx.lineWidth = 1;
    const cell = Math.max(36, height * 0.09);
    const shift = offset % cell;
    for (let x = -cell + shift; x < width + cell; x += cell) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    ctx.fillStyle = "#7cefff";
    for (let x = -cell + shift; x < width + cell; x += cell) {
        for (let y = cell * 0.28; y < height; y += cell * 0.47) {
            ctx.globalAlpha = 0.12;
            ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
        }
    }
    ctx.restore();

    ctx.save();
    for (let i = 0; i < 28; i += 1) {
        const seed = i * 97.13;
        const y = ((seed * 13 + state.time * 17) % 1000) / 1000 * height;
        const x = width - ((offset * (0.55 + (i % 5) * 0.12) + seed * 8) % (width + 160)) + 40;
        const len = 18 + (i % 6) * 8;
        ctx.globalAlpha = 0.18 + (i % 4) * 0.08;
        ctx.strokeStyle = i % 3 === 0 ? "#7dffc3" : "#5ce1ff";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - len, y);
        ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = "#ff5a6a";
    const glitchX = width * 0.62 - (offset * 0.2) % 80;
    ctx.fillRect(glitchX, height * 0.18, 70, 8);
    ctx.fillRect(glitchX + 40, height * 0.74, 36, 6);
    ctx.restore();
}

function drawPlayer(ctx, state, world) {
    const x = playerWorldX(state, world);
    const y = state.player.y;
    const r = playerRadius(world.height);
    const hit = state.player.hitFlash > 0;
    const collect = state.player.collectFlash > 0;
    const inverted = state.player.controlInvert;
    const dashing = isPlayerDashing(state);

    ctx.save();

    if (dashing) {
        const trailLength = Math.max(r * 3, state.player.dashOffset * 0.45);
        const gradient = ctx.createLinearGradient(x - trailLength, y, x, y);
        gradient.addColorStop(0, "rgba(79, 216, 255, 0)");
        gradient.addColorStop(1, "rgba(125, 255, 195, 0.55)");
        ctx.fillStyle = gradient;
        ctx.fillRect(x - trailLength, y - r * 0.55, trailLength, r * 1.1);
    }
    ctx.translate(x, y);
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = inverted ? "#c77dff" : collect ? "#7dffc3" : hit ? "#ff6b78" : "#4fd8ff";
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.75, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = inverted ? "#f0d0ff" : hit ? "#ffd0d4" : "#9af6ff";
    ctx.fillStyle = inverted ? "#8b3dff" : hit ? "#ff4d5e" : "#19c6e8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(0, -r);
    ctx.lineTo(-r * 0.72, 0);
    ctx.lineTo(0, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#e9ffff";
    ctx.beginPath();
    ctx.arc(-r * 0.08, 0, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawErrors(ctx, state) {
    for (const error of state.errors) {
        ctx.save();
        ctx.translate(error.x, error.y);
        ctx.rotate(error.rot * 0.15);
        if (error.kind === "fast") {
            ctx.fillStyle = "rgba(255, 120, 70, 0.2)";
            ctx.beginPath();
            ctx.moveTo(error.r * 1.6, 0);
            ctx.lineTo(-error.r * 0.9, -error.r * 1.1);
            ctx.lineTo(-error.r * 0.9, error.r * 1.1);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#ff6a3a";
            ctx.strokeStyle = "#ffd0b8";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(error.r * 1.15, 0);
            ctx.lineTo(-error.r * 0.7, -error.r);
            ctx.lineTo(-error.r * 0.7, error.r);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (error.kind === "wobble") {
            ctx.fillStyle = "rgba(200, 60, 255, 0.18)";
            ctx.fillRect(-error.r * 1.5, -error.r * 1.2, error.r * 3, error.r * 2.4);
            ctx.fillStyle = "#c44a6a";
            ctx.strokeStyle = "#e9a0ff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-error.r, -error.r * 0.7);
            ctx.lineTo(error.r * 0.3, -error.r);
            ctx.lineTo(error.r, error.r * 0.2);
            ctx.lineTo(0.2 * error.r, error.r);
            ctx.lineTo(-error.r, error.r * 0.55);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillStyle = "rgba(255, 70, 90, 0.18)";
            ctx.fillRect(-error.r * 1.4, -error.r * 1.4, error.r * 2.8, error.r * 2.8);
            ctx.fillStyle = "#e23a4c";
            ctx.strokeStyle = "#ff8b97";
            ctx.lineWidth = 2;
            ctx.fillRect(-error.r, -error.r, error.r * 2, error.r * 2);
            ctx.strokeRect(-error.r, -error.r, error.r * 2, error.r * 2);
            ctx.strokeStyle = "#ffd5d8";
            ctx.beginPath();
            ctx.moveTo(-error.r * 0.45, -error.r * 0.45);
            ctx.lineTo(error.r * 0.45, error.r * 0.45);
            ctx.moveTo(error.r * 0.45, -error.r * 0.45);
            ctx.lineTo(-error.r * 0.45, error.r * 0.45);
            ctx.stroke();
        }
        ctx.restore();
    }
}

function drawData(ctx, state) {
    for (const item of state.dataItems) {
        const pulse = 1 + Math.sin(item.pulse) * 0.08;
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = "rgba(125, 255, 195, 0.16)";
        ctx.beginPath();
        ctx.arc(0, 0, item.r * 1.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#12c98a";
        ctx.strokeStyle = "#b9ffe4";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i += 1) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const px = Math.cos(angle) * item.r;
            const py = Math.sin(angle) * item.r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}


function drawBoss(ctx, state, world) {
    if (!state.boss) return;

    const boss = state.boss;
    const pulse = 1 + Math.sin(boss.pulse) * 0.05;
    const r = Math.max(34, world.height * 0.075);
    const flash = boss.damageFlash > 0;

    let x = boss.x;
    let alpha = 1;
    let defeatScale = 1;

    if (state.status === "boss-warning") {
        const total = 1.8;
        const progress = 1 - boss.warningTimer / total;
        const eased = 1 - Math.pow(1 - Math.max(0, Math.min(1, progress)), 3);
        x += (1 - eased) * world.width * 0.42;
    } else if (state.status === "boss-defeat") {
        const progress = 1 - boss.defeatTimer / 2.25;
        defeatScale = 1 + progress * 0.75;
        alpha = Math.max(0, 1 - progress);
    }

    const y = boss.y;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(pulse * defeatScale, pulse * defeatScale);

    ctx.globalAlpha = 0.16;
    ctx.fillStyle = flash ? "#ffffff" : "#ff365e";
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.95;
    ctx.fillStyle = flash ? "#fff4f6" : "#8f1639";
    ctx.strokeStyle = flash ? "#ffffff" : "#ff8b97";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(r * 1.25, 0);
    ctx.lineTo(r * 0.55, -r * 0.92);
    ctx.lineTo(-r * 0.55, -r * 0.92);
    ctx.lineTo(-r * 1.15, 0);
    ctx.lineTo(-r * 0.55, r * 0.92);
    ctx.lineTo(r * 0.55, r * 0.92);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = "#ff4d73";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, -r * 0.42);
    ctx.lineTo(r * 0.62, r * 0.42);
    ctx.moveTo(r * 0.62, -r * 0.42);
    ctx.lineTo(-r * 0.62, r * 0.42);
    ctx.stroke();

    ctx.fillStyle = "#ffe7ec";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
    ctx.fill();

    if (state.status === "boss-defeat") {
        ctx.globalAlpha = Math.max(0, 0.55 - (1 - alpha) * 0.55);
        ctx.strokeStyle = "#7dffc3";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r * (1.4 + (1 - alpha) * 5), 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

function drawBossBullets(ctx, state) {
    if (!state.boss) return;

    for (const bullet of state.boss.bullets) {
        ctx.save();
        ctx.translate(bullet.x, bullet.y);

        const trail = bullet.r * 3.4;
        const gradient = ctx.createLinearGradient(-trail, 0, bullet.r, 0);
        gradient.addColorStop(0, "rgba(255, 70, 100, 0)");
        gradient.addColorStop(1, "rgba(255, 95, 120, 0.7)");
        ctx.fillStyle = gradient;
        ctx.fillRect(-trail, -bullet.r * 0.45, trail, bullet.r * 0.9);

        ctx.fillStyle = "#ff476b";
        ctx.strokeStyle = "#ffd0d8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, bullet.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

function drawS3Beam(ctx, state, world) {
    if (state.player.s3Timer <= 0) return;

    const x = playerWorldX(state, world);
    const y = state.player.y;
    const r = playerRadius(world.height);
    const progress = state.player.s3Timer / CONFIG.s3Duration;
    const pulse = 1 + Math.sin(state.time * 28) * 0.08;
    const beamHeight = r * (1.6 + progress * 0.9);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const gradient = ctx.createLinearGradient(x, 0, world.width, 0);
    gradient.addColorStop(0, "rgba(125,255,195,0.95)");
    gradient.addColorStop(0.2, "rgba(92,225,255,0.72)");
    gradient.addColorStop(1, "rgba(92,225,255,0.04)");

    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.28;
    ctx.fillRect(x, y - beamHeight * 2.2, world.width - x, beamHeight * 4.4);

    ctx.globalAlpha = 0.92;
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y - beamHeight * 0.55 * pulse, world.width - x, beamHeight * 1.1 * pulse);

    ctx.strokeStyle = "#d8fff1";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.moveTo(x, y - beamHeight * 0.42);
    ctx.lineTo(world.width, y - beamHeight * 0.42);
    ctx.moveTo(x, y + beamHeight * 0.42);
    ctx.lineTo(world.width, y + beamHeight * 0.42);
    ctx.stroke();

    ctx.restore();
}

function drawParticles(ctx, state) {
    for (const particle of state.particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        ctx.restore();
    }
}

function renderFrame(ctx, state, world) {
    ctx.save();
    if (state.shake > 0) {
        const mag = state.shake * 7;
        ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }
    clearCanvas(ctx, world);
    drawEnvironment(ctx, world, state);
    drawData(ctx, state);
    if (!isBossMode(state)) {
        drawErrors(ctx, state);
    }

    if (state.boss) {
        drawBoss(ctx, state, world);
        drawBossBullets(ctx, state);
    }

    drawS3Beam(ctx, state, world);
    drawPlayer(ctx, state, world);
    drawParticles(ctx, state);

    if (state.status === "boss-defeat" && state.boss) {
        const progress = 1 - state.boss.defeatTimer / 2.25;
        ctx.save();
        ctx.fillStyle = `rgba(125,255,195,${Math.max(0, 0.18 * (1 - progress))})`;
        ctx.fillRect(0, 0, world.width, world.height);
        ctx.restore();
    }

    ctx.restore();
}
