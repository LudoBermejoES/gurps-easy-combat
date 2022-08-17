// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Maneuvers from '/systems/gurps/module/actor/maneuver.js';
import { getDefenseModifiers } from '../defenseWorkflow';
import { ACROBATICS, allOutAttackManeuvers, FENCING_WEAPONS, MODULE_NAME, TEMPLATES_FOLDER } from '../util/constants';
import { getBlocks, getDodge, getParries } from '../dataExtractor';
import BaseActorController from './abstract/BaseActorController';
import {
  activateChooser,
  ensureDefined,
  findSkillSpell,
  getManeuver,
  getToken,
  highestPriorityUsers,
  isDefined,
  smartRace,
} from '../util/miscellaneous';
import { ChooserData, Modifier, Skill } from '../types';
import { applyModifiers } from '../util/actions';
import { useFatigue } from '../util/fatigue';
import { calculateDefenseModifiersFromEquippedWeapons } from '../util/modifiers';
import { getValidParries, Parry, saveLastParry } from '../util/parries';
import { getValidBlocks, saveLastBlock } from '../util/blocks';

interface DefenseData {
  resolve(value: boolean | PromiseLike<boolean>): void;
  reject(reason: string): void;
  modifiers: Modifier[];
  attackerId: string;
}

export const DEFENSE_NONE = 'none';
export const DEFENSE_DODGEBLOCK = 'dodge-block';

export default class DefenseChooser extends BaseActorController {
  data: DefenseData;

  constructor(token: Token, data: DefenseData) {
    super('DefenseChooser', token, {
      title: `Defense Chooser - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/defenseChooser.hbs`,
    });
    this.data = data;
    this.data.modifiers = [...this.data.modifiers, ...getDefenseModifiers(token, this.data.attackerId).defense];
  }

  async getData(): Promise<{
    canBlock: boolean;
    canDodge: boolean;
    canParry: boolean;
    dodge: number;
    acrobaticDodge: Skill;
    block: Record<string, number> | undefined;
    parries: ChooserData<['weapon', 'value']>;
  }> {
    const actor = this.token?.actor;
    ensureDefined(actor, 'Ese token necesita un actor');
    const maneuver = Maneuvers.getAll()[getManeuver(actor)]._data;
    let sumAllModifiers = 0;

    const modifiersByEquippedWeapons: {
      bonusDodge: number;
      bonusParry: number;
      bonusBlock: number;
    } = await calculateDefenseModifiersFromEquippedWeapons(this.actor, this.token);

    this.data.modifiers.forEach((m) => (sumAllModifiers += m.mod));

    return {
      canBlock: maneuver?.defense !== DEFENSE_NONE,
      canDodge: maneuver?.defense !== DEFENSE_NONE,
      canParry: ![DEFENSE_DODGEBLOCK, DEFENSE_NONE].includes(maneuver?.defense),
      acrobaticDodge: findSkillSpell(this.actor, ACROBATICS, true, false),
      dodge: getDodge(this.actor) + sumAllModifiers + modifiersByEquippedWeapons.bonusDodge,
      block: getValidBlocks(this.token, sumAllModifiers, modifiersByEquippedWeapons.bonusBlock),
      parries: {
        items: await getValidParries(this.token, sumAllModifiers, modifiersByEquippedWeapons.bonusParry),
        headers: ['weapon', 'value'],
        id: 'parries',
      },
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
    const isRetreating = $('#retreatDefense').is(':checked');
    const isProne = $('#proneDefense').is(':checked');
    const isFeverishDefense = $('#feverishDefense').is(':checked');

    if (isRetreating) {
      this.data.modifiers.push({ mod: +3, desc: 'Retrocediendo (tendrás un -2 al ataque en el próximo turno)' });
      this.addRetreatMalus();
    }

    if (isFeverishDefense) {
      this.data.modifiers.push({ mod: +2, desc: 'Defensa desesperada' });
      useFatigue(this.actor);
    }

    if (isProne) {
      this.data.modifiers.push({ mod: +3, desc: 'En el suelo (cambias tu posición a tumbado)' });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.actor.replacePosture('prone');
    }

    const { bonusDodge, bonusParry, bonusBlock } = await calculateDefenseModifiersFromEquippedWeapons(
      this.actor,
      this.token,
    );
    if (mode === 'DODGE' && bonusDodge) {
      this.data.modifiers.push({ mod: bonusDodge, desc: 'Bonus por escudo, capa u otro objeto' });
    }
    if (mode === 'PARRY' && bonusParry) {
      this.data.modifiers.push({ mod: bonusDodge, desc: 'Bonus por escudo, capa u otro objeto' });
    }
    if (mode === 'BLOCK' && bonusBlock) {
      this.data.modifiers.push({ mod: bonusDodge, desc: 'Bonus por escudo, capa u otro objeto' });
    }
  }

  activateListeners(html: JQuery): void {
    html.on('change', '.onlyOne', (evt) => {
      const lastValue = $(evt.target).prop('checked');
      $('.onlyOne').prop('checked', false);
      $(evt.target).prop('checked', lastValue);
    });
    html.on('click', '#dodge', async () => {
      await this.setLastModifiers('DODGE');
      applyModifiers(this.data.modifiers);
      const result = GURPS.performAction(
        {
          orig: 'Dodge',
          path: 'currentdodge',
          type: 'attribute',
        },
        this.actor,
      );
      this.closeForEveryone();
      this.data.resolve(result);
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

    activateChooser(html, 'parries', async (index: number) => {
      await this.setLastModifiers('PARRY');
      const parries: Parry[] = await getValidParries(this.token);
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

      await saveLastParry(parry.parryToStore, this.token.document);

      this.closeForEveryone();
      this.data.resolve(result);
    });

    html.on('click', '.blockRow', async (event) => {
      await this.setLastModifiers('BLOCK');
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
      await saveLastBlock({ round: game?.combat?.round || 0 }, this.token.document);

      this.closeForEveryone();
      this.data.resolve(result);
    });
  }
  static async attemptDefense(
    sceneId: string,
    tokenId: string,
    attackerId: string,
    modifiers: Modifier[],
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
      const instance = new DefenseChooser(token, { resolve, reject, modifiers, attackerId });
      instance.render(true);
    });
    return promise;
  }
  static async requestDefense(token: Token, modifiers: Modifier[], attackerTokenId: string): Promise<boolean> {
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
          );
        }),
      { allowRejects: false, default: false, filter: isDefined },
    );
    return result;
  }
}
