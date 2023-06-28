import { applyMixinsOnObject, applyMixins } from '../libs/mixins';
import EasyCombatAttacksExtractor from './mixins/EasyCombatAttacksExtractor';
import EasyCombatDefenseExtractor from './mixins/EasyCombatDefenseExtractor';
function easyCombatActorfromActor(actor, token = undefined) {
  if (token) {
    actor.tokenSelected = token;
    actor.tokenDocumentSelected = token.document;
  }
  if (actor.getAttacks) return actor;
  applyMixinsOnObject(actor, [EasyCombatActor]);
  return actor;
}
function easyCombatActorfromToken(token) {
  if (token.actor) {
    return easyCombatActorfromActor(token.actor, token);
  }
}
class EasyCombatActor extends Actor {}
applyMixins(EasyCombatActor, [Actor, EasyCombatAttacksExtractor, EasyCombatDefenseExtractor]);
export default EasyCombatActor;
export { easyCombatActorfromActor, easyCombatActorfromToken };
//# sourceMappingURL=EasyCombatActor.js.map
