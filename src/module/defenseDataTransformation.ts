import { getAttacks } from './dataExtractor';
import { getWeaponsFromAttacks } from './applications/libs/weapons';
import { Item, Modifier, ReadyManeouverNeeded } from './types';
import { getReadyActionsWeaponNeeded } from './applications/libs/readyWeapons';
import { getMeleeAttacksWithNotReamingRounds, getMeleeAttacksWithReadyWeapons } from './applications/actions/Attacks';
import { ensureDefined, getFullName, getManeuver } from './applications/libs/miscellaneous';
import { checkOffHand } from './applications/libs/offHand';
import { MODULE_NAME } from './applications/libs/constants';
import { meleeAttackWithRemainingRounds } from './applications/libs/attacksDataTransformation';
import { calculateDefenseModifiersFromEquippedWeapons } from './applications/libs/modifiers';

interface LastBlock {
  round: number;
}

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

export interface Block {
  itemid: string;
  weapon: string;
  originalName: string;
  value: number;
  modifiers: Modifier[];
}

export function getDefenseModifiersByManeuver(token: Token, attackerId: string, mode: string): Modifier[] {
  const modifiers: Modifier[] = [];

  const lastFeint = <{ successMargin: number; targetId: string; round: number; attackerId: string } | undefined>(
    token.document.getFlag(MODULE_NAME, 'lastFeint')
  );
  if (lastFeint && lastFeint.attackerId === attackerId) {
    if (lastFeint.round - (game.combat?.round ?? 0) <= 1 && lastFeint.successMargin > 0) {
      token.document.unsetFlag(MODULE_NAME, 'lastFeint');
      modifiers.push({ mod: -lastFeint.successMargin, desc: 'Por finta' });
    }
  }

  ensureDefined(token.actor, 'token without actor');
  switch (getManeuver(token.actor)) {
    case 'aod_dodge':
      if (mode === 'DODGE') {
        modifiers.push({ mod: 2, desc: 'a Esquiva por Defensa total`' });
      }
      break;
    case 'aod_parry':
      if (mode === 'PARRY') {
        modifiers.push({ mod: 2, desc: 'a Parada por Defensa total' });
      }
      break;
    case 'aod_block':
      if (mode === 'BLOCK') {
        modifiers.push({ mod: 2, desc: 'a Bloqueo por Defensa total' });
      }
      break;
  }
  return modifiers;
}

export function getDefenseModifiersBySelection(mode: string): {
  modifiers: Modifier[];
  isRetreating: boolean;
  isProne: boolean;
  isFeverishDefense: boolean;
} {
  const modifiers: Modifier[] = [];
  const isRetreating = $('#retreatDefense').is(':checked');
  const isProne = $('#proneDefense').is(':checked');
  const isFeverishDefense = $('#feverishDefense').is(':checked');

  if (isRetreating) {
    if (mode === 'DODGE') {
      modifiers.push({ mod: +3, desc: 'Retrocediendo (tendrás un -2 al ataque en el próximo turno)' });
    } else if (mode === 'PARRY') {
      modifiers.push({ mod: +1, desc: 'Retrocediendo (tendrás un -2 al ataque en el próximo turno)' });
    } else if (mode === 'BLOCK') {
      modifiers.push({ mod: +1, desc: 'Retrocediendo (tendrás un -2 al ataque en el próximo turno)' });
    }
  }

  if (isFeverishDefense) {
    modifiers.push({ mod: +2, desc: 'Defensa desesperada' });
  }

  if (isProne) {
    modifiers.push({ mod: +3, desc: 'En el suelo (cambias tu posición a tumbado)' });
  }
  return {
    modifiers,
    isRetreating,
    isFeverishDefense,
    isProne,
  };
}

export async function getDefenseModifiersByMode(
  mode: string,
  actor: Actor,
  token: Token,
  canUseModShield: boolean,
): Promise<{
  modifiers: Modifier[];
}> {
  const modifiers: Modifier[] = [];
  const { bonusDodge, bonusParry, bonusBlock } = await calculateDefenseModifiersFromEquippedWeapons(
    actor,
    token,
    canUseModShield,
  );
  if (mode === 'DODGE' && bonusDodge) {
    modifiers.push({ mod: bonusDodge, desc: 'Bonus por escudo, capa u otro objeto' });
  }
  if (mode === 'PARRY' && bonusParry) {
    modifiers.push({ mod: bonusDodge, desc: 'Bonus por escudo, capa u otro objeto' });
  }
  if (mode === 'BLOCK' && bonusBlock) {
    modifiers.push({ mod: bonusDodge, desc: 'Bonus por escudo, capa u otro objeto' });
  }
  return {
    modifiers,
  };
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

export function getValidBlocks(token: Token, totalModifiers = 0, bonusParry = 0): Block[] {
  const blocks: Block[] = [];
  const actor = token?.actor;
  ensureDefined(actor, 'Ese token necesita un actor');
  const lastBlock = getLastBlock(token.document);
  if (lastBlock?.round === (game?.combat?.round || 0)) return [];

  const { melee } = getAttacks(actor);
  const weapons: Item[] = getWeaponsFromAttacks(actor);

  const readyActionsWeaponNeeded: { items: ReadyManeouverNeeded[] } = getReadyActionsWeaponNeeded(token.document);

  const meleeDataOriginal = getMeleeAttacksWithReadyWeapons(melee, readyActionsWeaponNeeded, weapons);
  const meleeData: meleeAttackWithRemainingRounds[] = getMeleeAttacksWithNotReamingRounds(meleeDataOriginal);

  for (const attack of Object.values(meleeData)) {
    const modifiers: Modifier[] = [];
    const { itemid, weapon, block: originalBlock, originalName } = attack;
    const block = originalBlock;

    if (!isNaN(Number(block)) && !blocks.find((p) => p.itemid === itemid)) {
      let totalModifiersByBlock = 0;
      modifiers.forEach((m) => (totalModifiersByBlock = totalModifiersByBlock + m.mod));
      blocks.push({
        itemid,
        weapon,
        originalName,
        modifiers,
        value: Number(block) + totalModifiers + bonusParry + totalModifiersByBlock,
      });
    }
  }
  return blocks;
}

function getLastBlock(token: TokenDocument): LastBlock | undefined {
  return <LastBlock>token.getFlag(MODULE_NAME, 'lastBlocks') || undefined;
}

export async function saveLastBlock(lastBlock: LastBlock, token: TokenDocument) {
  return token.setFlag(MODULE_NAME, 'lastBlocks', lastBlock);
}
