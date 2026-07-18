import React from 'react';

/**
 * KeyDown event handler to enable keyboard navigation within forms.
 * Pressing 'Enter' inside an input field shifts focus to the next input/focusable field
 * instead of submitting the form immediately.
 */
export function handleFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
  if (e.key === 'Enter') {
    const target = e.target as HTMLElement;

    // Don't intercept Enter on textareas, buttons, or submit/reset inputs
    if (
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'BUTTON' ||
      (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'submit')
    ) {
      return;
    }

    // Prevent default form submission
    e.preventDefault();

    // Get all focusable elements inside the form
    const form = e.currentTarget;
    const focusableElements = Array.from(
      form.querySelectorAll(
        'input:not([disabled]):not([readonly]), select:not([disabled]), button:not([disabled]):not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    const index = focusableElements.indexOf(target);
    if (index > -1 && index < focusableElements.length - 1) {
      // Find the next focusable element that is visible
      let nextIndex = index + 1;
      while (nextIndex < focusableElements.length) {
        const nextEl = focusableElements[nextIndex];
        if (nextEl.offsetWidth > 0 && nextEl.offsetHeight > 0 && nextEl.getAttribute('tabindex') !== '-1') {
          nextEl.focus();
          break;
        }
        nextIndex++;
      }
    }
  }
}
