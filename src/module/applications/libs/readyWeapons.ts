import { Item, MeleeAttack, RangedAttack, ReadyManeouverNeeded, Skill } from '../../types';
import { MODULE_NAME } from './constants';
import { getEquippedItems, removeItemById } from './weaponMacrosCTA';
import { getAttacks } from '../../dataExtractor';
import { getWeaponsFromAttacks } from './weapons';
import AttackChooser from '../attackChooser';
import { meleeAttackWithRemainingRounds, rangedAttackWithRemainingRounds } from './attacksDataTransformation';
import { findSkillSpell } from './miscellaneous';
import { isOffHandTrained } from './skillsDataExtractor';
import { hasAmbidexterity } from './advantagesDataExtractor';

export function getReadyActionsWeaponNeeded(document: TokenDocument): { items: ReadyManeouverNeeded[] } {
  return <{ items: ReadyManeouverNeeded[] }>document.getFlag(MODULE_NAME, 'readyActionsWeaponNeeded');
}

export async function prepareReadyWeapons(actor: Actor, token: TokenDocument, user: User) {
  const attacks: {
    melee: MeleeAttack[];
    ranged: RangedAttack[];
  } = getAttacks(actor);

  const meleeWeaponIds: string[] = attacks.melee.map((melee) => melee.itemid).filter((i) => i !== undefined);
  const rangedWeaponIds: string[] = attacks.ranged.map((melee) => melee.itemid).filter((i) => i !== undefined);
  const equippedItems: { itemId: string; hand: string }[] = await getEquippedItems(token);
  await token.setFlag(MODULE_NAME, 'readyActionsWeaponNeeded', {
    items: Array.from(new Set([...meleeWeaponIds, ...rangedWeaponIds]))
      .filter((item) => !equippedItems.find((i) => i.itemId === item))
      .map((item) => {
        let remainingRounds = 1;

        const rangedAttack: RangedAttack | undefined = attacks.ranged.find((i) => i.itemid === item);
        if (rangedAttack) {
          const numberOfShots: string = rangedAttack.shots.split('(')[0];
          if (!isNaN(Number(numberOfShots)) && Number(numberOfShots) === 1) {
            if (rangedAttack.shots.includes('(')) {
              remainingRounds = Number(rangedAttack.shots.split('(')[1].split(')')[0]) + 1;
            } else {
              remainingRounds = Number(rangedAttack.shots);
            }
          }
        }

        return {
          itemId: item,
          remainingRounds,
        };
      }),
  });
}

export async function removeWeapon(chooser: AttackChooser, token: TokenDocument, weapon: any) {
  console.log('TRATO DE ELIMINAR ', weapon);
  const weapons: Item[] = getWeaponsFromAttacks(chooser.actor);
  const weaponToRemove: Item | undefined = weapons.find((w) => w.itemid === weapon.itemId);
  if (weaponToRemove) {
    console.log('ELIMINO ', weaponToRemove);
    return chooser.unReadyWeapon(weaponToRemove, token);
  }
  return Promise.resolve();
}

export async function checkIfRemoveWeaponFromHandNeeded(chooser: AttackChooser, token: TokenDocument, hand: string) {
  const equipped = await getEquippedItems(token);
  const removeFromHandItems = equipped.filter((e) => e.hand === hand || e.hand === 'BOTH' || hand === 'BOTH');
  console.log('Total a eliminar', removeFromHandItems);
  const promises: Promise<void>[] = [];
  if (removeFromHandItems.length >= 0) {
    removeFromHandItems.forEach((weapon) => promises.push(removeWeapon(chooser, token, weapon)));
  }
  await Promise.allSettled(promises);
}
