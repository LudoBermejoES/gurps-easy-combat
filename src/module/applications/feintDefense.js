import { rollAttack } from '../attackWorkflow';
import { TEMPLATES_FOLDER } from './libs/constants';
import {
  activateChooser,
  ensureDefined,
  checkSingleTarget,
  highestPriorityUsers,
  smartRace,
  isDefined,
  getToken,
} from './libs/miscellaneous';
import BaseActorController from './abstract/BaseActorController';
import ManeuverChooser from './maneuverChooser';
import { easyCombatActorfromToken } from './abstract/EasyCombatActor';
export default class FeintDefense extends BaseActorController {
  constructor(token, { resolve, reject }) {
    super('FeintDefense', token, easyCombatActorfromToken(token), {
      title: `Feint Defense - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/feint.hbs`,
    });
    this.resolve = resolve;
    this.reject = reject;
  }
  async getData() {
    const { meleeAttacksWithModifier } = await this.actor.getAttacksWithModifiers(this.token, undefined);
    return {
      items: meleeAttacksWithModifier,
      headers: ['weapon', 'mode', 'levelWithModifiers', 'level', 'damage', 'reach'],
      id: 'melee_attacks',
    };
  }
  async close() {
    await super.close();
    this.reject('closed');
  }
  activateListeners(html) {
    activateChooser(html, 'melee_attacks', async (index) => {
      ensureDefined(game.user, 'game not initialized');
      if (!checkSingleTarget(game.user)) return;
      const attack = this.actor.getAttacks().melee[index];
      const attackResult = rollAttack(this.actor, attack, 'melee');
      this.resolve(attackResult);
      this.closeForEveryone();
    });
    $('#closeAndReturn', html).click(() => {
      const token = this.token;
      ensureDefined(game.user, 'game not initialized');
      new ManeuverChooser(token).render(true);
      this.closeForEveryone();
    });
  }
  static async attemptDefense(sceneId, tokenId) {
    const token = getToken(sceneId, tokenId);
    const promise = new Promise((resolve, reject) => {
      const instance = new FeintDefense(token, { resolve, reject });
      instance.render(true);
    });
    return promise;
  }
  static async requestDefense(token) {
    const actor = token.actor;
    ensureDefined(actor, 'token has no actor');
    const users = highestPriorityUsers(actor);
    const result = await smartRace(
      users.map(async (user) => {
        ensureDefined(user.id, 'user without id');
        ensureDefined(token.id, 'token without id');
        ensureDefined(token.scene.id, 'scene without id');
        return EasyCombat.socket.executeAsUser('attemptFeintDefense', user.id, token.scene.id, token.id);
      }),
      { allowRejects: false, filter: isDefined },
    );
    return result;
  }
}
//# sourceMappingURL=feintDefense.js.map
