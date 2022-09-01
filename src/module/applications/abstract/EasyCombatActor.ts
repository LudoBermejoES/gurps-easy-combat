import EasyCombatAttacksExtractor from './mixins/EasyCombatAttacksExtractor';
import EasyCombatDefenseExtractor from './mixins/EasyCombatDefenseExtractor';

import { applyMixins } from '../../gurps-easy-combat';

interface EasyCombatActor extends Actor, EasyCombatAttacksExtractor, EasyCombatDefenseExtractor {}

class EasyCombatActor {}

applyMixins(EasyCombatActor, [Actor, EasyCombatAttacksExtractor, EasyCombatDefenseExtractor]);

export default EasyCombatActor;
