function circlesOverlap(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const limit = a.r + b.r;
    return dx * dx + dy * dy < limit * limit;
}

function findFirstHit(source, targets) {
    for (const target of targets) {
        if (circlesOverlap(source, target)) return target;
    }
    return null;
}
