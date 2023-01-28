import { Actor10, getActorData } from './data';

export async function useFatigue(actor: Actor, points = 1) {
  const json = `{ "data.FP.value": ${getActorData(actor as Actor10).FP.value - points} }`;
  return actor.update(JSON.parse(json));
}
