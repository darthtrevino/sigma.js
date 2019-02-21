[![Build Status](https://travis-ci.org/jacomyal/sigma.js.svg)](https://travis-ci.org/jacomyal/sigma.js)

# sigma.js - v1.2.1

Sigma is a JavaScript library dedicated to graph drawing, mainly developed by [@jacomyal](https://github.com/jacomyal) and [@Yomguithereal](https://github.com/Yomguithereal).

### Resources

[The website](http://sigmajs.org) provides a global overview of the project, and the documentation is available in the [GitHub Wiki](https://github.com/jacomyal/sigma.js/wiki).

The `examples` directory contains various use-cases that might help you understand how to use sigma.

### How to use it

To use it, clone the repository:

```
git clone git@github.com:jacomyal/sigma.js.git
```

To build the code:

- Install [Node.js](http://nodejs.org/).
- Use `npm install` to install sigma development dependencies.
- Use `npm run build:dev` to bundle the code with [Rollup](https://rollupjs.org). The resultant libraries will then be accessible in the `build/` folder.
- use `npm run build:prod` to bundle the minified production code.

### Contributing

You can contribute by submitting [issues tickets](http://github.com/jacomyal/sigma.js/issues) and proposing [pull requests](http://github.com/jacomyal/sigma.js/pulls). Make sure that tests and linting pass before submitting any pull request by running the `npm test` script.

The whole source code is validated by the [Google Closure Linter](https://developers.google.com/closure/utilities/) and [JSHint](http://www.jshint.com/), and the comments are written in [JSDoc](http://en.wikipedia.org/wiki/JSDoc) (tags description is available [here](https://developers.google.com/closure/compiler/docs/js-for-compiler)).
