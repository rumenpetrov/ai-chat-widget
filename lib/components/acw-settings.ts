import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@material/web/button/elevated-button.js';
import '@material/web/button/filled-button.js';
import '@material/web/iconbutton/outlined-icon-button.js';
import '@material/web/select/outlined-select.js';
import '@material/web/select/select-option.js';
import '@material/web/textfield/outlined-text-field.js';

/**
 * Modal
 *
 * @csspart button - The button
 */
@customElement('acw-settings')
export class ACWSettings extends LitElement {
  @property({ type: Boolean, reflect: true })
  open = false;

  @state()
  private _providerValue: string | null = null;

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (name === 'open' && typeof value === 'string') {
      // Using just the "open" attribute doesn't add backdrop - https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog#open
      this.renderRoot.querySelector('dialog')?.showModal();
    } else if (name === 'open' && value === null) {
      this.renderRoot.querySelector('dialog')?.close();
    }
  }

  render() {
    return html`
      <dialog
        ?open=${this.open}
        ?inert=${!this.open}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        part="root"
        @close=${this._handleClose}
      >
        <form part="form" part="form" @submit=${this._handleSubmit}>
          <header part="header">
            <h6 id="dialog-title" part="title">Settings</h6>

            <md-outlined-icon-button
              type="reset"
              class="icon-button"
              @click=${this._handleClose}
            >
              <md-icon>✖️</md-icon>
            </md-outlined-icon-button>
          </header>

          <div part="content">
            <p part="description" id="dialog-description">Select your AI provider and tweak the related settings.</p>

            <div part="form-row">
              <md-outlined-select name="provider" label="Provider" class="field-full" @change=${this._handleProviderChange}>
                <md-select-option aria-label="blank" value="">None</md-select-option>
                <md-select-option value="local" disabled>
                  <div slot="headline">Local server</div>
                </md-select-option>
                <md-select-option value="openai" disabled>
                  <div slot="headline">Open AI API</div>
                </md-select-option>
              </md-outlined-select>
            </div>

            ${this._providerValue === 'local' ? html`
              <div part="form-row">
                <md-outlined-text-field type="url" name="url" label="API URL" placeholder="http://localhost:1234/v1/" class="field-full"></md-outlined-text-field>
              </div>
            ` : nothing}

            ${this._providerValue === 'openai' ? html`
              <input type="hidden" name="url" value="https://api.openai.com/v1/" />
            ` : nothing}

            ${this._providerValue === 'openai' ? html`
              <div part="form-row">
                <md-outlined-text-field type="text" name="token" label="API key" placeholder="sk-...xx" class="field-full"></md-outlined-text-field>
              </div>
            ` : nothing}
          </div>

          <footer part="footer">
            <md-elevated-button type="reset" @click=${this._handleClose}>Cancel</md-elevated-button>
            <md-filled-button type="submit">Save changes</md-filled-button>
          </footer>
        </form>
      </dialog>
    `;
  }

  private _handleProviderChange(event: Event) {
    if (event.target && 'value' in event.target && typeof event.target.value === 'string') {
      this._providerValue = event.target.value;
    }
  }

  private _handleSubmit(event: FormDataEvent) {
    event.preventDefault();

    if (event.target && event.target instanceof HTMLFormElement) {
      const formState = new FormData(event.target);
      const nextProvider = formState.get('provider') as string | null;

      console.log('formState', formState)
      console.log('nextProvider', nextProvider)
    }
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
    :host {
      display: block;
    }
    ::part(root) {
      box-sizing: border-box;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate3d(-50%, -50%, 0);
      margin: 0;
      width: 60vw;
      max-width: 600px;
      min-width: 300px;
      border: none;
      border-radius: 8px;
    }
    ::part(header) {
      display: flex;
      align-items: center;
    }
    ::part(title) {
      margin: 0;
      font-size: 24px;
      line-height: 1.2;
    }
    .icon-button {
      margin-left: auto;
    }
    ::part(content) {
      padding: 32px 0;
    }
    ::part(description) {
      margin: 0;
      padding-bottom: 8px;
    }
    ::part(footer) {
      text-align: right;
    }
    ::part(form-row) {
      margin: 16px 0;
    }
    .field-full {
      width: 100%;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'acw-settings': ACWSettings
  }
}

export default ACWSettings;