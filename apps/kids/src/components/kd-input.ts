import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";

export type InputType =
  | "text"
  | "email"
  | "number"
  | "password"
  | "search"
  | "tel"
  | "url"
  | "date"
  | "time"
  | "datetime-local";

export type InputSize = "small" | "medium" | "large";

export type InputAppearance = "outline" | "filled" | "filled-outline";

/** Input types that, like native text fields, stop Enter from submitting a form with several of them and no submit button. */
const IMPLICIT_SUBMIT_BLOCKING_TYPES = new Set([
  "text", "search", "url", "tel", "email", "password",
  "date", "month", "week", "time", "datetime-local", "number",
]);

/**
 * A text field that takes part in forms like a native `<input>`: its value is
 * submitted under `name`, it blocks submission while invalid, and
 * `form.reset()` restores the `value` attribute.
 *
 * Errors only show once the user has changed the field or tried to submit
 * the form. Style that state with `[invalid]`, `[data-user-invalid]` /
 * `[data-user-valid]`, or `:state(user-invalid)` / `:state(user-valid)`.
 *
 * ```html
 * <form>
 *   <kd-input name="email" label="Email" type="email" hint="We'll never share it." with-clear required></kd-input>
 * </form>
 * ```
 *
 * Older names still work: `help-text` (attribute and slot) for `hint`,
 * `clearable` for `with-clear`, and the `prefix` / `suffix` slots for
 * `start` / `end`.
 *
 * @slot label - Label content; use instead of the `label` attribute for rich content.
 * @slot hint - Hint content; use instead of the `hint` attribute.
 * @slot start - Content before the text, such as an icon.
 * @slot end - Content after the text.
 *
 * @fires kd-input / input - The value changed as the user typed. `input` is the native event.
 * @fires kd-change / change - The user committed a change.
 * @fires kd-focus / kd-blur - The field gained or lost focus (native `focus` / `blur` reach the host too).
 * @fires kd-clear - The clear button was used.
 * @fires kd-invalid - A validity check (form submit, `checkValidity()`, `reportValidity()`) found the value invalid.
 */
@customElement("kd-input")
export class KdInput extends LitElement {
  static formAssociated = true;

