import { MODULE_NAME, TEMPLATES_FOLDER } from '../../util/constants';
import { checkSingleTarget, ensureDefined, getManeuver, getTargets } from '../../util/miscellaneous';
import BaseActorController from '../abstract/BaseActorController';
import ManeuverChooser from '../maneuverChooser';

export default class Evaluate extends BaseActorController {
  constructor(token: Token) {
    super('Evaluate', token, {
      title: `Evaluate - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/Evaluate.hbs`,
    });
    const actor: Actor = token.actor as Actor;
    const maneuver = getManeuver(actor);
    if (maneuver !== 'evaluate') {
      token.document.unsetFlag(MODULE_NAME, 'lastEvaluate');
    }

    ensureDefined(game.user, 'game not initialized');
    if (checkSingleTarget(game.user)) {
      const target = getTargets(game.user)[0];

      let bonus = 0;
      const lastEvaluate = <{ bonus: number; targetId: string } | undefined>(
        this.token.document.getFlag(MODULE_NAME, 'lastEvaluate')
      );
      if (lastEvaluate && target.id === lastEvaluate.targetId) {
        bonus = lastEvaluate.bonus;
      }
      this.token.document.setFlag(MODULE_NAME, 'lastEvaluate', {
        bonus: bonus < 3 ? bonus + 1 : bonus,
        targetId: target.id,
        round: game.combat?.round ?? 0,
      });
    }
  }
  activateListeners(html: JQuery): void {
    $('#closeAndReturn', html).click(() => {
      const token = this.token;
      ensureDefined(game.user, 'game not initialized');
      new ManeuverChooser(token).render(true);
      this.closeForEveryone();
    });
  }
}
