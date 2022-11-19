import { getEquippedItems, getWeapon } from './weaponMacrosCTA';
import { Item, Skill } from '../../types';
import { isOffHandTrained } from './skillsDataExtractor';
import { hasAmbidexterity } from './advantagesDataExtractor';
import {
  meleeAttackWithRemainingRounds,
  rangedAttackWithRemainingRounds,
} from '../abstract/mixins/EasyCombatCommonAttackDefenseExtractor';

export async function checkOffHand(
  token: TokenDocument,
  attack: meleeAttackWithRemainingRounds | rangedAttackWithRemainingRounds,
  weapons: Item[],
): Promise<
  | {
      mod: number;
      desc: string;
    }
  | undefined
> {
  const equippedItems: {
    itemId: string;
    hand: string;
  }[] = await getEquippedItems(token);

  const isTrained: Skill | undefined = token?.actor ? isOffHandTrained(token?.actor, attack) : undefined;
  const ambidexterity: boolean = token?.actor ? hasAmbidexterity(token?.actor) : false;

  const weaponCarried = equippedItems.find((e) => e.itemId === attack.itemid);
  const weaponInHand: Item | undefined = weapons.find((w) => w.itemid === attack.itemid);
  const weaponDetails = getWeapon(weaponInHand?.name || '');

  if (weaponCarried) {
    if (weaponCarried.hand === 'OFF' && !ambidexterity && !weaponDetails?.ignoreOffHand) {
      return {
        mod: isTrained ? isTrained.level - attack.level : -4,
        desc: 'Por atacar con la mano mala',
      };
    }
  }
  return undefined;
}
