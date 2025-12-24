/**
 * This file contains self-contained functions intended to be injected via chrome.scripting.executeScript.
 * CRITICAL: These functions CANNOT import external modules/helpers because they run in the context of the tab,
 * where those modules do not exist. All logic (including helpers) must be inlined or passed as args.
 */

import { Message, Platform } from '../types';

// --- Type Definitions for Injection Results ---
export interface ExtractionResult {
  success: boolean;
  platform: Platform | null;
  topic?: string;
  messages: Message[];
  error?: string;
}

// --- Extractor Functions ---

export const extractChatGPTContext = (): ExtractionResult => {
  try {
    const messages: Message[] = [];
    // Selectors for ChatGPT
    const messageElements = document.querySelectorAll('div[data-message-author-role]');

    messageElements.forEach((el) => {
      const role = el.getAttribute('data-message-author-role') as 'user' | 'assistant';
      const textContent = el.textContent || '';
      
      if (textContent && role) {
        messages.push({
          role,
          content: textContent,
          timestamp: Date.now(),
        });
      }
    });

    return {
      success: true,
      platform: 'chatgpt',
      topic: document.title.replace('ChatGPT', '').trim() || 'New Chat',
      messages: messages
    };
  } catch (e: any) {
    return { success: false, platform: 'chatgpt', messages: [], error: e.message };
  }
};

export const extractClaudeContext = (): ExtractionResult => {
  try {
    const messages: Message[] = [];
    const containers = document.querySelectorAll('.font-user-message, .font-claude-message');

    containers.forEach((el) => {
        const isUser = el.classList.contains('font-user-message');
        messages.push({
            role: isUser ? 'user' : 'assistant',
            content: el.textContent || '',
            timestamp: Date.now()
        });
    });

    return {
        success: true,
        platform: 'claude',
        topic: document.title.replace('Claude', '').trim() || 'Conversation',
        messages: messages
    };
  } catch (e: any) {
    return { success: false, platform: 'claude', messages: [], error: e.message };
  }
};

export const extractGeminiContext = (): ExtractionResult => {
  try {
    const messages: Message[] = [];
    // Gemini Selectors
    const elements = document.querySelectorAll(
      '[data-test-id="user-query"], [data-test-id="model-response"], .user-query, .model-response'
    );

    elements.forEach((el) => {
      let role: 'user' | 'assistant' = 'assistant';
      if (
        el.getAttribute('data-test-id') === 'user-query' || 
        el.classList.contains('user-query')
      ) {
        role = 'user';
      }
      
      const textContent = (el as HTMLElement).innerText || el.textContent || '';
      if (textContent.trim()) {
        messages.push({
          role,
          content: textContent.trim(),
          timestamp: Date.now(),
        });
      }
    });

    return {
        success: true,
        platform: 'gemini',
        topic: document.title.replace('Gemini', '').trim() || 'Gemini Chat',
        messages: messages
    };
  } catch (e: any) {
    return { success: false, platform: 'gemini', messages: [], error: e.message };
  }
};


// --- Injector Functions ---

export const injectContentIntoPage = (platform: Platform, text: string) => {
  // Inline Helper: Native Input Setter
  const nativeInputValueSetter = (element: HTMLElement, value: string) => {
    const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  
    if (valueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter?.call(element, value);
    } else {
      valueSetter?.call(element, value);
    }
    element.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const run = async () => {
    if (platform === 'chatgpt') {
        const input = document.querySelector('#prompt-textarea') as HTMLTextAreaElement;
        if (input) {
            input.focus();
            await delay(100);
            nativeInputValueSetter(input, text);
            input.style.height = 'auto';
            input.style.height = `${input.scrollHeight}px`;
        }
    } else if (platform === 'claude') {
        const input = document.querySelector('div[contenteditable="true"]') as HTMLElement;
        if (input) {
            input.focus();
            await delay(50);
            input.innerHTML = `<p>${text}</p>`;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } else if (platform === 'gemini') {
        const input = document.querySelector('div[contenteditable="true"][role="textbox"]') as HTMLElement ||
                      document.querySelector('div[aria-label*="Enter a prompt"]') as HTMLElement;
        if (input) {
            input.focus();
            await delay(50);
            input.textContent = text; // Plain text for Gemini usually works better
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
  };

  run();
};