import { applyMixinsOnObject, applyMixins } from '../libs/mixins';

import EasyCombatAttacksExtractor from './mixins/EasyCombatAttacksExtractor';
import EasyCombatDefenseExtractor from './mixins/EasyCombatDefenseExtractor';

function easyCombatActorfromActor(actor: any, token: Token | undefined = undefined): EasyCombatActor {
  if (token) {
    actor.tokenSelected = token;
    actor.tokenDocumentSelected = token.document;
  }
  if (actor.getAttacks) return actor;
  applyMixinsOnObject(actor, [EasyCombatActor]);
  return actor;
}

function easyCombatActorfromToken(token: Token): EasyCombatActor | undefined {
  if (token.actor) {
    return easyCombatActorfromActor(token.actor, token);
  }
  return new EasyCombatActor();
}

class EasyCombatActor {
  tokenSelected: Token | undefined;
  tokenDocumentSelected: TokenDocument | undefined;
}
interface EasyCombatActor extends Actor, EasyCombatAttacksExtractor, EasyCombatDefenseExtractor {}
applyMixins(EasyCombatActor, [Actor, EasyCombatAttacksExtractor, EasyCombatDefenseExtractor]);

export default EasyCombatActor;
export { easyCombatActorfromActor, easyCombatActorfromToken };
