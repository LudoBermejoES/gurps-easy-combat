import { ChooserData } from '../../types.js';
import { MODULE_NAME } from '../libs/constants';
import { activateChooser, awaitClick, checkSingleTarget, ensureDefined, getTargets } from '../libs/miscellaneous';
import BaseActorController from '../abstract/BaseActorController.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Maneuvers from '/systems/gurps/module/actor/maneuver.js';
import ManeuverChooser from '../maneuverChooser';
import EasyCombatActor, { easyCombatActorfromToken } from './EasyCombatActor';

//#region types
export interface ManeuverInfo {
  tooltip: string;
  page: string;
  callback?: (token: Token) => void;
}
interface Maneuver extends ManeuverInfo {
  name: string;
  canAttack: boolean;
  key: string;
}
interface GurpsManeuver {
  changes: {
    key: string;
    mode: number;
    priority: number;
    value: string;
  }[];
  flags: {
    gurps: {
      alt: null;
      defense: 'any' | 'none' | 'dodge-block';
      fullturn: boolean;
      icon: string;
      move: 'step' | 'half' | 'full';
      name: string;
    };
  };
  icon: string;
  id: 'maneuver';
  label: string;
}
//#endregion

export default abstract class BaseManeuverChooser extends BaseActorController {
  abstract maneuversInfo: {
    basic: Record<string, ManeuverInfo>;
    advanced: Record<string, ManeuverInfo>;
  };

  constructor(appName: string, token: Token, options: Partial<ApplicationOptions>) {
    super(appName, token, easyCombatActorfromToken(token), {
      title: `Maneuver Chooser - ${token.name}`,
      template: `modules/${MODULE_NAME}/templates/maneuverChooser.hbs`,
      ...options,
    });
    this.token.document.setFlag(MODULE_NAME, 'choosingManeuver', {
      choosing: true,
    });
  }
  getData(): {
    basicManeuver: ChooserData<['Maneuver', 'Description']>;
    advancedManeuver: ChooserData<['Maneuver', 'Description']>;
  } {
    const maneuversDescriptionsBasic = this.getManeuversData().basic.map((maneuver) => ({
      Maneuver: maneuver.name,
      Description: maneuver.tooltip,
      type: maneuver.key,
    }));
    const maneuversDescriptionsAdvanced = this.getManeuversData().advanced.map((maneuver) => ({
      Maneuver: maneuver.name,
      Description: maneuver.tooltip,
      type: maneuver.key,
    }));
    return {
      basicManeuver: { items: maneuversDescriptionsBasic, headers: ['Maneuver', 'Description'], id: 'manuever_choice' },
      advancedManeuver: {
        items: maneuversDescriptionsAdvanced,
        headers: ['Maneuver', 'Description'],
        id: 'manuever_choice2',
      },
    };
  }

  getManueverData(d: any, type: string | null): Maneuver {
    if (typeof d === 'string') {
      const all: Maneuver[] = [...this.getManeuversData().basic, ...this.getManeuversData().advanced];
      const maneuver: Maneuver | undefined = all.find((i) => i.key === String(d));
      if (maneuver) return maneuver;
    }
    const selected = type || 'basic';
    return selected === 'basic'
      ? this.getManeuversData().basic[Number(d)]
      : this.getManeuversData().advanced[Number(d)];
  }

  async chooseManeuver(index: any, type: string | null): Promise<void> {
    this.token.document.setFlag(MODULE_NAME, 'choosingManeuver', {
      choosing: false,
    });
    const maneuver = this.getManueverData(index, type);
    let target;
    if (['aim', 'evaluate', 'attack', 'feint', 'allout_attack', 'move_and_attack'].includes(maneuver.key)) {
      ensureDefined(game.user, 'game not initialized');
      if (!checkSingleTarget(game.user, false)) {
        $('*[data-appid="' + _appId + '"]').hide();
        await awaitClick();
        $('*[data-appid="' + _appId + '"]').show();
      }

      if (checkSingleTarget(game.user)) {
        target = getTargets(game.user)[0];
        ensureDefined(target.actor, 'target has no actor');
      }
      if (!target) return;
    }

    this.token.setManeuver(maneuver.key).then(() => {
      ChatMessage.create({
        content: `${this.token.name} uses the "${maneuver.name}" maneuver [PDF:${maneuver.page}]`,
      });
      this.closeForEveryone();
      const token = this.token;
      setTimeout(() => maneuver.callback?.(token), 500);
    });
  }

  activateListeners(html: JQuery): void {
    activateChooser(
      html,
      'manuever_choice,manuever_choice2',
      async (index, element, type) => {
        this.chooseManeuver(index, type);
      },
      (index, element, type) => {
        const content = element.closest('.window-content');
        $('#extra_details').remove();
        const selected = type || 'basic';
        const maneuver =
          selected === 'basic' ? this.getManeuversData().basic[index] : this.getManeuversData().advanced[index];

        const html = $(`#${maneuver.key}`).clone().html();
        content.append(
          `<div class="app window-app" id='extra_details' style="z-index: 101; width: 300px; left: 100%; height: '${content.height()}'">${html}</div>`,
        );
      },
    );
    $('#closeAndReturn', html).click(() => {
      const token = this.token;
      ensureDefined(game.user, 'game not initialized');
      new ManeuverChooser(token).render(true);
      this.closeForEveryone();
    });
  }

  getInfo(gurpsManeuvers: Record<string, GurpsManeuver>, maneuversList: Record<string, ManeuverInfo>): Maneuver[] {
    return Object.entries(maneuversList).map(([key, maneuverInfo]: [string, ManeuverInfo]) => {
      return {
        ...maneuverInfo,
        name: game.i18n.localize(gurpsManeuvers[key].label),
        canAttack: key.includes('attack'),
        key,
      };
    });
  }

  getManeuversData(): { basic: Maneuver[]; advanced: Maneuver[] } {
    const gurpsManeuvers: Record<string, GurpsManeuver> = Maneuvers.getAllData();
    return {
      basic: this.getInfo(gurpsManeuvers, this.maneuversInfo.basic),
      advanced: this.getInfo(gurpsManeuvers, this.maneuversInfo.advanced),
    };
  }
}
