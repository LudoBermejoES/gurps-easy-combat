import { easyCombatActorfromActor } from '../abstract/EasyCombatActor';
export function getMeleeAttacksWithReadyWeapons(melee, readyActionsWeaponNeeded, weapons) {
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
    .filter((item) => {
      const weapon = weapons.find((w) => w.itemid === item.itemid);
      if (weapon && weapon.count === 0) {
        return false;
      }
      return true;
    });
}
export function getMeleeAttacksWithNotReamingRounds(melee) {
  return melee.filter((item) => {
    return !item.remainingRounds;
  });
}
export function getRangedAttacksWithReadyWeapons(ranged, readyActionsWeaponNeeded, actor) {
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
    .filter((item) => {
      const rAttack = ranged.find((r) => r.itemid === item.itemid);
      if (rAttack) {
        if (item?.mode?.toUpperCase().includes('INNATE ATTACK')) return true;
        const weapon = easyCombatActorfromActor(actor).getAmmunnitionFromInventory(
          rAttack.itemid,
          'data.equipment.carried',
        );
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
export function getRangedAttacksWithNotReamingRounds(melee) {
  return melee.filter((item) => {
    return !item.remainingRounds;
  });
}
export function getRangedDataWithROFMoreThan1(ranged) {
  return ranged.filter((attack) => attack.rof && attack.rof !== '1');
}
export function getExtraRangedAttacksPerROF(ranged, readyActionsWeaponNeeded, actor) {
  const rangedAttackWithROFMoreThan1 = getRangedDataWithROFMoreThan1(ranged);
  const rangedData = [];
  rangedAttackWithROFMoreThan1.forEach((attack) => {
    if (attack.rof) {
      let rof = Number(attack.rof.split('!').join(''));
      const weapon = readyActionsWeaponNeeded?.items?.find((item) => item.itemId === attack.itemid);
      if (weapon && weapon.remainingShots && weapon.remainingShots < rof) {
        rof = weapon.remainingShots;
      }
      let maxROF = 1000;
      const rAttack = ranged.find((r) => r.itemid === attack.itemid);
      if (rAttack) {
        const weapon = easyCombatActorfromActor(actor).getAmmunnitionFromInventory(
          rAttack.itemid,
          'data.equipment.carried',
        );
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
export function getAttacksToBeReady(melee, ranged) {
  return [...ranged.filter((item) => item.remainingRounds), ...melee.filter((item) => item.remainingRounds)];
}
//# sourceMappingURL=Attacks.js.map
