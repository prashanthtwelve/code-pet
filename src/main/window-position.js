function restorePosition(position, workArea, size = 200) {
  const minX = workArea.x;
  const minY = workArea.y;
  const maxX = Math.max(minX, workArea.x + workArea.width - size);
  const maxY = Math.max(minY, workArea.y + workArea.height - size);
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) {
    return { x: maxX, y: maxY };
  }
  return {
    x: Math.min(maxX, Math.max(minX, Math.round(position.x))),
    y: Math.min(maxY, Math.max(minY, Math.round(position.y))),
  };
}

function dragPosition(origin, pointer) {
  return {
    x: origin.position.x + pointer.x - origin.pointer.x,
    y: origin.position.y + pointer.y - origin.pointer.y,
  };
}

function isPointOverPet(point, windowBounds, petSize = 112) {
  const insetX = (windowBounds.width - petSize) / 2;
  const insetY = (windowBounds.height - petSize) / 2;
  return point.x >= windowBounds.x + insetX
    && point.x <= windowBounds.x + insetX + petSize
    && point.y >= windowBounds.y + insetY
    && point.y <= windowBounds.y + insetY + petSize;
}

module.exports = { restorePosition, dragPosition, isPointOverPet };
