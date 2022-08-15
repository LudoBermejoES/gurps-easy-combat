import { Modifier, Skill } from './types';
import { ensureDefined, getManeuver } from './util/miscellaneous';
import { MODULE_NAME } from './util/constants';
export function getDefenseModifiers(
  token: Token,
  attackerId: string,
): {
  defense: Modifier[];
} {
  const modifiers = {
    defense: <Modifier[]>[],
  };

  const lastFeint = <{ successMargin: number; targetId: string; round: number; attackerId: string } | undefined>(
    token.document.getFlag(MODULE_NAME, 'lastFeint')
  );
  if (lastFeint && lastFeint.attackerId === attackerId) {
    if (lastFeint.round - (game.combat?.round ?? 0) <= 1 && lastFeint.successMargin > 0) {
      token.document.unsetFlag(MODULE_NAME, 'lastFeint');
      modifiers.defense.push({ mod: -lastFeint.successMargin, desc: 'Por finta' });
    }
  }

  ensureDefined(token.actor, 'token without actor');
  switch (getManeuver(token.actor)) {
    case 'aod_dodge':
      modifiers.defense.push({ mod: 2, desc: 'dodge' });
      break;
    case 'aod_parry':
      modifiers.defense.push({ mod: 2, desc: 'parry' });
      break;
    case 'aod_block':
      modifiers.defense.push({ mod: 2, desc: 'block' });
      break;
  }
  return modifiers;
}
