import BaseActorController from './abstract/BaseActorController';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Maneuvers from '/systems/gurps/module/actor/maneuver.js';
import { ACROBATICS, allOutAttackManeuvers, MODULE_NAME, TEMPLATES_FOLDER } from './libs/constants';
import {
  activateChooser,
  ensureDefined,
  findSkillSpell,
  getManeuver,
  getToken,
  highestPriorityUsers,
  isDefined,
  smartRace,
} from './libs/miscellaneous';
import { ChooserData, Modifier, Skill } from '../types';
import { applyModifiers } from './libs/actions';
import { useFatigue } from './libs/fatigue';
import { Block, Parry } from './abstract/mixins/EasyCombatDefenseExtractor';
import EasyCombatActor, { easyCombatActorfromToken } from './abstract/EasyCombatActor';

interface DefenseData {
  resolve(value: boolean | PromiseLike<boolean>): void;
  reject(reason: string): void;
  modifiers: Modifier[];
  attackerId: string;
  canUseModShield: boolean;
  feverishDefense: boolean;
  retreatDefense: boolean;
  proneDefense: boolean;
}

export const DEFENSE_NONE = 'none';
export const DEFENSE_DODGEBLOCK = 'dodge-block';

console.log('LLEGO A DEFENSE');
export default class DefenseChooser extends BaseActorController {
  data: DefenseData;
  canUseModShield: boolean;
  constructor(token: Token, data: DefenseData) {
    super('DefenseChooser', token, easyCombatActorfromToken(token), {
      title: `Defense Chooser - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/defenseChooser.hbs`,
    });
    this.data = data;
    this.data.modifiers = [...this.data.modifiers];
    this.canUseModShield = this.data.canUseModShield;
  }

  async getData(): Promise<{
    canBlock: boolean;
    canDodge: boolean;
    canParry: boolean;
    dodge: number;
    acrobaticDodge: Skill;
    parries: ChooserData<['weapon', 'value']>;
    blocks: ChooserData<['weapon', 'value']>;
    data: DefenseData;
  }> {
    return {
      ...(await this.actor.getCanBlockDodgeParry(this.canUseModShield)),
      acrobaticDodge: findSkillSpell(this.actor, ACROBATICS, true, false),
      dodge: await this.actor.getValidDodge(this.data, this.canUseModShield),
      parries: {
        items: await this.actor.getValidParries(this.token, this.data, this.canUseModShield),
        headers: ['weapon', 'value'],
        id: 'parries',
      },
      blocks: {
        items: await this.actor.getValidBlocks(this.token, this.data, this.canUseModShield),
        headers: ['weapon', 'value'],
        id: 'blocks',
      },
      data: this.data,
    };
  }
  async close(): Promise<void> {
    await super.close();
    this.data.reject('closed');
  }

  addRetreatMalus(): void {
    const round = game.combat?.round || 0;
    this.token.document.setFlag(MODULE_NAME, 'roundRetreatMalus', {
      round: round + 1,
      bonus: -2,
    });
  }

