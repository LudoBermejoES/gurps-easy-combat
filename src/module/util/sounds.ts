import { Item } from '../types';
import { getWeapon } from './weaponMacrosCTA';

function randomIntFromInterval(min: number, max: number): number {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function playSound(actor: Actor, weapon: Item | undefined, numberOfProjectiles: number | undefined) {
  console.log(weapon);
  if (!weapon?.name) return;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore

  let sound = getWeapon(weapon.name)?.sound;
  if (!sound) return;
  if (numberOfProjectiles && numberOfProjectiles > 1) {
    sound += `x${numberOfProjectiles}:0.2`;
  }

  console.log('Ejecuto', `/sound ${sound}`);

  return GURPS.executeOTF(`/sound ${sound}`, false, null, actor);
}

export function doSound(actor: Actor, name: string, tryAttack: boolean, success: boolean) {
  let sound = '';

  const totalMeleeHitSound = 13;
  const totalArrowTrySound = 3;
  const totalMeleeMissSound = 1;
  const totalArrowHitSound = 5;

  if (tryAttack) {
    if (name.toLowerCase().includes('bow')) {
      sound = `modules/soundfxlibrary/Combat/Single/Arrow Fly-By/arrow-fly-by-${randomIntFromInterval(
        1,
        totalArrowTrySound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('crossbow')) {
      sound = `modules/soundfxlibrary/Combat/Single/Arrow Fly-By/arrow-fly-by-${randomIntFromInterval(
        1,
        totalArrowTrySound,
      )}.mp3`;
    }
  } else if (success) {
    if (['sig-sauer', 'imi uzi', 'walter', 'luger'].filter((n) => n.includes(name.toLowerCase()))) {
      sound = 'dragupload/uploaded/ambient/Desert-Eagle-.50-AE-Close-Single-Gunshot-B-www.fesliyanstudios.com.mp3';
    } else if (name.toLowerCase().includes('throwing knife')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('knife')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('spear')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('great axe')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('axe')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('greatsword')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('shortsword')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('maul')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('rapier')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('mace')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Hit/melee-hit-${randomIntFromInterval(
        1,
        totalMeleeHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('bow')) {
      sound = `modules/soundfxlibrary/Combat/Single/Arrow Impact/arrow-impact-${randomIntFromInterval(
        1,
        totalArrowHitSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('crossbow')) {
      sound = `modules/soundfxlibrary/Combat/Single/Arrow Impact/arrow-impact-${randomIntFromInterval(
        1,
        totalArrowHitSound,
      )}.mp3`;
    }
  } else if (!success) {
    if (name.toLowerCase().includes('throwing knife')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('knife')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('spear')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('great axe')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('axe')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('greatsword')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('shortsword')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('maul')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('rapier')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('mace')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('bow')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/melee-miss-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (name.toLowerCase().includes('crossbow')) {
      sound = `modules/soundfxlibrary/Combat/Single/Melee Miss/arrow-fly-by-${randomIntFromInterval(
        1,
        totalMeleeMissSound,
      )}.mp3`;
    } else if (['sig-sauer', 'imi uzi', 'walter', 'luger'].filter((n) => n.includes(name.toLowerCase()))) {
      sound = 'dragupload/uploaded/ambient/Desert-Eagle-.50-AE-Close-Single-Gunshot-B-www.fesliyanstudios.com.mp3';
    }
  }

  console.log(sound);
  if (sound) {
    setTimeout(() => {
      GURPS.executeOTF(`/sound ${sound}`, false, null, actor);
    }, 500);
  }
}
