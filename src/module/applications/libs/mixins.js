export function applyMixins(derivedCtor, constructors) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null),
      );
    });
  });
}
export function applyMixinsOnObject(derivedCtor, constructors) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      if (!derivedCtor[name]) {
        Object.defineProperty(
          derivedCtor,
          name,
          Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null),
        );
      }
    });
  });
}
//# sourceMappingURL=mixins.js.map
