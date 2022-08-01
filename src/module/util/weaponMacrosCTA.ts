import weaponIcons from './weaponIcons';

declare global {
  interface Window {
    CTA: any;
  }
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
  useBullets: boolean | undefined;
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
) {
  if (toRemove === undefined) {
    if (await window.CTA.hasAnim(token, name)) {
      CTA.removeAnimByName(token, name);
      return;
    }
    CTA.addAnimation(token, textureData, actor, name, r, id, hand);
  } else if (toRemove) {
    CTA.removeByItemId(token, id);
  } else {
    CTA.addAnimation(token, textureData, actor, name, r, id, hand);
  }
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

function arrow(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    ...getWeapon('ARROW'),
    ...defaultOptions(hand),
  };
  addOrRemoveItem(token, textureData, false, 'Arrow', hand, null, id, toRemove);
}

function bullets(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    ...getWeapon('BULLETS'),
    ...defaultOptions(hand),
  };
  textureData.yScale = 1;
  addOrRemoveItem(token, textureData, false, 'bullets', hand, null, id, toRemove);
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

export async function clearAmmunition(name: string, token: Token) {
  const nameToLook = name.toUpperCase();
  const weapon = getWeapon(nameToLook);
  if (weapon?.useArrows) {
    CTA.removeAnimByName(token.id, 'Arrow');
  }
  if (weapon?.useBullets) {
    CTA.removeAnimByName(token.id, 'bullets');
  }

  if (nameToLook.includes('THROWING KNIFE')) {
    CTA.removeAnimByName(token.id, 'ThrowingKnife');
  } else if (nameToLook.includes('SHURIKEN')) {
    CTA.removeAnimByName(token.id, 'Shuriken');
  }
}

export async function addAmmunition(name: string, token: Token, id: string, hand: string) {
  const nameToLook = name.toUpperCase();
  const weapon = getWeapon(nameToLook);
  if (weapon?.useBullets) {
    bullets(token, id, hand, false);
  }
  if (weapon?.useArrows) {
    arrow(token, id, hand, false);
  }
}

function getWeapon(nameToLook: string): weapon | undefined {
  let result: weapon | undefined = undefined;
  Object.keys(weaponIcons).some((key) => {
    if (nameToLook.includes(key)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      result = weaponIcons[key];
      return true;
    }
  });
  return result;
}

export async function drawEquipment(name: string, token: Token, id: string, hand: string, toRemove: boolean) {
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
      setTimeout(() => arrow(token, id, hand, toRemove), 500);
    }
    if (weapon.useBullets) {
      setTimeout(() => bullets(token, id, hand, toRemove), 500);
    }
  }
}
export async function getEquippedItems(token: TokenDocument): Promise<
  {
    itemId: string;
    hand: string;
  }[]
> {
  return CTA.getEquippedItems(token);
}
