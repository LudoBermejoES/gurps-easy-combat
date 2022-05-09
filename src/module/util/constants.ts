export const MODULE_NAME = 'gurps-easy-combat' as const;
export const TEMPLATES_FOLDER = `modules/${MODULE_NAME}/templates` as const;
export const allOutAttackManeuvers = [
  'allout_attack',
  'aoa_determined',
  'aoa_double',
  'aoa_feint',
  'aoa_strong',
  'aoa_suppress',
];
export const allOutDefenseManeuvers = ['allout_defense', 'aod_dodge', 'aod_parry', 'aod_block', 'aod_double'];

export const ACROBATICS = 'Acrobatics';

export const FENCING_WEAPONS = ['MAIN-GAUCHE', 'RAPIER', 'SABER', 'Smallsword'];

export const FAST_DRAW_ARROW_WEAPONS = ['CROSSBOW', ' BOW'];
export const FAST_DRAW_SWORD_WEAPONS = ['RAPIER', ' SHORTSWORD', 'BASTARD SWORD', 'BROADSWORD', 'LONGSWORD'];
export const FAST_DRAW_TWO_HANDED_SWORD_WEAPONS = ['GREATSWORD'];

export const FAST_DRAW_SKILLS: any = {
  'FAST-DRAW (Arrows)': ['CROSSBOW', ' BOW'],
  'FAST-DRAW (Force Sword)': ['FORCE SWORD'],
  'FAST-DRAW (Knife)': ['DAGGER', 'KNIFE'],
  'FAST-DRAW (Pistol)': ['PISTOL', 'REVOLVER'],
  'FAST-DRAW (SWORD)': ['RAPIER', ' SHORTSWORD', 'BASTARD SWORD', 'BROADSWORD', 'LONGSWORD'],
  'FAST-DRAW (TWO-HANDED SWORD)': ['GREATSWORD'],
  'FAST-DRAW/TL* (AMMO)': ['AMMO'],
};
export const FAST_DRAW_ARROW_SEARCH = 'Fast-Draw/TL* (Arrows)';

export const FAST_DRAW_SKILLS_SEARCH = 'Fast-Draw/TL* (*)';
