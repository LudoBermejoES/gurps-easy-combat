import { ActorDataPropertiesData, HitLocation, MeleeAttack, RangedAttack } from '../../../types';

export default class EasyCombatBaseExtractor extends Actor {
  tokenSelected: Token | undefined;
  tokenDocumentSelected: TokenDocument | undefined;
  system!: ActorDataPropertiesData;

  getData(): ActorDataPropertiesData {
    return this.system;
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
