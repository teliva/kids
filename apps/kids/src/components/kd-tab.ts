import { LitElement, css, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";

/**
 * A single selectable tab. Square by default, sized by the shared control
 * height tokens. Exclusive selection across tabs is managed by the parent
 * (e.g. listen for `kd-select` and clear `selected` on siblings).
 *
 * ```html
 * <kd-tab size="sm" selected>1</kd-tab>
 * ```
 */
@customElement("kd-tab")
export class KdTab extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      font-family: var(--kd-font-family);
    }

    button {
      box-sizing: border-box;
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: var(--kd-space-component-height-md);
      min-width: var(--kd-space-component-height-md);
      padding-inline: var(--kd-space-component-padding-sm-x);
      font: inherit;
      font-size: var(--kd-font-size-md);
      font-weight: 400;
      line-height: 1;
      color: var(--kd-color-gray-70);
      background-color: transparent;
      border: 1px solid transparent;
      border-radius: var(--kd-radius-md);
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      transition:
        background-color 0.2s ease,
        color 0.2s ease,
        box-shadow 0.2s ease;
    }

    :host([size="sm"]) button {
      height: var(--kd-space-component-height-sm);
      min-width: var(--kd-space-component-height-sm);
      font-size: var(--kd-font-size-sm);
    }

    :host([size="lg"]) button {
      height: var(--kd-space-component-height-lg);
      min-width: var(--kd-space-component-height-lg);
      font-size: var(--kd-font-size-lg);
    }

    button:not(:disabled):hover {
      background-color: var(--kd-color-gray-20);
      color: var(--kd-color-gray-90);
    }

    button:not(:disabled):active {
      background-color: var(--kd-color-gray-30);
    }

    :host([selected]) button,
    :host([selected]) button:not(:disabled):hover {
      background-color: var(--kd-color-brand-95);
      border-color: var(--kd-color-brand-80);
      color: var(--kd-color-brand);
      font-weight: 600;
    }

    button:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px
        color-mix(in srgb, var(--kd-color-brand) 35%, transparent);
    }

    :host([disabled]) button {
      cursor: not-allowed;
      color: var(--kd-color-gray-40);
    }
  `;

  /** Identifies this tab to the parent; defaults to its text content. */
  @property() value = "";

  @property({ type: Boolean, reflect: true }) selected = false;

  @property({ type: Boolean, reflect: true }) disabled = false;

  @property({ reflect: true }) size: "sm" | "md" | "lg" = "md";

  @query("button") private buttonEl!: HTMLButtonElement;

  render() {
    return html`
      <button
        part="base"
        type="button"
        role="tab"
        aria-selected=${this.selected ? "true" : "false"}
        ?disabled=${this.disabled}
        @click=${this.handleClick}
      >
        <slot></slot>
      </button>
    `;
  }

  focus(options?: FocusOptions) {
    this.buttonEl.focus(options);
  }

  private handleClick = () => {
    if (this.selected) return;
    this.selected = true;
    this.dispatchEvent(
      new CustomEvent("kd-select", {
        bubbles: true,
        composed: true,
        detail: { value: this.value || this.textContent?.trim() || "" },
      })
    );
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "kd-tab": KdTab;
  }
}
