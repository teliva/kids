import { LitElement, css, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * A thin line that visually separates content, horizontally or vertically.
 * The host itself draws the line, so it has no shadow content.
 *
 * Customize with `--kd-divider-color` and `--kd-divider-width`
 *
 * ```html
 * <kd-divider></kd-divider>
 * <kd-divider orientation="vertical"></kd-divider>
 * ```
 */
@customElement("kd-divider")
export class KdDivider extends LitElement {
  static styles = css`
    /* Fallbacks (not :host declarations) so the props can also inherit from an ancestor */
    :host {
      --_color: var(--kd-divider-color, var(--kd-color-gray-20));
      --_width: var(--kd-divider-width, 1px);
    }

    :host(:not([orientation="vertical"])) {
      display: block;
      border-top: solid var(--_width) var(--_color);
    }

    /* Stretches to the parent's height; min-height keeps it visible inline */
    :host([orientation="vertical"]) {
      display: inline-block;
      align-self: stretch;
      height: auto;
      min-height: 1em;
      vertical-align: middle;
      border-left: solid var(--_width) var(--_color);
    }
  `;

  @property({ reflect: true }) orientation: "horizontal" | "vertical" = "horizontal";

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "separator");
  }

  updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("orientation")) {
      this.setAttribute("aria-orientation", this.orientation);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kd-divider": KdDivider;
  }
}
