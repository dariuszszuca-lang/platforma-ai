(function (root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.AIReset = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CHECKLIST_STORAGE_KEY = 'ai-reset-checklist-v1';
  const FIELDS_STORAGE_KEY = 'ai-reset-fields-v1';

  function calculateProgress(done, total) {
    if (!Number.isFinite(total) || total <= 0) {
      return 0;
    }

    const safeDone = Math.min(Math.max(Number(done) || 0, 0), total);
    return Math.round((safeDone / total) * 100);
  }

  function normalizeChecklistState(raw, validKeys) {
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};

    return validKeys.reduce(function (state, key) {
      state[key] = source[key] === true;
      return state;
    }, {});
  }

  function parseStoredObject(value) {
    try {
      const parsed = JSON.parse(value || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function readStorage(view, key) {
    try {
      return parseStoredObject(view.localStorage.getItem(key));
    } catch (_) {
      return {};
    }
  }

  function writeStorage(view, key, value) {
    try {
      view.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function showToast(doc, view, message) {
    const toast = doc.getElementById('copyStatus');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('is-visible');
    view.clearTimeout(toast.hideTimer);
    toast.hideTimer = view.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2800);
  }

  function fallbackCopy(doc, text) {
    const textarea = doc.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    doc.body.appendChild(textarea);
    textarea.select();
    const copied = doc.execCommand('copy');
    textarea.remove();
    return copied;
  }

  function copyPrompt(doc, view, button) {
    const target = doc.getElementById(button.dataset.copyTarget);
    if (!target) return Promise.reject(new Error('Nie znaleziono instrukcji.'));

    const text = target.textContent.trim();
    const clipboard = view.navigator && view.navigator.clipboard;
    const action = clipboard && typeof clipboard.writeText === 'function'
      ? clipboard.writeText(text)
      : Promise.resolve(fallbackCopy(doc, text));

    return action.then(function () {
      const label = button.querySelector('span');
      if (label) label.textContent = 'Skopiowane';
      button.classList.add('is-copied');
      showToast(doc, view, 'Instrukcja skopiowana. Wklej ją do swojego narzędzia AI.');

      view.setTimeout(function () {
        if (label) label.textContent = 'Kopiuj instrukcję';
        button.classList.remove('is-copied');
      }, 2200);
    });
  }

  function initBrowser(doc, view) {
    if (!doc || !view) return false;

    const checks = Array.from(doc.querySelectorAll('[data-reset-check]'));
    const fields = Array.from(doc.querySelectorAll('[data-local-field]'));
    const checkKeys = checks.map(function (check) { return check.dataset.key; });
    const savedChecks = normalizeChecklistState(
      readStorage(view, CHECKLIST_STORAGE_KEY),
      checkKeys,
    );
    const savedFields = readStorage(view, FIELDS_STORAGE_KEY);

    checks.forEach(function (check) {
      check.checked = savedChecks[check.dataset.key] === true;
    });

    fields.forEach(function (field) {
      const savedValue = savedFields[field.dataset.key];
      if (typeof savedValue === 'string') field.value = savedValue;
    });

    function updateProgress() {
      const completed = checks.filter(function (check) { return check.checked; }).length;
      const progress = calculateProgress(completed, checks.length);
      const bar = doc.getElementById('resetProgress');
      const value = doc.getElementById('resetProgressValue');
      const track = bar ? bar.parentElement : null;

      if (bar) bar.style.transform = 'scaleX(' + (progress / 100) + ')';
      if (value) value.textContent = progress + '%';
      if (track) track.setAttribute('aria-valuenow', String(progress));
    }

    function saveChecks() {
      const nextState = checks.reduce(function (state, check) {
        state[check.dataset.key] = check.checked;
        return state;
      }, {});
      writeStorage(view, CHECKLIST_STORAGE_KEY, nextState);
      updateProgress();
    }

    function saveFields() {
      const nextState = fields.reduce(function (state, field) {
        state[field.dataset.key] = field.value;
        return state;
      }, {});
      writeStorage(view, FIELDS_STORAGE_KEY, nextState);
    }

    checks.forEach(function (check) {
      check.addEventListener('change', saveChecks);
    });

    fields.forEach(function (field) {
      field.addEventListener('input', saveFields);
    });

    doc.querySelectorAll('[data-copy-target]').forEach(function (button) {
      button.addEventListener('click', function () {
        copyPrompt(doc, view, button).catch(function () {
          showToast(doc, view, 'Nie udało się skopiować. Zaznacz tekst instrukcji ręcznie.');
        });
      });
    });

    const printButton = doc.getElementById('printReset');
    if (printButton) {
      printButton.addEventListener('click', function () {
        view.print();
      });
    }

    const clearButton = doc.getElementById('clearReset');
    if (clearButton) {
      clearButton.addEventListener('click', function () {
        const confirmed = typeof view.confirm !== 'function'
          || view.confirm('Wyczyścić checklisty i wszystkie notatki zapisane w AI RESET?');
        if (!confirmed) return;

        try {
          view.localStorage.removeItem(CHECKLIST_STORAGE_KEY);
          view.localStorage.removeItem(FIELDS_STORAGE_KEY);
        } catch (_) {
          // Interfejs nadal można wyczyścić, nawet gdy pamięć przeglądarki jest zablokowana.
        }

        checks.forEach(function (check) { check.checked = false; });
        fields.forEach(function (field) { field.value = ''; });
        updateProgress();
        showToast(doc, view, 'AI RESET wyczyszczony na tym urządzeniu.');
      });
    }

    let closedForPrint = [];
    if (typeof view.addEventListener === 'function') {
      view.addEventListener('beforeprint', function () {
        closedForPrint = Array.from(doc.querySelectorAll('details:not([open])'));
        closedForPrint.forEach(function (details) { details.open = true; });
      });
      view.addEventListener('afterprint', function () {
        closedForPrint.forEach(function (details) { details.open = false; });
        closedForPrint = [];
      });
    }

    updateProgress();
    return true;
  }

  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        initBrowser(document, window);
      }, { once: true });
    } else {
      initBrowser(document, window);
    }
  }

  return {
    calculateProgress,
    normalizeChecklistState,
    parseStoredObject,
    initBrowser,
  };
}));
