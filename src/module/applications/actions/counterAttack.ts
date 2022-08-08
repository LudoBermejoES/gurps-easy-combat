import { getCounterAttackLevel } from '../../util/miscellaneous';
import { MeleeAttack, Modifier, RangedAttack } from '../../types';
import { MODULE_NAME } from '../../util/constants';

export function addCounterAttackModifiersForAttack(
  isCounterAttack: boolean,
  attacker: Actor,
  attack: MeleeAttack | RangedAttack,
  modifiers: {
    attack: Modifier[];
    defense: Modifier[];
    damage: Modifier[];
  },
) {
  if (isCounterAttack) {
    const newValue = getCounterAttackLevel(attacker, attack.name, attack.level);
    modifiers.attack.push({ mod: newValue - attack.level, desc: 'Por contraataque' });
  }
}

export function addCounterAttackModifiersForDefense(
  isCounterAttack: boolean,
  attacker: Actor,
  attack: MeleeAttack | RangedAttack,
  modifiers: {
    attack: Modifier[];
    defense: Modifier[];
    damage: Modifier[];
  },
  target: Token,
) {
  if (isCounterAttack) {
    modifiers.defense.push({ mod: -2, desc: 'Por contraataque' });

    const successDefenses = <{ attackers: string[]; round: number } | undefined>(
      attacker?.token?.getFlag(MODULE_NAME, 'successDefenses')
    );

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
