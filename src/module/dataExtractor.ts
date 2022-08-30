import { HitLocation, MeleeAttack, Posture, RangedAttack, Item } from './types';
import { getFullName } from './applications/libs/miscellaneous';
import { getActorData } from './applications/libs/data';

export function getAttacks(actor: Actor): { melee: MeleeAttack[]; ranged: RangedAttack[] } {
  const melee = Object.values(getActorData(actor).melee);
  const ranged = Object.values(getActorData(actor).ranged);
  return { melee: melee.filter((w) => w.damage), ranged };
}

export function getParries(actor: Actor): Record<string, number> {
  const parries: Record<string, number> = {};
  for (const attack of Object.values(getActorData(actor).melee)) {
    const parry: number = parseInt(attack.parry);
    if (parry) parries[getFullName(attack)] = parry;
  }
  return parries;
}

export function getBlocks(actor: Actor): Record<string, number> {
  const blocks: Record<string, number> = {};
  for (const attack of Object.values(getActorData(actor).melee)) {
    const block: number = parseInt(attack.block);
    if (block) blocks[getFullName(attack)] = block;
  }
  return blocks;
}

export function getDodge(actor: Actor): number {
  return getActorData(actor).currentdodge;
}

export function getHitLocations(actor: Actor): HitLocation[] {
  return Object.values(getActorData(actor).hitlocations);
}

export function getEquipment(actor: Actor): Item[] {
  return Object.values(getActorData(actor).equipment.carried);
}

export function getPostures(): Posture[] {
  function translate(key: string): string {
    switch (key) {
      case 'prone':
        return 'Tumbado';
        break;
      case 'kneel':
        return 'Arrodillado';
        break;
      case 'crouch':
        return 'Acuclillado';
        break;
      case 'sit':
        return 'Sentado';
        break;
      case 'crawl':
        return 'Gateando';
        break;
    }
    return '';
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const postures = Object.keys(GURPS?.StatusEffect?.getAllPostures() || {}).map((key) => ({
    name: key,
    tname: translate(key),
  }));

  postures.unshift({
    name: 'standing',
    tname: 'En pie',
  });
  return postures;
}
