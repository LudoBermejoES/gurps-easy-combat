import { MODULE_NAME } from './libs/constants';
import BaseManeuverChooser, { ManeuverInfo } from './abstract/BaseManeuverChooser.js';
import AttackChooser from './attackChooser.js';
import AllOutAttack from './maneuvers/AllOutAttack.js';
import AllOutDefense from './maneuvers/AllOutDefense.js';
import Feint from './maneuvers/Feint.js';
import Aim from './maneuvers/Aim.js';
import Evaluate from './maneuvers/Evaluate';
import PostureChooser from './postureChooser';

export default class SimpliedManeuverChooser extends BaseManeuverChooser {
  maneuversInfo: {
    basic: Record<string, ManeuverInfo>;
    advanced: Record<string, ManeuverInfo>;
  };

  constructor(token: Token) {
    super('SimpliedManeuverChooser', token, {
      title: `Elección de maniobra - ${token.name}`,
      template: `modules/${MODULE_NAME}/templates/simpliedManeuverChooser.hbs`,
    });
    this.maneuversInfo = {
      basic: {
        move: {
          tooltip: 'Solo moverse',
          page: 'B:364',
        },

        attack: {
          tooltip: 'Ataque cuerpo a cuerpo o a distancia',
          page: 'B:365',
          callback: (token: Token) => {
            new AttackChooser(token).render(true);
          },
        },
        move_and_attack: {
          tooltip: 'Moverse y atacar con penalizador',
          page: 'B:365',
          callback: (token: Token) => new AttackChooser(token).render(true),
        },
        ready: {
          tooltip: 'Preparar un arma u otro equipo',
          page: 'B:366',
          callback: (token: Token) => {
            new AttackChooser(token, { onlyReadyActions: true }).render(true);
          },
        },
        concentrate: {
          tooltip: 'Enfocarse en una tarea mental, como un hechizo',
          page: 'B:366',
        },
      },
      advanced: {
        feint: {
          tooltip: 'Fingir un ataque cuerpo a cuerpo para ganar un bonus',
          page: 'B:365',
          callback: (token: Token) => new Feint(token).render(true),
        },
        evaluate: {
          tooltip: 'Estudiar a un enemigo antes de un ataque de melee',
          page: 'B:364',
          callback: (token: Token) => new Evaluate(token),
        },
        do_nothing: {
          tooltip: 'No hacer acción pero recuperarse de Aturdido',
          page: 'B:364',
          callback: () => game.combat?.nextTurn(),
        },
        allout_attack: {
          tooltip: 'Atacar con bonus o varias veces',
          page: 'B:365',
          callback: (token: Token) => new AllOutAttack(token).render(true),
        },
        allout_defense: {
          tooltip: 'Defensa incrementada o defenderse dos veces de un mismo ataque',
          page: 'B:366',
          callback: (token: Token) => new AllOutDefense(token).render(true),
        },
        change_posture: {
          tooltip: `Levantarse, sentarse, etc`,
          page: 'B:364',
          callback: (token: Token) => new PostureChooser(token).render(true),
        },
        aim: {
          tooltip: 'Apuntar un arma a distancia para conseguir su bono de Precisión',
          page: 'B:364',
          callback: (token: Token) => new Aim(token).render(true),
        },
        wait: {
          tooltip: 'Esperar antes de actuar',
          page: 'B:366',
        },
      },
    };
  }
}
