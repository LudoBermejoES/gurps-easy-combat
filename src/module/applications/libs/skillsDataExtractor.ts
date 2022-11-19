import { findAdvantage, findSkillSpell } from './miscellaneous';
import { Skill } from '../../types';
import {
  meleeAttackWithRemainingRounds,
  rangedAttackWithRemainingRounds,
} from '../abstract/mixins/EasyCombatCommonAttackDefenseExtractor';

export function isOffHandTrained(
  actor: Actor,
  attack: meleeAttackWithRemainingRounds | rangedAttackWithRemainingRounds,
): Skill | undefined {
  let isTrained: Skill | undefined;
  if (actor) {
    let alternateName = attack.originalName;
    if (attack.originalName.toLowerCase().includes('knife')) {
      alternateName = 'Knife';
    }

    isTrained = findSkillSpell(actor, `Off-Hand Weapon Training (${alternateName})`, true, false);
  }
  return isTrained;
}

export function hasPowerBlow(actor: Actor): Skill | undefined {
  return findSkillSpell(actor, 'Power blow', true, false);
}
