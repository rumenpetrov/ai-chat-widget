import setupDB from './index.ts';

type Provider = 'none' | 'local' | 'openai';

export type SystemSettings = {
  provider: Provider;
  systemPrompt: string | null;
  localModel?: string | null;
  localUrl?: string | null;
  openaiModel?: string | null;
  openaiUrl?: string | null;
  openaiToken?: string | null;
};


export const getSystemSettings = async () => {
  const db = await setupDB();

  return await db.get('system-settings', 'root');
};

export const setSystemSettings = async (payload: SystemSettings) => {
  const db = await setupDB();

  if (await db.get('system-settings', 'root')) {
    return await db.put('system-settings', payload, 'root');
  }

  return await db.add('system-settings', payload, 'root');
};