  // Focusing the host (labels, form validation, autofocus) moves focus to the inner input
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static styles = css`
    :host {
      display: block;
      font-family: var(--kd-font-family);
    }

    .form-control {
      display: flex;
      flex-direction: column;
    }

    .label {
      display: block;
      margin-bottom: var(--kd-space-1);
      font-size: var(--kd-font-size-sm);
      font-weight: 600;
      color: var(--kd-input-label-color, inherit);
    }

    .label[hidden],
    .hint[hidden] {
      display: none;
    }

    :host([required]) .label::after {
      content: " *";
      color: var(--kd-input-invalid-color, #b40c12);
    }

    .base {
      /* Padding and border stay inside the 100% width, so it can't overflow its container */
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      gap: var(--kd-space-component-gap-sm);
      width: 100%;
      border: 1px solid var(--kd-input-border-color, var(--kd-color-gray-30));
      border-radius: var(--kd-radius-md);
      background: var(--kd-input-background, #fff);
      color: var(--kd-input-color, #1a1a1a);
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background-color 0.2s ease;
    }

    .base:hover {
      border-color: var(--kd-input-border-color-hover, var(--kd-color-brand));
    }

    .base.focused {
      border-color: var(--kd-color-brand);
      box-shadow: 0 0 0 3px
        color-mix(in srgb, var(--kd-color-brand) 35%, transparent);
    }

    :host([appearance="filled"]) .base,
    :host([appearance="filled-outline"]) .base {
      background: var(--kd-input-filled-background, var(--kd-color-gray-10));
    }

    :host([appearance="filled"]) .base {
      border-color: transparent;
    }

    :host([appearance="filled"]) .base:hover {
      border-color: transparent;
    }

    :host([appearance="filled"]) .base.focused,
    :host([appearance="filled-outline"]) .base.focused {
      border-color: var(--kd-color-brand);
      background: var(--kd-input-background, #fff);
    }

    /* Attribute rather than :state() here: an unknown pseudo-class would drop
       the whole rule in browsers without custom states */
    :host([data-user-invalid]) .base {
      border-color: var(--kd-input-invalid-color, #b40c12);
    }

    :host([data-user-invalid]) .base.focused {
      box-shadow: 0 0 0 3px
        color-mix(in srgb, var(--kd-input-invalid-color, #b40c12) 30%, transparent);
    }

    .base.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* size: medium (default) */
    .base {
      height: 48px;
      padding: 0 var(--kd-space-4);
    }

    .input {
      font-size: var(--kd-font-size-md);
    }

    :host([size="small"]) .base {
      height: 36px;
      padding: 0 var(--kd-space-3);
      border-radius: var(--kd-radius-sm);
    }

    :host([size="small"]) .input {
      font-size: var(--kd-font-size-sm);
    }

    :host([size="large"]) .base {
      height: 56px;
      padding: 0 var(--kd-space-6);
      border-radius: var(--kd-radius-lg);
    }

    :host([size="large"]) .input {
      font-size: var(--kd-font-size-lg);
    }

    /* After the size rules so it wins over their radius */
    :host([pill]) .base {
      border-radius: var(--kd-radius-pill);
    }

    .input {
      flex: 1;
      min-width: 0;
      height: 100%;
      border: none;
      outline: none;
      background: none;
      color: inherit;
      font: inherit;
      font-family: var(--kd-font-family);
    }

    /* Browsers paint autofilled inputs with an !important background that CSS
       can't override, only delay. Delay it indefinitely so the rectangular
       input stays clear, and tint the whole rounded .base instead. Separate
       rules: an unsupported selector would drop the whole list */
    .input:autofill {
      transition: background-color 0s 600000s;
    }

    .input:-webkit-autofill {
      transition: background-color 0s 600000s;
    }

    .base:has(.input:autofill) {
      background: var(--kd-input-autofill-background, color-mix(in srgb, var(--kd-color-brand) 8%, #fff));
    }

    .base:has(.input:-webkit-autofill) {
      background: var(--kd-input-autofill-background, color-mix(in srgb, var(--kd-color-brand) 8%, #fff));
    }

    .input::placeholder {
      color: var(--kd-input-placeholder-color, rgba(0, 0, 0, 0.4));
    }

    .input:disabled {
      cursor: not-allowed;
    }

    :host([without-spin-buttons]) .input::-webkit-outer-spin-button,
    :host([without-spin-buttons]) .input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    :host([without-spin-buttons]) .input {
      -moz-appearance: textfield;
    }

    .start,
    .end {
      flex: none;
      display: inline-flex;
      align-items: center;
    }

    /* Hidden via slotchange rather than :empty, since the slot elements
       themselves keep the span from ever being :empty */
    .start[hidden],
    .end[hidden] {
      display: none;
    }

    .icon-button {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
      padding: 0;
      border: none;
      border-radius: var(--kd-radius-sm);
      background: transparent;
      color: inherit;
      opacity: 0.6;
      cursor: pointer;
    }

    .icon-button:hover,
    .icon-button:focus-visible {
      opacity: 1;
    }

    .icon-button:focus-visible {
      outline: 2px solid var(--kd-color-brand);
      outline-offset: 2px;
    }

    .icon-button svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    .hint {
      margin-top: var(--kd-space-1);
      font-size: var(--kd-font-size-xs);
      color: var(--kd-input-hint-color, rgba(0, 0, 0, 0.6));
    }
  `;

  @property() type: InputType = "text";

  // Reflected: the form entry is keyed by the host's name attribute
  @property({ reflect: true }) name = "";

  /** The initial value, restored by `form.reset()`. Set with the `value` attribute. */
  @property({ attribute: "value" }) defaultValue = "";

  @property() label = "";

  @property() hint = "";

  /** Older name for `hint`. */
  @property({ attribute: "help-text" }) helpText = "";

  @property() placeholder = "";

  @property({ reflect: true }) size: InputSize = "medium";

  @property({ reflect: true }) appearance: InputAppearance = "outline";

  @property({ type: Boolean, reflect: true }) pill = false;

  @property({ type: Boolean, reflect: true }) disabled = false;

  @property({ type: Boolean, reflect: true }) readonly = false;

  @property({ type: Boolean, reflect: true }) required = false;

