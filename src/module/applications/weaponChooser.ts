import { TEMPLATES_FOLDER } from './libs/constants';
import { getAttacks, getEquipment } from '../dataExtractor.js';
import { Attack, ChooserData, Item, PromiseFunctions, ReadyManeouverNeeded } from '../types.js';
import BaseActorController from './abstract/BaseActorController.js';
import { activateChooser, ensureDefined } from './libs/miscellaneous';
import ManeuverChooser from './maneuverChooser';
import {
  getWeaponsFromAttacks,
  getWeaponsNotToBeReady,
  getWeaponsToBeReady,
  weaponNotToBeReady,
  weaponToBeReady,
} from './libs/weapons';
import { getReadyActionsWeaponNeeded } from './libs/readyWeapons';
import {
  getExtraRangedAttacksPerROF,
  getMeleeAttacksWithNotReamingRounds,
  getMeleeAttacksWithReadyWeapons,
  getRangedAttacksWithNotReamingRounds,
  getRangedAttacksWithReadyWeapons,
  getRangedDataWithROFMoreThan1,
  meleeAttackWithRemainingRounds,
  rangedAttackWithRemainingRounds,
} from './libs/attacksDataTransformation';
import { equippedItem, getEquippedItems } from './libs/weaponMacrosCTA';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

export default class WeaponChooser extends BaseActorController {
  promiseFuncs: PromiseFunctions<{ otf: string; hand: string }> | undefined;
  weaponData: weaponNotToBeReady[];
  token: Token;

  constructor(token: Token, promiseFuncs?: PromiseFunctions<{ otf: string; hand: string }>) {
    super('WeaponChooser', token, {
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
    const { melee } = getAttacks(this.actor);
    const weapons: Item[] = getWeaponsFromAttacks(this.actor);

    const readyActionsWeaponNeeded: { items: ReadyManeouverNeeded[] } = getReadyActionsWeaponNeeded(
      this.token.document,
    );

    const meleeDataOriginal: meleeAttackWithRemainingRounds[] = getMeleeAttacksWithReadyWeapons(
      melee,
      readyActionsWeaponNeeded,
      weapons,
    );

    this.weaponData = getWeaponsNotToBeReady(meleeDataOriginal, [], this.actor).filter(
      (w) => !w.name.toUpperCase().includes('SHIELD'),
    );

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

    const { melee, ranged } = getAttacks(this.actor);
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
