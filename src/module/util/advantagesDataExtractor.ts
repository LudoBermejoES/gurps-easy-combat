import { findAdvantage } from './miscellaneous';

export function hasAmbidexterity(actor: Actor) {
  return findAdvantage(actor, 'Ambidexterity') !== undefined;
}
