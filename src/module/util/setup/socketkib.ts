import BaseActorController from '../../applications/abstract/BaseActorController.js';
import DefenseChooser from '../../applications/defenseChooser.js';
import FeintDefense from '../../applications/feintDefense.js';
import { MODULE_NAME } from '../constants.js';
import ManeuverChooser from '../../applications/maneuverChooser';
import { ensureDefined } from '../miscellaneous';
const functionsToRegister = {
  chooseManeuver: (token: string) => {
    ensureDefined(game.user, 'game not initialized');
    ensureDefined(game.canvas.tokens, 'game not initialized');
    const tokens = game.canvas.tokens.controlled;

    const tokenSelected: Token = tokens.find((tok) => tok.id === token) as Token;
    new ManeuverChooser(tokenSelected).render(true);
  },
  attemptDefense: DefenseChooser.attemptDefense,
  attemptFeintDefense: FeintDefense.attemptDefense,
  closeController: BaseActorController.closeById,
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
    ...args: Parameters<typeof functionsToRegister[T]>
  ): Promise<ReturnType<typeof functionsToRegister[T]>>;
  executeForEveryone<T extends keyof typeof functionsToRegister>(
    alias: T,
    ...args: Parameters<typeof functionsToRegister[T]>
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
