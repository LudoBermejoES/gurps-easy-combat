import { makeAttackInner } from '../attackWorkflow.js';
import { FAST_DRAW_SKILLS, MODULE_NAME, TEMPLATES_FOLDER } from '../util/constants.js';
import { getAttacks, getHitLocations } from '../dataExtractor.js';
import { ChooserData, Item, MeleeAttack, PromiseFunctions, RangedAttack, ReadyManeouverNeeded } from '../types.js';
import BaseActorController from './abstract/BaseActorController.js';
import {
  activateChooser,
  checkSingleTarget,
  ensureDefined,
  findSkillSpell,
  getTargets,
} from '../util/miscellaneous.js';
import ManeuverChooser from './maneuverChooser';
import { checkIfRemoveWeaponFromHandNeeded, getReadyActionsWeaponNeeded } from '../util/readyWeapons';
import { addAmmunition, drawEquipment, getEquippedItems, removeItemById, equippedItem } from '../util/weaponMacrosCTA';
import {
  getWeaponsFromAttacks,
  weaponToBeReady,
  getWeaponsToBeReady,
  weaponNotToBeReady,
  getWeaponsNotToBeReady,
  getWeaponFromAttack,
} from '../util/weapons';
import { getMeleeModifiers, getRangedModifiers } from './actions/modifiers';
import {
  counterAndDisarmAttackData,
  getAttacksWithModifiers,
  getCounterAttackData,
  getDisarmAttackData,
  getExtraRangedAttacksPerROF,
  getMeleeAttacksWithNotReamingRounds,
  getMeleeAttacksWithReadyWeapons,
  getRangedAttacksWithNotReamingRounds,
  getRangedAttacksWithReadyWeapons,
  getRangedDataWithROFMoreThan1,
  meleeAttackWithRemainingRounds,
  rangedAttackWithRemainingRounds,
} from '../util/attacksDataTransformation';
import { getHitLocationsObject, getLocationData } from '../util/locationsDataTransformation';
import { calculateModifiersFromAttack } from '../util/modifiers';
import { calculateAmmunitionForRangedAttacks } from '../util/ammo';
import { useFatigue } from '../util/fatigue';
import LocationChooser from './locationChooser';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.drawEquipment = drawEquipment;

export interface AttackData {
  meleeOnly?: boolean;
  rangedOnly?: boolean;
  keepOpen?: boolean;
  twoAttacks?: boolean;
  attackCount?: number;
  onlyReadyActions?: boolean;
  beforeCombat?: boolean;
  maneuver?: string;
  locationToAttack?: any;
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

  counterAttackData: meleeAttackWithRemainingRounds[] = [];
  disarmAttackData: meleeAttackWithRemainingRounds[] = [];

  rangedData: rangedAttackWithRemainingRounds[];

  meleeData: meleeAttackWithRemainingRounds[];

  twoWeaponAttacksCount = 1;

  data: AttackData;
  attacks: {
    melee: MeleeAttack[];
    ranged: RangedAttack[];
  };

  promiseFuncs: PromiseFunctions<void> | undefined;

  constructor(token: Token, data: AttackData = {}, promiseFuncs?: PromiseFunctions<void>, maneuver?: string) {
    super('AttackChooser', token, {
      title: `Attack Chooser - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/attackChooser.hbs`,
    });
    this.meleeData = [];
    this.rangedData = [];
    this.data = data;
    if (this.data.twoAttacks && !this.data.attackCount) this.data.attackCount = 1;
    this.attacks = getAttacks(this.actor);
    this.weaponsToBeReadyData = [];
    this.weaponsNotToBeReadyData = [];
    this.promiseFuncs = promiseFuncs;
  }

