export default class BaseActorController extends Application {
  actor: Actor;

  static apps = new Map<string, BaseActorController>();

  constructor(appName: string, actor: Actor, options: Partial<Application.Options>) {
    const id = `${appName}-${actor.id}`;
    super(mergeObject(Application.defaultOptions, { resizable: true, id, ...options }));
    this.actor = actor;
    if (!this.actor) {
      throw new Error('no actor');
    }
    BaseActorController.apps.set(id, this);
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

  closeForEveryone(): void {
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