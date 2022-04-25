import { getMeleeModifiers, getRangedModifiers, makeAttackInner } from '../attackWorkflow.js';
import { MODULE_NAME, TEMPLATES_FOLDER } from '../util/constants.js';
import { getAttacks, getHitLocations } from '../dataExtractor.js';
import { ChooserData, MeleeAttack, PromiseFunctions, RangedAttack } from '../types.js';
import BaseActorController from './abstract/BaseActorController.js';
import {
  activateChooser,
  checkSingleTarget,
  ensureDefined,
  findSkillSpell,
  getTargets,
} from '../util/miscellaneous.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

interface AttackData {
  meleeOnly?: boolean;
  rangedOnly?: boolean;
  keepOpen?: boolean;
  twoAttacks?: boolean;
}

interface Location {
  roll: string;
  where: string;
  penalty: string;
}

export default class AttackChooser extends BaseActorController {
  static modifiersGetters = {
    melee: getMeleeModifiers,
    ranged: getRangedModifiers,
  };

  attackCount = 1;

  data: AttackData;
  attacks: {
    melee: MeleeAttack[];
    ranged: RangedAttack[];
  };
  indexLocation = 0;

  promiseFuncs: PromiseFunctions<void> | undefined;

  constructor(token: Token, data: AttackData = {}, promiseFuncs?: PromiseFunctions<void>) {
    super('AttackChooser', token, {
      title: `Attack Chooser - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/attackChooser.hbs`,
    });
    this.data = data;
    this.attacks = getAttacks(this.actor);

    this.promiseFuncs = promiseFuncs;
  }
  getData(): {
    counterAttack: ChooserData<['weapon', 'mode', 'level', 'damage', 'reach']>;
    melee: ChooserData<['weapon', 'mode', 'level', 'damage', 'reach']>;
    ranged: ChooserData<['weapon', 'mode', 'level', 'damage', 'range', 'accuracy', 'bulk']>;
    hitLocations: ChooserData<['roll', 'where', 'penalty']>;
    data: AttackData;
  } {
    const { melee, ranged } = getAttacks(this.actor);

    const meleeData = melee.map(({ name, mode, level, damage, reach }) => ({
      weapon: name,
      mode,
      level,
      damage,
      reach,
    }));
    const rangedData = ranged.map(({ name, mode, level, damage, range, acc, bulk }) => ({
      weapon: name,
      mode,
      level,
      damage,
      range,
      accuracy: acc,
      bulk,
    }));

    const counterAttackData = melee.map(({ name, mode, level, damage, reach }) => {
      const counterAttack = findSkillSpell(this.actor, 'Counterattack ', true, false);
      let levelCounter = level - 5;
      if (counterAttack) {
        const weapon = counterAttack.name.split('Counterattack ').join('');
        levelCounter = name.indexOf(weapon) > -1 ? counterAttack.level : level - 5;
      }
      return {
        weapon: name,
        mode,
        level: levelCounter,
        damage,
        reach,
      };
    });

    ensureDefined(game.user, 'game not initialized');
    if (checkSingleTarget(game.user)) {
      const target = getTargets(game.user)[0];
      ensureDefined(target.actor, 'target has no actor');
      const hitLocationsValues = getHitLocations(target.actor);

      const successDefenses = <{ attackers: string[]; round: number } | undefined>(
        this?.actor?.token?.getFlag(MODULE_NAME, 'successDefenses')
      );

      const targetId = target?.id;
      if (targetId) {
        const roundSuccess = (successDefenses?.round || 0) === game.combat?.round ?? 0;
        const attackers = (roundSuccess && successDefenses?.attackers) || [];
        if (!attackers.includes(targetId)) {
          counterAttackData.length = 0;
        }
      }

      const hitLocationsData = hitLocationsValues.map(({ equipment, dr, roll, where, penalty }) => ({
        equipment,
        dr,
        roll,
        where,
        penalty,
      }));

      return {
        counterAttack: {
          items: counterAttackData,
          headers: ['weapon', 'mode', 'level', 'damage', 'reach'],
          id: 'counter_attacks',
        },
        melee: {
          items: meleeData,
          headers: ['weapon', 'mode', 'level', 'damage', 'reach'],
          id: 'melee_attacks',
        },
        ranged: {
          items: rangedData,
          headers: ['weapon', 'mode', 'level', 'damage', 'range', 'accuracy', 'bulk'],
          id: 'ranged_attacks',
        },
        hitLocations: {
          items: hitLocationsData,
          headers: ['roll', 'where', 'penalty'],
          id: 'hit_locations',
        },
        data: this.data,
      };
    }

    return {
      counterAttack: {
        items: counterAttackData,
        headers: ['weapon', 'mode', 'level', 'damage', 'reach'],
        id: 'counter_attacks',
      },
      melee: {
        items: meleeData,
        headers: ['weapon', 'mode', 'level', 'damage', 'reach'],
        id: 'melee_attacks',
      },
      ranged: {
        items: rangedData,
        headers: ['weapon', 'mode', 'level', 'damage', 'range', 'accuracy', 'bulk'],
        id: 'ranged_attacks',
      },
      hitLocations: {
        items: [],
        headers: ['roll', 'where', 'penalty'],
        id: 'hit_locations',
      },
      data: this.data,
    };
  }
  activateListeners(html: JQuery): void {
    activateChooser(html, 'counter_attacks', (index) => this.makeAttack('counter_attack', index));
    activateChooser(html, 'melee_attacks', (index) => this.makeAttack('melee', index));
    activateChooser(html, 'ranged_attacks', (index) => this.makeAttack('ranged', index));
    activateChooser(html, 'ranged_attacks', (index) => this.makeAttack('ranged', index));
    activateChooser(html, 'hit_locations', (index, element) => this.chooseLocation(index, element));
    html.on('change', '#keepOpen', (event) => {
      this.data.keepOpen = $(event.currentTarget).is(':checked');
    });
  }

