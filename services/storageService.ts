import { ContextSession } from '../types';

// Fix: Declare chrome global to resolve TypeScript errors
declare var chrome: any;

const STORAGE_KEY = 'mindbridge_context';

export const saveContext = async (session: ContextSession): Promise<void> => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({ [STORAGE_KEY]: session });
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
};

export const getContext = async (): Promise<ContextSession | null> => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || null;
  } else {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }
};

export const clearContext = async (): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.remove(STORAGE_KEY);
    } else {
        localStorage.removeItem(STORAGE_KEY);
    }
}