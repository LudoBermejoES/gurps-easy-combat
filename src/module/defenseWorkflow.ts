import { Modifier, Skill } from './types';
import { ensureDefined, getManeuver } from './util/miscellaneous';
export function getDefenseModifiers(token: Token): {
  defense: Modifier[];
} {
  const modifiers = {
    defense: <Modifier[]>[],
  };
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
