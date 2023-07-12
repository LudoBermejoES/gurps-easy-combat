import { CombatantData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs';
import { ActorDataPropertiesData } from '../../types';

export interface Actor10 extends Actor {
  system: ActorDataPropertiesData;
}

export function getActorData(actor: Actor10) {
  return actor.system;
}

export function getCombatantData(combatant: Combatant): CombatantData {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return combatant?.tokenId ? combatant : combatant.data;
}
