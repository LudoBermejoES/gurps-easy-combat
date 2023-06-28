import { findSkillSpell } from './miscellaneous';
export function isOffHandTrained(actor, attack) {
  let isTrained;
  if (actor) {
    let alternateName = attack.originalName;
    if (attack.originalName.toLowerCase().includes('knife')) {
      alternateName = 'Knife';
    }
    isTrained = findSkillSpell(actor, `Off-Hand Weapon Training (${alternateName})`, true, false);
  }
  return isTrained;
}
export function hasPowerBlow(actor) {
  return findSkillSpell(actor, 'Power blow', true, false);
}
//# sourceMappingURL=skillsDataExtractor.js.map
