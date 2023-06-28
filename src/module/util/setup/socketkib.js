import BaseActorController from '../../applications/abstract/BaseActorController.js';
import DefenseChooser from '../../applications/defenseChooser.js';
import FeintDefense from '../../applications/feintDefense.js';
import { MODULE_NAME } from '../../applications/libs/constants';
import ManeuverChooser from '../../applications/maneuverChooser';
import { ensureDefined } from '../../applications/libs/miscellaneous';
import AttackChooser from '../../applications/attackChooser';
function getToken(token) {
  ensureDefined(game.user, 'game not initialized');
  ensureDefined(game.canvas.tokens, 'game not initialized');
  const tokenFound = game.canvas.tokens.placeables.find((tokenF) => tokenF.id === token);
  if (tokenFound) {
    return tokenFound;
  }
  const tokens = game.canvas.tokens.controlled;
  return tokens.find((tok) => tok.id === token);
}
const functionsToRegister = {
  addStoredMovement: (restOfMovement, round) => {
    game?.combat?.combatant?.token?.setFlag(MODULE_NAME, 'combatRoundMovement', {
      restOfMovement,
      round,
    });
  },
  readyWeaponsFirstRound: (token) => {
    new AttackChooser(getToken(token), { onlyReadyActions: true, beforeCombat: true }).render(true);
  },
  chooseManeuver: (token) => {
    new ManeuverChooser(getToken(token)).render(true);
  },
  attemptDefense: DefenseChooser.attemptDefense,
  attemptFeintDefense: FeintDefense.attemptDefense,
  closeController: BaseActorController.closeById,
  setFlag: BaseActorController.setFlag,
  showCopyOfScreen: (screen) => {
    $('#copyGurpsEasyCombat').remove();
    $('body').append(screen);
  },
  removeCopyOfScreen: () => {
    $('#copyGurpsEasyCombat').remove();
  },
  chooseAttack: (token) => {
    const data = new ManeuverChooser(getToken(token));
    const alreadyMoved = getToken(token).document.getFlag(MODULE_NAME, 'combatRoundMovement');
    const currentMove = getToken(token).actor?.data?.data?.currentmove || 0;
    const restOfMovement =
      alreadyMoved?.round === game.combat?.round
        ? alreadyMoved.restOfMovement
        : getToken(token).actor?.data?.data?.currentmove || 0;
    const totalMovement = currentMove - restOfMovement;
    if (totalMovement <= 1) {
      data.chooseManeuver('attack', null);
    } else {
      5;
      data.chooseManeuver('move_and_attack', null);
    }
  },
};
export function registerFunctions() {
  EasyCombat.socket = socketlib.registerModule(MODULE_NAME);
  for (const [alias, func] of Object.entries(functionsToRegister)) {
    console.log(alias, func);
    EasyCombat.socket.register(alias, func);
  }
}
//# sourceMappingURL=socketkib.js.map
