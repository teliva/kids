import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { getContrastTextColor } from "../utils/contrast-color";

@customElement("kd-button")
export class KdButton extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font: inherit;
      font-family: var(--kd-font-family);
      font-weight: 400;
      font-size: 1rem;
      line-height: 1.5;
      padding: 0.625rem 1rem;
      border: 2px solid transparent;
      cursor: pointer;
      background-color: var(--kd-brand-color);
      border-radius: 9999px;
      user-select: none;
      white-space: nowrap;
      transition:
        background-color 0.15s ease,
        border-color 0.15s ease,
        box-shadow 0.15s ease,
        transform 0.1s ease;
    }

    button:hover {
      background-color: var(--kd-primary-hover);
      box-shadow: var(--kd-box-shadow-s);
    }

    button:active {
      transform: scale(0.96);
    }

    :host([appearance="outline"]) button {
      background-color: transparent;
      border-color: var(--kd-brand-color);
      color: var(--kd-brand-color);
    }

    :host([appearance="outline"]) button:hover {
      background-color: var(--kd-primary-hover);
      border-color: transparent;
      color: inherit;
      box-shadow: none;
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
      fill: var(--kd-icon-color, rgba(91, 88, 93));
    }
  `;
  @property({ reflect: true }) appearance: "solid" | "outline" = "solid";

  @state() private textColor = "#000000";

  @state() private hasIcon = false;

  @state() private hasLabel = false;

  @query("button") private buttonEl!: HTMLButtonElement;

  @query('slot[name="icon"]') private iconSlotEl!: HTMLSlotElement;

  @query('slot[name="label"]') private labelSlotEl!: HTMLSlotElement;

  render() {
    const styles = {
      ...(this.appearance === "solid" ? { color: this.textColor } : {}),
      gap: this.hasIcon && this.hasLabel ? "0.5rem" : "0rem",
    };

    return html`<button type="button" style=${styleMap(styles)}>
      <span class="icon" part="icon" ?hidden=${!this.hasIcon}>
        <slot name="icon" @slotchange=${this.handleIconSlotChange}></slot>
      </span>
      <span class="label" part="label">
        <slot name="label" @slotchange=${this.handleLabelSlotChange}></slot>
      </span>
    </button>`;
  }

  firstUpdated() {
    this.updateContrastColor();
    this.handleIconSlotChange();
    this.handleLabelSlotChange();
  }

  updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("appearance")) {
      this.updateContrastColor();
    }
  }

  private updateContrastColor() {
    if (this.appearance !== "solid") {
      this.style.removeProperty("--kd-icon-color");
      return;
    }

    const backgroundColor = getComputedStyle(this.buttonEl).backgroundColor;
    this.textColor = getContrastTextColor(backgroundColor);
    this.style.setProperty("--kd-icon-color", this.textColor);
  }

  private handleIconSlotChange = () => {
    this.hasIcon = this.iconSlotEl.assignedNodes({ flatten: true }).length > 0;
  };

  private handleLabelSlotChange = () => {
    this.hasLabel = this.labelSlotEl.assignedNodes({ flatten: true }).length > 0;
  };

}

declare global {
  interface HTMLElementTagNameMap {
    "kd-button": KdButton;
  }
}