import { ensureDefined } from '../libs/miscellaneous';
import { easyCombatActorfromActor } from '../abstract/EasyCombatActor';
export function getMeleeModifiers(
  attack,
  token,
  target,
  removeFlags = false,
  {
    isUsingFatigueForMoveAndAttack = false,
    isUsingFatigueForMightyBlows = false,
    isUsingDeceptiveAttack = '',
    isRapidStrikeAttacks = false,
    isUsingTwoWeapons = false,
    isCounterAttack = false,
    isDisarmAttack = false,
  },
) {
  ensureDefined(token.actor, 'No hay actor en el token');
  const actor = easyCombatActorfromActor(token.actor);
  return actor.getMeleeModifiers(attack, target, removeFlags, {
    isUsingFatigueForMoveAndAttack,
    isUsingFatigueForMightyBlows,
    isUsingDeceptiveAttack,
    isRapidStrikeAttacks,
    isUsingTwoWeapons,
    isCounterAttack,
    isDisarmAttack,
  });
}
export function getRangedModifiers(
  attack,
  token,
  target,
  removeFlags = false,
  {
    isUsingFatigueForMoveAndAttack = false,
    isUsingFatigueForMightyBlows = false,
    isRapidStrikeAttacks = false,
    isUsingTwoWeapons = false,
    isCounterAttack = false,
    isDisarmAttack = false,
  },
) {
  console.log('Tengo que quitar flags', removeFlags);
  ensureDefined(token.actor, 'No hay actor en el token');
  const actor = easyCombatActorfromActor(token.actor);
  return actor.getRangedModifiers(attack, target, removeFlags, {
    isUsingFatigueForMoveAndAttack,
    isUsingFatigueForMightyBlows,
    isRapidStrikeAttacks,
    isUsingTwoWeapons,
    isCounterAttack,
    isDisarmAttack,
  });
}
//# sourceMappingURL=modifiers.js.map
