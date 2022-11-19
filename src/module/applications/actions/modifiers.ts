import { MeleeAttack, Modifier, RangedAttack } from '../../types';
import { ensureDefined } from '../libs/miscellaneous';
import EasyCombatActor, { easyCombatActorfromActor } from '../abstract/EasyCombatActor';

export function getMeleeModifiers(
  attack: MeleeAttack,
  token: Token,
  target: Token,
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
): {
  attack: Modifier[];
  defense: Modifier[];
  damage: Modifier[];
} {
  ensureDefined(token.actor, 'No hay actor en el token');
  const actor: EasyCombatActor = easyCombatActorfromActor(token.actor);
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
  attack: RangedAttack,
  token: Token,
  target: Token,
  removeFlags = false,
  {
    isUsingFatigueForMoveAndAttack = false,
    isUsingFatigueForMightyBlows = false,
    isRapidStrikeAttacks = false,
    isUsingTwoWeapons = false,
    isCounterAttack = false,
    isDisarmAttack = false,
  },
): {
  attack: Modifier[];
  defense: Modifier[];
  damage: Modifier[];
} {
  ensureDefined(token.actor, 'No hay actor en el token');
  const actor: EasyCombatActor = easyCombatActorfromActor(token.actor);
  return actor.getRangedModifiers(attack, target, removeFlags, {
    isUsingFatigueForMoveAndAttack,
    isUsingFatigueForMightyBlows,
    isRapidStrikeAttacks,
    isUsingTwoWeapons,
    isCounterAttack,
    isDisarmAttack,
  });
}
