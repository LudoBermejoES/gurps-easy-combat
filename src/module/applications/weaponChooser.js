import { TEMPLATES_FOLDER } from './libs/constants';
import BaseActorController from './abstract/BaseActorController.js';
import { activateChooser, ensureDefined } from './libs/miscellaneous';
import ManeuverChooser from './maneuverChooser';
import { getEquippedItems } from './libs/weaponMacrosCTA';
import { easyCombatActorfromToken } from './abstract/EasyCombatActor';
export default class WeaponChooser extends BaseActorController {
  constructor(token, promiseFuncs) {
    super('WeaponChooser', token, easyCombatActorfromToken(token), {
      title: `Weapon Chooser - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/weaponChooser.hbs`,
    });
    this.token = token;
    this.weaponData = [];
    this.promiseFuncs = promiseFuncs;
  }
  getData() {
    this.weaponData = this.actor.getWeaponsNotToBeReady().filter((w) => !w.name.toUpperCase().includes('SHIELD'));
    return {
      weapons: {
        items: this.weaponData,
        headers: ['name'],
        id: 'weapon_items',
      },
    };
  }
  activateListeners(html) {
    activateChooser(html, 'weapon_items', (index) => this.weaponSelect(index));
    $('#closeAndReturn', html).click(() => {
      const token = this.token;
      ensureDefined(game.user, 'game not initialized');
      new ManeuverChooser(token).render(true);
      this.closeForEveryone();
    });
  }
  async weaponSelect(index) {
    const weapons = await getEquippedItems(this.token.document);
    const { melee, ranged } = this.actor.getAttacks();
    const attackSelect = [...melee, ...ranged].find((attack) => attack.itemid === this.weaponData[index].itemid);
    const weaponSelect = weapons.find((w) => w.itemId === this.weaponData[index].itemid);
    const otf = attackSelect?.otf || '';
    if (this.promiseFuncs) {
      this.promiseFuncs.resolve({ otf, hand: weaponSelect?.hand || '' });
    }
    this.closeForEveryone();
  }
  static request(token) {
    const promise = new Promise((resolve, reject) => {
      new WeaponChooser(token, { resolve, reject }).render(true);
    });
    return promise;
  }
}
//# sourceMappingURL=weaponChooser.js.map
