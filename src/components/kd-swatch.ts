import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { classMap } from "lit/directives/class-map.js";
import "./kd-spinner";

export type SwatchStatus = "loading" | "loaded" | "error";

/**
 * A single selectable finish/fabric swatch. The radio input lives in this
 * element's shadow root, so `name` does not group swatches natively — the
 * host page must enforce exclusive selection (listen for `kd-change`).
 *
 * ```html
 * <kd-swatch value="kfi_1504" label="Ballistic Blue" src="https://.../BB(U)-sm.jpg"></kd-swatch>
 * ```
 */
@customElement("kd-swatch")
export class KdSwatch extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      font-family: var(--kd-font-family);
      --size: 64px;
    }

    .control {
      display: inline-flex;
      position: relative;
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

    .swatch {
      position: relative;
      width: var(--size);
      height: var(--size);
      border-radius: var(--kd-radius-sm);
      overflow: hidden;
      background: var(--kd-color-gray-10);
      outline: 2px solid transparent;
      outline-offset: 1px;
      transition:
        outline-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .control:hover .swatch {
      box-shadow: var(--kd-box-shadow-s);
    }

    :host([checked]) .swatch {
      outline-color: var(--kd-color-brand);
    }

    .input:focus-visible ~ .swatch {
      box-shadow: 0 0 0 3px
        color-mix(in srgb, var(--kd-color-brand) 35%, transparent);
    }

    .image {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .image.loaded {
      opacity: 1;
    }

    .fallback {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--kd-color-gray-20);
      color: var(--kd-color-gray-50);
    }

    .fallback svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    kd-spinner {
      position: absolute;
      inset: 0;
      margin: auto;
      --size: 1.25rem;
    }

    .badge {
      position: absolute;
      right: 3px;
      bottom: 3px;
      width: 1rem;
      height: 1rem;
      border-radius: var(--kd-radius-full);
      background: var(--kd-color-brand);
      color: contrast-color(var(--kd-color-brand));
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 2px var(--kd-color-gray-05);
    }

    .badge svg {
      width: 0.625rem;
      height: 0.625rem;
    }
  `;

  @property() name = "";

  @property() value = "";

  @property() label = "";

  @property() src = "";

  @property({ type: Boolean, reflect: true }) checked = false;

  @property({ type: Boolean, reflect: true }) disabled = false;

  @state() private status: SwatchStatus = "loading";

  @query(".input") private inputEl!: HTMLInputElement;

  render() {
    return html`
      <label class="control" part="control">
        <input
          class="input"
          part="input"
          type="radio"
          name=${ifDefined(this.name || undefined)}
          value=${this.value}
          .checked=${this.checked}
          ?disabled=${this.disabled}
          aria-label=${this.label || this.value}
          @change=${this.handleChange}
          @focus=${this.handleFocus}
          @blur=${this.handleBlur}
        />
        <span class="swatch" part="swatch">
          <img
            class=${classMap({ image: true, loaded: this.status === "loaded" })}
            part="image"
            src=${this.src}
            alt=""
            loading="lazy"
            decoding="async"
            @load=${this.handleLoad}
            @error=${this.handleError}
          />
          ${this.status === "loading"
            ? html`<kd-spinner part="spinner"></kd-spinner>`
            : null}
          ${this.status === "error"
            ? html`<span class="fallback" part="fallback" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m21 15-5-5L5 21" />
                  <path d="M21 3 3 21" />
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
              </span>`
            : null}
          ${this.checked
            ? html`<span class="badge" part="badge" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>`
            : null}
        </span>
      </label>
    `;
  }

  updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("src")) {
      this.status = "loading";
    }
  }

  focus(options?: FocusOptions) {
    this.inputEl.focus(options);
  }

  click() {
    this.inputEl.click();
  }

  private handleLoad = () => {
    this.status = "loaded";
  };

  private handleError = () => {
    this.status = "error";
  };

  private handleChange = () => {
    this.checked = this.inputEl.checked;
    this.dispatchEvent(new CustomEvent("kd-input", { bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent("kd-change", { bubbles: true, composed: true }));
  };

  private handleFocus = () => {
    this.dispatchEvent(new CustomEvent("kd-focus", { bubbles: true, composed: true }));
  };

  private handleBlur = () => {
    this.dispatchEvent(new CustomEvent("kd-blur", { bubbles: true, composed: true }));
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "kd-swatch": KdSwatch;
  }
}
