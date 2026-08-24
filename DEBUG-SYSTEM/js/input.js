function bindInput({
    playfield,
    restartBtn,
    onSwitch,
    onSkill,
    onRestart,
}) {
    playfield.addEventListener("pointerdown", (event) => {
        if (event.target.closest("#game-over")) {
            onRestart();
            return;
        }

        if (event.target.closest(".skill-button")) {
            return;
        }

        event.preventDefault();
        onSwitch();
    });

    restartBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onRestart();
    });

    const skillS1 = document.getElementById("skill-s1");
    const skillS2 = document.getElementById("skill-s2");
    const skillS3 = document.getElementById("skill-s3");

    if (skillS1) {
        skillS1.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            event.stopPropagation();
            onSkill("S1");
        });
    }

    if (skillS2) {
        skillS2.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            event.stopPropagation();
            onSkill("S2");
        });
    }

    if (skillS3) {
        skillS3.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            event.stopPropagation();
            onSkill("S3");
        });
    }

    window.addEventListener("keydown", (event) => {
        if (event.repeat) return;

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
            return;
        }

        if (event.code === "Space") {
            event.preventDefault();
            onSwitch();
        }
    });
}