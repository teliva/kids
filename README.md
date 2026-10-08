## Setup
- This project has nodejs and npm depedency
1. Install nodeks + npm
2. 
```
npm ci
```
This will restore the project neccessary to run the repository


## Layout
This is an npm workspace with two packages:
- `apps/kids` - the `kids` package: Lit components and CSS tokens, built to `apps/kids/dist`
- `apps/kids-test` - test pages (`configurator.html`, `page.html`) that consume `kids` like any other app would

Consumers import the components and link the CSS from the package:
```js
import 'kids'                          // registers every kd-* element
import 'kids/components/kd-button.js'  // or just one
```
CSS files ship at `kids/css/*` (`design-tokens.css`, `spacing.css`, `fonts.css`).


## Development 
To fire up development environment
```
npm run dev
```
This serves the test pages and compiles the `kids` TypeScript source directly, so component
and CSS edits reload without a separate build step.

`npm run build` builds `kids` to `apps/kids/dist`, then bundles the test pages from that
built package. `npm run preview` serves that production build.


## Added node script to generate a color palette
```
node apps/kids/scripts/generate-color-scale.js "#ADEBB3" brand --mode=muted --write
```

Generates and patches `apps/kids/src/css/design-tokens.css` for colors
