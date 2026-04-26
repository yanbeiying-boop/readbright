const els = {};

const sampleText =
  "Good morning, everyone. My English voice is getting clearer every day. I listen, read, and try again with confidence. Every careful sentence makes my pronunciation stronger.";

const ipaCache = new Map();
const localIpa = {
  a: "/ə/",
  about: "/əˈbaʊt/",
  again: "/əˈɡen/",
  all: "/ɔːl/",
  am: "/æm/",
  an: "/ən/",
  and: "/ænd/",
  answer: "/ˈænsər/",
  are: "/ɑːr/",
  as: "/æz/",
  ask: "/æsk/",
  be: "/biː/",
  bright: "/braɪt/",
  can: "/kæn/",
  careful: "/ˈkerfəl/",
  clearly: "/ˈklɪrli/",
  confidence: "/ˈkɑːnfɪdəns/",
  day: "/deɪ/",
  do: "/duː/",
  does: "/dʌz/",
  every: "/ˈevri/",
  everyone: "/ˈevriwʌn/",
  for: "/fɔːr/",
  getting: "/ˈɡetɪŋ/",
  good: "/ɡʊd/",
  great: "/ɡreɪt/",
  has: "/hæz/",
  have: "/hæv/",
  he: "/hiː/",
  hello: "/həˈloʊ/",
  hi: "/haɪ/",
  i: "/aɪ/",
  is: "/ɪz/",
  it: "/ɪt/",
  listen: "/ˈlɪsən/",
  makes: "/meɪks/",
  morning: "/ˈmɔːrnɪŋ/",
  my: "/maɪ/",
  name: "/neɪm/",
  of: "/əv/",
  practice: "/ˈpræktɪs/",
  pronunciation: "/prəˌnʌnsiˈeɪʃən/",
  read: "/riːd/",
  reading: "/ˈriːdɪŋ/",
  sentence: "/ˈsentəns/",
  she: "/ʃiː/",
  sound: "/saʊnd/",
  stronger: "/ˈstrɔːŋɡər/",
  sun: "/sʌn/",
  the: "/ðə/",
  this: "/ðɪs/",
  today: "/təˈdeɪ/",
  try: "/traɪ/",
  voice: "/vɔɪs/",
  we: "/wiː/",
  well: "/wel/",
  what: "/wʌt/",
  with: "/wɪð/",
  you: "/juː/",
  your: "/jʊr/"
};

const state = {
  name: "",
  sentences: [],
  tokensBySentence: [],
  scoresBySentence: [],
  currentIndex: 0,
  currentFinal: "",
  currentInterim: "",
  isListening: false,
  assessmentMode: localStorage.getItem("readbright-mode") || "free",
  readingRecognition: null,
  azureRecognizer: null,
  nameRecognition: null,
  finalizeTimer: null,
  rainbowSentenceIndex: -1,
  streak: 0,
  completedCount: 0
};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  bindEvents();
  loadText();
  hydrateIcons();

  const savedName = localStorage.getItem("readbright-name");
  if (savedName) {
    els.nameInput.value = `My name is ${savedName}`;
  }

  const savedRegion = localStorage.getItem("readbright-azure-region");
  if (savedRegion) els.azureRegionInput.value = savedRegion;
  setAssessmentMode(state.assessmentMode);
});

function bindElements() {
  [
    "nameGate",
    "practiceApp",
    "listenNameButton",
    "saveNameButton",
    "nameInput",
    "nameStatus",
    "studentGreeting",
    "resetNameButton",
    "finishButton",
    "fileInput",
    "sourceText",
    "loadTextButton",
    "sampleButton",
    "fileStatus",
    "modeFreeButton",
    "modeApiButton",
    "apiPanel",
    "azureKeyInput",
    "azureRegionInput",
    "clearApiButton",
    "apiStatus",
    "sentenceCounter",
    "startReadingButton",
    "stopReadingButton",
    "nextSentenceButton",
    "readerPaper",
    "liveTranscript",
    "streakPill",
    "replaySentenceButton",
    "scoreRing",
    "overallScore",
    "wordList",
    "finishOverlay",
    "finishMessage",
    "finishStats",
    "finishReport",
    "againButton"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  els.listenNameButton.addEventListener("click", listenForName);
  els.saveNameButton.addEventListener("click", () => acceptName(els.nameInput.value));
  els.nameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") acceptName(els.nameInput.value);
  });
  els.resetNameButton.addEventListener("click", resetName);
  els.loadTextButton.addEventListener("click", loadText);
  els.sampleButton.addEventListener("click", () => {
    els.sourceText.value = sampleText;
    loadText();
  });
  els.fileInput.addEventListener("change", handleFileUpload);
  els.readerPaper.addEventListener("click", handleReaderPaperClick);
  els.modeFreeButton.addEventListener("click", () => setAssessmentMode("free"));
  els.modeApiButton.addEventListener("click", () => setAssessmentMode("api"));
  els.azureRegionInput.addEventListener("input", () => {
    localStorage.setItem("readbright-azure-region", els.azureRegionInput.value.trim());
  });
  els.clearApiButton.addEventListener("click", clearApiCredentials);
  els.startReadingButton.addEventListener("click", startReading);
  els.stopReadingButton.addEventListener("click", stopReading);
  els.nextSentenceButton.addEventListener("click", () => finalizeCurrentSentence(true));
  els.replaySentenceButton.addEventListener("click", speakCurrentSentence);
  els.finishButton.addEventListener("click", finishPractice);
  els.finishReport.addEventListener("click", handleFinishReportClick);
  els.againButton.addEventListener("click", restartPractice);
}

function hydrateIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}


function setAssessmentMode(mode) {
  state.assessmentMode = mode === "api" ? "api" : "free";
  localStorage.setItem("readbright-mode", state.assessmentMode);
  els.modeFreeButton.classList.toggle("is-active", state.assessmentMode === "free");
  els.modeApiButton.classList.toggle("is-active", state.assessmentMode === "api");
  els.apiPanel.classList.toggle("is-hidden", state.assessmentMode !== "api");
  els.apiStatus.textContent = state.assessmentMode === "api" ? "Key stays in this browser" : "Not saved";
}

function clearApiCredentials() {
  els.azureKeyInput.value = "";
  els.azureRegionInput.value = "";
  localStorage.removeItem("readbright-azure-region");
  els.apiStatus.textContent = "Cleared";
}

function getRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function listenForName() {
  const Recognition = getRecognitionConstructor();
  if (!Recognition) {
    els.nameStatus.textContent = "Speech recognition is not available in this browser.";
    return;
  }

  stopRecognition(state.nameRecognition);
  els.nameStatus.textContent = "Listening";
  state.nameRecognition = new Recognition();
  state.nameRecognition.lang = "en-US";
  state.nameRecognition.interimResults = false;
  state.nameRecognition.continuous = false;

  state.nameRecognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join(" ");
    els.nameInput.value = transcript;
    acceptName(transcript);
  };

  state.nameRecognition.onerror = () => {
    els.nameStatus.textContent = "Try typing your name.";
  };

  state.nameRecognition.onend = () => {
    if (!state.name) {
      els.nameStatus.textContent = "Ready";
    }
  };

  speak("Hi, what's your name?", () => state.nameRecognition.start());
}

function acceptName(rawValue) {
  const parsed = parseName(rawValue);
  if (!parsed) {
    els.nameStatus.textContent = "Say: My name is...";
    return;
  }

  state.name = parsed;
  localStorage.setItem("readbright-name", parsed);
  els.studentGreeting.textContent = `${parsed}, let's read.`;
  els.nameGate.classList.add("is-hidden");
  els.practiceApp.classList.remove("is-hidden");
  els.nameStatus.textContent = "Ready";
  renderAll();
}

