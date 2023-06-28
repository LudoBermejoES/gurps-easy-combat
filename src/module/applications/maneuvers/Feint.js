import { rollAttack } from '../../attackWorkflow';
import { TEMPLATES_FOLDER } from '../libs/constants';
import {
  activateChooser,
  ensureDefined,
  checkSingleTarget,
  getTargets,
  highestPriorityUsers,
  smartRace,
  isDefined,
} from '../libs/miscellaneous';
import BaseActorController from '../abstract/BaseActorController';
import FeintDefense from '../feintDefense';
import ManeuverChooser from '../maneuverChooser';
import { easyCombatActorfromToken } from '../abstract/EasyCombatActor';
export default class Feint extends BaseActorController {
  constructor(token, promiseFuncs) {
    super('Feint', token, easyCombatActorfromToken(token), {
      title: `Feint - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/feint.hbs`,
    });
    this.promiseFuncs = promiseFuncs;
  }
  async getData() {
    const { meleeAttacksWithModifier } = await this.actor.getAttacksWithModifiers(this.token, undefined);
    return {
      items: meleeAttacksWithModifier,
      headers: ['weapon', 'mode', 'levelWithModifiers', 'level', 'damage', 'reach'],
      id: 'melee_attacks',
    };
  }
  setFlagInTarget(attacker, target, successMargin) {
    if (successMargin <= 0) return;
    const actor = target.actor;
    ensureDefined(actor, 'token has no actor');
    const users = highestPriorityUsers(actor);
    return smartRace(
      users
        .filter((user) => actor.testUserPermission(user, 'OWNER'))
        .map(async (user) => {
          ensureDefined(user.id, 'user without id');
          ensureDefined(target.id, 'token without id');
          ensureDefined(target.scene.id, 'scene without id');
          return EasyCombat.socket.executeAsUser('setFlag', user.id, target.scene.id, target.id, 'lastFeint', {
            successMargin,
            attackerId: attacker.id,
            round: game.combat?.round ?? 0,
          });
        }),
      { allowRejects: false, default: false, filter: isDefined },
    );
  }
  activateListeners(html) {
    activateChooser(html, 'melee_attacks', async (index) => {
      ensureDefined(game.user, 'game not initialized');
      if (!checkSingleTarget(game.user)) return;
      const target = getTargets(game.user)[0];
      if (!target) {
        ui.notifications?.error('target has no actor');
        return;
      }
      const attack = this.actor.getAttacks().melee[index];
      const attackResult = await rollAttack(this.actor, attack, 'melee');
      if (attackResult.failure) {
        this.close();
        return;
      }
      const defenseResult = await FeintDefense.requestDefense(target);
      let successMargin = attackResult.margin - defenseResult.margin;
      if (successMargin <= 0) {
        ChatMessage.create({ content: 'la finta no funcionó' });
        successMargin = 0;
      } else {
        ChatMessage.create({
          content: `la finta funcionó. El enemigo recibirá [-${successMargin} a la defensa por la finta]`,
        });
      }
      this.setFlagInTarget(this.token, target, successMargin);
      if (this.promiseFuncs) {
        this.promiseFuncs.resolve(successMargin);
      }
      this.close();
    });
    $('#closeAndReturn', html).click(() => {
      const token = this.token;
      ensureDefined(game.user, 'game not initialized');
      new ManeuverChooser(token).render(true);
      this.closeForEveryone();
    });
  }
  static async request(token) {
    const promise = new Promise((resolve, reject) => {
      new Feint(token, { resolve, reject }).render(true);
    });
    return promise;
  }
}
//# sourceMappingURL=Feint.js.map
