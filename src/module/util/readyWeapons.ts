import { MeleeAttack, RangedAttack, ReadyManeouverNeeded } from '../types';
import { MODULE_NAME } from './constants';
import { ensureDefined, getFullName } from './miscellaneous';
import { getEquippedItems } from './weaponMacrosCTA';

export function getReadyActionsWeaponNeeded(
  document: TokenDocument,
): { items: ReadyManeouverNeeded[] } | { items: [] } {
  return <{ items: ReadyManeouverNeeded[] } | { items: [] }>document.getFlag(MODULE_NAME, 'readyActionsWeaponNeeded');
}

async function checkOffHandDefense(
  token: TokenDocument,
  attack: MeleeAttack | RangedAttack,
): Promise<
  | {
      mod: number;
      desc: string;
    }
  | undefined
> {
  const equippedItems: {
    itemId: string;
    hand: string;
  }[] = await getEquippedItems(token);

  const weaponCarried = equippedItems.find((e) => e.itemId === attack.itemid);
  if (weaponCarried) {
    if (weaponCarried.hand === 'OFF') {
      return {
        mod: -2,
        desc: 'Por parar con la mano torpe',
      };
    }
  }
  return undefined;
}
export async function getValidParries(token: Token) {
  const actor = token?.actor;
  ensureDefined(actor, 'Ese token necesita un actor');
  const readyActionsWeaponNeeded = getReadyActionsWeaponNeeded(token.document);
  const parries: Record<string, number> = {};
  for (const attack of Object.values(actor.data.data.melee)) {
    const offHandModifiers = await checkOffHandDefense(token.document, attack);
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
