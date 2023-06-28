export default {
  link(origin?: Token, destiny?: Token) {
    if (!origin || !destiny) return;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new Sequence.effect()
      .file('jb2a.energy_beam.normal.bluepink.03')
      .attachTo(origin)
      .stretchTo(destiny, { attachTo: true })
      .persist()
      .play();
  },
};
