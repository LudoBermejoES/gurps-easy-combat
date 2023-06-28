import { checkSingleTarget, ensureDefined, getTargets } from './miscellaneous';
import { easyCombatActorfromActor } from '../abstract/EasyCombatActor';
export function getHitLocationsObject(game) {
  ensureDefined(game?.user, 'game doesnt have user');
  if (!checkSingleTarget(game.user)) {
    return {};
  }
  const target = getTargets(game.user)[0];
  ensureDefined(target.actor, 'target has no actor');
  const hitLocationsValues = easyCombatActorfromActor(target.actor).getHitLocations() || [];
  const hitLocationsResult = hitLocationsValues.map(({ equipment, dr, roll, where, penalty }) => ({
    equipment,
    dr,
    roll,
    where,
    penalty,
  }));
  return {
    hitLocations: {
      items: hitLocationsResult,
      headers: ['roll', 'where', 'penalty', 'dr'],
      id: 'hit_locations',
    },
  };
}
export function getLocationData(game, location) {
  ensureDefined(game?.user, 'game doesnt have user');
  if (!checkSingleTarget(game.user, false)) {
    return {};
  }
  const target = getTargets(game.user)[0];
  ensureDefined(target.actor, 'target has no actor');
  const hitLocationsValues = easyCombatActorfromActor(target.actor).getHitLocations() || [];
  return hitLocationsValues.find((l) => l.where.toUpperCase() === location.toUpperCase());
}
//# sourceMappingURL=locationsDataTransformation.js.map
