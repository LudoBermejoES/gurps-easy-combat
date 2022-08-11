import { Item, MeleeAttack, Modifier, RangedAttack, ReadyManeouverNeeded } from '../types';
import { getAmmunnitionFromInventory } from '../util/weapons';
import {
  checkSingleTarget,
  ensureDefined,
  getCounterAttackLevel,
  getDisarmAttackLevel,
  getTargets,
} from './miscellaneous';
import { MODULE_NAME } from './constants';
import { calculateModifiersFromAttack } from './modifiers';

export interface counterAndDisarmAttackData {
  weapon: string;
  mode: string;
  level: number;
  damage: string;
  reach: string;
}

export interface meleeAttackWithRemainingRounds {
  weapon: string;
  mode: string;
  level: number;
  damage: string;
  reach: string;
  notes: string;
  itemid: string;
  levelWithModifiers: number;
  remainingRounds: number;
}

export interface rangedAttackWithRemainingRounds {
  weapon: string;
  mode: string;
  level: number;
  damage: string;
  range: string;
  accuracy: string;
  bulk: string;
  notes: string;
  itemid: string;
  rof: string;
  rcl: string;
  levelWithModifiers: number;
  remainingRounds: number;
}

export function getMeleeAttacksWithReadyWeapons(
  melee: MeleeAttack[],
  readyActionsWeaponNeeded: { items: ReadyManeouverNeeded[] },
  weapons: Item[],
): meleeAttackWithRemainingRounds[] {
  return melee
    .map(({ name, alternateName, mode, level, damage, reach, notes, itemid }) => {
      const readyNeeded = readyActionsWeaponNeeded?.items.find((item) => item.itemId === itemid) || {
        itemId: '',
        remainingRounds: 0,
      };
      return {
        weapon: alternateName || name,
        mode,
        level,
        levelWithModifiers: level,
        damage,
        reach,
        notes,
        itemid,
        remainingRounds: readyNeeded?.remainingRounds || 0,
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
        mode,
        level,
        levelWithModifiers: level,
        damage,
        range,
        accuracy: acc,
        bulk,
        notes,
        itemid,
        rof,
        rcl,
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

export function getAttacksNotToBeReady(
  melee: meleeAttackWithRemainingRounds[],
  ranged: rangedAttackWithRemainingRounds[],
): (meleeAttackWithRemainingRounds | rangedAttackWithRemainingRounds)[] {
  return [
    ...ranged.filter((item: rangedAttackWithRemainingRounds) => item.remainingRounds === 0),
    ...melee.filter((item: meleeAttackWithRemainingRounds) => item.remainingRounds === 0),
  ];
}

export function getCounterAttackData(
  melee: meleeAttackWithRemainingRounds[],
  actor: Actor,
): counterAndDisarmAttackData[] {
  return melee.map((item: meleeAttackWithRemainingRounds) => {
    const { weapon, mode, level, damage, reach } = item;
    return {
      weapon,
      mode,
      level: getCounterAttackLevel(actor, weapon, level),
      damage,
      reach,
    };
  });
}

export function getDisarmAttackData(
  game: Game,
  token: Token,
  melee: meleeAttackWithRemainingRounds[],
  actor: Actor,
): counterAndDisarmAttackData[] {
  ensureDefined(game.user, 'game not initialized');
  if (checkSingleTarget(game.user)) {
    const target = getTargets(game.user)[0];
    ensureDefined(target.actor, 'target has no actor');

    const successDefenses = <{ attackers: string[]; round: number } | undefined>(
      token.document.getFlag(MODULE_NAME, 'successDefenses')
    );

    const targetId = target?.id;
    if (targetId) {
      const roundSuccess = (successDefenses?.round || 0) === game.combat?.round ?? 0;
      const attackers = (roundSuccess && successDefenses?.attackers) || [];
      if (!attackers.includes(targetId)) {
        return [];
      }
    }
  }
  return melee.map((item: meleeAttackWithRemainingRounds) => {
    const { weapon, mode, level, damage, reach } = item;
    return {
      weapon,
      mode,
      level: getDisarmAttackLevel(actor, weapon, level),
      damage,
      reach,
    };
  });
}

export async function getAttacksWithModifiers(
  melee: meleeAttackWithRemainingRounds[],
  ranged: rangedAttackWithRemainingRounds[],
  actor: Actor,
  token: Token,
): Promise<{
  meleeAttacksWithModifier: meleeAttackWithRemainingRounds[];
  rangedAttacksWithModifier: rangedAttackWithRemainingRounds[];
}> {
  ensureDefined(game.user, 'game not initialized');
  const target = getTargets(game.user)[0];
  if (!target)
    return {
      meleeAttacksWithModifier: melee,
      rangedAttacksWithModifier: ranged,
    };

  const meleeAttacksWithModifierPromises = melee.map(async (m: meleeAttackWithRemainingRounds, i: number) => {
    const { modifiers } = await calculateModifiersFromAttack(
      'melee',
      i,
      undefined,
      target,
      actor,
      token,
      ranged,
      melee,
      { isUsingFatigueForMoveAndAttack: false, isUsingFatigueForMightyBlows: false },
    );

    let level = m.level;
    modifiers.attack.forEach((m: Modifier) => {
      level += m.mod;
    });
    return {
      ...m,
      levelWithModifiers: level,
    } as meleeAttackWithRemainingRounds;
  });
  const rangedAttacksWithModifierPromises = ranged.map(async (r: rangedAttackWithRemainingRounds, i: number) => {
    const { modifiers } = await calculateModifiersFromAttack(
      'ranged',
      i,
      undefined,
      target,
      actor,
      token,
      ranged,
      melee,
      { isUsingFatigueForMoveAndAttack: false, isUsingFatigueForMightyBlows: false },
    );

    let level = r.level;
    modifiers.attack.forEach((m: Modifier) => {
      level += m.mod;
    });
    return {
      ...r,
      levelWithModifiers: level,
    } as rangedAttackWithRemainingRounds;
  });
  const meleeAttacksWithModifier = await Promise.all(meleeAttacksWithModifierPromises);
  const rangedAttacksWithModifier = await Promise.all(rangedAttacksWithModifierPromises);
  return {
    meleeAttacksWithModifier,
    rangedAttacksWithModifier,
  };
}

export function getNameFromAttack(attack: any, attackData: any): boolean {
  const nameToLook: string = attackData.weapon.split(' --')[0];
  if (attack.alternateName) {
    if (attack.alternateName === nameToLook) {
      return true;
    }
  }

  if (attack.name === nameToLook) {
    return true;
  }

  return false;
}
