import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";

@customElement("kd-loader")
export class KdProgressBar extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .track {
      position: relative;
      overflow: hidden;
      width: 100%;
      height: var(--kd-loader-height, 8px);
      background-color: var(--kd-color-neutral);
    }

    .bar {
      position: absolute;
      top: 0;
      bottom: 0;
      background-color: var(--kd-color-brand);
    }

    :host([indeterminate]) .bar {
      width: 40%;
      animation: kd-loader-slide 1.2s ease-in-out infinite;
    }

    @keyframes kd-loader-slide {
      0% {
        left: -40%;
      }
      100% {
        left: 100%;
      }
    }
  `;

  @property({ type: Number }) value = 0;

  @property({ type: Boolean, reflect: true }) indeterminate = false;

  render() {
    const percent = Math.min(100, Math.max(0, this.value));
    const style = this.indeterminate ? "" : `width: ${percent}%`;

    return html`<div
      class="track"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow=${ifDefined(this.indeterminate ? undefined : percent)}
    >
      <div class="bar" style=${style}></div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kd-progress-bar": KdProgressBar;
  }
}
