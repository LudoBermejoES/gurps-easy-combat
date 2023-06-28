export function addDeceptiveAttackModifierForDefense(isDeceptiveAttack, modifiers) {
  if (isDeceptiveAttack && !isNaN(Number(isDeceptiveAttack)) && Number(isDeceptiveAttack) !== 0) {
    modifiers.defense.push({ mod: Number(isDeceptiveAttack) / 2, desc: 'Por ataque engañoso' });
  }
}
//# sourceMappingURL=deceptiveAttack.js.map
