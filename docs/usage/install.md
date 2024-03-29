# Install

We recommend pinning an exact version of Sortier in your package.json so that all developers are running the exact same version in case there are unexpected differences between patch versions.

With npm:

```bash
npm install --save-dev --save-exact sortier
```

Or yarn:

```bash
yarn add sortier --dev --exact
```

## Pre-commit hook

We went with a system similar to Prettier so hopefully you have already picked a solution and can keep going with it. If not, this repository uses [lint-staged](https://github.com/okonet/lint-staged) and [husky](https://typicode.github.io/husky/).
