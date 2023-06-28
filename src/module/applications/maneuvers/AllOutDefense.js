import { MODULE_NAME } from '../libs/constants';
import BaseManeuverChooser from '../abstract/BaseManeuverChooser.js';
export default class ManeuverChooser extends BaseManeuverChooser {
  constructor(token) {
    super('AllOutDefense', token, {
      title: `Defensa total - ${token.name}`,
      template: `modules/${MODULE_NAME}/templates/allOutDefense.hbs`,
    });
    this.maneuversInfo = {
      basic: {
        aod_dodge: {
          tooltip: 'Añade un +2 a Esquivar',
          page: 'B:366',
        },
        aod_parry: {
          tooltip: 'Añade un +2 a Parar',
          page: 'B:366',
        },
        aod_block: {
          tooltip: 'Añade un +2 a Bloquear',
          page: 'B:366',
        },
        aod_double: {
          tooltip: 'Aplica dos defensas contra el mismo ataque',
          page: 'B:366',
        },
      },
      advanced: {},
    };
  }
}
//# sourceMappingURL=AllOutDefense.js.map
