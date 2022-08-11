import { MeleeAttack, RangedAttack } from '../types';
import { getAttacks } from '../dataExtractor';
import {
  getNameFromAttack,
  meleeAttackWithRemainingRounds,
  rangedAttackWithRemainingRounds,
} from './attacksDataTransformation';
import { ensureDefined } from './miscellaneous';
import { checkOffHand } from './readyWeapons';
import AttackChooser from '../applications/attackChooser';

export async function calculateModifiersFromAttack(
  mode: 'ranged' | 'melee' | 'counter_attack' | 'disarm_attack',
  index: number,
  element: any | undefined,
  target: any,
  actor: Actor,
  token: Token,
  rangedData: rangedAttackWithRemainingRounds[],
  meleeData: meleeAttackWithRemainingRounds[],
  { isUsingFatigueForMoveAndAttack = false, isUsingFatigueForMightyBlows = false },
): Promise<{
  attack: MeleeAttack | RangedAttack;
  modifiers: any;
}> {
  const iMode = mode === 'counter_attack' || mode === 'disarm_attack' ? 'melee' : mode;
  let attack = getAttacks(actor)[iMode][index];
  let attackData: meleeAttackWithRemainingRounds | rangedAttackWithRemainingRounds;
  const attackModifiers = [];
  if (mode === 'ranged') {
    attackData = rangedData[index];
    const rangedAttacks = getAttacks(actor)[iMode] as RangedAttack[];
    const originalAttack = rangedAttacks.find((attack: any) => getNameFromAttack(attack, attackData));
    if (element) {
      if (originalAttack) {
        const attackValue = Number(element.find('.level').text());
        const diff = attackValue - originalAttack.level;
        if (diff >= 0) {
          attackModifiers.push({ mod: diff, desc: 'Por número de balas' });

          if (originalAttack.rof !== undefined) {
            originalAttack.rof = originalAttack.rof.trim();
          }
          attack = { ...originalAttack };
          attack.level = Number(element.find('.level').text());
          attack.rof = element.find('.rof').text().trim();
        }
      }
    }
  } else {
    attackData = meleeData[index];
    const meleeAttacks = getAttacks(actor)[iMode] as MeleeAttack[];
    const originalAttack = meleeAttacks.find((attack: MeleeAttack) => getNameFromAttack(attack, attackData));
    if (originalAttack) {
      attack = { ...originalAttack };
    }
  }

  const modifiers = AttackChooser.modifiersGetters[iMode](attack as RangedAttack & MeleeAttack, token, target, {
    isUsingFatigueForMoveAndAttack,
    isUsingFatigueForMightyBlows,
  });
  if (attackModifiers.length) modifiers.attack = [...modifiers.attack, ...attackModifiers];
  const offHandModifier = await checkOffHand(token.document, element ? attack : attackData);
  if (offHandModifier) {
    modifiers.attack = [...modifiers.attack, offHandModifier];
  }
  return {
    attack,
    modifiers,
  };
}
