import weaponIcons from './weaponIcons';
import { Item } from '../../types';
import EasyCombatActor, { easyCombatActorfromActor } from '../abstract/EasyCombatActor';

const COUNTER_AMMO = 'moulinette/images/custom/Ludo/Counters/Ammo/counter_ammo_XX.png';

declare global {
  interface Window {
    CTA: any;
  }
}

export interface equippedItem {
  itemId: string;
  hand: string;
}

interface weapon {
  token: Token;
  textureData: any;
  actor: boolean;
  name: string;
  hand: string;
  r: any;
  id: string;
  toRemove: boolean;
  useArrows: boolean | undefined;
  useMagic: boolean | undefined;
  customManeuver: string | undefined;
  ignoreOffHand: boolean | undefined;
  costFatigue: number | undefined;
  useStones: boolean | undefined;
  useBolts: boolean | undefined;
  useBullets: boolean | undefined;
  sequencePreset: string;
}

const CTA = window.CTA;

async function addOrRemoveItem(
  token: Token,
  textureData: any,
  actor: boolean,
  name: string,
  hand: string,
  r: any,
  id: string,
  toRemove: boolean,
  number: number | undefined = undefined,
) {
  if (toRemove === undefined) {
    if (await window.CTA.hasAnim(token, name)) {
      CTA.removeAnimByName(token, name);
      return;
    }
    CTA.addAnimation(token, textureData, actor, name, r, id, hand, number);
  } else if (toRemove) {
    CTA.removeByItemId(token, id);
  } else {
    CTA.addAnimation(token, textureData, actor, name, r, id, hand, number);
  }
}

export async function refreshAmmo(token: Token, weapon: Item, number: number) {
  const name = `Ammo_${weapon.itemid}`;
  const equipment = await CTA.getEquippedItems(token);
  const item = equipment.find((i: any) => i.itemId === weapon.itemid);
  if (!item) return;
  await CTA.removeAnimByName(token, name);
  await addAmmo(token, weapon.itemid, item.hand, false, number);
  // await addAmmo(token, id, hand, false, number);
}

export async function removeItemById(token: string, id: string): Promise<void> {
  return CTA.removeByItemId(token, id);
}

function getPositionByHands(hand: string) {
  if (hand === 'ON') {
    return {
      xScale: 0,
      yScale: 0.5,
    };
  } else if (hand === 'OFF') {
    return {
      xScale: 1,
      yScale: 0.5,
    };
  } else if (hand === 'BOTH') {
    return {
      xScale: 1,
      yScale: 0.5,
    };
  }
}

function getCounterAmmoData(number: string, hand: string, id: string) {
  const defaultValues = defaultOptions(hand);
  if (defaultValues.xScale === 0) defaultValues.xScale -= 0.1;
  if (defaultValues.xScale === 1) defaultValues.xScale += 0.1;
  defaultValues.yScale = 1;

  return {
    scale: '0.2',
    name: `Ammo_${id}`,
    texturePath: COUNTER_AMMO.replace('XX', number),
    ...defaultValues,
  };
}

function addAmmo(token: Token, id: string, hand: string, toRemove: boolean, number: number | undefined = undefined) {
  if (number !== undefined) {
    addOrRemoveItem(
      token,
      getCounterAmmoData(String(number), hand, id),
      false,
      `Ammo_${id}`,
      hand,
      null,
      id,
      toRemove,
      number,
    );
  }
}

async function arrow(
  token: Token,
  id: string,
  hand: string,
  toRemove: boolean,
  number: number | undefined = undefined,
) {
  const textureData = {
    ...getWeapon('ARROW'),
    ...defaultOptions(hand),
  };
  addOrRemoveItem(token, textureData, false, `Arrow_${id}`, hand, null, id, toRemove, number);
  setTimeout(() => addAmmo(token, id, hand, toRemove, number), 1000);
}

async function magic(
  token: Token,
  id: string,
  hand: string,
  toRemove: boolean,
  number: number | undefined = undefined,
) {
  const textureData = {
    ...getWeapon('MAGIC'),
    ...defaultOptions(hand),
  };
  addOrRemoveItem(token, textureData, false, `Magic_${id}`, hand, null, id, toRemove, number);
  setTimeout(() => addAmmo(token, id, hand, toRemove, number), 1000);
}

async function stone(
  token: Token,
  id: string,
  hand: string,
  toRemove: boolean,
  number: number | undefined = undefined,
) {
  const textureData = {
    ...getWeapon('STONE'),
    ...defaultOptions(hand),
  };
  addOrRemoveItem(token, textureData, false, `Stone_${id}`, hand, null, id, toRemove, number);
  setTimeout(() => addAmmo(token, id, hand, toRemove, number), 1000);
}

