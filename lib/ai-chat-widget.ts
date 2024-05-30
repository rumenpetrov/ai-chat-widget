import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js'

type Message = {
  role: string;
  content: string;
};

type Choice = {
  message: Message;
};

type Completion = {
  choices: Choice[];
};

type ApiError = {
  error: {
		message: string;
	};
};

type CompletionResponse = Completion | ApiError

const chatCompletions = async (prompt: string | null): Promise<CompletionResponse> => {
  if (typeof prompt !== 'string' || prompt.length < 2) {
    return Promise.reject('There is a problem with the user input.');
  }

  const response = await fetch('http://localhost:1234/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'model': 'TheBloke/Mistral-7B-Instruct-v0.2-GGUF',
      'messages': [
        { 'role': 'system', 'content': 'You are a personal assistant. Answer any questions as precise as you can. Keep your messages quick and short.' },
        { 'role': 'user', 'content': prompt }
      ],
      'temperature': 0.5,
      'stream': false
    }),
  });
  return await response.json();
}

/**
 * AI chat
 *
 * @csspart button - The button
 */
@customElement('ai-chat-widget')
export class AIChatWidget extends LitElement {
  /**
   * The conversation
   */
  @state()
  private _messages: Message[] | null = null;

  renderMessage(message: Message) {
    return html`
      <div class="message">
        ${message.role === 'assistant' ? html`<h3 class="title" >AI:</h3>` : nothing}

        ${message.role === 'user' ? html`<h3 class="title" >You:</h3>` : nothing}

        <pre>
          ${message.content}
        </pre>
      </div>
    `;
  }

  render() {
    return html`
      <div>
        ${Array.isArray(this._messages) && this._messages.length > 0
          ? this._messages.map((message: Message) => this.renderMessage(message))
          : nothing}

        <form @submit=${this._handleSubmit}>
          <label for="fieldPrompt">Prompt</label>

          <textarea name="prompt" id="fieldPrompt"></textarea>

          <button type="submit" part="button">
            Ask AI
          </button>
        </form>
      </div>
    `;
  }

  private async _ask(prompt: string | null) {
    const data = await chatCompletions(prompt);

    if (data && 'choices' in data && Array.isArray(data?.choices)) {
      this._messages = data?.choices?.map(
        (item: Choice) => item.message,
      );
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
      text-align: center;
    }
    .title {
      font-weight: bold;
    }
    .message {
      border: 1px solid #000;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-chat-widget': AIChatWidget
  }
}

export default AIChatWidget;