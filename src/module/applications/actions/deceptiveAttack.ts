import { getCounterAttackLevel } from '../libs/miscellaneous';
import { MeleeAttack, Modifier, RangedAttack } from '../../types';
import { MODULE_NAME } from '../libs/constants';

export function addDeceptiveAttackModifierForDefense(
  isDeceptiveAttack: string,
  modifiers: {
    attack: Modifier[];
    defense: Modifier[];
    damage: Modifier[];
  },
) {
  if (isDeceptiveAttack && !isNaN(Number(isDeceptiveAttack)) && Number(isDeceptiveAttack) !== 0) {
    modifiers.defense.push({ mod: Number(isDeceptiveAttack) / 2, desc: 'Por ataque engañoso' });
  }
}