  async getData(): Promise<{
    onlyReadyActions: boolean;
    beforeCombat: boolean;
    disarmAttack: ChooserData<['weapon', 'mode', 'level', 'levelWithModifiers', 'reach']>;
    counterAttack: ChooserData<['weapon', 'mode', 'level', 'damage', 'reach']>;
    melee: ChooserData<['weapon', 'mode', 'level', 'levelWithModifiers', 'damage', 'reach']>;
    ranged: ChooserData<['weapon', 'rof', 'level', 'levelWithModifiers', 'damage', 'range', 'accuracy']>;
    hitLocations: ChooserData<['roll', 'where', 'penalty', 'dr']>;
    weaponsToBeReady: ChooserData<['weapon', 'remainingRounds']>;
    weaponsNotToBeReady: ChooserData<['weapon', 'remainingRounds']>;
    data: AttackData;
    maneuver: string | undefined;
  }> {
    const { melee, ranged } = getAttacks(this.actor);
    const weapons: Item[] = getWeaponsFromAttacks(this.actor);

    const readyActionsWeaponNeeded: { items: ReadyManeouverNeeded[] } = getReadyActionsWeaponNeeded(
      this.token.document,
    );

    const meleeDataOriginal: meleeAttackWithRemainingRounds[] = getMeleeAttacksWithReadyWeapons(
      melee,
      readyActionsWeaponNeeded,
      weapons,
    );

    const meleeData: meleeAttackWithRemainingRounds[] = getMeleeAttacksWithNotReamingRounds(meleeDataOriginal);
    this.meleeData = meleeData;

    const rangedDataOriginal: rangedAttackWithRemainingRounds[] = getRangedAttacksWithReadyWeapons(
      ranged,
      readyActionsWeaponNeeded,
      this.actor,
    );

    const rangedAttackValid: rangedAttackWithRemainingRounds[] =
      getRangedAttacksWithNotReamingRounds(rangedDataOriginal);

    const visibleRangedData: rangedAttackWithRemainingRounds[] = getRangedDataWithROFMoreThan1(rangedAttackValid);

    const rangedData: rangedAttackWithRemainingRounds[] = [
      ...visibleRangedData,
      ...getExtraRangedAttacksPerROF(visibleRangedData, readyActionsWeaponNeeded, this.actor),
    ];

    this.rangedData = rangedData;
    const weaponsToBeReadyData: weaponToBeReady[] = getWeaponsToBeReady(
      meleeDataOriginal,
      rangedDataOriginal,
      this.actor,
    );

    const weaponsNotToBeReadyData: weaponNotToBeReady[] = getWeaponsNotToBeReady(
      meleeDataOriginal,
      rangedDataOriginal,
      this.actor,
    );

    const hitLocationsObject = getHitLocationsObject(game);

    this.weaponsToBeReadyData = weaponsToBeReadyData;
    this.weaponsNotToBeReadyData = weaponsNotToBeReadyData;

    const { meleeAttacksWithModifier, rangedAttacksWithModifier } = await getAttacksWithModifiers(
      meleeData,
      rangedData,
      this.actor,
      this.token,
    );

    const counterAttackData = getCounterAttackData(meleeAttacksWithModifier, this.token, this.actor);
    const disarmAttackData = getDisarmAttackData(game, this.token, meleeAttacksWithModifier, this.actor);
    this.counterAttackData = counterAttackData;
    this.disarmAttackData = disarmAttackData;

    const location: any = this.token.document.getFlag(MODULE_NAME, 'location');
    this.data.locationToAttack = getLocationData(game, location?.where || 'torso');

    return {
      onlyReadyActions: this.data.onlyReadyActions || false,
      beforeCombat: this.data.beforeCombat || false,
      disarmAttack: {
        items: disarmAttackData,
        headers: ['weapon', 'mode', 'level', 'levelWithModifiers', 'reach'],
        id: 'disarm_attacks',
      },
      counterAttack: {
        items: counterAttackData,
        headers: ['weapon', 'mode', 'level', 'damage', 'reach'],
        id: 'counter_attacks',
      },
      melee: {
        items: meleeAttacksWithModifier,
        headers: ['weapon', 'mode', 'level', 'levelWithModifiers', 'damage', 'reach'],
        id: 'melee_attacks',
      },
      ranged: {
        items: rangedAttacksWithModifier,
        headers: ['weapon', 'rof', 'level', 'levelWithModifiers', 'damage', 'range', 'accuracy'],
        id: 'ranged_attacks',
      },
      hitLocations: {
        items: hitLocationsObject.hitLocations?.items || [],
        headers: ['roll', 'where', 'penalty', 'dr'],
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
      maneuver: this?.actor?.data?.data?.conditions?.maneuver,
      data: this.data,
    };
  }

  activateListeners(html: JQuery): void {
    html.on('change', '.onlyOne', (evt) => {
      const lastValue = $(evt.target).prop('checked');
      $('.onlyOne').prop('checked', false);
      $(evt.target).prop('checked', lastValue);
    });

    html.on('click', '#showAdvancedCombat', () => {
      $('#advancedAttacks').show();
      $('#basicAttacks').hide();
    });

    html.on('click', '#showBasicCombat', () => {
      $('#advancedAttacks').hide();
      $('#basicAttacks').show();
    });

    html.on('click', '#chooseLocation', (evt) => {
      new LocationChooser(this.token, { keepOpen: false, dataFromAttack: this.data }).render(true);
      this.closeForEveryone();
    });

    activateChooser(html, 'disarm_attacks', (index: number) => this.makeAttack('disarm_attack', index, undefined));
    activateChooser(html, 'counter_attacks', (index: number) => this.makeAttack('counter_attack', index, undefined));
    activateChooser(html, 'melee_attacks', (index: number) => this.makeAttack('melee', index, undefined));
    activateChooser(html, 'ranged_attacks', (index: number, element: JQuery<any>) =>
      this.makeAttack('ranged', index, element),
    );
    activateChooser(html, 'weapons_to_be_ready', (index: number) => this.readyWeapon(index));
    activateChooser(html, 'weapons_not_to_be_ready', (index: number) => this.unReadyWeaponChooser(index));
    activateChooser(html, 'hit_locations', (index: number, element: JQuery<any>) =>
      this.chooseLocation(index, element),
    );
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

  async unReadyWeapon(weapon: any, token: TokenDocument): Promise<void> {
    const readyActionsWeaponNeeded = getReadyActionsWeaponNeeded(token);
    let remainingRounds = 1;
    if (token.actor) {
      const { ranged } = getAttacks(token.actor);
      const rangedAttack: RangedAttack | undefined = ranged.find((i) => i.itemid === weapon.itemid);
      if (rangedAttack) {
        const numberOfShots: string = rangedAttack.shots.split('(')[0];
        if (!isNaN(Number(numberOfShots)) && Number(numberOfShots) === 1) {
          if (rangedAttack.shots.includes('(')) {
            remainingRounds = Number(rangedAttack.shots.split('(')[1].split(')')[0]) + 1;
          } else {
            remainingRounds = Number(rangedAttack.shots);
          }
        }
      }
    }

    await this.token.document.setFlag(MODULE_NAME, 'readyActionsWeaponNeeded', {
      items: [
        ...(readyActionsWeaponNeeded.items.filter((item) => item.itemId !== weapon.itemid) || []),
        {
          itemId: weapon.itemid,
          remainingRounds,
        },
      ],
    });
    console.log('Actualizo', weapon);
    console.log(await this.token.document.getFlag(MODULE_NAME, 'readyActionsWeaponNeeded'));
    await removeItemById(token.id as string, weapon.itemid);
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

  async closeWindow() {
    this.closeForEveryone();
  }

  async unReadyWeaponChooser(index: number): Promise<void> {
    const weapon = this.weaponsNotToBeReadyData[index];
    return this.unReadyWeapon(weapon, this.token.document);
  }

  async fastDrawSkillCheck(weapon: any, remainingRounds: number): Promise<boolean> {
    const readyActionsWeaponNeeded = getReadyActionsWeaponNeeded(this.token.document);

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
              this.closeForEveryone();
              const equippedWeapons = await getEquippedItems(this.token.document);
              const equippedWeapon = equippedWeapons.find((i) => i.itemId === weapon.itemid);
              if (!equippedWeapon) {
                const hand = await this.chooseHand();
                await checkIfRemoveWeaponFromHandNeeded(this, token.document, hand);
                await drawEquipment(weapon.name, token, weapon.itemid, hand, false);
              }

              setTimeout(
                () =>
                  new AttackChooser(this.token, {
                    onlyReadyActions: this.data.onlyReadyActions,
                    beforeCombat: this.data.beforeCombat,
                  }).render(true),
                500,
              );
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  async chooseHand(): Promise<string> {
    return new Promise((resolve, reject) => {
      const d: Dialog = new Dialog({
        title: 'Escoge en qué mano(s) llevas el arma',
        content: '<p>Tienes que escoger una opción</p>',
        buttons: {
          left: {
            icon: '<i class="fas fa-check"></i>',
            label: 'Mano hábil',
            callback: () => resolve('ON'),
          },
          right: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Mano torpe',
            callback: () => resolve('OFF'),
          },
          both: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Ambas manos (como un arco)',
            callback: () => resolve('BOTH'),
          },
        },
        default: 'right',
      });
      d.render(true);
    });
  }

  async readyWeapon(index: number): Promise<void> {
    const weapon = this.weaponsToBeReadyData[index];
    const equippedWeapons: equippedItem[] = await getEquippedItems(this.token.document);
    const equippedWeapon: equippedItem | undefined = equippedWeapons.find((i) => i.itemId === weapon.itemid);
    let handWeapon = 'NONE';
    if (!equippedWeapon) {
      const hand: string = await this.chooseHand();
      await checkIfRemoveWeaponFromHandNeeded(this, this.token.document, hand);
      await drawEquipment(weapon.name, this.token, weapon.itemid, hand, false);
      handWeapon = hand;
    } else {
      handWeapon = equippedWeapon.hand;
    }

    const readyActionsWeaponNeeded = getReadyActionsWeaponNeeded(this.token.document);
    let remainingRounds =
      (readyActionsWeaponNeeded.items.find((item) => item.itemId === weapon.itemid) || {}).remainingRounds || 1;

    if (!this.data.beforeCombat) {
      await this.token.setManeuver('ready');
      if (await this.fastDrawSkillCheck(weapon, remainingRounds)) {
        return;
      }
    } else {
      remainingRounds = 1;
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
    if (!this.data.beforeCombat && remainingRounds === 0) {
      addAmmunition(weapon.name, this.token, weapon.itemid, handWeapon);
    }
  }

  async makeAttack(
    mode: 'ranged' | 'melee' | 'counter_attack' | 'disarm_attack',
    index: number,
    element: any | undefined,
  ): Promise<void> {
    const isUsingFatigueForMoveAndAttack = $('#fatigueMoveAndAttack').is(':checked');
    if (isUsingFatigueForMoveAndAttack) {
      useFatigue(this.actor);
    }
    const isUsingFatigueForMightyBlows = $('#fatigueMightyBlows').is(':checked');
    if (isUsingFatigueForMightyBlows) {
      useFatigue(this.actor);
    }

    const isRapidStrikeAttacks = $('#rapidStrikeAttacks').is(':checked');
    const isUsingDeceptiveAttack = String($('#deceptiveAttack').val()) || '';
    const iMode = mode === 'counter_attack' || mode === 'disarm_attack' ? 'melee' : mode;
    const isCounterAttack = mode === 'counter_attack';
    const isDisarmAttack = mode === 'disarm_attack';

    ensureDefined(game.user, 'game not initialized');
    if (!checkSingleTarget(game.user)) return;
    const target = getTargets(game.user)[0];
    ensureDefined(target.actor, 'target has no actor');

    let meleeDataFinal = this.meleeData;

    if (isDisarmAttack) {
      meleeDataFinal = this.disarmAttackData;
    }

    if (isCounterAttack) {
      meleeDataFinal = this.counterAttackData;
    }

    const { attack, modifiers } = await calculateModifiersFromAttack(
      mode,
      index,
      element,
      target,
      this.actor,
      this.token,
      this.rangedData,
      meleeDataFinal,
      {
        isUsingFatigueForMoveAndAttack,
        isUsingFatigueForMightyBlows,
        isUsingDeceptiveAttack,
        isRapidStrikeAttacks,
        isCounterAttack,
        isDisarmAttack,
      },
      true,
    );

    const twoWeaponsAttack = mode == 'melee' && attack.notes.toUpperCase().includes('DOUBLE ATTACK');
    const weapon: Item | undefined = getWeaponFromAttack(this.actor, attack);

    const stillWithAmmo = calculateAmmunitionForRangedAttacks(attack, mode, weapon, this.actor, this.token);
    if (!stillWithAmmo) return;

    if (
      !this.data.keepOpen &&
      (!this.data.twoAttacks || (this.data.twoAttacks && this.data.attackCount === 2)) &&
      (!twoWeaponsAttack || (twoWeaponsAttack && this.twoWeaponAttacksCount === 2))
    ) {
      this.close();
    } else {
      if (twoWeaponsAttack && this.twoWeaponAttacksCount === 1) {
        this.twoWeaponAttacksCount = 2;
      } else if (this.data.twoAttacks && this.data.attackCount === 1) {
        this.twoWeaponAttacksCount = 1;
        this.data.attackCount = 2;
      }
    }

    debugger;

    await makeAttackInner(
      this.actor,
      this.token,
      target,
      attack,
      weapon,
      iMode,
      modifiers,
      mode === 'counter_attack',
      mode === 'disarm_attack',
      isUsingDeceptiveAttack,
    );

    if (isRapidStrikeAttacks) {
      const actor = this.actor;
      const token = this.token;
      setTimeout(async () => {
        await makeAttackInner(
          actor,
          token,
          target,
          attack,
          weapon,
          iMode,
          modifiers,
          mode === 'counter_attack',
          mode === 'disarm_attack',
          isUsingDeceptiveAttack,
        );
        if (this.promiseFuncs) {
          this.promiseFuncs.resolve();
        }
      }, 100);
    } else {
      if (this.promiseFuncs) {
        this.promiseFuncs.resolve();
      }
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
