import { ensureDefined, getFullName } from './miscellaneous';
import { getReadyActionsWeaponNeeded } from './readyWeapons';
import { MODULE_NAME } from './constants';

interface LastBlock {
  round: number;
}

export function getValidBlocks(token: Token, totalModifiers: number, bonusBlock: number): Record<string, number> {
  const actor = token?.actor;
  ensureDefined(actor, 'Ese token necesita un actor');
  const readyActionsWeaponNeeded = getReadyActionsWeaponNeeded(token.document);
  const blocks: Record<string, number> = {};

  const lastBlock = getLastBlock(token.document);
  if (lastBlock?.round === (game?.combat?.round || 0)) return blocks;

  for (const attack of Object.values(actor.data.data.melee)) {
    const readyNeeded = readyActionsWeaponNeeded?.items.find((item) => item.itemId === attack.itemid) || {
      itemId: '',
      remainingRounds: 0,
    };
    if (!readyNeeded.remainingRounds) {
      const block: number = parseInt(attack.block);
      if (block) blocks[getFullName(attack)] = block + totalModifiers + bonusBlock;
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
