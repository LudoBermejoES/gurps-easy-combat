import { MODULE_NAME } from './libs/constants';
import BaseManeuverChooser from './abstract/BaseManeuverChooser.js';
import AttackChooser from './attackChooser.js';
import AllOutAttack from './maneuvers/AllOutAttack.js';
import AllOutDefense from './maneuvers/AllOutDefense.js';
import Feint from './maneuvers/Feint.js';
import Aim from './maneuvers/Aim.js';
import Evaluate from './maneuvers/Evaluate';
import PostureChooser from './postureChooser';
export default class ManeuverChooser extends BaseManeuverChooser {
  constructor(token) {
    super('ManeuverChooser', token, {
      title: `Elección de maniobra - ${token.name}`,
      template: `modules/${MODULE_NAME}/templates/maneuverChooser.hbs`,
    });
    const alreadyMoved = token.document.getFlag(MODULE_NAME, 'combatRoundMovement');
    const restOfMovement =
      alreadyMoved?.round === game.combat?.round
        ? alreadyMoved.restOfMovement
        : token.actor?.data?.data?.currentmove || 0;
    if (restOfMovement >= Math.floor(token.actor?.data?.data?.currentmove || 0) - 1) {
      this.maneuversInfo = {
        basic: {
          move: {
            tooltip: 'Solo moverse',
            page: 'B:364',
          },
          attack: {
            tooltip: 'Ataque cuerpo a cuerpo o a distancia',
            page: 'B:365',
            callback: (token) => {
              new AttackChooser(token).render(true);
            },
          },
          move_and_attack: {
            tooltip: 'Moverse y atacar con penalizador',
            page: 'B:365',
            callback: (token) => new AttackChooser(token).render(true),
          },
          ready: {
            tooltip: 'Preparar un arma u otro equipo',
            page: 'B:366',
            callback: (token) => {
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
            callback: (token) => new Feint(token).render(true),
          },
          evaluate: {
            tooltip: 'Estudiar a un enemigo antes de un ataque de melee',
            page: 'B:364',
            callback: (token) => new Evaluate(token),
          },
          do_nothing: {
            tooltip: 'No hacer acción pero recuperarse de Aturdido',
            page: 'B:364',
            callback: () => game.combat?.nextTurn(),
          },
          allout_attack: {
            tooltip: 'Atacar con bonus o varias veces',
            page: 'B:365',
            callback: (token) => new AllOutAttack(token).render(true),
          },
          allout_defense: {
            tooltip: 'Defensa incrementada o defenderse dos veces de un mismo ataque',
            page: 'B:366',
            callback: (token) => new AllOutDefense(token).render(true),
          },
          change_posture: {
            tooltip: `Levantarse, sentarse, etc`,
            page: 'B:364',
            callback: (token) => new PostureChooser(token).render(true),
          },
          aim: {
            tooltip: 'Apuntar un arma a distancia para conseguir su bono de Precisión',
            page: 'B:364',
            callback: (token) => new Aim(token).render(true),
          },
          wait: {
            tooltip: 'Esperar antes de actuar',
            page: 'B:366',
          },
        },
      };
    } else if (restOfMovement > Math.floor((token.actor?.data?.data?.currentmove || 0) / 2)) {
      this.maneuversInfo = {
        basic: {
          move: {
            tooltip: 'Solo moverse',
            page: 'B:364',
          },
          move_and_attack: {
            tooltip: 'Moverse y atacar con penalizador',
            page: 'B:365',
            callback: (token) => new AttackChooser(token).render(true),
          },
        },
        advanced: {
          do_nothing: {
            tooltip: 'No hacer acción pero recuperarse de Aturdido',
            page: 'B:364',
            callback: () => game.combat?.nextTurn(),
          },
          allout_attack: {
            tooltip: 'Atacar con bonus o varias veces',
            page: 'B:365',
            callback: (token) => new AllOutAttack(token).render(true),
          },
          allout_defense: {
            tooltip: 'Defensa incrementada o defenderse dos veces de un mismo ataque',
            page: 'B:366',
            callback: (token) => new AllOutDefense(token).render(true),
          },
          change_posture: {
            tooltip: `Levantarse, sentarse, etc`,
            page: 'B:364',
            callback: (token) => new PostureChooser(token).render(true),
          },
          wait: {
            tooltip: 'Esperar antes de actuar',
            page: 'B:366',
          },
        },
      };
    } else {
      this.maneuversInfo = {
        basic: {
          move: {
            tooltip: 'Solo moverse',
            page: 'B:364',
          },
          move_and_attack: {
            tooltip: 'Moverse y atacar con penalizador',
            page: 'B:365',
            callback: (token) => new AttackChooser(token).render(true),
          },
        },
        advanced: {
          do_nothing: {
            tooltip: 'No hacer acción pero recuperarse de Aturdido',
            page: 'B:364',
            callback: () => game.combat?.nextTurn(),
          },
          change_posture: {
            tooltip: `Levantarse, sentarse, etc`,
            page: 'B:364',
            callback: (token) => new PostureChooser(token).render(true),
          },
          wait: {
            tooltip: 'Esperar antes de actuar',
            page: 'B:366',
          },
        },
      };
    }
  }
}
//# sourceMappingURL=maneuverChooser.js.map
