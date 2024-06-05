import { openDB, DBSchema } from 'idb';
import type { SystemSettings } from './system-settings.ts';

/**
 * Refs:
 * - https://github.com/jakearchibald/idb?tab=readme-ov-file
 * - https://web.dev/articles/indexeddb
 */
interface ACWDB extends DBSchema {
  'system-settings': {
    key: string;
    value: SystemSettings;
  };
}

const dbVersion = 1;
export const setupDB = async () => {
  return await openDB<ACWDB>('acw-db', dbVersion, {
    upgrade(db) {
      db.createObjectStore('system-settings');
    },
  });
}

export default setupDB;
