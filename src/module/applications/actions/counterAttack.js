import { getCounterAttackLevel } from '../libs/miscellaneous';
import { MODULE_NAME } from '../libs/constants';
export function addCounterAttackModifiersForAttack(isCounterAttack, attacker, attack, modifiers) {
  if (isCounterAttack) {
    const newValue = getCounterAttackLevel(attacker, attack.name, attack.level);
    modifiers.attack.push({ mod: newValue - attack.level, desc: 'Por contraataque' });
  }
}
export function addCounterAttackModifiersForDefense(isCounterAttack, attacker, attack, modifiers, target) {
  if (isCounterAttack) {
    modifiers.defense.push({ mod: -2, desc: 'Por contraataque' });
    const successDefenses = attacker?.token?.getFlag(MODULE_NAME, 'successDefenses');
    const attackerId = target?.id;
    if (attackerId) {
      const roundSuccess = (successDefenses?.round || 0) === game.combat?.round ?? 0;
      const attackers = (roundSuccess && successDefenses?.attackers) || [];
      const attackerFiltered = attackers.filter((attackerS) => attackerId !== attackerS);
      attacker?.token?.setFlag(MODULE_NAME, 'successDefenses', {
        attackers: attackerFiltered,
        round: game.combat?.round ?? 0,
      });
    }
  }
}
//# sourceMappingURL=counterAttack.js.map
