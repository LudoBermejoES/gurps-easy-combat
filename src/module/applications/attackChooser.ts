import { makeAttackInner } from '../attackWorkflow.js';
import { FAST_DRAW_SKILLS, MODULE_NAME, TEMPLATES_FOLDER } from './libs/constants';
import { ChooserData, Item, MeleeAttack, Modifier, PromiseFunctions, RangedAttack } from '../types.js';
import BaseActorController from './abstract/BaseActorController.js';
import {
  activateChooser,
  awaitClick,
  checkSingleTarget,
  ensureDefined,
  findSkillSpell,
  getTargets,
} from './libs/miscellaneous';
import ManeuverChooser from './maneuverChooser';
import { checkIfRemoveWeaponFromHandNeeded, getWeaponsInHands } from './libs/readyWeapons';
import {
  addAmmunition,
  drawEquipment,
  getEquippedItems,
  removeItemById,
  equippedItem,
  getWeapon,
} from './libs/weaponMacrosCTA';
import { getMeleeModifiers, getRangedModifiers } from './actions/modifiers';
import { getHitLocationsObject, getLocationData, LocationToAttack } from './libs/locationsDataTransformation';
import { useFatigue } from './libs/fatigue';
import LocationChooser from './locationChooser';
import {
  meleeAttackWithRemainingRounds,
  rangedAttackWithRemainingRounds,
} from './abstract/mixins/EasyCombatCommonAttackDefenseExtractor';
import EasyCombatActor, { easyCombatActorfromActor, easyCombatActorfromToken } from './abstract/EasyCombatActor';
import { hasPowerBlow } from './libs/skillsDataExtractor';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.drawEquipment = drawEquipment;

export interface AttackData {
  meleeOnly?: boolean;
  rangedOnly?: boolean;
  keepOpen?: boolean;
  twoAttacks?: boolean;
  attackCount?: number;
  twoAttacksWithWeapons?: boolean;
  attackWeaponsCount?: number;
  onlyReadyActions?: boolean;
  beforeCombat?: boolean;
  maneuver?: string;
  locationToAttack?: LocationToAttack | undefined;
  isUsingFatigueForMoveAndAttack?: boolean;
  isUsingFatigueForMightyBlows?: boolean;
  isUsingFatigueForPowerBlows?: boolean;
  isUsingDeceptiveAttack?: string;
  isRapidStrikeAttacks?: boolean;
  isUsingTwoWeapons?: boolean;
  canUsePowerBlow?: boolean;
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

  locationToAttack: LocationToAttack | undefined;

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

  canUseTwoWeapons: boolean;

  promiseFuncs: PromiseFunctions<void> | undefined;

  constructor(token: Token, data: AttackData = {}, promiseFuncs?: PromiseFunctions<void>, maneuver?: string) {
    super('AttackChooser', token, easyCombatActorfromToken(token), {
      title: `Attack Chooser - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/attackChooser.hbs`,
    });
    this.meleeData = [];
    this.rangedData = [];
    this.canUseTwoWeapons = false;
    this.data = data;
    if (this.data.twoAttacks && !this.data.attackCount) this.data.attackCount = 1;
    if (this.data.twoAttacksWithWeapons && !this.data.attackWeaponsCount) this.data.attackWeaponsCount = 1;
    this.attacks = this.actor.getAttacks();
    this.weaponsToBeReadyData = [];
    this.weaponsNotToBeReadyData = [];
    this.promiseFuncs = promiseFuncs;
  }

