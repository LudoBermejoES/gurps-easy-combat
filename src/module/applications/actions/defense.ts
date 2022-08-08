import { addCounterAttackModifiersForDefense } from './counterAttack';
import DefenseChooser from '../defenseChooser';
import { doAnimationDefense } from '../../util/animations';
import { MODULE_NAME } from '../../util/constants';
import { GurpsRoll, MeleeAttack, Modifier, RangedAttack } from '../../types';
import { ensureDefined, getFullName } from '../../util/miscellaneous';
import { getReadyActionsWeaponNeeded } from '../../util/readyWeapons';
import { getEquippedItems } from '../../util/weaponMacrosCTA';

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

export async function getValidParries(token: Token, totalModifiers: number): Promise<Record<string, number>> {
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
      if (parry) parries[getFullName(attack)] = parry + totalModifiers;
    }
  }
  return parries;
}

export function getValidBlocks(token: Token, totalModifiers: number) {
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
      if (block) blocks[getFullName(attack)] = block + totalModifiers;
    }
  }
  return blocks;
}

export default async function rollDefense(
  roll: GurpsRoll,
  isCounterAttack: boolean,
  attacker: Actor,
  attack: MeleeAttack | RangedAttack,
  modifiers: {
    attack: Modifier[];
    defense: Modifier[];
    damage: Modifier[];
  },
  target: Token,
): Promise<boolean> {
  if (!target.actor) {
    ui.notifications?.error('target has no actor');
    return true;
  }
  addCounterAttackModifiersForDefense(isCounterAttack, attacker, attack, modifiers, target);
  const defenseSucess = await DefenseChooser.requestDefense(target, modifiers.defense, attacker);
  doAnimationDefense(target.actor, defenseSucess);
  if (defenseSucess) {
    const successDefenses = <{ attackers: string[]; round: number } | undefined>(
      target.document.getFlag(MODULE_NAME, 'successDefenses')
    );

    const attackerId = attacker?.token?.id;
    if (attackerId) {
      const roundSuccess = (successDefenses?.round || 0) === game.combat?.round ?? 0;
      const attackers = (roundSuccess && successDefenses?.attackers) || [];
      target.document.setFlag(MODULE_NAME, 'successDefenses', {
        attackers: [...attackers, attackerId],
        round: game.combat?.round ?? 0,
      });
    }
    if (roll.rofrcl) {
      const total = roll.rofrcl - (GURPS.lastTargetedRoll.margin + 1);
      if (total <= 0) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
    return true;
  }
  return true;
}
