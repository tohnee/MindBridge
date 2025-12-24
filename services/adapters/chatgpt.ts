import { Message, PlatformAdapter } from '../../types';
import { nativeInputValueSetter, delay } from '../domUtils';

export class ChatGPTAdapter implements PlatformAdapter {
  platformName = 'chatgpt' as const;

  async extractConversation(): Promise<Message[]> {
    const messages: Message[] = [];
    
    // Selectors for ChatGPT (Note: classes change often, data-attributes are safer if available)
    // This is a robust attempt strategy
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

    return messages;
  }

  getInputElement(): HTMLTextAreaElement | null {
    return document.querySelector('#prompt-textarea') as HTMLTextAreaElement;
  }

  async injectText(text: string): Promise<void> {
    const input = this.getInputElement();
    if (!input) throw new Error('ChatGPT input not found');

    input.focus();
    await delay(100);
    nativeInputValueSetter(input, text);
    await delay(100);
    
    // Optional: trigger height adjustment
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  }
}