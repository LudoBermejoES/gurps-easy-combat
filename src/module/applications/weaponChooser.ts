import { TEMPLATES_FOLDER } from '../util/constants.js';
import { getAttacks, getEquipment } from '../dataExtractor.js';
import { Attack, ChooserData, Item, PromiseFunctions, ReadyManeouverNeeded } from '../types.js';
import BaseActorController from './abstract/BaseActorController.js';
import { activateChooser, ensureDefined } from '../util/miscellaneous.js';
import ManeuverChooser from './maneuverChooser';
import {
  getWeaponsFromAttacks,
  getWeaponsNotToBeReady,
  getWeaponsToBeReady,
  weaponNotToBeReady,
  weaponToBeReady,
} from '../util/weapons';
import { getReadyActionsWeaponNeeded } from '../util/readyWeapons';
import {
  getExtraRangedAttacksPerROF,
  getMeleeAttacksWithNotReamingRounds,
  getMeleeAttacksWithReadyWeapons,
  getRangedAttacksWithNotReamingRounds,
  getRangedAttacksWithReadyWeapons,
  getRangedDataWithROFMoreThan1,
  meleeAttackWithRemainingRounds,
  rangedAttackWithRemainingRounds,
} from '../util/attacksDataTransformation';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

export default class WeaponChooser extends BaseActorController {
  promiseFuncs: PromiseFunctions<string> | undefined;
  weaponData: weaponNotToBeReady[];

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
