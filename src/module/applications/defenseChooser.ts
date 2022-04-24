import { getDefenseModifiers } from '../defenseWorkflow';
import { allOutAttackManeuvers, TEMPLATES_FOLDER } from '../util/constants';
import { getBlocks, getDodge, getParries } from '../dataExtractor';
import BaseActorController from './abstract/BaseActorController';
import {
  ensureDefined,
  getManeuver,
  getToken,
  highestPriorityUsers,
  isDefined,
  smartRace,
} from '../util/miscellaneous';
import { Modifier } from '../types';
import { applyModifiers } from '../util/actions';

interface DefenseData {
  resolve(value: boolean | PromiseLike<boolean>): void;
  reject(reason: string): void;
  modifiers: Modifier[];
}

export default class DefenseChooser extends BaseActorController {
  data: DefenseData;

  constructor(token: Token, data: DefenseData) {
    super('DefenseChooser', token, {
      title: `Defense Chooser - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/defenseChooser.hbs`,
    });
    this.data = data;
    this.data.modifiers = getDefenseModifiers(token).defense;
  }
  getData(): {
    dodge: number;
    parry: Record<string, number>;
    block: Record<string, number>;
  } {
    return {
      dodge: getDodge(this.actor),
      parry: getParries(this.actor),
      block: getBlocks(this.actor),
    };
  }
  async close(): Promise<void> {
    await super.close();
    this.data.reject('closed');
  }
  activateListeners(html: JQuery): void {
    html.on('click', '#dodge', () => {
      applyModifiers(this.data.modifiers);
      const result = GURPS.performAction(
        {
          orig: 'Dodge',
          path: 'currentdodge',
          type: 'attribute',
        },
        this.actor,
      );
      this.data.resolve(result);
      this.closeForEveryone();
    });
    html.on('click', '.parryRow', (event) => {
      applyModifiers(this.data.modifiers);
      const weapon = $(event.currentTarget).attr('weapon');
      if (!weapon) {
        ui.notifications?.error('no weapon attribute on clicked element');
        return;
      }
      const result = GURPS.performAction(
        {
          isMelee: true,
          name: weapon,
          type: 'weapon-parry',
        },
        this.actor,
      );
      this.closeForEveryone();
      this.data.resolve(result);
    });

    html.on('click', '.blockRow', (event) => {
      applyModifiers(this.data.modifiers);
      const weapon = $(event.currentTarget).attr('weapon');
      if (!weapon) {
        ui.notifications?.error('no weapon attribute on clicked element');
        return;
      }
      const result = GURPS.performAction(
        {
          isMelee: true,
          name: weapon,
          type: 'weapon-block',
        },
        this.actor,
      );
      this.closeForEveryone();
      this.data.resolve(result);
    });
  }
  static async attemptDefense(sceneId: string, tokenId: string, modifiers: Modifier[]): Promise<boolean> {
    const token = getToken(sceneId, tokenId);
    const actor = token.actor;
    ensureDefined(actor, 'token without actor');
    if (allOutAttackManeuvers.includes(getManeuver(actor))) {
      ChatMessage.create({ content: `${actor.name} can't defend because he is using all out attack` });
      return false;
    }
    const promise = new Promise<boolean>((resolve, reject) => {
      const instance = new DefenseChooser(token, { resolve, reject, modifiers });
      instance.render(true);
    });
    return promise;
  }
  static async requestDefense(token: Token, modifiers: Modifier[], attacker: Actor): Promise<boolean> {
    const actor = token.actor;
    ensureDefined(actor, 'token has no actor');
    const users = highestPriorityUsers(actor);
    const result = await smartRace(
      users
        .filter((user) => actor.testUserPermission(user, 'OWNER'))
        .map(async (user) => {
          ensureDefined(user.id, 'user without id');
          ensureDefined(token.id, 'token without id');
          ensureDefined(token.scene.id, 'scene without id');
          return EasyCombat.socket.executeAsUser('attemptDefense', user.id, token.scene.id, token.id, modifiers);
        }),
      { allowRejects: false, default: false, filter: isDefined },
    );
    return result;
  }
}
