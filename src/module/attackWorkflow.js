import { applyModifiers } from './applications/libs/actions';
import { ensureDefined, getFullName, getTargets, setTargets } from './applications/libs/miscellaneous';
import {
  doAnimationAttack,
  doAnimationCriticalSuccess,
  doAnimationDamage,
  doAnimationMiss,
} from './applications/libs/animations';
import { playSound } from './applications/libs/sounds';
import { addCounterAttackModifiersForAttack } from './applications/actions/counterAttack';
import rollDefense from './applications/actions/defense';
import rollDisarmingAttack from './applications/actions/disarmingAttack';
export async function rollAttack(actor, attack, type) {
  await GURPS.performAction(
    {
      isMelee: type === 'melee',
      isRanged: type === 'ranged',
      name: getFullName(attack),
      type: 'attack',
    },
    actor,
  );
  return GURPS.lastTargetedRoll;
}
export async function rollSkill(actor, attack, type) {
  await GURPS.performAction(
    {
      isMelee: type === 'melee',
      isRanged: type === 'ranged',
      name: getFullName(attack),
      type: 'attack',
    },
    actor,
  );
  return GURPS.lastTargetedRoll;
}
async function rollDamage(actor, damage, target, modifiers = [], locationToAttack) {
  ensureDefined(game.user, 'game not initialized');
  applyModifiers(modifiers);
  const oldTargets = getTargets(game.user);
  setTargets(game.user, [target]);
  Hooks.once('renderChatMessage', () => {
    ensureDefined(game.user, 'game not initialized');
    setTargets(game.user, oldTargets);
  });
  let isDerivedDamage = false;
  let derivedformula = '';
  if (damage.formula.toUpperCase().indexOf('SW') > -1) {
    isDerivedDamage = true;
    derivedformula = 'sw';
    damage.formula = damage.formula.split('sw').join('');
  }
  if (damage.formula.toUpperCase().indexOf('TH') > -1) {
    isDerivedDamage = true;
    derivedformula = 'th';
    damage.formula = damage.formula.split('thr').join('');
  }
  if (target.actor) {
    doAnimationDamage(target.actor);
  }
  return GURPS.performAction(
    {
      type: isDerivedDamage ? 'deriveddamage' : 'damage',
      derivedformula,
      formula: damage.formula,
      damagetype: damage.type,
      extdamagetype: damage.extra,
      hitlocation: locationToAttack?.where,
    },
    actor,
  );
}
export async function makeAttackInner(
  attacker,
  token,
  target,
  attack,
  weapon,
  type,
  modifiers,
  specialAttacks,
  locationToAttack,
  alreadyExistingRoll,
) {
  if (!target.actor) {
    ui.notifications?.error('target has no actor');
    return;
  }
  addCounterAttackModifiersForAttack(specialAttacks.isCounterAttack, attacker, attack, modifiers);
  applyModifiers(modifiers.attack);
  const roll = await rollAttack(attacker, attack, type);
  if (roll.failure) {
    doAnimationMiss(target.actor, roll.isCritFailure);
    return;
  }
  await doAnimationAttack(attacker, weapon, roll.rofrcl, token, target);
  await playSound(target.actor, weapon, roll.rofrcl);
  if (!roll.isCritSuccess) {
    const resultDefense = await rollDefense(roll, attacker, token, attack, modifiers, target, specialAttacks);
    if (!resultDefense) return;
    if (roll.rofrcl) {
      //      roll.rofrcl = roll.rofrcl - (GURPS.lastTargetedRoll.margin + 1);
    }
  } else {
    await doAnimationCriticalSuccess(target.actor);
    ensureDefined(game.tables, 'game not initialized');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    game.tables?.getName('Critical Hit')?.draw();
  }
  if (roll.isCritFailure) {
    ensureDefined(game.tables, 'game not initialized');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await game.tables?.getName('Critical Miss')?.draw();
  }
  const resultDisarmingAttack = await rollDisarmingAttack(specialAttacks.isDisarmingAttack, target, attack, attacker);
  if (resultDisarmingAttack) return;
  await playSound(target.actor, weapon, 0);
  const damageParts = attack.damage.split(' ');
  const damage = {
    formula: damageParts[0],
    type: damageParts[1],
    extra: damageParts[2],
  };
  if (specialAttacks.isUsingFatigueForPowerBlows) {
    const action = {
      orig: 'Sk:"Power Blow"',
      type: 'skill-spell',
      isSpellOnly: false,
      isSkillOnly: true,
      name: 'Power Blow',
      spantext: '<b>Sk:</b>Power Blow',
    };
    const result = await GURPS.performAction(action, attacker);
    if (result) {
      const dice = Number(damage.formula.split('d')[0]);
      damage.formula = damage.formula.replace(`${dice}d`, `${dice * 2}d`);
    }
  }
  if (roll.rofrcl) {
    for (let i = 1; i <= roll.rofrcl; i++) {
      rollDamage(attacker, damage, target, modifiers.damage, locationToAttack);
    }
  } else rollDamage(attacker, damage, target, modifiers.damage, locationToAttack);
}
//# sourceMappingURL=attackWorkflow.js.map