  async setLastModifiers(mode: string) {
    const {
      modifiers: modifiersBySelection,
      isRetreating,
      isFeverishDefense,
      isProne,
    } = await this.actor.getDefenseModifiersBySelection(mode);
    const modifiersByManeuver = this.actor.getDefenseModifiersByManeuver(this.data.attackerId, mode);
    const { modifiers: modifiersByMode } = await this.actor.getDefenseModifiersByMode(mode, this.canUseModShield);
    this.data.modifiers = [...this.data.modifiers, ...modifiersBySelection, ...modifiersByMode, ...modifiersByManeuver];
    if (isRetreating) {
      this.addRetreatMalus();
    }

    if (isFeverishDefense) {
      useFatigue(this.actor);
    }

    if (isProne) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.actor.replacePosture('prone');
    }
  }

  async showModifiers(mode: 'PARRY' | 'BLOCK' | 'DODGE', index: number, element: any | undefined): Promise<void> {
    setTimeout(async () => {
      let modifiers: Modifier[] = [];
      if (mode === 'PARRY') {
        const parries: Parry[] = await this.actor.getValidParries(this.token, this.data, this.canUseModShield);
        const parry = parries[index];
        modifiers = [
          ...this.data.modifiers,
          ...parry.modifiers,
          ...this.actor.getDefenseModifiersBySelection(mode).modifiers,
          ...this.actor.getDefenseModifiersByManeuver(this.data.attackerId, 'PARRY'),
          ...(await this.actor.getDefenseModifiersByMode(mode, this.canUseModShield)).modifiers,
          ...this.actor.getModifierByShock(),
          ...this.actor.getModifierByPosture('DEFENSE'),
        ];
      } else if (mode === 'BLOCK') {
        modifiers = [
          ...this.data.modifiers,
          ...this.actor.getDefenseModifiersBySelection(mode).modifiers,
          ...this.actor.getDefenseModifiersByManeuver(this.data.attackerId, 'BLOCK'),
          ...(await this.actor.getDefenseModifiersByMode(mode, this.canUseModShield)).modifiers,
          ...this.actor.getModifierByShock(),
          ...this.actor.getModifierByPosture('DEFENSE'),
        ];
      } else if (mode === 'DODGE') {
        modifiers = [
          ...this.data.modifiers,
          ...this.actor.getDefenseModifiersBySelection(mode).modifiers,
          ...this.actor.getDefenseModifiersByManeuver(this.data.attackerId, 'DODGE'),
          ...(await this.actor.getDefenseModifiersByMode(mode, this.canUseModShield)).modifiers,
          ...this.actor.getModifierByShock(),
          ...this.actor.getModifierByPosture('DEFENSE'),
        ];
      }

      if (modifiers.length) {
        const content = element.closest('.window-content');
        $('#extra_details').remove();

        let html = '<div><div class="card-title">Ataque</div></div><ul class="modifier-list">';

        modifiers.forEach((m: Modifier) => {
          if (m.mod > 0) {
            html += `<li class="glinkmodplus">+${m.mod} ${m.desc}</li>`;
          } else if (m.mod < 0) {
            html += `<li class="glinkmodminus">${m.mod} ${m.desc}</li>`;
          } else {
            html += `<li>+${m.mod} ${m.desc}</li>`;
          }
        });

        html += '</ul></div>';
        content.append(
          `<div class="app window-app" id='extra_details' style="z-index: 101; width: 300px; left: 100%; height: '${content.height()}'">${html}</div>`,
        );
      }
    }, 10);
    $(element).on('mouseout', () => {
      $('#extra_details').remove();
    });
  }

  async showDialogSecondDefense(): Promise<string> {
    return new Promise((resolve, reject) => {
      const d: Dialog = new Dialog({
        title: '¡Has fallado!',
        content:
          '<p>Has fallado, pero al escoger defensa doble puedes escoger otra defensa para este ataque.</p>' +
          '<p>¿Quieres intentarlo?</p>',
        buttons: {
          yes: {
            label: '¡Sí!',
            callback: () => resolve('repeat'),
          },
          no: {
            icon: '<i class="fas fa-times"></i>',
            label: '¡No!',
            callback: () => resolve('no_repeat'),
          },
        },
        default: 'right',
      });
      d.render(true);
    });
  }

  async checkResult(result: boolean, mode: string) {
    if (!result) {
      if (getManeuver(this.actor) === 'aod_double') {
        const lastAodDouble = <{ mode: string; round: number; times: number } | undefined>(
          this.token.document.getFlag(MODULE_NAME, 'lastAodDouble')
        );
        if (!lastAodDouble || lastAodDouble.round !== game?.combat?.round || (0 && lastAodDouble.times !== 2)) {
          const response = await this.showDialogSecondDefense();
          if (response === 'repeat') {
            await this.token.document.setFlag(MODULE_NAME, 'lastAodDouble', {
              mode,
              round: game?.combat?.round || 0,
              times: 1,
            });
            this.render(true);
            return;
          }
        }
      }
    }
    this.closeForEveryone();
    this.data.resolve(result);
  }

  activateListeners(html: JQuery): void {
    html.on('change', '.onlyOne', (evt) => {
      const lastValue = $(evt.target).prop('checked');
      $('.onlyOne').prop('checked', false);
      $(evt.target).prop('checked', lastValue);
    });

    html.on('change', '#feverishDefense, #retreatDefense, #proneDefense', (evt) => {
      setTimeout(() => {
        const feverishDefense = $('#feverishDefense').is(':checked');
        const retreatDefense = $('#retreatDefense').is(':checked');
        const proneDefense = $('#proneDefense').is(':checked');
        this.data.feverishDefense = feverishDefense;
        this.data.retreatDefense = retreatDefense;
        this.data.proneDefense = proneDefense;
        this.render(false);
      }, 50);
    });

    html.on('mouseover', '#dodges tr.clickable', async (event) => {
      const element = $(event.currentTarget);
      const indexString = element.attr('index');
      if (!indexString) {
        ui.notifications?.error('no index on clicked element');
        throw new Error('no index on clicked element');
      }
      const index = parseInt(indexString);

      this.showModifiers('DODGE', index, element);
    });

    html.on('click', '#dodge', async () => {
      await this.setLastModifiers('DODGE');
      applyModifiers(this.data.modifiers);
      const result = await GURPS.performAction(
        {
          orig: 'Dodge',
          path: 'currentdodge',
          type: 'attribute',
        },
        this.actor,
      );
      this.checkResult(result, 'DODGE');
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
      const resultAcrobatic = await GURPS.performAction(action, this.actor);
      if (!resultAcrobatic) {
        this.data.modifiers.push({ mod: -2, desc: 'Fallo en esquiva acrobática' });
      } else {
        this.data.modifiers.push({ mod: +2, desc: 'Éxito en esquiva acrobática' });
      }

      $('#dodge')[0].click();
    });

    activateChooser(
      html,
      'parries',
      async (index: number) => {
        await this.setLastModifiers('PARRY');
        const parries: Parry[] = await this.actor.getValidParries(this.token, this.data, this.canUseModShield);
        const parry = parries[index];

        applyModifiers([...this.data.modifiers, ...parry.modifiers]);
        const result = await GURPS.performAction(
          {
            isMelee: true,
            name: parry.originalName,
            type: 'weapon-parry',
          },
          this.actor,
        );

        await this.actor.saveLastParry(parry.parryToStore);
        this.checkResult(result, 'PARRY');
      },
      (index: number, element: JQuery<any>) => this.showModifiers('PARRY', index, element),
    );

    activateChooser(
      html,
      'blocks',
      async (index: number) => {
        await this.setLastModifiers('BLOCK');
        const blocks: Block[] = await this.actor.getValidBlocks(this.token, this.data, this.canUseModShield);
        const block = blocks[index];

        applyModifiers(this.data.modifiers);

        const result = await GURPS.performAction(
          {
            isMelee: true,
            name: block.originalName,
            type: 'weapon-block',
          },
          this.actor,
        );
        await this.actor.saveLastBlock({ round: game?.combat?.round || 0 });
        this.checkResult(result, 'BLOCK');
      },
      (index: number, element: JQuery<any>) => this.showModifiers('BLOCK', index, element),
    );
  }
  static async attemptDefense(
    sceneId: string,
    tokenId: string,
    attackerId: string,
    modifiers: Modifier[],
    canUseModShield: boolean,
  ): Promise<boolean> {
    const token = getToken(sceneId, tokenId);
    const actor = token.actor;
    ensureDefined(actor, 'token without actor');
    if (allOutAttackManeuvers.includes(getManeuver(actor))) {
      ChatMessage.create({ content: `${actor.name} no puede defenderse porque ha utilizado Ataque total (lo siento)` });
      return false;
    }
    const promise = new Promise<boolean>((resolve, reject) => {
      const maneuver = Maneuvers.getAll()[getManeuver(actor)]._data;
      if (maneuver.defense === DEFENSE_NONE) {
        reject(false);
        return;
      }
      const instance = new DefenseChooser(token, {
        resolve,
        reject,
        modifiers,
        attackerId,
        canUseModShield,
        feverishDefense: false,
        retreatDefense: false,
        proneDefense: false,
      });
      instance.render(true);
    });
    return promise;
  }
  static async requestDefense(
    token: Token,
    modifiers: Modifier[],
    attackerTokenId: string,
    canUseModShield: boolean,
  ): Promise<boolean> {
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

          return EasyCombat.socket.executeAsUser(
            'attemptDefense',
            user.id,
            token.scene.id,
            token.id,
            attackerTokenId,
            modifiers,
            canUseModShield,
          );
        }),
      { allowRejects: false, default: false, filter: isDefined },
    );
    return result;
  }
}
