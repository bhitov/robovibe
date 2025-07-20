import nodeConfig from '@repo/eslint-config/node';

export default [
  ...nodeConfig('./tsconfig.json', import.meta.dirname),
  {
    ignores: ['examples/**', 'dist/**', 'node_modules/**']
  }
];