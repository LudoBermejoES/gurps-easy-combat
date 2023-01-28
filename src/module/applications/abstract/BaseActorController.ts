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
    $(`#${id} .close`).hide();
  }

  async close(options?: Application.CloseOptions): Promise<void> {
    await super.close(options);
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
