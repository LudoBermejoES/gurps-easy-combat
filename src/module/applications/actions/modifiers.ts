import { MeleeAttack, Modifier, RangedAttack } from '../../types';
import { ensureDefined } from '../libs/miscellaneous';
import EasyCombatActor from '../abstract/EasyCombatActor';

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
    isCounterAttack = false,
    isDisarmAttack = false,
  },
): {
  attack: Modifier[];
  defense: Modifier[];
  damage: Modifier[];
} {
  ensureDefined(token.actor, 'No hay actor en el token');
  const actor: EasyCombatActor = token.actor as EasyCombatActor;
  return actor.getMeleeModifiers(attack, target, removeFlags, {
    isUsingFatigueForMoveAndAttack,
    isUsingFatigueForMightyBlows,
    isUsingDeceptiveAttack,
    isRapidStrikeAttacks,
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
    isCounterAttack = false,
    isDisarmAttack = false,
  },
): {
  attack: Modifier[];
  defense: Modifier[];
  damage: Modifier[];
} {
  ensureDefined(token.actor, 'No hay actor en el token');
  const actor: EasyCombatActor = token.actor as EasyCombatActor;
  return actor.getRangedModifiers(attack, target, removeFlags, {
    isUsingFatigueForMoveAndAttack,
    isUsingFatigueForMightyBlows,
    isRapidStrikeAttacks,
    isCounterAttack,
    isDisarmAttack,
  });
}
