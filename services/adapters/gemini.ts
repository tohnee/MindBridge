import { Message, PlatformAdapter } from '../../types';
import { delay } from '../domUtils';

export class GeminiAdapter implements PlatformAdapter {
  platformName = 'gemini' as const;

  async extractConversation(): Promise<Message[]> {
    const messages: Message[] = [];
    
    // Strategy: Look for specific containers usually found in Gemini.
    // Gemini often uses data-test-id attributes for user queries and model responses.
    // We select both and sort them by document position implicitly by querySelectorAll order if possible, 
    // or select a parent container and iterate children. 
    // Here we try a robust selector strategy based on observed attributes.
    
    const elements = document.querySelectorAll(
      '[data-test-id="user-query"], [data-test-id="model-response"], .user-query, .model-response'
    );

    elements.forEach((el) => {
      // Determine role
      let role: 'user' | 'assistant' = 'assistant';
      if (
        el.getAttribute('data-test-id') === 'user-query' || 
        el.classList.contains('user-query')
      ) {
        role = 'user';
      }

      // Extract text content. innerText is preferred to avoid hidden styling metadata.
      const textContent = (el as HTMLElement).innerText || el.textContent || '';
      
      if (textContent.trim()) {
        messages.push({
          role,
          content: textContent.trim(),
          timestamp: Date.now(),
        });
      }
    });

    return messages;
  }

  getInputElement(): HTMLElement | null {
    // Gemini uses a contenteditable div, often with role="textbox" or specific aria-labels.
    // We look for the main input area.
    return document.querySelector('div[contenteditable="true"][role="textbox"]') as HTMLElement ||
           document.querySelector('div[aria-label*="Enter a prompt"]') as HTMLElement;
  }

  async injectText(text: string): Promise<void> {
    const input = this.getInputElement();
    if (!input) throw new Error('Gemini input not found');

    input.focus();
    await delay(50);
    
    // Gemini's input is a rich text editor (likely ProseMirror or similar internally).
    // Setting textContent clears formatting and sets plain text, which is usually safer for code/markdown transfer.
    input.textContent = text;
    
    // Dispatch input event for the framework to pick up the change.
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  }
}