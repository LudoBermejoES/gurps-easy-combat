import { getAttacks, getEquipment } from '../dataExtractor';
import { Item, RangedAttack } from '../types';
import { ensureDefined } from './miscellaneous';

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

export function getWeaponFromAttack(actor: Actor, attack: RangedAttack): Item | undefined {
  const weapons: Item[] = getEquipment(actor);
  const { ranged } = getAttacks(actor);
  ensureDefined(ranged, 'No tienes ataques a distancia');
  const weapon: Item | undefined = weapons.find((w: Item) => w.itemid === attack.itemid);
  return weapon;
}

function getFinalItem(
  item: Item,
  st: string,
): {
  ammo: Item;
  st: string;
} {
  let itemToReturn: {
    ammo: Item;
    st: string;
  } = { ammo: item, st };
  if (Object.keys(item.contains).length) {
    Object.keys(item.contains).forEach((id) => {
      itemToReturn = { ammo: item.contains[id], st: st + '.contains.' + id };
      if (Object.keys(item.contains[id].contains).length) {
        itemToReturn = getFinalItem(item.contains[id], itemToReturn.st);
      }
    });
  }
  return itemToReturn;
}

export function getAmmunnitionFromInventory(
  actor: Actor,
  itemid: string,
  st: string,
):
  | {
      ammo: Item;
      st: string;
    }
  | undefined {
  let weapon = '';
  Object.keys(actor.data.data.equipment.carried).forEach((key) => {
    const item: Item = actor.data.data.equipment.carried[key];
    if (item.itemid === itemid) {
      weapon = key;
    }
  });

  if (weapon) {
    const found: { ammo: Item; st: string } = getFinalItem(
      actor.data.data.equipment.carried[weapon],
      st + '.' + weapon,
    );
    if (found.ammo.itemid !== itemid) {
      return found;
    } else {
      return {
        ammo: actor.data.data.equipment.carried[weapon],
        st: st + '.' + weapon,
      };
    }
  }
  return undefined;
}
