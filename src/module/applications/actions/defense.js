import { addCounterAttackModifiersForDefense } from './counterAttack';
import DefenseChooser from '../defenseChooser';
import { doAnimationDefense } from '../libs/animations';
import { MODULE_NAME } from '../libs/constants';
import { addDeceptiveAttackModifierForDefense } from './deceptiveAttack';
export default async function rollDefense(
  roll,
  attacker,
  attackerToken,
  attack,
  modifiers,
  target,
  { isCounterAttack = false, isDeceptiveAttack = '', isDisarmingAttack = false },
) {
  if (!target.actor) {
    ui.notifications?.error('target has no actor');
    return true;
  }
  addCounterAttackModifiersForDefense(isCounterAttack, attacker, attack, modifiers, target);
  addDeceptiveAttackModifierForDefense(isDeceptiveAttack, modifiers);
  const defenseSucess = await DefenseChooser.requestDefense(
    target,
    modifiers.defense,
    attackerToken.id,
    !isDisarmingAttack,
  );
  doAnimationDefense(target.actor, defenseSucess);
  if (defenseSucess) {
    const successDefenses = target.document.getFlag(MODULE_NAME, 'successDefenses');
    const attackerId = attacker?.token?.id;
    if (attackerId) {
      const roundSuccess = (successDefenses?.round || 0) === game.combat?.round ?? 0;
      const attackers = (roundSuccess && successDefenses?.attackers) || [];
      target.document.setFlag(MODULE_NAME, 'successDefenses', {
        attackers: [...attackers, attackerId],
        round: game.combat?.round ?? 0,
      });
    }
    if (roll.rofrcl) {
      const total = roll.rofrcl - (GURPS.lastTargetedRoll.margin + 1);
      if (total <= 0) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
    return true;
  }
  return true;
}
//# sourceMappingURL=defense.js.map
