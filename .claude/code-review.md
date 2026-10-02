# Code Review Guide — kids design system

A Lit web-component library (`src/components/kd-*.ts`) styled with plain CSS
custom properties (`css/design-tokens.css`, `css/spacing.css`, `css/fonts.css`).
Use this checklist when reviewing changes. Flag real problems; don't flag the
deliberate exceptions listed under each section.

## 1. Plain CSS only

There is no CSS build step. Webpack compiles `.ts` only and copies `css/`
verbatim to `dist/css/`.

- [ ] No Sass, PostCSS, `@custom-media`, nesting that depends on a preprocessor,
      or other non-native syntax.
- [ ] No `var(--kd-breakpoint-*)` inside an `@media` condition. Custom
      properties don't work there. Use the literal px value, with a comment
      naming the token it mirrors.
- [ ] Newer native features (`color-mix()`, `:has()`, container queries) are
      fine, as long as they match the browsers we support.

## 2. Tokens: naming and usage

- [ ] New tokens follow `--kd-<category>-<scale>`, e.g. `--kd-color-gray-30`,
      `--kd-font-size-xl`, `--kd-radius-md`, `--kd-space-component-padding-md-x`.
- [ ] New tokens go in the right file: color, font size, shadow and radius in
      `design-tokens.css`; spacing, grid, breakpoint and density in
      `spacing.css`.
- [ ] Components use existing tokens and don't hardcode values for:
  - colors (use `--kd-color-*`)
  - spacing, padding, gap and control height (use `--kd-space-*`)
  - border radius (use `--kd-radius-{sm,md,lg,pill,full}`)
  - font size, line height and font family (use `--kd-font-*`, `--kd-line-height-*`)
  - shadows (use `--kd-box-shadow-*`)
- [ ] Semantic spacing tokens are used for their intended job:
      `component-*` for space inside a control, `layout-*` for space between
      controls or sections. Primitive `--kd-space-N` values are a fallback.
- [ ] A changed token value is checked against every component that uses it.
- [ ] New spacing still works under `:root[data-density="compact"]`.

**Acceptable literals (don't flag these):**
- Sub-pixel optical nudges, e.g. the toast icon's `0.0625rem` offset.
- Offsets derived from a component's geometry, e.g. the switch's help-text
  indent based on track width.
- Hairline borders such as `1px solid`.
- Component-private custom properties that aren't design tokens, e.g.
  kd-spinner's `--radius` or `--size`, which are SVG geometry.
- JS-side pixel numbers that mirror a token, such as the button gap in
  `styleMap` or tooltip `distance`/`arrowSize`, **if a comment names the
  token**. A shared TS constants module isn't wanted for 1–3 values.

## 3. Component API (Lit)

- [ ] The tag and class follow `kd-<name>` / `Kd<Name>`, and the tag is added to
      `HTMLElementTagNameMap`.
- [ ] Props that drive styling (`variant`, `size`, `appearance`, `pill`,
      `disabled`, `loading`, …) use `reflect: true`, so `:host([attr])`
      selectors work.
- [ ] Prop names and values match the other components: `size: "sm" | "md" | "lg"`
      and `variant: "neutral" | "brand" | "success" | "warning" | "danger"`.
      Don't invent synonyms like `small` or `primary`.
- [ ] Variants are built by reassigning component-scoped custom properties on
      `:host([variant=…])`, e.g. `--kd-button-color`, not by duplicating rule
      blocks.
- [ ] There are public styling hooks: `part="…"` on meaningful inner elements,
      and documented `--kd-<component>-*` overrides with token fallbacks, e.g.
      `var(--kd-plain-hover, var(--kd-color-gray-20))`.
- [ ] Slot handling uses `slotchange` and `assignedNodes({ flatten: true })`,
      and doesn't assume content is present at first render.
- [ ] Listeners added by hand in `firstUpdated` or `connectedCallback` are
      removed in `disconnectedCallback`.
- [ ] `@state` is used for internal state and `@property` for the public API.
      No stray public fields.
- [ ] Custom events, if any, use `bubbles: true, composed: true` and a
      `kd-` prefix.

## 4. Accessibility

- [ ] Native elements are used where possible (`<button>`, `<input>`), with
      `type="button"` on buttons.
- [ ] Focus is visible (`:focus-visible`) and keyboard behavior matches the
      native or ARIA pattern. Tabs need arrow keys and `role="tablist"`,
      `tab` and `tabpanel`.
- [ ] Disabled and loading states set the right ARIA (`aria-disabled`,
      `aria-busy`). Loading keeps focus rather than using `disabled`.
- [ ] Icon-only controls have an accessible name. Decorative elements are
      `aria-hidden`.
- [ ] Text and background color pairs pass contrast. Check any contrast logic
      in `utils/contrast-color.ts` that runs when hover or variant changes.
- [ ] Motion (`transform`, transitions, spinners) respects
      `prefers-reduced-motion` where it's more than a small change.

## 5. Visual consistency

- [ ] The same state looks the same on every component: hover, active,
      disabled (`opacity: 0.5`, `not-allowed`), loading.
- [ ] Transition durations and easing match the other components.
- [ ] Sizes sm/md/lg map to `--kd-space-component-height-*` and line up with
      other controls of the same size.
- [ ] The commit message says whether the change is visual or not. A "snap to
      grid" change that moves pixels should say so explicitly.

## 6. Demo, build and housekeeping

- [ ] New components are imported in `src/main.ts` and shown on the demo or
      configurator pages.
- [ ] HTML entry points that are added or removed (`page.html`,
      `configurator.html`) are wired into `webpack.config.js`, and still link
      the `css/` token files.
- [ ] No leftover debug code, unused imports, or commented-out blocks.
- [ ] `npm run build`, or the project's equivalent, passes with no TS errors.

## Severity guide

| Level | Examples |
|---|---|
| **Blocker** | Non-native CSS syntax, `var()` in `@media`, broken a11y such as no keyboard access or a missing accessible name, a build failure |
| **Should fix** | A hardcoded value where a token exists, off-convention token or prop names, a non-reflected styling prop, a listener leak |
| **Nit** | Comment wording, ordering of tokens, a missing `part` on a minor element |
