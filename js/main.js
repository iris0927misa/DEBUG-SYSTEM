const canvas = document.getElementById("game");
const playfield = document.getElementById("playfield");
const restartBtn = document.getElementById("restart-btn");
const startBtn = document.getElementById("start-btn");
const victoryRestartBtn = document.getElementById("victory-restart-btn");

const skillButtons = {
    S1: document.getElementById("skill-s1"),
    S2: document.getElementById("skill-s2"),
    S3: document.getElementById("skill-s3"),
};

const hudBar = document.querySelector(".hud");

const game = createGame(canvas, {
    score: document.getElementById("score"),
    dataCount: document.getElementById("data-count"),
    hp: document.getElementById("hp"),

    gameOver: document.getElementById("game-over"),
    finalScore: document.getElementById("final-score"),
    finalData: document.getElementById("final-data"),

    hudBar,
    skillButtons,
    bossHud: document.getElementById("boss-hud"),
    bossHpFill: document.getElementById("boss-hp-fill"),
    bossHpText: document.getElementById("boss-hp-text"),
    bossWarning: document.getElementById("boss-warning"),
    victory: document.getElementById("victory"),
    victoryScore: document.getElementById("victory-score"),
    victoryData: document.getElementById("victory-data"),
    startScreen: document.getElementById("start-screen"),
});

function measurePlayfield() {
    const rect = playfield.getBoundingClientRect();

    const hudHeight = hudBar
        ? hudBar.offsetHeight
        : 0;

    const width =
        rect.width ||
        playfield.clientWidth ||
        window.innerWidth ||
        320;

    let height =
        rect.height ||
        playfield.clientHeight;

    if (height < 100) {
        height =
            window.innerHeight -
            hudHeight;
    }

    return {
        width: Math.max(320, width),
        height: Math.max(180, height),
    };
}

function fitCanvas() {
    const {
        width,
        height,
    } = measurePlayfield();

    const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
    );

    game.resize(
        width,
        height,
        dpr
    );
}

bindInput({
    playfield,

    restartBtn,
    startBtn,
    victoryRestartBtn,

    onStart: () =>
        game.begin(),

    onSpace: () =>
        game.handleSpace(),

    onSwitch: () =>
        game.switchPosition(),

    onRestart: () =>
        game.restart(),

    onSkill: (skill) =>
        game.useSkill(skill),

    onPointerMove: ({ x, y }) =>
        game.setPointerPosition(x, y),

    onMoveInput: (x, y) =>
        game.setMoveInput(x, y),
});

window.addEventListener(
    "resize",
    fitCanvas
);

window.addEventListener(
    "orientationchange",
    fitCanvas
);

window.addEventListener(
    "load",
    fitCanvas
);

if (window.ResizeObserver) {
    new ResizeObserver(
        fitCanvas
    ).observe(playfield);
}

fitCanvas();

requestAnimationFrame(() => {
    fitCanvas();
    game.start();
});