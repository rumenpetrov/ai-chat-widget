import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { getSystemSettings, setSystemSettings } from '../db/system-settings.ts';
import type { SystemSettings } from '../db/system-settings.ts';
import capitalizeFirstLetter from '../utilities/capitalize-first-letter.ts';
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
  private _formValueProvider: string = "none";

  @state()
  private _formValueLocalModel: string = "";

  @state()
  private _formValueLocalUrl: string = "";

  @state()
  private _formValueOpenaiModel: string = "";

  @state()
  private _formValueOpenaiToken: string = "";

  get form() {
    return this.renderRoot?.querySelector('form') ?? null;
  }

  async connectedCallback(): Promise<void> {
    super.connectedCallback();

    const systemSettings = await getSystemSettings();

    this._resetFormState(systemSettings);
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    super.attributeChangedCallback(name, _old, value);

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
        <form part="form" part="form" @input=${this._handleFormChange} @submit=${this._handleSubmit}>
          <header part="header">
            <h6 id="dialog-title" part="title">Settings</h6>

            <md-outlined-icon-button
              type="button"
              class="icon-button"
              @click=${this._handleClose}
            >
              <md-icon>✖️</md-icon>
            </md-outlined-icon-button>
          </header>

          <div part="content">
            <p part="description" id="dialog-description">Select your AI provider and tweak the related settings.</p>

            <div part="form-row">
              <md-outlined-select
                name="provider"
                label="Provider"
                class="field-full"
                value=${this._formValueProvider}
              >
                <md-select-option aria-label="blank" value="none">None</md-select-option>
                <md-select-option value="local">
                  <div slot="headline">Local server</div>
                </md-select-option>
                <md-select-option value="openai">
                  <div slot="headline">Open AI API</div>
                </md-select-option>
              </md-outlined-select>
            </div>

            ${this._formValueProvider === 'local' ? html`
              <div part="form-row">
                <md-outlined-text-field
                  type="text"
                  name="localModel"
                  required
                  label="Model"
                  placeholder="E.g. TheBloke/Mistral-7B-Instruct-v0.2-GGUF"
                  class="field-full"
                  value=${this._formValueLocalModel}
                ></md-outlined-text-field>
              </div>
            ` : nothing}

            ${this._formValueProvider === 'local' ? html`
              <div part="form-row">
                <md-outlined-text-field
                  type="url"
                  name="localUrl"
                  required
                  label="API URL"
                  placeholder="E.g. http://localhost:1234/v1/"
                  class="field-full"
                  value=${this._formValueLocalUrl}
                ></md-outlined-text-field>
              </div>
            ` : nothing}

            ${this._formValueProvider === 'openai' ? html`
              <input type="hidden" name="openaiUrl" value="https://api.openai.com/v1/" readOnly />
            ` : nothing}

            ${this._formValueProvider === 'openai' ? html`
              <div part="form-row">
                <md-outlined-text-field
                  type="text"
                  name="openaiModel"
                  required
                  label="Model"
                  placeholder="E.g. gpt-3.5-turbo"
                  class="field-full"
                  value=${this._formValueOpenaiModel}
                ></md-outlined-text-field>
              </div>
            ` : nothing}

            ${this._formValueProvider === 'openai' ? html`
              <div part="form-row">
                <md-outlined-text-field
                  type="text"
                  name="openaiToken"
                  required
                  label="API key"
                  placeholder="E.g. sk-...xx"
                  class="field-full"
                  value=${this._formValueOpenaiToken}
                ></md-outlined-text-field>
              </div>
            ` : nothing}
          </div>

          <footer part="footer">
            <md-elevated-button type="button" @click=${this._handleClose}>Cancel</md-elevated-button>
            <md-filled-button type="submit">Save changes</md-filled-button>
          </footer>
        </form>
      </dialog>
    `;
  }

  private _resetFormState(formState?: Object) {
    if (formState) {
      const formFieldNames = Object.keys(formState);

      if (Array.isArray(formFieldNames) && formFieldNames.length > 0) {
        formFieldNames.forEach((key: string) => {
          // @ts-ignore
          this._changeFieldStateByName(key, formState?.[key] || "");
        })
      }
    }
  }

  private _changeFieldStateByName(name: string, value: string) {
    const stateName = `_formValue${capitalizeFirstLetter(name)}`;

    // @ts-ignore
    this[stateName] = value;
  }

  private _handleFormChange(event: Event) {
    if (
      event.target
      && 'name' in event.target
      && typeof event.target.name === 'string'
      && 'value' in event.target
      && typeof event.target.value === 'string'
    ) {
      this._changeFieldStateByName(event.target.name, event.target.value);
    }
  }

  private _handleSubmit(event: FormDataEvent) {
    event.preventDefault();

    if (event.target && event.target instanceof HTMLFormElement) {
      const formState = Object.fromEntries(new FormData(event.target).entries()) as SystemSettings;

      setSystemSettings(formState)
        .then(response => {
          this._handleClose();

          return response;
        })
        .catch((error) => {
          if (typeof error?.message === 'string') {
            alert(error.message);
          }
        });
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
    :host::part(root) {
      box-sizing: border-box;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate3d(-50%, -50%, 0);
      margin: 0;
      width: 60vw;
      max-width: 600px;
      min-width: 300px;
      border: 1px solid color-mix(in oklab, currentColor 70%, transparent);
      border-radius: 8px;
    }
    dialog::backdrop {
      backdrop-filter: blur(1px);
    }
    :host::part(header) {
      display: flex;
      align-items: center;
    }
    :host::part(title) {
      margin: 0;
      font-size: 24px;
      line-height: 1.2;
    }
    .icon-button {
      margin-left: auto;
    }
    :host::part(content) {
      padding: 32px 0;
    }
    :host::part(description) {
      margin: 0;
      padding-bottom: 8px;
    }
    :host::part(footer) {
      text-align: right;
    }
    :host::part(form-row) {
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