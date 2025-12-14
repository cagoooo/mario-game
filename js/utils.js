export function checkCollision(obj1, obj2) {
  return obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y;
}

export function isEntityVisible(entity, camera, viewportWidth, viewportHeight, padding = 100) {
  return (
    entity.x + entity.width > camera.x - padding &&
    entity.x < camera.x + viewportWidth + padding &&
    entity.y + entity.height > camera.y - padding &&
    entity.y < camera.y + viewportHeight + padding
  );
}
