const SCHEMA_VERSION = 1;
const PROJECT_ID = 'globalworth-property-ai';
const COLLECTION = 'globalworth_it_responses';

const QUESTION_GROUPS = [
  {
    id: 'tools',
    title: 'Dopuszczone narzędzia i polityka AI',
    questions: [
      { id: 'it-tools-01', number: 1, text: 'Jakie narzędzia AI są oficjalnie dopuszczone do użytku?' },
      { id: 'it-tools-02', number: 2, text: 'Czy istnieje wewnętrzna polityka korzystania z AI i jakie ma ograniczenia?' },
      { id: 'it-tools-03', number: 3, text: 'Czy dane firmowe lub dane najemców mogą trafiać do narzędzi AI w wersji enterprise?' },
    ],
  },
  {
    id: 'systems',
    title: 'Microsoft 365, systemy i integracje',
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
    questions: [
      { id: 'it-data-08', number: 8, text: 'Czy dane muszą pozostać w Unii Europejskiej lub konkretnej lokalizacji?' },
      { id: 'it-data-09', number: 9, text: 'Czy jest wymagany dostawca chmury lub firmowy tenant?' },
      { id: 'it-data-10', number: 10, text: 'Czy treści maili i umów mogą być przetwarzane w usłudze zewnętrznej, czy wyłącznie w środowisku Globalworth?' },
    ],
  },
  {
    id: 'security',
    title: 'Bezpieczeństwo, RODO i akceptacja',
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
    questions: [
      { id: 'it-owner-16', number: 16, text: 'Kto jest właścicielem decyzji o dopuszczeniu narzędzi AI i z kim uzgadniamy architekturę oraz bezpieczeństwo?' },
    ],
  },
];

const QUESTIONS = QUESTION_GROUPS.flatMap((group) =>
  group.questions.map((question) => ({ ...question, groupId: group.id, groupTitle: group.title }))
);
const QUESTION_IDS = QUESTIONS.map((question) => question.id);
const QUESTION_ID_SET = new Set(QUESTION_IDS);

function clean(value, limit) {
  return String(value || '')
    .trim()
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .slice(0, limit || 8000);
}

function cleanEmail(value) {
  return clean(value, 180).toLowerCase();
}

function normalizeAnswer(value) {
  const answer = value && typeof value === 'object' ? value : {};
  return {
    state: clean(answer.state, 40),
    detail: clean(answer.detail, 8000),
    source: clean(answer.source, 500),
    missingInfo: clean(answer.missingInfo, 4000),
    owner: clean(answer.owner, 300),
    targetDate: clean(answer.targetDate, 20),
    notApplicableReason: clean(answer.notApplicableReason, 4000),
    confirmedBy: clean(answer.confirmedBy, 300),
    updatedAt: clean(answer.updatedAt, 40),
  };
}

function normalizeSubmission(payload) {
  const value = payload && typeof payload === 'object' ? payload : {};
  const rawAnswers = value.answers && typeof value.answers === 'object' ? value.answers : {};
  const answers = Object.fromEntries(
    QUESTION_IDS.map((id) => [id, normalizeAnswer(rawAnswers[id])])
  );
  const unknownAnswerIds = Object.keys(rawAnswers).filter((id) => !QUESTION_ID_SET.has(id));

  return {
    schemaVersion: Number(value.schemaVersion || 0),
    projectId: clean(value.projectId, 80),
    responseId: clean(value.responseId, 90),
    status: clean(value.status, 30),
    respondent: {
      name: clean(value.respondent && value.respondent.name, 140),
      email: cleanEmail(value.respondent && value.respondent.email),
      role: clean(value.respondent && value.respondent.role, 140),
    },
    dataNoticeAccepted: value.dataNoticeAccepted === true,
    createdAt: clean(value.createdAt, 40),
    updatedAt: clean(value.updatedAt, 40),
    answers,
    unknownAnswerIds,
  };
}