  async getData(): Promise<{
    canUseTwoWeapons: boolean;
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
    this.meleeData = this.actor.getValidMeleeAttacks();
    this.rangedData = this.actor.getValidRangedAttacks();

    const hitLocationsObject = getHitLocationsObject(game);
    this.weaponsToBeReadyData = this.actor.getWeaponsToBeReady();
    this.weaponsNotToBeReadyData = this.actor.getWeaponsNotToBeReady();
    const isRapidStrikeAttacks = $('#rapidStrikeAttacks').is(':checked');
    const isUsingTwoWeapons = $('#twoWeaponsAttack').is(':checked');
    const { meleeAttacksWithModifier, rangedAttacksWithModifier } = await this.actor.getAttacksWithModifiers(
      this.token,
      {
        isRapidStrikeAttacks,
        isUsingTwoWeapons,
      },
    );
    this.data.twoAttacksWithWeapons = isUsingTwoWeapons;
    if (!this.data.attackWeaponsCount) this.data.attackWeaponsCount = 1;

    const weaponsInHands: {
      onHand: equippedItem | undefined;
      offHand: equippedItem | undefined;
    } = await getWeaponsInHands(this.token.document);

    this.canUseTwoWeapons = weaponsInHands.onHand !== undefined && weaponsInHands.offHand !== undefined;

    this.data.canUsePowerBlow = false; // hasPowerBlow(this.actor) !== undefined;
    this.counterAttackData = await this.actor.getCounterAttackData(this.token);
    this.disarmAttackData = await this.actor.getDisarmAttackData(this.token);

    this.locationToAttack = <LocationToAttack | undefined>this.token.document.getFlag(MODULE_NAME, 'location');
    this.data.locationToAttack = getLocationData(game, this.locationToAttack?.where || 'torso');

    return {
      canUseTwoWeapons: this.canUseTwoWeapons,
      onlyReadyActions: this.data.onlyReadyActions || false,
      beforeCombat: this.data.beforeCombat || false,
      disarmAttack: {
        items: this.disarmAttackData,
        headers: ['weapon', 'mode', 'level', 'levelWithModifiers', 'reach'],
        id: 'disarm_attacks',
      },
      counterAttack: {
        items: this.counterAttackData,
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
        items: this.weaponsToBeReadyData,
        headers: ['weapon', 'remainingRounds'],
        id: 'weapons_to_be_ready',
      },
      weaponsNotToBeReady: {
        items: this.weaponsNotToBeReadyData,
        headers: ['weapon', 'remainingRounds'],
        id: 'weapons_not_to_be_ready',
      },
      maneuver: this?.actor?.data?.data?.conditions?.maneuver,
      data: this.data,
    };
  }

  async calculateAttack(
    mode: 'ranged' | 'melee' | 'counter_attack' | 'disarm_attack',
    index: number,
    element: any | undefined,
  ): Promise<
    | {
        attack: MeleeAttack | RangedAttack;
        modifiers: any;
        target: Token;
        isUsingFatigueForPowerBlows: boolean;
        isRapidStrikeAttacks: boolean;
        isUsingTwoWeapons: boolean;
        isUsingDeceptiveAttack: string;
        iMode: 'ranged' | 'melee';
      }
    | undefined
  > {
    const isUsingFatigueForMoveAndAttack = $('#fatigueMoveAndAttack').is(':checked');
    if (isUsingFatigueForMoveAndAttack && element) {
      useFatigue(this.actor);
    }
    const isUsingFatigueForMightyBlows = $('#fatigueMightyBlows').is(':checked');
    if (isUsingFatigueForMightyBlows && element) {
      useFatigue(this.actor);
    }

    const isUsingFatigueForPowerBlows = $('#fatiguePowerBlows').is(':checked');
    if (isUsingFatigueForPowerBlows && element) {
      useFatigue(this.actor);
    }

    const isRapidStrikeAttacks = $('#rapidStrikeAttacks').is(':checked');
    const isUsingTwoWeapons = $('#twoWeaponsAttack').is(':checked');
    const isUsingDeceptiveAttack = String($('#deceptiveAttack').val()) || '';
    const iMode = mode === 'counter_attack' || mode === 'disarm_attack' ? 'melee' : mode;
    const isCounterAttack = mode === 'counter_attack';
    const isDisarmAttack = mode === 'disarm_attack';

    ensureDefined(game.user, 'game not initialized');

    if (!checkSingleTarget(game.user)) {
      await awaitClick();
    }

    const target = getTargets(game.user)[0];
    ensureDefined(target.actor, 'target has no actor');
    let meleeDataFinal = this.meleeData;

    if (isDisarmAttack) {
      meleeDataFinal = this.disarmAttackData;
    }

    if (isCounterAttack) {
      meleeDataFinal = this.counterAttackData;
    }

    const { attack, modifiers } = await this.actor.calculateModifiersFromAttack(
      mode,
      index,
      element,
      target,
      this.token,
      this.rangedData,
      meleeDataFinal,
      {
        isUsingFatigueForMoveAndAttack,
        isUsingFatigueForMightyBlows,
        isUsingDeceptiveAttack,
        isRapidStrikeAttacks,
        isUsingTwoWeapons,
        isCounterAttack,
        isDisarmAttack,
      },
      element ? true : false,
    );
    return {
      attack,
      modifiers,
      target,
      isUsingFatigueForPowerBlows,
      isRapidStrikeAttacks,
      isUsingTwoWeapons,
      isUsingDeceptiveAttack,
      iMode,
    };
  }

