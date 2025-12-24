import { Message, PlatformAdapter } from '../../types';
import { delay } from '../domUtils';

export class ClaudeAdapter implements PlatformAdapter {
  platformName = 'claude' as const;

  async extractConversation(): Promise<Message[]> {
    const messages: Message[] = [];
    // Claude often uses specific font classes or data attributes
    // Strategy: Look for message containers
    const containers = document.querySelectorAll('.font-user-message, .font-claude-message');

    containers.forEach((el) => {
        const isUser = el.classList.contains('font-user-message');
        messages.push({
            role: isUser ? 'user' : 'assistant',
            content: el.textContent || '',
            timestamp: Date.now()
        });
    });

    return messages;
  }

  getInputElement(): HTMLElement | null {
    // Claude uses a contenteditable div often
    return document.querySelector('div[contenteditable="true"]');
  }

  async injectText(text: string): Promise<void> {
    const input = this.getInputElement();
    if (!input) throw new Error('Claude input not found');

    input.focus();
    await delay(50);
    
    // Contenteditable injection is different from textarea
    input.innerHTML = `<p>${text}</p>`;
    
    // Dispatch input event for React to pick it up
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  }
}