import { getModifiersByPainThresHold } from '../libs/damage';
import { applyModifiers } from '../libs/actions';

export type BeforeManeuversKey = keyof typeof beforeManeuvers;

function recoverFromStun(actor: Actor) {
  return new Promise((resolve, reject) => {
    const d: Dialog = new Dialog({
      title: '¡Estás aturdido!',
      content: '<p>Solo podrás recuperarte con una tirada de Vigor</p>',
      buttons: {
        yes: {
          label: 'Lanzar ahora',
          callback: async () => {
            applyModifiers([...getModifiersByPainThresHold(actor)]);
            const result = await GURPS.executeOTF('["HT"HT]', false, null, actor);
            if (!result) {
              ChatMessage.create({
                content: `${actor.name} no puede hacer nada porque ha fallado la tirada de recuperación de Aturdido`,
              });
            } else {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              await actor.toggleEffectByName('stun', false);
            }
            resolve(result);
          },
        },
      },
      default: 'right',
    });
    d.render(true);
  });
}

export const beforeManeuvers = {
  recoverFromStun: recoverFromStun,
};
