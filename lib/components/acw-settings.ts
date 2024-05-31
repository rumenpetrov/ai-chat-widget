import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@material/web/button/filled-button.js';

/**
 * Modal
 *
 * @csspart button - The button
 */
@customElement('acw-settings')
export class ACWSettings extends LitElement {
  @property({ type: Boolean })
  open = false;

  render() {
    return html`
      <dialog
        .open=${this.open}
        ?inert=${!this.open}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-description"
        part="root"
      >
        <form part="form">
          <header class="header">
            <h6 id="confirmation-dialog-title" class="title">Modal title</h6>

            <button
              type="button"
              class="button button-icon"
              @click=${this._handleClose}
              >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M4.39705 4.55379L4.46967 4.46967C4.73594 4.2034 5.1526 4.1792 5.44621 4.39705L5.53033 4.46967L12 10.939L18.4697 4.46967C18.7626 4.17678 19.2374 4.17678 19.5303 4.46967C19.8232 4.76256 19.8232 5.23744 19.5303 5.53033L13.061 12L19.5303 18.4697C19.7966 18.7359 19.8208 19.1526 19.6029 19.4462L19.5303 19.5303C19.2641 19.7966 18.8474 19.8208 18.5538 19.6029L18.4697 19.5303L12 13.061L5.53033 19.5303C5.23744 19.8232 4.76256 19.8232 4.46967 19.5303C4.17678 19.2374 4.17678 18.7626 4.46967 18.4697L10.939 12L4.46967 5.53033C4.2034 5.26406 4.1792 4.8474 4.39705 4.55379L4.46967 4.46967L4.39705 4.55379Z" />
              </svg>
            </button>
          </header>

          <div class="content" id="confirmation-dialog-description">
            <p>Modal body text goes here.</p>

            <div>
              <label for="provider">Provider</label>
              <select name="provider" id="provider">
                <option value="">None</option>
                <option value="local">Local server</option>
                <option value="openai">Open AI API</option>
              </select>
            </div>

            <div>
              <label for="local-url">URL</label>
              <input type="url" name="url" placeholder="http://localhost:1234/v1/" id="local-url" />
            </div>

            <div>
              <label for="openai-api-key">API keys</label>
              <input type="text" name="token" placeholder="sk-...xx" id="openai-api-key" />
            </div>
          </div>

          <footer class="footer">
            <button
              type="button"
              class="button button-secondary"
              @click=${this._handleClose}
              >
              Close
            </button>

            <md-filled-button type="submit">Save changes</md-filled-button>
            <!-- <button
              type="submit"
              class="button button-primary"
              >
              Save changes
            </button> -->
          </footer>
        </form>
      </dialog>
    `;
  }

  private _handleClose = () => {
    const customEvent = new CustomEvent('acw-settings--close', {
      bubbles: true,
      composed: true,
      detail: {}
    });

    this.renderRoot.dispatchEvent(customEvent);
  }

  static styles = css`
    :host {}
    .header {}
    .title {}
    .content {}
    .footer {}
    .button {
      padding: 4px;
    }
    svg {
      display: inline-block;
      width: 1em;
      height: 1em;
      fill: currentColor;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'acw-settings': ACWSettings
  }
}

export default ACWSettings;