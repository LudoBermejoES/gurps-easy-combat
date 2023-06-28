import { MODULE_NAME } from '../libs/constants';
import { activateChooser, awaitClick, checkSingleTarget, ensureDefined, getTargets } from '../libs/miscellaneous';
import BaseActorController from '../abstract/BaseActorController.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Maneuvers from '/systems/gurps/module/actor/maneuver.js';
import ManeuverChooser from '../maneuverChooser';
import { easyCombatActorfromToken } from './EasyCombatActor';
//#endregion
export default class BaseManeuverChooser extends BaseActorController {
  constructor(appName, token, options) {
    super(appName, token, easyCombatActorfromToken(token), {
      title: `Maneuver Chooser - ${token.name}`,
      template: `modules/${MODULE_NAME}/templates/maneuverChooser.hbs`,
      ...options,
    });
    this.token.document.setFlag(MODULE_NAME, 'choosingManeuver', {
      choosing: true,
    });
  }
  getData() {
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
  getManueverData(d, type) {
    if (typeof d === 'string') {
      const all = [...this.getManeuversData().basic, ...this.getManeuversData().advanced];
      const maneuver = all.find((i) => i.key === String(d));
      if (maneuver) return maneuver;
    }
    const selected = type || 'basic';
    return selected === 'basic'
      ? this.getManeuversData().basic[Number(d)]
      : this.getManeuversData().advanced[Number(d)];
  }
  async chooseManeuver(index, type) {
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
  activateListeners(html) {
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
  getInfo(gurpsManeuvers, maneuversList) {
    return Object.entries(maneuversList).map(([key, maneuverInfo]) => {
      return {
        ...maneuverInfo,
        name: game.i18n.localize(gurpsManeuvers[key].label),
        canAttack: key.includes('attack'),
        key,
      };
    });
  }
  getManeuversData() {
    const gurpsManeuvers = Maneuvers.getAllData();
    return {
      basic: this.getInfo(gurpsManeuvers, this.maneuversInfo.basic),
      advanced: this.getInfo(gurpsManeuvers, this.maneuversInfo.advanced),
    };
  }
}
//# sourceMappingURL=BaseManeuverChooser.js.map
