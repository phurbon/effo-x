(() => {
  'use strict';

  const GUARDED_TYPES = new Set(['text', 'email', 'search', 'tel', 'url', 'password']);
  const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
  const TAG_CHARS = /[<>]/g;
  const SCRIPT_PROTOCOL = /(javascript|vbscript|data):/gi;
  const EVENT_HANDLER = /\bon\w+\s*=/gi;
  const MULTISPACE = /\s{2,}/g;
  const DEFAULT_MAX = 180;
  const WARNING_MESSAGE = 'Suspicious characters were removed to keep this form secure.';

  const guardedForms = new WeakSet();
  const guardedFields = new WeakSet();

  const sanitizeValue = (value, limit) => {
    if (typeof value !== 'string') {
      return { sanitized: '', flagged: false };
    }
    let sanitized = value;
    try { sanitized = sanitized.normalize('NFKC'); } catch (_) { /* noop */ }
    sanitized = sanitized.replace(CONTROL_CHARS, '');
    sanitized = sanitized.replace(SCRIPT_PROTOCOL, '');
    sanitized = sanitized.replace(EVENT_HANDLER, ' ');
    sanitized = sanitized.replace(TAG_CHARS, '');
    sanitized = sanitized.replace(MULTISPACE, ' ');
    if (typeof limit === 'number' && limit > 0) {
      sanitized = sanitized.slice(0, limit);
    }
    const flagged = sanitized !== value;
    return { sanitized: sanitized.trimStart(), flagged };
  };

  const getMaxLength = (field) => {
    const dataLimit = parseInt(field.dataset.maxSafeLen, 10);
    if (Number.isFinite(dataLimit) && dataLimit > 0) return Math.min(dataLimit, 512);
    const attrLimit = parseInt(field.getAttribute('maxlength'), 10);
    if (Number.isFinite(attrLimit) && attrLimit > 0) return Math.min(attrLimit, 512);
    return DEFAULT_MAX;
  };

  const shouldGuardField = (field) => {
    if (!field || guardedFields.has(field)) return false;
    if (field.disabled || field.readOnly) return false;
    if (field.type === 'hidden') return false;
    if (field.matches('[data-allow-unsafe="true"]')) return false;
    if (field.tagName === 'TEXTAREA') return true;
    const type = (field.getAttribute('type') || 'text').toLowerCase();
    return GUARDED_TYPES.has(type);
  };

  const applyWarning = (field, message = WARNING_MESSAGE) => {
    field.classList.add('security-field-warning');
    field.setAttribute('aria-invalid', 'true');
    if (typeof field.setCustomValidity === 'function') {
      field.setCustomValidity(message);
    }
  };

  const clearWarning = (field) => {
    field.classList.remove('security-field-warning');
    field.removeAttribute('aria-invalid');
    if (typeof field.setCustomValidity === 'function') {
      field.setCustomValidity('');
    }
  };

  const scrubField = (field) => {
    const { sanitized, flagged } = sanitizeValue(field.value, getMaxLength(field));
    if (sanitized !== field.value) {
      const cursorPos = field.selectionStart;
      field.value = sanitized;
      if (typeof cursorPos === 'number') {
        const safePos = Math.min(cursorPos, sanitized.length);
        try { field.setSelectionRange(safePos, safePos); } catch (_) { /* noop */ }
      }
    }
    if (flagged) {
      applyWarning(field);
    } else {
      clearWarning(field);
    }
    return flagged;
  };

  const onFieldInput = (event) => {
    scrubField(event.currentTarget);
  };

  const onFieldBlur = (event) => {
    scrubField(event.currentTarget);
  };

  const guardField = (field) => {
    if (!shouldGuardField(field)) return;
    guardedFields.add(field);
    if (!field.hasAttribute('autocomplete')) {
      field.setAttribute('autocomplete', 'off');
    }
    if (field.type === 'tel' && !field.hasAttribute('inputmode')) {
      field.setAttribute('inputmode', 'numeric');
    }
    field.addEventListener('input', onFieldInput);
    field.addEventListener('blur', onFieldBlur);
    scrubField(field);
  };

  const collectGuardedFields = (form) => (
    Array.from(form.querySelectorAll('input, textarea'))
      .filter((field) => {
        guardField(field);
        return shouldGuardField(field);
      })
  );

  const onFormSubmit = (event) => {
    const form = event.currentTarget;
    const fields = collectGuardedFields(form);
    for (const field of fields) {
      if (scrubField(field)) {
        event.preventDefault();
        field.focus();
        if (typeof field.reportValidity === 'function') {
          field.reportValidity();
        }
        break;
      } else {
        clearWarning(field);
      }
    }
  };

  const guardForm = (form) => {
    if (!form || guardedForms.has(form)) return;
    guardedForms.add(form);
    form.addEventListener('submit', onFormSubmit, true);
    collectGuardedFields(form);
  };

  const secureAllForms = () => {
    document.querySelectorAll('form').forEach(guardForm);
  };

  const init = () => {
    if (!document.body) return;
    secureAllForms();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.tagName === 'FORM') {
            guardForm(node);
          }
          node.querySelectorAll?.('form').forEach(guardForm);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('partialsLoaded', secureAllForms);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
