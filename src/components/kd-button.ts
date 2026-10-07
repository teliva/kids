import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { getContrastTextColor } from "../utils/contrast-color";
import "./kd-spinner";

@customElement("kd-button")
export class KdButton extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
      --kd-button-color: var(--kd-color-brand);
      --kd-button-hover-color: var(--kd-color-brand-hover);
      --kd-button-active-color: var(--kd-color-brand-active);
    }

    :host([variant="neutral"]) {
      --kd-button-color: var(--kd-color-neutral);
      --kd-button-hover-color: var(--kd-color-neutral-hover);
      --kd-button-active-color: var(--kd-color-neutral-active);
    }

    :host([variant="success"]) {
      --kd-button-color: var(--kd-color-success);
      --kd-button-hover-color: var(--kd-color-success-hover);
      --kd-button-active-color: var(--kd-color-success-active);
    }

    :host([variant="warning"]) {
      --kd-button-color: var(--kd-color-warning);
      --kd-button-hover-color: var(--kd-color-warning-hover);
      --kd-button-active-color: var(--kd-color-warning-active);
    }

    :host([variant="danger"]) {
      --kd-button-color: var(--kd-color-danger);
      --kd-button-hover-color: var(--kd-color-danger-hover);
      --kd-button-active-color: var(--kd-color-danger-active);
    }

    button {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font: inherit;
      font-family: var(--kd-font-family);
      font-weight: 400;
      font-size: var(--kd-font-size-md);
      line-height: var(--kd-line-height-normal);
      height: var(--kd-space-component-height-md);
      padding-inline: var(--kd-space-component-padding-md-x);
      border: 1px solid transparent;
      cursor: pointer;
      background-color: var(--kd-button-color);
      border-radius: var(--kd-radius-md);
      user-select: none;
      white-space: nowrap;
      transition:
        background-color 0.15s ease,
        border-color 0.15s ease,
        box-shadow 0.15s ease,
        transform 0.1s ease;
    }

    button:not(:disabled):hover {
      background-color: var(--kd-button-hover-color);
      box-shadow: var(--kd-box-shadow-sm);
    }

    button:not(:disabled):active {
      background-color: var(--kd-button-active-color);
      transform: scale(0.96);
    }

    :host([pill]) button {
      border-radius: var(--kd-radius-pill);
    }

    :host([size="sm"]) button {
      height: var(--kd-space-component-height-sm);
    }

    :host([size="lg"]) button {
      height: var(--kd-space-component-height-lg);
    }

    :host([appearance="outline"]) button {
      background-color: transparent;
      border-color: var(--kd-button-color);
      color: var(--kd-button-color);
    }

    :host([appearance="outline"]) button:not(:disabled):hover {
      background-color: color-mix(in srgb, var(--kd-button-color) 15%, white 85%);
      box-shadow: none;
    }

    :host([appearance="outline"]) button:not(:disabled):active {
      background-color: transparent;
    }

    :host([appearance="plain"]) button {
      background-color: transparent;
      border-color: transparent;
      padding: var(--kd-space-component-padding-md-y);
    }

    :host([appearance="plain"]) button:not(:disabled):hover {
      background-color: var(--kd-plain-hover, var(--kd-color-gray-20));
      box-shadow: none;
    }

    :host([appearance="plain"]) button:not(:disabled):active {
      background-color: var(--kd-plain-active, var(--kd-color-gray-30));
    }

    /* Icon-only: rounded square (circle with pill), sized by control height */
    button.icon-only {
      aspect-ratio: 1;
      padding: 0;
    }

    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .icon[hidden] {
      display: none;
    }

    ::slotted([slot="icon"]) {
      width: 1.25rem;
      height: 1.25rem;
      color: var(--kd-icon-color, var(--kd-button-color));
    }

    /* Badge: pinned to the top-right corner, centered on the edge */
    .badge {
      position: absolute;
      top: 0;
      right: 0;
      transform: translate(50%, -50%);
      display: inline-flex;
      pointer-events: none;
    }

    /* Pull in from the bounding-box corner so it sits on the rounded edge */
    :host([pill]) .badge {
      top: 0.375rem;
      right: 0.375rem;
    }

    .badge[hidden] {
      display: none;
    }

    /* Loading: hide content (keeping its width) and overlay the spinner */
    button {
      position: relative;
    }

    kd-spinner {
      position: absolute;
      inset: 0;
      margin: auto;
      --size: 1.25rem;
      --indicator-color: currentColor;
      --track-color: color-mix(in srgb, currentColor 30%, transparent);
    }

    :host([loading]) button {
      cursor: progress;
    }

    :host([loading]) button:active {
      transform: none;
    }

    :host([loading]) .icon,
    :host([loading]) .label {
      visibility: hidden;
    }

    :host([disabled]) button {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;
  @property({ reflect: true }) appearance: "solid" | "outline" | "plain" = "solid";

  @property({ reflect: true }) variant: "neutral" | "brand" | "success" | "warning" | "danger" = "brand";

  @property({ type: Boolean, reflect: true }) pill = false;

  @property({ reflect: true }) size: "sm" | "md" | "lg" = "md";

  @property({ type: Boolean, reflect: true }) loading = false;

  @property({ type: Boolean, reflect: true }) disabled = false;

  @state() private textColor = "#000000";

  @state() private hasIcon = false;

  @state() private hasLabel = false;

  @state() private hasBadge = false;

  @query("button") private buttonEl!: HTMLButtonElement;

  @query('slot[name="icon"]') private iconSlotEl!: HTMLSlotElement;

  @query('slot[name="label"]') private labelSlotEl!: HTMLSlotElement;

  @query('slot[name="badge"]') private badgeSlotEl!: HTMLSlotElement;

  render() {
    const styles = {
      ...(this.appearance === "solid" ? { color: this.textColor } : {}),
      gap: this.hasIcon && this.hasLabel ? "0.5rem" : "0rem",
    };

    return html`<button
      type="button"
      class=${this.hasIcon && !this.hasLabel ? "icon-only" : ""}
      style=${styleMap(styles)}
      ?disabled=${this.disabled}
      aria-busy=${this.loading ? "true" : "false"}
      aria-disabled=${this.loading ? "true" : "false"}
      @click=${this.handleClick}
    >
      ${this.loading
        ? html`<kd-spinner part="spinner" aria-hidden="true"></kd-spinner>`
        : null}
      <span class="icon" part="icon" ?hidden=${!this.hasIcon}>
        <slot name="icon" @slotchange=${this.handleIconSlotChange}></slot>
      </span>
      <span class="label" part="label">
        <slot name="label" @slotchange=${this.handleLabelSlotChange}></slot>
      </span>
      <span class="badge" part="badge" ?hidden=${!this.hasBadge}>
        <slot name="badge" @slotchange=${this.handleBadgeSlotChange}></slot>
      </span>
    </button>`;
  }

  firstUpdated() {
    this.updateContrastColor();
    this.handleIconSlotChange();
    this.handleLabelSlotChange();
    this.handleBadgeSlotChange();
    this.buttonEl.addEventListener("pointerenter", this.updateContrastColor);
    this.buttonEl.addEventListener("pointerleave", this.updateContrastColor);
  }

  updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("appearance") || changedProperties.has("variant")) {
      this.updateContrastColor();
    }
  }

  private updateContrastColor = () => {
    if (this.appearance !== "solid") {
      this.style.removeProperty("--kd-icon-color");
      return;
    }

    const backgroundColor = getComputedStyle(this.buttonEl).backgroundColor;
    this.textColor = getContrastTextColor(backgroundColor);
    this.style.setProperty("--kd-icon-color", this.textColor);
  };

  // Block activation while loading without using `disabled`, so the
  // button keeps keyboard focus. Also guards disabled, in case a click on
  // slotted content still reaches the inner button.
  private handleClick = (e: MouseEvent) => {
    if (!this.loading && !this.disabled) return;
    e.preventDefault();
    e.stopPropagation();
  };

  private handleIconSlotChange = () => {
    this.hasIcon = this.iconSlotEl.assignedNodes({ flatten: true }).length > 0;
  };

  private handleLabelSlotChange = () => {
    this.hasLabel = this.labelSlotEl.assignedNodes({ flatten: true }).length > 0;
  };

  private handleBadgeSlotChange = () => {
    this.hasBadge = this.badgeSlotEl.assignedNodes({ flatten: true }).length > 0;
  };

}

declare global {
  interface HTMLElementTagNameMap {
    "kd-button": KdButton;
  }
}