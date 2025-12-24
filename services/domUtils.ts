/**
 * Handles the difficult task of setting values on React/Vue controlled inputs.
 * Simply setting .value often fails because the internal state tracker ignores it.
 */
export function nativeInputValueSetter(element: HTMLElement, value: string): void {
  const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter?.call(element, value);
  } else {
    valueSetter?.call(element, value);
  }

  element.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Simulates a delay to make interactions feel more natural or wait for UI updates.
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));