  /** Shows a button that clears the value once there is one. */
  @property({ type: Boolean, reflect: true, attribute: "with-clear" }) withClear = false;

  /** Older name for `with-clear`. */
  @property({ type: Boolean, reflect: true }) clearable = false;

  /** Shows a button that reveals a password field's text. */
  @property({ type: Boolean, reflect: true, attribute: "password-toggle" }) passwordToggle = false;

  /** Whether a password field's text is currently shown. */
  @property({ type: Boolean, reflect: true, attribute: "password-visible" }) passwordVisible = false;

  /** Reserves the label before the `label` slot is filled, e.g. when server-rendered. */
  @property({ type: Boolean, attribute: "with-label" }) withLabel = false;

  /** Reserves the hint before the `hint` slot is filled, e.g. when server-rendered. */
  @property({ type: Boolean, attribute: "with-hint" }) withHint = false;

  /** Hides the arrows on number fields. */
  @property({ type: Boolean, reflect: true, attribute: "without-spin-buttons" }) withoutSpinButtons = false;

  @property() autocomplete?: string;

  @property() pattern?: string;

  @property() inputmode?: string;

  @property() enterkeyhint?: string;

  @property() autocapitalize = "";

  @property() autocorrect?: string;

  // Enumerated like the native attribute, not a Lit Boolean: spellcheck="false"
  // must turn it off, where a Boolean treats any present attribute as true
  @property({
    converter: {
      fromAttribute: (value: string | null) => value !== "false",
      toAttribute: (value: boolean) => (value ? "true" : "false"),
    },
  })
  spellcheck = true;

  @property({ attribute: "minlength", type: Number }) minLength?: number;

  @property({ attribute: "maxlength", type: Number }) maxLength?: number;

  @property() min?: string;

  @property() max?: string;

  @property() step?: string;

  @state() private hasFocus = false;

  /** Set once the user commits a change or a validity check runs; gates the error styling. */
  @state() private hasInteracted = false;

  /** Disabled by an ancestor `<fieldset disabled>` (or our own attribute). */
  @state() private formDisabled = false;

  @state() private hasLabelSlot = false;

  @state() private hasHintSlot = false;

  @state() private hasStartSlot = false;

  @state() private hasEndSlot = false;

  @query(".input") private inputEl!: HTMLInputElement;

  private readonly internals = this.attachInternals();

  /** null until a user or script sets the value; until then it follows `defaultValue`. */
  private currentValue: string | null = null;

  private customValidityMessage = "";

  /** Whether the form value and validity have been synced at least once. */
  private hasSynced = false;

  /**
   * Whether the field is showing an error: invalid after the user changed it
   * or a submit was attempted. Reflected as the `invalid` attribute. Derived,
   * so setting it has no effect (the setter only keeps older code from throwing).
   */
  get invalid(): boolean {
    return this.hasAttribute("invalid");
  }

  set invalid(_value: boolean) {}

  /** The current value. Setting it doesn't change what `form.reset()` restores. */
  @property({ attribute: false })
  get value(): string {
    return this.currentValue ?? this.defaultValue;
  }

  set value(value: string) {
    const oldValue = this.value;
    this.currentValue = value;
    this.requestUpdate("value", oldValue);
  }

  private static readonly clearIcon = html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
      <path
        fill-rule="evenodd"
        d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
        clip-rule="evenodd"
      />
    </svg>
  `;

  private static readonly eyeIcon = html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
      <path
        d="M10 3C4.755 3 1.229 6.883.1 8.665a1.61 1.61 0 000 1.669C1.229 12.117 4.755 16 10 16c5.245 0 8.771-3.883 9.9-5.665.246-.386.246-.884 0-1.269C18.771 6.883 15.245 3 10 3zm0 10a3 3 0 100-6 3 3 0 000 6z"
      />
    </svg>
  `;

