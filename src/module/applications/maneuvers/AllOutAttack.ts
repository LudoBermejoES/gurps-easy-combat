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
    super('AllOutAttack', token, {
      title: `Ataque total - ${token.name}`,
      template: `modules/${MODULE_NAME}/templates/maneuverChooser.hbs`,
    });
    this.maneuversInfo = {
      aoa_double: {
        tooltip: 'Atacar dos veces con un arma cuerpo a cuerpo',
        page: 'B:365',
        callback: async (token: Token) => {
          await AttackChooser.request(token, { meleeOnly: true });
          await AttackChooser.request(token, { meleeOnly: true });
        },
      },
      aoa_determined: {
        tooltip: 'Ataca con un bonus (+4 para Cuerpo a cuerpo, +1 a Distancia',
        page: 'B:365',
        callback: (token: Token) => new AttackChooser(token).render(true),
      },
      aoa_strong: {
        tooltip: 'Ataca con +2 al daño usando un arma de melee',
        page: 'B:365',
        callback: (token: Token) => new AttackChooser(token, { meleeOnly: true }).render(true),
      },
      aoa_feint: {
        tooltip: 'Hace una finta y después un ataque con un arma cuerpo a cuerpo',
        page: 'B:365',
        callback: async (token: Token) => {
          await Feint.request(token);
          await AttackChooser.request(token, { meleeOnly: true });
          token.document.unsetFlag(MODULE_NAME, 'lastFeint');
        },
      },
      aoa_suppress: {
        tooltip: 'Fuego de supresión en un área con arma automática (solo con RoF 5+)',
        page: 'B:365',
        callback: (token: Token) => new AttackChooser(token, { rangedOnly: true }).render(true),
      },
    };
  }
}
