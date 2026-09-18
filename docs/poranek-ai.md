# Poranki z AI — wdrożenie 18.09.2026

- Publiczny adres: https://ai-team.pl/poranek-ai (Vercel cleanUrls).
- Mandat Darka: „Zrób już na stronie po /poranek-ai”, następnie test zapisu.
- Animowane logo: identyczny znak SVG i pierścień z index.html / mega-fx.css. Paleta i skala nagłówków po akceptowanych iteracjach makiety; mobile od 320 px.
- Formularz: POST /api/async-submit z form_type=poranek-ai; wydzielony helper _poranek-signup.js. Bez kolejnej funkcji Vercel, nowych sekretów lub zmian reguł bazy.
- Dane: istniejące Firestore ai-team-zlecenia, zlecenia/poranek_<sha256 email>. Panel /panel → Leady → Poranki z AI. Oddzielone od newsletter_subscribers; brak wysyłki i zgody newsletterowej.
- Zapis wymaga poprawnego e-maila oraz jawnej zgody dotyczącej informacji o pierwszym spotkaniu. Serwer zapisuje treść i datę zgody. Powtórka nie tworzy kolejnego rekordu. Brak nowych cookies/analityki.
- Rollback: cofnięcie commita dodającego stronę i integrację. Poprzedni main ef4d607; danych zgłoszeń nie usuwać.

## Materiały i przejrzystość

AI_ACT_CHECK: PASS
SYSTEM_I_WLASCICIEL: Poranki z AI / AI-Team, Darek
ROLA: podmiot stosujący, wykonawca techniczny
KATEGORIA: realistyczne media syntetyczne w treści marketingowej
OZNACZENIE_WIDOCZNE: „Poranny klimat · wizualizacja AI” na filmie; informacja o treści w stopce
OZNACZENIE_TECHNICZNE: zachowano oryginały dostawców i prompty w roboczym archiwum AITeam/Temp/poranki-z-ai/makieta/assets; kopie internetowe skompresowano ze względu na transfer
RECENZENT_CZLOWIEK: Darek — korekty układu, typografii i mobilności; akceptacja publikacji
FLAGA_PLATFORMY: NIE_DOTYCZY — własna strona
REJESTR: NIE_DOTYCZY — statyczny materiał, nie wdrożenie systemu generatywnego
UZASADNIENIE: Scena kawiarni jest widocznie oznaczona jako wizualizacja; nie przedstawia ustalonego lokalu lub rzeczywistego spotkania.

Obraz: gpt-image-2.5-flare, high, 1536×1024, 18.09.2026. Wideo: Higgsfield DoP Standard, request 4cc2342b-2604-4950-a00a-ef6a2b240e46. Film internetowy H.264, 1080 px, 4,57 s, bez audio; przejście pętli 0,8 s. Poster WebP. prefers-reduced-motion wyłącza autoplay i obrót logo.
