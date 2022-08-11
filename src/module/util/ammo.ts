import { Item, MeleeAttack, RangedAttack, ReadyManeouverNeeded } from '../types';
import { getAmmunnitionFromInventory, getWeaponsFromAttacks } from './weapons';
import { clearAmmunition, refreshAmmo } from './weaponMacrosCTA';
import { MODULE_NAME } from './constants';

export async function calculateAmmunitionForRangedAttacks(
  attack: MeleeAttack | RangedAttack,
  mode: string,
  weapon: Item | undefined,
  actor: Actor,
  token: Token,
): Promise<boolean> {
  const rangedAttack = attack as RangedAttack;
  if (mode === 'ranged') {
    let remainingRounds = 0;
    // Shots
    if (rangedAttack.shots && rangedAttack.shots.includes('(')) {
      const item: { ammo: Item; st: string } | undefined = getAmmunnitionFromInventory(
        actor,
        rangedAttack.itemid,
        'data.equipment.carried',
      );
      if (item) {
        if (item.ammo.count === 0) {
          ui.notifications?.warn('¡No te queda munición!');
          if (weapon) await refreshAmmo(token, weapon, 0);
          return false;
        }
        const toRemove = Number(rangedAttack.rof) || 1;
        await (actor as any).updateEqtCount(item.st, item.ammo.count - toRemove);
        if (weapon) await refreshAmmo(token, weapon, item.ammo.count - toRemove);
      }

      // Throw weapon
      if (rangedAttack.shots.split('(')[0] === 'T') {
        remainingRounds = Number(rangedAttack.shots.split('(')[1].split(')')[0]);
      } else {
        if (!rangedAttack.rof) {
          remainingRounds = Number(rangedAttack.shots.split('(')[1].split(')')[0]);
        }
        const readyActionsWeaponNeeded = <{ items: ReadyManeouverNeeded[] } | { items: [] }>(
          token.document.getFlag(MODULE_NAME, 'readyActionsWeaponNeeded')
        );
        let weapon: ReadyManeouverNeeded | undefined = readyActionsWeaponNeeded?.items?.find(
          (item: ReadyManeouverNeeded) => item.itemId === rangedAttack.itemid,
        );

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
          const items =
            readyActionsWeaponNeeded?.items?.filter(
              (item: ReadyManeouverNeeded) => item.itemId !== rangedAttack.itemid,
            ) || [];
          token.document.setFlag(MODULE_NAME, 'readyActionsWeaponNeeded', {
            items: [...(items || []), weapon],
          });
        }
      }
    }

    if (remainingRounds) {
      const weapons: Item[] = getWeaponsFromAttacks(actor);
      const weaponToRemoveAmmo: Item | undefined = weapons.find((w) => w.itemid === rangedAttack.itemid);
      if (weaponToRemoveAmmo) {
        clearAmmunition(weaponToRemoveAmmo, token);
      }
      const readyActionsWeaponNeeded = <{ items: ReadyManeouverNeeded[] } | { items: [] }>(
        token.document.getFlag(MODULE_NAME, 'readyActionsWeaponNeeded')
      );
      const items =
        readyActionsWeaponNeeded?.items?.filter((item: ReadyManeouverNeeded) => item.itemId !== rangedAttack.itemid) ||
        [];
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
