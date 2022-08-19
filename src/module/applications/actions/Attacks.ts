import { Item, MeleeAttack, Modifier, RangedAttack, ReadyManeouverNeeded } from '../../types';
import { getAmmunnitionFromInventory } from '../../util/weapons';
import { meleeAttackWithRemainingRounds, rangedAttackWithRemainingRounds } from '../../util/attacksDataTransformation';

export function getMeleeAttacksWithReadyWeapons(
  melee: MeleeAttack[],
  readyActionsWeaponNeeded: { items: ReadyManeouverNeeded[] },
  weapons: Item[],
): meleeAttackWithRemainingRounds[] {
  return melee
    .map(({ name, alternateName, mode, level, damage, reach, notes, itemid, parry, block }) => {
      const readyNeeded = readyActionsWeaponNeeded?.items.find((item) => item.itemId === itemid) || {
        itemId: '',
        remainingRounds: 0,
      };
      return {
        weapon: alternateName || name,
        originalName: name,
        mode,
        level,
        parry,
        block,
        damage,
        reach,
        notes,
        itemid,
        levelWithModifiers: level,
        remainingRounds: readyNeeded?.remainingRounds || 0,
        modifiers: [],
      };
    })
    .filter((item: meleeAttackWithRemainingRounds) => {
      const weapon = weapons.find((w) => w.itemid === item.itemid);
      if (weapon && weapon.count === 0) {
        return false;
      }
      return true;
    });
}

export function getMeleeAttacksWithNotReamingRounds(melee: meleeAttackWithRemainingRounds[]) {
  return melee.filter((item: meleeAttackWithRemainingRounds) => {
    return !item.remainingRounds;
  });
}

export function getRangedAttacksWithReadyWeapons(
  ranged: RangedAttack[],
  readyActionsWeaponNeeded: { items: ReadyManeouverNeeded[] },
  actor: Actor,
): rangedAttackWithRemainingRounds[] {
  return ranged
    .map(({ name, alternateName, mode, level, damage, range, acc, bulk, notes, itemid, rof, rcl }) => {
      const readyNeeded = readyActionsWeaponNeeded?.items.find((item) => item.itemId === itemid) || {
        itemId: '',
        remainingRounds: 0,
      };
      return {
        weapon: alternateName || name,
        originalName: name,
        mode,
        level,
        damage,
        range,
        accuracy: acc,
        bulk,
        notes,
        itemid,
        rof,
        rcl,
        levelWithModifiers: level,
        modifiers: [],
        remainingRounds: readyNeeded?.remainingRounds || 0,
      };
    })
    .filter((item: rangedAttackWithRemainingRounds) => {
      const rAttack = ranged.find((r) => r.itemid === item.itemid);
      if (rAttack) {
        if (item?.mode?.toUpperCase().includes('INNATE ATTACK')) return true;
        const weapon = getAmmunnitionFromInventory(actor, rAttack.itemid, 'data.equipment.carried');
        if (!weapon?.ammo) {
          return false;
        }
        if (weapon.ammo.count === 0) {
          return false;
        }
      }
      return true;
    });
}

export function getRangedAttacksWithNotReamingRounds(melee: rangedAttackWithRemainingRounds[]) {
  return melee.filter((item: rangedAttackWithRemainingRounds) => {
    return !item.remainingRounds;
  });
}

export function getRangedDataWithROFMoreThan1(
  ranged: rangedAttackWithRemainingRounds[],
): rangedAttackWithRemainingRounds[] {
  return ranged.filter((attack: rangedAttackWithRemainingRounds) => attack.rof && attack.rof !== '1');
}

export function getExtraRangedAttacksPerROF(
  ranged: rangedAttackWithRemainingRounds[],
  readyActionsWeaponNeeded: { items: ReadyManeouverNeeded[] },
  actor: Actor,
): rangedAttackWithRemainingRounds[] {
  const rangedAttackWithROFMoreThan1: rangedAttackWithRemainingRounds[] = getRangedDataWithROFMoreThan1(ranged);
  const rangedData: rangedAttackWithRemainingRounds[] = [];
  rangedAttackWithROFMoreThan1.forEach((attack) => {
    if (attack.rof) {
      let rof = Number(attack.rof.split('!').join(''));

      const weapon: ReadyManeouverNeeded | undefined = readyActionsWeaponNeeded?.items?.find(
        (item: ReadyManeouverNeeded) => item.itemId === attack.itemid,
      );

      if (weapon && weapon.remainingShots && weapon.remainingShots < rof) {
        rof = weapon.remainingShots;
      }

      let maxROF = 1000;
      const rAttack = ranged.find((r) => r.itemid === attack.itemid);
      if (rAttack) {
        const weapon = getAmmunnitionFromInventory(actor, rAttack.itemid, 'data.equipment.carried');
        if (weapon?.ammo) {
          maxROF = weapon.ammo.count;
        }
      }

      rof = Math.min(rof, maxROF);

      for (let i = 1; i <= rof; i++) {
        const newAttack = { ...attack };
        newAttack.weapon += ` -- Disparar ${i} proyectiles`;
        newAttack.rof = String(i);
        if (i > 4) {
          const extraToHit = Math.ceil(i / 4) - 1;
          newAttack.level += extraToHit;
        }
        rangedData.push(newAttack);
      }
    }
  });
  return rangedData;
}

export function getAttacksToBeReady(
  melee: meleeAttackWithRemainingRounds[],
  ranged: rangedAttackWithRemainingRounds[],
): (meleeAttackWithRemainingRounds | rangedAttackWithRemainingRounds)[] {
  return [
    ...ranged.filter((item: rangedAttackWithRemainingRounds) => item.remainingRounds),
    ...melee.filter((item: meleeAttackWithRemainingRounds) => item.remainingRounds),
  ];
}
