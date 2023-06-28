// Import TypeScript modules
import * as dataExtractor from './dataExtractor.js';
import ManeuverChooser from './applications/maneuverChooser.js';
import AttackChooser from './applications/attackChooser.js';
import { registerHooks } from './util/setup/hooks.js';
import DefenceChooser from './applications/defenseChooser.js';
import { drawEquipment } from './applications/libs/weaponMacrosCTA';
const appId = _appId;
const globals = {
  dataExtractor,
  ManeuverChooser,
  AttackChooser,
  DefenceChooser,
  drawEquipment,
  appId,
};
window.EasyCombat = globals;
registerHooks();
//# sourceMappingURL=gurps-easy-combat.js.map
