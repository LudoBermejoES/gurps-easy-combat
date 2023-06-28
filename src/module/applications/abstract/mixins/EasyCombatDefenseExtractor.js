import { MODULE_NAME } from '../../libs/constants';
import { ensureDefined, getManeuver } from '../../libs/miscellaneous';
import { getEquippedItems } from '../../libs/weaponMacrosCTA';
import { DEFENSE_DODGEBLOCK, DEFENSE_NONE } from '../../defenseChooser';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Maneuvers from '/systems/gurps/module/actor/maneuver.js';
import { checkOffHand } from '../../libs/offHand';
import EasyCombatCommonAttackDefenseExtractor from './EasyCombatCommonAttackDefenseExtractor';
import EasyCombatAttacksExtractor from './EasyCombatAttacksExtractor';
import { applyMixins } from '../../libs/mixins';
class EasyCombatDefenseExtractor {
  getDefenseModifiersBySelection(mode) {
    const modifiers = [];
    const isRetreating = $('#retreatDefense').is(':checked');
    const isProne = $('#proneDefense').is(':checked');
    const isFeverishDefense = $('#feverishDefense').is(':checked');
    if (isRetreating) {
      if (mode === 'DODGE') {
        modifiers.push({ mod: +3, desc: 'Retrocediendo (tendrás un -2 al ataque en el próximo turno)' });
      } else if (mode === 'PARRY') {
        modifiers.push({ mod: +1, desc: 'Retrocediendo (tendrás un -2 al ataque en el próximo turno)' });
      } else if (mode === 'BLOCK') {
        modifiers.push({ mod: +1, desc: 'Retrocediendo (tendrás un -2 al ataque en el próximo turno)' });
      }
    }
    if (isFeverishDefense) {
      modifiers.push({ mod: +2, desc: 'Defensa desesperada' });
    }
    if (isProne) {
      modifiers.push({ mod: +3, desc: 'En el suelo (cambias tu posición a tumbado)' });
    }
    return {
      modifiers,
      isRetreating,
      isFeverishDefense,
      isProne,
    };
  }
  async getDefenseModifiersByMode(mode, canUseModShield) {
    const modifiers = [];
    const { bonusDodge, bonusParry, bonusBlock } = await this.calculateDefenseModifiersFromEquippedWeapons(
      canUseModShield,
    );
    if (mode === 'DODGE' && bonusDodge) {
      modifiers.push({ mod: bonusDodge, desc: 'Bonus por escudo, capa u otro objeto' });
    }
    if (mode === 'PARRY' && bonusParry) {
      modifiers.push({ mod: bonusDodge, desc: 'Bonus por escudo, capa u otro objeto' });
    }
    if (mode === 'BLOCK' && bonusBlock) {
      modifiers.push({ mod: bonusDodge, desc: 'Bonus por escudo, capa u otro objeto' });
    }
    return {
      modifiers,
    };
  }
  getDefenseModifiersByManeuver(attackerId, mode) {
    const modifiers = [];
    const lastFeint = this.tokenDocumentSelected?.getFlag(MODULE_NAME, 'lastFeint');
    if (lastFeint && lastFeint.attackerId === attackerId) {
      if (lastFeint.round - (game.combat?.round ?? 0) <= 1 && lastFeint.successMargin > 0) {
        this.tokenDocumentSelected?.unsetFlag(MODULE_NAME, 'lastFeint');
        modifiers.push({ mod: -lastFeint.successMargin, desc: 'Por finta' });
      }
    }
    switch (getManeuver(this)) {
      case 'aod_dodge':
        if (mode === 'DODGE') {
          modifiers.push({ mod: 2, desc: 'a Esquiva por Defensa total`' });
        }
        break;
      case 'aod_parry':
        if (mode === 'PARRY') {
          modifiers.push({ mod: 2, desc: 'a Parada por Defensa total' });
        }
        break;
      case 'aod_block':
        if (mode === 'BLOCK') {
          modifiers.push({ mod: 2, desc: 'a Bloqueo por Defensa total' });
        }
        break;
    }
    return modifiers;
  }
  async calculateDefenseModifiersFromEquippedWeapons(canUseModShield) {
    ensureDefined(this.tokenDocumentSelected, 'Actor sin token');
    const equippedWeapons = await getEquippedItems(this.tokenDocumentSelected);
    let bonusDodge = 0;
    let bonusParry = 0;
    let bonusBlock = 0;
    equippedWeapons.forEach((weapon) => {
      const item = this.data.items.contents.find((item) => item.data._id === weapon.itemId);
      if (!item) return;
      const found = canUseModShield && ['SHIELD', 'CLOAK'].find((m) => item.data.name.toUpperCase().includes(m));
      if (found) {
        const bonuses = item.data.data.bonuses.split('\n');
        for (const bonus of bonuses) {
          if (bonus.toUpperCase().includes('DODGE')) {
            const parts = bonus.toUpperCase().split('DODGE ');
            if (parts.length === 2 && !isNaN(parts[1])) {
              bonusDodge += Number(parts[1]);
            }
          } else if (bonus.toUpperCase().includes('PARRY')) {
            const parts = bonus.toUpperCase().split('PARRY ');
            if (parts.length === 2 && !isNaN(parts[1])) {
              bonusParry += Number(parts[1]);
            }
          } else if (bonus.toUpperCase().includes('BLOCK')) {
            const parts = bonus.toUpperCase().split('BLOCK ');
            if (parts.length === 2 && !isNaN(parts[1])) {
              bonusBlock += Number(parts[1]);
            }
          }
        }
      }
    });
    return {
      bonusDodge,
      bonusParry,
      bonusBlock,
    };
  }
  getAllModifiers(data) {
    const modifiersByShock = this.getModifierByShock();
    const modifiersByPosture = this.getModifierByPosture('DEFENSE');
    const { modifiers: modifiersBySelectionParry } = this.getDefenseModifiersBySelection('PARRY');
    const { modifiers: modifiersBySelectionBlock } = this.getDefenseModifiersBySelection('BLOCK');
    const { modifiers: modifiersBySelectionDodge } = this.getDefenseModifiersBySelection('DODGE');
    const modifiersByManeuverParry = this.getDefenseModifiersByManeuver(data.attackerId, 'PARRY');
    const modifiersByManeuverDodge = this.getDefenseModifiersByManeuver(data.attackerId, 'DODGE');
    const modifiersByManeuverBlock = this.getDefenseModifiersByManeuver(data.attackerId, 'BLOCK');
    return {
      modifiersByShock,
      modifiersByPosture,
      modifiersBySelectionParry,
      modifiersBySelectionBlock,
      modifiersBySelectionDodge,
      modifiersByManeuverBlock,
      modifiersByManeuverParry,
      modifiersByManeuverDodge,
    };
  }
  getSumAllModifiers(data) {
    const {
      modifiersByShock,
      modifiersByPosture,
      modifiersBySelectionParry,
      modifiersBySelectionBlock,
      modifiersBySelectionDodge,
      modifiersByManeuverBlock,
      modifiersByManeuverParry,
      modifiersByManeuverDodge,
    } = this.getAllModifiers(data);
    let sumAllModifiersParry = 0;
    [
      ...data.modifiers,
      ...modifiersBySelectionParry,
      ...modifiersByManeuverParry,
      ...modifiersByShock,
      ...modifiersByPosture,
    ].forEach((m) => (sumAllModifiersParry += m.mod));
    let sumAllModifiersDodge = 0;
    [
      ...data.modifiers,
      ...modifiersBySelectionDodge,
      ...modifiersByManeuverDodge,
      ...modifiersByShock,
      ...modifiersByPosture,
    ].forEach((m) => (sumAllModifiersDodge += m.mod));
    let sumAllModifiersBlock = 0;
    [
      ...data.modifiers,
      ...modifiersBySelectionBlock,
      ...modifiersByManeuverBlock,
      ...modifiersByShock,
      ...modifiersByPosture,
    ].forEach((m) => (sumAllModifiersBlock += m.mod));
    return {
      sumAllModifiersParry,
      sumAllModifiersBlock,
      sumAllModifiersDodge,
    };
  }
  getLastParries() {
    return this.tokenDocumentSelected?.getFlag(MODULE_NAME, 'lastParries') || [];
  }
  getLastParryByItemId(token, itemId) {
    const parries = this.getLastParries();
    return parries.find((p) => p.itemId === itemId);
  }
  getDodge() {
    return this.getData().currentdodge;
  }
  async getValidDodge(data, canUseModShield) {
    const { sumAllModifiersBlock } = this.getSumAllModifiers(data);
    const { bonusDodge } = await this.calculateDefenseModifiersFromEquippedWeapons(canUseModShield);
    return this.getDodge() + sumAllModifiersBlock + bonusDodge;
  }
  async getValidParries(token, data, canUseModShield) {
    const { sumAllModifiersParry } = this.getSumAllModifiers(data);
    const { bonusParry } = await this.calculateDefenseModifiersFromEquippedWeapons(canUseModShield);
    const parries = [];
    const meleeData = this.getMeleeAttacksWithNotReamingRounds();
    for (const attack of Object.values(meleeData)) {
      const modifiers = [];
      const { itemid, weapon, parry: originalParry, originalName } = attack;
      let isFencingWeapon = false;
      let parry = originalParry;
      if (String(originalParry).includes('F')) {
        isFencingWeapon = true;
        parry = originalParry.split('F')[0];
      }
      if (!isNaN(Number(parry)) && !parries.find((p) => p.itemid === itemid)) {
        const offHandModifiers = await checkOffHand(token.document, attack, this.getWeaponsFromAttacks());
        if (offHandModifiers) {
          modifiers.push(offHandModifiers);
        }
        let lastParry = this.getLastParryByItemId(token, itemid);
        if (lastParry?.round === game.combat?.round ?? 0) {
          const times = lastParry?.times || 0;
          modifiers.push({
            mod: (isFencingWeapon ? -2 : -4) * times,
            desc:
              times <= 1
                ? `Malus por haber parado previamente ${times} vez`
                : `Malus por haber parado previamente ${times} veces`,
          });
        } else {
          lastParry = undefined;
        }
        let totalModifiersByParry = 0;
        modifiers.forEach((m) => (totalModifiersByParry = totalModifiersByParry + m.mod));
        const parryToStore = {
          times: (lastParry?.times || 0) + 1,
          round: game?.combat?.round || 0,
          itemId: itemid,
        };
        parries.push({
          itemid,
          weapon,
          originalName,
          modifiers,
          parryToStore,
          value: Number(parry) + sumAllModifiersParry + bonusParry + totalModifiersByParry,
        });
      }
    }
    return parries;
  }
  async saveLastBlock(lastBlock) {
    return this.tokenDocumentSelected?.setFlag(MODULE_NAME, 'lastBlocks', lastBlock);
  }
  async saveLastParry(lastParry) {
    const parries = this.getLastParries();
    const parriesFiltered = parries.filter((p) => p.itemId !== lastParry.itemId);
    parriesFiltered.push(lastParry);
    return this.tokenDocumentSelected?.setFlag(MODULE_NAME, 'lastParries', parriesFiltered);
  }
  getLastBlock() {
    return this.tokenDocumentSelected?.getFlag(MODULE_NAME, 'lastBlocks') || undefined;
  }
  async getValidBlocks(token, data, canUseModShield) {
    const { sumAllModifiersBlock } = this.getSumAllModifiers(data);
    const { bonusBlock } = await this.calculateDefenseModifiersFromEquippedWeapons(canUseModShield);
    const blocks = [];
    const actor = token?.actor;
    ensureDefined(actor, 'Ese token necesita un actor');
    const lastBlock = this.getLastBlock();
    if (lastBlock?.round === (game?.combat?.round || 0)) return [];
    const meleeData = this.getMeleeAttacksWithNotReamingRounds();
    for (const attack of Object.values(meleeData)) {
      const modifiers = [];
      const { itemid, weapon, block: originalBlock, originalName } = attack;
      const block = originalBlock;
      if (!isNaN(Number(block)) && !blocks.find((p) => p.itemid === itemid)) {
        let totalModifiersByBlock = 0;
        modifiers.forEach((m) => (totalModifiersByBlock = totalModifiersByBlock + m.mod));
        blocks.push({
          itemid,
          weapon,
          originalName,
          modifiers,
          value: Number(block) + sumAllModifiersBlock + bonusBlock + totalModifiersByBlock,
        });
      }
    }
    return blocks;
  }
  async getCanBlockDodgeParry(canUseModShield) {
    const lastAodDouble = this.tokenDocumentSelected?.getFlag(MODULE_NAME, 'lastAodDouble');
    let forbiddenMode = '';
    if (lastAodDouble && lastAodDouble.round === (game?.combat?.round || 0)) {
      forbiddenMode = lastAodDouble?.mode || '';
      await this.tokenDocumentSelected?.setFlag(MODULE_NAME, 'lastAodDouble', {
        mode: '',
        round: game?.combat?.round || 0,
        times: 2,
      });
    }
    const maneuver = Maneuvers.getAll()[getManeuver(this)]._data;
    return {
      canBlock: forbiddenMode !== 'BLOCK' && canUseModShield && maneuver?.defense !== DEFENSE_NONE,
      canDodge: forbiddenMode !== 'DODGE' && maneuver?.defense !== DEFENSE_NONE,
      canParry: forbiddenMode !== 'PARRY' && ![DEFENSE_DODGEBLOCK, DEFENSE_NONE].includes(maneuver?.defense),
    };
  }
}
applyMixins(EasyCombatAttacksExtractor, [Actor, EasyCombatCommonAttackDefenseExtractor]);
export default EasyCombatDefenseExtractor;
//# sourceMappingURL=EasyCombatDefenseExtractor.js.map