  async showModifiers(
    mode: 'ranged' | 'melee' | 'counter_attack' | 'disarm_attack',
    index: number,
    element: any | undefined,
  ): Promise<void> {
    setTimeout(async () => {
      const attackCalculated = await this.calculateAttack(mode, index, undefined);
      if (!attackCalculated) return;
      const { modifiers } = attackCalculated;

      if (modifiers.attack.length) {
        const content = element.closest('.window-content');
        $('#extra_details').remove();

        let html = '<div><div class="card-title">Ataque</div></div><ul class="modifier-list">';

        modifiers.attack.forEach((m: Modifier) => {
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

  activateListeners(html: JQuery): void {
    html.on('change', '.onlyOne', (evt) => {
      const lastValue = $(evt.target).prop('checked');
      $('.onlyOne').prop('checked', false);
      $(evt.target).prop('checked', lastValue);
    });

    html.on(
      'change',
      '#fatigueMoveAndAttack, #twoWeaponsAttack, #rapidStrikeAttacks, #fatigueMightyBlows, #fatiguePowerBlows, #deceptiveAttack',
      (evt) => {
        setTimeout(() => {
          const isUsingFatigueForMoveAndAttack = $('#fatigueMoveAndAttack').is(':checked');
          const isUsingFatigueForMightyBlows = $('#fatigueMightyBlows').is(':checked');
          const isUsingFatigueForPowerBlows = $('#fatiguePowerBlows').is(':checked');
          const isUsingDeceptiveAttack = String($('#deceptiveAttack').val()) || '';
          const isRapidStrikeAttacks = $('#rapidStrikeAttacks').is(':checked');
          const isUsingTwoWeapons = $('#twoWeaponsAttack').is(':checked');
          this.data.isUsingFatigueForMoveAndAttack = isUsingFatigueForMoveAndAttack;
          this.data.isUsingDeceptiveAttack = isUsingDeceptiveAttack;
          this.data.isUsingFatigueForMightyBlows = isUsingFatigueForMightyBlows;
          this.data.isUsingFatigueForPowerBlows = isUsingFatigueForPowerBlows;
          this.data.isRapidStrikeAttacks = isRapidStrikeAttacks;
          this.data.isUsingTwoWeapons = isUsingTwoWeapons;
          this.render(false);
        }, 50);
      },
    );

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

    activateChooser(
      html,
      'disarm_attacks',
      (index: number) => this.makeAttack('disarm_attack', index, undefined),
      (index: number, element: JQuery<any>) => this.showModifiers('disarm_attack', index, element),
    );
    activateChooser(
      html,
      'counter_attacks',
      (index: number) => this.makeAttack('counter_attack', index, undefined),
      (index: number, element: JQuery<any>) => this.showModifiers('counter_attack', index, element),
    );
    activateChooser(
      html,
      'melee_attacks',
      (index: number) => this.makeAttack('melee', index, undefined),
      (index: number, element: JQuery<any>) => this.showModifiers('melee', index, element),
    );
    activateChooser(
      html,
      'ranged_attacks',
      (index: number, element: JQuery<any>) => this.makeAttack('ranged', index, element),
      (index: number, element: JQuery<any>) => this.showModifiers('ranged', index, element),
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

  async unReadyWeapon(weapon: any): Promise<void> {
    ensureDefined(this.actor.tokenSelected, 'Actor sin token');
    const readyActionsWeaponNeeded = this.actor.getReadyActionsWeaponNeeded();
    let remainingRounds = 1;
    if (this.actor) {
      const { ranged } = this.actor.getAttacks();
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
    await removeItemById(this.actor.tokenSelected.id as string, weapon.itemid);
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
    return this.unReadyWeapon(weapon);
  }

  async fastDrawSkillCheck(weapon: any, remainingRounds: number): Promise<boolean> {
    const readyActionsWeaponNeeded = this.actor.getReadyActionsWeaponNeeded();

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

    const readyActionsWeaponNeeded = this.actor.getReadyActionsWeaponNeeded();
    let remainingRounds =
      (readyActionsWeaponNeeded.items.find((item) => item.itemId === weapon.itemid) || {}).remainingRounds || 1;

    if (!this.data.beforeCombat) {
      const weaponDetails = getWeapon(weapon.name);
      if (weaponDetails?.customManeuver) {
        await this.token.setManeuver(weaponDetails.customManeuver);
      } else {
        await this.token.setManeuver('ready');
      }
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
    if (!this.data.beforeCombat && remainingRounds <= 1) {
      addAmmunition(weapon.name, this.token, weapon.itemid, handWeapon);
    }
  }

  async makeAttack(
    mode: 'ranged' | 'melee' | 'counter_attack' | 'disarm_attack',
    index: number,
    element: any | undefined,
  ): Promise<void> {
    const attackCalculated = await this.calculateAttack(mode, index, element || 'something');
    if (!attackCalculated) return;
    const {
      attack,
      modifiers,
      target,
      isRapidStrikeAttacks,
      isUsingTwoWeapons,
      isUsingFatigueForPowerBlows,
      isUsingDeceptiveAttack,
      iMode,
    } = attackCalculated;

    const twoWeaponsAttack = mode == 'melee' && attack.notes.toUpperCase().includes('DOUBLE ATTACK');
    const weapon: Item | undefined = this.actor.getWeaponFromAttack(attack);
    const stillWithAmmo = await this.actor.calculateAmmunitionForRangedAttacks(attack, mode, weapon, this.token);
    if (!stillWithAmmo) return;
    if (mode === 'melee') {
      const attacker = { x: this.token.x, y: this.token.y };
      const defender = { x: target.x, y: target.y };
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const distance: number = game.canvas.grid.measureDistance(attacker, defender, { gridSpaces: true }) || 0;
      const reach: string[] = (attack as MeleeAttack).reach.replace('C', '0').split(',');
      const validReach = reach.find((r) => parseInt(r) === distance);
      if (!validReach) {
        ui.notifications?.error(
          `El ataque seleccionado no está a la distancia correcta. Solo puede atacar a ${reach.join(
            ',',
          )} casillas de distancia`,
        );
        return;
      }
    }

    if (
      !this.data.keepOpen &&
      (!this.data.twoAttacks || ((this.data.twoAttacks && this.data.attackCount) || 0) >= 2) &&
      (!this.data.twoAttacksWithWeapons || (this.data.twoAttacksWithWeapons && this.data.attackWeaponsCount === 2)) &&
      (!twoWeaponsAttack || (twoWeaponsAttack && this.twoWeaponAttacksCount === 2))
    ) {
      this.close();
    } else {
      if (twoWeaponsAttack && this.twoWeaponAttacksCount === 1) {
        this.twoWeaponAttacksCount = 2;
      } else if (this.data.twoAttacks && this.data.attackCount === 1) {
        this.data.attackCount = 2;
      } else if (this.data.twoAttacks && this.data.attackCount === 2) {
        this.data.attackWeaponsCount = 1;
        this.twoWeaponAttacksCount = 1;
        this.data.attackCount = 3;
      } else if (this.data.twoAttacksWithWeapons && this.data.attackWeaponsCount === 1) {
        this.twoWeaponAttacksCount = 1;
        this.data.attackWeaponsCount = 2;
      }
    }

    const specialAttacks = {
      isCounterAttack: mode === 'counter_attack',
      isDisarmingAttack: mode === 'disarm_attack',
      isDeceptiveAttack: isUsingDeceptiveAttack,
      isUsingFatigueForPowerBlows: isUsingFatigueForPowerBlows,
    };
    if (weapon) {
      const weaponDetails = getWeapon(weapon.name);
      if (weaponDetails?.costFatigue) {
        useFatigue(this.actor, weaponDetails?.costFatigue);
      }
    }

    await makeAttackInner(
      this.actor,
      this.token,
      target,
      attack,
      weapon,
      iMode,
      modifiers,
      specialAttacks,
      this.locationToAttack,
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
          specialAttacks,
          this.locationToAttack,
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
    const targetActor = easyCombatActorfromActor(target.actor);
    const hitLocationsValues = targetActor.getHitLocations();
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
