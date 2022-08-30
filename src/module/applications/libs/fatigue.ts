import { getActorData } from './data';

export async function useFatigue(actor: Actor, points = 1) {
  const json = `{ "data.FP.value": ${getActorData(actor).FP.value - points} }`;
  return actor.update(JSON.parse(json));
}
