import { Attack, GurpsRoll, Item, MeleeAttack, Modifier, RangedAttack } from './types';
import { applyModifiers } from './util/actions';
import { ensureDefined, getFullName, getTargets, setTargets } from './util/miscellaneous';
import { doAnimationAttack, doAnimationCriticalSuccess, doAnimationDamage, doAnimationMiss } from './util/animations';
import { playSound } from './util/sounds';
import { addCounterAttackModifiersForAttack } from './applications/actions/counterAttack';
import rollDefense from './applications/actions/defense';
import rollDisarmingAttack from './applications/actions/disarmingAttack';

export async function rollAttack(actor: Actor, attack: Attack, type: 'melee' | 'ranged'): Promise<GurpsRoll> {
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

export async function rollSkill(actor: Actor, attack: Attack, type: 'melee' | 'ranged'): Promise<GurpsRoll> {
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

async function rollDamage(
  actor: Actor,
  damage: { formula: string; type: string; extra: string },
  target: Token,
  modifiers: Modifier[] = [],
) {
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
    },
    actor,
  );
}

export async function makeAttackInner(
  attacker: Actor,
  token: Token,
  target: Token,
  attack: MeleeAttack | RangedAttack,
  weapon: Item | undefined,
  type: 'melee' | 'ranged',
  modifiers: {
    attack: Modifier[];
    defense: Modifier[];
    damage: Modifier[];
  },
  isCounterAttack: boolean,
  isDisarmingAttack: boolean,
  isDeceptiveAttack: string,
): Promise<void> {
  if (!target.actor) {
    ui.notifications?.error('target has no actor');
    return;
  }
  addCounterAttackModifiersForAttack(isCounterAttack, attacker, attack, modifiers);
  applyModifiers(modifiers.attack);

  const roll: GurpsRoll = await rollAttack(attacker, attack, type);
  if (roll.failure) {
    doAnimationMiss(target.actor, roll.isCritFailure);
    return;
  }
  await doAnimationAttack(target.actor, weapon, roll.rofrcl);
  await playSound(target.actor, weapon, roll.rofrcl);
  if (!roll.isCritSuccess) {
    const resultDefense = await rollDefense(roll, attacker, token, attack, modifiers, target, {
      isCounterAttack,
      isDeceptiveAttack,
      isDisarmingAttack,
    });
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

  const resultDisarmingAttack: boolean = await rollDisarmingAttack(isDisarmingAttack, target, attack, attacker);
  if (resultDisarmingAttack) return;

  await playSound(target.actor, weapon, 0);
  const damageParts = attack.damage.split(' ');
  const damage = { formula: damageParts[0], type: damageParts[1], extra: damageParts[2] };
  if (roll.rofrcl) {
    for (let i = 1; i <= roll.rofrcl; i++) {
      rollDamage(attacker, damage, target, modifiers.damage);
    }
  } else rollDamage(attacker, damage, target, modifiers.damage);
}
