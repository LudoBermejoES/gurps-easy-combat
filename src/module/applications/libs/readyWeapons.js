import { getEquippedItems } from './weaponMacrosCTA';
import { easyCombatActorfromActor } from '../abstract/EasyCombatActor';
export async function removeWeapon(chooser, token, weapon) {
  console.log('TRATO DE ELIMINAR ', weapon);
  const actor = easyCombatActorfromActor(chooser.actor);
  const weapons = actor.getWeaponsFromAttacks();
  const weaponToRemove = weapons.find((w) => w.itemid === weapon.itemId);
  if (weaponToRemove) {
    console.log('ELIMINO ', weaponToRemove);
    return chooser.unReadyWeapon(weaponToRemove);
  }
  return Promise.resolve();
}
export async function checkIfRemoveWeaponFromHandNeeded(chooser, token, hand) {
  const equipped = await getEquippedItems(token);
  const removeFromHandItems = equipped.filter((e) => e.hand === hand || e.hand === 'BOTH' || hand === 'BOTH');
  console.log('Total a eliminar', removeFromHandItems);
  const promises = [];
  if (removeFromHandItems.length >= 0) {
    removeFromHandItems.forEach((weapon) => promises.push(removeWeapon(chooser, token, weapon)));
  }
  await Promise.allSettled(promises);
}
export async function getWeaponsInHands(token) {
  const equipped = await getEquippedItems(token);
  const onHand = equipped.find((e) => e.hand === 'ON');
  const offHand = equipped.find((e) => e.hand === 'OFF');
  return {
    onHand,
    offHand,
  };
}
//# sourceMappingURL=readyWeapons.js.map
