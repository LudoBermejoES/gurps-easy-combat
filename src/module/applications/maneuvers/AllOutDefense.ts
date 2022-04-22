import { MODULE_NAME } from '../../util/constants.js';
import BaseManeuverChooser from '../abstract/BaseManeuverChooser.js';
import AttackChooser from '../attackChooser.js';
import Feint from './Feint.js';

//#region types
interface ManeuverInfo {
  tooltip: string;
  page: string;
  callback?: (token: Token) => void;
}

export default class ManeuverChooser extends BaseManeuverChooser {
  maneuversInfo: Record<string, ManeuverInfo>;

  constructor(token: Token) {
    super('AllOutDefense', token, {
      title: `Defensa total - ${token.name}`,
      template: `modules/${MODULE_NAME}/templates/maneuverChooser.hbs`,
    });
    this.maneuversInfo = {
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
    };
  }
}
