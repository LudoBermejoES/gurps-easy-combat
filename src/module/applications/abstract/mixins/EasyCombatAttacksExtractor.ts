import { Item, MeleeAttack, Modifier, RangedAttack, ReadyManeouverNeeded } from '../../../types';
import { FENCING_WEAPONS, MODULE_NAME } from '../../libs/constants';
import AttackChooser, { AttackData } from '../../attackChooser';
import { checkSingleTarget, ensureDefined, findSkillSpell, getTargets } from '../../libs/miscellaneous';

import EasyCombatCommonAttackDefenseExtractor, {
  meleeAttackWithRemainingRounds,
  rangedAttackWithRemainingRounds,
} from './EasyCombatCommonAttackDefenseExtractor';

import EasyCombatAttacksModifiers from './EasyCombatAttacksModifiers';

import { getEquippedItems } from '../../libs/weaponMacrosCTA';
import { applyMixins } from '../../libs/mixins';

export interface weaponToBeReady {
  itemid: string;
  weapon: string;
  name: string;
  remainingRounds: number;
}

export interface weaponNotToBeReady {
  itemid: string;
  weapon: string;
  name: string;
  remainingRounds: number;
}

interface EasyCombatAttacksExtractor
  extends Actor,
    EasyCombatCommonAttackDefenseExtractor,
    EasyCombatAttacksModifiers {}

class EasyCombatAttacksExtractor {
  getValidMeleeAttacks(): meleeAttackWithRemainingRounds[] {
    return this.getMeleeAttacksWithNotReamingRounds();
  }

  getRangedAttacksWithNotReamingRounds(): rangedAttackWithRemainingRounds[] {
    return this.getRangedAttacksWithReadyWeapons().filter((item: rangedAttackWithRemainingRounds) => {
      return !item.remainingRounds;
    });
  }

  getRangedAttacksWithReadyWeapons(): rangedAttackWithRemainingRounds[] {
    const { ranged } = this.getAttacks();
    return ranged
      .map(({ name, alternateName, mode, level, damage, range, acc, bulk, notes, itemid, rof, rcl }) => {
        const readyNeeded = this.getReadyActionsWeaponNeeded().items.find((item) => item.itemId === itemid) || {
          itemId: '',
          remainingRounds: 0,
        };
        return {
          weapon: alternateName || name,
          originalName: name,
          mode,
          level,
          levelWithModifiers: level,
          damage,
          range,
          accuracy: acc,
          bulk,
          notes,
          itemid,
          rof,
          rcl,
          remainingRounds: readyNeeded?.remainingRounds || 0,
          modifiers: [],
        };
      })
      .filter((item: rangedAttackWithRemainingRounds) => {
        const rAttack = ranged.find((r) => r.itemid === item.itemid);
        if (rAttack) {
          if (item?.mode?.toUpperCase().includes('INNATE ATTACK')) return true;
          const weapon = this.getAmmunnitionFromInventory(rAttack.itemid, 'data.equipment.carried');
          if (!weapon?.ammo) {
            return false;
          }
          if (weapon.ammo.count === 0) {
            return false;
          }
        }
        return true;
      });
  }

  getRangedDataWithROFMoreThan1(): rangedAttackWithRemainingRounds[] {
    return this.getRangedAttacksWithNotReamingRounds().filter((attack: rangedAttackWithRemainingRounds) => attack.rof); // && attack.rof !== '1');
  }

  getRangedDataWithNoROF(): rangedAttackWithRemainingRounds[] {
    return this.getRangedAttacksWithNotReamingRounds().filter(
      (attack: rangedAttackWithRemainingRounds) => attack.rof === '',
    );
  }

