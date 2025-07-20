/**
 * Sample bot code for the Orb Collect game
 * Provides a basic strategy for collecting orbs and depositing them at bases
 */

export const sampleBotCode = `function loop(input, store) {
  if (!store.target) {
    store.target = null;
  }

  let action = { type: 'idle' };

  if (input.hasOrb) {
    if (input.base) {
      const myBase = input.base;
      const dx = myBase.position.x - input.botPosition.x;
      const dy = myBase.position.y - input.botPosition.y;
      
      if (myBase.distance < 30) {
        action = { type: 'deposit' };
      } else {
        action = { type: 'move', dx, dy };
      }
    }
  } else {
    if (input.orbs.length > 0) {
      const closestOrb = input.orbs[0];
      const dx = closestOrb.position.x - input.botPosition.x;
      const dy = closestOrb.position.y - input.botPosition.y;
      
      if (closestOrb.distance < 20) {
        action = { type: 'pickup' };
      } else {
        action = { type: 'move', dx, dy };
      }
    }
  }

  return { action, store };
}`;