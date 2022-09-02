import { Item } from '../../types';
import { getEquippedItems } from './weaponMacrosCTA';
import AttackChooser from '../attackChooser';
import EasyCombatActor, { easyCombatActorfromActor } from '../abstract/EasyCombatActor';

export async function removeWeapon(chooser: AttackChooser, token: TokenDocument, weapon: any) {
  console.log('TRATO DE ELIMINAR ', weapon);
  const actor: EasyCombatActor = easyCombatActorfromActor(chooser.actor);
  const weapons: Item[] = actor.getWeaponsFromAttacks();
  const weaponToRemove: Item | undefined = weapons.find((w) => w.itemid === weapon.itemId);
  if (weaponToRemove) {
    console.log('ELIMINO ', weaponToRemove);
    return chooser.unReadyWeapon(weaponToRemove);
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
