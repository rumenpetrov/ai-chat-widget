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

export const chatCompletions = async (prompt: string | null): Promise<CompletionResponse> => {
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
};