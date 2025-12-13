import { LitElement, html, css, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { customElement, state } from 'lit/decorators.js'
import { animate, fadeIn, fadeOut, flyBelow } from '@lit-labs/motion';
import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import { chatCompletions } from '../api/chat.ts';
import type { Message } from '../api/chat.ts';
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
  private _requiredFeaturesAvailable: boolean = false;

  @state()
  private _requiredSettingsAvailable: boolean = false;

  @state()
  private _messages: Message[] | null = null;

  @state()
  private _modalVariant: 'settings' | null = null;

  @state()
  private _loading: boolean = false;

  @state()
  private _speaking: boolean = false;

  @state()
  private _error: string | null = null;

  @state()
  private _synth: SpeechSynthesis | null = null;

  private _marked = new Marked(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code, langDraft) {
        const lang = langDraft
          .replace('javascriptx', 'javascript')
          .replace('jsx', 'javascript')
          .replace('vue', 'javascript');

        const language = hljs.getLanguage(lang) ? lang : 'plaintext';

        return hljs.highlight(code, { language }).value;
      }
    })
  )

  private _askController = new AbortController();

  async connectedCallback(): Promise<void> {
    super.connectedCallback();

    this._requiredFeaturesAvailable = supportsDB();

    this._requiredSettingsAvailable = await this._checkRequiredSettings();

    if ('speechSynthesis' in window) {
      this._synth = window.speechSynthesis;
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    
    // Clean up: abort any ongoing requests and stop speech
    this._askController.abort();
    if (this._synth) {
      this._synth.cancel();
    }
  }

  renderMessage(message: Message) {
    if (typeof message.content !== 'string' || !this._marked) {
      return nothing;
    }

    const dirtyContent: string = message.content;
    const parsedMarkdown = this._marked.parse(dirtyContent) as string;
    const cleanContent = DOMPurify.sanitize(parsedMarkdown);
    const voicesAvailable = Boolean(this._synth?.getVoices().length)

    return html`
      <div
        part="message"
        ${animate({
          keyframeOptions: {
            fill: 'both',
          },
          in: fadeIn,
          out: flyBelow,
          stabilizeOut: true,
        })}
      >
        ${message.role === 'assistant' ? html`
          <md-assist-chip label="Assistant" elevated>
            <md-icon slot="icon">🤖</md-icon>
          </md-assist-chip>
        ` : nothing}

        ${this._loading ? html`
          <md-assist-chip
            label="Stop"
            @click=${() => this._askController.abort()}
          >
            <md-icon slot="icon">🛑</md-icon>
          </md-assist-chip>
        ` : nothing}

        ${!this._loading && this._synth && voicesAvailable && !this._speaking ? html`
          <md-assist-chip
            label="Speak"
            @click=${this._speak}
          >
            <md-icon slot="icon">🔊</md-icon>
          </md-assist-chip>
        ` : nothing}

        ${!this._loading && this._synth && voicesAvailable && this._speaking ? html`
          <md-assist-chip
            label="Speak"
            @click=${() => {
              this._synth?.cancel();
              this._speaking = false;
            }}
          >
            <md-icon slot="icon">🔇</md-icon>
          </md-assist-chip>
        ` : nothing}

        <div>
          ${unsafeHTML(cleanContent)}
        </div>
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
      <div>
        ${this.renderSettings()}

        ${Array.isArray(this._messages) && this._messages.length > 0
          ? this._messages.map((message: Message) => this.renderMessage(message))
          : nothing}

        ${this._error ? html`
          <div
            part="error"
            ${animate({
              keyframeOptions: {
                fill: 'both',
              },
              in: fadeIn,
              out: fadeOut,
              stabilizeOut: true,
            })}
          >
            <p>❌ Error: ${this._error}</p>
            <md-filled-button @click=${() => { this._error = null; }}>Dismiss</md-filled-button>
          </div>
        ` : nothing}

        ${this._loading ? html`
          <div
            part="pad"
            ${animate({
              keyframeOptions: {
                fill: 'both',
              },
              in: fadeIn,
              out: fadeOut,
              stabilizeOut: true,
            })}
          >
            <p>🫠 Brace yourself! It might take a while...</p>

            <div part="loader"></div>
          </div>
        ` : nothing}

        <form @submit=${this._handleSubmit} part="prompt-form" ${animate()}>
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
    this._requiredSettingsAvailable = await this._checkRequiredSettings();
  }

  private async _checkRequiredSettings() {
    const systemSettings = await getSystemSettings();

    return systemSettings?.provider === 'local' || systemSettings?.provider === 'openai';
  }

  private async _getSystemPrompt() {
    const systemSettings = await getSystemSettings();

    if (systemSettings && typeof systemSettings.systemPrompt === 'string') {
      return systemSettings.systemPrompt;
    }

    return null;
  }

  private async _ask(prompt: string | null) {
    this._messages = null;
    this._loading = true;
    this._error = null;
    this._speaking = false; // Reset speaking state for new message
    this._askController = new AbortController();

    try {
      const systemPrompt = await this._getSystemPrompt();
      const response = await chatCompletions(prompt, systemPrompt, this._askController.signal);
      const decoder = new TextDecoder()

      if (!response?.body) {
        throw new Error('Failed to get response body');
      }

      const reader = response.body.getReader();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const decodedChunk = decoder.decode(value, { stream: true });

          const lines = decodedChunk
            .split('\n')
            .map((line) => line.replace(/^data: /, "").trim()) // Remove the "data: " prefix
            .filter((line) => line !== "" && line !== "[DONE]") // Remove empty lines and "[DONE]"
            .map((line) => {
              try {
                return JSON.parse(line);
              } catch {
                return null; // Skip invalid JSON lines
              }
            })
            .filter((line) => line !== null);

          for (const line of lines) {
            const content = line?.choices?.[0]?.delta?.content;

            if (typeof content === 'string') {
              const nextContent: string = `${this._messages?.[0]?.content || ''}${content}`;
              this._messages = [
                {
                  role: 'assistant',
                  content: nextContent,
                }
              ];
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      // Don't show error if user aborted the request
      if (error instanceof Error && error.name !== 'AbortError') {
        this._error = error.message;
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
      
      // Reset form after submission
      event.target.reset();
    }
  }

  private _speak() {
    if (this._synth && typeof this._messages?.[0]?.content === 'string') {
      const utterance = new SpeechSynthesisUtterance(this._messages[0].content);
      this._synth.speak(utterance);
      this._speaking = true;

      utterance.onend = () => {
        this._speaking = false;
      };
      
      utterance.onerror = () => {
        this._speaking = false;
        console.warn('Speech synthesis error');
      };
    } else {
      console.warn('There is a problem with the speak functionality.');
    }
  }

  static styles = [
    css`
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

      :host::part(error) {
        padding: 16px;
        border-radius: 8px;
        margin: 16px 0;
        background-color: color-mix(in oklab, red 20%, transparent);
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
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
    `,
    /**
     * Code highlight styles
     */
    css`
      pre code.hljs {
        display: block;
        overflow-x: auto;
        padding: 1em
      }
      code.hljs {
        padding: 3px 5px
      }
      /* Monokai Sublime style. Derived from Monokai by noformnocontent http://nn.mit-license.org/ */
      .hljs {
        background: #23241f;
        color: #f8f8f2
      }
      .hljs-tag,
      .hljs-subst {
        color: #f8f8f2
      }
      .hljs-strong,
      .hljs-emphasis {
        color: #a8a8a2
      }
      .hljs-bullet,
      .hljs-quote,
      .hljs-number,
      .hljs-regexp,
      .hljs-literal,
      .hljs-link {
        color: #ae81ff
      }
      .hljs-code,
      .hljs-title,
      .hljs-section,
      .hljs-selector-class {
        color: #a6e22e
      }
      .hljs-strong {
        font-weight: bold
      }
      .hljs-emphasis {
        font-style: italic
      }
      .hljs-keyword,
      .hljs-selector-tag,
      .hljs-name,
      .hljs-attr {
        color: #f92672
      }
      .hljs-symbol,
      .hljs-attribute {
        color: #66d9ef
      }
      .hljs-params,
      .hljs-title.class_,
      .hljs-class .hljs-title {
        color: #f8f8f2
      }
      .hljs-string,
      .hljs-type,
      .hljs-built_in,
      .hljs-selector-id,
      .hljs-selector-attr,
      .hljs-selector-pseudo,
      .hljs-addition,
      .hljs-variable,
      .hljs-template-variable {
        color: #e6db74
      }
      .hljs-comment,
      .hljs-deletion,
      .hljs-meta {
        color: #75715e
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'acw-root': ACWRoot
  }
}

export default ACWRoot;