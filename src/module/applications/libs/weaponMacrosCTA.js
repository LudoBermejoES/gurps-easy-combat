import weaponIcons from './weaponIcons';
import { easyCombatActorfromActor } from '../abstract/EasyCombatActor';
const COUNTER_AMMO = 'moulinette/images/custom/Ludo/Counters/Ammo/counter_ammo_XX.png';
const CTA = window.CTA;
async function addOrRemoveItem(token, textureData, actor, name, hand, r, id, toRemove, number = undefined) {
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
export async function refreshAmmo(token, weapon, number) {
  const name = `Ammo_${weapon.itemid}`;
  const equipment = await CTA.getEquippedItems(token);
  const item = equipment.find((i) => i.itemId === weapon.itemid);
  if (!item) return;
  await CTA.removeAnimByName(token, name);
  await addAmmo(token, weapon.itemid, item.hand, false, number);
  // await addAmmo(token, id, hand, false, number);
}
export async function removeItemById(token, id) {
  return CTA.removeByItemId(token, id);
}
function getPositionByHands(hand) {
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
function getCounterAmmoData(number, hand, id) {
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
function addAmmo(token, id, hand, toRemove, number = undefined) {
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
async function arrow(token, id, hand, toRemove, number = undefined) {
  const textureData = {
    ...getWeapon('ARROW'),
    ...defaultOptions(hand),
  };
  addOrRemoveItem(token, textureData, false, `Arrow_${id}`, hand, null, id, toRemove, number);
  setTimeout(() => addAmmo(token, id, hand, toRemove, number), 1000);
}
async function magic(token, id, hand, toRemove, number = undefined) {
  const textureData = {
    ...getWeapon('MAGIC'),
    ...defaultOptions(hand),
  };
  addOrRemoveItem(token, textureData, false, `Magic_${id}`, hand, null, id, toRemove, number);
  setTimeout(() => addAmmo(token, id, hand, toRemove, number), 1000);
}
async function stone(token, id, hand, toRemove, number = undefined) {
  const textureData = {
    ...getWeapon('STONE'),
    ...defaultOptions(hand),
  };
  addOrRemoveItem(token, textureData, false, `Stone_${id}`, hand, null, id, toRemove, number);
  setTimeout(() => addAmmo(token, id, hand, toRemove, number), 1000);
}
async function bolt(token, id, hand, toRemove, number = undefined) {
  const textureData = {
    ...getWeapon('BOLT'),
    ...defaultOptions(hand),
  };
  addOrRemoveItem(token, textureData, false, `Bolt_${id}`, hand, null, id, toRemove, number);
  setTimeout(() => addAmmo(token, id, hand, toRemove, number), 1000);
}
async function bullets(token, id, hand, toRemove, number = undefined) {
  const textureData = {
    ...getWeapon('BULLETS'),
    ...defaultOptions(hand),
  };
  textureData.yScale = 1;
  addOrRemoveItem(token, textureData, false, `Bullets_${id}`, hand, null, id, toRemove, number);
  setTimeout(() => addAmmo(token, id, hand, toRemove, number), 1000);
}
function defaultOptions(hand) {
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
export function clearEquipment(token) {
  CTA.removeAll(token, false);
}
export async function clearAmmunition(item, token) {
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
export async function addAmmunition(name, token, id, hand, number = undefined) {
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
export function getWeapon(nameToLook) {
  let result = undefined;
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
export async function drawEquipment(name, token, id, hand, toRemove, number = undefined) {
  if (!token?.actor) return;
  const actor = easyCombatActorfromActor(token.actor);
  const ammo = actor.getAmmunnitionFromInventory(id, 'data.equipment.carried');
  const nameToLook = name.toUpperCase();
  let weapon;
  const foundWeapon = getWeapon(nameToLook);
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
export async function getEquippedItems(token) {
  return CTA.getEquippedItems(token);
}
//# sourceMappingURL=weaponMacrosCTA.js.map