function parseName(value) {
  const compact = String(value || "")
    .replace(/[’]/g, "'")
    .replace(/[.,!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!compact) return "";

  const patterns = [
    /\bmy name is\s+([a-z][a-z\s'-]{0,40})$/i,
    /\bmy names\s+([a-z][a-z\s'-]{0,40})$/i,
    /\bi am\s+([a-z][a-z\s'-]{0,40})$/i,
    /\bi'm\s+([a-z][a-z\s'-]{0,40})$/i,
    /\bim\s+([a-z][a-z\s'-]{0,40})$/i,
    /\bcall me\s+([a-z][a-z\s'-]{0,40})$/i,
    /\bthis is\s+([a-z][a-z\s'-]{0,40})$/i
  ];

  let name = "";
  for (const pattern of patterns) {
    const match = compact.match(pattern);
    if (match) {
      name = match[1];
      break;
    }
  }

  if (!name && /^[a-z][a-z\s'-]{0,40}$/i.test(compact)) {
    name = compact;
  }

  return titleCaseName(name.replace(/\b(and|uh|um|please)$/i, "").trim());
}

function titleCaseName(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) =>
      part
        .split("-")
        .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1).toLowerCase())
        .join("-")
    )
    .join(" ");
}

function resetName() {
  stopReading();
  state.name = "";
  els.nameGate.classList.remove("is-hidden");
  els.practiceApp.classList.add("is-hidden");
  els.finishOverlay.classList.add("is-hidden");
  els.nameStatus.textContent = "Ready";
}

function loadText() {
  stopReading();
  const text = els.sourceText.value.trim();
  state.sentences = splitSentences(text);
  if (state.sentences.length === 0) {
    state.sentences = ["Add a sentence, then start reading."];
  }

  state.tokensBySentence = state.sentences.map(tokenizeSentence);
  state.scoresBySentence = state.sentences.map(() => []);
  state.currentIndex = 0;
  state.currentFinal = "";
  state.currentInterim = "";
  state.streak = 0;
  state.rainbowSentenceIndex = -1;
  state.completedCount = 0;
  els.liveTranscript.textContent = "Waiting";
  els.fileStatus.textContent = `${state.sentences.length} sentence${state.sentences.length === 1 ? "" : "s"}`;
  renderAll();
}

function splitSentences(text) {
  const clean = text.replace(/\r/g, "\n").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const matches = clean.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g);
  return (matches || [clean]).map((sentence) => sentence.trim()).filter(Boolean).slice(0, 80);
}

function tokenizeSentence(sentence) {
  return sentence.match(/[A-Za-z]+(?:[’'-][A-Za-z]+)?|\d+|\s+|[^A-Za-z0-9\s]+/g) || [];
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    els.fileStatus.textContent = "Loading";
    const lowerName = file.name.toLowerCase();
    let text = "";

    if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
      text = await extractPdfText(file);
    } else if (lowerName.endsWith(".docx")) {
      text = await extractDocxText(file);
    } else if (lowerName.endsWith(".doc")) {
      throw new Error("Use .docx for Word documents.");
    } else {
      text = await file.text();
    }

    els.sourceText.value = cleanImportedText(text);
    loadText();
  } catch (error) {
    els.fileStatus.textContent = error.message || "Could not load file.";
  } finally {
    event.target.value = "";
  }
}

async function extractPdfText(file) {
  if (!window.pdfjsLib) {
    throw new Error("PDF parser is unavailable.");
  }

  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }

  return pages.join("\n");
}

async function extractDocxText(file) {
  if (!window.mammoth) {
    throw new Error("Word parser is unavailable.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

function cleanImportedText(text) {
  return String(text || "")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function startReading() {
  if (!state.sentences.length) loadText();

  if (state.assessmentMode === "api") {
    startApiAssessment();
    return;
  }

  const Recognition = getRecognitionConstructor();
  if (!Recognition) {
    els.liveTranscript.textContent = "Speech recognition is not available in this browser.";
    return;
  }

  stopRecognition(state.readingRecognition);
  stopAzureRecognizer();
  state.currentFinal = "";
  state.currentInterim = "";
  state.isListening = true;
  els.startReadingButton.disabled = true;
  els.stopReadingButton.disabled = false;
  els.liveTranscript.textContent = "Listening";

  state.readingRecognition = new Recognition();
  state.readingRecognition.lang = "en-US";
  state.readingRecognition.interimResults = true;
  state.readingRecognition.continuous = true;

  state.readingRecognition.onresult = handleReadingResult;
  state.readingRecognition.onerror = () => {
    els.liveTranscript.textContent = "Recognition paused.";
  };
  state.readingRecognition.onend = () => {
    if (state.isListening && state.assessmentMode === "free") {
      try {
        state.readingRecognition.start();
      } catch {
        state.isListening = false;
        updateListeningButtons();
      }
    }
  };

  try {
    state.readingRecognition.start();
  } catch {
    els.liveTranscript.textContent = "Already listening.";
  }
}

function stopReading() {
  state.isListening = false;
  clearTimeout(state.finalizeTimer);
  stopRecognition(state.readingRecognition);
  stopAzureRecognizer();
  updateListeningButtons();
}


function startApiAssessment() {
  if (!window.SpeechSDK) {
    els.liveTranscript.textContent = "Azure Speech SDK is still loading.";
    return;
  }

  const key = els.azureKeyInput.value.trim();
  const region = els.azureRegionInput.value.trim();
  if (!key || !region) {
    els.apiStatus.textContent = "Add key and region";
    els.liveTranscript.textContent = "API key required.";
    return;
  }

  stopRecognition(state.readingRecognition);
  stopAzureRecognizer();
  state.currentFinal = "";
  state.currentInterim = "";
  state.isListening = true;
  els.startReadingButton.disabled = true;
  els.stopReadingButton.disabled = false;
  els.liveTranscript.textContent = "API listening";
  els.apiStatus.textContent = "Listening";

  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
  speechConfig.speechRecognitionLanguage = "en-US";
  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
  state.azureRecognizer = recognizer;

  const referenceText = state.sentences[state.currentIndex] || "";
  const assessmentConfig = new SpeechSDK.PronunciationAssessmentConfig(
    referenceText,
    SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
    SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
    true
  );
  assessmentConfig.phonemeAlphabet = "IPA";
  assessmentConfig.nbestPhonemeCount = 1;
  assessmentConfig.applyTo(recognizer);

  recognizer.recognizeOnceAsync(
    (result) => {
      state.isListening = false;
      updateListeningButtons();
      applyApiAssessmentResult(result);
      recognizer.close();
      if (state.azureRecognizer === recognizer) state.azureRecognizer = null;
    },
    (error) => {
      state.isListening = false;
      updateListeningButtons();
      els.apiStatus.textContent = "API error";
      els.liveTranscript.textContent = String(error || "API error");
      recognizer.close();
      if (state.azureRecognizer === recognizer) state.azureRecognizer = null;
    }
  );
}

function stopAzureRecognizer() {
  if (!state.azureRecognizer) return;
  try {
    state.azureRecognizer.close();
  } catch {
    /* Azure recognizer was already closed. */
  }
  state.azureRecognizer = null;
}

function applyApiAssessmentResult(result) {
  const jsonText = result.properties?.getProperty?.(SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult) || "";
  let payload = null;
  try {
    payload = JSON.parse(jsonText);
  } catch {
    payload = null;
  }

  const best = payload?.NBest?.[0];
  const apiWords = Array.isArray(best?.Words) ? best.Words : [];
  const heardText = payload?.DisplayText || result.text || "";
  state.currentFinal = heardText;
  els.liveTranscript.textContent = heardText || "No speech detected";

  if (!apiWords.length) {
    updateCurrentScores(heardText, true);
    completeCurrentSentence();
    return;
  }

  const sentenceIndex = state.currentIndex;
  const expectedWords = getExpectedWords(sentenceIndex);
  const normalizedApiWords = apiWords.map((word) => normalizeWord(word.Word));
  const assignments = alignWords(expectedWords, normalizedApiWords);
  const nextScores = [];

  expectedWords.forEach((expected, index) => {
    const apiIndex = assignments[index]?.heardIndex;
    const apiWord = Number.isInteger(apiIndex) ? apiWords[apiIndex] : null;
    const assessment = apiWord?.PronunciationAssessment || {};
    const errorType = String(assessment.ErrorType || "").toLowerCase();
    const rawScore = Number(assessment.AccuracyScore);
    const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : 18;
    const ipa = extractApiIpa(apiWord);
    const status = errorType === "omission" || score < 68 ? "wrong" : score >= 84 ? "correct" : "close";

    nextScores[index] = {
      word: expected.raw,
      normalized: expected.normalized,
      score: apiWord ? score : 18,
      status: apiWord ? status : "wrong",
      ipa
    };
  });

  state.scoresBySentence[sentenceIndex] = nextScores;
  queueIpaLookups(sentenceIndex);
  els.apiStatus.textContent = "Scored";
  completeCurrentSentence();
}

function extractApiIpa(apiWord) {
  const phonemes = apiWord?.Phonemes;
  if (!Array.isArray(phonemes) || !phonemes.length) return "";
  const symbols = phonemes.map((phoneme) => phoneme.Phoneme).filter(Boolean);
  return symbols.length ? "/" + symbols.join(" ") + "/" : "";
}

function stopRecognition(recognition) {
  if (!recognition) return;
  try {
    recognition.stop();
  } catch {
    try {
      recognition.abort();
    } catch {
      /* Browser already closed the recognizer. */
    }
  }
}

function updateListeningButtons() {
  els.startReadingButton.disabled = false;
  els.stopReadingButton.disabled = true;
}

function handleReadingResult(event) {
  let interim = "";
  let sawFinal = false;

  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index];
    const transcript = result[0].transcript.trim();

    if (result.isFinal) {
      state.currentFinal = `${state.currentFinal} ${transcript}`.trim();
      sawFinal = true;
    } else {
      interim = `${interim} ${transcript}`.trim();
    }
  }

  state.currentInterim = interim;
  const combined = getCurrentHeardText();
  els.liveTranscript.textContent = combined || "Listening";
  updateCurrentScores(combined, false);

  if (combined) {
    const heardCount = normalizeWords(combined).length;
    const expectedCount = getExpectedWords(state.currentIndex).length;
    const average = getSentenceAverage(state.currentIndex);
    const delay = heardCount >= expectedCount && average >= 68 ? 700 : 1650;
    scheduleFinalize(delay);
  } else if (sawFinal) {
    scheduleFinalize(1650);
  }
}

function getCurrentHeardText() {
  return `${state.currentFinal} ${state.currentInterim}`.trim();
}

function scheduleFinalize(delay) {
  clearTimeout(state.finalizeTimer);
  state.finalizeTimer = setTimeout(() => finalizeCurrentSentence(false), delay);
}

function finalizeCurrentSentence(manual) {
  clearTimeout(state.finalizeTimer);
  const heard = getCurrentHeardText();

  if (!heard && !manual) return;

  updateCurrentScores(heard, true);
  completeCurrentSentence();
}


function completeCurrentSentence() {
  const average = getSentenceAverage(state.currentIndex);
  const allGood = average >= 84 && getWrongCount(state.currentIndex) === 0;
  state.completedCount = Math.max(state.completedCount, state.currentIndex + 1);

  if (allGood) {
    state.streak += 1;
    state.rainbowSentenceIndex = state.currentIndex;
    triggerRainbow();
  } else {
    state.streak = 0;
    state.rainbowSentenceIndex = -1;
  }

  state.currentFinal = "";
  state.currentInterim = "";
  els.liveTranscript.textContent = "Waiting";

  if (state.currentIndex >= state.sentences.length - 1) {
    renderAll();
    finishPractice();
    return;
  }

  state.currentIndex += 1;
  renderAll();
}

function updateCurrentScores(heard, finalPass) {
  const sentenceIndex = state.currentIndex;
  const expectedWords = getExpectedWords(sentenceIndex);
  const heardWords = normalizeWords(heard);
  const assignments = alignWords(expectedWords, heardWords);
  const nextScores = state.scoresBySentence[sentenceIndex] || [];

  assignments.forEach((assignment, index) => {
    if (assignment.score == null && !finalPass) return;

    const token = expectedWords[index];
    const score = assignment.score == null ? 18 : assignment.score;
    nextScores[index] = {
      word: token.raw,
      normalized: token.normalized,
      score,
      status: score >= 84 ? "correct" : score >= 68 ? "close" : "wrong",
      ipa: nextScores[index]?.ipa || ""
    };
  });

  if (finalPass) {
    expectedWords.forEach((word, index) => {
      if (!nextScores[index]) {
        nextScores[index] = {
          word: word.raw,
          normalized: word.normalized,
          score: 18,
          status: "wrong",
          ipa: ""
        };
      }
    });
  }

  state.scoresBySentence[sentenceIndex] = nextScores;
  queueIpaLookups(sentenceIndex);
  renderAll();
}

function getExpectedWords(sentenceIndex) {
  const tokens = state.tokensBySentence[sentenceIndex] || [];
  return tokens
    .filter(isWordToken)
    .map((raw) => ({
      raw,
      normalized: normalizeWord(raw)
    }))
    .filter((word) => word.normalized);
}

function normalizeWords(text) {
  return String(text || "")
    .match(/[A-Za-z]+(?:[’'-][A-Za-z]+)?|\d+/g)?.map(normalizeWord)
    .filter(Boolean) || [];
}

function normalizeWord(word) {
  return String(word || "")
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9']/g, "")
    .replace(/^'|'$/g, "")
    .replace(/'/g, "");
}

function isWordToken(token) {
  return /^[A-Za-z0-9]/.test(token);
}

function alignWords(expectedWords, heardWords) {
  const rows = expectedWords.length + 1;
  const cols = heardWords.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));
  const back = Array.from({ length: rows }, () => Array(cols).fill(null));

  for (let i = 1; i < rows; i += 1) {
    dp[i][0] = i;
    back[i][0] = "delete";
  }
  for (let j = 1; j < cols; j += 1) {
    dp[0][j] = j * 0.72;
    back[0][j] = "insert";
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const similarity = wordSimilarity(expectedWords[i - 1].normalized, heardWords[j - 1]);
      const substituteCost = similarity === 1 ? 0 : similarity >= 0.82 ? 0.25 : similarity >= 0.64 ? 0.56 : 1;
      const choices = [
        { type: "match", cost: dp[i - 1][j - 1] + substituteCost },
        { type: "delete", cost: dp[i - 1][j] + 1 },
        { type: "insert", cost: dp[i][j - 1] + 0.72 }
      ];
      choices.sort((a, b) => a.cost - b.cost);
      dp[i][j] = choices[0].cost;
      back[i][j] = choices[0].type;
    }
  }

  const assignments = expectedWords.map(() => ({ score: null, similarity: 0, heardIndex: null }));
  let i = expectedWords.length;
  let j = heardWords.length;

  while (i > 0 || j > 0) {
    const action = back[i][j];
    if (action === "match") {
      const similarity = wordSimilarity(expectedWords[i - 1].normalized, heardWords[j - 1]);
      assignments[i - 1] = {
        score: similarityToScore(similarity),
        similarity,
        heardIndex: j - 1
      };
      i -= 1;
      j -= 1;
    } else if (action === "delete") {
      assignments[i - 1] = { score: null, similarity: 0, heardIndex: null };
      i -= 1;
    } else {
      j -= 1;
    }
  }

  return assignments;
}

function wordSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const distance = levenshtein(a, b);
  const maxLength = Math.max(a.length, b.length);
  return Math.max(0, 1 - distance / maxLength);
}

function levenshtein(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length];
}

function similarityToScore(similarity) {
  if (similarity >= 1) return 98 + Math.floor(Math.random() * 3);
  if (similarity >= 0.86) return Math.round(82 + similarity * 13);
  if (similarity >= 0.68) return Math.round(56 + similarity * 28);
  if (similarity >= 0.48) return Math.round(28 + similarity * 42);
  return Math.round(16 + similarity * 26);
}

function getSentenceAverage(sentenceIndex) {
  const scores = state.scoresBySentence[sentenceIndex] || [];
  const completed = scores.filter(Boolean);
  if (!completed.length) return 0;
  return Math.round(completed.reduce((sum, item) => sum + item.score, 0) / completed.length);
}

function getWrongCount(sentenceIndex) {
  const scores = state.scoresBySentence[sentenceIndex] || [];
  return scores.filter((item) => item && item.status === "wrong").length;
}

function queueIpaLookups(sentenceIndex) {
  const scores = state.scoresBySentence[sentenceIndex] || [];

  scores.forEach((item, index) => {
    if (!item || item.status !== "wrong" || item.ipa) return;
    item.ipa = "...";
    getIpa(item.normalized).then((ipa) => {
      const current = state.scoresBySentence[sentenceIndex]?.[index];
      if (current && current.normalized === item.normalized) {
        current.ipa = ipa || "";
        renderAll();
      }
    });
  });
}

async function getIpa(normalizedWord) {
  if (!normalizedWord) return "";
  if (ipaCache.has(normalizedWord)) return ipaCache.get(normalizedWord);
  if (localIpa[normalizedWord]) {
    ipaCache.set(normalizedWord, localIpa[normalizedWord]);
    return localIpa[normalizedWord];
  }

  ipaCache.set(normalizedWord, "");
  return "";
}

function renderAll() {
  renderReader();
  renderFeedback();
  renderStreak();
  hydrateIcons();
}

function renderReader() {
  const fragment = document.createDocumentFragment();

  state.sentences.forEach((sentence, sentenceIndex) => {
    const row = document.createElement("p");
    row.className = "sentence-row";
    if (sentenceIndex === state.currentIndex) row.classList.add("is-current");
    if (sentenceIndex < state.completedCount) row.classList.add("is-done");
    if (sentenceIndex === state.rainbowSentenceIndex) row.classList.add("is-rainbow");

    let wordIndex = 0;
    for (const token of tokenizeSentence(sentence)) {
      if (/^\s+$/.test(token)) {
        row.append(document.createTextNode(" "));
      } else if (isWordToken(token)) {
        row.append(createWordCell(token, sentenceIndex, wordIndex));
        wordIndex += 1;
      } else {
        const punctuation = document.createElement("span");
        punctuation.className = "plain-token";
        punctuation.textContent = token;
        row.append(punctuation);
      }
    }

    fragment.append(row);
  });

  els.readerPaper.replaceChildren(fragment);
  els.sentenceCounter.textContent = `${Math.min(state.currentIndex + 1, state.sentences.length)} / ${state.sentences.length}`;
}

function createWordCell(word, sentenceIndex, wordIndex) {
  const score = state.scoresBySentence[sentenceIndex]?.[wordIndex];
  const cell = document.createElement("span");
  cell.className = "word-cell";

  const scoreBadge = document.createElement("span");
  scoreBadge.className = "word-score";
  if (score) {
    scoreBadge.textContent = String(score.score);
    scoreBadge.style.background = scoreColor(score.score);
    scoreBadge.classList.add("is-visible", "spark");
    cell.classList.add(`is-${score.status}`);
  }

  const wordText = document.createElement("span");
  wordText.className = "word-text";
  wordText.textContent = word;

  const ipa = document.createElement("span");
  ipa.className = "ipa";
  ipa.textContent = score?.status === "wrong" ? score.ipa : "";

  const helpRow = document.createElement("span");
  helpRow.className = "pron-row";
  helpRow.append(ipa);

  const playButton = document.createElement("button");
  playButton.className = "pron-button";
  playButton.type = "button";
  playButton.title = `Play ${word}`;
  playButton.setAttribute("aria-label", `Play ${word}`);
  playButton.dataset.word = word;
  playButton.innerHTML = '<i data-lucide="volume-2"></i>';
  if (score?.status !== "wrong") playButton.hidden = true;
  helpRow.append(playButton);

  cell.append(scoreBadge, wordText, helpRow);
  return cell;
}

function handleReaderPaperClick(event) {
  const button = event.target.closest(".pron-button");
  if (!button) return;
  speakWord(button.dataset.word || "");
}

function renderFeedback() {
  const average = getSentenceAverage(state.currentIndex);
  els.overallScore.textContent = average ? String(average) : "--";
  els.scoreRing.style.setProperty("--score", String(average || 0));

  const words = getExpectedWords(state.currentIndex);
  const scores = state.scoresBySentence[state.currentIndex] || [];
  const fragment = document.createDocumentFragment();

  words.forEach((word, index) => {
    const score = scores[index];
    const row = document.createElement("div");
    row.className = "score-row";
    if (score?.status === "wrong") row.classList.add("is-wrong");

    const label = document.createElement("strong");
    label.textContent = word.raw;

    const value = document.createElement("span");
    value.textContent = score ? String(score.score) : "--";
    if (score) value.style.color = scoreColor(score.score);

    row.append(label, value);
    fragment.append(row);
  });

  els.wordList.replaceChildren(fragment);
}

function renderStreak() {
  els.streakPill.querySelector("span").textContent = String(state.streak);
}

function scoreColor(score) {
  if (score >= 84) return "#27a668";
  if (score >= 68) return "#f0a91f";
  return "#ff5f57";
}

function triggerRainbow() {
  const rainbowIndex = state.rainbowSentenceIndex;
  els.streakPill.classList.remove("is-hot");
  void els.streakPill.offsetWidth;
  els.streakPill.classList.add("is-hot");

  window.requestAnimationFrame(() => {
    const rows = els.readerPaper.querySelectorAll(".sentence-row");
    const row = rows[rainbowIndex];
    if (!row) return;
    row.classList.remove("is-rainbow");
    void row.offsetWidth;
    row.classList.add("is-rainbow");
  });

  window.setTimeout(() => {
    if (state.rainbowSentenceIndex === rainbowIndex) {
      state.rainbowSentenceIndex = -1;
      renderAll();
    }
  }, 1200);
}

function speakCurrentSentence() {
  const sentence = state.sentences[state.currentIndex];
  if (sentence) speak(sentence);
}

function speakWord(word) {
  const cleanWord = String(word || "").replace(/[^A-Za-z'-]/g, "").trim();
  if (!cleanWord || !window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(cleanWord);
  utterance.lang = "en-US";
  utterance.rate = 0.74;
  utterance.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function speak(text, afterEnd) {
  if (!window.speechSynthesis) {
    if (afterEnd) window.setTimeout(afterEnd, 50);
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.92;
  utterance.onend = () => {
    if (afterEnd) afterEnd();
  };
  utterance.onerror = () => {
    if (afterEnd) afterEnd();
  };
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function handleFinishReportClick(event) {
  const button = event.target.closest(".report-play");
  if (!button) return;
  speakWord(button.dataset.word || "");
}

function renderFinishReport(average) {
  const report = buildPronunciationReport();
  const container = document.createElement("div");

  const summary = document.createElement("div");
  summary.className = "report-summary";

  const summaryTitle = document.createElement("strong");
  summaryTitle.textContent = report.items.length ? "Pronunciation focus" : "Pronunciation report";

  const summaryText = document.createElement("span");
  summaryText.textContent = report.summary;

  summary.append(summaryTitle, summaryText);
  container.append(summary);

  if (!report.items.length) {
    const empty = document.createElement("p");
    empty.className = "report-empty";
    empty.textContent =
      average >= 88
        ? "No major sound pattern stood out. Keep reading slowly and clearly."
        : "Read a few more sentences to get a richer sound report.";
    container.append(empty);
    els.finishReport.replaceChildren(container);
    return;
  }

  const table = document.createElement("div");
  table.className = "report-table";
  table.setAttribute("role", "table");
  table.setAttribute("aria-label", "Pronunciation report");

  ["Word", "Score", "Focus", "Sound / IPA", "Tip"].forEach((heading) => {
    const cell = document.createElement("div");
    cell.className = "report-th";
    cell.setAttribute("role", "columnheader");
    cell.textContent = heading;
    table.append(cell);
  });

  report.items.forEach((item) => {
    const wordCell = document.createElement("div");
    wordCell.className = "report-word";
    wordCell.setAttribute("role", "cell");

    const wordText = document.createElement("strong");
    wordText.textContent = item.word;

    const playButton = document.createElement("button");
    playButton.className = "report-play";
    playButton.type = "button";
    playButton.dataset.word = item.word;
    playButton.title = `Play ${item.word}`;
    playButton.setAttribute("aria-label", `Play ${item.word}`);
    playButton.innerHTML = '<i data-lucide="volume-2"></i>';

    wordCell.append(wordText, playButton);
    table.append(wordCell);

    const scoreCell = document.createElement("div");
    scoreCell.className = "report-score";
    scoreCell.setAttribute("role", "cell");
    scoreCell.textContent = String(item.score);
    scoreCell.style.color = scoreColor(item.score);
    table.append(scoreCell);

    const focusCell = document.createElement("div");
    focusCell.className = "report-focus";
    focusCell.setAttribute("role", "cell");
    focusCell.textContent = item.focus;
    table.append(focusCell);

    const ipaCell = document.createElement("div");
    ipaCell.className = "report-ipa";
    ipaCell.setAttribute("role", "cell");
    ipaCell.textContent = formatReportSound(item);
    table.append(ipaCell);

    const tipCell = document.createElement("div");
    tipCell.className = "report-tip";
    tipCell.setAttribute("role", "cell");
    tipCell.textContent = item.tip;
    table.append(tipCell);
  });

  container.append(table);
  els.finishReport.replaceChildren(container);
  hydrateIcons();
}

function buildPronunciationReport() {
  const byWord = new Map();

  state.scoresBySentence.forEach((sentenceScores) => {
    sentenceScores.filter(Boolean).forEach((item) => {
      if (item.score >= 84 && item.status === "correct") return;

      const key = item.normalized || normalizeWord(item.word);
      if (!key) return;

      const ipa = item.ipa && item.ipa !== "..." ? item.ipa : localIpa[key] || "";
      const current = byWord.get(key);
      const next = {
        word: item.word,
        normalized: key,
        score: item.score,
        status: item.status,
        ipa
      };

      if (!current || item.score < current.score) byWord.set(key, next);
    });
  });

  const items = Array.from(byWord.values())
    .sort((a, b) => a.score - b.score)
    .slice(0, 8)
    .map((item) => ({
      ...item,
      ...analyzePronunciationFocus(item)
    }));

  const focusCounts = items.reduce(
    (counts, item) => {
      if (item.focus.includes("Vowel")) counts.vowels += 1;
      if (item.focus.includes("Consonant")) counts.consonants += 1;
      return counts;
    },
    { vowels: 0, consonants: 0 }
  );

  let summary = "No repeated weak sound pattern yet.";
  if (items.length) {
    const mainFocus =
      focusCounts.vowels > focusCounts.consonants
        ? "vowel sounds"
        : focusCounts.consonants > focusCounts.vowels
          ? "consonant sounds"
          : "both vowel and consonant sounds";
    summary = `${items.length} word${items.length === 1 ? "" : "s"} to review, with most attention on ${mainFocus}.`;
  }

  return { items, summary };
}

function formatReportSound(item) {
  if (item.ipa && item.sound && !item.ipa.includes(item.sound)) {
    return `${item.sound} · ${item.ipa}`;
  }
  return item.ipa || item.sound || "Listen";
}

function analyzePronunciationFocus(item) {
  const word = item.normalized || normalizeWord(item.word);
  const ipa = item.ipa && item.ipa !== "..." ? item.ipa : localIpa[word] || "";
  const compactIpa = ipa.replace(/[\/\s]/g, "");
  const cues = [];

  const addCue = (focus, sound, tip, weight = 1) => {
    cues.push({ focus, sound, tip, weight });
  };

  if (/th/.test(word) || /[θð]/.test(compactIpa)) {
    addCue("Consonant", "/th/", "Put the tongue tip lightly between the teeth, then let air pass.", 3);
  }
  if (/sh/.test(word) || /ʃ/.test(compactIpa)) {
    addCue("Consonant", "/ʃ/", "Round the lips a little and push air through the middle of the tongue.", 2);
  }
  if (/ch/.test(word) || /tʃ/.test(compactIpa)) {
    addCue("Consonant", "/tʃ/", "Start with a quick /t/ stop, then release into /sh/.", 2);
  }
  if (/v/.test(word) || /v/.test(compactIpa)) {
    addCue("Consonant", "/v/", "Touch top teeth to lower lip and keep the sound vibrating.", 2);
  }
  if (/[rl]/.test(word) || /[rl]/.test(compactIpa)) {
    addCue("Consonant", "/r/ or /l/", "For /l/, touch behind the teeth; for /r/, pull the tongue back.", 2);
  }
  if (/ng$/.test(word) || /ŋ/.test(compactIpa)) {
    addCue("Consonant", "/ŋ/", "Lift the back of the tongue like 'sing' and do not add a hard /g/.", 2);
  }
  if (/(str|spr|scr|thr|cl|pl|pr|tr|dr|st|sk|sp)/.test(word)) {
    addCue("Consonant", "cluster", "Break the consonant cluster slowly, then blend it without adding a vowel.", 2);
  }
  if (/[ptkbdgfsz]$/.test(word)) {
    addCue("Consonant", "final sound", "Finish the last consonant clearly; do not let the word fade away.", 1);
  }

  if (/æ/.test(compactIpa) || /a/.test(word) && !/(ai|ay|ar)/.test(word)) {
    addCue("Vowel", "/æ/", "Open the mouth wider, like the vowel in 'cat'.", 2);
  }
  if (/iː|ɪ/.test(compactIpa) || /(ee|ea|i)/.test(word)) {
    addCue("Vowel", "/i/ sound", "Keep /i:/ long and smiling; keep /ɪ/ shorter and more relaxed.", 2);
  }
  if (/ʌ|ɑː|ɔː|ʊ|uː|ə/.test(compactIpa)) {
    addCue("Vowel", "core vowel", "Hold the vowel shape steady before moving to the next sound.", 2);
  }
  if (/aɪ|eɪ|ɔɪ|aʊ|oʊ/.test(compactIpa) || /(igh|ay|ow|oy|ou)/.test(word)) {
    addCue("Vowel", "diphthong", "Glide smoothly from the first vowel position to the second.", 2);
  }
  if (/ɚ|ər|r\//.test(ipa) || /(er|or|ar|ir|ur)$/.test(word)) {
    addCue("Vowel + consonant", "r-colored vowel", "Hold the vowel, then curl gently into /r/ without adding an extra syllable.", 3);
  }

  if (!cues.length) {
    return {
      focus: "Vowel + consonant",
      sound: ipa || "word shape",
      tip: "Say the word slowly, listen once, then repeat with a clear first vowel and final sound."
    };
  }

  const hasVowel = cues.some((cue) => cue.focus.includes("Vowel"));
  const hasConsonant = cues.some((cue) => cue.focus.includes("Consonant"));
  const strongest = cues.sort((a, b) => b.weight - a.weight)[0];

  return {
    focus: hasVowel && hasConsonant ? "Vowel + consonant" : strongest.focus,
    sound: strongest.sound,
    tip: strongest.tip
  };
}

function finishPractice() {
  stopReading();
  const allScores = state.scoresBySentence.flat().filter(Boolean);
  const average = allScores.length
    ? Math.round(allScores.reduce((sum, item) => sum + item.score, 0) / allScores.length)
    : 0;
  const name = state.name || "Reader";
  const message = average >= 88 ? `${name}, brilliant reading!` : `${name}, well done!`;

  els.finishMessage.textContent = message;
  els.finishStats.textContent = average ? `Average score ${average}` : "Great reading.";
  renderFinishReport(average);
  els.finishOverlay.classList.remove("is-hidden");
  speak(message);
}

function restartPractice() {
  els.finishOverlay.classList.add("is-hidden");
  state.currentIndex = 0;
  state.currentFinal = "";
  state.currentInterim = "";
  state.scoresBySentence = state.sentences.map(() => []);
  state.streak = 0;
  state.rainbowSentenceIndex = -1;
  state.completedCount = 0;
  els.liveTranscript.textContent = "Waiting";
  renderAll();
}
