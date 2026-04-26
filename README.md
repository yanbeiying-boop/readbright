# ReadBright

ReadBright is a student-facing English reading practice web app. A student opens the web page, says their name, loads text from typing, PDF, Word, or plain text, then reads sentence by sentence and gets live visual feedback.

## What Students Can Do

- Answer "Hi, what's your name?" and have the app remember their name in that browser.
- Paste reading text or upload `.pdf`, `.docx`, or `.txt` files.
- Read each sentence aloud with microphone feedback.
- Choose Free mode or API mode.
- See word scores appear with a sparkle effect.
- See misread words highlighted with IPA when available.
- Trigger a rainbow streak when consecutive sentences are read accurately.
- Hear an ending encouragement such as "Alex, well done!"

## How To Share It With Students

Students should open ReadBright from an HTTPS web link. Do not rely on double-clicking `index.html` from a file attachment, because browser microphone and speech recognition permissions are much less reliable from local files.

Use any static HTTPS host:

- School LMS static page hosting
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages
- Your own HTTPS web server

Upload the app files in `reading-feedback-app`. There is no build step required. If local test files such as `chrome-profile/`, `server.out.log`, or `server.err.log` exist, leave them out of the hosted version.

## Local Preview

For a quick local preview:

```bash
npm start
```

Then open:

```text
http://127.0.0.1:5178/
```


## Two Student Modes

Free mode is the default. It uses the student's browser speech recognition and local matching to give quick word-level feedback without asking for an API key.

API mode is optional. A student can enter their own Azure Speech key and Azure region in the browser. The key is not committed to this project and is not saved by the app. In API mode, the student's microphone audio is sent to Azure Speech Pronunciation Assessment for more precise scoring.

For production classroom use, a teacher-owned backend is safer than asking students to bring keys. The backend can protect API credentials, apply usage limits, and keep school privacy controls in one place.

## Browser Requirements

Free mode uses browser speech recognition, so students should use a browser that supports `SpeechRecognition`, usually Chrome or Edge. API mode uses the Azure Speech SDK for JavaScript. The page must be served from HTTPS for student devices, except for local testing on `localhost`.

Students need to allow microphone access when the browser asks.

## Privacy Notes

Uploaded PDF, Word, and text files are parsed in the student's browser. The app does not include a teacher dashboard, database, or account system yet.

Free mode speech recognition is provided by the student's browser. Depending on the browser, audio may be processed by that browser vendor's speech service.

API mode sends the student's microphone audio to Azure Speech using the key and region entered on that device. The app stores the Azure region locally for convenience, but it does not save the API key.

IPA is included locally for common words in this prototype and API mode can return phoneme data from Azure. For full vocabulary coverage in a production student app, connect a pronunciation dictionary or speech assessment service through your own backend.

## Production Upgrade Path

This prototype demonstrates the student experience. For classroom production use, the next step is to replace the browser-only word matching with a real pronunciation assessment service. That would give more reliable phoneme-level scoring, better IPA coverage, teacher assignment links, student progress history, and safer school privacy controls.
