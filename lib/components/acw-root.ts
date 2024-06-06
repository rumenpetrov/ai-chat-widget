import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js'
import { chatCompletions } from '../api/chat.ts';
import type { Choice, Message } from '../api/chat.ts';
import { supportsDB } from '../utilities/feature-detection.ts';
import { getSystemSettings } from '../db/system-settings.ts';
import '@material/web/button/elevated-button.js';
import '@material/web/button/filled-button.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/chips/assist-chip.js';
import '@material/web/iconbutton/outlined-icon-button.js';
import '@material/web/icon/icon.js';
import './acw-settings.ts';

/**
 * AI chat
 */
@customElement('acw-root')
class ACWRoot extends LitElement {
  @state()
  private _requiredFeaturesAvailable: Boolean = false;

  @state()
  private _requiredSettingsAvailable: Boolean = false;

  @state()
  private _messages: Message[] | null = null;

  @state()
  private _modalVariant: 'settings' | null = null;

  @state()
  private _loading: boolean = false;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();

    this._requiredFeaturesAvailable = supportsDB();

    this._requiredSettingsAvailable = await this._checkRequredSettings();
  }

  renderMessage(message: Message) {
    return html`
      <div part="message">
        ${message.role === 'assistant' ? html`
          <md-assist-chip label="Assistant">
            <md-icon slot="icon">🤖</md-icon>
          </md-assist-chip>
        ` : nothing}

        ${message.content.split("\n").map((paragraph) => html`
          <p>${paragraph}</p>
        `)}
      </div>
    `;
  }

  renderSettings() {
    return html`
      <md-outlined-icon-button
        type="button"
        @click=${() => { this._modalVariant = 'settings' }}
      >
        <md-icon>⚙️</md-icon>
      </md-outlined-icon-button>

      <acw-settings
        exportparts="root:settings-root,form:settings-form"
        .open=${this._modalVariant === 'settings'}
        @acw-settings--close=${this._handleSettingsClose}
      ></acw-settings>
    `;
  }

  render() {
    if (!this._requiredFeaturesAvailable) {
      return html`
        <p>This browser doesn't support the required features. Please upgrade to more modern browser.</p>
      `;
    }

    if (!this._requiredSettingsAvailable) {
      return html`
        <div>
          <p>Please configure settings first.</p>

          ${this.renderSettings()}
        </div>
      `;
    }

    return html`
      <div ?inert=${Boolean(this._modalVariant)}>
        ${this.renderSettings()}

        ${Array.isArray(this._messages) && this._messages.length > 0
          ? this._messages.map((message: Message) => this.renderMessage(message))
          : nothing}

        ${this._loading ? html`
          <div part="pad">
            <p>🫠 Brace yourself! It might take a while...</p>

            <div part="loader"></div>
          </div>
        ` : nothing}

        <form @submit=${this._handleSubmit} part="prompt-form">
          <md-outlined-text-field
            type="textarea"
            label="Prompt"
            name="prompt"
            part="prompt"
            ?disabled=${this._loading}
          >
            <md-icon slot="leading-icon">🪄</md-icon>
          </md-outlined-text-field>

          <md-filled-button type="submit" ?disabled=${this._loading}>✨ Ask AI</md-filled-button>
        </form>
      </div>
    `;
  }

  private async _handleSettingsClose() {
    this._modalVariant = null;
    this._requiredSettingsAvailable = await this._checkRequredSettings();
  }

  private async _checkRequredSettings() {
    const systemSettings = await getSystemSettings();

    return systemSettings?.provider === 'local' || systemSettings?.provider === 'openai';
  }

  private async _ask(prompt: string | null) {
    this._loading = true;

    try {
      const data = await chatCompletions(prompt);

      if (data && 'choices' in data && Array.isArray(data?.choices)) {
        this._messages = data?.choices?.map(
          (item: Choice) => item.message,
        );
      } else {
        alert('Error. There is a problem.')
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      this._loading = false;
    }
  }

  private _handleSubmit(event: FormDataEvent) {
    event.preventDefault();

    if (event.target && event.target instanceof HTMLFormElement) {
      const formState = new FormData(event.target);
      const nextPrompt = formState.get('prompt') as string | null;

      this._ask(nextPrompt);
    }
  }

  static styles = css`
    :host {
      display: block;
      padding: 16px;
      text-align: left;

      --_md-sys-color-primary: var(--md-sys-color-primary, rgb(103, 80, 164));
    }
    :host::part(prompt-form) {
      display: flex;
      gap: 16px;
      align-items: center;
      margin: 16px 0;
    }
    :host::part(prompt) {
      flex: 1 1 auto;
    }
    :host::part(message) {
      padding: 8px;
      border-radius: 8px;
      margin: 16px 0;
      background-color: color-mix(in oklab, currentcolor 20%, transparent);
      overflow-wrap: break-word;
    }

    :host::part(pad) {
      padding: 16px 0;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
    }

    :host::part(loader) {
      height: 8px;
      margin: 16px 0;
      aspect-ratio: 4;
      display: grid;
    }

    :host::part(loader)::before,
    :host::part(loader)::after {
      content: ' ';
      grid-area: 1/1;
      --_g: no-repeat radial-gradient(farthest-side, var(--_md-sys-color-primary) 94%, transparent);
      background:
        var(--_g) left,
        var(--_g) right;
      background-size: 25% 100%;
      animation: l34 1s infinite;
      transform: translate(var(--d,0)) rotate(0);
    }

    :host::part(loader)::after {
      --d: 37.5%;
      animation-delay: .5s;
    }

    @keyframes l34 {
      50%,100% {
        transform: translate(var(--d,0)) rotate(.5turn);
      }
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'acw-root': ACWRoot
  }
}

export default ACWRoot;