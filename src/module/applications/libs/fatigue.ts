import { MODULE_NAME } from './constants';
import { Actor10, getActorData } from './data';
import { weapon } from './weaponMacrosCTA';

interface CycleAttack {
  round: number;
  weaponName: string;
}
export async function useFatigue(actor: Actor, points = 1) {
  const json = `{ "data.FP.value": ${getActorData(actor as Actor10).FP.value - points} }`;
  return actor.update(JSON.parse(json));
}

export function useFatigueWithCyclicAttack(actor: Actor, token: Token, w: weapon) {
  debugger;
  const cycleAttack: CycleAttack | undefined = token.document.getFlag(MODULE_NAME, 'cycleAttack') as
    | CycleAttack
    | undefined;

  token.document.setFlag(MODULE_NAME, 'cycleAttack', {
    round: game?.combat?.round || 0,
    weaponName: w?.name || '',
  });

  if (cycleAttack?.weaponName === w.name) {
    const round = game?.combat?.round || 1 - cycleAttack.round || -2;
    if (round === 0 || round === 1) {
      return useFatigue(actor, w.cycleAttackFatigueToKeep);
    }
  }

  return useFatigue(actor, w.cycleAttackFatigueToStart);
}
