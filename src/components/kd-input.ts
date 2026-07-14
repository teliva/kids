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
  | "url";

export type InputSize = "small" | "medium" | "large";

export type InputAppearance = "outline" | "filled";

/**
 * ```html
 * <kd-input label="Email" type="email" placeholder="you@example.com" clearable></kd-input>
 * ```
 */
@customElement("kd-input")
export class KdInput extends LitElement {
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
      margin-bottom: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--kd-input-label-color, inherit);
    }

    :host([required]) .label::after {
      content: " *";
      color: var(--kd-input-invalid-color, #b40c12);
    }

    .base {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      border: 1px solid var(--kd-input-border-color, var(--kd-neutral-color));
      border-radius: 8px;
      background: var(--kd-input-background, #fff);
      color: var(--kd-input-color, #1a1a1a);
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease,
        background-color 0.15s ease;
    }

    .base:hover {
      border-color: var(--kd-input-border-color-hover, var(--kd-primary-color));
    }

    .base.focused {
      border-color: var(--kd-primary-color);
      box-shadow: 0 0 0 3px
        color-mix(in srgb, var(--kd-primary-color) 35%, transparent);
    }

    :host([appearance="filled"]) .base {
      border-color: transparent;
      background: var(--kd-input-filled-background, var(--kd-neutral-color));
    }

    :host([appearance="filled"]) .base:hover {
      border-color: transparent;
    }

    :host([appearance="filled"]) .base.focused {
      border-color: var(--kd-primary-color);
      background: var(--kd-input-background, #fff);
    }

    :host([invalid]) .base {
      border-color: var(--kd-input-invalid-color, #b40c12);
    }

    :host([invalid]) .base.focused {
      box-shadow: 0 0 0 3px
        color-mix(in srgb, var(--kd-input-invalid-color, #b40c12) 30%, transparent);
    }

    :host([disabled]) .base {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* size: medium (default) */
    .base {
      height: 48px;
      padding: 0 1rem;
    }

    .input {
      font-size: 0.875rem;
    }

    :host([size="small"]) .base {
      height: 36px;
      padding: 0 0.75rem;
      border-radius: 6px;
    }

    :host([size="small"]) .input {
      font-size: 0.8125rem;
    }

    :host([size="large"]) .base {
      height: 56px;
      padding: 0 1.25rem;
      border-radius: 10px;
    }

    :host([size="large"]) .input {
      font-size: 1rem;
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

    .input::placeholder {
      color: var(--kd-input-placeholder-color, rgba(0, 0, 0, 0.4));
    }

    .input:disabled {
      cursor: not-allowed;
    }

    .prefix,
    .suffix {
      flex: none;
      display: inline-flex;
      align-items: center;
    }

    .prefix:empty,
    .suffix:empty {
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
      background: transparent;
      color: inherit;
      opacity: 0.6;
      cursor: pointer;
    }

    .icon-button:hover {
      opacity: 1;
    }

    .icon-button svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    .help-text {
      margin-top: 0.375rem;
      font-size: 0.75rem;
      color: var(--kd-input-help-text-color, rgba(0, 0, 0, 0.6));
    }
  `;

  @property() type: InputType = "text";

  @property() name = "";

  @property() value = "";

  @property() label = "";

  @property({ attribute: "help-text" }) helpText = "";

  @property() placeholder = "";

  @property({ reflect: true }) size: InputSize = "medium";

  @property({ reflect: true }) appearance: InputAppearance = "outline";

  @property({ type: Boolean, reflect: true }) disabled = false;

  @property({ type: Boolean, reflect: true }) readonly = false;

  @property({ type: Boolean, reflect: true }) required = false;

  @property({ type: Boolean, reflect: true }) clearable = false;

  @property({ type: Boolean, reflect: true }) invalid = false;

  @property() autocomplete?: string;

  @property() pattern?: string;

  @property() inputmode?: string;

  @property({ attribute: "minlength", type: Number }) minLength?: number;

  @property({ attribute: "maxlength", type: Number }) maxLength?: number;

  @property() min?: string;

  @property() max?: string;

  @property() step?: string;

  @state() private hasFocus = false;

  @state() private passwordVisible = false;

  @query(".input") private inputEl!: HTMLInputElement;

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

  render() {
    const isPassword = this.type === "password";
    const showClear =
      this.clearable && !this.disabled && !this.readonly && this.value.length > 0;

    return html`
      <div class="form-control" part="form-control">
        ${this.label
          ? html`<label class="label" part="label" for="input">
              <slot name="label">${this.label}</slot>
            </label>`
          : null}

        <div
          class=${classMap({ base: true, focused: this.hasFocus })}
          part="base"
        >
          <span class="prefix" part="prefix"><slot name="prefix"></slot></span>

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
            pattern=${ifDefined(this.pattern)}
            minlength=${ifDefined(this.minLength)}
            maxlength=${ifDefined(this.maxLength)}
            min=${ifDefined(this.min)}
            max=${ifDefined(this.max)}
            step=${ifDefined(this.step)}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            aria-invalid=${this.invalid ? "true" : "false"}
            @input=${this.handleInput}
            @change=${this.handleChange}
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
          ${isPassword
            ? html`<button
                class="icon-button password-toggle-button"
                part="password-toggle-button"
                type="button"
                tabindex="-1"
                aria-label=${this.passwordVisible ? "Hide password" : "Show password"}
                @click=${this.togglePasswordVisibility}
              >
                ${this.passwordVisible ? KdInput.eyeSlashIcon : KdInput.eyeIcon}
              </button>`
            : null}

          <span class="suffix" part="suffix"><slot name="suffix"></slot></span>
        </div>

        ${this.helpText
          ? html`<div class="help-text" part="help-text">
              <slot name="help-text">${this.helpText}</slot>
            </div>`
          : null}
      </div>
    `;
  }

  updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("value") && !this.hasFocus) {
      this.updateValidity();
    }
  }

  focus(options?: FocusOptions) {
    this.inputEl.focus(options);
  }

  blur() {
    this.inputEl.blur();
  }

  select() {
    this.inputEl.select();
  }

  get validity(): ValidityState {
    return this.inputEl.validity;
  }

  get validationMessage(): string {
    return this.inputEl.validationMessage;
  }

  checkValidity(): boolean {
    return this.inputEl.checkValidity();
  }

  reportValidity(): boolean {
    const valid = this.inputEl.reportValidity();
    this.updateValidity();
    return valid;
  }

  setCustomValidity(message: string) {
    this.inputEl.setCustomValidity(message);
    this.updateValidity();
  }

  private updateValidity() {
    this.invalid = !this.inputEl.checkValidity();
  }

  private handleInput = () => {
    this.value = this.inputEl.value;
    if (this.invalid) this.updateValidity();
    this.dispatchEvent(new CustomEvent("kd-input", { bubbles: true, composed: true }));
  };

  private handleChange = () => {
    this.dispatchEvent(new CustomEvent("kd-change", { bubbles: true, composed: true }));
  };

  private handleFocus = () => {
    this.hasFocus = true;
    this.dispatchEvent(new CustomEvent("kd-focus", { bubbles: true, composed: true }));
  };

  private handleBlur = () => {
    this.hasFocus = false;
    this.updateValidity();
    this.dispatchEvent(new CustomEvent("kd-blur", { bubbles: true, composed: true }));
  };

  private handleClear = (event: MouseEvent) => {
    event.preventDefault();
    this.value = "";
    this.inputEl.focus();
    this.dispatchEvent(new CustomEvent("kd-clear", { bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent("kd-input", { bubbles: true, composed: true }));
  };

  private togglePasswordVisibility = () => {
    this.passwordVisible = !this.passwordVisible;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "kd-input": KdInput;
  }
}
