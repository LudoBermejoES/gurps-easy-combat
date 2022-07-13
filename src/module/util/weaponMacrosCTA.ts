declare global {
  interface Window {
    CTA: any;
  }
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

function cloak(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'icons/equipment/back/cloakcollared-red-gold.webp',
    scale: '0.5',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'Cloack', hand, null, id, toRemove);
}

function arrow(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Forgotten-Adventures/Weapons/Arrow_01.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'Arrow', hand, null, id, toRemove);
}

function bullets(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Ludo/Armas%20modernas/bullets.png',
    scale: '1',
    speed: 0,
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
  textureData.yScale = 1;
  addOrRemoveItem(token, textureData, false, 'bullets', hand, null, id, toRemove);
}
function longbow(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Forgotten-Adventures/Weapons/Longbow_01.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'Longbow', hand, null, id, toRemove);
}

function walterPPK(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Ludo/Armas%20modernas/Walter%20PPK.png',
    scale: '0.5',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'WalterPPK', hand, null, id, toRemove);
}

function imiUzi(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Ludo/Armas%20modernas/imi_uzi.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'ImiUzi', hand, null, id, toRemove);
}

function luger08(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Ludo/Armas%20modernas/luger_p08.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'luger08', hand, null, id, toRemove);
}

function sIGSauerP226(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Ludo/Armas%20modernas/SIG_P226.png',
    scale: '0.5',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'WalterPPK', hand, null, id, toRemove);
}

function katana(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Ludo/Armas%20modernas/Katana.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'Katana', hand, null, id, toRemove);
}

function ALSPocketSmoke(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Ludo/Armas%20modernas/ALS_Pocket_smoke.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'ALS_Pocket_smoke', hand, null, id, toRemove);
}

function GLIF4(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Ludo/Armas%20modernas/GLI-F4.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'GLI-F4', hand, null, id, toRemove);
}

function SchermulyStun(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Ludo/Armas%20modernas/Schermuly_Stun.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'Schermuly_Stun', hand, null, id, toRemove);
}

function DiehlDM51(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Ludo/Armas%20modernas/Diehl_DM51.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'Diehl_DM51', hand, null, id, toRemove);
}

function expandableBaton(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Ludo/Armas%20modernas/extensible-baton.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'ExpandableBaton', hand, null, id, toRemove);
}

function blowPipe(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Ludo/Armas%20antiguas/blowpipe.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'ExpandableBaton', hand, null, id, toRemove);
}

function shuriken(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'icons/skills/ranged/shuriken-thrown-orange.webp',
    scale: '0.5',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'Shuriken', hand, null, id, toRemove);
}

function pistolCrossbow(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Forgotten-Adventures/Weapons/Crossbow_Hand_01.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'Pistol Crossbow', hand, null, id, toRemove);
}

function rapier(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Forgotten-Adventures/Combat/Weapons/Swords/Rapier_A_01_1x1.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'Rapier', hand, null, id, toRemove);
}

function mace(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Forgotten-Adventures/Weapons/Mace_01.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'Mace', hand, null, id, toRemove);
}

function knife(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Forgotten-Adventures/Weapons/Dagger_01.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'Dagger', hand, null, id, toRemove);
}

function throwingKnife(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath:
      'moulinette/images/custom/Forgotten-Adventures/Combat/Weapons/Special/Throwing_Knife_Metal_Gray_Black_A_1x1.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'ThrowingKnife', hand, null, id, toRemove);
}

function shortSword(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Forgotten-Adventures/Weapons/Shortsword_01.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'Shortsword', hand, null, id, toRemove);
}

function spear(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Forgotten-Adventures/Weapons/Spear_A01.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'Spear', hand, null, id, toRemove);
}

function smallShield(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Forgotten-Adventures/Combat/Weapons/Shields/Shield_Metal_Gray_B_1x1.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'Shield', hand, null, id, toRemove);
}

function mediumShield(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath: 'moulinette/images/custom/Forgotten-Adventures/Combat/Weapons/Shields/Shield_Metal_Gray_A_1x1.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'Shield', hand, null, id, toRemove);
}

