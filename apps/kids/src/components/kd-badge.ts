import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { getContrastTextColor } from "../utils/contrast-color.js";

/**
 * A small status/count label. Shares kd-button's `variant` and
 * `appearance` vocabulary; `plain` renders a soft tint of the variant color.
 *
 * ```html
 * <kd-badge variant="danger" pill>3</kd-badge>
 * ```
 */
@customElement("kd-badge")
export class KdBadge extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      --kd-badge-color: var(--kd-color-brand);
    }

    :host([variant="neutral"]) {
      --kd-badge-color: var(--kd-color-neutral);
    }

    :host([variant="success"]) {
      --kd-badge-color: var(--kd-color-success);
    }

    :host([variant="warning"]) {
      --kd-badge-color: var(--kd-color-warning);
    }

    :host([variant="danger"]) {
      --kd-badge-color: var(--kd-color-danger);
    }

    .badge {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--kd-space-1);
      font-family: var(--kd-font-family);
      font-weight: 600;
      font-size: var(--kd-font-size-xs);
      line-height: 1;
      height: 1.25rem;
      min-width: 1.25rem;
      padding-inline: var(--kd-space-1);
      border: 1px solid transparent;
      border-radius: var(--kd-radius-sm);
      background-color: var(--kd-badge-color);
      white-space: nowrap;
      user-select: none;
    }

    /* Icons scale with the badge's font size, overriding width/height attrs */
    ::slotted(svg),
    ::slotted(img) {
      flex-shrink: 0;
      width: 1.2em;
      height: 1.2em;
    }

    :host([pill]) .badge {
      border-radius: var(--kd-radius-pill);
    }

    :host([size="sm"]) .badge {
      height: 1rem;
      min-width: 1rem;
      font-size: 0.625rem;
    }

    :host([size="lg"]) .badge {
      height: 1.5rem;
      min-width: 1.5rem;
      padding-inline: var(--kd-space-2);
      font-size: var(--kd-font-size-sm);
    }

    :host([appearance="outline"]) .badge {
      background-color: transparent;
      border-color: var(--kd-badge-color);
      color: var(--kd-badge-color);
    }

    :host([appearance="plain"]) .badge {
      background-color: color-mix(in srgb, var(--kd-badge-color) 15%, white 85%);
      color: var(--kd-badge-color);
    }

    /* Icon-only: square (circle with pill), sized by badge height */
    .badge.icon-only {
      width: auto;
      aspect-ratio: 1;
      padding: 0;
    }

    /* Dot: no content, just a colored marker */
    :host([dot]) .badge {
      height: 0.625rem;
      min-width: 0.625rem;
      width: 0.625rem;
      padding: 0;
      border-radius: var(--kd-radius-full);
    }

    :host([dot]) slot {
      display: none;
    }
  `;

  @property({ reflect: true }) appearance: "solid" | "outline" | "plain" = "solid";

  @property({ reflect: true }) variant: "neutral" | "brand" | "success" | "warning" | "danger" = "brand";

  @property({ type: Boolean, reflect: true }) pill = false;

  @property({ reflect: true }) size: "sm" | "md" | "lg" = "md";

  /** Renders a small dot with no content (e.g. an unread indicator). */
  @property({ type: Boolean, reflect: true }) dot = false;

  @state() private textColor = "#000000";

  @state() private iconOnly = false;

  @query(".badge") private badgeEl!: HTMLSpanElement;

  render() {
    const styles = this.appearance === "solid" ? { color: this.textColor } : {};

    return html`<span
      class="badge ${this.iconOnly ? "icon-only" : ""}"
      part="base"
      style=${styleMap(styles)}
    >
      <slot @slotchange=${this.handleSlotChange}></slot>
    </span>`;
  }

  // Icon-only = exactly one svg/img element and no non-whitespace text.
  private handleSlotChange = (e: Event) => {
    const nodes = (e.target as HTMLSlotElement).assignedNodes({ flatten: true });
    const elements = nodes.filter((n): n is Element => n instanceof Element);
    const hasText = nodes.some(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()
    );
    this.iconOnly =
      !hasText &&
      elements.length === 1 &&
      ["svg", "img"].includes(elements[0].localName);
  };

  updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("appearance") || changedProperties.has("variant")) {
      this.updateContrastColor();
    }
  }

  private updateContrastColor() {
    if (this.appearance !== "solid") return;
    const backgroundColor = getComputedStyle(this.badgeEl).backgroundColor;
    this.textColor = getContrastTextColor(backgroundColor);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kd-badge": KdBadge;
  }
}
