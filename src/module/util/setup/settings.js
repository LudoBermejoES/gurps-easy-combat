import { MODULE_NAME } from '../../applications/libs/constants';
export function registerSettings() {
  game.settings.register(MODULE_NAME, 'maneuver-chooser-on-turn', {
    scope: 'world',
    type: Boolean,
    default: true,
    name: 'Open Maneuver Chooser when a new turn in combat is started',
    hint: 'the Chooser will only be opened for players that own the token',
    config: true,
  });
}
//# sourceMappingURL=settings.js.map
