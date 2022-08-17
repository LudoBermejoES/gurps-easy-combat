import { ensureDefined, getFullName } from './miscellaneous';
import { getReadyActionsWeaponNeeded } from './readyWeapons';
import { MODULE_NAME } from './constants';
import { Item, Modifier, ReadyManeouverNeeded } from '../types';
import {
  getMeleeAttacksWithNotReamingRounds,
  getMeleeAttacksWithReadyWeapons,
  meleeAttackWithRemainingRounds,
} from './attacksDataTransformation';
import { getAttacks } from '../dataExtractor';
import { getWeaponsFromAttacks } from './weapons';
import { checkOffHand } from './offHand';

interface LastParry {
  times: number;
  round: number;
  itemId: string;
}

export interface Parry {
  itemid: string;
  weapon: string;
  originalName: string;
  value: number;
  modifiers: Modifier[];
  parryToStore: LastParry;
}

export async function getValidParries(token: Token, totalModifiers = 0, bonusParry = 0): Promise<Parry[]> {
  const parries: Parry[] = [];
  const actor = token?.actor;
  ensureDefined(actor, 'Ese token necesita un actor');

  const { melee } = getAttacks(actor);
  const weapons: Item[] = getWeaponsFromAttacks(actor);

  const readyActionsWeaponNeeded: { items: ReadyManeouverNeeded[] } = getReadyActionsWeaponNeeded(token.document);

  const meleeDataOriginal = getMeleeAttacksWithReadyWeapons(melee, readyActionsWeaponNeeded, weapons);
  const meleeData: meleeAttackWithRemainingRounds[] = getMeleeAttacksWithNotReamingRounds(meleeDataOriginal);

  for (const attack of Object.values(meleeData)) {
    const modifiers: Modifier[] = [];
    const { itemid, weapon, parry: originalParry, originalName } = attack;
    let isFencingWeapon = false;
    let parry = originalParry;
    if (String(originalParry).includes('F')) {
      isFencingWeapon = true;
      parry = originalParry.split('F')[0];
    }
    if (!isNaN(Number(parry)) && !parries.find((p) => p.itemid === itemid)) {
      const offHandModifiers = await checkOffHand(token.document, attack);
      if (offHandModifiers) {
        modifiers.push(offHandModifiers);
      }
      let lastParry = getLastParryByItemId(token, itemid);
      if (lastParry?.round === game.combat?.round ?? 0) {
        const times = lastParry?.times || 0;

        modifiers.push({
          mod: (isFencingWeapon ? -2 : -4) * times,
          desc:
            times <= 1
              ? `Malus por haber parado previamente ${times} vez`
              : `Malus por haber parado previamente ${times} veces`,
        });
      } else {
        lastParry = undefined;
      }

      let totalModifiersByParry = 0;
      modifiers.forEach((m) => (totalModifiersByParry = totalModifiersByParry + m.mod));
      const parryToStore = {
        times: (lastParry?.times || 0) + 1,
        round: game?.combat?.round || 0,
        itemId: itemid,
      };

      parries.push({
        itemid,
        weapon,
        originalName,
        modifiers,
        parryToStore,
        value: Number(parry) + totalModifiers + bonusParry + totalModifiersByParry,
      });
    }
  }
  return parries;
}

function getLastParryByItemId(token: Token, itemId: string): LastParry | undefined {
  const parries: LastParry[] = getLastParries(token.document);
  return parries.find((p) => p.itemId === itemId);
}

function getLastParries(token: TokenDocument): LastParry[] {
  return <LastParry[]>token.getFlag(MODULE_NAME, 'lastParries') || [];
}

export async function saveLastParry(lastParry: LastParry, token: TokenDocument, itemId = '') {
  const parries: LastParry[] = getLastParries(token);
  const parriesFiltered = parries.filter((p) => p.itemId !== lastParry.itemId);
  parriesFiltered.push(lastParry);
  return token.setFlag(MODULE_NAME, 'lastParries', parriesFiltered);
}
