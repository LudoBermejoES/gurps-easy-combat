import { ActorDataPropertiesData } from '../../types';

export interface Actor10 extends Actor {
  system: ActorDataPropertiesData;
}

export function getActorData(actor: Actor10) {
  return actor.system;
}
