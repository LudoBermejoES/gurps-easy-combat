import { getWeapon } from './weaponMacrosCTA';
import sequencerPresets from './sequencerPresets';
export async function doAnimationAttack(actor, weapon, numberOfProjectiles, origin, target) {
  if (!weapon?.name) return;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  let anim = getWeapon(weapon.name)?.animation;
  if (anim) {
    if (numberOfProjectiles && numberOfProjectiles > 1) {
      anim += `x${numberOfProjectiles}:0.2`;
    }
    return GURPS.executeOTF(`!/anim ${anim}`, false, null, actor);
  }
  const preset = getWeapon(weapon.name)?.sequencePreset;
  if (preset && sequencerPresets[preset]) {
    sequencerPresets[preset](origin, target);
  }
  return;
}
export async function doAnimationMiss(actor, criticalMiss) {
  const anim = criticalMiss ? 'CriticalMiss_03_Red_200x200* c' : 'Miss_02_White_200x200* c';
  return GURPS.executeOTF(`!/anim ${anim}`, false, null, actor);
}
export async function doAnimationCriticalSuccess(actor) {
  const anim = 'w1 Critical_03_Red_200x200* c';
  return GURPS.executeOTF(`!/anim ${anim}`, false, null, actor);
}
export async function doAnimationDamage(actor) {
  const anim = 'w1 DmgBludgeoning_01_Regular_Yellow_2Handed_800x600* c';
  return GURPS.executeOTF(`!/anim ${anim}`, false, null, actor);
}
export async function doAnimationDefense(actor, success) {
  const anim = success ? 'IconShield_01_Regular_Blue_200x200* c' : 'Miss_02_White_200x200* c';
  return GURPS.executeOTF(`!/anim ${anim}`, false, null, actor);
}
//# sourceMappingURL=animations.js.map
