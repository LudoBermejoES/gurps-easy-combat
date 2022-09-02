interface GurpsActorInterface {
  readonly _additionalResources: {
    bodyplan: string;
    tracker: Record<string, RecourceTracker>;
    importname: string;
    importversion: string;
    importpath: string;
  };
  readonly displayname: never;
  readonly damageAccumulators: never;
  readonly hitLocationsWithDR: never[];
  readonly _hitLocationRolls: never;
  readonly defaultHitLocation: unknown;

  /** @override */
  getRollData(): never;

  /**
   * @returns {GurpsActor}
   */
  asGurpsActor(): never;

  /**
   * @returns {GurpsActorData}
   */
  getGurpsActorData(): never;

  getOwners(): never;

  /**
   * @param {Application} newSheet
   */
  openSheet(newSheet: never): Promise<void>;

  prepareData(): void;

  prepareBaseData(): void;

  prepareEmbeddedEntities(): void;

  prepareDerivedData(): void;

  postImport(): Promise<void>;

  syncLanguages(): Promise<void>;

  calculateDerivedValues(): void;

  _initializeStartingValues(): void;

  _applyItemBonuses(): void;

  /**
   * @param {string} key
   * @param {never} id
   * @returns {string | undefined}
   */
  _findEqtkeyForId(key: string, id: never): never;

  /**
   * @param {{ [key: string]: never }} dict
   * @param {string} type
   * @returns {number}
   */
  _sumeqt(dict: string, type: string, checkEquipped: never): number;

  _calculateWeights(): void;

  _calculateEncumbranceIssues(): void;

  _isEnhancedMove(): boolean;

  _getEnhancedMove(): never;

  _getSprintMove(): number;

  _getCurrentMoveMode(): never;

  /**
   * @param {number} move
   * @param {number} threshold
   * @returns {number}
   */
  _getCurrentMove(move: number, threshold: number): never;

  _getMoveAdjustedForManeuver(move: number, threshold: number): never;

  _adjustMove(
    move: number,
    threshold: number,
    value: number,
    reason: string,
  ):
    | { move: number; text: never }
    | { move: number; text: never }
    | { move: number; text: never }
    | { move: number; text: never }
    | { move: number; text: never }
    | { move: number; text: never };

  _getMoveAdjustedForPosture(move: number, threshold: number): never;

  _calculateRangedRanges(): void;

  _recalcItemFeatures(): void;

  /**
   * @param {Object} list
   */
  _collapseQuantumEq(list: never, isMelee: boolean): void;

  _getStep(): number;

  /**
   * For every application associated to this actor, refresh it to reflect never updates.
   */
  _renderAllApps(): void;

  /**
   * Update this Document using incremental data, saving it to the database.
   * @see {@link Document.updateDocuments}
   * @param {never} data - Differential update data which modifies the existing values of this document data
   *                     (default: `Record<string, never>`)
   * @param {never} [context] - Additional context which customizes the update workflow (default: `Record<string, never>`)
   * @returns {Promise<this | undefined>} The updated Document instance
   * @remarks If no document has actually been updated, the returned {@link Promise} resolves to `undefined`.
   */
  update(data: never, context: never): Promise<never>;

  sendChatMessage(msg: string): void;

  internalUpdate(data: never, context: never): Promise<void>;

  /**
   * This method is called when "data.conditions.maneuver" changes on the actor (via the update method)
   * @param {string} maneuverText
   */
  replaceManeuver(maneuverText: string): Promise<void>;

  replacePosture(changeData: never): Promise<void>;

  /**
   * @returns {GurpsToken[]}
   */
  _findTokens(): never[] | TokenDocument[];

  /**
   * @param {{ id: unknown; }} effect
   */
  isEffectActive(effect: never): boolean;

  /**
   *
   * @param {Object} action
   * @param {string} action.orig - the original OTF string
   * @param {string} action.costs - "*(per|cost) ${number} ${resource}" -- resource can be '@resource' to prompt user
   * @param {string} action.formula - the basic die formula, such as '2d', '1d-2', '3d-1x2', etc.
   * @param {string} action.damagetype - one of the recognized damage types (cr, cut, imp, etc)
   * @param {string} action.extdamagetype - optional extra damage type, such as 'ex'
   * @param {string} action.hitlocation - optional hit location
   * @param {boolean} action.accumulate
   */
  accumulateDamageRoll(action: never): Promise<void>;

  incrementDamageAccumulator(index: never): Promise<void>;

  decrementDamageAccumulator(index: never): Promise<void>;

  clearDamageAccumulator(index: never): Promise<void>;

  applyDamageAccumulator(index: never): Promise<void>;

  importCharacter(): Promise<void>;

  _openImportDialog(): Promise<void>;

  _openNonLocallyHostedImportDialog(): Promise<void>;

  _openLocallyHostedImportDialog(): Promise<void>;

  /**
   *
   * @param atts
   * @param eqp
   * @param calc
   */
  importAttributesFromGCSv2(
    atts: never,
    eqp: never,
    calc: never,
  ): Promise<{
    'data.liftingmoving': Record<string, never>;
    'data.thrust': never;
    'data.basicspeed': { value: string; points: number };
    'data.touch': never;
    'data.encumbrance': Record<string, never>;
    'data.frightcheck': never;
    'data.QP': never;
    'data.attributes': never;
    'data.HP': { value: number; min: number; max: number; points: number };
    'data.FP': { value: number; min: number; max: number; points: number };
    'data.tastesmell': never;
    'data.currentdodge': number;
    'data.AR': never;
    'data.basiclift': never;
    'data.swing': never;
    'data.hearing': never;
    'data.currentmove': number;
    'data.-=encumbrance': null;
    'data.vision': never;
    'data.basicmove': { value: string; points: number };
  }>;

  calcTotalCarried(eqp: never): number;

  // eslint-disable-next-line @typescript-eslint/ban-types
  importTraitsFromGCSv2(
    p: never,
    cd: never,
    md: never,
  ): Promise<{ 'data.traits': Record<string, never>; 'data.-=traits': null }>;

  getPortraitPath(): string;

  signedNum(x: never): never;

  importSizeFromGCSv1(
    commit: never,
    profile: never,
    ads: never,
    skills: never,
    equipment: never,
  ): { 'data.traits': never; 'data.-=traits': null };

  importAdsFromGCSv3(ads: never): { 'data.-=ads': null; 'data.ads': Record<string, never> };

  importAd(i: never, p: never): never[];

  importSkillsFromGCSv2(sks: never): { 'data.-=skills': null; 'data.skills': Record<string, never> };

  importSk(i: never, p: never): never[];

  importSpellsFromGCSv2(sps: never): { 'data.-=spells': null; 'data.spells': Record<string, never> };

  importSp(i: never, p: never): never[];

  importEquipmentFromGCSv2(
    eq: never,
    oeq: never,
  ): { 'data.-=equipment': null; 'data.equipment': { carried: Record<string, never>; other: Record<string, never> } };

  importEq(i: never, p: never, carried: never): never[];

  importNotesFromGCSv2(notes: never): { 'data.-=notes': null; 'data.notes': Record<string, never> };

  importNote(i: never, p: never): never[];

  importProtectionFromGCSv2(
    hls: never,
    // eslint-disable-next-line @typescript-eslint/ban-types
  ): Promise<
    | Record<string, never>
    | {
        'data.-=hitlocations': null;
        'data.hitlocations': Record<string, never>;
        'data.additionalresources.bodyplan': never;
      }
  >;

  importPointTotalsFromGCSv2(
    total: never,
    atts: never,
    ads: never,
    skills: never,
    spells: never,
  ): {
    'data.totalpoints.unspent': never;
    'data.totalpoints.skills': number;
    'data.totalpoints.disads': number;
    'data.totalpoints.race': number;
    'data.totalpoints.spells': number;
    'data.totalpoints.attributes': number;
    'data.totalpoints.quirks': number;
    'data.totalpoints.ads': number;
    'data.totalpoints.total': never;
  };

  importReactionsFromGCSv3(
    ads: never,
    skills: never,
    equipment: never,
  ): {
    'data.-=conditionalmods': null;
    'data.-=reactions': null;
    'data.reactions': Record<string, never>;
    'data.conditionalmods': Record<string, never>;
  };

  importCombatFromGCSv2(
    ads: never,
    skills: never,
    spells: never,
    equipment: never,
  ): {
    'data.melee': Record<string, never>;
    'data.ranged': Record<string, never>;
    'data.-=melee': null;
    'data.-=ranged': null;
  };

  recursiveGet(i: never): never[];

  adPointCount(i: never, ads: never, disads: never, quirks: never, race: never, toplevel: never): never[];

  skPointCount(i: never, skills: never): never;

  /**
   * @param {string} json
   * @param {string} importname
   * @param {string | undefined} [importpath]
   */
  importFromGCSv2(
    json: never,
    importname: never,
    importpath: never,
    suppressMessage: never,
    GCAVersion: never,
    GCSVersion: never,
  ): Promise<boolean>;

  /**
   * @param {string} xml
   * @param {string} importname
   * @param {string | undefined} [importpath]
   */
  importFromGCSv1(xml: never, importname: never, importpath: never, suppressMessage: never): Promise<never>;

  /**
   * @param {{ [key: string]: never }} o
   */
  textFrom(o: never): never;

  /**
   * @param {{ [key: string]: never }} o
   */
  intFrom(o: never): number;

  /**
   * @param {{[key: string] : never}} o
   */
  floatFrom(o: never): never;

  /**
   * @param {string} list
   * @param {string|boolean} uuid
   */
  _findElementIn(list: never, uuid: never, name: never, mode: never): never;

  /**
   * @param {{ [key: string]: never }} json
   */
  importReactionsFromGCSv2(json: never): { 'data.-=reactions': null; 'data.reactions': Record<string, never> };

  importConditionalModifiersFromGCSv2(json: never): {
    'data.-=conditionalmods': null;
    'data.conditionalmods': Record<string, never>;
  };

  /**
   * @param {{ [key: string]: never }} json
   */
  importReactionsFromGCA(
    json: never,
    vernum: never,
  ): { 'data.-=reactions': null; 'data.reactions': Record<string, never> };

  importLangFromGCA(json: never): { 'data.-=languages': null; 'data.languages': Record<string, never> };

  /**
   * @param {{ attributes: Record<string, never>; ads: Record<string, never>; disads: Record<string, never>; quirks: Record<string, never>; skills: Record<string, never>; spells: Record<string, never>; unspentpoints: Record<string, never>; totalpoints: Record<string, never>; race: Record<string, never>; }} json
   */
  importPointTotalsFromGCSv1(json: never): {
    'data.totalpoints.unspent': never;
    'data.totalpoints.skills': never;
    'data.totalpoints.disads': never;
    'data.totalpoints.race': never;
    'data.totalpoints.spells': never;
    'data.totalpoints.attributes': never;
    'data.totalpoints.quirks': never;
    'data.totalpoints.ads': never;
    'data.totalpoints.total': never;
  };

  /**
   * @param {{ [key: string]: never }} descjson
   * @param {{ [key: string]: never }} json
   */
  importNotesFromGCSv1(descjson: never, json: never): { 'data.-=notes': null; 'data.notes': Record<string, never> };

  /**
   * @param {{ [x: string]: never; bodyplan: Record<string, never>; }} json
   * @param {boolean} isFoundryGCA
   */
  importProtectionFromGCSv1(
    json: never,
    isFoundryGCA: never,
  ): Promise<
    | Record<string, never>
    | {
        'data.-=hitlocations': null;
        'data.hitlocations': Record<string, never>;
        'data.additionalresources.bodyplan': never;
      }
  >;

  /**
   *
   * @param {Array<HitLocations.HitLocation>} locations
   */
  _getBodyPlan(locations: never): never;

  /**
   * @param {{ [key: string]: never }} json
   * @param {boolean} isFoundryGCS
   */
  importEquipmentFromGCSv1(
    json: never,
    isFoundryGCS: never,
  ): { 'data.-=equipment': null; 'data.equipment': { carried: Record<string, never>; other: Record<string, never> } };

  /**
   * @param {never[]} flat
   */
  foldList(flat: never, target: never): Record<string, never>;

  /**
   * @param {{ [x: string]: Record<string, never>; }} json
   */
  importEncumbranceFromGCSv1(json: never): {
    'data.currentdodge': number;
    // eslint-disable-next-line @typescript-eslint/ban-types
    'data.encumbrance': Record<string, never>;
    'data.currentmove': number;
    'data.-=encumbrance': null;
  };

  /**
   * Copy old OTFs to the new object, and update the displayable notes
   * @param {Skill|Spell|Ranged|Melee} oldobj
   * @param {Skill|Spell|Ranged|Melee} newobj
   */
  _migrateOtfsAndNotes(oldobj: never, newobj: never, importvttnotes: never): void;

  /**
   *  Search for specific format OTF in the notes (and vttnotes).
   *  If we find it in the notes, remove it and replace the notes with the shorter version
   */
  _updateOtf(otfkey: never, oldobj: never, newobj: never): void;

  _removeOtf(key: never, text: never): (never | null)[] | never[];

  /**
   * @param {{ [key: string]: never }} json
   * @param {boolean} isFoundryGCS
   */
  importCombatMeleeFromGCSv1(
    json: never,
    isFoundryGCS: never,
  ): { 'data.melee': Record<string, never>; 'data.-=melee': null };

  /**
   * @param {{ [key: string]: never }} json
   * @param {boolean} isFoundryGCS
   */
  importCombatRangedFromGCSv1(
    json: never,
    isFoundryGCS: never,
  ): { 'data.ranged': Record<string, never>; 'data.-=ranged': null };

  /**
   * @param {{ race: Record<string, never>; height: Record<string, never>; weight: Record<string, never>; age: Record<string, never>; title: Record<string, never>; player: Record<string, never>; createdon: Record<string, never>; modifiedon: Record<string, never>; religion: Record<string, never>; birthday: Record<string, never>; hand: Record<string, never>; sizemodifier: Record<string, never>; tl: Record<string, never>; appearance: Record<string, never>; }} json
   */
  importTraitsfromGCSv1(json: never): { 'data.traits': Record<string, never>; 'data.-=traits': null };

  /**
   * @param {{ [key: string]: never }} json
   */
  importAttributesFromCGSv1(json: never): Promise<{
    'data.liftingmoving': Record<string, never>;
    'data.thrust': never;
    'data.basicspeed': { value: string; points: number };
    'data.touch': never;
    'data.frightcheck': never;
    'data.attributes': never;
    'data.HP': { value: number; min: number; max: number; points: number };
    'data.FP': { value: number; min: number; max: number; points: number };
    'data.tastesmell': never;
    'data.basiclift': never;
    'data.swing': never;
    'data.hearing': never;
    'data.currentmove': never;
    'data.vision': never;
    'data.basicmove': { value: string; points: number };
  }>;

  /**
   * @param {{ [key: string]: never }} json
   * @param {boolean} isFoundryGCS
   */
  importSkillsFromGCSv1(json: never, isFoundryGCS: never): { 'data.-=skills': null; 'data.skills': never };

  /**
   * @param {{ [key: string]: never }} json
   * @param {boolean} isFoundryGCS
   */
  importSpellsFromGCSv1(json: never, isFoundryGCS: never): { 'data.-=spells': null; 'data.spells': never };

  /**
   * @param {{ [key: string]: never }} adsjson
   * @param {{ [key: string]: never }} disadsjson
   */
  importAdsFromGCA(adsjson: never, disadsjson: never): { 'data.-=ads': null; 'data.ads': never };

  /**
   * @param {Advantage[]} datalist
   * @param {{ [key: string]: never }} json
   */
  importBaseAdvantages(datalist: never, json: never): void;

  /**
   * @param {{ [key: string]: never }} json
   */
  importAdsFromGCSv2(json: never): { 'data.-=ads': null; 'data.ads': never };

  /**
   * Adds never assigned resource trackers to the actor data and sheet.
   */
  setResourceTrackers(): Promise<void>;

  /**
   * Update this tracker slot with the contents of the template.
   * @param {String} path JSON data path to the tracker; must start with 'additionalresources.tracker.'
   * @param {*} template to apply
   */
  applyTrackerTemplate(path: never, template: never): Promise<void>;

  /**
   * Overwrites the tracker pointed to by the path with default/blank values.
   * @param {String} path JSON data path to the tracker; must start with 'additionalresources.tracker.'
   */
  clearTracker(path: never): Promise<void>;

  /**
   * Removes the indicated tracker from the object, reindexing the keys.
   * @param {String} path JSON data path to the tracker; must start with 'additionalresources.tracker.'
   */
  removeTracker(path: never): Promise<void>;

  addTracker(): Promise<void>;

  setMoveDefault(value: never): Promise<void>;

  /**
   * @param {never[]} damageData
   */
  handleDamageDrop(damageData: never): void;

  /**
   * @param {{ type: never; x?: number; y?: number; payload?: never; pack?: never; id?: never; data?: never; }} dragData
   */
  handleItemDrop(dragData: never): Promise<void>;

  _forceRender(): void;

  /**
   * @param {{ type?: string; x?: number; y?: number; payload?: never; actorid?: never; itemid?: never; isLinked?: never; key?: never; itemData?: never; }} dragData
   */
  handleEquipmentDrop(dragData: never): Promise<boolean>;

  /**
   * @param {Item} item
   */
  updateItem(item: never): Promise<void>;

  /**
   * @param {ItemData} itemData
   * @param {string | null} [targetkey]
   */
  addNewItemData(itemData: never, targetkey: never): Promise<void>;

  /**
   * @param {ItemData} itemData
   * @param {string | null} [targetkey]
   */
  addItemData(itemData: never, targetkey: never): Promise<void>;

  /**
   * @param {ItemData} itemData
   * @param {string | null} targetkey
   */
  _addNewItemEquipment(itemData: never, targetkey: never): Promise<never[] | never[] | (string | boolean)[]>;

  /**
   * @param {GurpsItemData} itemData
   * @param {string} eqtkey
   */
  _addItemAdditions(itemData: never, eqtkey: never): Promise<void>;

  /**
   * @param {Equipment} eqt
   * @param {string} targetPath
   */
  updateItemAdditionsBasedOn(eqt: never, targetPath: never): Promise<void>;

  /**
   * @param {Equipment} eqt
   * @param {string} eqtkey
   * @param {boolean} carried
   */
  _updateEqtStatus(eqt: never, eqtkey: never, carried: never): Promise<void>;

  /**
   * @param {ItemData} itemData
   * @param {string} eqtkey
   * @param {string} key
   */
  _addItemElement(itemData: never, eqtkey: never, key: never): Promise<Record<string, never>>;

  /**
   * @param {string} path
   */
  deleteEquipment(path: never, depth: never): Promise<never>;

  /**
   * @param {string} itemid
   */
  _removeItemAdditions(itemid: never): Promise<void>;

  /**
   * @param {string} itemid
   * @param {string} key
   */
  _removeItemElement(itemid: never, key: never): Promise<boolean>;

  /**
   * @param {string} srckey
   * @param {string} targetkey
   * @param {boolean} shiftkey
   */
  moveEquipment(srckey: never, targetkey: never, shiftkey: never): Promise<never>;

  /**
   * @param {string} path
   */
  toggleExpand(path: never, expandOnly: never): Promise<void>;

  /**
   * @param {string} srckey
   * @param {string} targetkey
   */
  _splitEquipment(srckey: never, targetkey: never): Promise<boolean>;

  /**
   * @param {string} srckey
   * @param {string} targetkey
   */
  _checkForMerging(srckey: never, targetkey: never): Promise<boolean>;

  getCurrentDodge(): never;

  getCurrentMove(): never;

  getTorsoDr(): number | HitLocation | { dr: number };

  /**
   * @param {string} key
   */
  getEquipped(key: never): (string | number)[];

  getEquippedParry(): never;

  getEquippedBlock(): never;

  /**
   *
   * @param {string} name of the status effect
   * @param {boolean} active (desired) state - true or false
   */
  toggleEffectByName(name: never, active: never): void;

  /**
   * @param {string} pattern
   */
  findEquipmentByName(pattern: never, otherFirst: never): never[];

  /**
   * @param {number} currentWeight
   */
  checkEncumbance(currentWeight: never): void;

  /**
   * @param {string} eqtkey
   * @param {number} count
   */
  updateEqtCount(eqtkey: never, count: never): Promise<void>;

  /**
   * @param {string} srckey
   */
  updateParentOf(srckey: never, updatePuuid: never): Promise<void>;

  isEmptyActor(): boolean;
}

