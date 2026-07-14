import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

export type ToastVariant = "info" | "success" | "warning" | "danger";

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
      height: 48px;
      border-radius: 8px;
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
      --kd-toast-accent: #4f8051;
    }

    :host([variant="warning"]) .toast {
      --kd-toast-accent: #f9a825;
    }

    :host([variant="danger"]) .toast {
      --kd-toast-accent: #b40c12;
    }

    .icon {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      margin-top: 0.0625rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--kd-toast-accent, var(--kd-primary-color));
    }

    .icon svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
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

  private static readonly successIcon = html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
      <path
        d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z"
      />
    </svg>
  `;

  private static readonly infoIcon = html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
      <path
        d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM288 224C288 206.3 302.3 192 320 192C337.7 192 352 206.3 352 224C352 241.7 337.7 256 320 256C302.3 256 288 241.7 288 224zM280 288L328 288C341.3 288 352 298.7 352 312L352 400L360 400C373.3 400 384 410.7 384 424C384 437.3 373.3 448 360 448L280 448C266.7 448 256 437.3 256 424C256 410.7 266.7 400 280 400L304 400L304 336L280 336C266.7 336 256 325.3 256 312C256 298.7 266.7 288 280 288z"
      />
    </svg>
  `;

  private static readonly dangerIcon = html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
      <path
        d="M320 64C334.7 64 348.2 72.1 355.2 85L571.2 485C577.9 497.4 577.6 512.4 570.4 524.5C563.2 536.6 550.1 544 536 544L104 544C89.9 544 76.8 536.6 69.6 524.5C62.4 512.4 62.1 497.4 68.8 485L284.8 85C291.8 72.1 305.3 64 320 64zM320 416C302.3 416 288 430.3 288 448C288 465.7 302.3 480 320 480C337.7 480 352 465.7 352 448C352 430.3 337.7 416 320 416zM320 224C301.8 224 287.3 239.5 288.6 257.7L296 361.7C296.9 374.2 307.4 384 319.9 384C332.5 384 342.9 374.3 343.8 361.7L351.2 257.7C352.5 239.5 338.1 224 319.8 224z"
      />
    </svg>
  `;

  private dismissTimer?: ReturnType<typeof setTimeout>;
  private remaining = 0;
  private startedAt = 0;

  render() {
    const assertive = this.variant === "danger" || this.variant === "warning";

    return html`
      <div
        class="toast ${this.closing ? "closing" : ""}"
        part="toast"
        role=${assertive ? "alert" : "status"}
        aria-live=${assertive ? "assertive" : "polite"}
        @mouseenter=${this.pause}
        @mouseleave=${this.resume}
      >
        <span class="icon" part="icon" aria-hidden="true">
          ${this.variant === "info" ? KdToast.infoIcon : null}
          ${this.variant === "success" ? KdToast.successIcon : null}
          ${this.variant === "warning" ? KdToast.infoIcon : null}
          ${this.variant === "danger" ? KdToast.dangerIcon : null}
        </span>
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
      this.dispatchEvent(
        new CustomEvent("kd-close", { bubbles: true, composed: true }),
      );
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
    this.dismissTimer = setTimeout(
      () => this.hide(),
      Math.max(this.remaining, 0),
    );
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "kd-toast": KdToast;
  }
}
