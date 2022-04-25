import { getDefenseModifiers } from '../defenseWorkflow';
import { ACROBATICS, allOutAttackManeuvers, FENCING_WEAPONS, MODULE_NAME, TEMPLATES_FOLDER } from '../util/constants';
import { getBlocks, getDodge, getParries } from '../dataExtractor';
import BaseActorController from './abstract/BaseActorController';
import {
  ensureDefined,
  findSkillSpell,
  getManeuver,
  getToken,
  highestPriorityUsers,
  isDefined,
  smartRace,
} from '../util/miscellaneous';
import { Modifier, Skill } from '../types';
import { applyModifiers } from '../util/actions';
import Action = SocketInterface.Requests.Action;
import ManeuverChooser from './maneuverChooser';

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
    this.data.modifiers = [...this.data.modifiers, ...getDefenseModifiers(token).defense];
  }
  getData(): {
    dodge: number;
    acrobaticDodge: Skill;
    parry: Record<string, number>;
    block: Record<string, number>;
  } {
    return {
      acrobaticDodge: findSkillSpell(this.actor, ACROBATICS, true, false),
      dodge: getDodge(this.actor),
      parry: getParries(this.actor),
      block: getBlocks(this.actor),
    };
  }
  async close(): Promise<void> {
    await super.close();
    this.data.reject('closed');
  }

  addRetreatMalus(): void {
    const round = game.combat?.round ?? 0;
    this.token.document.setFlag(MODULE_NAME, 'roundRetreatMalus', {
      round: round + 1,
      bonus: -2,
    });
  }

  activateListeners(html: JQuery): void {
    html.on('click', '#dodge', () => {
      applyModifiers(this.data.modifiers);
      const isRetreating = $('#retreat').val();
      if (isRetreating === 'on') {
        this.data.modifiers.push({ mod: +3, desc: 'Retrocediendo (tendrás un -2 al ataque en el próximo turno)' });
        this.addRetreatMalus();
      }

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
    html.on('click', '#acrobatic-dodge', async () => {
      const action = {
        orig: 'Sk:"Acrobatics"',
        type: 'skill-spell',
        isSpellOnly: false,
        isSkillOnly: true,
        name: 'Acrobatics',
        spantext: '<b>Sk:</b>Acrobatics',
      };
      applyModifiers(this.data.modifiers);
      const isRetreating = $('#retreat').val();
      if (isRetreating === 'on') {
        this.data.modifiers.push({ mod: +3, desc: 'Retrocediendo (tendrás un -2 al ataque en el próximo turno)' });
        this.addRetreatMalus();
      }
      const resultAcrobatic = await GURPS.performAction(action, this.actor);
      if (!resultAcrobatic) {
        this.data.modifiers.push({ mod: -2, desc: 'Fallo en esquiva acrobática' });
      } else {
        this.data.modifiers.push({ mod: +2, desc: 'Éxito en esquiva acrobática' });
      }

      $('#dodge')[0].click();
    });
    html.on('click', '.parryRow', (event) => {
      applyModifiers(this.data.modifiers);
      const isRetreating = $('#retreat').val();
      if (isRetreating === 'on') {
        this.data.modifiers.push({ mod: +1, desc: 'Retrocediendo (tendrás un -2 al ataque en el próximo turno)' });
        this.addRetreatMalus();
      }
      let lastParry = <{ times: number; round: number } | undefined>(
        this?.actor?.token?.getFlag(MODULE_NAME, 'lastParry')
      );
      const weapon = $(event.currentTarget).attr('weapon');
      if (!weapon) {
        ui.notifications?.error('no weapon attribute on clicked element');
        return;
      }
      if (lastParry?.round === game.combat?.round ?? 0) {
        const isFencingWeapon = FENCING_WEAPONS.some((v) => weapon.toUpperCase().includes(v));
        const times = lastParry?.times || 0;
        this.data.modifiers.push({
          mod: (isFencingWeapon ? -2 : -4) * times,
          desc: `Malus por haber parado previamente ${times} vez(ces)`,
        });
      } else {
        lastParry = undefined;
      }

      const result = GURPS.performAction(
        {
          isMelee: true,
          name: weapon,
          type: 'weapon-parry',
        },
        this.actor,
      );

      this.token.document.setFlag(MODULE_NAME, 'lastParry', {
        times: lastParry?.times ? lastParry.times + 1 : 1,
        round: game.combat?.round ?? 0,
      });

      this.closeForEveryone();
      this.data.resolve(result);
    });

    html.on('click', '.blockRow', (event) => {
      applyModifiers(this.data.modifiers);
      const isRetreating = $('#retreat').val();
      if (isRetreating === 'on') {
        this.data.modifiers.push({ mod: +1, desc: 'Retrocediendo (tendrás un -2 al ataque en el próximo turno)' });
        this.addRetreatMalus();
      }
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
