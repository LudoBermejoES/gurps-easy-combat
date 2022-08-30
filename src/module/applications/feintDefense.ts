import { rollAttack } from '../attackWorkflow';
import { getAttacks } from '../dataExtractor';
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
import { getWeaponsFromAttacks } from './libs/weapons';
import { getReadyActionsWeaponNeeded } from './libs/readyWeapons';
import {
  getAttacksWithModifiers,
  getMeleeAttacksWithNotReamingRounds,
  getMeleeAttacksWithReadyWeapons,
  meleeAttackWithRemainingRounds,
} from './libs/attacksDataTransformation';

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
    const { meleeAttacksWithModifier } = await getAttacksWithModifiers(
      meleeData,
      [],
      this.actor,
      this.token,
      undefined,
    );
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
      const attack = getAttacks(this.actor).melee[index];
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
