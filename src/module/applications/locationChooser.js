import { MODULE_NAME, TEMPLATES_FOLDER } from './libs/constants';
import BaseActorController from './abstract/BaseActorController.js';
import { activateChooser, ensureDefined, getTargets } from './libs/miscellaneous';
import AttackChooser from './attackChooser';
import { getHitLocationsObject } from './libs/locationsDataTransformation';
import { easyCombatActorfromToken } from './abstract/EasyCombatActor';
export default class LocationChooser extends BaseActorController {
  constructor(token, data = {}, promiseFuncs) {
    super('LocationChooser', token, easyCombatActorfromToken(token), {
      title: `Escoger postura - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/locationChooser.hbs`,
    });
    this.indexLocation = 0;
    this.data = data;
    this.hitLocations = getHitLocationsObject(game).hitLocations?.items || [];
    this.dataFromAttack = this.data.dataFromAttack || {};
    this.promiseFuncs = promiseFuncs;
  }
  getData() {
    return {
      hitLocations: {
        items: this.hitLocations,
        headers: ['roll', 'where', 'penalty', 'dr'],
        id: 'hit_locations',
      },
      data: this.data,
    };
  }
  activateListeners(html) {
    activateChooser(html, 'hit_locations', (index, element) => this.changeLocation(index, element));
    $('#closeAndReturn', html).click(() => {
      const token = this.token;
      ensureDefined(game.user, 'game not initialized');
      new AttackChooser(token, this.dataFromAttack).render(true);
      this.closeForEveryone();
    });
  }
  async changeLocation(index, element) {
    ensureDefined(game.user, 'game not initialized');
    const target = getTargets(game.user)[0] || {};
    ensureDefined(target, 'target has no actor');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const hitLocationsValues = easyCombatActorfromToken(target).getHitLocations();
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
//# sourceMappingURL=locationChooser.js.map
