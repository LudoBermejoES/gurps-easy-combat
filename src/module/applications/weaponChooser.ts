import { TEMPLATES_FOLDER } from '../util/constants.js';
import { getAttacks, getEquipment } from '../dataExtractor.js';
import { Attack, ChooserData, Item, PromiseFunctions } from '../types.js';
import BaseActorController from './abstract/BaseActorController.js';
import { activateChooser, ensureDefined } from '../util/miscellaneous.js';
import ManeuverChooser from './maneuverChooser';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

export default class WeaponChooser extends BaseActorController {
  promiseFuncs: PromiseFunctions<string> | undefined;
  weaponData: Item[];

  constructor(token: Token, promiseFuncs?: PromiseFunctions<string>) {
    super('WeaponChooser', token, {
      title: `Weapon Chooser - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/weaponChooser.hbs`,
    });
    this.weaponData = [];
    this.promiseFuncs = promiseFuncs;
  }
  getData(): {
    weapons: ChooserData<['name']>;
  } {
    const { melee, ranged } = getAttacks(this.actor);

    const weapons = new Set();
    melee.filter((m) => m.itemid).forEach((attack) => weapons.add(attack.itemid));
    ranged.filter((m) => m.itemid).forEach((attack) => weapons.add(attack.itemid));

    const items: Item[] = getEquipment(this.actor);
    weapons.forEach((weapon) => {
      const weaponItem = items.filter((item) => item.itemid === weapon);
      if (weaponItem.length) this.weaponData.push(weaponItem[0]);
    });

    ensureDefined(game.user, 'game not initialized');

    return {
      weapons: {
        items: this.weaponData,
        headers: ['name'],
        id: 'weapon_items',
      },
    };
  }
  activateListeners(html: JQuery): void {
    activateChooser(html, 'weapon_items', (index) => this.weaponSelect(index));

    $('#closeAndReturn', html).click(() => {
      const token = this.token;
      ensureDefined(game.user, 'game not initialized');
      new ManeuverChooser(token).render(true);
      this.closeForEveryone();
    });
  }

  weaponSelect(index: number): string {
    const { melee, ranged } = getAttacks(this.actor);
    const attackSelect = [...melee, ...ranged].find((attack) => attack.itemid === this.weaponData[index].itemid);
    const otf = attackSelect?.otf || '';
    if (this.promiseFuncs) {
      this.promiseFuncs.resolve(otf);
    }
    this.closeForEveryone();
    return otf;
  }

  static request(token: Token): Promise<string> {
    const promise = new Promise<string>((resolve, reject) => {
      new WeaponChooser(token, { resolve, reject }).render(true);
    });
    return promise;
  }
}
