import { TEMPLATES_FOLDER } from './libs/constants';
import { getPostures } from '../dataExtractor.js';
import BaseActorController from './abstract/BaseActorController.js';
import { activateChooser, ensureDefined } from './libs/miscellaneous';
import ManeuverChooser from './maneuverChooser';
import { easyCombatActorfromToken } from './abstract/EasyCombatActor';
export default class PostureChooser extends BaseActorController {
  constructor(token, data = {}, promiseFuncs) {
    super('PostureChooser', token, easyCombatActorfromToken(token), {
      title: `Escoger postura - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/postureChooser.hbs`,
    });
    this.indexLocation = 0;
    this.data = data;
    this.postures = getPostures();
    this.promiseFuncs = promiseFuncs;
  }
  getData() {
    const postures = getPostures().map((posture) => posture.tname);
    const postureData = postures.map((name) => ({
      name,
    }));
    return {
      posture: {
        items: postureData,
        headers: ['name'],
        id: 'postures',
      },
      data: this.data,
    };
  }
  activateListeners(html) {
    activateChooser(html, 'postures', (index) => this.changePosture(index));
    $('#closeAndReturn', html).click(() => {
      const token = this.token;
      ensureDefined(game.user, 'game not initialized');
      new ManeuverChooser(token).render(true);
      this.closeForEveryone();
    });
  }
  async changePosture(index) {
    ensureDefined(this.actor, 'you dont have actor');
    const posture = this.postures[index];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.actor.replacePosture(posture.name);
    this.closeForEveryone();
  }
  static request(token, data) {
    const promise = new Promise((resolve, reject) => {
      new PostureChooser(token, data, { resolve, reject }).render(true);
    });
    return promise;
  }
}
//# sourceMappingURL=postureChooser.js.map
