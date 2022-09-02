import { getEquippedItems } from './weaponMacrosCTA';
import { Skill } from '../../types';
import { isOffHandTrained } from './skillsDataExtractor';
import { hasAmbidexterity } from './advantagesDataExtractor';
import {
  meleeAttackWithRemainingRounds,
  rangedAttackWithRemainingRounds,
} from '../abstract/mixins/EasyCombatCommonAttackDefenseExtractor';

export async function checkOffHand(
  token: TokenDocument,
  attack: meleeAttackWithRemainingRounds | rangedAttackWithRemainingRounds,
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
  if (weaponCarried) {
    if (weaponCarried.hand === 'OFF' && !ambidexterity) {
      return {
        mod: isTrained ? isTrained.level - attack.level : -4,
        desc: 'Por atacar con la mano mala',
      };
    }
  }
  return undefined;
}
