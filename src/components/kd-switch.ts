import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";

export type SwitchSize = "small" | "medium" | "large";

/**
 * ```html
 * <kd-switch label="Enable notifications" checked></kd-switch>
 * ```
 */
@customElement("kd-switch")
export class KdSwitch extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      font-family: var(--kd-font-family);
    }

    .control {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
      cursor: pointer;
    }

    :host([disabled]) .control {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .input {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .track {
      flex: none;
      position: relative;
      display: inline-flex;
      align-items: center;
      width: 2.75rem;
      height: 1.5rem;
      border: 2px solid var(--kd-switch-border-color, var(--kd-neutral-color));
      border-radius: 9999px;
      background: var(--kd-switch-background, var(--kd-neutral-color));
      transition:
        background-color 0.15s ease,
        border-color 0.15s ease,
        box-shadow 0.15s ease;
    }

    .thumb {
      position: absolute;
      top: 50%;
      left: 1px;
      width: 1.125rem;
      height: 1.125rem;
      border-radius: 50%;
      background: var(--kd-switch-thumb-color, #fff);
      box-shadow: var(--kd-box-shadow-s);
      translate: 0 -50%;
      transition:
        translate 0.15s ease,
        box-shadow 0.15s ease;
    }

    .control:hover .thumb {
      box-shadow:
        0 0 0 4px color-mix(in srgb, var(--kd-neutral-color) 80%, transparent),
        var(--kd-box-shadow-s);
    }

    :host([disabled]) .control:hover .thumb {
      box-shadow: var(--kd-box-shadow-s);
    }

    :host([checked]) .track {
      border-color: var(--kd-color-brand);
      background: var(--kd-color-brand);
    }

    :host([checked]) .control:hover .thumb {
      box-shadow:
        0 0 0 4px color-mix(in srgb, var(--kd-color-brand) 25%, transparent),
        var(--kd-box-shadow-s);
    }

    :host([checked]) .thumb {
      translate: 1.25rem -50%;
    }

    .input:focus-visible ~ .track {
      box-shadow: 0 0 0 3px
        color-mix(in srgb, var(--kd-color-brand) 35%, transparent);
    }

    :host([invalid]) .track {
      border-color: var(--kd-switch-invalid-color, #b40c12);
    }

    :host([invalid]) .input:focus-visible ~ .track {
      box-shadow: 0 0 0 3px
        color-mix(in srgb, var(--kd-switch-invalid-color, #b40c12) 30%, transparent);
    }

    .label {
      font-size: 0.875rem;
      color: var(--kd-switch-label-color, inherit);
    }

    :host([required]) .label::after {
      content: " *";
      color: var(--kd-switch-invalid-color, #b40c12);
    }

    .help-text {
      margin-top: 0.375rem;
      margin-left: 3.375rem;
      font-size: 0.75rem;
      color: var(--kd-switch-help-text-color, rgba(0, 0, 0, 0.6));
    }

    /* size: small */
    :host([size="small"]) .track {
      width: 2.25rem;
      height: 1.25rem;
    }

    :host([size="small"]) .thumb {
      width: 0.875rem;
      height: 0.875rem;
    }

    :host([size="small"][checked]) .thumb {
      translate: 1rem -50%;
    }

    :host([size="small"]) .label {
      font-size: 0.8125rem;
    }

    /* size: large */
    :host([size="large"]) .track {
      width: 3.25rem;
      height: 1.75rem;
    }

    :host([size="large"]) .thumb {
      width: 1.375rem;
      height: 1.375rem;
    }

    :host([size="large"][checked]) .thumb {
      translate: 1.5rem -50%;
    }

    :host([size="large"]) .label {
      font-size: 1rem;
    }
  `;

  @property() name = "";

  @property() value = "on";

  @property() label = "";

  @property({ attribute: "help-text" }) helpText = "";

  @property({ reflect: true }) size: SwitchSize = "medium";

  @property({ type: Boolean, reflect: true }) checked = false;

  @property({ type: Boolean, reflect: true }) disabled = false;

  @property({ type: Boolean, reflect: true }) required = false;

  @property({ type: Boolean, reflect: true }) invalid = false;

  @query(".input") private inputEl!: HTMLInputElement;

  render() {
    return html`
      <label class="control" part="control">
        <input
          id="input"
          class="input"
          part="input"
          type="checkbox"
          name=${ifDefined(this.name || undefined)}
          value=${this.value}
          .checked=${this.checked}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-invalid=${this.invalid ? "true" : "false"}
          @change=${this.handleChange}
          @focus=${this.handleFocus}
          @blur=${this.handleBlur}
        />
        <span class="track" part="track">
          <span class="thumb" part="thumb"></span>
        </span>
        ${this.label
          ? html`<span class="label" part="label"
              ><slot>${this.label}</slot></span
            >`
          : html`<slot></slot>`}
      </label>
      ${this.helpText
        ? html`<div class="help-text" part="help-text">
            <slot name="help-text">${this.helpText}</slot>
          </div>`
        : null}
    `;
  }

  updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("checked")) {
      this.updateValidity();
    }
  }

  focus(options?: FocusOptions) {
    this.inputEl.focus(options);
  }

  blur() {
    this.inputEl.blur();
  }

  click() {
    this.inputEl.click();
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

  private handleChange = () => {
    this.checked = this.inputEl.checked;
    this.dispatchEvent(new CustomEvent("kd-input", { bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent("kd-change", { bubbles: true, composed: true }));
  };

  private handleFocus = () => {
    this.dispatchEvent(new CustomEvent("kd-focus", { bubbles: true, composed: true }));
  };

  private handleBlur = () => {
    this.updateValidity();
    this.dispatchEvent(new CustomEvent("kd-blur", { bubbles: true, composed: true }));
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "kd-switch": KdSwitch;
  }
}