interface EncumbranceLevel {
  key: string;
  level: number;
  dodge: number;
  weight: number;
  move: number;
  currentdodge: number;
  currentflight: number;
  currentmove: number;
  currentmovedisplay: number;
}
interface RecourceTracker {
  name: string;
  value: number;
  min: number;
  max: number;
  points: number;
}
interface HitLocation {
  import: string;
  dr: string;
  equipment: string;
  penalty: string;
  roll: string;
  where: string;
}
interface Attribute {
  dr: number;
  import: number;
  value: number;
  points: number;
  dtype: 'Number';
}
interface BaseSkill {
  name: string;
  notes: string;
  pageref: string;
  contains: Record<string, never>;
  points: number;
  import: string;
  uuid: string;
  level: number;
}
interface Skill extends BaseSkill {
  type: string;
  relativelevel: string;
  parentuuid: string;
}
interface Spell extends BaseSkill {
  class: string;
  college: string;
  cost: string;
  maintain: string;
  duration: string;
  resist: string;
  casttime: string;
  difficulty: string;
  parentuuid: string;
}

export interface ReadyManeouverNeeded {
  itemId: string;
  remainingRounds: number;
  remainingShots: number;
}

export interface Attack {
  name: string;
  alternateName: string;
  contains: Record<string, never>;
  notes: string;
  otf: string;
  pageref: string;
  itemid: string;
  import: string;
  damage: string;
  st: string;
  mode: string;
  level: number;
}
export interface MeleeAttack extends Attack {
  weight: string;
  techlevel: string;
  cost: string;
  reach: string;
  parry: string;
  block: string;
  notes: string;
  otf: string;
}
export interface RangedAttack extends Attack {
  acc: string;
  ammo: string;
  bulk: string;
  legalityclass: string;
  range: string;
  rcl: string;
  rof: string;
  shots: string;
  otf: string;
}
interface Advantage {
  name: string;
  notes: string;
  pageref: string;
  contains: Record<string, Advantage>;
  points: number;
  userdesc: string;
  note: string;
  uuid: string;
  parentuuid: string;
}
interface Reaction {
  modifier: string;
  situation: string;
}
interface Note {
  notes: string;
  pageref: string;
  contains: Record<string, never>;
  uuid: string;
  parentuuid: string;
}
interface Item {
  itemid: string;
  name: string;
  alternateName: string;
  notes: string;
  pageref: string;
  contains: Record<string, Item>;
  equipped: boolean;
  carried: boolean;
  count: number;
  cost: number;
  weight: number;
  location: string;
  techlevel: string;
  legalityclass: string;
  categories: string;
  costsum: number;
  weightsum: number;
  uses: string;
  maxuses: string;
  ignoreImportQty: boolean;
  uuid: string;
  parentuuid: string;
  collapsed: Record<string, never>;
}
// the way Actor.data.data looks
interface ActorDataPropertiesData {
  attributes: {
    ST: Attribute;
    DX: Attribute;
    IQ: Attribute;
    HT: Attribute;
    WILL: Attribute;
    PER: Attribute;
  };
  HP: {
    value: number;
    min: number;
    max: number;
    points: number;
  };
  FP: {
    value: number;
    min: number;
    max: number;
    points: number;
  };
  dodge: {
    value: number;
    enc_level: number;
  };
  basicmove: {
    value: string;
    points: number;
  };
  basicspeed: {
    value: string;
    points: number;
  };
  parry: number;
  currentmove: number;
  thrust: string;
  swing: string;
  frightcheck: number;
  hearing: number;
  tastesmell: number;
  vision: number;
  touch: number;
  languages: Record<string, never>;
  money: Record<string, never>;
  totalpoints: {
    attributes: number;
    ads: number;
    disads: number;
    quirks: number;
    skills: number;
    spells: number;
    total: number;
    unspent: number;
    race: number;
  };
  liftingmoving: {
    basiclift: string;
    carryonback: string;
    onehandedlift: string;
    runningshove: string;
    shiftslightly: string;
    shove: string;
    twohandedelift: string;
    twohandedlift: string;
  };
  additionalresources: {
    bodyplan: string;
    tracker: Record<string, RecourceTracker>;
    importname: string;
    importversion: string;
    importpath: string;
  };
  conditions: {
    maneuver: string;
  };
  conditionalinjury: {
    RT: {
      value: number;
      points: number;
    };
    injury: {
      severity: string;
      daystoheal: number;
    };
  };
  migrationversion: string;
  lastImport: string;
  currentdodge: number;
  skills: Record<string, Skill>;
  traits: {
    race: string;
    height: string;
    weight: string;
    age: string;
    title: string;
    player: string;
    createdon: string;
    modifiedon: string;
    religion: string;
    birthday: string;
    hand: string;
    sizemod: string;
    techlevel: string;
    appearance: string;
    gender: string;
    eyes: string;
    hair: string;
    skin: string;
  };
  melee: Record<string, MeleeAttack>;
  ranged: Record<string, RangedAttack>;
  spells: Record<string, Spell>;
  ads: Record<string, Advantage>;
  reactions: Record<string, Reaction>;
  encumbrance: Record<string, EncumbranceLevel>;
  notes: Record<string, Note>;
  equipment: {
    carried: Record<string, Item>;
    other: Record<string, Item>;
  };
  hitlocations: Record<string, HitLocation>;
  currentflight: number;
  equippedparry: number;
  equippedblock: number;
  eqtsummary: {
    eqtcost: number;
    eqtlbs: number;
    othercost: number;
  };
}
export interface GurpsRoll {
  chatthing: string;
  failure: boolean;
  finaltarget: number;
  isCritFailure: boolean;
  isCritSuccess: boolean;
  isDraggable: boolean;
  loaded: boolean;
  margin: number;
  modifier: number;
  optlabel: string;
  origtarget: number;
  otf: string;
  prefix: string;
  rolls: string;
  rtotal: number;
  seventeen: boolean;
  rofrcl: number;
  targetmods: {
    desc: string;
    mod: string;
    modint: number;
    plus: boolean;
  }[];
  thing: string;
}

