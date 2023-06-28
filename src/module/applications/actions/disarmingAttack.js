import WeaponChooser from '../weaponChooser';
import { applyModifiers } from '../libs/actions';
import { DISARM_WEAPONS } from '../libs/constants';
import { getActorData } from '../libs/data';
import { easyCombatActorfromActor } from '../abstract/EasyCombatActor';
function isDisarmingWeapon(attack, actor) {
  const weapons = easyCombatActorfromActor(actor).getEquipment();
  const weaponSelect = weapons.find((w) => w.itemid === attack.itemid);
  if (weaponSelect) {
    return DISARM_WEAPONS.some((v) => weaponSelect.name.toUpperCase().includes(v));
  }
  return false;
}
export default async function rollDisarmingAttack(isDisarmingAttack, target, attack, attacker) {
  if (!target.actor) {
    ui.notifications?.error('target has no actor');
    return false;
  }
  if (isDisarmingAttack) {
    const { ST: attackerST, DX: attackerDX } = getActorData(attacker).attributes;
    const attackerAttribute = attackerDX >= attackerST ? 'DX' : 'ST';
    const { ST: defenderST, DX: defenderDX } = getActorData(target.actor).attributes;
    const defenderAttribute = defenderDX >= defenderST ? 'DX' : 'ST';
    const rollAttacker = `SK:${attack.otf} (Based:${attackerAttribute})`;
    const { otf: otfDefender, hand } = await WeaponChooser.request(target);
    const rollDefender = `SK:${otfDefender} (Based:${defenderAttribute})`;
    if (isDisarmingWeapon(attack, attacker)) {
      applyModifiers([{ mod: +2, desc: 'Por arma especial para desarmar' }]);
    }
    const resultAttacker = await GURPS.executeOTF(rollAttacker, false, null, attacker);
    const resultAttackerRoll = GURPS.lastTargetedRoll;
    if (hand.toUpperCase() === 'BOTH') {
      applyModifiers([{ mod: +2, desc: 'Por arma a dos manos' }]);
    }
    const resultDefender = await GURPS.executeOTF(rollDefender, false, null, target.actor);
    const resultDefenderRoll = GURPS.lastTargetedRoll;
    console.log(resultAttacker, resultAttackerRoll);
    console.log(resultDefender, resultDefenderRoll);
    if (resultAttackerRoll.margin > resultDefenderRoll.margin) {
      ChatMessage.create({
        content: `
  <div id="GURPS-LEGAL" style='font-size:85%'>${target.actor.name} pierde el arma
  </div>`,
        hasPlayerOwner: false,
        type: CONST.CHAT_MESSAGE_TYPES.OOC,
      });
    } else {
      ChatMessage.create({
        content: `
  <div id="GURPS-LEGAL" style='font-size:85%'>${target.actor.name} consigue NO perder el arma
  </div>`,
        hasPlayerOwner: false,
        type: CONST.CHAT_MESSAGE_TYPES.OOC,
      });
    }
    return true;
  }
  return false;
}
//# sourceMappingURL=disarmingAttack.js.map
