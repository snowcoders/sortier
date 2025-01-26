# Playground

Source code for the playground found on the docs site.

## Mocks folder

The folder "mocks" contains mock files that we use to replace real files during the webpack build. This is done to either remove dependencies on node apis (ex. cosmiconfig) or remove functionality we don't use in the web (ex. flow-parser).

Anything within a folder is mocking a node_module. For example "src-playground/mocks/cosmiconfig/dist/index.js" is the mock for "node_modules/cosmiconfig/dist/index.js". These files are dynamically included in the webpack build via the webpack.config.js file. It's also important to note that the mocked file needs to match the "module" type defined in the packge.json it's replacing. This is why you'll find some files written in cjs and others in esm.

Any files at the root is mocking a node API. These files are dynamically included in the webpack build via the webpack.config.js file.