  private static readonly eyeSlashIcon = html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
      <path
        d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.092 1.092a4 4 0 00-5.558-5.558z"
      />
      <path
        d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z"
      />
    </svg>
  `;

  constructor() {
    super();
    // Fired on the host by form submission, checkValidity() and reportValidity()
    this.addEventListener("invalid", () => {
      this.hasInteracted = true;
      this.dispatchEvent(new CustomEvent("kd-invalid", { bubbles: true, composed: true }));
    });
  }

  render() {
    const disabled = this.disabled || this.formDisabled;
    const isPassword = this.type === "password";
    const withClear = this.withClear || this.clearable;
    const showClear = withClear && !disabled && !this.readonly && this.value.length > 0;
    const hintText = this.hint || this.helpText;
    const showLabel = Boolean(this.label) || this.withLabel || this.hasLabelSlot;
    const showHint = Boolean(hintText) || this.withHint || this.hasHintSlot;

    // The label, hint, start and end wrappers always render (hidden when empty)
    // so their slots exist and slotchange can report slotted content. The
    // second slot in each pair accepts the older slot name
    return html`
      <div class="form-control" part="form-control">
        <label class="label" part="label" for="input" ?hidden=${!showLabel}>
          <slot name="label" @slotchange=${this.handleLabelSlotChange}>${this.label}</slot>
        </label>

        <div class=${classMap({ base: true, focused: this.hasFocus, disabled })} part="base">
          <span class="start" part="start" ?hidden=${!this.hasStartSlot}>
            <slot name="start" @slotchange=${this.handleStartSlotChange}></slot>
            <slot name="prefix" @slotchange=${this.handleStartSlotChange}></slot>
          </span>

