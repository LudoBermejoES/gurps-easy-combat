import { MeleeAttack, Modifier, RangedAttack } from '../../types';
import { ensureDefined, findSkillSpell, getBulk, getManeuver } from '../../util/miscellaneous';
import { FENCING_WEAPONS, MODULE_NAME } from '../../util/constants';
import { LocationToAttack } from '../../util/locationsDataTransformation';
import { getModifierByPosture, getModifierByShock } from '../../util/modifiers';

function getDisarmAttackModifiers(actor: Actor, attack: MeleeAttack): Modifier | undefined {
  const { name, level } = attack;
  const levelModifier = 0;
  const skill = findSkillSpell(actor, 'Disarming ', true, false);
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

export function getMeleeModifiers(
  attack: MeleeAttack,
  token: Token,
  target: Token,
  removeFlags = false,
  {
    isUsingFatigueForMoveAndAttack = false,
    isUsingFatigueForMightyBlows = false,
    isUsingDeceptiveAttack = '',
    isRapidStrikeAttacks = false,
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

  if (isRapidStrikeAttacks) {
    modifiers.attack.push({ mod: -6, desc: 'Por dos ataques en el mismo turno' });
  }

  if (isUsingDeceptiveAttack) {
    if (!isNaN(Number(isUsingDeceptiveAttack)) && Number(isUsingDeceptiveAttack) !== 0) {
      const deceptiveAttack = Number(isUsingDeceptiveAttack);
      modifiers.attack.push({ mod: deceptiveAttack, desc: 'Por ataque engañoso' });
    }
  }

  if (isDisarmAttack) {
    const disarmModifier = getDisarmAttackModifiers(token.actor, attack);
    if (disarmModifier) {
      modifiers.attack.push(disarmModifier);
    }
  }

  const location: LocationToAttack | undefined = <LocationToAttack | undefined>(
    token.document.getFlag(MODULE_NAME, 'location')
  );
  if (location && location.bonus) {
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
    if (removeFlags) token.document.unsetFlag(MODULE_NAME, 'lastEvaluate');
    modifiers.attack.push({ mod: lastEvaluate.bonus, desc: 'Evaluar' });
  }

  const retreating = <{ bonus: number; round: number } | undefined>(
    token.document.getFlag(MODULE_NAME, 'roundRetreatMalus')
  );

  const dif = (game.combat?.round ?? 0) - (retreating?.round ?? 0);
  if (retreating && dif === 0) {
    modifiers.attack.push({ mod: retreating.bonus, desc: `por retroceder` });
  } else {
    if (removeFlags) token.document.unsetFlag(MODULE_NAME, 'roundRetreatMalus');
  }

  const modifierByShock = getModifierByShock(token.document);
  if (modifierByShock.length) {
    modifiers.attack.push(modifierByShock[0]);
  }

  const modifierByPosture = getModifierByPosture(token.actor, 'ATTACK');
  if (modifierByPosture.length) {
    modifiers.attack.push(modifierByPosture[0]);
  }

  return modifiers;
}

export function getRangedModifiers(
  attack: RangedAttack,
  token: Token,
  target: Token,
  removeFlags = false,
  {
    isUsingFatigueForMoveAndAttack = false,
    isUsingFatigueForMightyBlows = false,
    isRapidStrikeAttacks = false,
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
    token.document.getFlag(MODULE_NAME, 'Por localización')
  );
  if (location && location.bonus) {
    if (removeFlags) token.document.unsetFlag(MODULE_NAME, 'location');
    modifiers.attack.push({ mod: location.bonus, desc: location.where });
  }

  ensureDefined(token.actor, 'token without actor');
  switch (getManeuver(token.actor)) {
    case 'move_and_attack':
      modifiers.attack.push({ mod: -getBulk(attack), desc: 'Por moverse y atacar' });
      break;
    case 'aoa_determined':
      modifiers.attack.push({ mod: 1, desc: 'determined' });
      break;
  }
  if (getManeuver(token.actor) !== 'move_and_attack') {
    const lastAim = <{ bonus: number } | undefined>token.document.getFlag(MODULE_NAME, 'Por apuntar');
    if (lastAim) {
      if (removeFlags) token.document.unsetFlag(MODULE_NAME, 'lastAim');
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
