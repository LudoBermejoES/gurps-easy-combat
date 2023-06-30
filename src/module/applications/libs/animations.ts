import { Item } from '../../types';
import { getWeapon } from './weaponMacrosCTA';
import sequencerPresets from './sequencerPresets';

export async function doAnimationAttack(
  actor: Actor,
  weapon: Item | undefined,
  numberOfProjectiles?: number | undefined,
) {
  if (!weapon?.name) return;
  let anim = getWeapon(weapon.name)?.animation;
  if (anim) {
    if (numberOfProjectiles && numberOfProjectiles > 1) {
      anim += `x${numberOfProjectiles}:0.2`;
    }

    return GURPS.executeOTF(`!/anim ${anim}`, false, null, actor);
  }

  return;
}

export async function doSequenceAttack(weapon: Item | undefined, origin: Token, target: Token) {
  debugger;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!weapon?.name) return;
  const preset = getWeapon(weapon.name)?.sequenceAttack as keyof typeof sequencerPresets;
  if (preset && sequencerPresets[preset]) {
    return sequencerPresets[preset](origin, target);
  }
}

export async function doSequenceSuccess(weapon: Item | undefined, origin: Token, target: Token) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!weapon?.name) return;
  const preset = getWeapon(weapon.name)?.sequenceSuccess as keyof typeof sequencerPresets;
  if (preset && sequencerPresets[preset]) {
    sequencerPresets[preset](origin, target);
  }
}

export async function doAnimationMiss(actor: Actor, criticalMiss: boolean) {
  const anim = criticalMiss ? 'CriticalMiss_03_Red_200x200* c' : 'Miss_02_White_200x200* c';
  return GURPS.executeOTF(`!/anim ${anim}`, false, null, actor);
}

export async function doAnimationCriticalSuccess(actor: Actor) {
  const anim = 'w1 Critical_03_Red_200x200* c';
  return GURPS.executeOTF(`!/anim ${anim}`, false, null, actor);
}

export async function doAnimationDamage(actor: Actor) {
  const anim = 'w1 DmgBludgeoning_01_Regular_Yellow_2Handed_800x600* c';
  return GURPS.executeOTF(`!/anim ${anim}`, false, null, actor);
}

export async function doAnimationDefense(actor: Actor, success: boolean) {
  const anim: string = success ? 'IconShield_01_Regular_Blue_200x200* c' : 'Miss_02_White_200x200* c';
  return GURPS.executeOTF(`!/anim ${anim}`, false, null, actor);
}
