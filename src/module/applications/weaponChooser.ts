import { TEMPLATES_FOLDER } from './libs/constants';
import { ChooserData, Item, PromiseFunctions, ReadyManeouverNeeded } from '../types.js';
import BaseActorController from './abstract/BaseActorController.js';
import { activateChooser, ensureDefined } from './libs/miscellaneous';
import ManeuverChooser from './maneuverChooser';

import { equippedItem, getEquippedItems } from './libs/weaponMacrosCTA';
import { weaponNotToBeReady } from './abstract/mixins/EasyCombatAttacksExtractor';
import EasyCombatActor, { easyCombatActorfromToken } from './abstract/EasyCombatActor';

export default class WeaponChooser extends BaseActorController {
  promiseFuncs: PromiseFunctions<{ otf: string; hand: string }> | undefined;
  weaponData: weaponNotToBeReady[];
  token: Token;

  constructor(token: Token, promiseFuncs?: PromiseFunctions<{ otf: string; hand: string }>) {
    super('WeaponChooser', token, easyCombatActorfromToken(token), {
      title: `Weapon Chooser - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/weaponChooser.hbs`,
    });

    this.token = token;
    this.weaponData = [];
    this.promiseFuncs = promiseFuncs;
  }
  getData(): {
    weapons: ChooserData<['name']>;
  } {
    this.weaponData = this.actor.getWeaponsNotToBeReady().filter((w) => !w.name.toUpperCase().includes('SHIELD'));

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

  async weaponSelect(index: number) {
    const weapons: equippedItem[] = await getEquippedItems(this.token.document);

    const { melee, ranged } = this.actor.getAttacks();
    const attackSelect = [...melee, ...ranged].find((attack) => attack.itemid === this.weaponData[index].itemid);
    const weaponSelect = weapons.find((w) => w.itemId === this.weaponData[index].itemid);
    const otf = attackSelect?.otf || '';
    if (this.promiseFuncs) {
      this.promiseFuncs.resolve({ otf, hand: weaponSelect?.hand || '' });
    }
    this.closeForEveryone();
  }

  static request(token: Token): Promise<{ otf: string; hand: string }> {
    const promise = new Promise<{ otf: string; hand: string }>((resolve, reject) => {
      new WeaponChooser(token, { resolve, reject }).render(true);
    });
    return promise;
  }
}
