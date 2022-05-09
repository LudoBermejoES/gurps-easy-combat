import WeaponChooser from './applications/weaponChooser';
import DefenseChooser from './applications/defenseChooser';
import { Attack, GurpsRoll, MeleeAttack, Modifier, RangedAttack } from './types';
import { applyModifiers } from './util/actions';
import { MODULE_NAME } from './util/constants';
import {
  ensureDefined,
  getBulk,
  getCounterAttackLevel,
  getDisarmAttackLevel,
  getFullName,
  getManeuver,
  getTargets,
  setTargets,
} from './util/miscellaneous';

function randomIntFromInterval(min: number, max: number): number {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function doAnimation(actor: Actor, name: string) {
  let anim = '';

  if (name.toLowerCase().includes('throwing knife')) {
    anim = '/anim Dagger01_01_Regular_White* *0.3';
  } else if (name.toLowerCase().includes('knife')) {
    anim = '/anim Dagger02_01_Regular_White* *0.3';
  } else if (name.toLowerCase().includes('spear')) {
    anim = '/anim Spear00_01* *0.3';
  } else if (name.toLowerCase().includes('great axe')) {
    anim = '/anim GreatAxe01_01_Regular_White* *0.3';
  } else if (name.toLowerCase().includes('axe')) {
    anim = '/anim HandAxe02_01_Regular_White* *0.3';
  } else if (name.toLowerCase().includes('greatsword')) {
    anim = '/anim GreatSword01_01_Regular_White* *0.3';
  } else if (name.toLowerCase().includes('shortsword')) {
    anim = '/anim Sword01_01_Regular_White* *0.3';
  } else if (name.toLowerCase().includes('maul')) {
    anim = '/anim Maul01_01_Regular_White* *0.3';
  } else if (name.toLowerCase().includes('rapier')) {
    anim = '/anim Rapier01_01_Regular_White* *0.3';
  } else if (name.toLowerCase().includes('mace')) {
    anim = '/anim Mace01_01* *0.3';
  } else if (name.toLowerCase().includes('bow')) {
    anim = '/anim Arrow01_01* *0.3';
  } else if (name.toLowerCase().includes('crossbow')) {
    anim = '/anim Bolt01_01_Regular* *0.3';
  }
  if (anim) GURPS.executeOTF(anim, false, null, actor);
}

function doSound(actor: Actor, name: string, tryAttack: boolean, success: boolean) {
  let sound = '';

  const totalMeleeHitSound = 13;
  const totalArrowTrySound = 3;
  const totalMeleeMissSound = 1;
  const totalArrowHitSound = 5;

  if (tryAttack) {
    if (name.toLowerCase().includes('bow')) {
      sound = `modules/soundfxlibrary/Combat/Single/Arrow Fly-By/arrow-fly-by-${randomIntFromInterval(
        1,
        totalArrowTrySound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('crossbow')) {
      sound = `modules/soundfxlibrary/Combat/Single/Arrow Fly-By/arrow-fly-by-${randomIntFromInterval(
        1,
        totalArrowTrySound,
      )}.mp3`;
    }
  } else if (success) {
    if (name.toLowerCase().includes('throwing knife')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('knife')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('spear')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('great axe')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('axe')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('greatsword')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('shortsword')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('maul')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('rapier')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('mace')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('bow')) {
      sound = `modules/soundfxlibrary/Combat/Single/Arrow Impact/arrow-impact-${randomIntFromInterval(
        1,
        totalArrowHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('crossbow')) {
      sound = `modules/soundfxlibrary/Combat/Single/Arrow Impact/arrow-impact-${randomIntFromInterval(
        1,
        totalArrowHitSound,
      )}.mp3`;
    }
  } else if (!success) {
    if (name.toLowerCase().includes('throwing knife')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('knife')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('spear')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('great axe')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('axe')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('greatsword')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('shortsword')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('maul')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('rapier')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('mace')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('bow')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('crossbow')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/arrow-fly-by-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    }
  }

  console.log(sound);
  if (sound) GURPS.executeOTF(`/sound ${sound}`, false, null, actor);
}

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
  target: Token,
  attack: MeleeAttack | RangedAttack,
  type: 'melee' | 'ranged',
  modifiers: {
    attack: Modifier[];
    defense: Modifier[];
    damage: Modifier[];
  },
  isCounterAttack: boolean,
  isDisarmingAttack: boolean,
): Promise<void> {
  if (!target.actor) {
    ui.notifications?.error('target has no actor');
    return;
  }
  if (isCounterAttack) {
    const newValue = getCounterAttackLevel(attacker, attack.name, attack.level);
    modifiers.attack.push({ mod: newValue - attack.level, desc: 'Por contraataque' });
  }

  applyModifiers(modifiers.attack);

  doAnimation(target.actor, attack.name);
  doSound(target.actor, attack.name, true, false);
  const roll = await rollAttack(attacker, attack, type);
  if (roll.failure) {
    doSound(target.actor, attack.name, false, false);
    return;
  }
  if (!roll.isCritSuccess) {
    if (isCounterAttack) {
      modifiers.defense.push({ mod: -2, desc: 'Por contraataque' });

      const successDefenses = <{ attackers: string[]; round: number } | undefined>(
        attacker?.token?.getFlag(MODULE_NAME, 'successDefenses')
      );

      const attackerId = target?.id;
      if (attackerId) {
        const roundSuccess = (successDefenses?.round || 0) === game.combat?.round ?? 0;
        const attackers = (roundSuccess && successDefenses?.attackers) || [];
        const attackerFiltered = attackers.filter((attackerS) => attackerId !== attackerS);
        attacker?.token?.setFlag(MODULE_NAME, 'successDefenses', {
          attackers: attackerFiltered,
          round: game.combat?.round ?? 0,
        });
      }
    }
    const defenseSucess = await DefenseChooser.requestDefense(target, modifiers.defense, attacker);
    if (defenseSucess) {
      doSound(target.actor, attack.name, false, false);
      const successDefenses = <{ attackers: string[]; round: number } | undefined>(
        target.document.getFlag(MODULE_NAME, 'successDefenses')
      );

      const attackerId = attacker?.token?.id;
      if (attackerId) {
        const roundSuccess = (successDefenses?.round || 0) === game.combat?.round ?? 0;
        const attackers = (roundSuccess && successDefenses?.attackers) || [];
        target.document.setFlag(MODULE_NAME, 'successDefenses', {
          attackers: [...attackers, attackerId],
          round: game.combat?.round ?? 0,
        });
      }
      return;
    }
  } else {
    ensureDefined(game.tables, 'game not initialized');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    game.tables?.getName('Critical Hit')?.draw();
  }

  if (roll.isCritFailure) {
    ensureDefined(game.tables, 'game not initialized');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    game.tables?.getName('Critical Miss')?.draw();
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
    return;
  }
  doSound(target.actor, attack.name, false, true);

  const damageParts = attack.damage.split(' ');
  const damage = { formula: damageParts[0], type: damageParts[1], extra: damageParts[2] };
  rollDamage(attacker, damage, target, modifiers.damage);
}

export function getMeleeModifiers(
  attack: MeleeAttack,
  token: Token,
  target: Token,
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
  ensureDefined(token.actor, 'token without actor');
  switch (getManeuver(token.actor)) {
    case 'move_and_attack':
      modifiers.attack.push({ mod: -4, desc: 'Move and Attack *Max:9' });
      break;
    case 'aoa_determined':
      modifiers.attack.push({ mod: 4, desc: 'determined' });
      break;
    case 'aoa_strong':
      modifiers.damage.push({ mod: 2, desc: 'strong' });
  }
  const lastFeint = <{ successMargin: number; targetId: string; round: number } | undefined>(
    token.document.getFlag(MODULE_NAME, 'lastFeint')
  );

  if (
    lastFeint &&
    lastFeint.targetId === target.id &&
    lastFeint.round - (game.combat?.round ?? 0) <= 1 &&
    lastFeint.successMargin > 0
  ) {
    token.document.unsetFlag(MODULE_NAME, 'lastFeint');
    modifiers.attack.push({ mod: lastFeint.successMargin, desc: 'finta' });
  }

  const location = <{ bonus: number; where: string } | undefined>token.document.getFlag(MODULE_NAME, 'location');
  if (location && location.bonus) {
    token.document.unsetFlag(MODULE_NAME, 'location');
    modifiers.attack.push({ mod: location.bonus, desc: location.where });
  }

  const lastEvaluate = <{ bonus: number; targetId: string; round: number } | undefined>(
    token.document.getFlag(MODULE_NAME, 'lastEvaluate')
  );

  if (
    lastEvaluate &&
    lastEvaluate.targetId === target.id &&
    lastEvaluate.round - (game.combat?.round ?? 0) <= 1 &&
    lastEvaluate.bonus > 0
  ) {
    token.document.unsetFlag(MODULE_NAME, 'lastEvaluate');
    modifiers.attack.push({ mod: lastEvaluate.bonus, desc: 'Evaluar' });
  }

  const retreating = <{ bonus: number; round: number } | undefined>(
    token.document.getFlag(MODULE_NAME, 'roundRetreatMalus')
  );

  const dif = (game.combat?.round ?? 0) - (retreating?.round ?? 0);
  if (retreating && dif > 0 && dif <= 1) {
    modifiers.attack.push({ mod: retreating.bonus, desc: `por retroceder` });
  } else {
    token.document.unsetFlag(MODULE_NAME, 'roundRetreatMalus');
  }

  return modifiers;
}

export function getRangedModifiers(
  attack: RangedAttack,
  token: Token,
  target: Token,
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

  const location = <{ bonus: number; where: string } | undefined>token.document.getFlag(MODULE_NAME, 'location');
  if (location && location.bonus) {
    token.document.unsetFlag(MODULE_NAME, 'location');
    modifiers.attack.push({ mod: location.bonus, desc: location.where });
  }

  ensureDefined(token.actor, 'token without actor');
  switch (getManeuver(token.actor)) {
    case 'move_and_attack':
      modifiers.attack.push({ mod: getBulk(attack), desc: 'Move and Attack' });
      break;
    case 'aoa_determined':
      modifiers.attack.push({ mod: 1, desc: 'determined' });
      break;
  }
  if (getManeuver(token.actor) !== 'move_and_attack') {
    const lastAim = <{ bonus: number } | undefined>token.document.getFlag(MODULE_NAME, 'lastAim');
    if (lastAim) {
      token.document.unsetFlag(MODULE_NAME, 'lastAim');
      modifiers.attack.push({ mod: lastAim.bonus, desc: 'apuntar' });
    }
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const distance = game.canvas.grid.measureDistance(token.center, target.center, { gridSpaces: true }) || 0;
  const modifierByDistance = GURPS.rangeObject.ranges;
  const modifier = modifierByDistance.find((d: any) => d.max >= distance);
  modifiers.attack.push({ mod: modifier.penalty, desc: 'By distance' });

  return modifiers;
}
