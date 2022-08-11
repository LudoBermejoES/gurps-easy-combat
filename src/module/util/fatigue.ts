export async function useFatigue(actor: Actor, points = 1) {
  const json = `{ "data.FP.value": ${actor.data.data.FP.value - points} }`;
  return actor.update(JSON.parse(json));
}
