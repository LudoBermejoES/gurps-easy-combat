export function applyModifiers(modifiers) {
  for (const modifier of modifiers) {
    GURPS.ModifierBucket.addModifier(modifier.mod, modifier.desc);
  }
}
//# sourceMappingURL=actions.js.map
