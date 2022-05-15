import { getAttacks, getEquipment } from '../dataExtractor';
import { Item } from '../types';

export function getWeaponsFromAttacks(actor: Actor): Item[] {
  const weaponData: Item[] = [];
  const { melee, ranged } = getAttacks(actor);

  const weapons = new Set();
  melee.filter((m) => m.itemid).forEach((attack) => weapons.add(attack.itemid));
  ranged.filter((m) => m.itemid).forEach((attack) => weapons.add(attack.itemid));

  const items: Item[] = getEquipment(actor);
  weapons.forEach((weapon) => {
    const weaponItem = items.filter((item) => item.itemid === weapon);
    if (weaponItem.length) weaponData.push(weaponItem[0]);
  });
  return weaponData;
}
