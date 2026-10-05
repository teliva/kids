import { LitElement, css, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";

/**
 * A single collapsible section: a header button that toggles a content
 * region. Works standalone, or inside `<kd-accordion>`, which coordinates
 * single-open behavior and arrow-key navigation between headers.
 *
 * ```html
 * <kd-accordion-item open>
 *   <span slot="header">Fabric <kd-badge variant="warning">Incomplete</kd-badge></span>
 *   ...content...
 * </kd-accordion-item>
 * ```
 *
 * @fires kd-toggle - When the user opens or closes the item. `detail: { open }`.
 */
@customElement("kd-accordion-item")
export class KdAccordionItem extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--kd-font-family);
      border-bottom: 1px solid var(--kd-color-gray-20);
    }

    h3 {
      margin: 0;
      font: inherit;
    }

    .header {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: var(--kd-space-component-gap-sm);
      width: 100%;
      min-height: var(--kd-space-component-height-md);
      padding-block: var(--kd-space-component-padding-md-y);
      padding-inline: var(--kd-space-component-padding-md-x);
      font: inherit;
      font-size: var(--kd-font-size-md);
      font-weight: 600;
      line-height: var(--kd-line-height-normal);
      text-align: start;
      color: var(--kd-color-gray-90);
      background-color: transparent;
      border: 0;
      border-radius: var(--kd-radius-md);
      cursor: pointer;
      user-select: none;
      transition:
        background-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    :host([size="sm"]) .header {
      min-height: var(--kd-space-component-height-sm);
      padding-block: var(--kd-space-component-padding-sm-y);
      padding-inline: var(--kd-space-component-padding-sm-x);
      font-size: var(--kd-font-size-sm);
      line-height: var(--kd-line-height-snug);
    }

    :host([size="lg"]) .header {
      min-height: var(--kd-space-component-height-lg);
      padding-block: var(--kd-space-component-padding-lg-y);
      padding-inline: var(--kd-space-component-padding-lg-x);
      font-size: var(--kd-font-size-lg);
    }

    .header:not(:disabled):hover {
      background-color: var(--kd-color-gray-10);
    }

    .header:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px
        color-mix(in srgb, var(--kd-color-brand) 35%, transparent);
    }

    :host([disabled]) .header {
      cursor: not-allowed;
      color: var(--kd-color-gray-40);
    }

    .label {
      flex: 1;
      min-width: 0;
    }

    /* Rich header: lay out text and trailing extras (e.g. a badge) in a row */
    ::slotted([slot="header"]) {
      display: inline-flex;
      align-items: center;
      gap: var(--kd-space-component-gap-sm);
      max-width: 100%;
    }

    .chevron {
      display: inline-flex;
      flex-shrink: 0;
      width: 1.25rem;
      height: 1.25rem;
      color: var(--kd-color-gray-60);
      transition: transform 0.2s ease;
    }

    :host([open]) .chevron {
      transform: rotate(180deg);
    }

    /* Height animates via grid rows (0fr -> 1fr), so no JS measuring */
    .panel {
      display: grid;
      grid-template-rows: 0fr;
      visibility: hidden;
      transition:
        grid-template-rows 0.2s ease,
        visibility 0.2s;
    }

    :host([open]) .panel {
      grid-template-rows: 1fr;
      visibility: visible;
    }

    .panel-inner {
      min-height: 0;
      overflow: hidden;
    }

    .content {
      padding-inline: var(--kd-space-component-padding-md-x);
      padding-bottom: var(--kd-space-layout-gap-md);
    }

    :host([size="sm"]) .content {
      padding-inline: var(--kd-space-component-padding-sm-x);
      padding-bottom: var(--kd-space-layout-gap-sm);
    }

    :host([size="lg"]) .content {
      padding-inline: var(--kd-space-component-padding-lg-x);
    }

    @media (prefers-reduced-motion: reduce) {
      .panel,
      .chevron {
        transition: none;
      }
    }
  `;

  @property({ type: Boolean, reflect: true }) open = false;

  @property({ type: Boolean, reflect: true }) disabled = false;

  @property({ reflect: true }) size: "sm" | "md" | "lg" = "md";

  @query(".header") private headerEl!: HTMLButtonElement;

  render() {
    return html`
      <h3>
        <button
          class="header"
          part="header"
          id="header"
          type="button"
          aria-expanded=${this.open ? "true" : "false"}
          aria-controls="panel"
          ?disabled=${this.disabled}
          @click=${this.handleClick}
        >
          <span class="label" part="label">
            <slot name="header"></slot>
          </span>
          <span class="chevron" part="chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="m6 9 6 6 6-6"></path>
            </svg>
          </span>
        </button>
      </h3>
      <div class="panel" part="panel" id="panel" role="region" aria-labelledby="header">
        <div class="panel-inner">
          <div class="content" part="content">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }

  /** Focuses the header button (used by `<kd-accordion>` for arrow-key navigation). */
  focus(options?: FocusOptions) {
    this.headerEl.focus(options);
  }

  private handleClick = () => {
    if (this.disabled) return;
    this.open = !this.open;
    this.dispatchEvent(
      new CustomEvent("kd-toggle", {
        bubbles: true,
        composed: true,
        detail: { open: this.open },
      })
    );
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "kd-accordion-item": KdAccordionItem;
  }
}
