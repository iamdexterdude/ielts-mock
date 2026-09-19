# IELTS Academic mock test

A timed, computer-style IELTS Academic mock (Listening, Reading, Writing) built from
Cambridge IELTS 20, Academic Test 2. Send the link to a student; when they finish,
their scores and essays arrive in your Telegram.

**Live:** https://ielts-mock-smoky.vercel.app

> The test content is Cambridge University Press material. Share the link only with
> your own students; the page is marked `noindex` so search engines skip it.

## What the student sees

1. **Welcome.** Name in answer-sheet boxes, a headphone sound check, the rules. The
   recording downloads in the background; **Start** unlocks once it has loaded.
2. **Listening** (about 32½ minutes). The four recordings play once, back to back. Pausing,
   rewinding and media keys are blocked. The screen moves to each new part as its recording
   starts. When the audio ends there are **2 minutes to check**, as in the computer test, then
   the section locks.
3. **One-minute pause**, then **Reading** (60 min): passage and questions side by side,
   drag-and-drop matching, highlighting (select text or right-click).
4. **One-minute pause**, then **Writing** (60 min): Task 1 with the two farm plans
   redrawn as sharp vector maps side by side (plus a "View larger" option), and Task 2. Live word count.
5. **Finish screen** confirming delivery to the teacher.

When a timer reaches zero the section locks immediately and the student can't go back.
Reloading the page resumes the same attempt with the clock still running (the recording
rejoins where it would be).

## What you receive on Telegram

| When | Message |
|---|---|
| Student presses Start | 🟢 name, time, device |
| Listening closes | 🎧 raw score /40, band, per-part scores, wrong question numbers |
| Reading closes | 📖 same for Reading |
| Writing closes | ✅ summary, then each essay as a message, then a full **HTML report** file |

The report lists every answer beside the correct one, timings, how often the student
left the test page, blocked paste attempts and page reloads. Writing is left for you to mark.

Scoring runs on the server, so the answer key (`lib/answer-key.js`) never reaches the
student's browser. Typed answers ignore capitals and surrounding punctuation and accept the
alternatives in the published key (e.g. *photos / photographs / pictures*).

## Retakes

Progress is saved in the student's browser. To let someone retake the test on the same
device, open the link in a private/incognito window (or clear the site's data).

## Development

```bash
npm run dev     # local server on :5173; without .env.local, Telegram messages are printed, not sent
npm test        # scoring, bands, report and API checks
npm run maps    # regenerate public/js/maps.js from scripts/build-maps.mjs
```

On `localhost`, add `?debug=ielts-dev` to the URL for controls that fast-forward the clock.

## Deploy

```bash
vercel deploy --prod
```

Environment variables (Production): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (who receives
results) and optional `REPORT_TZ` (default `Asia/Tashkent`). After changing them, deploy again.

## Layout

```
public/            static site (index.html, css, js, audio)
  js/test-data.js  questions and passages (no answers)
  js/maps.js       generated Task 1 plans
api/event.js       receives start/section/final events, scores, sends to Telegram
lib/               answer key, scoring, report and Telegram helpers (server only)
scripts/           dev server, self-test, map generator
```
