# SES reconciler

Odbiornik synchronizuje asynchroniczne zdarzenia Amazon SES z Firestore. Do
Vercela przekazuje wyłącznie `BOUNCE` i `COMPLAINT`; pozostałe zdarzenia są
ignorowane przed odczytem sekretu i wywołaniem HTTP.

## Zasoby produkcyjne

- region: `eu-central-1`
- Lambda: `ai-team-ses-reconciler`
- kolejka źródłowa: `cloud-cso-ses-events`
- DLQ: `ai-team-ses-reconciler-dlq`
- parametr SSM: `/ai-team/newsletter/cron-secret`
- mapowanie źródła: `0e7e1e58-1707-4fec-a531-ef1c41ba0c7b`
- log group: `/aws/lambda/ai-team-ses-reconciler` (retencja 14 dni)
- alarm błędów aplikacyjnych: `ai-team-ses-reconciler-reconciliation-failures`
- alarm DLQ: `ai-team-ses-reconciler-dlq`
- temat operacyjny SNS: `ai-team-ops-alerts`

Sekret pozostaje wyłącznie w Vercel i jako szyfrowany `SecureString` w SSM. Nie
wolno umieszczać jego wartości w repozytorium, logach ani poleceniach.

## Zachowanie

- trwały bounce: wysyłka i subskrybent otrzymują status `bounced`;
- przejściowy bounce: status `bounced` otrzymuje tylko wysyłka;
- complaint: wysyłka i subskrybent otrzymują status `complained`;
- nieznane `ses_message_id`: brak zapisu;
- odpowiedź Lambda używa częściowych błędów SQS, więc nieudane rekordy są
  ponawiane i po pięciu odbiorach trafiają do DLQ.

SES ma również włączoną kontową listę blokad dla `BOUNCE` i `COMPLAINT`. Chroni
to przyszłe kampanie niezależnie od synchronizacji statusów w Firestore.

## Jednorazowe wznowienie po limicie Firestore

18 sierpnia 2026 bezpłatny dzienny limit Firestore został wyczerpany przez
wcześniejszy pełny skan kolekcji. Mapowanie zostało wyłączone bez utraty danych.
Jednorazowy harmonogram `ai-team-ses-reconciler-reenable-20260819` wznawia je
19 sierpnia 2026 o 09:15 `Europe/Warsaw`, po resecie limitu. Harmonogram usuwa
się automatycznie po wykonaniu. Jego rola może wyłącznie włączyć wskazane wyżej
mapowanie źródła.

Po potwierdzeniu opróżnienia kolejki można usunąć nieużywaną już rolę IAM
`ai-team-ses-reconciler-recovery-scheduler-role`.

## Testy

```sh
node --test tests/newsletter-ses-reconcile.test.js
python3 -m unittest tests/test_ses_reconciler_lambda.py
```
