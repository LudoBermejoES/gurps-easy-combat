import WeaponChooser from '../weaponChooser';
import { Attack } from '../../types';

export default async function rollDisarmingAttack(
  isDisarmingAttack: boolean,
  target: Token,
  attack: Attack,
  attacker: Actor,
): Promise<boolean> {
  if (!target.actor) {
    ui.notifications?.error('target has no actor');
    return false;
  }
  if (isDisarmingAttack) {
    const { ST: attackerST, DX: attackerDX } = attacker.data.data.attributes;
    const attackerAttribute = attackerDX >= attackerST ? 'DX' : 'ST';
    const { ST: defenderST, DX: defenderDX } = target.actor.data.data.attributes;
    const defenderAttribute = defenderDX >= defenderST ? 'DX' : 'ST';

    const rollAttacker = `SK:${attack.otf} (Based:${attackerAttribute}`;
    const otfDefender = await WeaponChooser.request(target);
    const rollDefender = `SK:${otfDefender} (Based:${defenderAttribute}`;
    const resultAttacker = await GURPS.executeOTF(rollAttacker, false, null, attacker);
    const resultAttackerRoll = GURPS.lastTargetedRoll;
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
