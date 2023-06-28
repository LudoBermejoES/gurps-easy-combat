import { getEquippedItems, getWeapon } from './weaponMacrosCTA';
import { isOffHandTrained } from './skillsDataExtractor';
import { hasAmbidexterity } from './advantagesDataExtractor';
export async function checkOffHand(token, attack, weapons) {
  const equippedItems = await getEquippedItems(token);
  const isTrained = token?.actor ? isOffHandTrained(token?.actor, attack) : undefined;
  const ambidexterity = token?.actor ? hasAmbidexterity(token?.actor) : false;
  const weaponCarried = equippedItems.find((e) => e.itemId === attack.itemid);
  const weaponInHand = weapons.find((w) => w.itemid === attack.itemid);
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
//# sourceMappingURL=offHand.js.map
