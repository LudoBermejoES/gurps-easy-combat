import BaseActorController from '../../applications/abstract/BaseActorController.js';
import DefenseChooser from '../../applications/defenseChooser.js';
import FeintDefense from '../../applications/feintDefense.js';
import { MODULE_NAME } from '../../applications/libs/constants';
import ManeuverChooser from '../../applications/maneuverChooser';
import { ensureDefined } from '../../applications/libs/miscellaneous';
import AttackChooser from '../../applications/attackChooser';

function getToken(token: string): Token {
  ensureDefined(game.user, 'game not initialized');
  ensureDefined(game.canvas.tokens, 'game not initialized');
  const tokenFound = game.canvas.tokens.placeables.find((tokenF) => tokenF.id === token);
  if (tokenFound) {
    return tokenFound;
  }
  const tokens = game.canvas.tokens.controlled;
  return tokens.find((tok) => tok.id === token) as Token;
}

const functionsToRegister = {
  addStoredMovement: (restOfMovement: number, round: number) => {
    game?.combat?.combatant?.token?.setFlag(MODULE_NAME, 'combatRoundMovement', {
      restOfMovement,
      round,
    });
  },
  readyWeaponsFirstRound: (token: string) => {
    new AttackChooser(getToken(token), { onlyReadyActions: true, beforeCombat: true }).render(true);
  },
  chooseManeuver: (token: string) => {
    new ManeuverChooser(getToken(token)).render(true);
  },
  attemptDefense: DefenseChooser.attemptDefense,
  attemptFeintDefense: FeintDefense.attemptDefense,
  closeController: BaseActorController.closeById,
  setFlag: BaseActorController.setFlag,
} as const;

interface SockerLib {
  registerModule(mudeltName: string): SockerLibSocket;
}
export interface SockerLibSocket {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(alias: string, func: (...args: any[]) => any): void;
  executeAsUser<T extends keyof typeof functionsToRegister>(
    alias: T,
    userId: string,
    ...args: Parameters<(typeof functionsToRegister)[T]>
  ): Promise<ReturnType<(typeof functionsToRegister)[T]>>;
  executeForEveryone<T extends keyof typeof functionsToRegister>(
    alias: T,
    ...args: Parameters<(typeof functionsToRegister)[T]>
  ): Promise<void>;
}
declare global {
  const socketlib: SockerLib;
}

export function registerFunctions(): void {
  EasyCombat.socket = socketlib.registerModule(MODULE_NAME);
  for (const [alias, func] of Object.entries(functionsToRegister)) {
    console.log(alias, func);
    EasyCombat.socket.register(alias, func);
  }
}
