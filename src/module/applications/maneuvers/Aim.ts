import { getAttacks } from '../../dataExtractor';
import { ChooserData, PromiseFunctions } from '../../types';
import { MODULE_NAME, TEMPLATES_FOLDER } from '../libs/constants';
import { activateChooser, ensureDefined, checkSingleTarget, getTargets, getManeuver } from '../libs/miscellaneous';
import BaseActorController from '../abstract/BaseActorController';
import ManeuverChooser from '../maneuverChooser';

export default class Aim extends BaseActorController {
  promiseFuncs: PromiseFunctions<number> | undefined;

  constructor(token: Token, promiseFuncs?: PromiseFunctions<number>) {
    super('Aim', token, {
      title: `Aim - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/aim.hbs`,
    });
    const actor: Actor = token.actor as Actor;
    const maneuver = getManeuver(actor);
    if (maneuver !== 'aim') {
      token.document.unsetFlag(MODULE_NAME, 'lastAim');
    }
    this.promiseFuncs = promiseFuncs;
  }

  getData(): ChooserData<['weapon', 'acc', 'level', 'damage', 'range']> {
    const data = getAttacks(this.actor).ranged.map(({ name, acc, level, damage, range }) => ({
      weapon: name,
      acc,
      level,
      damage,
      range,
    }));
    return { items: data, headers: ['weapon', 'acc', 'level', 'damage', 'range'], id: 'range_attacks' };
  }

  activateListeners(html: JQuery): void {
    activateChooser(html, 'range_attacks', async (index) => {
      const attack = getAttacks(this.actor).ranged[index];
      const lastAim = <{ bonus: number } | undefined>this.token.document.getFlag(MODULE_NAME, 'lastAim');
      this.token.document.setFlag(MODULE_NAME, 'lastAim', {
        bonus: lastAim?.bonus ? Number(lastAim?.bonus) + 1 : Number(attack.acc),
      });
      this.close();
    });
    $('#closeAndReturn', html).click(() => {
      const token = this.token;
      ensureDefined(game.user, 'game not initialized');
      new ManeuverChooser(token).render(true);
      this.closeForEveryone();
    });
  }

  static async request(token: Token): Promise<number> {
    const promise = new Promise<number>((resolve, reject) => {
      new Aim(token, { resolve, reject }).render(true);
    });
    return promise;
  }
}
