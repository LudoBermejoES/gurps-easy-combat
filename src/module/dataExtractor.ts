import { HitLocation, MeleeAttack, Posture, RangedAttack, Item } from './types';
import { getActorData } from './applications/libs/data';

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
