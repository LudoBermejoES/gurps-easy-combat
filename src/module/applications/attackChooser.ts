import { getMeleeModifiers, getRangedModifiers, makeAttackInner } from '../attackWorkflow.js';
import {
  ACROBATICS,
  FAST_DRAW_ARROW_SEARCH,
  FAST_DRAW_ARROW_WEAPONS,
  FENCING_WEAPONS,
  MODULE_NAME,
  TEMPLATES_FOLDER,
} from '../util/constants.js';
import { getAttacks, getHitLocations } from '../dataExtractor.js';
import { ChooserData, MeleeAttack, PromiseFunctions, RangedAttack, ReadyManeouverNeeded } from '../types.js';
import BaseActorController from './abstract/BaseActorController.js';
import {
  activateChooser,
  checkSingleTarget,
  ensureDefined,
  findSkillSpell,
  getCounterAttackLevel,
  getDisarmAttackLevel,
  getTargets,
} from '../util/miscellaneous.js';
import ManeuverChooser from './maneuverChooser';
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
  twoWeaponAttacksCount = 1;

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

  doAnimation(actor: Actor, name: string) {
    let anim = '';

    if (name.toLowerCase().includes('throwing knife')) {
      anim = '/anim Dagger01_01_Regular_White* *0.3';
    } else if (name.toLowerCase().includes('knife')) {
      anim = '/anim Dagger02_01_Regular_White* *0.3';
    } else if (name.toLowerCase().includes('spear')) {
      anim = '/anim Spear00_01* *0.3';
    } else if (name.toLowerCase().includes('great axe')) {
      anim = '/anim GreatAxe01_01_Regular_White* *0.3';
    } else if (name.toLowerCase().includes('axe')) {
      anim = '/anim HandAxe02_01_Regular_White* *0.3';
    } else if (name.toLowerCase().includes('greatsword')) {
      anim = '/anim GreatSword01_01_Regular_White* *0.3';
    } else if (name.toLowerCase().includes('shortsword')) {
      anim = '/anim Sword01_01_Regular_White* *0.3';
    } else if (name.toLowerCase().includes('maul')) {
      anim = '/anim Maul01_01_Regular_White* *0.3';
    } else if (name.toLowerCase().includes('rapier')) {
      anim = '/anim Rapier01_01_Regular_White* *0.3';
    } else if (name.toLowerCase().includes('mace')) {
      anim = '/anim Mace01_01* *0.3';
    } else if (name.toLowerCase().includes('bow')) {
      anim = '/anim Arrow01_01* *0.3';
    } else if (name.toLowerCase().includes('crossbow')) {
      anim = '/anim Bolt01_01_Regular* *0.3';
    }

    console.log(anim);
    2;
    if (anim) GURPS.executeOTF(anim, false, null, actor);
  }

  getData(): {
    disarmAttack: ChooserData<['weapon', 'mode', 'level', 'reach']>;
    counterAttack: ChooserData<['weapon', 'mode', 'level', 'damage', 'reach']>;
    melee: ChooserData<['weapon', 'mode', 'level', 'damage', 'reach']>;
    ranged: ChooserData<['weapon', 'mode', 'level', 'damage', 'range', 'accuracy', 'bulk']>;
    hitLocations: ChooserData<['roll', 'where', 'penalty']>;
    weaponsToBeReady: ChooserData<['weapon', 'remainingRounds']>;
    data: AttackData;
  } {
    const { melee, ranged } = getAttacks(this.actor);

    const readyActionsWeaponNeeded = <{ items: ReadyManeouverNeeded[] } | { items: [] }>(
      this.token.document.getFlag(MODULE_NAME, 'readyActionsWeaponNeeded')
    );

    const meleeData = melee.map(({ name, mode, level, damage, reach, notes, itemid }) => ({
      weapon: name,
      mode,
      level,
      damage,
      reach,
      notes,
      itemid,
    }));

    const rangedDataOriginal = ranged.map(({ name, mode, level, damage, range, acc, bulk, notes, itemid }) => {
      const readyNeeded = readyActionsWeaponNeeded?.items.find((item) => item.itemId === itemid) || {
        itemId: '',
        remainingRounds: 0,
      };
      return {
        weapon: name,
        mode,
        level,
        damage,
        range,
        accuracy: acc,
        bulk,
        notes,
        remainingRounds: readyNeeded?.remainingRounds || 0,
      };
    });

    const rangedData = rangedDataOriginal.filter(
      (item: {
        mode: string;
        weapon: string;
        damage: string;
        notes: string;
        level: number;
        range: string;
        accuracy: string;
        bulk: string;
        remainingRounds: number;
      }) => !item.remainingRounds,
    );

    const weaponsToBeReadyData = rangedDataOriginal.filter(
      (item: {
        mode: string;
        weapon: string;
        damage: string;
        notes: string;
        level: number;
        range: string;
        accuracy: string;
        bulk: string;
        remainingRounds: number;
      }) => item.remainingRounds,
    );

    const counterAttackData = melee.map(({ name, mode, level, damage, reach }) => {
      return {
        weapon: name,
        mode,
        level: getCounterAttackLevel(this.actor, name, level),
        damage,
        reach,
      };
    });

    const disarmAttackData = melee.map(({ name, mode, level, damage, reach }) => {
      return {
        weapon: name,
        mode,
        level: getDisarmAttackLevel(this.actor, name, level),
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
        this.token.document.getFlag(MODULE_NAME, 'successDefenses')
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
        disarmAttack: {
          items: disarmAttackData,
          headers: ['weapon', 'mode', 'level', 'reach'],
          id: 'disarm_attacks',
        },
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
        weaponsToBeReady: {
          items: weaponsToBeReadyData,
          headers: ['weapon', 'remainingRounds'],
          id: 'weapons_to_be_ready',
        },
        data: this.data,
      };
    }

    return {
      disarmAttack: {
        items: disarmAttackData,
        headers: ['weapon', 'mode', 'level', 'reach'],
        id: 'disarm_attacks',
      },
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
      weaponsToBeReady: {
        items: weaponsToBeReadyData,
        headers: ['weapon', 'remainingRounds'],
        id: 'weapons_to_be_ready',
      },
      data: this.data,
    };
  }
  activateListeners(html: JQuery): void {
    activateChooser(html, 'disarm_attacks', (index) => this.makeAttack('disarm_attack', index));
    activateChooser(html, 'counter_attacks', (index) => this.makeAttack('counter_attack', index));
    activateChooser(html, 'melee_attacks', (index) => this.makeAttack('melee', index));
    activateChooser(html, 'ranged_attacks', (index) => this.makeAttack('ranged', index));
    activateChooser(html, 'weapons_to_be_ready', (index) => this.readyWeapon(index));
    activateChooser(html, 'hit_locations', (index, element) => this.chooseLocation(index, element));
    html.on('change', '#keepOpen', (event) => {
      this.data.keepOpen = $(event.currentTarget).is(':checked');
    });
    $('#closeAndReturn', html).click(() => {
      const token = this.token;
      ensureDefined(game.user, 'game not initialized');
      new ManeuverChooser(token).render(true);
      this.closeForEveryone();
    });
  }

  async readyWeapon(index: number): Promise<void> {
    const attack = getAttacks(this.actor).ranged[index];
    const readyActionsWeaponNeeded = <{ items: ReadyManeouverNeeded[] } | { items: [] }>(
      this.token.document.getFlag(MODULE_NAME, 'readyActionsWeaponNeeded')
    );
    let remainingRounds =
      (readyActionsWeaponNeeded.items.find((item) => item.itemId === attack.itemid) || {}).remainingRounds || 1;

    const hasFastDrawArrowSkills = findSkillSpell(this.actor, FAST_DRAW_ARROW_SEARCH, true, false);
    const isArrowWeapon = FAST_DRAW_ARROW_WEAPONS.find((element) => {
      if (attack.name.toUpperCase().includes(element)) {
        return true;
      }
    });

    if (hasFastDrawArrowSkills && isArrowWeapon && remainingRounds === 2) {
      const result = await GURPS.executeOTF(`SK:${hasFastDrawArrowSkills.name}`, false, null, undefined);
      if (result) {
        remainingRounds = remainingRounds - 2;
        this.token.document.setFlag(MODULE_NAME, 'readyActionsWeaponNeeded', {
          items: [...(readyActionsWeaponNeeded.items.filter((item) => item.itemId !== attack.itemid) || [])],
        });
        if (remainingRounds === 0) {
          const token = this.token;
          ensureDefined(game.user, 'game not initialized');
          new ManeuverChooser(token).render(true);
          this.closeForEveryone();
          return;
        }
      }
    }

    this.token.document.setFlag(MODULE_NAME, 'readyActionsWeaponNeeded', {
      items: [
        ...(readyActionsWeaponNeeded.items.filter((item) => item.itemId !== attack.itemid) || []),
        {
          itemId: attack.itemid,
          remainingRounds: remainingRounds - 1,
        },
      ],
    });
    await this.token.setManeuver('ready');
    this.closeForEveryone();
  }

  async makeAttack(mode: 'ranged' | 'melee' | 'counter_attack' | 'disarm_attack', index: number): Promise<void> {
    const iMode = mode === 'counter_attack' || mode === 'disarm_attack' ? 'melee' : mode;
    ensureDefined(game.user, 'game not initialized');
    if (!checkSingleTarget(game.user)) return;
    const target = getTargets(game.user)[0];
    ensureDefined(target.actor, 'target has no actor');
    const attack = getAttacks(this.actor)[iMode][index];

    if (iMode === 'melee') {
      const reach = (attack as MeleeAttack).reach;
      const x = this.token.data.x;
      const y = this.token.data.y;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const distance = game.canvas.grid.measureDistance({ x, y }, target.center, { gridSpaces: true }) || 0;
      const calculatedDistance = distance === 0 ? 'C' : String(distance);
      const canAttack = reach.split(',').find((r) => calculatedDistance.toUpperCase() === r.toUpperCase());
      ensureDefined(canAttack, `No estás a distancia de ataque, el alcance de tu arma es ${reach}`);
    }

    const twoWeaponsAttack = attack.notes.toUpperCase().includes('DOUBLE ATTACK');
    const modifiers = AttackChooser.modifiersGetters[iMode](attack as RangedAttack & MeleeAttack, this.token, target);

    const rangedAttack = attack as RangedAttack;
    if (mode === 'ranged') {
      let remainingRounds = 0;
      if (rangedAttack.shots.includes('(')) {
        remainingRounds = Number(rangedAttack.shots.split('(')[1].split(')')[0]);
      }
      if (remainingRounds) {
        const readyActionsWeaponNeeded = <{ items: ReadyManeouverNeeded[] } | { items: [] }>(
          this.token.document.getFlag(MODULE_NAME, 'readyActionsWeaponNeeded')
        );
        const items =
          readyActionsWeaponNeeded?.items?.filter(
            (item: ReadyManeouverNeeded) => item.itemId !== rangedAttack.itemid,
          ) || [];
        this.token.document.setFlag(MODULE_NAME, 'readyActionsWeaponNeeded', {
          items: [
            ...(items || []),
            {
              itemId: rangedAttack.itemid,
              remainingRounds,
            },
          ],
        });
      }
    }

    if (
      !this.data.keepOpen &&
      (!this.data.twoAttacks || (this.data.twoAttacks && this.attackCount === 2)) &&
      (!twoWeaponsAttack || (twoWeaponsAttack && this.twoWeaponAttacksCount === 2))
    ) {
      this.close();
    } else {
      if (twoWeaponsAttack && this.twoWeaponAttacksCount === 1) {
        this.twoWeaponAttacksCount = 2;
      } else if (this.data.twoAttacks && this.attackCount === 1) {
        this.twoWeaponAttacksCount = 1;
        this.attackCount = 2;
      }
    }

    this.doAnimation(target.actor, attack.name);

    await makeAttackInner(
      this.actor,
      target,
      attack,
      iMode,
      modifiers,
      mode === 'counter_attack',
      mode === 'disarm_attack',
    );
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
