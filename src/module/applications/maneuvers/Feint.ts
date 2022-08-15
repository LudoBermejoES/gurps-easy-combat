import { rollAttack } from '../../attackWorkflow';
import { getAttacks } from '../../dataExtractor';
import { ChooserData, Item, PromiseFunctions, ReadyManeouverNeeded } from '../../types';
import { MODULE_NAME, TEMPLATES_FOLDER } from '../../util/constants';
import { activateChooser, ensureDefined, checkSingleTarget, getTargets } from '../../util/miscellaneous';
import BaseActorController from '../abstract/BaseActorController';
import FeintDefense from '../feintDefense';
import ManeuverChooser from '../maneuverChooser';
import { getWeaponsFromAttacks } from '../../util/weapons';
import { getReadyActionsWeaponNeeded } from '../../util/readyWeapons';
import {
  getAttacksWithModifiers,
  getMeleeAttacksWithNotReamingRounds,
  getMeleeAttacksWithReadyWeapons,
  meleeAttackWithRemainingRounds,
} from '../../util/attacksDataTransformation';

export default class Feint extends BaseActorController {
  promiseFuncs: PromiseFunctions<number> | undefined;

  constructor(token: Token, promiseFuncs?: PromiseFunctions<number>) {
    super('Feint', token, {
      title: `Feint - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/feint.hbs`,
    });
    this.promiseFuncs = promiseFuncs;
  }

  async getData(): Promise<ChooserData<['weapon', 'mode', 'levelWithModifiers', 'level', 'damage', 'reach']>> {
    const { melee } = getAttacks(this.actor);
    const weapons: Item[] = getWeaponsFromAttacks(this.actor);
    const readyActionsWeaponNeeded: { items: ReadyManeouverNeeded[] } = getReadyActionsWeaponNeeded(
      this.token.document,
    );
    const meleeDataOriginal: meleeAttackWithRemainingRounds[] = getMeleeAttacksWithReadyWeapons(
      melee.filter((m) => m.itemid !== undefined),
      readyActionsWeaponNeeded,
      weapons,
    );
    const meleeData: meleeAttackWithRemainingRounds[] = getMeleeAttacksWithNotReamingRounds(meleeDataOriginal);
    const { meleeAttacksWithModifier } = await getAttacksWithModifiers(meleeData, [], this.actor, this.token);
    return {
      items: meleeAttacksWithModifier,
      headers: ['weapon', 'mode', 'levelWithModifiers', 'level', 'damage', 'reach'],
      id: 'melee_attacks',
    };
  }

  activateListeners(html: JQuery): void {
    activateChooser(html, 'melee_attacks', async (index) => {
      ensureDefined(game.user, 'game not initialized');
      if (!checkSingleTarget(game.user)) return;
      const target = getTargets(game.user)[0];
      if (!target) {
        ui.notifications?.error('target has no actor');
        return;
      }
      const attack = getAttacks(this.actor).melee[index];
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
      this.token.document.setFlag(MODULE_NAME, 'lastFeint', {
        successMargin,
        targetId: target.id,
        round: game.combat?.round ?? 0,
      });
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

  static async request(token: Token): Promise<number> {
    const promise = new Promise<number>((resolve, reject) => {
      new Feint(token, { resolve, reject }).render(true);
    });
    return promise;
  }
}
