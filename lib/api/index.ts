import { getSystemSettings } from '../db/system-settings.ts';
import removeTrailingSlash from '../utilities/remove-trailing-slash.ts';

export const setupAPI = async () => {
  const systemSettings = await getSystemSettings();
  const baseUrl = removeTrailingSlash(systemSettings?.localUrl || systemSettings?.openaiUrl || "");
  const model = systemSettings?.localModel || systemSettings?.openaiModel || "";
  const extraHeaders = systemSettings?.provider === 'openai' && typeof systemSettings?.openaiToken === 'string' ? {
    Authorization: `Bearer ${systemSettings?.openaiToken}`,
  } : {};

  return (url: string, options: { [key: string]: any; }) => fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      ...options?.headers,
      ...extraHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...options?.body,
      model,
    }),
  });
}

export default setupAPI;