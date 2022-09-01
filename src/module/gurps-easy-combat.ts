// Import TypeScript modules
import * as dataExtractor from './dataExtractor.js';
import ManeuverChooser from './applications/maneuverChooser.js';
import AttackChooser from './applications/attackChooser.js';
import { registerHooks } from './util/setup/hooks.js';
import DefenceChooser from './applications/defenseChooser.js';
import { SockerLibSocket } from './util/setup/socketkib.js';
import { drawEquipment } from './applications/libs/weaponMacrosCTA';

let appId = '';
appId = '3';
const globals = {
  dataExtractor,
  ManeuverChooser,
  AttackChooser,
  DefenceChooser,
  drawEquipment,
  appId,
};

declare global {
  const EasyCombat: typeof globals & { socket: SockerLibSocket };
  interface Window {
    EasyCombat: typeof globals;
  }
  interface LenientGlobalVariableTypes {
    game: Game;
  }
}

export function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null),
      );
    });
  });
}

window.EasyCombat = globals;

registerHooks();
