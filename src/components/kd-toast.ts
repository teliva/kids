import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

export type ToastVariant = "info" | "success" | "warning" | "error";

export type ToastPlacement =
  | "top-start"
  | "top"
  | "top-end"
  | "bottom-start"
  | "bottom"
  | "bottom-end";

/**
 * A dismissible notification pinned to a corner of the viewport.
 *
 * ```html
 * <kd-toast id="save-toast" variant="success" duration="4000">Changes saved</kd-toast>
 * <script>document.getElementById('save-toast').show()</script>
 * ```
 */
@customElement("kd-toast")
export class KdToast extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }

    .toast {
      position: fixed;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      z-index: var(--kd-toast-z-index, 1100);
      display: none;
      gap: 0.625rem;
      width: max-content;
      max-width: var(--kd-toast-max-width, 22rem);
      padding: 0 1rem;
      height:44px;
      border-radius: 4px;
      border-left: 4px solid var(--kd-toast-accent, var(--kd-primary-color));
      background: var(--kd-toast-background, #fff);
      color: var(--kd-toast-color, #1a1a1a);
      font-family: var(--kd-font-family);
      font-size: 0.875rem;
      line-height: 1.4;
      box-shadow: var(--kd-box-shadow-m);
      opacity: 0;
      scale: 0.95;
      transition:
        opacity 0.18s ease,
        scale 0.18s ease;
    }

    :host([open]) .toast {
      display: flex;
    }

    :host([open]) .toast:not(.closing) {
      opacity: 1;
      scale: 1;
    }

    :host([placement^="top"]) .toast {
      top: 1rem;
    }

    :host([placement^="bottom"]) .toast {
      bottom: 1rem;
    }

    :host([placement$="start"]) .toast {
      left: 1rem;
    }

    :host([placement$="end"]) .toast {
      right: 1rem;
    }

    :host([placement="top"]) .toast,
    :host([placement="bottom"]) .toast {
      left: 50%;
      translate: -50% 0;
    }

    :host([variant="success"]) .toast {
      --kd-toast-accent: #2e7d32;
    }

    :host([variant="warning"]) .toast {
      --kd-toast-accent: #f9a825;
    }

    :host([variant="error"]) .toast {
      --kd-toast-accent: #d32f2f;
    }

    .icon {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
      margin-top: 0.0625rem;
      border-radius: 50%;
      background: var(--kd-toast-accent, var(--kd-primary-color));
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .icon::before {
      content: "i";
    }

    :host([variant="success"]) .icon::before {
      content: "✓";
    }

    :host([variant="warning"]) .icon::before {
      content: "!";
    }

    :host([variant="error"]) .icon::before {
      content: "✕";
    }

    .message {
      flex: 1;
      min-width: 0;
      padding-top: 0.0625rem;
      overflow-wrap: break-word;
    }

    .close {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      margin: -0.25rem -0.25rem -0.25rem 0;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: inherit;
      font: inherit;
      line-height: 1;
      opacity: 0.6;
      cursor: pointer;
    }

    .close:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.06);
    }
  `;

  @property() message = "";

  @property({ reflect: true }) variant: ToastVariant = "info";

  @property({ reflect: true }) placement: ToastPlacement = "bottom-end";

  @property({ type: Number }) duration = 4000;

  @property({ type: Boolean, reflect: true }) closable = true;

  @property({ type: Boolean, reflect: true }) open = false;

  @state() private closing = false;

  @query(".toast") private toastEl?: HTMLDivElement;

  private dismissTimer?: ReturnType<typeof setTimeout>;
  private remaining = 0;
  private startedAt = 0;

  render() {
    const assertive = this.variant === "error" || this.variant === "warning";

    return html`
      <div
        class="toast ${this.closing ? "closing" : ""}"
        part="toast"
        role=${assertive ? "alert" : "status"}
        aria-live=${assertive ? "assertive" : "polite"}
        @mouseenter=${this.pause}
        @mouseleave=${this.resume}
      >
        <span class="icon" part="icon" aria-hidden="true"></span>
        <div class="message" part="message"><slot>${this.message}</slot></div>
        ${this.closable
          ? html`<button
              class="close"
              part="close-button"
              aria-label="Dismiss"
              @click=${() => this.hide()}
            >
              &#10005;
            </button>`
          : null}
      </div>
    `;
  }

  updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("open")) {
      if (this.open) {
        this.closing = false;
        this.scheduleDismiss();
      } else {
        clearTimeout(this.dismissTimer);
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.dismissTimer);
  }

  show() {
    this.open = true;
  }

  hide() {
    if (!this.open || this.closing) return;
    clearTimeout(this.dismissTimer);
    this.closing = true;

    const onTransitionEnd = () => {
      this.toastEl?.removeEventListener("transitionend", onTransitionEnd);
      this.open = false;
      this.closing = false;
      this.dispatchEvent(new CustomEvent("kd-close", { bubbles: true, composed: true }));
    };

    this.toastEl?.addEventListener("transitionend", onTransitionEnd);
  }

  toggle() {
    if (this.open) {
      this.hide();
    } else {
      this.show();
    }
  }

  private scheduleDismiss() {
    clearTimeout(this.dismissTimer);
    if (this.duration <= 0) return;

    this.remaining = this.duration;
    this.startedAt = Date.now();
    this.dismissTimer = setTimeout(() => this.hide(), this.duration);
  }

  private pause = () => {
    if (!this.open || this.closing || this.duration <= 0) return;
    clearTimeout(this.dismissTimer);
    this.remaining -= Date.now() - this.startedAt;
  };

  private resume = () => {
    if (!this.open || this.closing || this.duration <= 0) return;
    this.startedAt = Date.now();
    this.dismissTimer = setTimeout(() => this.hide(), Math.max(this.remaining, 0));
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "kd-toast": KdToast;
  }
}
