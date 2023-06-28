import { findAdvantage } from './miscellaneous';
export function hasAmbidexterity(actor) {
  return findAdvantage(actor, 'Ambidexterity') !== undefined;
}
export function hasHighPainThreshold(actor) {
  return findAdvantage(actor, 'High Pain Threshold') !== undefined;
}
export function hasLowPainThreshold(actor) {
  return findAdvantage(actor, 'Power Blow') !== undefined;
}
//# sourceMappingURL=advantagesDataExtractor.js.map
