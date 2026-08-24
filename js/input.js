function bindInput({
    playfield,
    restartBtn,
    startBtn,
    victoryRestartBtn,
    onStart,
    onSpace,
    onSwitch,
    onSkill,
    onRestart,
    onPointerMove,
    onMoveInput,
}) {
    function pointerPosition(event) {
        const rect = playfield.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    playfield.addEventListener("pointerdown", (event) => {
        if (event.target.closest("#start-screen")) return;
        if (event.target.closest("#game-over")) return;
        if (event.target.closest("#victory")) return;
        if (event.target.closest(".skill-button")) return;

        event.preventDefault();
        if (event.pointerType === "mouse") {
            playfield.setPointerCapture?.(event.pointerId);
        }
        onPointerMove(pointerPosition(event));
        onSwitch();
    });

    playfield.addEventListener("pointermove", (event) => {
        if (event.target.closest(".skill-button")) return;
        if (event.pointerType === "mouse" && event.buttons === 0) return;
        onPointerMove(pointerPosition(event));
    });

    playfield.addEventListener("pointerup", (event) => {
        if (event.pointerType === "mouse") {
            playfield.releasePointerCapture?.(event.pointerId);
        }
    });

    if (startBtn) {
        startBtn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            onStart();
        });
        startBtn.addEventListener("pointerdown", (event) => {
            event.stopPropagation();
        });
    }

    if (victoryRestartBtn) {
        victoryRestartBtn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            onRestart();
        });
    }

    restartBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onRestart();
    });

    for (const [id, skill] of [["skill-s1", "S1"], ["skill-s2", "S2"], ["skill-s3", "S3"]]) {
        const button = document.getElementById(id);
        if (!button) continue;
        button.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            event.stopPropagation();
            onSkill(skill);
        });
    }

    const keys = new Set();
    function updateKeyboardMovement() {
        let x = 0;
        let y = 0;
        if (keys.has("ArrowLeft") || keys.has("KeyA")) x -= 1;
        if (keys.has("ArrowRight") || keys.has("KeyD")) x += 1;
        if (keys.has("ArrowUp")) y -= 1;
        if (keys.has("ArrowDown")) y += 1;
        const length = Math.hypot(x, y) || 1;
        onMoveInput(x / length, y / length);
    }

    window.addEventListener("keydown", (event) => {
        if (event.repeat) return;

        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyA", "KeyD"].includes(event.code)) {
            event.preventDefault();
            keys.add(event.code);
            updateKeyboardMovement();
            return;
        }

        if (event.code === "Space") {
            event.preventDefault();
            onSpace();
            return;
        }
        if (event.code === "KeyE") {
            event.preventDefault();
            onSkill("S1");
            return;
        }
        if (event.code === "KeyQ") {
            event.preventDefault();
            onSkill("S2");
            return;
        }
        if (event.code === "KeyW") {
            event.preventDefault();
            onSkill("S3");
        }
    });

    window.addEventListener("keyup", (event) => {
        if (!keys.has(event.code)) return;
        keys.delete(event.code);
        updateKeyboardMovement();
    });
}
