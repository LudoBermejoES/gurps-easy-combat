import { MODULE_NAME, TEMPLATES_FOLDER } from './libs/constants';
import { ChooserData, PromiseFunctions } from '../types.js';
import BaseActorController from './abstract/BaseActorController.js';
import { activateChooser, ensureDefined, getTargets } from './libs/miscellaneous';
import AttackChooser, { AttackData } from './attackChooser';
import { getHitLocationsObject, hitLocationsData } from './libs/locationsDataTransformation';
import EasyCombatActor from './abstract/EasyCombatActor';

interface LocationData {
  keepOpen?: boolean;
  dataFromAttack?: AttackData;
}

export default class LocationChooser extends BaseActorController {
  data: LocationData;
  hitLocations: hitLocationsData[];
  indexLocation = 0;
  dataFromAttack: AttackData;
  promiseFuncs: PromiseFunctions<void> | undefined;

  constructor(token: Token, data: LocationData = {}, promiseFuncs?: PromiseFunctions<void>) {
    super('LocationChooser', token, {
      title: `Escoger postura - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/locationChooser.hbs`,
    });
    this.data = data;
    this.hitLocations = getHitLocationsObject(game).hitLocations?.items || [];
    this.dataFromAttack = this.data.dataFromAttack || {};
    this.promiseFuncs = promiseFuncs;
  }
  getData(): {
    hitLocations: ChooserData<['roll', 'where', 'penalty', 'dr']>;
    data: LocationData;
  } {
    return {
      hitLocations: {
        items: this.hitLocations,
        headers: ['roll', 'where', 'penalty', 'dr'],
        id: 'hit_locations',
      },
      data: this.data,
    };
  }
  activateListeners(html: JQuery): void {
    activateChooser(html, 'hit_locations', (index, element) => this.changeLocation(index, element));
    $('#closeAndReturn', html).click(() => {
      const token = this.token;
      ensureDefined(game.user, 'game not initialized');
      new AttackChooser(token, this.dataFromAttack).render(true);
      this.closeForEveryone();
    });
  }

  async changeLocation(index: number, element: JQuery<any>): Promise<void> {
    ensureDefined(game.user, 'game not initialized');
    const target = getTargets(game.user)[0];
    ensureDefined(target.actor, 'target has no actor');
    const hitLocationsValues = (target.actor as EasyCombatActor).getHitLocations();
    const hitLocationsData = hitLocationsValues.map(({ equipment, dr, roll, where, penalty }) => ({
      roll,
      where,
      penalty,
    }));
    $(element).parent().find('*').removeClass('selected');
    $(element).addClass('selected');

    const where = hitLocationsData[index].where || '';
    const penalty = hitLocationsData[index].penalty || 0;
    await this.token.document.setFlag(MODULE_NAME, 'location', {
      where,
      bonus: Number(penalty),
    });
    new AttackChooser(this.token, this.dataFromAttack).render(true);
    this.closeForEveryone();
  }
}