function largeShield(token: Token, id: string, hand: string, toRemove: boolean) {
  const textureData = {
    texturePath:
      'moulinette/images/custom/Forgotten-Adventures/Combat/Weapons/Shields/Shield_Metal_Gray_Gold_C_1x1.png',
    scale: '1',
    speed: 0,
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
  addOrRemoveItem(token, textureData, false, 'Shield', hand, null, id, toRemove);
}

export function clearEquipment(token: string | null) {
  CTA.removeAll(token, false);
}

export function removeEquipment(token: string | null) {
  CTA.removeAll(token, false);
}

export async function clearAmmunition(name: string, token: Token) {
  const nameToLook = name.toUpperCase();
  if (nameToLook.includes('REFLEX BOW')) {
    CTA.removeAnimByName(token.id, 'Arrow');
  } else if (nameToLook.includes('REGULAR BOW')) {
    CTA.removeAnimByName(token.id, 'Arrow');
  } else if (nameToLook.includes('THROWING KNIFE')) {
    CTA.removeAnimByName(token.id, 'ThrowingKnife');
  } else if (nameToLook.includes('SHURIKEN')) {
    CTA.removeAnimByName(token.id, 'Shuriken');
  } else if (nameToLook.includes('WALTHER PPK')) {
    CTA.removeAnimByName(token.id, 'bullets');
  } else if (nameToLook.includes('SIG-SAUER P226')) {
    CTA.removeAnimByName(token.id, 'bullets');
  } else if (nameToLook.includes('IMI UZI')) {
    CTA.removeAnimByName(token.id, 'bullets');
  }
}

export async function addAmmunition(name: string, token: Token, id: string, hand: string) {
  const nameToLook = name.toUpperCase();
  if (nameToLook.includes('REFLEX BOW')) {
    arrow(token, id, hand, false);
  } else if (nameToLook.includes('REGULAR BOW')) {
    arrow(token, id, hand, false);
  } else if (nameToLook.includes('WALTHER PPK')) {
    bullets(token, id, hand, false);
  } else if (nameToLook.includes('SIG-SAUER P226')) {
    bullets(token, id, hand, false);
  } else if (nameToLook.includes('IMI UZI')) {
    bullets(token, id, hand, false);
  }
}

export async function drawEquipment(name: string, token: Token, id: string, hand: string, toRemove: boolean) {
  const nameToLook = name.toUpperCase();
  if (nameToLook.includes('PISTOL CROSSBOW')) {
    await pistolCrossbow(token, id, hand, toRemove);
  } else if (nameToLook.includes('SHORTSWORD')) {
    await shortSword(token, id, hand, toRemove);
  } else if (nameToLook.includes('SPEAR')) {
    await spear(token, id, hand, toRemove);
  } else if (nameToLook.includes('RAPIER')) {
    await rapier(token, id, hand, toRemove);
  } else if (nameToLook.includes('LARGE SHIELD')) {
    await largeShield(token, id, hand, toRemove);
  } else if (nameToLook.includes('SMALL SHIELD')) {
    await smallShield(token, id, hand, toRemove);
  } else if (nameToLook.includes('MEDIUM SHIELD')) {
    await mediumShield(token, id, hand, toRemove);
  } else if (nameToLook.includes('MACE')) {
    await mace(token, id, hand, toRemove);
  } else if (nameToLook.includes('REFLEX BOW')) {
    await longbow(token, id, hand, toRemove);
    setTimeout(() => arrow(token, id, hand, toRemove), 500);
  } else if (nameToLook.includes('REGULAR BOW')) {
    await longbow(token, id, hand, toRemove);
    setTimeout(() => arrow(token, id, hand, toRemove), 500);
  } else if (nameToLook.includes('BOW')) {
    await longbow(token, id, hand, toRemove);
    setTimeout(() => arrow(token, id, hand, toRemove), 500);
  } else if (nameToLook.includes('THROWING KNIFE')) {
    await throwingKnife(token, id, hand, toRemove);
  } else if (nameToLook.includes('KNIFE')) {
    await knife(token, id, hand, toRemove);
  } else if (nameToLook.includes('CLOAK')) {
    await cloak(token, id, hand, toRemove);
  } else if (nameToLook.includes('KATANA')) {
    await katana(token, id, hand, toRemove);
  } else if (nameToLook.includes('SHURIKEN')) {
    await shuriken(token, id, hand, toRemove);
  } else if (nameToLook.includes('WALTHER PPK')) {
    await walterPPK(token, id, hand, toRemove);
    setTimeout(() => bullets(token, id, hand, toRemove), 500);
  } else if (nameToLook.includes('SIG-SAUER P226')) {
    await sIGSauerP226(token, id, hand, toRemove);
    setTimeout(() => bullets(token, id, hand, toRemove), 500);
  } else if (nameToLook.includes('IMI UZI')) {
    await imiUzi(token, id, hand, toRemove);
    setTimeout(() => bullets(token, id, hand, toRemove), 500);
  } else if (nameToLook.includes('LUGER P08')) {
    await luger08(token, id, hand, toRemove);
    setTimeout(() => bullets(token, id, hand, toRemove), 500);
  } else if (nameToLook.includes('EXPANDABLE BATON')) {
    await expandableBaton(token, id, hand, toRemove);
  } else if (nameToLook.includes('BLOWPIPE')) {
    await blowPipe(token, id, hand, toRemove);
  } else if (nameToLook.includes('ALS POCKET')) {
    await ALSPocketSmoke(token, id, hand, toRemove);
  } else if (nameToLook.includes('GLI-F4')) {
    await GLIF4(token, id, hand, toRemove);
  } else if (nameToLook.includes('SCHERMULY STUN')) {
    await SchermulyStun(token, id, hand, toRemove);
  } else if (nameToLook.includes('Diehl DM51')) {
    await DiehlDM51(token, id, hand, toRemove);
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
