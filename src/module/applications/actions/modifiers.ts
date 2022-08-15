import { MeleeAttack, Modifier, RangedAttack } from '../../types';
import { ensureDefined, getBulk, getManeuver } from '../../util/miscellaneous';
import { MODULE_NAME } from '../../util/constants';

export function getMeleeModifiers(
  attack: MeleeAttack,
  token: Token,
  target: Token,
  { isUsingFatigueForMoveAndAttack = false, isUsingFatigueForMightyBlows = false },
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
    modifiers.defense.push({ mod: -lastFeint.successMargin, desc: 'Por finta' });
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
  if (retreating && dif === 0) {
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
  { isUsingFatigueForMoveAndAttack = false, isUsingFatigueForMightyBlows = false },
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
    token.document.getFlag(MODULE_NAME, 'Por localización')
  );
  if (location && location.bonus) {
    token.document.unsetFlag(MODULE_NAME, 'location');
    modifiers.attack.push({ mod: location.bonus, desc: location.where });
  }

  ensureDefined(token.actor, 'token without actor');
  switch (getManeuver(token.actor)) {
    case 'move_and_attack':
      if (!isUsingFatigueForMoveAndAttack)
        modifiers.attack.push({ mod: -getBulk(attack), desc: 'Por moverse y atacar' });
      break;
    case 'aoa_determined':
      modifiers.attack.push({ mod: 1, desc: 'determined' });
      break;
  }
  if (getManeuver(token.actor) !== 'move_and_attack') {
    const lastAim = <{ bonus: number } | undefined>token.document.getFlag(MODULE_NAME, 'Por apuntar');
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
  modifiers.attack.push({ mod: modifier.penalty, desc: `Por distancia ${distance} casillas` });

  return modifiers;
}
