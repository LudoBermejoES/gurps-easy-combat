import { findAdvantage } from './miscellaneous';

export function hasAmbidexterity(actor: Actor) {
  return findAdvantage(actor, 'Ambidexterity') !== undefined;
}

export function hasHighPainThreshold(actor: Actor) {
  return findAdvantage(actor, 'High Pain Threshold') !== undefined;
}

export function hasLowPainThreshold(actor: Actor) {
  return findAdvantage(actor, 'Power Blow') !== undefined;
}
