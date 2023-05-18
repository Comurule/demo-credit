const { name } = require('./package.json');
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  verbose: true,
  transform: {},
  rootDir: '.',
  displayName: name,
  preset: 'ts-jest',
  coveragePathIgnorePatterns: [
    'main.ts',
    'swagger.ts',
    'node_modules',
    'module.ts',
    'interface.ts',
  ],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
};
