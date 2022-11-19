import { Item, MeleeAttack, Modifier, RangedAttack } from '../../../types';
import { FENCING_WEAPONS, MODULE_NAME } from '../../libs/constants';
import AttackChooser, { AttackData } from '../../attackChooser';
import { findSkillSpell, getBulk, getManeuver, getTargets } from '../../libs/miscellaneous';
import EasyCombatCommonAttackDefenseExtractor, {
  meleeAttackWithRemainingRounds,
  rangedAttackWithRemainingRounds,
} from './EasyCombatCommonAttackDefenseExtractor';
import { checkOffHand } from '../../libs/offHand';
import { LocationToAttack } from '../../libs/locationsDataTransformation';
import { applyMixins } from '../../libs/mixins';

class EasyCombatAttacksModifiers {
  async calculateModifiersFromAttack(
    mode: 'ranged' | 'melee' | 'counter_attack' | 'disarm_attack',
    index: number,
    element: any | undefined,
    target: any,
    token: Token,
    rangedData: rangedAttackWithRemainingRounds[],
    meleeData: meleeAttackWithRemainingRounds[],
    {
      isUsingFatigueForMoveAndAttack = false,
      isUsingFatigueForMightyBlows = false,
      isUsingDeceptiveAttack = '',
      isRapidStrikeAttacks = false,
      isUsingTwoWeapons = false,
      isCounterAttack = false,
      isDisarmAttack = false,
    },
    removeFlags = false,
  ): Promise<{
    attack: MeleeAttack | RangedAttack;
    modifiers: any;
  }> {
    const iMode = mode === 'counter_attack' || mode === 'disarm_attack' ? 'melee' : mode;
    let attack = this.getAttacks()[iMode][index];
    let attackData: meleeAttackWithRemainingRounds | rangedAttackWithRemainingRounds;
    const attackModifiers = [];
    if (mode === 'ranged') {
      attackData = rangedData[index];
      const rangedAttacks = this.getAttacks()[iMode] as RangedAttack[];
      const originalAttack = rangedAttacks.find((attack: any) => this.getNameFromAttack(attack, attackData));
      if (element) {
        if (originalAttack) {
          const attackValue = Number(element.find('.level').text());
          const diff = attackValue - originalAttack.level;
          if (diff >= 0) {
            attackModifiers.push({ mod: diff, desc: 'Por número de balas' });

            if (originalAttack.rof !== undefined) {
              originalAttack.rof = originalAttack.rof.trim();
            }
            attack = { ...originalAttack };
            attack.level = Number(element.find('.level').text());
            attack.rof = element.find('.rof').text().trim();
          }
        }
      } else {
        if (originalAttack) {
          if (originalAttack.rof !== undefined) {
            originalAttack.rof = originalAttack.rof.trim();
          }
          attack = { ...originalAttack };
        }
      }
    } else {
      attackData = meleeData[index];
      const meleeAttacks = this.getAttacks()[iMode] as MeleeAttack[];
      const originalAttack = meleeAttacks.find((attack: MeleeAttack) => this.getNameFromAttack(attack, attackData));
      if (originalAttack) {
        attack = { ...originalAttack };
      }
    }

    const modifiers = AttackChooser.modifiersGetters[iMode](
      attack as RangedAttack & MeleeAttack,
      token,
      target,
      removeFlags,
      {
        isUsingFatigueForMoveAndAttack,
        isUsingFatigueForMightyBlows,
        isUsingDeceptiveAttack,
        isRapidStrikeAttacks,
        isUsingTwoWeapons,
        isCounterAttack,
        isDisarmAttack,
      },
    );
    if (attackModifiers.length) modifiers.attack = [...modifiers.attack, ...attackModifiers];

    const offHandModifier = await checkOffHand(token.document, attackData, this.getWeaponsFromAttacks());
    if (offHandModifier) {
      modifiers.attack = [...modifiers.attack, offHandModifier];
    }
    return {
      attack,
      modifiers,
    };
  }

  getDisarmAttackModifiers(attack: MeleeAttack): Modifier | undefined {
    const { name, level } = attack;
    const levelModifier = 0;
    const skill = findSkillSpell(this, 'Disarming ', true, false);
    const isFencingWeapon = FENCING_WEAPONS.some((v) => name.toUpperCase().includes(v));
    let levelCounter = isFencingWeapon ? levelModifier - 2 : levelModifier - 4;
    if (skill) {
      const weapon = skill.name.split('Disarming ').join('');
      if (name.indexOf(weapon) > -1) {
        levelCounter = level - skill.level;
      }
    }

    if (levelCounter) {
      return {
        mod: levelCounter,
        desc: 'Por desarme',
      };
    }
    return undefined;
  }

