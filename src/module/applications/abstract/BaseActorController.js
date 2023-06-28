import { ensureDefined, getManeuver, getToken } from '../libs/miscellaneous';
import { allOutAttackManeuvers, MODULE_NAME } from '../libs/constants';
export default class BaseActorController extends Application {
  constructor(appName, token, actor, options) {
    const id = `${appName}-${token.id}`;
    super(mergeObject(Application.defaultOptions, { resizable: true, width: 600, id, ...options }));
    this.token = token;
    BaseActorController.apps.set(id, this);
    ensureDefined(token.actor, 'token has no actor');
    this.actor = actor || token.actor;
    ensureDefined(game.user, 'game not initialized');
    const gameUser = game.user;
    setTimeout(() => {
      if (!gameUser.isGM) {
        const user = this.getGM(game);
        this.prepareEventToSendToUser(user);
      }
    }, 1500);
  }
  prepareEventToSendToUser(user) {
    if (!user) return;
    $('*[data-appid="' + _appId + '"]').on('DOMSubtreeModified', () => {
      this.sendScreenToUser(user);
    });
    this.sendScreenToUser(user);
  }
  sendScreenToUser(user) {
    if (!user) return;
    const innerDIV = $('*[data-appid="' + _appId + '"]').html();
    const iClass = $('*[data-appid="' + _appId + '"]').attr('class');
    const iStyle = $('*[data-appid="' + _appId + '"]').attr('style');
    const name = 'copyGurpsEasyCombat';
    const outerDIV = `<div id='${name}' class='${iClass}' style='${iStyle}'>${innerDIV}</div>`;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.EasyCombat.socket.executeAsUser('showCopyOfScreen', user.id, outerDIV);
  }
  getGM(game) {
    return (game.users || []).find((user) => user.isGM);
  }
  async close(options) {
    await super.close(options);
    const gm = this.getGM(game);
    if (gm) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window.EasyCombat.socket.executeAsUser('removeCopyOfScreen', gm.id);
    }
    BaseActorController.apps.delete(this.id);
  }
  static closeById(id) {
    const instance = BaseActorController.apps.get(id);
    if (!instance) return false;
    instance.close();
    return true;
  }
  static async setFlag(sceneId, tokenId, key, object) {
    const token = getToken(sceneId, tokenId);
    const actor = token.actor;
    ensureDefined(actor, 'token without actor');
    if (allOutAttackManeuvers.includes(getManeuver(actor))) {
      ChatMessage.create({ content: `${actor.name} no puede defenderse porque ha utilizado Ataque total (lo siento)` });
      return false;
    }
    const promise = new Promise((resolve) => {
      token.document.setFlag(MODULE_NAME, key, object);
      resolve(true);
    });
    return promise;
  }
  closeForEveryone() {
    $('#extra_details').remove();
    EasyCombat.socket.executeForEveryone('closeController', this.id);
  }
  static async closeAll() {
    await Promise.all(
      [...this.apps.values()].map(async (app) => {
        if (app instanceof this) {
          await app.close();
        }
      }),
    );
  }
}
BaseActorController.apps = new Map();
//# sourceMappingURL=BaseActorController.js.map