  getExtraRangedAttacksPerROF(): rangedAttackWithRemainingRounds[] {
    const rangedAttackWithROFMoreThan1: rangedAttackWithRemainingRounds[] = this.getRangedDataWithROFMoreThan1();
    const rangedData: rangedAttackWithRemainingRounds[] = [];
    rangedAttackWithROFMoreThan1.forEach((attack) => {
      rangedData.push(attack);
      if (attack.rof) {
        let rof = Number(attack.rof.split('!').join(''));

        const weapon: ReadyManeouverNeeded | undefined = this.getReadyActionsWeaponNeeded()?.items?.find(
          (item: ReadyManeouverNeeded) => item.itemId === attack.itemid,
        );

        if (weapon && weapon.remainingShots && weapon.remainingShots < rof) {
          rof = weapon.remainingShots;
        }

        let maxROF = 1000;
        const rAttack = this.getRangedAttacksWithReadyWeapons().find((r) => r.itemid === attack.itemid);
        if (rAttack) {
          const weapon = this.getAmmunnitionFromInventory(rAttack.itemid, 'data.equipment.carried');
          if (weapon?.ammo) {
            maxROF = weapon.ammo.count;
          }
        }

        rof = Math.min(rof, maxROF);

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
    return rangedData;
  }

  getValidRangedAttacks(): rangedAttackWithRemainingRounds[] {
    return [...this.getRangedDataWithNoROF(), ...this.getExtraRangedAttacksPerROF()];
  }

  getAttacksToBeReady(): (meleeAttackWithRemainingRounds | rangedAttackWithRemainingRounds)[] {
    return [
      ...this.getRangedAttacksWithReadyWeapons().filter(
        (item: rangedAttackWithRemainingRounds) => item.remainingRounds,
      ),
      ...this.getMeleeAttacksWithReadyWeapons().filter((item: meleeAttackWithRemainingRounds) => item.remainingRounds),
    ];
  }

  getWeaponsToBeReady(): weaponToBeReady[] {
    const items: Item[] = this.getEquipment();
    const attacksToBeReadyData: (meleeAttackWithRemainingRounds | rangedAttackWithRemainingRounds)[] =
      this.getAttacksToBeReady();

    const weaponsToBeReadyData: weaponToBeReady[] = [];

    attacksToBeReadyData.map((attack: meleeAttackWithRemainingRounds | rangedAttackWithRemainingRounds) => {
      const itemFound: Item | undefined = items.find((item) => item.itemid === attack.itemid);
      if (itemFound) {
        const weaponAlreadyExists: weaponToBeReady[] = weaponsToBeReadyData.filter(
          (w: weaponToBeReady) => w.itemid === itemFound.itemid,
        );
        if (!weaponAlreadyExists.length) {
          weaponsToBeReadyData.push({
            itemid: itemFound.itemid,
            weapon: itemFound.alternateName || itemFound.name,
            name: itemFound.name,
            remainingRounds: attack.remainingRounds,
          });
        }
      }
    });
    return weaponsToBeReadyData;
  }

  getAttacksNotToBeReady(): (meleeAttackWithRemainingRounds | rangedAttackWithRemainingRounds)[] {
    return [
      ...this.getRangedAttacksWithReadyWeapons().filter(
        (item: rangedAttackWithRemainingRounds) => item.remainingRounds === 0,
      ),
      ...this.getMeleeAttacksWithReadyWeapons().filter(
        (item: meleeAttackWithRemainingRounds) => item.remainingRounds === 0,
      ),
    ];
  }

  getWeaponsNotToBeReady(): weaponNotToBeReady[] {
    const items: Item[] = this.getEquipment();
    const attacksNotToBeReadyData: (meleeAttackWithRemainingRounds | rangedAttackWithRemainingRounds)[] =
      this.getAttacksNotToBeReady();

    const weaponsNotToBeReadyData: weaponNotToBeReady[] = [];

    attacksNotToBeReadyData.map((attack: meleeAttackWithRemainingRounds | rangedAttackWithRemainingRounds) => {
      const itemFound: Item | undefined = items.find((item) => item.itemid === attack.itemid);
      if (itemFound) {
        const weaponAlreadyExists: weaponNotToBeReady[] = weaponsNotToBeReadyData.filter(
          (w: weaponToBeReady) => w.itemid === itemFound.itemid,
        );
        if (!weaponAlreadyExists.length) {
          weaponsNotToBeReadyData.push({
            itemid: itemFound.itemid,
            weapon: itemFound.alternateName || itemFound.name,
            name: itemFound.name,
            remainingRounds: attack.remainingRounds,
          });
        }
      }
    });
    return weaponsNotToBeReadyData;
  }

  async getAttacksWithModifiers(
    token: Token,
    data?: AttackData | undefined,
  ): Promise<{
    meleeAttacksWithModifier: meleeAttackWithRemainingRounds[];
    rangedAttacksWithModifier: rangedAttackWithRemainingRounds[];
  }> {
    const melee: meleeAttackWithRemainingRounds[] = this.getValidMeleeAttacks();
    const ranged: rangedAttackWithRemainingRounds[] = this.getValidRangedAttacks();

    const isUsing: {
      isUsingFatigueForMoveAndAttack: boolean;
      isUsingFatigueForMightyBlows: boolean;
      isUsingDeceptiveAttack: string;
      isRapidStrikeAttacks: boolean;
      isUsingTwoWeapons: boolean;
    } = {
      isUsingFatigueForMoveAndAttack: data?.isUsingFatigueForMoveAndAttack || false,
      isUsingFatigueForMightyBlows: data?.isUsingFatigueForMightyBlows || false,
      isUsingDeceptiveAttack: data?.isUsingDeceptiveAttack || '0',
      isRapidStrikeAttacks: data?.isRapidStrikeAttacks || false,
      isUsingTwoWeapons: data?.isUsingTwoWeapons || false,
    };
    ensureDefined(game.user, 'game not initialized');
    const target = getTargets(game.user)[0];
    if (!target)
      return {
        meleeAttacksWithModifier: melee,
        rangedAttacksWithModifier: ranged,
      };

    const meleeAttacksWithModifierPromises = melee.map(async (m: meleeAttackWithRemainingRounds, i: number) => {
      const { modifiers } = await this.calculateModifiersFromAttack(
        'melee',
        i,
        undefined,
        target,
        token,
        ranged,
        melee,
        isUsing,
      );

      let level = m.level;
      modifiers.attack.forEach((m: Modifier) => {
        level += m.mod;
      });
      return {
        ...m,
        levelWithModifiers: level,
        modifiers,
      } as meleeAttackWithRemainingRounds;
    });
    const rangedAttacksWithModifierPromises = ranged.map(async (r: rangedAttackWithRemainingRounds, i: number) => {
      const { modifiers } = await this.calculateModifiersFromAttack(
        'ranged',
        i,
        undefined,
        target,
        token,
        ranged,
        melee,
        isUsing,
      );

      let level = r.level;
      modifiers.attack.forEach((m: Modifier) => {
        level += m.mod;
      });
      return {
        ...r,
        levelWithModifiers: level,
        modifiers,
      } as rangedAttackWithRemainingRounds;
    });
    const meleeAttacksWithModifier = await Promise.all(meleeAttacksWithModifierPromises);
    const rangedAttacksWithModifier = await Promise.all(rangedAttacksWithModifierPromises);
    return {
      meleeAttacksWithModifier,
      rangedAttacksWithModifier,
    };
  }

  async getCounterAttackData(token: Token, data?: AttackData | undefined): Promise<meleeAttackWithRemainingRounds[]> {
    const { meleeAttacksWithModifier } = await this.getAttacksWithModifiers(token, data);
    ensureDefined(game.user, 'game not initialized');
    if (checkSingleTarget(game.user)) {
      const target = getTargets(game.user)[0];
      ensureDefined(target.actor, 'target has no actor');

      const successDefenses = <{ attackers: string[]; round: number } | undefined>(
        token.document.getFlag(MODULE_NAME, 'successDefenses')
      );

      const targetId = target?.id;
      if (targetId) {
        const roundSuccess = (successDefenses?.round || 0) === game.combat?.round ?? 0;
        const attackers = (roundSuccess && successDefenses?.attackers) || [];
        if (!attackers.includes(targetId)) {
          return [];
        }
      }
    }
    return meleeAttacksWithModifier.map((item: meleeAttackWithRemainingRounds) => {
      const { originalName, levelWithModifiers } = item;
      return {
        ...item,
        levelWithModifiers: this.getCounterAttackLevel(originalName, levelWithModifiers),
      };
    });
  }

  getCounterAttackLevel(name: string, level: number): number {
    const counterAttack = findSkillSpell(this, 'Counterattack ', true, false);
    let levelCounter = level - 5;
    if (counterAttack) {
      const weapon = counterAttack.name.split('Counterattack ').join('');
      levelCounter = name.indexOf(weapon) > -1 ? counterAttack.level : level - 5;
    }
    return levelCounter;
  }

  async getDisarmAttackData(token: Token, data?: AttackData | undefined): Promise<meleeAttackWithRemainingRounds[]> {
    const { meleeAttacksWithModifier } = await this.getAttacksWithModifiers(token, data);

    return meleeAttacksWithModifier
      .filter((item: meleeAttackWithRemainingRounds) => String(item.parry).toLowerCase() !== 'no')
      .map((item: meleeAttackWithRemainingRounds) => {
        const { levelWithModifiers, originalName } = item;
        return {
          ...item,
          levelWithModifiers: this.getDisarmAttackLevel(originalName, levelWithModifiers),
        };
      });
  }

  getDisarmAttackLevel(name: string, level: number): number {
    const counterAttack = findSkillSpell(this, 'Disarming ', true, false);
    const isFencingWeapon = FENCING_WEAPONS.some((v) => name.toUpperCase().includes(v));
    let levelCounter = isFencingWeapon ? level - 2 : level - 4;
    if (counterAttack) {
      const weapon = counterAttack.name.split('Disarming ').join('');
      const levelOfSkill = name.indexOf(weapon) > -1 ? counterAttack.level - 4 : level - 4;
      levelCounter = isFencingWeapon ? levelOfSkill : levelOfSkill - 2;
    }
    return levelCounter;
  }

  async prepareReadyWeapons() {
    const attacks: {
      melee: MeleeAttack[];
      ranged: RangedAttack[];
    } = this.getAttacks();

    const meleeWeaponIds: string[] = attacks.melee.map((melee) => melee.itemid).filter((i) => i !== undefined);
    const rangedWeaponIds: string[] = attacks.ranged.map((melee) => melee.itemid).filter((i) => i !== undefined);
    ensureDefined(this.tokenDocumentSelected, 'Actor sin token');
    const equippedItems: { itemId: string; hand: string }[] = await getEquippedItems(this.tokenDocumentSelected);
    await this.tokenDocumentSelected.setFlag(MODULE_NAME, 'readyActionsWeaponNeeded', {
      items: Array.from(new Set([...meleeWeaponIds, ...rangedWeaponIds]))
        .filter((item) => !equippedItems.find((i) => i.itemId === item))
        .map((item) => {
          let remainingRounds = 1;

          const rangedAttack: RangedAttack | undefined = attacks.ranged.find((i) => i.itemid === item);
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

          return {
            itemId: item,
            remainingRounds,
          };
        }),
    });
  }
}

applyMixins(EasyCombatAttacksExtractor, [Actor, EasyCombatCommonAttackDefenseExtractor, EasyCombatAttacksModifiers]);

export default EasyCombatAttacksExtractor;
