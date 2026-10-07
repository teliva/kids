import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

export interface DialogHideDetail {
  /** What asked to close: the dialog, its close button, or a `data-dialog="close"` element. */
  source: Element;
}

/** Open dialogs holding the page scroll lock; nested dialogs share one lock. */
let scrollLocks = 0;

function lockScroll() {
  if (scrollLocks++ === 0) document.documentElement.style.overflow = "hidden";
}

function unlockScroll() {
  if (--scrollLocks === 0) document.documentElement.style.removeProperty("overflow");
}

/**
 * A modal window that sits above the page and traps focus until closed.
 * Built on the native `<dialog>`, so Escape, focus return and the inert
 * background come from the browser.
 *
 * Open it from script with `dialog.open = true` or `dialog.show()`. Any
 * element inside with `data-dialog="close"` closes it.
 *
 * Customize with `--kd-dialog-width`, `--kd-dialog-spacing`,
 * `--kd-dialog-show-duration` and `--kd-dialog-hide-duration`.
 *
 * ```html
 * <kd-dialog id="confirm" label="Delete project?">
 *   This can't be undone.
 *   <kd-button slot="footer" data-dialog="close" appearance="outline" variant="neutral">
 *     <span slot="label">Cancel</span>
 *   </kd-button>
 * </kd-dialog>
 * <kd-button id="delete-btn"><span slot="label">Delete</span></kd-button>
 *
 * <script>
 *   const dialog = document.getElementById("confirm");
 *   document.getElementById("delete-btn").addEventListener("click", () => (dialog.open = true));
 * </script>
 * ```
 *
 * @fires kd-show - Before the dialog opens.
 * @fires kd-after-show - After the open animation finishes.
 * @fires kd-hide - Before the dialog closes by user action or `hide()`.
 *   Cancelable; `detail.source` says what asked to close.
 * @fires kd-after-hide - After the close animation finishes.
 */
@customElement("kd-dialog")
export class KdDialog extends LitElement {
  static styles = css`
    /* Fallbacks (not :host declarations) so the props can also inherit from an ancestor */
    :host {
      --_width: var(--kd-dialog-width, 31rem);
      --_spacing: var(--kd-dialog-spacing, var(--kd-space-6));
      --_show-duration: var(--kd-dialog-show-duration, 0.2s);
      --_hide-duration: var(--kd-dialog-hide-duration, 0.2s);
      display: contents;
    }

    .dialog {
      box-sizing: border-box;
      width: var(--_width);
      max-width: calc(100% - 2 * var(--kd-space-4));
      max-height: calc(100% - 2 * var(--kd-space-4));
      padding: 0;
      border: none;
      border-radius: var(--kd-radius-lg);
      background: var(--kd-dialog-background, #fff);
      color: var(--kd-dialog-color, #1a1a1a);
      font-family: var(--kd-font-family);
      font-size: var(--kd-font-size-md);
      line-height: var(--kd-line-height-normal);
      box-shadow: var(--kd-box-shadow-lg);
      opacity: 1;
      scale: 1;
      transition:
        opacity var(--_show-duration) ease,
        scale var(--_show-duration) ease;
    }

    /* Only while open, so the browser's display: none still hides it when closed */
    .dialog[open] {
      display: flex;
      flex-direction: column;
    }

    .dialog::backdrop {
      background: var(--kd-dialog-backdrop, rgb(0 0 0 / 0.4));
      opacity: 1;
      transition: opacity var(--_show-duration) ease;
    }

    /* Opening switches display from none in one frame, which skips the
       transition; this gives the fade-in a first-frame state to animate from */
    @starting-style {
      .dialog[open] {
        opacity: 0;
        scale: 0.95;
      }

      .dialog[open]::backdrop {
        opacity: 0;
      }
    }

    .dialog.closing {
      opacity: 0;
      scale: 0.95;
      transition-duration: var(--_hide-duration);
    }

    .dialog.closing::backdrop {
      opacity: 0;
      transition-duration: var(--_hide-duration);
    }

    /* Nudge when a close is refused (kd-hide canceled, or backdrop click
       without light-dismiss) so the click doesn't look ignored */
    .dialog.pulse {
      animation: pulse 0.25s ease;
    }

    @keyframes pulse {
      50% {
        scale: 1.02;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .dialog,
      .dialog::backdrop {
        transition: none;
      }

      .dialog.pulse {
        animation: none;
      }
    }

    .header {
      display: flex;
      align-items: flex-start;
      gap: var(--kd-space-component-gap-sm);
      padding: var(--_spacing) var(--_spacing) 0;
    }

    .title {
      flex: 1;
      margin: 0;
      font-size: var(--kd-font-size-xl);
      font-weight: 600;
      line-height: var(--kd-line-height-tight);
      /* Line up with the 1.5rem header buttons */
      padding-block: 0.125rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--kd-space-1);
      margin-block: calc(var(--kd-space-1) * -1);
      margin-inline-end: calc(var(--kd-space-2) * -1);
    }

    .close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: none;
      border-radius: var(--kd-radius-sm);
      background: transparent;
      color: inherit;
      opacity: 0.6;
      cursor: pointer;
    }

    .close:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.06);
    }

    .close:focus-visible {
      opacity: 1;
      outline: 2px solid var(--kd-color-brand);
      outline-offset: 2px;
    }

    .close svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    /* Only the body scrolls, so the header and footer stay in view */
    .body {
      flex: 1 1 auto;
      overflow: auto;
      padding: var(--_spacing);
    }

    .footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--kd-space-component-gap-sm);
      padding: 0 var(--_spacing) var(--_spacing);
    }

    .footer[hidden] {
      display: none;
    }
  `;

