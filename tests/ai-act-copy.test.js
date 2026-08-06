const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const landing = fs.readFileSync(path.join(root, "ai-act/index.html"), "utf8");
const fragment = fs.readFileSync(path.join(root, "api/fragment.js"), "utf8");

test("landing AI Act mówi o obowiązujących zasadach zamiast minionym terminie", () => {
  assert.doesNotMatch(landing, /przed 2 sierpnia/i);
  assert.doesNotMatch(landing, /promo(?:cyjna)?\s+do 2 sierpnia/i);
  assert.doesNotMatch(landing, /jeszcze przed 2 sierpnia/i);
  assert.doesNotMatch(landing, /zostało\s+\d+\s+dni/i);
  assert.match(landing, /od 2 sierpnia 2026[\s\S]{0,100}obowiązują/i);
  assert.match(landing, /aktualne na sierpień 2026/i);
});

test("potwierdzenie audytu nie obiecuje wygasłej promocji", () => {
  assert.doesNotMatch(fragment, /promo(?:cyjna)?\s+do 2 sierpnia/i);
  assert.match(fragment, /Płatność \(290 zł\)/);
});
