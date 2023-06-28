import { clearAmmunition, refreshAmmo } from '../../libs/weaponMacrosCTA';
import { MODULE_NAME } from '../../libs/constants';
import EasyCombatBaseExtractor from './EasyCombatBaseExtractor';
import { applyMixins } from '../../libs/mixins';
class EasyCombatInventoryExtractor {
  getFinalItem(item, st) {
    let itemToReturn = { ammo: item, st };
    if (Object.keys(item.contains).length) {
      Object.keys(item.contains).forEach((id) => {
        itemToReturn = { ammo: item.contains[id], st: st + '.contains.' + id };
        if (Object.keys(item.contains[id].contains).length) {
          itemToReturn = this.getFinalItem(item.contains[id], itemToReturn.st);
        }
      });
    }
    return itemToReturn;
  }
  getAmmunnitionFromInventory(itemid, st) {
    const data = this.getData();
    let weapon = '';
    Object.keys(data.equipment.carried).forEach((key) => {
      const item = data.equipment.carried[key];
      if (item.itemid === itemid) {
        weapon = key;
      }
    });
    if (weapon) {
      const found = this.getFinalItem(data.equipment.carried[weapon], st + '.' + weapon);
      if (found.ammo.itemid !== itemid) {
        return found;
      } else {
        return {
          ammo: data.equipment.carried[weapon],
          st: st + '.' + weapon,
        };
      }
    }
    return undefined;
  }
  async calculateAmmunitionForRangedAttacks(attack, mode, weapon, token) {
    const rangedAttack = attack;
    if (mode === 'ranged') {
      let remainingRounds = 0;
      // Shots
      if (rangedAttack.shots && rangedAttack.shots.includes('(')) {
        const item = this.getAmmunnitionFromInventory(rangedAttack.itemid, 'system.equipment.carried');
        if (item) {
          if (item.ammo.count === 0) {
            ui.notifications?.warn('¡No te queda munición!');
            if (weapon) await refreshAmmo(token, weapon, 0);
            return false;
          }
          const toRemove = Number(rangedAttack.rof) || 1;
          await this.updateEqtCount(item.st, item.ammo.count - toRemove);
          if (weapon) await refreshAmmo(token, weapon, item.ammo.count - toRemove);
        }
        // Throw weapon
        if (rangedAttack.shots.split('(')[0] === 'T') {
          remainingRounds = Number(rangedAttack.shots.split('(')[1].split(')')[0]);
        } else {
          if (!rangedAttack.rof || rangedAttack.rof === '1') {
            if (rangedAttack.shots.includes('(')) {
              remainingRounds = Number(rangedAttack.shots.split('(')[1].split(')')[0]);
            }
          }
          const readyActionsWeaponNeeded = token.document.getFlag(MODULE_NAME, 'readyActionsWeaponNeeded');
          let weapon = readyActionsWeaponNeeded?.items?.find((item) => item.itemId === rangedAttack.itemid);
          if (!weapon) {
            const remainingShots =
              rangedAttack.shots.toUpperCase().indexOf('T') > -1 ? 0 : Number(eval(rangedAttack.shots.split('(')[0]));
            weapon = {
              itemId: rangedAttack.itemid,
              remainingRounds: 0,
              remainingShots,
            };
          } else if (weapon.remainingShots === undefined) {
            weapon.remainingShots = Number(eval(rangedAttack.shots.split('(')[0]));
          }
          if (item?.ammo?.count) {
            weapon.remainingShots = item?.ammo?.count;
          } else {
            weapon.remainingShots -= Number(rangedAttack.rof) || 1;
          }
          if (weapon.remainingShots <= 0) {
            remainingRounds = Number(rangedAttack.shots.split('(')[1].split(')')[0]);
          } else {
            const items = readyActionsWeaponNeeded?.items?.filter((item) => item.itemId !== rangedAttack.itemid) || [];
            token.document.setFlag(MODULE_NAME, 'readyActionsWeaponNeeded', {
              items: [...(items || []), weapon],
            });
          }
        }
      }
      if (remainingRounds) {
        const weapons = this.getWeaponsFromAttacks();
        const weaponToRemoveAmmo = weapons.find((w) => w.itemid === rangedAttack.itemid);
        if (weaponToRemoveAmmo) {
          clearAmmunition(weaponToRemoveAmmo, token);
        }
        const readyActionsWeaponNeeded = token.document.getFlag(MODULE_NAME, 'readyActionsWeaponNeeded');
        const items = readyActionsWeaponNeeded?.items?.filter((item) => item.itemId !== rangedAttack.itemid) || [];
        const remainingShots =
          rangedAttack.shots.toUpperCase().indexOf('T') > -1 ? 0 : Number(eval(rangedAttack.shots.split('(')[0]));
        token.document.setFlag(MODULE_NAME, 'readyActionsWeaponNeeded', {
          items: [
            ...(items || []),
            {
              itemId: rangedAttack.itemid,
              remainingRounds,
              remainingShots,
            },
          ],
        });
      }
    }
    return true;
  }
  getWeaponsFromAttacks() {
    const weaponData = [];
    const { melee, ranged } = this.getAttacks();
    const weapons = new Set();
    melee.filter((m) => m.itemid).forEach((attack) => weapons.add(attack.itemid));
    ranged.filter((m) => m.itemid).forEach((attack) => weapons.add(attack.itemid));
    const items = this.getEquipment();
    weapons.forEach((weapon) => {
      const weaponItem = items.filter((item) => item.itemid === weapon);
      if (weaponItem.length) weaponData.push(weaponItem[0]);
    });
    return weaponData;
  }
  getWeaponFromAttack(attack) {
    const weapons = this.getWeaponsFromAttacks();
    const weapon = weapons.find((w) => w.itemid === attack.itemid);
    return weapon;
  }
  getEquipment() {
    return Object.values(this.getData().equipment.carried);
  }
}
applyMixins(EasyCombatInventoryExtractor, [Actor, EasyCombatBaseExtractor]);
export default EasyCombatInventoryExtractor;
//# sourceMappingURL=EasyCombatInventoryExtractor.js.map
