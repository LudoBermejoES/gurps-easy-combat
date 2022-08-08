import { MeleeAttack, RangedAttack, ReadyManeouverNeeded } from '../types';
import { MODULE_NAME } from './constants';
import { ensureDefined, getFullName } from './miscellaneous';
import { getEquippedItems } from './weaponMacrosCTA';
0;
export function getReadyActionsWeaponNeeded(
  document: TokenDocument,
): { items: ReadyManeouverNeeded[] } | { items: [] } {
  return <{ items: ReadyManeouverNeeded[] } | { items: [] }>document.getFlag(MODULE_NAME, 'readyActionsWeaponNeeded');
}
