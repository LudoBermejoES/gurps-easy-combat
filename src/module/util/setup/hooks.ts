import { registerSettings } from './settings.js';
import { registerHelpers, registerPartials } from './handlebars.js';
import { MODULE_NAME } from '../constants.js';
import ManeuverChooser from '../../applications/maneuverChooser.js';
import { ensureDefined, highestPriorityUsers } from '../miscellaneous.js';
import AttackChooser from '../../applications/attackChooser.js';
import { registerFunctions } from './socketkib.js';
import { getAttacks } from '../../dataExtractor.js';
import { MeleeAttack, RangedAttack } from '../../types';
import { getUserFromCombatant } from '../combatants';
import { clearEquipment, getEquippedItems } from '../weaponMacrosCTA';
import { getWeaponsFromAttacks } from '../weapons';

export function registerHooks(): void {
  Hooks.once('socketlib.ready', registerFunctions);

  // Initialize module
  Hooks.once('init', async () => {
    console.log('gurps-easy-combat | Initializing gurps-easy-combat');

    // Register custom module settings
    registerSettings();

    window.addEventListener('keydown', (evt) => {
      if (evt.key === 'Alt') {
        $(`#${window.EasyCombat.appId}`).hide();
      }
    });

    window.addEventListener('keyup', (evt) => {
      if (evt.key === 'Alt') {
        $(`#${window.EasyCombat.appId}`).show();
      }
    });

    // register Handlebars helpers and partials
    registerHelpers();
    await registerPartials();
  });

  const deleteFlags = (combat: Combat) => {
    if (game.user?.isGM) {
      combat.combatants.forEach((combatant) => {
        combatant?.token?.unsetFlag('token-attractor', 'movementAttracted');
        combatant?.token?.unsetFlag(MODULE_NAME, 'restrictedMovement');
        combatant?.token?.unsetFlag(MODULE_NAME, 'location');
        combatant?.token?.unsetFlag(MODULE_NAME, 'combatRoundMovement');
        combatant?.token?.unsetFlag(MODULE_NAME, 'roundRetreatMalus');
        combatant?.token?.unsetFlag(MODULE_NAME, 'lastParry');
        combatant?.token?.unsetFlag(MODULE_NAME, 'lastAim');
        combatant?.token?.unsetFlag(MODULE_NAME, 'lastFeint');
        combatant?.token?.unsetFlag(MODULE_NAME, 'lastEvaluate');
        combatant?.token?.unsetFlag(MODULE_NAME, 'choosingManeuver');
      });
    }
  };

  Hooks.on('preUpdateToken', (token: Token, changes: any, data: any) => {
    if (!game.combat) return true;

    const actor = token.actor;
    ensureDefined(actor, 'No actor selected');
    ensureDefined(game.user, 'No user selected');
    if (!highestPriorityUsers(actor).includes(game.user)) {
      return true;
    }

    const combatants = game.combat.combatants || [];
    let foundToken = false;
    combatants.forEach((combatant) => (combatant.data.tokenId === token.id ? (foundToken = true) : ''));
    if (!(changes.x || changes.y) || !foundToken) return;

    const restrictedMovement = token.getFlag(MODULE_NAME, 'restrictedMovement');
    if (restrictedMovement) {
      ui.notifications?.error('Tu movimiento está restringido en este turno');
      return false;
    }

    const isAttracted = token.getFlag('token-attractor', 'movementAttracted');
    if (isAttracted) {
      token.setFlag(MODULE_NAME, 'restrictedMovement', true);
      return true;
    }
    const choosingManeuver: any = token.getFlag(MODULE_NAME, 'choosingManeuver');
    if (choosingManeuver.choosing) {
      ui.notifications?.error('Antes de poder moverte tienes que escoger una maniobra');
      return false;
    }
    const originalMove = { x: token.data.x, y: token.data.y };
    const newMove = { x: changes.x || token.data.x, y: changes.y || token.data.y };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const distance: number = game.canvas.grid.measureDistance(originalMove, newMove, { gridSpaces: true }) || 0;

    const alreadyMoved = <{ restOfMovement: number; round: number } | { round: -1; restOfMovement: 0 }>(
      token.getFlag(MODULE_NAME, 'combatRoundMovement')
    );
    const restOfMovement =
      alreadyMoved?.round === game.combat?.round
        ? alreadyMoved.restOfMovement
        : token.actor?.data?.data?.currentmove || 0;
    if (distance <= restOfMovement) {
      token.setFlag(MODULE_NAME, 'combatRoundMovement', {
        restOfMovement: restOfMovement - distance,
        round: game.combat?.round ?? 0,
      });
      return true;
    } else {
      ui.notifications?.error('No puedes mover tanto: tu movimiento restante es ' + restOfMovement + ' casillas');
      return false;
    }
  });

  // on create combatant, set the maneuver
  Hooks.on('createCombatant', async (combatant: Combatant) => {
    ensureDefined(combatant.token, 'No actor selected');
    const actor = combatant.token.actor;
    ensureDefined(actor, 'No actor selected');
    ensureDefined(game.user, 'No user selected');
    if (!highestPriorityUsers(actor).includes(game.user)) {
      return;
    }

    ensureDefined(game.combat, 'No hay combate activo');
    combatant?.token?.unsetFlag(MODULE_NAME, 'readyActionsWeaponNeeded');
    deleteFlags(game.combat);
    //clearEquipment(combatant.token.id);

    const attacks: {
      melee: MeleeAttack[];
      ranged: RangedAttack[];
    } = getAttacks(actor);

    const meleeWeaponIds: string[] = attacks.melee.map((melee) => melee.itemid).filter((i) => i !== undefined);
    const rangedWeaponIds: string[] = attacks.ranged.map((melee) => melee.itemid).filter((i) => i !== undefined);
    const equippedItems: { itemId: string; hand: string }[] = await getEquippedItems(combatant?.token);
    await combatant.token.setFlag(MODULE_NAME, 'readyActionsWeaponNeeded', {
      items: Array.from(new Set([...meleeWeaponIds, ...rangedWeaponIds]))
        .filter((item) => !equippedItems.find((i) => i.itemId === item))
        .map((item) => {
          let remainingRounds = 1;

          const rangedAttack: RangedAttack | undefined = attacks.ranged.find((i) => i.itemid === item);
          if (rangedAttack) {
            const numberOfShots: string = rangedAttack.shots.split('(')[0];
            if (!isNaN(Number(numberOfShots)) && Number(numberOfShots) === 1) {
              remainingRounds = Number(rangedAttack.shots.split('(')[1].split(')')[0]) + 1;
            }
          }

          return {
            itemId: item,
            remainingRounds,
          };
        }),
    });
    const user: User = getUserFromCombatant(combatant);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.EasyCombat.socket.executeAsUser('readyWeaponsFirstRound', user.id, combatant.data.tokenId);
  });

  Hooks.on('deleteCombat', async (combat: Combat) => {
    deleteFlags(combat);
    if (game.user?.isGM) {
      combat.combatants.forEach((combatant) => {
        ensureDefined('combatant.token', 'Token exists');
        // clearEquipment(combatant?.token?.id || '');
      });
    }
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
    await tokenDocument.unsetFlag(MODULE_NAME, 'restrictedMovement');
    await tokenDocument.unsetFlag('token-attractor', 'movementAttracted');
    ensureDefined(actor, 'token without actor');
    await ManeuverChooser.closeAll();
    await AttackChooser.closeAll();
    if (highestPriorityUsers(actor).includes(game.user) && game.settings.get(MODULE_NAME, 'maneuver-chooser-on-turn')) {
      new ManeuverChooser(token).render(true);
    }
  });

  Hooks.on('getCombatTrackerEntryContext', function (html: any, menu: any) {
    const entry = {
      name: 'Resetear y volver a abrir la pantalla de maniobras',
      icon: '<i class="fas fa-undo-alt"></i>',
      callback: (li: any) => {
        const combatantId = li.data('combatant-id');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const combat = ui?.combat?.viewed;
        const combatant = combat.combatants.get(combatantId);
        const user: User = getUserFromCombatant(combatant);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.EasyCombat.socket.executeAsUser('chooseManeuver', user.id, combatant.data.tokenId);
      },
    };
    menu.splice(1, 0, entry);
  });
}
