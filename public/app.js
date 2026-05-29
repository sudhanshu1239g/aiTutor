const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const elements = {
  stack: document.querySelector("#stack"),
  voiceSelect: document.querySelector("#voiceSelect"),
  messages: document.querySelector("#messages"),
  composer: document.querySelector("#composer"),
  answerInput: document.querySelector("#answerInput"),
  micButton: document.querySelector("#micButton"),
  sendButton: document.querySelector("#sendButton"),
  startButton: document.querySelector("#startButton"),
  resetButton: document.querySelector("#resetButton"),
  statusText: document.querySelector("#statusText")
};

const conversation = [];
let recognition;
let isListening = false;
let availableVoices = [];

if (!SpeechRecognition) {
  elements.micButton.disabled = true;
  setStatus("Speech recognition is unavailable in this browser. Typing still works.");
} else {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = event => {
    let finalText = "";
    let interimText = "";

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const text = event.results[index][0].transcript;
      if (event.results[index].isFinal) finalText += text;
      else interimText += text;
    }

    if (finalText) {
      elements.answerInput.value = `${elements.answerInput.value} ${finalText}`.trim();
    }

    setStatus(interimText ? `Listening: ${interimText}` : "Listening...");
  };

  recognition.onend = () => {
    if (isListening) recognition.start();
  };

  recognition.onerror = event => {
    stopListening();
    setStatus(`Voice input stopped: ${event.error}.`);
  };
}

elements.startButton.addEventListener("click", () => askTutor(""));
elements.resetButton.addEventListener("click", resetChat);
elements.voiceSelect.addEventListener("change", previewSelectedVoice);
elements.composer.addEventListener("submit", event => {
  event.preventDefault();
  const text = elements.answerInput.value.trim();
  if (!text) return;
  addMessage("You", text, "user");
  elements.answerInput.value = "";
  askTutor(text);
});

loadVoices();
if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

elements.micButton.addEventListener("click", () => {
  if (isListening) stopListening();
  else startListening();
});

async function askTutor(userAnswer) {
  stopListening();
  setBusy(true);
  setStatus("AI tutor is thinking...");

  try {
    const response = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stack: elements.stack.value,
        answer: userAnswer,
        messages: conversation
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Tutor request failed.");

    const reply = data.reply || "Tell me more about your approach.";
    addMessage("AI Tutor", reply, "tutor");
    speak(reply);
  } catch (error) {
    setStatus(error.message);
  } finally {
    setBusy(false);
  }
}

function addMessage(name, text, type, save = true) {
  if (save) {
    conversation.push({ role: type === "user" ? "user" : "assistant", content: text });
  }

  const message = document.createElement("article");
  message.className = `message ${type}`;

  const label = document.createElement("span");
  label.textContent = name;

  const body = document.createElement("p");
  body.textContent = text;

  message.append(label, body);
  elements.messages.append(message);
  elements.messages.scrollTop = elements.messages.scrollHeight;
}

function startListening() {
  if (!recognition) return;
  window.speechSynthesis.cancel();
  isListening = true;
  elements.micButton.classList.add("listening");
  recognition.start();
  setStatus("Listening...");
}

function stopListening() {
  isListening = false;
  elements.micButton.classList.remove("listening");
  if (recognition) {
    try {
      recognition.stop();
    } catch {
      // The browser throws if recognition is already stopped.
    }
  }
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    setStatus("Reply ready.");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const selectedVoice = getSelectedVoice();
  if (selectedVoice) utterance.voice = selectedVoice;
  utterance.rate = 0.96;
  utterance.pitch = 1;
  utterance.onstart = () => setStatus("Speaking...");
  utterance.onend = () => setStatus("Your turn.");
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function loadVoices() {
  if (!("speechSynthesis" in window)) {
    elements.voiceSelect.disabled = true;
    return;
  }

  const previousVoice = elements.voiceSelect.value;
  availableVoices = window.speechSynthesis
    .getVoices()
    .filter(voice => voice.lang.toLowerCase().startsWith("en"))
    .sort((first, second) => first.name.localeCompare(second.name));

  elements.voiceSelect.innerHTML = '<option value="">Default voice</option>';

  availableVoices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${voice.name} (${voice.lang})`;
    elements.voiceSelect.append(option);
  });

  elements.voiceSelect.value = availableVoices[Number(previousVoice)] ? previousVoice : "";
}

function getSelectedVoice() {
  if (elements.voiceSelect.value === "") return null;
  const index = Number(elements.voiceSelect.value);
  return Number.isInteger(index) ? availableVoices[index] : null;
}

function previewSelectedVoice() {
  if (!elements.voiceSelect.value) return;
  speak("This is the interviewer voice.");
}

function resetChat() {
  stopListening();
  window.speechSynthesis.cancel();
  conversation.length = 0;
  elements.answerInput.value = "";
  elements.messages.innerHTML = "";
  addMessage(
    "AI Tutor",
    "Hi. Pick a topic and press Start. I will ask one interview question at a time, listen to your answer, and coach you out loud.",
    "tutor",
    false
  );
  setStatus("Ready.");
}

function setBusy(isBusy) {
  elements.sendButton.disabled = isBusy;
  elements.startButton.disabled = isBusy;
}

function setStatus(text) {
  elements.statusText.textContent = text;
}
