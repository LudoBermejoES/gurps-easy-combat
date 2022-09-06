import { HitLocation, Item, MeleeAttack, Modifier, RangedAttack, ReadyManeouverNeeded } from '../../../types';
import { MODULE_NAME, POSTURE_MODIFIERS } from '../../libs/constants';
import EasyCombatBaseExtractor from './EasyCombatBaseExtractor';
import EasyCombatInventoryExtractor from './EasyCombatInventoryExtractor';
import { ShockPenalty } from '../../libs/damage';
import { getActorData } from '../../libs/data';
import { applyMixins } from '../../libs/mixins';

export interface meleeAttackWithRemainingRounds {
  weapon: string;
  originalName: string;
  mode: string;
  level: number;
  parry: string;
  block: string;
  damage: string;
  reach: string;
  notes: string;
  itemid: string;
  levelWithModifiers: number;
  remainingRounds: number;
  modifiers: Modifier[];
}

export interface rangedAttackWithRemainingRounds {
  weapon: string;
  originalName: string;
  mode: string;
  level: number;
  damage: string;
  range: string;
  accuracy: string;
  bulk: string;
  notes: string;
  itemid: string;
  rof: string;
  rcl: string;
  levelWithModifiers: number;
  remainingRounds: number;
  modifiers: Modifier[];
}

class EasyCombatCommonAttackDefenseExtractor {
  getMeleeAttacksWithNotReamingRounds(): meleeAttackWithRemainingRounds[] {
    return this.getMeleeAttacksWithReadyWeapons().filter((item: meleeAttackWithRemainingRounds) => {
      return !item.remainingRounds;
    });
  }
  getModifierByShock(): Modifier[] {
    const shockPenalties = <ShockPenalty[] | undefined>(
      this.tokenDocumentSelected?.getFlag(MODULE_NAME, 'shockPenalties')
    );
    const roundToAffect: number = game?.combat?.round || 0;
    const alreadyExist: ShockPenalty[] = (shockPenalties || []).filter((s) => s.round === roundToAffect);
    if (alreadyExist.length) {
      return [
        {
          mod: alreadyExist[0].modifier,
          desc: 'Por shock',
        },
      ];
    }
    return [];
  }

  getNameFromAttack(attack: any, attackData: any): boolean {
    const nameToLook: string = attackData.weapon.split(' --')[0];
    if (attack.alternateName) {
      if (attack.alternateName === nameToLook && attack.mode === attackData.mode) {
        return true;
      }
    }

    if (attack.name === nameToLook && attack.mode === attackData.mode) {
      return true;
    }

    return false;
  }

  getModifierByPosture(mode: 'ATTACK' | 'DEFENSE'): Modifier[] {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const posture = this.getData().conditions.posture;
    if (posture) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const postureModifiers = POSTURE_MODIFIERS[posture.toUpperCase()];
      if (postureModifiers) {
        const defenseOrAttack = postureModifiers[mode];
        if (defenseOrAttack) {
          return [
            {
              mod: defenseOrAttack,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              desc: `Por postura: ${getActorData(actor).conditions.posture}`,
            },
          ];
        }
      }
    }
    return [];
  }
  getReadyActionsWeaponNeeded(): { items: ReadyManeouverNeeded[] } {
    if (this.tokenDocumentSelected)
      return <{ items: ReadyManeouverNeeded[] }>(
        this.tokenDocumentSelected.getFlag(MODULE_NAME, 'readyActionsWeaponNeeded')
      );
    return { items: [] };
  }

  getMeleeAttacksWithReadyWeapons(): meleeAttackWithRemainingRounds[] {
    const { melee } = this.getAttacks();
    return melee
      .map(({ name, alternateName, mode, level, parry, block, damage, reach, notes, itemid }) => {
        const readyNeeded = this.getReadyActionsWeaponNeeded()?.items.find((item) => item.itemId === itemid) || {
          itemId: '',
          remainingRounds: 0,
        };
        return {
          weapon: alternateName || name,
          originalName: name,
          mode,
          level,
          parry,
          block,
          levelWithModifiers: level,
          damage,
          reach,
          notes,
          itemid,
          remainingRounds: readyNeeded?.remainingRounds || 0,
          modifiers: [],
        };
      })
      .filter((item: meleeAttackWithRemainingRounds) => {
        const weapon = this.getWeaponsFromAttacks().find((w) => w.itemid === item.itemid);
        return weapon?.count !== 0;
      });
  }
}

interface EasyCombatCommonAttackDefenseExtractor extends Actor, EasyCombatBaseExtractor, EasyCombatInventoryExtractor {}
applyMixins(EasyCombatCommonAttackDefenseExtractor, [Actor, EasyCombatBaseExtractor, EasyCombatInventoryExtractor]);

export default EasyCombatCommonAttackDefenseExtractor;
