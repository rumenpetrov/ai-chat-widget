import setupAPI from './index.ts';

export type Message = {
  role: string;
  content: string;
};

export type Choice = {
  message: Message;
};

export type Completion = {
  choices: Choice[];
};

export type ApiError = {
  error: {
    message: string;
  };
};

export type CompletionResponse = Completion | ApiError

const systemPromptFallback = 'You are a personal assistant. Answer any questions as precise as you can. Keep your messages quick and short.';

export const chatCompletions = async (prompt: string | null, systemPrompt: string | null, signal?: Object) => {
  const api = await setupAPI();

  if (typeof prompt !== 'string' || prompt.length < 2) {
    return Promise.reject('There is a problem with the user input.');
  }

  return await api('/chat/completions', {
    method: 'POST',
    body: {
      messages: [
        { 'role': 'system', 'content': systemPrompt || systemPromptFallback },
        { 'role': 'user', 'content': prompt }
      ],
      temperature: 0.5,
      stream: true,
      stream_options: {
        include_usage: true
      }
    },
    signal,
  });
};