async function bolt(token: Token, id: string, hand: string, toRemove: boolean, number: number | undefined = undefined) {
  const textureData = {
    ...getWeapon('BOLT'),
    ...defaultOptions(hand),
  };
  addOrRemoveItem(token, textureData, false, `Bolt_${id}`, hand, null, id, toRemove, number);
  setTimeout(() => addAmmo(token, id, hand, toRemove, number), 1000);
}

async function bullets(
  token: Token,
  id: string,
  hand: string,
  toRemove: boolean,
  number: number | undefined = undefined,
) {
  const textureData = {
    ...getWeapon('BULLETS'),
    ...defaultOptions(hand),
  };
  textureData.yScale = 1;
  addOrRemoveItem(token, textureData, false, `Bullets_${id}`, hand, null, id, toRemove, number);
  setTimeout(() => addAmmo(token, id, hand, toRemove, number), 1000);
}

function defaultOptions(hand: string) {
  return {
    multiple: 1,
    rotation: 'static',
    ...getPositionByHands(hand),
    belowToken: false,
    radius: 2,
    opacity: 1,
    tint: 16777215,
    equip: false,
    lock: true,
  };
}

export function clearEquipment(token: string | null) {
  CTA.removeAll(token, false);
}

export async function clearAmmunition(item: Item, token: Token) {
  const { name, itemid } = item;
  const nameToLook = name.toUpperCase();
  const weapon = getWeapon(nameToLook);
  if (weapon?.useArrows) {
    CTA.removeAnimByName(token.id, `Arrow_${itemid}`);
  }
  if (weapon?.useMagic) {
    CTA.removeAnimByName(token.id, `Magic_${itemid}`);
  }
  if (weapon?.useStones) {
    CTA.removeAnimByName(token.id, `Stone_${itemid}`);
  }
  if (weapon?.useBolts) {
    CTA.removeAnimByName(token.id, `Bolt_${itemid}`);
  }
  if (weapon?.useBullets) {
    CTA.removeAnimByName(token.id, `Bullets_${itemid}`);
  }

  if (nameToLook.includes('THROWING KNIFE')) {
    CTA.removeAnimByName(token.id, 'ThrowingKnife');
  } else if (nameToLook.includes('SHURIKEN')) {
    CTA.removeAnimByName(token.id, 'Shuriken');
  }

  //CTA.removeAnimByName(token.id, `Ammo_${itemid}`);
}

export async function addAmmunition(
  name: string,
  token: Token,
  id: string,
  hand: string,
  number: number | undefined = undefined,
) {
  const nameToLook = name.toUpperCase();
  const weapon = getWeapon(nameToLook);
  if (weapon?.useBullets) {
    bullets(token, id, hand, false, number);
  }
  if (weapon?.useArrows) {
    arrow(token, id, hand, false, number);
  }
  if (weapon?.useMagic) {
    magic(token, id, hand, false, number);
  }
  if (weapon?.useStones) {
    stone(token, id, hand, false, number);
  }
  if (weapon?.useBolts) {
    bolt(token, id, hand, false, number);
  }
}

export function getWeapon(nameToLook: string): weapon | undefined {
  let result: weapon | undefined = undefined;
  Object.keys(weaponIcons).some((key) => {
    if (nameToLook.toUpperCase().includes(key)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      result = weaponIcons[key];
      return result;
    }
  });
  return result;
}

export async function drawEquipment(
  name: string,
  token: Token,
  id: string,
  hand: string,
  toRemove: boolean,
  number: number | undefined = undefined,
) {
  if (!token?.actor) return;
  const actor: EasyCombatActor = easyCombatActorfromActor(token.actor);
  const ammo: { ammo: Item; st: string } | undefined = actor.getAmmunnitionFromInventory(id, 'data.equipment.carried');

  const nameToLook = name.toUpperCase();
  let weapon: weapon | undefined;
  const foundWeapon: weapon | undefined = getWeapon(nameToLook);
  if (foundWeapon) {
    weapon = {
      ...foundWeapon,
      ...defaultOptions(hand),
    };
  }

  if (weapon) {
    await addOrRemoveItem(token, weapon, false, weapon.name, hand, null, id, toRemove);
    if (weapon.useArrows) {
      setTimeout(() => arrow(token, id, hand, toRemove, ammo?.ammo?.count), 500);
    }
    if (weapon.useMagic) {
      setTimeout(() => magic(token, id, hand, toRemove, ammo?.ammo?.count), 500);
    }
    if (weapon.useStones) {
      setTimeout(() => stone(token, id, hand, toRemove, ammo?.ammo?.count), 500);
    }
    if (weapon.useBolts) {
      setTimeout(() => bolt(token, id, hand, toRemove, ammo?.ammo?.count), 500);
    }
    if (weapon.useBullets) {
      setTimeout(() => bullets(token, id, hand, toRemove, ammo?.ammo?.count), 500);
    }
  }
}
export async function getEquippedItems(token: TokenDocument): Promise<equippedItem[]> {
  return CTA.getEquippedItems(token);
}
