import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

type TooltipSide = "top" | "right" | "bottom" | "left";
type TooltipAlignment = "start" | "end" | undefined;

export type TooltipPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "right"
  | "right-start"
  | "right-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end";

const OPPOSITE_SIDE: Record<TooltipSide, TooltipSide> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

let idCounter = 0;

/**
 * Shows a positioned tooltip next to another element on hover/focus/click,
 * referencing it by id (like `<label for>`) so it can sit beside the
 * target.
 *
 * ```html
 * <kd-button id="save-btn">Save</kd-button>
 * <kd-tooltip for="save-btn" content="Saves your changes" placement="top"></kd-tooltip>
 * ```
 */
@customElement("kd-tooltip")
export class KdTooltip extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }

    .tooltip {
      position: fixed;
      top: 0;
      left: 0;
      z-index: var(--kd-tooltip-z-index, 1000);
      max-width: var(--kd-tooltip-max-width, 20rem);
      padding: 0.375rem 0.625rem;
      border-radius: 8px;
      background: var(--kd-tooltip-background, #222);
      color: var(--kd-tooltip-color, #fff);
      font-family: var(--kd-font-family);
      font-size: 0.8125rem;
      line-height: 1.4;
      text-align: start;
      box-shadow: var(--kd-box-shadow-s);
      opacity: 0;
      pointer-events: none;
      transform-origin: center;
      scale: 0.9;
      transition:
        opacity 0.1s ease,
        scale 0.1s ease,
        transform 0s;
    }

    .tooltip.visible {
      opacity: 1;
      scale: 1;
    }

    .arrow {
      position: absolute;
      width: 8px;
      height: 8px;
      background: var(--kd-tooltip-background, #222);
      transform: rotate(45deg);
    }
  `;

  @property() for = "";

  @property() content = "";

  @property() placement: TooltipPlacement = "top";

  @property({ type: Number }) distance = 8;

  @property() trigger = "hover focus";

  @property({ type: Boolean, reflect: true }) disabled = false;

  @property({ type: Boolean, reflect: true }) open = false;

  @query(".tooltip") private tooltipEl!: HTMLDivElement;

  @query(".arrow") private arrowEl!: HTMLDivElement;

  @state() private contentId = `kd-tooltip-${idCounter++}`;

  private anchorEl: HTMLElement | null = null;
  private hideTimeout?: ReturnType<typeof setTimeout>;
  private reposition = () => this.updatePosition();

  render() {
    return html`
      <div
        class="tooltip ${this.open ? "visible" : ""}"
        part="tooltip"
        id=${this.contentId}
        role="tooltip"
        aria-hidden=${this.open ? "false" : "true"}
      >
        <slot name="content">${this.content}</slot>
        <div class="arrow" part="arrow"></div>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.resolveAnchor();
  }

  updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("for")) {
      this.resolveAnchor();
    }

    if (changedProperties.has("disabled") && this.disabled && this.open) {
      this.open = false;
      return;
    }

    if (changedProperties.has("open")) {
      if (this.open) {
        this.startTracking();
        this.updatePosition();
      } else {
        this.stopTracking();
      }
    } else if (
      this.open &&
      (changedProperties.has("placement") ||
        changedProperties.has("content") ||
        changedProperties.has("distance"))
    ) {
      this.updatePosition();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.hideTimeout);
    this.stopTracking();
    this.detachAnchor();
  }

  show() {
    if (this.disabled) return;
    clearTimeout(this.hideTimeout);
    this.open = true;
  }

  hide() {
    clearTimeout(this.hideTimeout);
    this.open = false;
  }

  toggle() {
    if (this.open) {
      this.hide();
    } else {
      this.show();
    }
  }

  private resolveAnchor() {
    this.detachAnchor();

    const root = this.getRootNode() as Document | ShadowRoot;
    const anchor = this.for ? root.getElementById(this.for) : null;
    if (!(anchor instanceof HTMLElement)) return;

    this.anchorEl = anchor;

    const describedBy = anchor.getAttribute("aria-describedby");
    const ids = new Set((describedBy ?? "").split(/\s+/).filter(Boolean));
    ids.add(this.contentId);
    anchor.setAttribute("aria-describedby", [...ids].join(" "));

    anchor.addEventListener("mouseenter", this.handleMouseEnter);
    anchor.addEventListener("mouseleave", this.handleMouseLeave);
    anchor.addEventListener("focusin", this.handleFocusIn);
    anchor.addEventListener("focusout", this.handleFocusOut);
    anchor.addEventListener("click", this.handleClick);
    anchor.addEventListener("keydown", this.handleKeyDown);
  }

  private detachAnchor() {
    const anchor = this.anchorEl;
    if (!anchor) return;

    const describedBy = (anchor.getAttribute("aria-describedby") ?? "")
      .split(/\s+/)
      .filter((id) => id && id !== this.contentId);
    if (describedBy.length) {
      anchor.setAttribute("aria-describedby", describedBy.join(" "));
    } else {
      anchor.removeAttribute("aria-describedby");
    }

    anchor.removeEventListener("mouseenter", this.handleMouseEnter);
    anchor.removeEventListener("mouseleave", this.handleMouseLeave);
    anchor.removeEventListener("focusin", this.handleFocusIn);
    anchor.removeEventListener("focusout", this.handleFocusOut);
    anchor.removeEventListener("click", this.handleClick);
    anchor.removeEventListener("keydown", this.handleKeyDown);

    this.anchorEl = null;
  }

  private handleMouseEnter = () => {
    if (this.trigger.includes("hover")) this.show();
  };

  private handleMouseLeave = () => {
    if (this.trigger.includes("hover")) this.scheduleHide();
  };

  private handleFocusIn = () => {
    if (this.trigger.includes("focus")) this.show();
  };

  private handleFocusOut = () => {
    if (this.trigger.includes("focus")) this.scheduleHide();
  };

  private handleClick = () => {
    if (this.trigger.includes("click")) this.toggle();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") this.hide();
  };

  private scheduleHide() {
    clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(() => {
      this.open = false;
    }, 60);
  }

  private startTracking() {
    window.addEventListener("scroll", this.reposition, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", this.reposition, { passive: true });
  }

  private stopTracking() {
    window.removeEventListener("scroll", this.reposition, { capture: true });
    window.removeEventListener("resize", this.reposition);
  }

  private updatePosition() {
    if (!this.anchorEl || !this.tooltipEl || !this.arrowEl) return;

    const anchorRect = this.anchorEl.getBoundingClientRect();
    const tooltipRect = this.tooltipEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 8;
    const arrowSize = 8;

    const [rawSide, alignment] = this.placement.split("-") as [
      TooltipSide,
      TooltipAlignment,
    ];

    const fitsOnSide = (side: TooltipSide) => {
      switch (side) {
        case "top":
          return anchorRect.top - tooltipRect.height - this.distance >= 0;
        case "bottom":
          return (
            anchorRect.bottom + tooltipRect.height + this.distance <=
            viewportHeight
          );
        case "left":
          return anchorRect.left - tooltipRect.width - this.distance >= 0;
        case "right":
          return (
            anchorRect.right + tooltipRect.width + this.distance <=
            viewportWidth
          );
      }
    };

    const side =
      !fitsOnSide(rawSide) && fitsOnSide(OPPOSITE_SIDE[rawSide])
        ? OPPOSITE_SIDE[rawSide]
        : rawSide;

    let x: number;
    let y: number;

    if (side === "top" || side === "bottom") {
      y =
        side === "top"
          ? anchorRect.top - tooltipRect.height - this.distance
          : anchorRect.bottom + this.distance;

      if (alignment === "start") x = anchorRect.left;
      else if (alignment === "end") x = anchorRect.right - tooltipRect.width;
      else x = anchorRect.left + (anchorRect.width - tooltipRect.width) / 2;
    } else {
      x =
        side === "left"
          ? anchorRect.left - tooltipRect.width - this.distance
          : anchorRect.right + this.distance;

      if (alignment === "start") y = anchorRect.top;
      else if (alignment === "end") y = anchorRect.bottom - tooltipRect.height;
      else y = anchorRect.top + (anchorRect.height - tooltipRect.height) / 2;
    }

    // Shift along the cross axis so the tooltip stays within the viewport.
    x = Math.min(
      Math.max(x, margin),
      Math.max(margin, viewportWidth - tooltipRect.width - margin),
    );
    y = Math.min(
      Math.max(y, margin),
      Math.max(margin, viewportHeight - tooltipRect.height - margin),
    );

    this.tooltipEl.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;

    this.arrowEl.style.top = "";
    this.arrowEl.style.bottom = "";
    this.arrowEl.style.left = "";
    this.arrowEl.style.right = "";

    if (side === "top" || side === "bottom") {
      const anchorCenterX = anchorRect.left + anchorRect.width / 2;
      const arrowX = Math.min(
        Math.max(anchorCenterX - x - arrowSize / 2, 6),
        Math.max(6, tooltipRect.width - arrowSize - 6),
      );
      this.arrowEl.style.left = `${arrowX}px`;
      this.arrowEl.style[side === "top" ? "bottom" : "top"] =
        `-${arrowSize / 2}px`;
    } else {
      const anchorCenterY = anchorRect.top + anchorRect.height / 2;
      const arrowY = Math.min(
        Math.max(anchorCenterY - y - arrowSize / 2, 6),
        Math.max(6, tooltipRect.height - arrowSize - 6),
      );
      this.arrowEl.style.top = `${arrowY}px`;
      this.arrowEl.style[side === "left" ? "right" : "left"] =
        `-${arrowSize / 2}px`;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kd-tooltip": KdTooltip;
  }
}
