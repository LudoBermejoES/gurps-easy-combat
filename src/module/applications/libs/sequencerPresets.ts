export default {
  link(origin?: Token, destiny?: Token) {
    if (!origin || !destiny) return;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new Sequence()
      .effect()
      .file('jb2a.energy_beam.normal.bluepink.03')
      .attachTo(origin)
      .stretchTo(destiny, { attachTo: true })
      .persist()
      .play();
  },
  whirlwind(origin?: Token, destiny?: Token) {
    if (!origin || !destiny) return;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new Sequence()
      .effect()
      .file('modules/jb2a_patreon/Library/7th_Level/Whirlwind/Whirlwind_01_BlueGrey_01_400x400.webm')
      .atLocation(destiny)
      .scaleToObject(2)
      .persist()
      .play();
  },
};
