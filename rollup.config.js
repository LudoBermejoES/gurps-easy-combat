const typescript = require('rollup-plugin-typescript2');
const { nodeResolve } = require('@rollup/plugin-node-resolve');

module.exports = {
  input: 'src/module/gurps-easy-combat.ts',
  output: {
    dir: '../../OneDrive/Rol/Foundryvtt/Data/modules/gurps-easy-combat/module',
    format: 'es',
    sourcemap: true,
  },
  plugins: [nodeResolve(), typescript({})],
};
