import { getHitLocations } from '../../dataExtractor';
import { checkSingleTarget, ensureDefined, getTargets } from './miscellaneous';

export interface LocationToAttack {
  where: string;
  bonus: number;
}

export interface hitLocationsData {
  equipment: string;
  dr: string;
  roll: string;
  where: string;
  penalty: string;
}

interface hitLocationsObject {
  hitLocations: {
    items: hitLocationsData[];
    headers: string[];
    id: string;
  };
}

export function getHitLocationsObject(game: Game): Partial<hitLocationsObject> {
  ensureDefined(game?.user, 'game doesnt have user');
  if (!checkSingleTarget(game.user)) {
    return {};
  }
  const target = getTargets(game.user)[0];
  ensureDefined(target.actor, 'target has no actor');
  const hitLocationsValues = getHitLocations(target.actor) || [];
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

export function getLocationData(game: Game, location: string): any {
  ensureDefined(game?.user, 'game doesnt have user');
  if (!checkSingleTarget(game.user)) {
    return {};
  }
  const target = getTargets(game.user)[0];
  ensureDefined(target.actor, 'target has no actor');
  const hitLocationsValues = getHitLocations(target.actor) || [];
  return hitLocationsValues.find((l) => l.where.toUpperCase() === location.toUpperCase());
}