  async makeAttack(mode: 'ranged' | 'melee' | 'counter_attack', index: number): Promise<void> {
    const iMode = mode === 'counter_attack' ? 'melee' : mode;
    ensureDefined(game.user, 'game not initialized');
    if (!checkSingleTarget(game.user)) return;
    const target = getTargets(game.user)[0];
    ensureDefined(target.actor, 'target has no actor');
    const attack = getAttacks(this.actor)[iMode][index];
    const modifiers = AttackChooser.modifiersGetters[iMode](attack as RangedAttack & MeleeAttack, this.token, target);

    if (!this.data.keepOpen && (!this.data.twoAttacks || (this.data.twoAttacks && this.attackCount === 2))) {
      this.close();
    } else {
      if (this.data.twoAttacks && this.attackCount === 1) {
        this.attackCount = 2;
      }
    }
    await makeAttackInner(this.actor, target, attack, iMode, modifiers, mode === 'counter_attack');
    if (this.promiseFuncs) {
      this.promiseFuncs.resolve();
    }
  }

  async chooseLocation(index: number, element: JQuery<any>): Promise<void> {
    ensureDefined(game.user, 'game not initialized');
    const target = getTargets(game.user)[0];
    ensureDefined(target.actor, 'target has no actor');
    const hitLocationsValues = getHitLocations(target.actor);
    const hitLocationsData = hitLocationsValues.map(({ equipment, dr, roll, where, penalty }) => ({
      roll,
      where,
      penalty,
    }));
    $(element).parent().find('*').removeAttr('selected');
    $(element).addClass('selected');

    const where = hitLocationsData[index].where || '';
    const penalty = hitLocationsData[index].penalty || 0;
    this.token.document.setFlag(MODULE_NAME, 'location', {
      where,
      bonus: Number(penalty),
    });
  }

  static request(token: Token, data?: AttackData): Promise<void> {
    const promise = new Promise<void>((resolve, reject) => {
      new AttackChooser(token, data, { resolve, reject }).render(true);
    });
    return promise;
  }
}
