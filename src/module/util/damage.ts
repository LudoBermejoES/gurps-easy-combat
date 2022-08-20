import { hasHighPainThreshold, hasLowPainThreshold } from './advantagesDataExtractor';
import { MODULE_NAME } from './constants';
import { Modifier } from '../types';
import { applyModifiers } from './actions';

interface Effect {
  type: 'shock' | 'clipping' | 'majorwound';
  amount: number;
  detail: string;
  reduceInjury: boolean;
  modifier: number;
}
export interface ShockPenalty {
  modifier: number;
  round: number;
}

function addShockModifiers(value: number, actor: Actor, token: TokenDocument) {
  if (hasHighPainThreshold(actor)) return;
  const total = -Math.min(hasLowPainThreshold(actor) ? value * 2 : value, 4);
  const shockPenalties = <ShockPenalty[] | undefined>token.getFlag(MODULE_NAME, 'shockPenalties');
  const roundToAffect: number = (game?.combat?.round || 0) + 1;
  const alreadyExist: ShockPenalty[] = (shockPenalties || []).filter((s) => s.round === roundToAffect);
  let newModifier: ShockPenalty;
  if (alreadyExist.length && alreadyExist[0].modifier < value) {
    newModifier = { ...alreadyExist[0], modifier: total };
  } else {
    newModifier = {
      modifier: total,
      round: roundToAffect,
    };
  }
  token.setFlag(MODULE_NAME, 'shockPenalties', [
    ...(shockPenalties || []).filter((s) => s.round !== roundToAffect),
    newModifier,
  ]);
}

export function getModifiersByPainThresHold(actor: Actor): Modifier[] {
  const modifiers: Modifier[] = [];
  if (hasHighPainThreshold(actor)) {
    modifiers.push({
      mod: +3,
      desc: 'Por Alto umbral del dolor',
    });
  }
  if (hasLowPainThreshold(actor)) {
    modifiers.push({
      mod: -3,
      desc: 'Por Bajo umbral del dolor',
    });
  }
  return modifiers;
}

async function rollMajorWound(modifier: number, actor: Actor, token: TokenDocument) {
  const modifiers: Modifier[] = [
    {
      mod: modifier,
      desc: 'Por daño',
    },
  ];
  applyModifiers([...modifiers, ...getModifiersByPainThresHold(actor)]);
  const result = await GURPS.executeOTF('["HT"HT]', false, null, actor);
  if (!result) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await actor.replacePosture('prone');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await actor.toggleEffectByName('stun', true);
  }
}

async function _renderTemplate(template: string, data: any) {
  return renderTemplate('systems/gurps/templates/apply-damage/' + template, data);
}

export async function applyModifiersByDamage(tokenD: TokenDocument, changes: any) {
  if (!game.combat?.started) return;
  if (!tokenD.actor) return;

  if (changes?.actorData?.data?.HP?.value && changes?.actorData?.oldHpVal) {
    const effects: Effect[] = GURPS.calculatorDamage.effects;
    for (const effect of effects) {
      if (!tokenD.actor) continue;
      if (effect.type === 'shock') {
        addShockModifiers(effect.amount, tokenD.actor, tokenD);
      } else if (effect.type === 'majorwound') {
        rollMajorWound(effect.modifier, tokenD.actor, tokenD);
      } else if (effect.type === 'clipping') {
        const message = await _renderTemplate('chat-crippling.html', {
          name: tokenD.actor.data.name,
          location: effect.detail,
          groundModifier: 'DX-1',
          swimFlyModifer: 'DX-2',
          pdfref: game.i18n.localize('GURPS.pdfCrippling'),
          classStart: '<span class="pdflink">',
          classEnd: '</span>',
        });

        const msgData = {
          content: message,
          user: game?.user?.id,
          type: CONST.CHAT_MESSAGE_TYPES.OOC,
        };
        ChatMessage.create(msgData);
      }
    }
  }
}
