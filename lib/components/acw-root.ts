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

  async connectedCallback(): Promise<void> {
    super.connectedCallback();

    this._requiredFeaturesAvailable = supportsDB();

    this._requiredSettingsAvailable = await this._checkRequredSettings();
  }

  renderMessage(message: Message) {
    return html`
      <div class="message">
        ${message.role === 'assistant' ? html`
          <md-assist-chip label="Assistant"></md-assist-chip>
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

        <form @submit=${this._handleSubmit} class="prompt-form">
          <md-outlined-text-field type="textarea" label="Prompt" name="prompt">
            <md-icon slot="leading-icon">🪄</md-icon>
          </md-outlined-text-field>

          <md-filled-button type="submit">✨ Ask AI</md-filled-button>
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
    const data = await chatCompletions(prompt);

    if (data && 'choices' in data && Array.isArray(data?.choices)) {
      this._messages = data?.choices?.map(
        (item: Choice) => item.message,
      );
    } else {
      alert('Error. There is a problem.')
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
    }
    .prompt-form {
      margin: 16px 0;
    }
    .message {
      padding: 8px;
      border-radius: 8px;
      margin: 16px 0;
      background-color: #ddd;
      overflow-wrap: break-word;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'acw-root': ACWRoot
  }
}

export default ACWRoot;