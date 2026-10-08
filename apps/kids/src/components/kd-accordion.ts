import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, queryAssignedElements } from "lit/decorators.js";
import type { KdAccordionItem } from "./kd-accordion-item.js";
import "./kd-accordion-item.js";

/**
 * A stack of `<kd-accordion-item>` elements. By default only one item is
 * open at a time; set `multiple` to let several stay open. Up/Down/Home/End
 * move focus between item headers.
 *
 * ```html
 * <kd-accordion>
 *   <kd-accordion-item open><span slot="header">Fabric</span>...</kd-accordion-item>
 *   <kd-accordion-item><span slot="header">Frame</span>...</kd-accordion-item>
 * </kd-accordion>
 * ```
 */
@customElement("kd-accordion")
export class KdAccordion extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--kd-font-family);
    }
  `;

  /** Allow more than one item to be open at once. */
  @property({ type: Boolean, reflect: true }) multiple = false;

  /** Applied to every item, so sizes stay consistent within one accordion. */
  @property({ reflect: true }) size?: "sm" | "md" | "lg";

  @queryAssignedElements({ selector: "kd-accordion-item" })
  private itemEls!: KdAccordionItem[];

  render() {
    return html`<slot
      @slotchange=${this.handleSlotChange}
      @kd-toggle=${this.handleToggle}
      @keydown=${this.handleKeydown}
    ></slot>`;
  }

  updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("size") || changedProperties.has("multiple")) {
      this.syncItems();
    }
  }

  private handleSlotChange = () => {
    this.syncItems();
  };

  private syncItems() {
    if (this.size) {
      for (const item of this.itemEls) item.size = this.size;
    }
    // Single mode: if markup opens several, keep only the first
    if (!this.multiple) {
      const firstOpen = this.itemEls.find((item) => item.open);
      for (const item of this.itemEls) {
        if (item !== firstOpen) item.open = false;
      }
    }
  }

  private handleToggle = (event: Event) => {
    const item = event.target as KdAccordionItem;
    // Ignore toggles bubbling up from a nested accordion
    if (!this.itemEls.includes(item)) return;
    if (this.multiple || !item.open) return;
    for (const other of this.itemEls) {
      if (other !== item) other.open = false;
    }
  };

  private handleKeydown = (event: KeyboardEvent) => {
    // Already handled by a nested accordion
    if (event.defaultPrevented) return;

    // Only react to keys pressed on one of our items' own header buttons
    const origin = event.composedPath()[0] as HTMLElement;
    const host = (origin.getRootNode() as ShadowRoot).host;
    const enabled = this.itemEls.filter((item) => !item.disabled);
    const current = enabled.find((item) => item === host);
    if (!current || !origin.classList.contains("header")) return;

    const index = enabled.indexOf(current);
    let next: KdAccordionItem | undefined;
    switch (event.key) {
      case "ArrowDown":
        next = enabled[(index + 1) % enabled.length];
        break;
      case "ArrowUp":
        next = enabled[(index - 1 + enabled.length) % enabled.length];
        break;
      case "Home":
        next = enabled[0];
        break;
      case "End":
        next = enabled[enabled.length - 1];
        break;
      default:
        return;
    }
    event.preventDefault();
    next.focus();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "kd-accordion": KdAccordion;
  }
}
