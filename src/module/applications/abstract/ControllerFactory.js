export default function controllerFactory() {
  class Controller extends Application {
    constructor(appName, actor, options) {
      const id = `${appName}-${actor.id}`;
      super(mergeObject(Application.defaultOptions, { resizable: true, width: 600, id, ...options }));
      this.actor = actor;
      if (!this.actor) {
        throw new Error('no actor');
      }
      Controller.apps.set(id, this);
    }
    async close(options) {
      await super.close(options);
      Controller.apps.delete(this.id);
    }
    static closeById(id) {
      const instance = Controller.apps.get(id);
      if (!instance) return false;
      instance.close();
      return true;
    }
    closeForEveryone() {
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
  Controller.apps = new Map();
  return Controller;
}
//# sourceMappingURL=ControllerFactory.js.map
