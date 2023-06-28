import { MODULE_NAME, POSTURE_MODIFIERS } from '../../libs/constants';
import EasyCombatBaseExtractor from './EasyCombatBaseExtractor';
import EasyCombatInventoryExtractor from './EasyCombatInventoryExtractor';
import { getActorData } from '../../libs/data';
import { applyMixins } from '../../libs/mixins';
class EasyCombatCommonAttackDefenseExtractor {
  getMeleeAttacksWithNotReamingRounds() {
    return this.getMeleeAttacksWithReadyWeapons().filter((item) => {
      return !item.remainingRounds;
    });
  }
  getModifierByShock() {
    const shockPenalties = this.tokenDocumentSelected?.getFlag(MODULE_NAME, 'shockPenalties');
    const roundToAffect = game?.combat?.round || 0;
    const alreadyExist = (shockPenalties || []).filter((s) => s.round === roundToAffect);
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
  getNameFromAttack(attack, attackData) {
    const nameToLook = attackData.weapon.split(' --')[0];
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
  getModifierByPosture(mode) {
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
  getReadyActionsWeaponNeeded() {
    if (this.tokenDocumentSelected)
      return this.tokenDocumentSelected.getFlag(MODULE_NAME, 'readyActionsWeaponNeeded') || { items: [] };
    return { items: [] };
  }
  getMeleeAttacksWithReadyWeapons() {
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
      .filter((item) => {
        const weapon = this.getWeaponsFromAttacks().find((w) => w.itemid === item.itemid);
        return weapon?.count !== 0;
      });
  }
}
applyMixins(EasyCombatCommonAttackDefenseExtractor, [Actor, EasyCombatBaseExtractor, EasyCombatInventoryExtractor]);
export default EasyCombatCommonAttackDefenseExtractor;
//# sourceMappingURL=EasyCombatCommonAttackDefenseExtractor.js.map
