import { findSkillSpell } from './miscellaneous';
import { meleeAttackWithRemainingRounds, rangedAttackWithRemainingRounds } from './attacksDataTransformation';
import { Skill } from '../../types';

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
