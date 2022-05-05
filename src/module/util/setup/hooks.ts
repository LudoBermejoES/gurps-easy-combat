import { registerSettings } from './settings.js';
import { registerHelpers, registerPartials } from './handlebars.js';
import { MODULE_NAME } from '../constants.js';
import ManeuverChooser from '../../applications/maneuverChooser.js';
import { ensureDefined, highestPriorityUsers } from '../miscellaneous.js';
import AttackChooser from '../../applications/attackChooser.js';
import { registerFunctions } from './socketkib.js';

export function registerHooks(): void {
  Hooks.once('socketlib.ready', registerFunctions);

  // Initialize module
  Hooks.once('init', async () => {
    console.log('gurps-easy-combat | Initializing gurps-easy-combat');

    // Register custom module settings
    registerSettings();

    // register Handlebars helpers and partials
    registerHelpers();
    await registerPartials();
  });

  const deleteFlags = (combat: Combat) => {
    combat.combatants.forEach((combatant) => {
      combatant?.token?.unsetFlag(MODULE_NAME, 'readyActionsWeaponNeeded');
      combatant?.token?.unsetFlag(MODULE_NAME, 'location');
      combatant?.token?.unsetFlag(MODULE_NAME, 'roundRetreatMalus');
      combatant?.token?.unsetFlag(MODULE_NAME, 'lastParry');
      combatant?.token?.unsetFlag(MODULE_NAME, 'lastAim');
      combatant?.token?.unsetFlag(MODULE_NAME, 'lastFeint');
      combatant?.token?.unsetFlag(MODULE_NAME, 'lastEvaluate');
    });
  };

  Hooks.on('deleteCombat', async (combat: Combat) => {
    deleteFlags(combat);
  });

  Hooks.on('updateCombat', async (combat: Combat) => {
    if (!combat.started) {
      deleteFlags(combat);
      return;
    }
    const tokenDocument = combat.combatant.token;
    ensureDefined(tokenDocument, 'current combatant has no actor');
    ensureDefined(tokenDocument.object, 'token document without token');
    const token = tokenDocument.object as Token;
    ensureDefined(game.user, 'game not initialized');
    const actor = token.actor;
    ensureDefined(actor, 'token without actor');
    await ManeuverChooser.closeAll();
    await AttackChooser.closeAll();
    if (highestPriorityUsers(actor).includes(game.user) && game.settings.get(MODULE_NAME, 'maneuver-chooser-on-turn')) {
      new ManeuverChooser(token).render(true);
    }
  });
}
