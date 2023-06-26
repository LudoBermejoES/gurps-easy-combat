import { ensureDefined, getManeuver, getToken } from '../libs/miscellaneous';
import { allOutAttackManeuvers, MODULE_NAME } from '../libs/constants';
import EasyCombatActor from './EasyCombatActor';
import { plainToClassFromExist } from 'class-transformer';

export default class BaseActorController extends Application {
  static apps = new Map<string, BaseActorController>();

  token: Token;
  actor: EasyCombatActor;

  constructor(appName: string, token: Token, actor: EasyCombatActor | undefined, options: Partial<ApplicationOptions>) {
    const id = `${appName}-${token.id}`;
    super(mergeObject(Application.defaultOptions, { resizable: true, width: 600, id, ...options }));
    this.token = token;
    BaseActorController.apps.set(id, this);
    ensureDefined(token.actor, 'token has no actor');
    this.actor = actor || (token.actor as EasyCombatActor);
    ensureDefined(game.user, 'game not initialized');
    const gameUser = game.user;
    setTimeout(() => {
      if (!gameUser.isGM) {
        const user = this.getGM(game);
        this.prepareEventToSendToUser(user);
      }
    }, 1500);
  }

  prepareEventToSendToUser(user: User | undefined) {
    if (!user) return;
    $('*[data-appid="' + _appId + '"]').on('DOMSubtreeModified', () => {
      this.sendScreenToUser(user);
    });
    this.sendScreenToUser(user);
  }

  sendScreenToUser(user: User | undefined) {
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

  getGM(game: Game): User | undefined {
    return (game.users || []).find((user: User) => user.isGM);
  }

  async close(options?: Application.CloseOptions): Promise<void> {
    await super.close(options);
    const gm = this.getGM(game);
    if (gm) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window.EasyCombat.socket.executeAsUser('removeCopyOfScreen', gm.id);
    }

    BaseActorController.apps.delete(this.id);
  }

  static closeById(id: string): boolean {
    const instance = BaseActorController.apps.get(id);
    if (!instance) return false;
    instance.close();
    return true;
  }

  static async setFlag(sceneId: string, tokenId: string, key: string, object: any): Promise<boolean> {
    const token = getToken(sceneId, tokenId);
    const actor = token.actor;
    ensureDefined(actor, 'token without actor');
    if (allOutAttackManeuvers.includes(getManeuver(actor))) {
      ChatMessage.create({ content: `${actor.name} no puede defenderse porque ha utilizado Ataque total (lo siento)` });
      return false;
    }
    const promise = new Promise<boolean>((resolve) => {
      token.document.setFlag(MODULE_NAME, key, object);
      resolve(true);
    });
    return promise;
  }

  closeForEveryone(): void {
    $('#extra_details').remove();
    EasyCombat.socket.executeForEveryone('closeController', this.id);
  }

  static async closeAll(): Promise<void> {
    await Promise.all(
      [...this.apps.values()].map(async (app) => {
        if (app instanceof this) {
          await app.close();
        }
      }),
    );
  }
}
