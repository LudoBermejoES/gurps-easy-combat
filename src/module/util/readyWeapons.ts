import { ReadyManeouverNeeded } from '../types';
import { MODULE_NAME } from './constants';
import { ensureDefined, getFullName } from './miscellaneous';
import { getParries } from '../dataExtractor';

export function getReadyActionsWeaponNeeded(
  document: TokenDocument,
): { items: ReadyManeouverNeeded[] } | { items: [] } {
  return <{ items: ReadyManeouverNeeded[] } | { items: [] }>document.getFlag(MODULE_NAME, 'readyActionsWeaponNeeded');
}

export function getValidParries(token: Token) {
  const actor = token?.actor;
  ensureDefined(actor, 'Ese token necesita un actor');
  const readyActionsWeaponNeeded = getReadyActionsWeaponNeeded(token.document);
  const parries: Record<string, number> = {};
  for (const attack of Object.values(actor.data.data.melee)) {
    const readyNeeded = readyActionsWeaponNeeded?.items.find((item) => item.itemId === attack.itemid) || {
      itemId: '',
      remainingRounds: 0,
    };

    if (!readyNeeded.remainingRounds) {
      const parry: number = parseInt(attack.parry);
      if (parry) parries[getFullName(attack)] = parry;
    }
  }
  return parries;
}

export function getValidBlocks(token: Token) {
  const actor = token?.actor;
  ensureDefined(actor, 'Ese token necesita un actor');
  const readyActionsWeaponNeeded = getReadyActionsWeaponNeeded(token.document);

  const blocks: Record<string, number> = {};
  for (const attack of Object.values(actor.data.data.melee)) {
    const readyNeeded = readyActionsWeaponNeeded?.items.find((item) => item.itemId === attack.itemid) || {
      itemId: '',
      remainingRounds: 0,
    };
    if (!readyNeeded.remainingRounds) {
      const block: number = parseInt(attack.block);
      if (block) blocks[getFullName(attack)] = block;
    }
  }
  return blocks;
}
