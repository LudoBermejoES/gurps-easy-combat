import { getMeleeModifiers, getRangedModifiers, makeAttackInner } from '../attackWorkflow.js';
import { FAST_DRAW_SKILLS, MODULE_NAME, TEMPLATES_FOLDER } from '../util/constants.js';
import { getAttacks, getEquipment, getHitLocations } from '../dataExtractor.js';
import { ChooserData, Item, MeleeAttack, PromiseFunctions, RangedAttack, ReadyManeouverNeeded } from '../types.js';
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
import { getReadyActionsWeaponNeeded } from '../util/readyWeapons';
import { clearAmmunition, drawEquipment } from '../util/weaponMacrosCTA';
import { getWeaponsFromAttacks } from '../util/weapons';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

interface AttackData {
  meleeOnly?: boolean;
  rangedOnly?: boolean;
  keepOpen?: boolean;
  twoAttacks?: boolean;
  onlyReadyActions?: boolean;
  beforeCombat?: boolean;
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

  weaponsToBeReadyData: {
    itemid: string;
    remainingRounds: number;
    name: string;
    weapon: string;
  }[];

  weaponsNotToBeReadyData: {
    itemid: string;
    remainingRounds: number;
    name: string;
    weapon: string;
  }[];

  rangedData: {
    mode: string;
    weapon: string;
    damage: string;
    notes: string;
    level: number;
    range: string;
    accuracy: string;
    bulk: string;
    remainingRounds: number;
    rof: string;
    rcl: string;
  }[];

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
    this.rangedData = [];
    this.data = data;
    this.attacks = getAttacks(this.actor);
    this.weaponsToBeReadyData = [];
    this.weaponsNotToBeReadyData = [];
    this.promiseFuncs = promiseFuncs;
  }

  getData(): {
    onlyReadyActions: boolean;
    beforeCombat: boolean;
    disarmAttack: ChooserData<['weapon', 'mode', 'level', 'reach']>;
    counterAttack: ChooserData<['weapon', 'mode', 'level', 'damage', 'reach']>;
    melee: ChooserData<['weapon', 'mode', 'level', 'damage', 'reach']>;
    ranged: ChooserData<['weapon', 'rof', 'level', 'damage', 'range', 'accuracy', 'bulk']>;
    hitLocations: ChooserData<['roll', 'where', 'penalty']>;
    weaponsToBeReady: ChooserData<['weapon', 'remainingRounds']>;
    weaponsNotToBeReady: ChooserData<['weapon', 'remainingRounds']>;
    data: AttackData;
  } {
    const { melee, ranged } = getAttacks(this.actor);

    const readyActionsWeaponNeeded = getReadyActionsWeaponNeeded(this.token.document);

    const meleeDataOriginal = melee.map(({ name, mode, level, damage, reach, notes, itemid }) => {
      const readyNeeded = readyActionsWeaponNeeded?.items.find((item) => item.itemId === itemid) || {
        itemId: '',
        remainingRounds: 0,
      };
      return {
        weapon: name,
        mode,
        level,
        damage,
        reach,
        notes,
        itemid,
        remainingRounds: readyNeeded?.remainingRounds || 0,
      };
    });

    const meleeData = meleeDataOriginal.filter(
      (item: { mode: string; weapon: string; damage: string; notes: string; level: number; remainingRounds: number }) =>
        !item.remainingRounds,
    );

    const rangedDataOriginal = ranged.map(
      ({ name, mode, level, damage, range, acc, bulk, notes, itemid, rof, rcl }) => {
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
          itemid,
          rof,
          rcl,
          remainingRounds: readyNeeded?.remainingRounds || 0,
        };
      },
    );

    const rangedAttackValid = rangedDataOriginal.filter(
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
        rof: string;
        rcl: string;
      }) => !item.remainingRounds,
    );

    const rangedData = rangedAttackValid.filter((attack) => !attack.rof || attack.rof === '1');
    this.rangedData = rangedData;
    const rangedAttackWithROFMoreThan1 = rangedAttackValid.filter((attack) => attack.rof && attack.rof !== '1');
    rangedAttackWithROFMoreThan1.forEach((attack) => {
      if (attack.rof) {
        const rof = Number(attack.rof.split('!').join(''));
        for (let i = 1; i <= rof; i++) {
          const newAttack = { ...attack };
          newAttack.weapon += ` -- Disparar ${i} proyectiles`;
          newAttack.rof = String(i);
          if (i > 4) {
            const extraToHit = Math.ceil(i / 4) - 1;
            newAttack.level += extraToHit;
          }
          rangedData.push(newAttack);
        }
      }
    });

    const items: Item[] = getEquipment(this.actor);

    const attacksToBeReadyData = [
      ...rangedDataOriginal.filter(
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
      ),
      ...meleeDataOriginal.filter(
        (item: {
          mode: string;
          weapon: string;
          damage: string;
          notes: string;
          level: number;
          remainingRounds: number;
        }) => item.remainingRounds,
      ),
    ];

    const weaponsToBeReadyData: any = [];

    attacksToBeReadyData.map((attack) => {
      const itemFound: Item | undefined = items.find((item) => item.itemid === attack.itemid);
      if (itemFound) {
        const weaponAlreadyExists: any = weaponsToBeReadyData.filter((w: Item) => w.itemid === itemFound.itemid);
        if (!weaponAlreadyExists.length) {
          weaponsToBeReadyData.push({
            itemid: itemFound.itemid,
            weapon: itemFound.name,
            name: itemFound.name,
            remainingRounds: attack.remainingRounds,
          });
        }
      }
    });

    const weaponsNotToBeReadyData: any = [];
    [...meleeData, ...rangedData].map((attack) => {
      const itemFound: Item | undefined = items.find((item) => item.itemid === attack.itemid);
      if (itemFound) {
        const weaponAlreadyExists: any = weaponsNotToBeReadyData.filter((w: Item) => w.itemid === itemFound.itemid);
        if (!weaponAlreadyExists.length) {
          weaponsNotToBeReadyData.push({
            itemid: itemFound.itemid,
            weapon: itemFound.name,
            name: itemFound.name,
            remainingRounds: attack.remainingRounds,
          });
        }
      }
    });

    const counterAttackData = meleeData.map(({ weapon, mode, level, damage, reach }) => {
      return {
        weapon,
        mode,
        level: getCounterAttackLevel(this.actor, weapon, level),
        damage,
        reach,
      };
    });

    const disarmAttackData = meleeData.map(({ weapon, mode, level, damage, reach }) => {
      return {
        weapon,
        mode,
        level: getDisarmAttackLevel(this.actor, weapon, level),
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

      this.weaponsToBeReadyData = weaponsToBeReadyData;
      this.weaponsNotToBeReadyData = weaponsNotToBeReadyData;
      return {
        onlyReadyActions: this.data.onlyReadyActions || false,
        beforeCombat: this.data.beforeCombat || false,
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
          headers: ['weapon', 'rof', 'level', 'damage', 'range', 'accuracy', 'bulk'],
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
        weaponsNotToBeReady: {
          items: weaponsNotToBeReadyData,
          headers: ['weapon', 'remainingRounds'],
          id: 'weapons_not_to_be_ready',
        },
        data: this.data,
      };
    }

    this.weaponsToBeReadyData = weaponsToBeReadyData;
    this.weaponsNotToBeReadyData = weaponsNotToBeReadyData;
    return {
      onlyReadyActions: this.data.onlyReadyActions || false,
      beforeCombat: this.data.beforeCombat || false,
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
        headers: ['weapon', 'rof', 'level', 'damage', 'range', 'accuracy', 'bulk'],
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
      weaponsNotToBeReady: {
        items: weaponsNotToBeReadyData,
        headers: ['weapon', 'remainingRounds'],
        id: 'weapons_not_to_be_ready',
      },
      data: this.data,
    };
  }
  activateListeners(html: JQuery): void {
    activateChooser(html, 'disarm_attacks', (index) => this.makeAttack('disarm_attack', index, undefined));
    activateChooser(html, 'counter_attacks', (index) => this.makeAttack('counter_attack', index, undefined));
    activateChooser(html, 'melee_attacks', (index) => this.makeAttack('melee', index, undefined));
    activateChooser(html, 'ranged_attacks', (index, element) => this.makeAttack('ranged', index, element));
    activateChooser(html, 'weapons_to_be_ready', (index) => this.readyWeapon(index));
    activateChooser(html, 'weapons_not_to_be_ready', (index) => this.unReadyWeapon(index));
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
    $('#close', html).click(() => {
      this.closeForEveryone();
    });
  }

  async closeWindow() {
    this.closeForEveryone();
  }

  async unReadyWeapon(index: number): Promise<void> {
    const weapon = this.weaponsNotToBeReadyData[index];
    const readyActionsWeaponNeeded = getReadyActionsWeaponNeeded(this.token.document);

    await this.token.document.setFlag(MODULE_NAME, 'readyActionsWeaponNeeded', {
      items: [
        ...(readyActionsWeaponNeeded.items.filter((item) => item.itemId !== weapon.itemid) || []),
        {
          itemId: weapon.itemid,
          remainingRounds: 1,
        },
      ],
    });

    await drawEquipment(weapon.name, this.token, weapon.itemid);
    if (this.data.keepOpen || this.data.beforeCombat) {
      setTimeout(
        () =>
          new AttackChooser(this.token, {
            onlyReadyActions: this.data.onlyReadyActions,
            beforeCombat: this.data.beforeCombat,
          }).render(true),
        500,
      );
    }
  }

  async readyWeapon(index: number): Promise<void> {
    const weapon = this.weaponsToBeReadyData[index];

    const readyActionsWeaponNeeded = getReadyActionsWeaponNeeded(this.token.document);

    let remainingRounds =
      (readyActionsWeaponNeeded.items.find((item) => item.itemId === weapon.itemid) || {}).remainingRounds || 1;

    if (!this.data.beforeCombat) {
      for (const SKILL of Object.keys(FAST_DRAW_SKILLS)) {
        const fastDrawSkill = findSkillSpell(this.actor, SKILL, true, false);
        if (fastDrawSkill) {
          const SKILLS = FAST_DRAW_SKILLS[SKILL];
          const hasWeapon = SKILLS.find((element: any) => {
            if (weapon.name.toUpperCase().includes(element)) {
              return true;
            }
          });
          if (fastDrawSkill && hasWeapon && remainingRounds === 1) {
            const result = await GURPS.executeOTF(`SK:${fastDrawSkill.name}`, false, null, undefined);
            if (result) {
              remainingRounds = remainingRounds - 2;
              await this.token.document.setFlag(MODULE_NAME, 'readyActionsWeaponNeeded', {
                items: [...(readyActionsWeaponNeeded.items.filter((item) => item.itemId !== weapon.itemid) || [])],
              });
              if (remainingRounds <= 0) {
                const token = this.token;
                await drawEquipment(weapon.name, token, weapon.itemid);
                this.closeForEveryone();
                setTimeout(
                  () =>
                    new AttackChooser(this.token, {
                      onlyReadyActions: this.data.onlyReadyActions,
                      beforeCombat: this.data.beforeCombat,
                    }).render(true),
                  500,
                );
                return;
              }
            }
          }
        }
      }
    }

    await this.token.document.setFlag(MODULE_NAME, 'readyActionsWeaponNeeded', {
      items: [
        ...(readyActionsWeaponNeeded.items.filter((item) => item.itemId !== weapon.itemid) || []),
        {
          itemId: weapon.itemid,
          remainingRounds: remainingRounds - 1 <= 0 ? 0 : remainingRounds - 1,
        },
      ],
    });

    if (remainingRounds - 1 <= 0) await drawEquipment(weapon.name, this.token, weapon.itemid);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.drawEquipment = drawEquipment;
    if (!this.data.beforeCombat) await this.token.setManeuver('ready');
    this.closeForEveryone();

    if (this.data.keepOpen || this.data.beforeCombat) {
      setTimeout(
        () =>
          new AttackChooser(this.token, {
            onlyReadyActions: this.data.onlyReadyActions,
            beforeCombat: this.data.beforeCombat,
          }).render(true),
        500,
      );
    }
  }

  async makeAttack(
    mode: 'ranged' | 'melee' | 'counter_attack' | 'disarm_attack',
    index: number,
    element: any | undefined,
  ): Promise<void> {
    const iMode = mode === 'counter_attack' || mode === 'disarm_attack' ? 'melee' : mode;
    ensureDefined(game.user, 'game not initialized');
    if (!checkSingleTarget(game.user)) return;
    const target = getTargets(game.user)[0];
    ensureDefined(target.actor, 'target has no actor');
    let attack = getAttacks(this.actor)[iMode][index];

    if (mode === 'ranged') {
      const attackData = this.rangedData[index];
      const rangedAttacks = getAttacks(this.actor)[iMode] as RangedAttack[];
      const originalAttack = rangedAttacks.find((attack: any) => attack.name === attackData.weapon.split(' --')[0]);
      ensureDefined(element, 'target has no actor');
      if (originalAttack) {
        attack = { ...originalAttack };
        attack.level = Number(element.find('.level').text());
      }
    }

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

    const twoWeaponsAttack = mode == 'melee' && attack.notes.toUpperCase().includes('DOUBLE ATTACK');
    const modifiers = AttackChooser.modifiersGetters[iMode](attack as RangedAttack & MeleeAttack, this.token, target);

    const rangedAttack = attack as RangedAttack;
    if (mode === 'ranged') {
      let remainingRounds = 0;
      if (rangedAttack.shots && rangedAttack.shots.includes('(') && Number(rangedAttack.shots.split('(')[0]) === 1) {
        remainingRounds = Number(rangedAttack.shots.split('(')[1].split(')')[0]);
      }
      if (rangedAttack.shots && rangedAttack.shots.includes('(') && rangedAttack.shots.split('(')[0] === 'T') {
        remainingRounds = Number(rangedAttack.shots.split('(')[1].split(')')[0]);
      }
      if (remainingRounds) {
        const weapons: Item[] = getWeaponsFromAttacks(this.actor);
        const weaponToRemoveAmmo: Item | undefined = weapons.find((w) => w.itemid === rangedAttack.itemid);
        if (weaponToRemoveAmmo) {
          clearAmmunition(weaponToRemoveAmmo.name, this.token);
        }
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
    $(element).parent().find('*').removeClass('selected');
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
