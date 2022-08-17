import { MeleeAttack, RangedAttack } from '../types';
import { getAttacks } from '../dataExtractor';
import {
  getNameFromAttack,
  meleeAttackWithRemainingRounds,
  rangedAttackWithRemainingRounds,
} from './attacksDataTransformation';
import { checkOffHand } from './readyWeapons';
import AttackChooser from '../applications/attackChooser';
import { equippedItem, getEquippedItems } from './weaponMacrosCTA';

export async function calculateModifiersFromAttack(
  mode: 'ranged' | 'melee' | 'counter_attack' | 'disarm_attack',
  index: number,
  element: any | undefined,
  target: any,
  actor: Actor,
  token: Token,
  rangedData: rangedAttackWithRemainingRounds[],
  meleeData: meleeAttackWithRemainingRounds[],
  {
    isUsingFatigueForMoveAndAttack = false,
    isUsingFatigueForMightyBlows = false,
    isUsingDeceptiveAttack = '',
    isRapidStrikeAttacks = false,
  },
  removeFlags = false,
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

  const modifiers = AttackChooser.modifiersGetters[iMode](
    attack as RangedAttack & MeleeAttack,
    token,
    target,
    removeFlags,
    {
      isUsingFatigueForMoveAndAttack,
      isUsingFatigueForMightyBlows,
      isUsingDeceptiveAttack,
      isRapidStrikeAttacks,
    },
  );
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

export async function calculateDefenseModifiersFromEquippedWeapons(
  actor: Actor,
  token: Token,
): Promise<{
  bonusDodge: number;
  bonusParry: number;
  bonusBlock: number;
}> {
  const equippedWeapons: equippedItem[] = await getEquippedItems(token.document);
  let bonusDodge = 0;
  let bonusParry = 0;
  let bonusBlock = 0;
  equippedWeapons.forEach((weapon: equippedItem) => {
    const item: any = actor.data.items.contents.find((item: any) => item.data._id === weapon.itemId);
    if (!item) return;
    const found = ['SHIELD', 'CLOAK'].find((m) => item.data.name.toUpperCase().includes(m));
    if (found) {
      const bonuses = item.data.data.bonuses.split('\n');
      for (const bonus of bonuses) {
        if (bonus.toUpperCase().includes('DODGE')) {
          const parts = bonus.toUpperCase().split('DODGE ');
          if (parts.length === 2 && !isNaN(parts[1])) {
            bonusDodge += Number(parts[1]);
          }
        } else if (bonus.toUpperCase().includes('PARRY')) {
          const parts = bonus.toUpperCase().split('PARRY ');
          if (parts.length === 2 && !isNaN(parts[1])) {
            bonusParry += Number(parts[1]);
          }
        } else if (bonus.toUpperCase().includes('BLOCK')) {
          const parts = bonus.toUpperCase().split('BLOCK ');
          if (parts.length === 2 && !isNaN(parts[1])) {
            bonusBlock += Number(parts[1]);
          }
        }
      }
    }
  });
  return {
    bonusDodge,
    bonusParry,
    bonusBlock,
  };
}
