function createInitialState() {
    return {
        status: "running",

        score: 0,
        dataCount: 0,
        hp: CONFIG.maxHp,

        player: {
            lane: 0,
            y: 0,
            initialized: false,
            hitFlash: 0,
            collectFlash: 0,
            controlInvert: false,
            invertTimer: 0,
        },

        // =========================
        // Skill System
        // =========================

        skills: {
            S1: {
                cooldown: 0,
                maxCooldown: 6,
                cost: 5,
            },

            S2: {
                cooldown: 0,
                maxCooldown: 8,
                cost: 3,
            },

            S3: {
                cooldown: 0,
                maxCooldown: 4,
                cost: 8,
            },
        },

        errors: [],
        dataItems: [],
        glitches: [],

        particles: [],

        spawnQueue: [],

        patternReadyAt: 0.45,

        scrollOffset: 0,
        time: 0,

        shake: 0,
        glitchFlash: 0,

        lastSpawnLane: 1,
    };
}