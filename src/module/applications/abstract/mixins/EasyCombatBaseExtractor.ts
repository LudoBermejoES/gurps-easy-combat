import { HitLocation, MeleeAttack, RangedAttack } from '../../../types';

export default class EasyCombatBaseExtractor extends Actor {
  tokenSelected: Token | undefined;
  tokenDocumentSelected: TokenDocument | undefined;
  getData() {
    return this.data.data;
  }

  getAttacks(): { melee: MeleeAttack[]; ranged: RangedAttack[] } {
    const melee = Object.values(this.getData().melee);
    const ranged = Object.values(this.getData().ranged);
    return { melee: melee.filter((w) => w.damage), ranged };
  }
  getHitLocations(): HitLocation[] {
    return Object.values(this.getData().hitlocations);
  }
}
