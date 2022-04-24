import { getMeleeModifiers, getRangedModifiers, makeAttackInner } from '../attackWorkflow.js';
import { MODULE_NAME, TEMPLATES_FOLDER } from '../util/constants.js';
import { getAttacks, getHitLocations } from '../dataExtractor.js';
import { ChooserData, MeleeAttack, PromiseFunctions, RangedAttack } from '../types.js';
import BaseActorController from './abstract/BaseActorController.js';
import { activateChooser, checkSingleTarget, ensureDefined, getTargets } from '../util/miscellaneous.js';
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

    ensureDefined(game.user, 'game not initialized');
    if (checkSingleTarget(game.user)) {
      const target = getTargets(game.user)[0];
      ensureDefined(target.actor, 'target has no actor');
      const hitLocationsValues = getHitLocations(target.actor);

      const hitLocationsData = hitLocationsValues.map(({ equipment, dr, roll, where, penalty }) => ({
        equipment,
        dr,
        roll,
        where,
        penalty,
      }));

      return {
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
    activateChooser(html, 'melee_attacks', (index) => this.makeAttack('melee', index));
    activateChooser(html, 'ranged_attacks', (index) => this.makeAttack('ranged', index));
    activateChooser(html, 'ranged_attacks', (index) => this.makeAttack('ranged', index));
    activateChooser(html, 'hit_locations', (index, element) => this.chooseLocation(index, element));
    html.on('change', '#keepOpen', (event) => {
      this.data.keepOpen = $(event.currentTarget).is(':checked');
    });
  }

  async makeAttack(mode: 'ranged' | 'melee', index: number): Promise<void> {
    ensureDefined(game.user, 'game not initialized');
    if (!checkSingleTarget(game.user)) return;
    const target = getTargets(game.user)[0];
    ensureDefined(target.actor, 'target has no actor');
    const attack = getAttacks(this.actor)[mode][index];
    const modifiers = AttackChooser.modifiersGetters[mode](attack as RangedAttack & MeleeAttack, this.token, target);

    if (!this.data.keepOpen && (!this.data.twoAttacks || (this.data.twoAttacks && this.attackCount === 2))) {
      this.close();
    } else {
      if (this.data.twoAttacks && this.attackCount === 1) {
        this.attackCount = 2;
      }
    }
    await makeAttackInner(this.actor, target, attack, mode, modifiers);
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