  getMeleeModifiers(
    attack: MeleeAttack,
    target: Token,
    removeFlags = false,
    {
      isUsingFatigueForMoveAndAttack = false,
      isUsingFatigueForMightyBlows = false,
      isUsingDeceptiveAttack = '',
      isRapidStrikeAttacks = false,
      isUsingTwoWeapons = false,
      isCounterAttack = false,
      isDisarmAttack = false,
    },
  ): {
    attack: Modifier[];
    defense: Modifier[];
    damage: Modifier[];
  } {
    const modifiers = {
      attack: <Modifier[]>[],
      defense: <Modifier[]>[],
      damage: <Modifier[]>[],
    };
    switch (getManeuver(this)) {
      case 'move_and_attack':
        if (!isUsingFatigueForMoveAndAttack) modifiers.attack.push({ mod: -4, desc: 'Move and Attack *Max:9' });
        break;
      case 'aoa_determined':
        modifiers.attack.push({ mod: 4, desc: 'Ataque determinado' });
        break;
      case 'aoa_strong':
        modifiers.damage.push({ mod: 2, desc: 'Ataque fuerte' });
    }
    if (isUsingFatigueForMightyBlows) {
      modifiers.damage.push({ mod: 2, desc: 'Ataque poderoso' });
    }

    if (isRapidStrikeAttacks) {
      modifiers.attack.push({ mod: -6, desc: 'Por dos ataques en el mismo turno' });
    }

    if (isUsingTwoWeapons) {
      modifiers.attack.push({ mod: -4, desc: 'Por ataque con dos armas en el mismo turno' });
    }

    if (isUsingDeceptiveAttack) {
      if (!isNaN(Number(isUsingDeceptiveAttack)) && Number(isUsingDeceptiveAttack) !== 0) {
        const deceptiveAttack = Number(isUsingDeceptiveAttack);
        modifiers.attack.push({ mod: deceptiveAttack, desc: 'Por ataque engañoso' });
      }
    }

    if (isDisarmAttack) {
      const disarmModifier = this.getDisarmAttackModifiers(attack);
      if (disarmModifier) {
        modifiers.attack.push(disarmModifier);
      }
    }

    const location: LocationToAttack | undefined = <LocationToAttack | undefined>(
      this.tokenDocumentSelected?.getFlag(MODULE_NAME, 'location')
    );
    if (location && location.bonus) {
      modifiers.attack.push({ mod: location.bonus, desc: location.where });
    }

    const lastEvaluate = <{ bonus: number; targetId: string; round: number } | undefined>(
      this.tokenDocumentSelected?.getFlag(MODULE_NAME, 'lastEvaluate')
    );

    if (
      lastEvaluate &&
      lastEvaluate.targetId === target.id &&
      lastEvaluate.round - (game.combat?.round ?? 0) <= 1 &&
      lastEvaluate.bonus > 0
    ) {
      if (removeFlags) this.tokenDocumentSelected?.unsetFlag(MODULE_NAME, 'lastEvaluate');
      modifiers.attack.push({ mod: lastEvaluate.bonus, desc: 'Evaluar' });
    }

    const retreating = <{ bonus: number; round: number } | undefined>(
      this.tokenDocumentSelected?.getFlag(MODULE_NAME, 'roundRetreatMalus')
    );

    const dif = (game.combat?.round ?? 0) - (retreating?.round ?? 0);
    if (retreating && dif === 0) {
      modifiers.attack.push({ mod: retreating.bonus, desc: `por retroceder` });
    } else {
      if (removeFlags) this.tokenDocumentSelected?.unsetFlag(MODULE_NAME, 'roundRetreatMalus');
    }

    const modifierByShock = this.getModifierByShock();
    if (modifierByShock.length) {
      modifiers.attack.push(modifierByShock[0]);
    }

    const modifierByPosture = this.getModifierByPosture('ATTACK');
    if (modifierByPosture.length) {
      modifiers.attack.push(modifierByPosture[0]);
    }

    return modifiers;
  }

  getRangedModifiers(
    attack: RangedAttack,
    target: Token,
    removeFlags = false,
    {
      isUsingFatigueForMoveAndAttack = false,
      isUsingFatigueForMightyBlows = false,
      isRapidStrikeAttacks = false,
      isUsingTwoWeapons = false,
      isCounterAttack = false,
      isDisarmAttack = false,
    },
  ): {
    attack: Modifier[];
    defense: Modifier[];
    damage: Modifier[];
  } {
    const modifiers = {
      attack: <Modifier[]>[],
      defense: <Modifier[]>[],
      damage: <Modifier[]>[],
    };

    const location = <{ bonus: number; where: string } | undefined>(
      this.tokenDocumentSelected?.getFlag(MODULE_NAME, 'Por localización')
    );
    if (location && location.bonus) {
      if (removeFlags) this.tokenDocumentSelected?.unsetFlag(MODULE_NAME, 'location');
      modifiers.attack.push({ mod: location.bonus, desc: location.where });
    }

    switch (getManeuver(this)) {
      case 'move_and_attack':
        modifiers.attack.push({ mod: -getBulk(attack), desc: 'Por moverse y atacar' });
        break;
      case 'aoa_determined':
        modifiers.attack.push({ mod: 1, desc: 'determined' });
        break;
    }
    if (getManeuver(this) !== 'move_and_attack') {
      const lastAim = <{ bonus: number } | undefined>this.tokenDocumentSelected?.getFlag(MODULE_NAME, 'Por apuntar');
      if (lastAim) {
        if (removeFlags) this.tokenDocumentSelected?.unsetFlag(MODULE_NAME, 'lastAim');
        modifiers.attack.push({ mod: lastAim.bonus, desc: 'apuntar' });
      }
    }

    const distance =
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      game.canvas.grid.measureDistance(this.tokenSelected?.center, target.center, { gridSpaces: true }) || 0;
    const modifierByDistance = GURPS.rangeObject.ranges;
    const modifier = modifierByDistance.find((d: any) => d.max >= distance);
    modifiers.attack.push({ mod: modifier.penalty, desc: `Por distancia ${distance} casillas` });

    return modifiers;
  }
}

interface EasyCombatAttacksModifiers extends Actor, EasyCombatCommonAttackDefenseExtractor {}
applyMixins(EasyCombatAttacksModifiers, [Actor, EasyCombatCommonAttackDefenseExtractor]);

export default EasyCombatAttacksModifiers;
