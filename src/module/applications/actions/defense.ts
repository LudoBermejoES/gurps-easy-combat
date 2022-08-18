import { addCounterAttackModifiersForDefense } from './counterAttack';
import DefenseChooser from '../defenseChooser';
import { doAnimationDefense } from '../../util/animations';
import { MODULE_NAME } from '../../util/constants';
import { GurpsRoll, MeleeAttack, Modifier, RangedAttack } from '../../types';
import { getEquippedItems } from '../../util/weaponMacrosCTA';
import { addDeceptiveAttackModifierForDefense } from './deceptiveAttack';

export default async function rollDefense(
  roll: GurpsRoll,
  attacker: Actor,
  attackerToken: Token,
  attack: MeleeAttack | RangedAttack,
  modifiers: {
    attack: Modifier[];
    defense: Modifier[];
    damage: Modifier[];
  },
  target: Token,
  { isCounterAttack = false, isDeceptiveAttack = '', isDisarmingAttack = false },
): Promise<boolean> {
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
    const successDefenses = <{ attackers: string[]; round: number } | undefined>(
      target.document.getFlag(MODULE_NAME, 'successDefenses')
    );

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
