import { rollAttack } from '../attackWorkflow';
import { ChooserData, GurpsRoll, Item, PromiseFunctions, ReadyManeouverNeeded } from '../types';
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
import { meleeAttackWithRemainingRounds } from './abstract/mixins/EasyCombatCommonAttackDefenseExtractor';

export default class FeintDefense extends BaseActorController {
  resolve: (value: GurpsRoll | PromiseLike<GurpsRoll>) => void;
  reject: (reason: string) => void;

  constructor(token: Token, { resolve, reject }: PromiseFunctions<GurpsRoll>) {
    super('FeintDefense', token, {
      title: `Feint Defense - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/feint.hbs`,
    });
    this.resolve = resolve;
    this.reject = reject;
  }

  async getData(): Promise<ChooserData<['weapon', 'mode', 'levelWithModifiers', 'level', 'damage', 'reach']>> {
    const { meleeAttacksWithModifier } = await this.actor.getAttacksWithModifiers(this.token, undefined);
    return {
      items: meleeAttacksWithModifier,
      headers: ['weapon', 'mode', 'levelWithModifiers', 'level', 'damage', 'reach'],
      id: 'melee_attacks',
    };
  }

  async close(): Promise<void> {
    await super.close();
    this.reject('closed');
  }

  activateListeners(html: JQuery): void {
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

  static async attemptDefense(sceneId: string, tokenId: string): Promise<GurpsRoll> {
    const token = getToken(sceneId, tokenId);
    const promise = new Promise<GurpsRoll>((resolve, reject) => {
      const instance = new FeintDefense(token, { resolve, reject });
      instance.render(true);
    });
    return promise;
  }

  static async requestDefense(token: Token): Promise<GurpsRoll> {
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