  /** Whether the dialog is open. Set it or call `show()` / `hide()`. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Title text, also the accessible name. Use the `label` slot for rich content. */
  @property() label = "";

  /** Hides the header, including the close button; provide another way to close. */
  @property({ type: Boolean, reflect: true, attribute: "without-header" }) withoutHeader = false;

  /** Closes the dialog when the backdrop is clicked. */
  @property({ type: Boolean, reflect: true, attribute: "light-dismiss" }) lightDismiss = false;

  @state() private closing = false;

  @state() private pulsing = false;

  @state() private hasFooter = false;

  @query("dialog") private dialogEl!: HTMLDialogElement;

  @query('slot[name="footer"]') private footerSlotEl!: HTMLSlotElement;

  /** Bumped on each open/close so a stale animation can't finish the newer one. */
  private transitionId = 0;

  /** Whether the current click started on the backdrop; drag-selecting out of the panel shouldn't dismiss. */
  private pointerDownOnBackdrop = false;

  render() {
    return html`<dialog
      class="dialog ${this.closing ? "closing" : ""} ${this.pulsing ? "pulse" : ""}"
      part="dialog"
      aria-labelledby=${this.withoutHeader ? undefined : "title"}
      aria-label=${this.withoutHeader && this.label ? this.label : undefined}
      @cancel=${this.handleCancel}
      @pointerdown=${this.handlePointerDown}
      @click=${this.handleDialogClick}
      @animationend=${() => (this.pulsing = false)}
    >
      ${this.withoutHeader
        ? null
        : html`<header class="header" part="header">
            <h2 class="title" id="title" part="title">
              <slot name="label">${this.label}</slot>
            </h2>
            <div class="header-actions" part="header-actions">
              <slot name="header-actions"></slot>
              <button
                class="close"
                part="close-button"
                type="button"
                aria-label="Close"
                @click=${(event: MouseEvent) => this.requestClose(event.currentTarget as Element)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  aria-hidden="true">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
          </header>`}
      <div class="body" part="body"><slot></slot></div>
      <footer class="footer" part="footer" ?hidden=${!this.hasFooter}>
        <slot name="footer" @slotchange=${this.handleFooterSlotChange}></slot>
      </footer>
    </dialog>`;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", this.handleCloseTriggerClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("click", this.handleCloseTriggerClick);
    // Removed while open: the native dialog closes itself, so release the lock here
    if (this.dialogEl?.open) {
      this.transitionId++;
      this.closing = false;
      unlockScroll();
    }
  }

  firstUpdated() {
    this.handleFooterSlotChange();
  }

  updated(changedProperties: PropertyValues<this>) {
    if (!changedProperties.has("open")) return;
    if (this.open && !this.dialogEl.open) {
      this.openDialog();
    } else if (!this.open && this.dialogEl.open && !this.closing) {
      this.closeDialog();
    } else if (this.open && this.closing) {
      // Reopened mid-close: cancel the fade-out and stay open
      this.transitionId++;
      this.closing = false;
    }
  }

  show() {
    this.open = true;
  }

  /** Closes the dialog, unless a `kd-hide` listener cancels it. */
  hide() {
    this.requestClose(this);
  }

  private requestClose(source: Element) {
    if (!this.open || this.closing) return;
    const event = new CustomEvent<DialogHideDetail>("kd-hide", {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { source },
    });
    if (!this.dispatchEvent(event)) {
      this.pulse();
      return;
    }
    this.open = false;
  }

  private async openDialog() {
    const id = ++this.transitionId;
    this.dispatchEvent(new CustomEvent("kd-show", { bubbles: true, composed: true }));
    this.closing = false;
    this.dialogEl.showModal();
    lockScroll();

    await this.finishTransitions();
    if (id !== this.transitionId) return;
    this.dispatchEvent(new CustomEvent("kd-after-show", { bubbles: true, composed: true }));
  }

  private async closeDialog() {
    const id = ++this.transitionId;
    this.closing = true;
    await this.updateComplete;

    await this.finishTransitions();
    if (id !== this.transitionId) return;
    this.closing = false;
    this.dialogEl.close();
    unlockScroll();
    this.dispatchEvent(new CustomEvent("kd-after-hide", { bubbles: true, composed: true }));
  }

  /** Resolves once the dialog's and backdrop's running transitions end (at once if there are none). */
  private async finishTransitions() {
    const animations = this.dialogEl
      .getAnimations({ subtree: true })
      .filter((animation) => animation instanceof CSSTransition);
    // The animation clock can stall (e.g. in a background tab), so don't wait
    // much past the longest transition
    const longest = Math.max(
      0,
      ...animations.map((animation) => Number(animation.effect?.getComputedTiming().endTime ?? 0)),
    );
    await Promise.race([
      // finished rejects if a transition is interrupted; treat that as done too
      Promise.allSettled(animations.map((animation) => animation.finished)),
      new Promise((resolve) => setTimeout(resolve, longest + 100)),
    ]);
  }

  private pulse() {
    // Restart the animation if it's already running
    this.pulsing = false;
    requestAnimationFrame(() => (this.pulsing = true));
  }

  private handleCancel = (event: Event) => {
    // Route Escape through requestClose so kd-hide can veto it and the fade-out runs
    event.preventDefault();
    this.requestClose(this.dialogEl);
  };

  private isOnBackdrop(event: MouseEvent) {
    const rect = this.dialogEl.getBoundingClientRect();
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  }

  private handlePointerDown = (event: PointerEvent) => {
    this.pointerDownOnBackdrop = event.target === this.dialogEl && this.isOnBackdrop(event);
  };

  private handleDialogClick = (event: MouseEvent) => {
    // Backdrop clicks target the <dialog> itself, with the pointer outside its box
    // (keyboard "clicks" report 0,0 coordinates, so also require the pointerdown)
    if (event.target !== this.dialogEl || !this.pointerDownOnBackdrop || !this.isOnBackdrop(event)) {
      return;
    }
    this.pointerDownOnBackdrop = false;
    if (this.lightDismiss) {
      this.requestClose(this.dialogEl);
    } else {
      this.pulse();
    }
  };

  private handleCloseTriggerClick = (event: MouseEvent) => {
    const trigger = (event.target as Element).closest('[data-dialog="close"]');
    // Ignore triggers that belong to a dialog nested inside this one
    if (trigger && trigger.closest("kd-dialog") === this) {
      this.requestClose(trigger);
    }
  };

  private handleFooterSlotChange = () => {
    this.hasFooter = (this.footerSlotEl?.assignedNodes({ flatten: true }).length ?? 0) > 0;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "kd-dialog": KdDialog;
  }

  interface HTMLElementEventMap {
    "kd-hide": CustomEvent<DialogHideDetail>;
  }
}
