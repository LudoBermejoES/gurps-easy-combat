import { MODULE_NAME, TEMPLATES_FOLDER } from './libs/constants';
import { getPostures } from '../dataExtractor.js';
import { ChooserData, Posture, PromiseFunctions } from '../types.js';
import BaseActorController from './abstract/BaseActorController.js';
import { activateChooser, ensureDefined } from './libs/miscellaneous';
import ManeuverChooser from './maneuverChooser';
import AttackChooser from './attackChooser';
import EasyCombatActor, { easyCombatActorfromToken } from './abstract/EasyCombatActor';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

interface PostureData {
  meleeOnly?: boolean;
  rangedOnly?: boolean;
  keepOpen?: boolean;
  twoPostures?: boolean;
}

interface Location {
  roll: string;
  where: string;
  penalty: string;
}

export default class PostureChooser extends BaseActorController {
  data: PostureData;
  postures: Posture[];
  indexLocation = 0;

  promiseFuncs: PromiseFunctions<void> | undefined;

  constructor(token: Token, data: PostureData = {}, promiseFuncs?: PromiseFunctions<void>) {
    super('PostureChooser', token, easyCombatActorfromToken(token), {
      title: `Escoger postura - ${token.name}`,
      template: `${TEMPLATES_FOLDER}/postureChooser.hbs`,
    });
    this.data = data;
    this.postures = getPostures();

    this.promiseFuncs = promiseFuncs;
  }
  getData(): {
    posture: ChooserData<['name']>;
    data: PostureData;
  } {
    const postures = getPostures().map((posture: Posture) => posture.tname);

    const postureData = postures.map((name: string) => ({
      name,
    }));
    return {
      posture: {
        items: postureData,
        headers: ['name'],
        id: 'postures',
      },
      data: this.data,
    };
  }
  activateListeners(html: JQuery): void {
    activateChooser(html, 'postures', (index) => this.changePosture(index));
    $('#closeAndReturn', html).click(() => {
      const token = this.token;
      ensureDefined(game.user, 'game not initialized');
      new ManeuverChooser(token).render(true);
      this.closeForEveryone();
    });
  }

  async changePosture(index: number): Promise<void> {
    ensureDefined(this.actor, 'you dont have actor');
    const posture = this.postures[index];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.actor.replacePosture(posture.name);
    this.closeForEveryone();
  }

  static request(token: Token, data?: PostureData): Promise<void> {
    const promise = new Promise<void>((resolve, reject) => {
      new PostureChooser(token, data, { resolve, reject }).render(true);
    });
    return promise;
  }
}
