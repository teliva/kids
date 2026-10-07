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

export interface ToastOptions {
  variant?: ToastVariant;
  placement?: ToastPlacement;
  duration?: number;
  closable?: boolean;
}

/** Max toasts visible per placement; the oldest is dismissed past this. */
const MAX_STACKED_TOASTS = 3;

/** Returns the fixed container for a placement, creating it on first use. */
function getToastStack(placement: ToastPlacement): HTMLElement {
  const existing = document.querySelector<HTMLElement>(
    `.kd-toast-stack[data-placement="${placement}"]`,
  );
  if (existing) return existing;

  const [vertical, horizontal = "center"] = placement.split("-");
  const offset = "var(--kd-space-layout-gap-md)";
  const stack = document.createElement("div");
  stack.className = "kd-toast-stack";
  stack.dataset.placement = placement;
  Object.assign(stack.style, {
    position: "fixed",
    zIndex: "var(--kd-toast-z-index, 1100)",
    display: "flex",
    // New toasts are appended; keep the newest nearest the screen edge
    flexDirection: vertical === "top" ? "column-reverse" : "column",
    alignItems:
      horizontal === "start" ? "flex-start" : horizontal === "end" ? "flex-end" : "center",
    gap: "var(--kd-space-layout-gap-sm)",
    // Gaps between toasts shouldn't block clicks on the page beneath
    pointerEvents: "none",
    // Pages can raise the stack above fixed UI such as a footer
    [vertical]: `var(--kd-toast-offset-${vertical}, ${offset})`,
  });

  if (horizontal === "start") {
    stack.style.left = offset;
  } else if (horizontal === "end") {
    stack.style.right = offset;
  } else {
    stack.style.left = "50%";
    stack.style.translate = "-50% 0";
  }

  document.body.append(stack);
  return stack;
}

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
      gap: var(--kd-space-component-gap-sm);
      width: max-content;
      max-width: var(--kd-toast-max-width, 22rem);
      padding: 0 var(--kd-space-component-padding-md-x);
      height: 48px;
      border-radius: var(--kd-radius-md);
      border-left: 4px solid var(--kd-toast-accent, var(--kd-color-brand));
      background: var(--kd-toast-background, #fff);
      color: var(--kd-toast-color, #1a1a1a);
      font-family: var(--kd-font-family);
      font-size: var(--kd-font-size-sm);
      line-height: var(--kd-line-height-snug);
      box-shadow: var(--kd-box-shadow-md);
      opacity: 0;
      scale: 0.95;
      transition:
        opacity 0.2s ease,
        scale 0.2s ease;
    }

    :host([open]) .toast {
      display: flex;
    }

    :host([open]) .toast:not(.closing) {
      opacity: 1;
      scale: 1;
    }

    /* Switching display from none in the same frame skips the transition;
       this gives the fade-in a first-frame state to animate from */
    @starting-style {
      :host([open]) .toast:not(.closing) {
        opacity: 0;
        scale: 0.95;
      }
    }

    :host([placement^="top"]) .toast {
      top: var(--kd-toast-offset-top, var(--kd-space-layout-gap-md));
    }

    :host([placement^="bottom"]) .toast {
      bottom: var(--kd-toast-offset-bottom, var(--kd-space-layout-gap-md));
    }

    :host([placement$="start"]) .toast {
      left: var(--kd-space-layout-gap-md);
    }

    :host([placement$="end"]) .toast {
      right: var(--kd-space-layout-gap-md);
    }

    :host([placement="top"]) .toast,
    :host([placement="bottom"]) .toast {
      left: 50%;
      translate: -50% 0;
    }

    /* In a stack the container does the positioning; must follow the
       placement rules above to override them */
    :host([stacked]) .toast {
      position: relative;
      inset: auto;
      translate: none;
      pointer-events: auto;
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
      font-size: var(--kd-font-size-xs);
      font-weight: 700;
      color: var(--kd-toast-accent, var(--kd-color-brand));
    }

    .icon svg {
      width: 100%;
      height: 100%;
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
      margin: calc(var(--kd-space-1) * -1) calc(var(--kd-space-1) * -1) calc(var(--kd-space-1) * -1) 0;
      border: none;
      border-radius: var(--kd-radius-sm);
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

  /** Laid out by a toast stack (see `KdToast.toast()`) instead of positioning itself. */
  @property({ type: Boolean, reflect: true }) stacked = false;

  @state() private closing = false;

  /** True while the toast is fading out after `hide()`. */
  get isClosing(): boolean {
    return this.closing;
  }

  /**
   * Creates a toast, shows it in a shared stack for its placement, and
   * removes it once dismissed. Use this when several toasts may be open.
   *
   * ```js
   * customElements.get("kd-toast").toast("Saved", { variant: "success" });
   * ```
   */
  static toast(message: string, options: ToastOptions = {}): KdToast {
    const { placement = "bottom-end", ...rest } = options;
    const el = document.createElement("kd-toast");
    Object.assign(el, rest, { message, placement, stacked: true });

    const stack = getToastStack(placement);
    stack.append(el);
    el.addEventListener(
      "kd-close",
      () => {
        el.remove();
        if (!stack.childElementCount) stack.remove();
      },
      { once: true },
    );
    el.show();

    // Oldest toasts are first in the stack; dismiss any beyond the limit.
    // Skip ones already fading out, or a quick burst hides too many.
    const toasts = Array.from(stack.querySelectorAll("kd-toast")).filter(
      (toast) => !toast.isClosing,
    );
    for (let i = 0; i < toasts.length - MAX_STACKED_TOASTS; i++) {
      toasts[i].hide();
    }

    return el;
  }

  @query(".toast") private toastEl?: HTMLDivElement;

  private static readonly successIcon = html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <!-- Lucide circle-check, filled: the check is cut out of the circle so
           whatever is behind the toast shows through -->
      <mask id="check-cutout">
        <rect width="24" height="24" fill="#fff" />
        <path d="m16 9-5.5 5.5L8 12" fill="none" stroke="#000" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round" />
      </mask>
      <circle cx="12" cy="12" r="10" fill="currentColor" mask="url(#check-cutout)" />
    </svg>
  `;

  private static readonly infoIcon = html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
      <path
        d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM288 224C288 206.3 302.3 192 320 192C337.7 192 352 206.3 352 224C352 241.7 337.7 256 320 256C302.3 256 288 241.7 288 224zM280 288L328 288C341.3 288 352 298.7 352 312L352 400L360 400C373.3 400 384 410.7 384 424C384 437.3 373.3 448 360 448L280 448C266.7 448 256 437.3 256 424C256 410.7 266.7 400 280 400L304 400L304 336L280 336C266.7 336 256 325.3 256 312C256 298.7 266.7 288 280 288z"
      />
    </svg>
  `;

  private static readonly dangerIcon = html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
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

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(fallback);
      this.toastEl?.removeEventListener("transitionend", finish);
      this.open = false;
      this.closing = false;
      this.dispatchEvent(
        new CustomEvent("kd-close", { bubbles: true, composed: true }),
      );
    };

    // In case the fade never runs (e.g. transitions disabled), so kd-close
    // still fires; a little longer than the 0.2s fade
    const fallback = setTimeout(finish, 300);
    this.toastEl?.addEventListener("transitionend", finish);
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