          <input
            id="input"
            class="input"
            part="input"
            type=${isPassword && this.passwordVisible ? "text" : this.type}
            name=${ifDefined(this.name || undefined)}
            .value=${live(this.value)}
            placeholder=${ifDefined(this.placeholder || undefined)}
            autocomplete=${ifDefined(this.autocomplete)}
            inputmode=${ifDefined(this.inputmode)}
            enterkeyhint=${ifDefined(this.enterkeyhint)}
            autocapitalize=${ifDefined(this.autocapitalize || undefined)}
            autocorrect=${ifDefined(this.autocorrect)}
            spellcheck=${this.spellcheck ? "true" : "false"}
            pattern=${ifDefined(this.pattern)}
            minlength=${ifDefined(this.minLength)}
            maxlength=${ifDefined(this.maxLength)}
            min=${ifDefined(this.min)}
            max=${ifDefined(this.max)}
            step=${ifDefined(this.step)}
            ?disabled=${disabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            aria-describedby=${ifDefined(showHint ? "hint" : undefined)}
            @input=${this.handleInput}
            @change=${this.handleChange}
            @keydown=${this.handleKeyDown}
            @focus=${this.handleFocus}
            @blur=${this.handleBlur}
          />

          ${showClear
            ? html`<button
                class="icon-button clear-button"
                part="clear-button"
                type="button"
                tabindex="-1"
                aria-label="Clear"
                @click=${this.handleClear}
              >
                ${KdInput.clearIcon}
              </button>`
            : null}
          ${isPassword && this.passwordToggle
            ? html`<button
                class="icon-button password-toggle-button"
                part="password-toggle-button"
                type="button"
                aria-label=${this.passwordVisible ? "Hide password" : "Show password"}
                aria-pressed=${this.passwordVisible ? "true" : "false"}
                ?disabled=${disabled}
                @click=${this.togglePasswordVisibility}
              >
                ${this.passwordVisible ? KdInput.eyeSlashIcon : KdInput.eyeIcon}
              </button>`
            : null}

          <span class="end" part="end" ?hidden=${!this.hasEndSlot}>
            <slot name="end" @slotchange=${this.handleEndSlotChange}></slot>
            <slot name="suffix" @slotchange=${this.handleEndSlotChange}></slot>
          </span>
        </div>

        <div class="hint" part="hint" id="hint" ?hidden=${!showHint}>
          <slot name="hint" @slotchange=${this.handleHintSlotChange}>${hintText}</slot>
          <slot name="help-text" @slotchange=${this.handleHintSlotChange}></slot>
        </div>
      </div>
    `;
  }

  /** Properties that change the form value, a constraint, or whether errors show. */
  private static readonly validityProps = new Set<PropertyKey>([
    "value", "defaultValue", "type", "required", "readonly", "disabled", "formDisabled",
    "pattern", "minLength", "maxLength", "min", "max", "step", "hasInteracted",
  ]);

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    // Skip focus, hover and slot-only updates; nothing form-related changed
    const relevant = [...changedProperties.keys()].some((key) => KdInput.validityProps.has(key));
    if (this.hasSynced && !relevant) return;
    this.hasSynced = true;
    // The inner input now reflects every constraint, so mirror it to the form
    this.internals.setFormValue(this.value);
    this.syncValidity();
  }

  // --- Form-associated callbacks ---

  formResetCallback() {
    const oldValue = this.value;
    this.currentValue = null;
    this.hasInteracted = false;
    this.passwordVisible = false;
    this.requestUpdate("value", oldValue);
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
  }

  formStateRestoreCallback(state: string | File | FormData | null) {
    if (typeof state === "string") this.value = state;
  }

  // --- Public API, mirroring HTMLInputElement ---

  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  get labels(): NodeList {
    return this.internals.labels;
  }

  get validity(): ValidityState {
    return this.internals.validity;
  }

  get validationMessage(): string {
    return this.internals.validationMessage;
  }

  get willValidate(): boolean {
    return this.internals.willValidate;
  }

  get valueAsNumber(): number {
    return this.workingInput().valueAsNumber;
  }

  set valueAsNumber(number: number) {
    const input = this.workingInput();
    input.valueAsNumber = number;
    this.value = input.value;
  }

  get valueAsDate(): Date | null {
    return this.workingInput().valueAsDate;
  }

  set valueAsDate(date: Date | null) {
    const input = this.workingInput();
    input.valueAsDate = date;
    this.value = input.value;
  }

  // Before the first render there's no inner input to focus or select, so
  // these quietly do nothing then, like calling them on a detached input

  focus(options?: FocusOptions) {
    this.inputEl?.focus(options);
  }

  blur() {
    this.inputEl?.blur();
  }

  select() {
    this.inputEl?.select();
  }

  setSelectionRange(start: number | null, end: number | null, direction?: "forward" | "backward" | "none") {
    this.inputEl?.setSelectionRange(start, end, direction);
  }

  setRangeText(replacement: string, start?: number, end?: number, selectMode?: SelectionMode) {
    const input = this.workingInput();
    if (start === undefined || end === undefined) {
      input.setRangeText(replacement);
    } else {
      input.setRangeText(replacement, start, end, selectMode);
    }
    this.value = input.value;
  }

  stepUp(n?: number) {
    const input = this.workingInput();
    input.stepUp(n);
    this.value = input.value;
  }

  stepDown(n?: number) {
    const input = this.workingInput();
    input.stepDown(n);
    this.value = input.value;
  }

  /** Opens the browser's picker for date, time and similar types. Needs a rendered, focusable field. */
  showPicker() {
    this.inputEl?.showPicker();
  }

  checkValidity(): boolean {
    return this.internals.checkValidity();
  }

  /** Like `checkValidity()`, but also shows the browser's message at the field. */
  reportValidity(): boolean {
    return this.internals.reportValidity();
  }

  setCustomValidity(message: string) {
    this.customValidityMessage = message;
    // Before the first render, updated() applies the stored message
    if (this.inputEl) this.syncValidity();
  }

  // --- Internals ---

  /**
   * The inner input, or before the first render a detached one set up with the
   * same type, constraints and value, so value helpers work at any time.
   */
  private workingInput(): HTMLInputElement {
    if (this.inputEl) return this.inputEl;
    const input = document.createElement("input");
    input.type = this.type;
    if (this.min !== undefined) input.min = this.min;
    if (this.max !== undefined) input.max = this.max;
    if (this.step !== undefined) input.step = this.step;
    input.value = this.value;
    return input;
  }

  /** Mirrors the inner input's validity to the form, then updates the error styling to match. */
  private syncValidity() {
    if (!this.inputEl) return;
    this.inputEl.setCustomValidity(this.customValidityMessage);
    const { validity, validationMessage } = this.inputEl;
    // A readonly input is barred from constraint validation, like a native one,
    // so it never blocks submission with an error the user can't fix
    if (validity.valid || this.readonly) {
      this.internals.setValidity({});
    } else {
      // Anchor to the inner input so the browser's message points at the field
      this.internals.setValidity(validity, validationMessage, this.inputEl);
    }
    this.syncUserValidity();
  }

  /**
   * Applies the error state directly to the DOM rather than through render(),
   * which runs before syncValidity() and so would always be one update behind.
   */
  private syncUserValidity() {
    const userInvalid = this.hasInteracted && !this.internals.validity.valid;
    const userValid = this.hasInteracted && !userInvalid;
    this.toggleAttribute("invalid", userInvalid);
    this.toggleAttribute("data-user-invalid", userInvalid);
    this.toggleAttribute("data-user-valid", userValid);
    this.inputEl?.setAttribute("aria-invalid", userInvalid ? "true" : "false");
    // Custom states aren't in every browser yet; the attributes cover those
    try {
      // tsconfig's lib lacks DOM.Iterable, which types CustomStateSet's Set methods
      const states = this.internals.states as unknown as Set<string>;
      if (userInvalid) states.add("user-invalid");
      else states.delete("user-invalid");
      if (userValid) states.add("user-valid");
      else states.delete("user-valid");
    } catch {
      // Unsupported, or an older browser that only accepts "--name" states
    }
  }

  private emit(name: string) {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }));
  }

  private handleInput = () => {
    // The native input event is composed, so it already reaches host listeners
    this.value = this.inputEl.value;
    this.emit("kd-input");
  };

  private handleChange = () => {
    this.hasInteracted = true;
    // Native change isn't composed, so re-dispatch it from the host
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    this.emit("kd-change");
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    // The inner input isn't in the form, so do implicit submission ourselves
    const hasModifier = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (event.key !== "Enter" || hasModifier || event.isComposing || event.defaultPrevented) return;
    const form = this.internals.form;
    if (!form) return;
    // Let the keydown finish first, so listeners can still cancel it
    setTimeout(() => {
      if (!event.defaultPrevented) KdInput.implicitlySubmit(form);
    });
  };

  /**
   * Native implicit submission: click the form's default (first) submit button,
   * so its click handlers and formaction run; or with no submit button, submit
   * only when there's a single text-like field.
   */
  private static implicitlySubmit(form: HTMLFormElement) {
    const elements = Array.from(form.elements);
    const defaultButton = elements.find(
      (el) =>
        (el instanceof HTMLButtonElement && el.type === "submit") ||
        (el instanceof HTMLInputElement && (el.type === "submit" || el.type === "image")) ||
        (el.localName === "kd-button" && el.getAttribute("type") === "submit"),
    ) as HTMLElement | undefined;

    if (defaultButton) {
      if (!defaultButton.matches(":disabled")) defaultButton.click();
      return;
    }

    const blockingFields = elements.filter(
      (el) =>
        el.localName === "kd-input" ||
        (el instanceof HTMLInputElement && IMPLICIT_SUBMIT_BLOCKING_TYPES.has(el.type)),
    );
    if (blockingFields.length <= 1) form.requestSubmit();
  }

  private handleFocus = () => {
    this.hasFocus = true;
    this.emit("kd-focus");
  };

  private handleBlur = () => {
    this.hasFocus = false;
    this.emit("kd-blur");
  };

  private handleClear = (event: MouseEvent) => {
    event.preventDefault();
    this.value = "";
    this.hasInteracted = true;
    this.inputEl.focus();
    this.emit("kd-clear");
    this.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
    this.emit("kd-input");
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    this.emit("kd-change");
  };

  private togglePasswordVisibility = () => {
    this.passwordVisible = !this.passwordVisible;
  };

  private handleLabelSlotChange = (event: Event) => {
    this.hasLabelSlot = (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };

  /** Whether any slot with one of these names has assigned content. */
  private hasSlotted(...names: string[]): boolean {
    return names.some((name) => {
      const slot = this.renderRoot.querySelector<HTMLSlotElement>(`slot[name="${name}"]`);
      return (slot?.assignedNodes({ flatten: true }).length ?? 0) > 0;
    });
  }

  private handleHintSlotChange = () => {
    this.hasHintSlot = this.hasSlotted("hint", "help-text");
  };

  private handleStartSlotChange = () => {
    this.hasStartSlot = this.hasSlotted("start", "prefix");
  };

  private handleEndSlotChange = () => {
    this.hasEndSlot = this.hasSlotted("end", "suffix");
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "kd-input": KdInput;
  }
}