function validateSubmission(value) {
  if (!value || typeof value !== 'object') throw publicError(400, 'Brak danych formularza.');
  if (value.schemaVersion !== SCHEMA_VERSION) throw publicError(400, 'Nieobsługiwana wersja formularza.');
  if (value.projectId !== PROJECT_ID) throw publicError(400, 'Nieprawidłowy identyfikator projektu.');
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(value.responseId)) throw publicError(400, 'Nieprawidłowy identyfikator odpowiedzi.');
  if (value.respondent.name.length < 2) throw publicError(400, 'Podaj imię i nazwisko respondenta.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.respondent.email)) throw publicError(400, 'Podaj poprawny służbowy adres e-mail.');
  if (!value.dataNoticeAccepted) throw publicError(400, 'Potwierdź komunikat o danych.');
  if (value.unknownAnswerIds.length) throw publicError(400, `Nieznane pytanie: ${value.unknownAnswerIds[0]}.`);
  if (!validDate(value.createdAt) || !validDate(value.updatedAt)) throw publicError(400, 'Nieprawidłowa data formularza.');

  for (const question of QUESTIONS) {
    const answer = value.answers[question.id];
    if (answer.state === 'answered') {
      if (answer.detail.length < 30) {
        throw publicError(400, `Pytanie ${question.number}: dodaj szczegółową odpowiedź.`);
      }
    } else if (answer.state === 'needs_clarification') {
      if (answer.missingInfo.length < 20) {
        throw publicError(400, `Pytanie ${question.number}: opisz brakującą informację.`);
      }
      if (answer.owner.length < 2) {
        throw publicError(400, `Pytanie ${question.number}: wskaż właściciela ustalenia.`);
      }
      if (answer.targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(answer.targetDate)) {
        throw publicError(400, `Pytanie ${question.number}: podaj poprawny termin.`);
      }
    } else if (answer.state === 'not_applicable') {
      if (answer.notApplicableReason.length < 20) {
        throw publicError(400, `Pytanie ${question.number}: wyjaśnij, dlaczego pytanie nie dotyczy.`);
      }
    } else {
      throw publicError(400, `Pytanie ${question.number}: wybierz sposób odpowiedzi.`);
    }
  }

  return value;
}

function summarizeSubmission(value) {
  const summary = {
    total: QUESTION_IDS.length,
    complete: 0,
    answered: 0,
    needsClarification: 0,
    notApplicable: 0,
    openItems: [],
  };
  for (const question of QUESTIONS) {
    const answer = value.answers[question.id];
    summary.complete += 1;
    if (answer.state === 'answered') summary.answered += 1;
    if (answer.state === 'not_applicable') summary.notApplicable += 1;
    if (answer.state === 'needs_clarification') {
      summary.needsClarification += 1;
      summary.openItems.push({
        questionId: question.id,
        number: question.number,
        question: question.text,
        missingInfo: answer.missingInfo,
        owner: answer.owner,
        targetDate: answer.targetDate,
      });
    }
  }
  return summary;
}

function documentPathFor(responseId) {
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(String(responseId || ''))) {
    throw publicError(400, 'Nieprawidłowy identyfikator odpowiedzi.');
  }
  return `${COLLECTION}/${responseId}`;
}

function buildFirestoreDocument(value, submittedAt) {
  const finalTimestamp = clean(submittedAt, 40);
  if (!validDate(finalTimestamp)) throw publicError(500, 'Nie udało się ustalić czasu zapisu.');
  return {
    schema_version: SCHEMA_VERSION,
    project_id: PROJECT_ID,
    response_id: value.responseId,
    source: 'globalworth-it-questionnaire',
    status: 'submitted',
    respondent: { ...value.respondent },
    data_notice_accepted: true,
    answers: value.answers,
    summary: summarizeSubmission(value),
    created_at: value.createdAt,
    updated_at: value.updatedAt,
    submitted_at: finalTimestamp,
  };
}

function validDate(value) {
  return Boolean(value) && Number.isFinite(Date.parse(value));
}

function publicError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.publicMessage = message;
  return error;
}

module.exports = {
  COLLECTION,
  PROJECT_ID,
  QUESTION_GROUPS,
  QUESTION_IDS,
  QUESTIONS,
  SCHEMA_VERSION,
  buildFirestoreDocument,
  documentPathFor,
  normalizeSubmission,
  publicError,
  summarizeSubmission,
  validateSubmission,
};
