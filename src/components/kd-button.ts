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
      gap: 0.5rem;
      font: inherit;
      font-family: var(--kd-font-family);
      font-weight: 400;
      font-size: 1rem;
      height: 48px;
      padding: 0 1rem;
      border: 2px solid transparent;
      cursor: pointer;
      background-color: var(--kd-primary-color);
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
      border-color: var(--kd-primary-color);
      color: var(--kd-primary-color);
    }

    :host([appearance="outline"]) button:hover {
      background-color: var(--kd-primary-hover);
      border-color: transparent;
      color: inherit;
      box-shadow: none;
    }

    ::slotted(svg) {
      width: 16px;
      height: 16px;
      fill: var(--kd-icon-color, rgba(91, 88, 93));
    }
  `;
  @property() label = "Click me";

  @property({ reflect: true }) appearance: "solid" | "outline" = "solid";

  @state() private textColor = "#000000";

  @query("button") private buttonEl!: HTMLButtonElement;

  render() {
    const styles =
      this.appearance === "solid" ? { color: this.textColor } : {};

    return html`<button
      type="button"
      style=${styleMap(styles)}
    >
      <slot></slot>
    </button>`;
  }

  firstUpdated() {
    this.updateContrastColor();
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

}

declare global {
  interface HTMLElementTagNameMap {
    "kd-button": KdButton;
  }
}