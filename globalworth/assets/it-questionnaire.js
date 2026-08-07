(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.GlobalworthIT = api;
    var boot = function () {
      var mountPoint = root.document.getElementById('it-questionnaire');
      if (!mountPoint) return;
      var storage = null;
      var storageError = null;
      try {
        storage = root.localStorage;
      } catch (error) {
        storageError = error;
      }
      api.mount(mountPoint, {
        storage: storage,
        storageError: storageError,
        location: root.location,
        document: root.document,
        window: root,
      });
    };
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var STORAGE_KEY = 'aiteam.globalworth.it-questionnaire.v1';
  var SCHEMA_VERSION = 1;

  var QUESTION_GROUPS = [
    {
      id: 'tools',
      title: 'Dopuszczone narzędzia i polityka AI',
      shortTitle: 'Polityka AI',
      questions: [
        { id: 'it-tools-01', number: 1, text: 'Jakie narzędzia AI są oficjalnie dopuszczone do użytku?' },
        { id: 'it-tools-02', number: 2, text: 'Czy istnieje wewnętrzna polityka korzystania z AI i jakie ma ograniczenia?' },
        { id: 'it-tools-03', number: 3, text: 'Czy dane firmowe lub dane najemców mogą trafiać do narzędzi AI w wersji enterprise?' },
      ],
    },
    {
      id: 'systems',
      title: 'Microsoft 365, systemy i integracje',
      shortTitle: 'Systemy',
      questions: [
        { id: 'it-systems-04', number: 4, text: 'Na jakim środowisku pracują zespoły: Microsoft 365, Google Workspace czy innym?' },
        { id: 'it-systems-05', number: 5, text: 'Czy jest wdrożony Microsoft 365 Copilot lub inny asystent w obecnych licencjach?' },
        { id: 'it-systems-06', number: 6, text: 'Jakich systemów używa zespół do zgłoszeń, relacji z najemcami, umów i budżetów?' },
        { id: 'it-systems-07', number: 7, text: 'Czy te systemy mają interfejsy integracyjne i czy logowanie odbywa się przez SSO?' },
      ],
    },
    {
      id: 'data',
      title: 'Dane, chmura i rezydencja',
      shortTitle: 'Dane',
      questions: [
        { id: 'it-data-08', number: 8, text: 'Czy dane muszą pozostać w Unii Europejskiej lub konkretnej lokalizacji?' },
        { id: 'it-data-09', number: 9, text: 'Czy jest wymagany dostawca chmury lub firmowy tenant?' },
        { id: 'it-data-10', number: 10, text: 'Czy treści maili i umów mogą być przetwarzane w usłudze zewnętrznej, czy wyłącznie w środowisku Globalworth?' },
      ],
    },
    {
      id: 'security',
      title: 'Bezpieczeństwo, RODO i akceptacja',
      shortTitle: 'RODO i bezpieczeństwo',
      questions: [
        { id: 'it-security-11', number: 11, text: 'Jak wygląda proces dopuszczenia nowego narzędzia lub dostawcy i ile zwykle trwa?' },
        { id: 'it-security-12', number: 12, text: 'Czy wymagana jest umowa powierzenia danych oraz dodatkowe klauzule bezpieczeństwa?' },
        { id: 'it-security-13', number: 13, text: 'Czy dane najemców podlegają dodatkowym zasadom, na przykład anonimizacji?' },
        { id: 'it-security-14', number: 14, text: 'Czy pracownicy mogą instalować aplikacje i korzystać z narzędzi zewnętrznych?' },
        { id: 'it-security-15', number: 15, text: 'Jakie ograniczenia dotyczą internetu i zewnętrznych interfejsów z komputerów firmowych?' },
      ],
    },
    {
      id: 'owner',
      title: 'Właściciel decyzji po stronie IT',
      shortTitle: 'Właściciel decyzji',
      questions: [
        { id: 'it-owner-16', number: 16, text: 'Kto jest właścicielem decyzji o dopuszczeniu narzędzi AI i z kim uzgadniamy architekturę oraz bezpieczeństwo?' },
      ],
    },
  ];

  function allQuestions() {
    return QUESTION_GROUPS.reduce(function (questions, group) {
      return questions.concat(group.questions.map(function (question) {
        return Object.assign({ groupId: group.id, groupTitle: group.title }, question);
      }));
    }, []);
  }

  function emptyAnswer() {
    return {
      state: '',
      detail: '',
      source: '',
      missingInfo: '',
      owner: '',
      targetDate: '',
      notApplicableReason: '',
      confirmedBy: '',
      updatedAt: '',
    };
  }

  function makeId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'response-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function createEmptyResponse(now, id) {
    var timestamp = now || new Date().toISOString();
    var answers = {};
    allQuestions().forEach(function (question) {
      answers[question.id] = emptyAnswer();
    });
    return {
      schemaVersion: SCHEMA_VERSION,
      projectId: 'globalworth-property-ai',
      responseId: id || makeId(),
      status: 'draft',
      currentStep: 0,
      respondent: { name: '', email: '', role: '' },
      dataNoticeAccepted: false,
      website: '',
      answers: answers,
      createdAt: timestamp,
      updatedAt: timestamp,
      submittedAt: null,
      serverSubmissionId: '',
    };
  }

  function text(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function validateAnswer(answer) {
    var value = answer || {};
    var errors = [];
    var qualityWarning = false;

    if (value.state === 'answered') {
      if (text(value.detail).length < 30) errors.push('detail');
      qualityWarning = Boolean(text(value.detail)) && text(value.detail).length < 60;
    } else if (value.state === 'needs_clarification') {
      if (text(value.missingInfo).length < 20) errors.push('missingInfo');
      if (text(value.owner).length < 2) errors.push('owner');
      qualityWarning = Boolean(text(value.missingInfo)) && text(value.missingInfo).length < 40;
    } else if (value.state === 'not_applicable') {
      if (text(value.notApplicableReason).length < 20) errors.push('notApplicableReason');
      qualityWarning = Boolean(text(value.notApplicableReason)) && text(value.notApplicableReason).length < 40;
    } else {
      errors.push('state');
    }

    return {
      complete: errors.length === 0,
      errors: errors,
      qualityWarning: qualityWarning,
    };
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value));
  }

  function validateResponse(response) {
    var value = response || {};
    var respondent = value.respondent || {};
    var respondentErrors = [];
    var answerErrors = {};

    if (!text(respondent.name)) respondentErrors.push('name');
    if (!validEmail(respondent.email)) respondentErrors.push('email');
    if (value.dataNoticeAccepted !== true) respondentErrors.push('dataNoticeAccepted');

    allQuestions().forEach(function (question) {
      var result = validateAnswer(value.answers && value.answers[question.id]);
      if (!result.complete) answerErrors[question.id] = result.errors;
    });

    return {
      complete: respondentErrors.length === 0 && Object.keys(answerErrors).length === 0,
      respondentErrors: respondentErrors,
      answerErrors: answerErrors,
    };
  }

  function summarizeResponse(response) {
    var value = response || {};
    var answers = value.answers || {};
    var summary = {
      total: allQuestions().length,
      complete: 0,
      answered: 0,
      needsClarification: 0,
      notApplicable: 0,
      incomplete: 0,
      qualityWarnings: 0,
      openItems: [],
    };

    allQuestions().forEach(function (question) {
      var answer = answers[question.id] || emptyAnswer();
      var result = validateAnswer(answer);
      if (result.complete) summary.complete += 1;
      else summary.incomplete += 1;
      if (result.qualityWarning) summary.qualityWarnings += 1;

      if (answer.state === 'answered' && result.complete) summary.answered += 1;
      if (answer.state === 'needs_clarification' && result.complete) {
        summary.needsClarification += 1;
        summary.openItems.push({
          questionId: question.id,
          number: question.number,
          question: question.text,
          groupTitle: question.groupTitle,
          missingInfo: text(answer.missingInfo),
          owner: text(answer.owner),
          targetDate: text(answer.targetDate),
        });
      }
      if (answer.state === 'not_applicable' && result.complete) summary.notApplicable += 1;
    });

    return summary;
  }

  function LocalStorageAdapter(storage, key) {
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
      throw new Error('Storage adapter requires a Storage-compatible object.');
    }
    this.storage = storage;
    this.key = key || STORAGE_KEY;
  }

  LocalStorageAdapter.prototype.load = function () {
    var raw = this.storage.getItem(this.key);
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    if (!parsed || parsed.schemaVersion !== SCHEMA_VERSION) {
      var error = new Error('Unsupported questionnaire schema.');
      error.code = 'UNSUPPORTED_SCHEMA';
      throw error;
    }
    return parsed;
  };

  LocalStorageAdapter.prototype.save = function (response) {
    this.storage.setItem(this.key, JSON.stringify(response));
    return response;
  };

  LocalStorageAdapter.prototype.clear = function () {
    this.storage.removeItem(this.key);
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function presentAnswer(answer) {
    var value = answer || {};
    var presentation = { status: 'Brak odpowiedzi', primary: '', metadata: [] };
    if (value.state === 'answered') {
      presentation.status = 'Mamy odpowiedź';
      presentation.primary = text(value.detail);
      if (text(value.source)) presentation.metadata.push({ label: 'Źródło', value: text(value.source) });
    } else if (value.state === 'needs_clarification') {
      presentation.status = 'Do ustalenia';
      presentation.primary = text(value.missingInfo);
      if (text(value.owner)) presentation.metadata.push({ label: 'Właściciel', value: text(value.owner) });
      if (text(value.targetDate)) presentation.metadata.push({ label: 'Termin', value: text(value.targetDate) });
    } else if (value.state === 'not_applicable') {
      presentation.status = 'Nie dotyczy';
      presentation.primary = text(value.notApplicableReason);
      if (text(value.confirmedBy)) presentation.metadata.push({ label: 'Potwierdzenie', value: text(value.confirmedBy) });
    }
    return presentation;
  }

  function buildExportPayload(response) {
    var value = response || createEmptyResponse();
    return {
      project: 'Globalworth Property Management — odpowiedzi IT',
      schemaVersion: value.schemaVersion,
      responseId: value.responseId,
      status: value.status,
      respondent: Object.assign({}, value.respondent),
      dataNoticeAccepted: value.dataNoticeAccepted === true,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      submittedAt: value.submittedAt,
      summary: summarizeResponse(value),
      groups: QUESTION_GROUPS.map(function (group) {
        return {
          id: group.id,
          title: group.title,
          answers: group.questions.map(function (question) {
            var answer = value.answers && value.answers[question.id] ? value.answers[question.id] : emptyAnswer();
            var presentation = presentAnswer(answer);
            return {
              id: question.id,
              number: question.number,
              question: question.text,
              state: answer.state || '',
              status: presentation.status,
              detail: answer.detail || '',
              source: answer.source || '',
              missingInfo: answer.missingInfo || '',
              owner: answer.owner || '',
              targetDate: answer.targetDate || '',
              notApplicableReason: answer.notApplicableReason || '',
              confirmedBy: answer.confirmedBy || '',
              updatedAt: answer.updatedAt || '',
            };
          }),
        };
      }),
    };
  }

  function formatDateTime(value) {
    if (!value) return '—';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    try {
      return new Intl.DateTimeFormat('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      return date.toISOString();
    }
  }

  function formatTime(value) {
    if (!value) return '';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
  }

  function hasStateData(answer) {
    if (!answer) return false;
    return ['detail', 'source', 'missingInfo', 'owner', 'targetDate', 'notApplicableReason', 'confirmedBy']
      .some(function (field) { return Boolean(text(answer[field])); });
  }

  function markEdited(response, now) {
    response.updatedAt = now || new Date().toISOString();
    if (response.status === 'submitted') {
      response.status = 'draft';
      response.submittedAt = null;
      response.serverSubmissionId = '';
    }
    return response;
  }

  function exportResponse(response, browserWindow) {
    var target = browserWindow || (typeof window !== 'undefined' ? window : null);
    if (!target || !target.document || !target.URL || typeof target.Blob !== 'function') return false;
    var payload = buildExportPayload(response);
    var blob = new target.Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = target.URL.createObjectURL(blob);
    var link = target.document.createElement('a');
    var date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = 'globalworth-it-answers-' + date + '.json';
    link.hidden = true;
    target.document.body.appendChild(link);
    link.click();
    link.remove();
    target.setTimeout(function () { target.URL.revokeObjectURL(url); }, 0);
    return true;
  }

  async function submitFinal(response, fetchImplementation) {
    var request = fetchImplementation || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
    if (!request) throw new Error('Ta przeglądarka nie obsługuje zapisu formularza.');
    var result = await request('/api/globalworth-it-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    });
    var body = await result.json().catch(function () { return {}; });
    if (!result.ok || body.ok !== true || !body.submissionId) {
      throw new Error(body.error || 'Nie udało się zapisać odpowiedzi. Spróbuj ponownie.');
    }
    return body;
  }

  function mount(rootElement, options) {
    if (!rootElement) return null;
    var config = options || {};
    var browserWindow = config.window || (typeof window !== 'undefined' ? window : null);
    var browserDocument = config.document || (browserWindow && browserWindow.document);
    var browserLocation = config.location || (browserWindow && browserWindow.location) || { search: '' };
    var fetchImplementation = config.fetch || (browserWindow && browserWindow.fetch && browserWindow.fetch.bind(browserWindow));
    var repository = config.repository || null;
    var storageError = config.storageError || null;
    var response = null;
    var saveTimer = null;
    var shownErrors = {};
    var introValues = { name: '', email: '', role: '', dataNoticeAccepted: false, website: '' };
    var introErrors = [];
    var submissionError = '';
    var viewMode = false;

    try {
      viewMode = new URLSearchParams(browserLocation.search || '').get('view') === 'answers';
    } catch (error) {
      viewMode = false;
    }

    if (!repository) {
      try {
        repository = new LocalStorageAdapter(config.storage);
      } catch (error) {
        storageError = storageError || error;
      }
    }

    if (repository) {
      try {
        response = repository.load();
      } catch (error) {
        storageError = error;
      }
    }

    if (response && response.respondent) {
      introValues = {
        name: text(response.respondent.name),
        email: text(response.respondent.email),
        role: text(response.respondent.role),
        dataNoticeAccepted: response.dataNoticeAccepted === true,
        website: text(response.website),
      };
    }

    var section = rootElement.closest ? rootElement.closest('#it') : null;
    if (section) section.classList.add('itq-ready');
    if (viewMode && browserDocument && browserDocument.body) browserDocument.body.classList.add('itq-panel-mode');

    function now() {
      return new Date().toISOString();
    }

    function setSaveState(state, message) {
      var saveRows = rootElement.querySelectorAll('[data-save-state]');
      saveRows.forEach(function (row) {
        row.classList.toggle('is-saving', state === 'saving');
        row.classList.toggle('is-error', state === 'error');
        row.textContent = message;
      });
    }

    function persist() {
      if (saveTimer) {
        browserWindow.clearTimeout(saveTimer);
        saveTimer = null;
      }
      if (!response) return false;
      setSaveState('saving', 'Zapisywanie…');
      if (!repository) {
        storageError = storageError || new Error('Brak dostępnej pamięci przeglądarki.');
        setSaveState('error', 'Nie udało się zapisać. Pobierz kopię awaryjną.');
        return false;
      }
      try {
        repository.save(response);
        storageError = null;
        setSaveState('saved', 'Szkic zapisany ' + formatTime(response.updatedAt));
        return true;
      } catch (error) {
        storageError = error;
        setSaveState('error', 'Nie udało się zapisać. Pobierz kopię awaryjną.');
        return false;
      }
    }

    function scheduleSave() {
      setSaveState('saving', 'Zapisywanie…');
      if (saveTimer) browserWindow.clearTimeout(saveTimer);
      saveTimer = browserWindow.setTimeout(persist, 450);
    }

    function groupComplete(group) {
      return group.questions.every(function (question) {
        return validateAnswer(response.answers[question.id]).complete;
      });
    }

    function fieldError(questionId, field, message) {
      var errors = shownErrors[questionId] || [];
      if (errors.indexOf(field) === -1) return '';
      return '<span class="itq-field-error" id="' + questionId + '-' + field + '-error">' + escapeHtml(message) + '</span>';
    }

    function invalidAttribute(questionId, field) {
      var errors = shownErrors[questionId] || [];
      return errors.indexOf(field) !== -1 ? ' aria-invalid="true" aria-describedby="' + questionId + '-' + field + '-error"' : '';
    }

    function renderTextField(questionId, field, label, help, value, required, type) {
      var id = questionId + '-' + field;
      var requiredMark = required ? ' <span class="itq-required" aria-hidden="true">*</span>' : ' <span class="itq-help">opcjonalnie</span>';
      var errorMessages = {
        detail: 'Dodaj szczegółową odpowiedź.',
        missingInfo: 'Opisz, czego jeszcze nie wiadomo.',
        owner: 'Wskaż osobę, rolę albo zespół odpowiedzialny.',
        notApplicableReason: 'Wyjaśnij, dlaczego pytanie nie dotyczy.',
      };
      var input;
      if (type === 'textarea') {
        input = '<textarea id="' + id + '" data-question-id="' + questionId + '" data-answer-field="' + field + '"' + invalidAttribute(questionId, field) + '>' + escapeHtml(value) + '</textarea>';
      } else {
        input = '<input id="' + id + '" type="' + (type || 'text') + '" value="' + escapeHtml(value) + '" data-question-id="' + questionId + '" data-answer-field="' + field + '"' + invalidAttribute(questionId, field) + '>';
      }
      return '<div class="itq-field"><label for="' + id + '">' + escapeHtml(label) + requiredMark + '</label>' +
        (help ? '<span class="itq-help">' + escapeHtml(help) + '</span>' : '') + input +
        fieldError(questionId, field, errorMessages[field] || 'Uzupełnij to pole.') + '</div>';
    }

    function renderConditionalFields(question, answer) {
      if (answer.state === 'answered') {
        return '<div class="itq-conditional">' +
          renderTextField(question.id, 'detail', 'Szczegółowa odpowiedź', 'Opisz stan obecny, obowiązujące warunki, ograniczenia i znane wyjątki.', answer.detail, true, 'textarea') +
          renderTextField(question.id, 'source', 'Podstawa lub źródło', 'Nazwa polityki, procedury, systemu albo właściciel informacji.', answer.source, false, 'text') +
          '</div>';
      }
      if (answer.state === 'needs_clarification') {
        return '<div class="itq-conditional">' +
          renderTextField(question.id, 'missingInfo', 'Czego jeszcze nie wiemy?', 'Nazwij konkretną brakującą decyzję albo informację.', answer.missingInfo, true, 'textarea') +
          renderTextField(question.id, 'owner', 'Kto może to potwierdzić?', 'Wskaż osobę, rolę albo zespół.', answer.owner, true, 'text') +
          renderTextField(question.id, 'targetDate', 'Planowany termin', '', answer.targetDate, false, 'date') +
          '</div>';
      }
      if (answer.state === 'not_applicable') {
        return '<div class="itq-conditional">' +
          renderTextField(question.id, 'notApplicableReason', 'Dlaczego nie dotyczy?', 'Wyjaśnij, czego w organizacji, systemie albo procesie nie ma.', answer.notApplicableReason, true, 'textarea') +
          renderTextField(question.id, 'confirmedBy', 'Kto lub co to potwierdza?', 'Rola, system albo obowiązująca procedura.', answer.confirmedBy, false, 'text') +
          '</div>';
      }
      return '';
    }

    function renderQuestion(question) {
      var answer = response.answers[question.id] || emptyAnswer();
      var validation = validateAnswer(answer);
      var classNames = ['itq-question'];
      if (validation.complete) classNames.push('is-complete');
      if (shownErrors[question.id]) classNames.push('is-error');
      var states = [
        { value: 'answered', label: 'Mamy odpowiedź' },
        { value: 'needs_clarification', label: 'Do ustalenia' },
        { value: 'not_applicable', label: 'Nie dotyczy' },
      ];
      var stateOptions = states.map(function (state) {
        var id = question.id + '-state-' + state.value;
        return '<span class="itq-state-option"><input id="' + id + '" type="radio" name="' + question.id + '-state" value="' + state.value + '" data-question-id="' + question.id + '" data-answer-state' + (answer.state === state.value ? ' checked' : '') + '><label for="' + id + '">' + state.label + '</label></span>';
      }).join('');
      var stateError = fieldError(question.id, 'state', 'Wybierz sposób odpowiedzi.');
      var quality = validation.qualityWarning && validation.complete
        ? '<p class="itq-quality">Odpowiedź jest krótka. Sprawdź, czy opisuje warunki, ograniczenia albo przyczynę.</p>'
        : '';
      return '<article class="' + classNames.join(' ') + '" data-question="' + question.id + '">' +
        '<div class="itq-question-heading"><span class="itq-question-number">' + String(question.number).padStart(2, '0') + '</span><h4>' + escapeHtml(question.text) + '</h4></div>' +
        '<fieldset class="itq-state-fieldset"><legend>Wybierz sposób odpowiedzi</legend><div class="itq-state-options">' + stateOptions + '</div>' + stateError + '</fieldset>' +
        renderConditionalFields(question, answer) + quality + '</article>';
    }

    function navigationHtml() {
      var summary = summarizeResponse(response);
      var buttons = QUESTION_GROUPS.map(function (group, index) {
        return '<button class="itq-nav-button' + (groupComplete(group) ? ' is-complete' : '') + '" type="button" data-step="' + index + '"' + (response.currentStep === index ? ' aria-current="step"' : '') + '><span class="itq-nav-number">' + String(index + 1).padStart(2, '0') + '</span><span>' + escapeHtml(group.shortTitle) + '</span></button>';
      }).join('');
      buttons += '<button class="itq-nav-button" type="button" data-step="5"' + (response.currentStep === 5 ? ' aria-current="step"' : '') + '><span class="itq-nav-number">✓</span><span>Podsumowanie</span></button>';
      return '<aside class="itq-sidebar"><div class="itq-sidebar-brand">Globalworth / IT</div><nav class="itq-nav" aria-label="Etapy kwestionariusza">' + buttons + '</nav>' +
        '<div class="itq-sidebar-summary"><strong data-progress-total>' + summary.complete + ' / ' + summary.total + '</strong>pytań ma kompletną odpowiedź</div></aside>';
    }

    function renderIntro() {
      var errors = introErrors;
      var hasNameError = errors.indexOf('name') !== -1;
      var hasEmailError = errors.indexOf('email') !== -1;
      var hasNoticeError = errors.indexOf('dataNoticeAccepted') !== -1;
      rootElement.innerHTML = '<div class="itq-card itq-intro">' +
        '<div class="itq-intro-copy"><span class="itq-kicker">Kwestionariusz roboczy</span><h3>Pięć kroków do bezpiecznego programu.</h3><p>Szkic zapisuje się automatycznie w tej przeglądarce. Finalny zestaw trafia do chronionej bazy AI-Team dopiero po użyciu przycisku końcowego.</p>' +
        '<div class="itq-intro-steps"><div class="itq-intro-step"><span>01</span><span>Dane respondenta i zasady przekazania danych</span></div><div class="itq-intro-step"><span>02</span><span>16 pytań w pięciu krótkich etapach</span></div><div class="itq-intro-step"><span>03</span><span>Kontrola kompletności i trwały zapis odpowiedzi</span></div></div></div>' +
        '<form class="itq-start" id="itq-start-form" novalidate><h3>Rozpocznij uzupełnianie</h3><p>Jedna wskazana osoba z IT prowadzi cały zestaw odpowiedzi.</p>' +
        '<div class="itq-form-grid"><div class="itq-field"><label for="itq-name">Imię i nazwisko <span class="itq-required" aria-hidden="true">*</span></label><input id="itq-name" name="name" autocomplete="name" value="' + escapeHtml(introValues.name) + '"' + (hasNameError ? ' aria-invalid="true" aria-describedby="itq-name-error"' : '') + '>' + (hasNameError ? '<span class="itq-field-error" id="itq-name-error">Podaj imię i nazwisko.</span>' : '') + '</div>' +
        '<div class="itq-field"><label for="itq-email">Służbowy e-mail <span class="itq-required" aria-hidden="true">*</span></label><input id="itq-email" name="email" type="email" autocomplete="email" value="' + escapeHtml(introValues.email) + '"' + (hasEmailError ? ' aria-invalid="true" aria-describedby="itq-email-error"' : '') + '>' + (hasEmailError ? '<span class="itq-field-error" id="itq-email-error">Podaj poprawny służbowy adres e-mail.</span>' : '') + '</div>' +
        '<div class="itq-field"><label for="itq-role">Rola lub dział <span class="itq-help">opcjonalnie</span></label><input id="itq-role" name="role" autocomplete="organization-title" value="' + escapeHtml(introValues.role) + '"></div></div>' +
        '<div class="itq-honeypot" aria-hidden="true"><label for="itq-website">Strona internetowa</label><input id="itq-website" name="website" autocomplete="off" tabindex="-1" value="' + escapeHtml(introValues.website) + '"></div>' +
        '<div class="itq-privacy"><strong>Zakres danych.</strong> Nie wpisuj haseł, kluczy, danych najemców ani informacji, których Globalworth nie może przekazać poza własne środowisko. Finalne odpowiedzi będą zapisane w europejskiej infrastrukturze AI-Team wyłącznie na potrzeby przygotowania programu.</div>' +
        '<label class="itq-notice-check"><input type="checkbox" name="dataNoticeAccepted" value="yes"' + (introValues.dataNoticeAccepted ? ' checked' : '') + (hasNoticeError ? ' aria-invalid="true" aria-describedby="itq-notice-error"' : '') + '><span>Potwierdzam, że odpowiedzi nie zawierają haseł, kluczy ani danych najemców.</span></label>' +
        (hasNoticeError ? '<span class="itq-field-error" id="itq-notice-error">Potwierdź komunikat o danych.</span>' : '') +
        (storageError ? '<div class="itq-alert error">Pamięć przeglądarki jest niedostępna. Możesz obejrzeć formularz, ale dane nie przetrwają odświeżenia.</div>' : '') +
        '<div class="itq-actions"><button class="itq-button" type="submit">Rozpocznij formularz <span aria-hidden="true">→</span></button></div></form></div><div class="itq-live" aria-live="assertive"></div>';
      bindIntro();
    }

    function renderQuestionnaire() {
      var step = Math.max(0, Math.min(4, Number(response.currentStep) || 0));
      response.currentStep = step;
      var group = QUESTION_GROUPS[step];
      var summary = summarizeResponse(response);
      var percentage = Math.round((summary.complete / summary.total) * 100);
      rootElement.innerHTML = '<div class="itq-shell">' + navigationHtml() + '<main class="itq-main">' +
        '<div class="itq-mobile-progress"><span class="itq-step-label">Krok ' + (step + 1) + ' z 5</span><div class="itq-progress-track"><span style="width:' + percentage + '%"></span></div></div>' +
        '<div class="itq-topline"><div><span class="itq-step-label">Etap ' + String(step + 1).padStart(2, '0') + ' / 05</span><h3>' + escapeHtml(group.title) + '</h3></div><span class="itq-progress-count" data-progress-count>' + summary.complete + ' / ' + summary.total + ' gotowe</span></div>' +
        '<div class="itq-progress-track"><span style="width:' + percentage + '%"></span></div>' +
        (storageError ? '<div class="itq-alert error">Nie udało się zapisać szkicu w przeglądarce. Treść pozostaje w tej sesji; pobierz kopię awaryjną przed zamknięciem strony.</div>' : '') +
        '<div class="itq-questions">' + group.questions.map(renderQuestion).join('') + '</div>' +
        '<div class="itq-save-row' + (storageError ? ' is-error' : '') + '" data-save-state>' + (storageError ? 'Nie udało się zapisać. Pobierz kopię awaryjną.' : 'Szkic zapisany ' + formatTime(response.updatedAt)) + '</div>' +
        '<div class="itq-actions is-split"><div>' + (step > 0 ? '<button class="itq-button secondary" type="button" data-action="previous">← Wstecz</button>' : '') + '</div><div class="itq-actions" style="margin-top:0"><button class="itq-button secondary" type="button" data-action="export">Eksport kopii</button><button class="itq-button" type="button" data-action="next">' + (step === 4 ? 'Sprawdź odpowiedzi →' : 'Dalej →') + '</button></div></div>' +
        '<div class="itq-live" aria-live="assertive"></div></main></div>';
      bindQuestionnaire();
    }

    function renderSummary() {
      response.currentStep = 5;
      var validation = validateResponse(response);
      var summary = summarizeResponse(response);
      var missingQuestions = allQuestions().filter(function (question) {
        return !validateAnswer(response.answers[question.id]).complete;
      });
      var groupItems = QUESTION_GROUPS.map(function (group, index) {
        var count = group.questions.filter(function (question) { return validateAnswer(response.answers[question.id]).complete; }).length;
        return '<div class="itq-review-item"><span class="itq-question-number">' + String(index + 1).padStart(2, '0') + '</span><div><strong>' + escapeHtml(group.title) + '</strong><small>' + count + ' z ' + group.questions.length + ' kompletnych</small></div><span class="itq-status-pill' + (count === group.questions.length ? ' submitted' : '') + '">' + (count === group.questions.length ? 'Gotowe' : 'Wymaga uwagi') + '</span></div>';
      }).join('');
      var alert = '';
      if (!validation.complete) {
        alert = '<div class="itq-alert"><strong>Nie można jeszcze zakończyć formularza.</strong> Uzupełnij ' + missingQuestions.length + ' ' + (missingQuestions.length === 1 ? 'pytanie' : 'pytań') + ' albo dodaj wymagane uzasadnienia.</div>';
      } else if (response.status === 'submitted') {
        alert = '<div class="itq-privacy"><strong>Odpowiedzi zapisane w bazie.</strong> Finalizacja: ' + escapeHtml(formatDateTime(response.submittedAt)) + '. Numer zapisu: <strong>' + escapeHtml(response.serverSubmissionId || response.responseId) + '</strong>.</div>';
      }
      if (submissionError) alert += '<div class="itq-alert error"><strong>Zapis nie powiódł się.</strong> ' + escapeHtml(submissionError) + ' Szkic nadal jest w tej przeglądarce.</div>';
      if (storageError) alert += '<div class="itq-alert error">Zapis lokalny nie działa. Eksport zabezpiecza treść, ale nie kończy poprawnie formularza.</div>';
      rootElement.innerHTML = '<div class="itq-shell">' + navigationHtml() + '<main class="itq-main itq-summary">' +
        '<div class="itq-summary-head"><div class="itq-summary-copy"><span class="itq-step-label">Kontrola jakości</span><h3>Podsumowanie odpowiedzi</h3><p>Sprawdź kompletność przed zapisaniem finalnego zestawu.</p></div><span class="itq-status-pill ' + (response.status === 'submitted' ? 'submitted' : '') + '">' + (response.status === 'submitted' ? 'Zakończone' : 'Szkic') + '</span></div>' +
        '<div class="itq-stats"><div class="itq-stat"><strong>' + summary.answered + '</strong><span class="itq-stat-label">Szczegółowe</span></div><div class="itq-stat"><strong>' + summary.needsClarification + '</strong><span class="itq-stat-label">Do ustalenia</span></div><div class="itq-stat"><strong>' + summary.notApplicable + '</strong><span class="itq-stat-label">Nie dotyczy</span></div><div class="itq-stat"><strong>' + summary.incomplete + '</strong><span class="itq-stat-label">Braki</span></div></div>' +
        '<div class="itq-review-list">' + groupItems + '</div>' + alert +
        '<div class="itq-actions is-split"><button class="itq-button secondary" type="button" data-action="previous">← Wróć do pytań</button><div class="itq-actions" style="margin-top:0"><button class="itq-button secondary" type="button" data-action="export">Eksport JSON</button><button class="itq-button" type="button" data-action="submit"' + (!validation.complete || response.status === 'submitted' ? ' disabled' : '') + '>' + (response.status === 'submitted' ? 'Zapisano w bazie' : 'Zakończ i zapisz odpowiedzi') + '</button></div></div>' +
        '<div class="itq-live" aria-live="assertive"></div></main></div>';
      bindSummary();
    }

    function answerHtml(question) {
      var answer = response.answers[question.id] || emptyAnswer();
      var presentation = presentAnswer(answer);
      var validation = validateAnswer(answer);
      var metadata = presentation.metadata.map(function (item) {
        return '<span>' + escapeHtml(item.label) + ': ' + escapeHtml(item.value) + '</span>';
      }).join('');
      return '<article class="itq-answer"><h5>' + String(question.number).padStart(2, '0') + '. ' + escapeHtml(question.text) + '</h5><p>' + escapeHtml(presentation.primary || 'Brak odpowiedzi.') + '</p><div class="itq-answer-meta"><span>' + escapeHtml(presentation.status) + '</span>' + metadata + (validation.qualityWarning ? '<span>Sprawdź szczegółowość</span>' : '') + '</div></article>';
    }

    function renderDashboard() {
      if (!response) {
        rootElement.innerHTML = '<div class="itq-card itq-empty"><span class="itq-kicker">Lokalna kopia</span><h3>Nie ma jeszcze zapisanego szkicu.</h3><p>Rozpocznij formularz, aby zobaczyć tutaj lokalny postęp. Finalne odpowiedzi są dostępne zespołowi AI-Team w chronionym panelu.</p><div class="itq-actions" style="justify-content:center"><a class="itq-button" href="' + escapeHtml((browserLocation.pathname || 'index.html') + '#it') + '">Wróć do formularza</a></div></div>';
        return;
      }
      var summary = summarizeResponse(response);
      var groups = QUESTION_GROUPS.map(function (group, index) {
        var complete = group.questions.filter(function (question) { return validateAnswer(response.answers[question.id]).complete; }).length;
        return '<details class="itq-answer-group"' + (index === 0 ? ' open' : '') + '><summary><span class="itq-question-number">' + String(index + 1).padStart(2, '0') + '</span><strong>' + escapeHtml(group.title) + '</strong><span class="itq-status-pill' + (complete === group.questions.length ? ' submitted' : '') + '">' + complete + ' / ' + group.questions.length + '</span></summary><div class="itq-answer-list">' + group.questions.map(answerHtml).join('') + '</div></details>';
      }).join('');
      var openItems = summary.openItems.length
        ? '<h4 class="itq-open-title">Otwarte ustalenia</h4><div class="itq-open-items">' + summary.openItems.map(function (item) {
          return '<article class="itq-open-item"><h5>' + String(item.number).padStart(2, '0') + '. ' + escapeHtml(item.question) + '</h5><p>' + escapeHtml(item.missingInfo) + '</p><div class="itq-answer-meta"><span>Właściciel: ' + escapeHtml(item.owner) + '</span>' + (item.targetDate ? '<span>Termin: ' + escapeHtml(item.targetDate) + '</span>' : '') + '</div></article>';
        }).join('') + '</div>'
        : '';
      rootElement.innerHTML = '<section class="itq-dashboard"><div class="itq-dashboard-head"><div class="itq-dashboard-copy"><span class="itq-kicker">Globalworth / Property Management</span><h3>Lokalna kopia odpowiedzi</h3><p>Ten widok czyta szkic zapisany w tej samej przeglądarce. Finalne odpowiedzi są dostępne w chronionym panelu AI-Team.</p></div><span class="itq-status-pill ' + (response.status === 'submitted' ? 'submitted' : '') + '">' + (response.status === 'submitted' ? 'Zakończone' : 'Szkic') + '</span></div>' +
        '<div class="itq-dashboard-meta"><span><strong>Respondent:</strong> ' + escapeHtml(response.respondent.name || '—') + '</span><span><strong>E-mail:</strong> ' + escapeHtml(response.respondent.email || '—') + '</span><span><strong>Ostatni zapis:</strong> ' + escapeHtml(formatDateTime(response.updatedAt)) + '</span><span><strong>Finalizacja:</strong> ' + escapeHtml(formatDateTime(response.submittedAt)) + '</span></div>' +
        '<div class="itq-stats"><div class="itq-stat"><strong>' + summary.complete + ' / ' + summary.total + '</strong><span class="itq-stat-label">Kompletne</span></div><div class="itq-stat"><strong>' + summary.answered + '</strong><span class="itq-stat-label">Szczegółowe</span></div><div class="itq-stat"><strong>' + summary.needsClarification + '</strong><span class="itq-stat-label">Do ustalenia</span></div><div class="itq-stat"><strong>' + summary.incomplete + '</strong><span class="itq-stat-label">Braki</span></div></div>' +
        (storageError ? '<div class="itq-alert error">Nie udało się odczytać aktualnego zapisu. Poniższe dane mogą pochodzić wyłącznie z bieżącej sesji.</div>' : '') +
        openItems + '<div class="itq-dashboard-groups">' + groups + '</div><div class="itq-actions"><a class="itq-button secondary" href="' + escapeHtml((browserLocation.pathname || 'index.html') + '#it') + '">Wróć do formularza</a><button class="itq-button secondary" type="button" data-action="print">Drukuj / zapisz PDF</button><button class="itq-button" type="button" data-action="export">Eksport JSON</button></div><div class="itq-live" aria-live="assertive"></div></section>';
      bindDashboard();
    }

    function render() {
      if (viewMode) renderDashboard();
      else if (!response || !text(response.respondent && response.respondent.name) || !validEmail(response.respondent && response.respondent.email) || response.dataNoticeAccepted !== true) renderIntro();
      else if (Number(response.currentStep) === 5) renderSummary();
      else renderQuestionnaire();
    }

    function bindIntro() {
      var form = rootElement.querySelector('#itq-start-form');
      if (!form) return;
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var formData = new browserWindow.FormData(form);
        introValues = {
          name: text(formData.get('name')),
          email: text(formData.get('email')),
          role: text(formData.get('role')),
          dataNoticeAccepted: formData.get('dataNoticeAccepted') === 'yes',
          website: text(formData.get('website')),
        };
        introErrors = [];
        if (!introValues.name) introErrors.push('name');
        if (!validEmail(introValues.email)) introErrors.push('email');
        if (!introValues.dataNoticeAccepted) introErrors.push('dataNoticeAccepted');
        if (introErrors.length) {
          renderIntro();
          var firstError = rootElement.querySelector('[aria-invalid="true"]');
          if (firstError) firstError.focus();
          return;
        }
        response = response || createEmptyResponse(now());
        response.respondent = Object.assign({}, introValues);
        delete response.respondent.dataNoticeAccepted;
        delete response.respondent.website;
        response.dataNoticeAccepted = introValues.dataNoticeAccepted;
        response.website = introValues.website;
        response.currentStep = 0;
        markEdited(response, now());
        persist();
        renderQuestionnaire();
      });
    }

    function bindQuestionnaire() {
      rootElement.querySelectorAll('[data-step]').forEach(function (button) {
        button.addEventListener('click', function () {
          response.currentStep = Number(button.getAttribute('data-step'));
          persist();
          render();
        });
      });

      rootElement.querySelectorAll('[data-answer-state]').forEach(function (input) {
        input.addEventListener('change', function () {
          var questionId = input.getAttribute('data-question-id');
          var nextState = input.value;
          var previous = response.answers[questionId] || emptyAnswer();
          if (previous.state && previous.state !== nextState && hasStateData(previous)) {
            var confirmed = browserWindow.confirm('Zmiana sposobu odpowiedzi wyczyści pola poprzedniego wariantu. Kontynuować?');
            if (!confirmed) {
              renderQuestionnaire();
              return;
            }
            response.answers[questionId] = emptyAnswer();
          }
          response.answers[questionId].state = nextState;
          response.answers[questionId].updatedAt = now();
          markEdited(response, response.answers[questionId].updatedAt);
          delete shownErrors[questionId];
          scheduleSave();
          renderQuestionnaire();
          var firstField = rootElement.querySelector('[data-question-id="' + questionId + '"][data-answer-field]');
          if (firstField) firstField.focus();
        });
      });

      rootElement.querySelectorAll('[data-answer-field]').forEach(function (input) {
        input.addEventListener('input', function () {
          var questionId = input.getAttribute('data-question-id');
          var field = input.getAttribute('data-answer-field');
          response.answers[questionId][field] = input.value;
          response.answers[questionId].updatedAt = now();
          markEdited(response, response.answers[questionId].updatedAt);
          scheduleSave();
        });
      });

      var previous = rootElement.querySelector('[data-action="previous"]');
      if (previous) previous.addEventListener('click', function () {
        response.currentStep = Math.max(0, Number(response.currentStep) - 1);
        persist();
        renderQuestionnaire();
      });

      var next = rootElement.querySelector('[data-action="next"]');
      if (next) next.addEventListener('click', function () {
        var group = QUESTION_GROUPS[response.currentStep];
        var invalid = [];
        group.questions.forEach(function (question) {
          var result = validateAnswer(response.answers[question.id]);
          if (!result.complete) {
            shownErrors[question.id] = result.errors;
            invalid.push(question.id);
          } else delete shownErrors[question.id];
        });
        persist();
        if (invalid.length) {
          renderQuestionnaire();
          var first = rootElement.querySelector('[data-question="' + invalid[0] + '"] input, [data-question="' + invalid[0] + '"] textarea');
          if (first) first.focus();
          var live = rootElement.querySelector('.itq-live');
          if (live) live.textContent = 'Uzupełnij pytania oznaczone jako wymagające uwagi.';
          return;
        }
        response.currentStep = response.currentStep === 4 ? 5 : response.currentStep + 1;
        persist();
        render();
      });

      bindExportButtons();
    }

    function bindSummary() {
      rootElement.querySelectorAll('[data-step]').forEach(function (button) {
        button.addEventListener('click', function () {
          response.currentStep = Number(button.getAttribute('data-step'));
          persist();
          render();
        });
      });
      var previous = rootElement.querySelector('[data-action="previous"]');
      if (previous) previous.addEventListener('click', function () {
        response.currentStep = 4;
        persist();
        renderQuestionnaire();
      });
      var submit = rootElement.querySelector('[data-action="submit"]');
      if (submit) submit.addEventListener('click', async function () {
        if (!validateResponse(response).complete || response.status === 'submitted') return;
        submissionError = '';
        submit.disabled = true;
        submit.textContent = 'Zapisywanie w bazie…';
        try {
          var result = await submitFinal(response, fetchImplementation);
          response.status = 'submitted';
          response.submittedAt = result.submittedAt;
          response.serverSubmissionId = result.submissionId;
          response.updatedAt = result.submittedAt;
          persist();
        } catch (error) {
          submissionError = error && error.message ? error.message : 'Nie udało się zapisać odpowiedzi. Spróbuj ponownie.';
        }
        renderSummary();
      });
      bindExportButtons();
    }

    function bindDashboard() {
      bindExportButtons();
      var print = rootElement.querySelector('[data-action="print"]');
      if (print) print.addEventListener('click', function () { browserWindow.print(); });
      if (!rootElement.hasAttribute('data-print-events')) {
        rootElement.setAttribute('data-print-events', 'true');
        browserWindow.addEventListener('beforeprint', function () {
          rootElement.querySelectorAll('.itq-answer-group').forEach(function (group) {
            group.setAttribute('data-was-open', group.open ? 'true' : 'false');
            group.open = true;
          });
        });
        browserWindow.addEventListener('afterprint', function () {
          rootElement.querySelectorAll('.itq-answer-group[data-was-open]').forEach(function (group) {
            group.open = group.getAttribute('data-was-open') === 'true';
            group.removeAttribute('data-was-open');
          });
        });
      }
    }

    function bindExportButtons() {
      rootElement.querySelectorAll('[data-action="export"]').forEach(function (button) {
        button.addEventListener('click', function () {
          if (!response) return;
          exportResponse(response, browserWindow);
          var live = rootElement.querySelector('.itq-live');
          if (live) live.textContent = 'Pobrano kopię odpowiedzi w formacie JSON.';
        });
      });
    }

    render();
    return {
      getResponse: function () { return response; },
      render: render,
    };
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    QUESTION_GROUPS: QUESTION_GROUPS,
    allQuestions: allQuestions,
    emptyAnswer: emptyAnswer,
    createEmptyResponse: createEmptyResponse,
    validateAnswer: validateAnswer,
    validateResponse: validateResponse,
    summarizeResponse: summarizeResponse,
    LocalStorageAdapter: LocalStorageAdapter,
    escapeHtml: escapeHtml,
    presentAnswer: presentAnswer,
    buildExportPayload: buildExportPayload,
    exportResponse: exportResponse,
    submitFinal: submitFinal,
    markEdited: markEdited,
    mount: mount,
  };
});
