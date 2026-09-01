import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, queryAssignedElements } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import type { KdSwatch } from "./kd-swatch";
import "./kd-swatch";

const NEXT_KEYS = ["ArrowRight", "ArrowDown"];
const PREV_KEYS = ["ArrowLeft", "ArrowUp"];

/**
 * A group of `<kd-swatch>` elements with exclusive (radio-style) selection
 * and roving arrow-key navigation between swatches.
 *
 * ```html
 * <kd-swatch-group label="Fabric finish" name="fabric" value="kfi_1504">
 *   <kd-swatch value="kfi_1504" label="Ballistic Blue" src="https://.../BB(U)-sm.jpg"></kd-swatch>
 *   <kd-swatch value="kfi_1505" label="Forest Green" src="https://.../FG(U)-sm.jpg"></kd-swatch>
 * </kd-swatch-group>
 * ```
 */
@customElement("kd-swatch-group")
export class KdSwatchGroup extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--kd-font-family);
    }

    fieldset {
      display: contents;
      border: 0;
      margin: 0;
      padding: 0;
    }

    legend {
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

    .grid {
      display: grid;
      grid-template-columns: repeat(
        var(--kd-swatch-group-columns, auto-fill),
        minmax(var(--kd-swatch-group-item-size, 60px), 1fr)
      );
      gap: 1rem;
    }
  `;

  @property() name = "";

  @property() label = "";

  @property({ reflect: true }) value = "";

  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Fixed number of columns. Omit to fit as many as the container width allows. */
  @property({ type: Number }) columns?: number;

  @queryAssignedElements() private swatchEls!: KdSwatch[];

  render() {
    return html`
      <fieldset part="fieldset">
        <legend part="legend">${this.label}</legend>
        <div
          class="grid"
          part="grid"
          role="radiogroup"
          aria-label=${this.label}
          style=${styleMap({
            "--kd-swatch-group-columns":
              this.columns != null ? String(this.columns) : null,
          })}
          @kd-change=${this.handleSwatchChange}
          @keydown=${this.handleKeydown}
        >
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
      </fieldset>
    `;
  }

  updated(changedProperties: PropertyValues<this>) {
    if (
      changedProperties.has("value") ||
      changedProperties.has("name") ||
      changedProperties.has("disabled")
    ) {
      this.syncSwatches();
    }
  }

  private handleSlotChange = () => {
    this.syncSwatches();
  };

  private syncSwatches() {
    for (const swatch of this.swatchEls) {
      if (this.name) swatch.name = this.name;
      swatch.checked = swatch.value === this.value;
      if (this.disabled) swatch.disabled = true;
    }
  }

  private selectSwatch(swatch: KdSwatch) {
    this.value = swatch.value;
    for (const el of this.swatchEls) {
      el.checked = el === swatch;
    }
    this.dispatchEvent(new CustomEvent("kd-input", { bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent("kd-change", { bubbles: true, composed: true }));
  }

  private handleSwatchChange = (event: Event) => {
    this.selectSwatch(event.target as KdSwatch);
  };

  private handleKeydown = (event: KeyboardEvent) => {
    const isNext = NEXT_KEYS.includes(event.key);
    const isPrev = PREV_KEYS.includes(event.key);
    if (!isNext && !isPrev) return;

    const enabled = this.swatchEls.filter((el) => !el.disabled);
    if (enabled.length === 0) return;

    event.preventDefault();
    const current = event.target as KdSwatch;
    const currentIndex = enabled.indexOf(current);
    const delta = isNext ? 1 : -1;
    const next = enabled[(currentIndex + delta + enabled.length) % enabled.length];

    this.selectSwatch(next);
    next.focus();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "kd-swatch-group": KdSwatchGroup;
  }
}