//#region registering
interface ActorDataProperties {
  type: 'character';
  data: ActorDataPropertiesData;
}
export interface Modifier {
  mod: number;
  desc: string;
}
interface ModifierBucket {
  addModifier(mod: number, reason: string): void;
}
declare global {
  interface Actor {
    replaceManeuver: (maneuver?: string) => Promise<void>;
  }
  interface Token {
    setManeuver: (maneuver?: string) => Promise<void>;
  }
  interface DataConfig {
    Actor: ActorDataProperties;
  }
  const GURPS: {
    LastActor: Actor;
    rangeObject: any;
    SetLastActor(actor: Actor): void;
    gurpslink(otf: string): string;
    executeOTF(otf: string, priv: boolean | false, event: Event | null, actor: Actor | undefined): boolean;
    performAction(
      data: {
        type: string;
        orig: string;
        isSpellOnly: boolean;
        isSkillOnly: boolean;
        name: string;
        spantext: string;
      },
      actor: Actor,
    ): Promise<boolean>;
    performAction(
      data: {
        type: 'damage' | 'deriveddamage';
        derivedformula: string;
        formula: string;
        damagetype: string;
        extdamagetype: string;
        hitlocation?: string;
        accumulate?: boolean;
      },
      actor: Actor,
    ): Promise<boolean>;
    performAction(
      data: {
        type: 'attack';
        isMelee: boolean;
        isRanged: boolean;
        name: string;
      },
      actor: Actor,
    ): Promise<boolean>;
    performAction(
      data: {
        orig: 'Dodge';
        path: 'currentdodge';
        type: 'attribute';
      },
      actor: Actor,
    ): Promise<boolean>;
    performAction(
      data: {
        isMelee: true;
        name: string;
        type: 'weapon-block';
      },
      actor: Actor,
    ): Promise<boolean>;
    performAction(
      data: {
        isMelee: true;
        name: string;
        type: 'weapon-parry';
      },
      actor: Actor,
    ): Promise<boolean>;
    lastTargetedRoll: GurpsRoll;
    ModifierBucket: ModifierBucket;
    calculatorDamage: any;
  };
}
//#endregion
type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
  ? ElementType
  : never;
interface ChooserData<T extends string[]> {
  items: Record<ArrayElement<T>, string | number>[];
  headers: T;
  id: string;
}

interface PromiseFunctions<T> {
  resolve(value: T | PromiseLike<T>): void;
  reject(reason: string): void;
}

interface Posture {
  name: string;
  tname: string;
}
