export default class EasyCombatBaseExtractor extends Actor {
  getData() {
    return this.system;
  }
  getAttacks() {
    const melee = Object.values(this.getData().melee);
    const ranged = Object.values(this.getData().ranged);
    return { melee: melee.filter((w) => w.damage), ranged };
  }
  getHitLocations() {
    return Object.values(this.getData().hitlocations);
  }
}
//# sourceMappingURL=EasyCombatBaseExtractor.js.map
