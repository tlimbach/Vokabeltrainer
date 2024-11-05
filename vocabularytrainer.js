let vocabularyList = [];
let currentMode = "";
let direction = "de-en";
let currentVocab = null;
let correctAnswers = 0;
let currentIndex = 0;
let progressSegments = [];

function selectVocabularyFile() {
  document.getElementById("fileInput").click();
}

document.getElementById("fileInput").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const content = e.target.result;
      parseVocabulary(content);
      document.getElementById("settings").classList.remove("hidden");
    };
    reader.readAsText(file);
  }
});

function parseVocabulary(content) {
  vocabularyList = content
    .trim()
    .split("\n")
    .map(line => {
      // Trennen Sie die Zeile am ersten Bindestrich, um `deutsch` und `englisch` zu erhalten
      const parts = line.split(" - ");
      if (parts.length === 2) { // Nur wenn exakt ein Bindestrich vorhanden ist
        const deutsch = parts[0].trim();
        const englisch = parts[1].trim();
        return { deutsch, englisch, score: 0 };
      } else {
        console.warn("Zeile konnte nicht korrekt geparst werden:", line);
        return null; // Ignorieren der Zeile, wenn das Format nicht passt
      }
    })
    .filter(entry => entry !== null); // Entfernen aller ungültigen Einträge

  console.log("Vokabelliste:", vocabularyList);
}





function confirmEndTraining() {
  if (confirm("Möchten Sie das Training wirklich abbrechen?")) {
    endTraining();
  }
}

function startTraining() {
  document.getElementById("fileselect").classList.add("hidden");

  direction = document.getElementById("direction").value;
  currentMode = document.getElementById("mode").value;
  correctAnswers = 0;
  currentIndex = 0;

  document.getElementById("settings").classList.add("hidden");
  document.getElementById("abortButton").classList.remove("hidden");

  if (currentMode === "flashcard") {
    startFlashcardMode();
  } else if (currentMode === "multiple-choice") {
    startMultipleChoiceMode();
  }
}

function startFlashcardMode() {
  document.getElementById("flashcard-mode").classList.remove("hidden");
  selectNextFlashcard();
}

function selectNextFlashcard() {
  const totalScore = vocabularyList.reduce((acc, vocab) => acc + (10 - vocab.score), 0);
  let random = Math.random() * totalScore;
  for (let vocab of vocabularyList) {
    random -= (10 - vocab.score);
    if (random <= 0) {
      setFlashcard(vocab);
      return;
    }
  }
}

function setFlashcard(vocab) {
  currentVocab = vocab;
  
  // Extrahiere den anzuzeigenden Text in eine eigene Variable
  let displayText = direction === "de-en" ? vocab.deutsch : vocab.englisch;
  
  // Setze den Text im Element "vocabulary"
  document.getElementById("vocabulary").innerText = displayText;
  
  // Prüfe die Länge des Textes und passe die Schriftgröße an
  if (displayText.length > 15) {
    document.getElementById("vocabulary").style.fontSize = "1.6em";
  } else {
    document.getElementById("vocabulary").style.fontSize = "2.2em"; // Standardgröße zurücksetzen
  }

  document.getElementById("flipButton").classList.remove("hidden");
  document.getElementById("knowButton").classList.add("hidden");
  document.getElementById("dontKnowButton").classList.add("hidden");
}


function flipCard() {
  document.getElementById("vocabulary").innerText =
    direction === "de-en" ? currentVocab.englisch : currentVocab.deutsch;
  document.getElementById("flipButton").classList.add("hidden");
  document.getElementById("knowButton").classList.remove("hidden");
  document.getElementById("dontKnowButton").classList.remove("hidden");
}

function markKnown(isKnown) {
  if (isKnown) {
    currentVocab.score = Math.min(currentVocab.score + 1, 10);
  } else {
    currentVocab.score = Math.max(currentVocab.score - 1, 0);
  }
  selectNextFlashcard();
}

function startMultipleChoiceMode() {
  document.getElementById("multiple-choice-mode").classList.remove("hidden");
  initializeProgressBar();
  loadMultipleChoiceQuestion();
}

function initializeProgressBar() {
  const progressContainer = document.getElementById("progress");
  progressContainer.innerHTML = "";
  progressSegments = [];

  vocabularyList.forEach(() => {
    const segment = document.createElement("div");
    segment.classList.add("progress-segment");
    progressContainer.appendChild(segment);
    progressSegments.push(segment);
  });
}

function loadMultipleChoiceQuestion() {
  if (currentIndex >= vocabularyList.length) {
    showResultDialog();
    return;
  }

  const vocab = vocabularyList[currentIndex];
  const correctAnswer = direction === "de-en" ? vocab.englisch : vocab.deutsch;
  const questionText = direction === "de-en" ? vocab.deutsch : vocab.englisch;

  document.getElementById("question").innerText = questionText;

  const choices = [correctAnswer];
  while (choices.length < 4) {
    const randomChoice =
      vocabularyList[Math.floor(Math.random() * vocabularyList.length)][
      direction === "de-en" ? "englisch" : "deutsch"
      ];
    if (!choices.includes(randomChoice)) {
      choices.push(randomChoice);
    }
  }
  choices.sort(() => Math.random() - 0.5);

  const choicesContainer = document.getElementById("choices");
  choicesContainer.innerHTML = ""; // Leeren des Containers

  choices.forEach(choice => {
    const button = document.createElement("button");
    button.textContent = choice; // Text wird unverändert angezeigt

    if (choice.length > 15) {
      button.style.fontSize = "1.3em";
    } else {
      button.style.fontSize = ""; // Standardgröße zurücksetzen
    }
  

    button.addEventListener("click", () => checkAnswer(button, choice, correctAnswer));
    choicesContainer.appendChild(button);
  });
}


function checkAnswer(button, selected, correct) {
  if (selected === correct) {
    button.classList.add("correct");
    progressSegments[currentIndex].classList.add("progress-correct");
    playPositiveSound();
    correctAnswers++;
  } else {
    button.classList.add("incorrect");
    progressSegments[currentIndex].classList.add("progress-incorrect");
    playSound(210, 0.5);
  }

  setTimeout(() => {
    button.classList.remove("correct", "incorrect");
    currentIndex++;
    loadMultipleChoiceQuestion();
  }, 1000);
}

function showResultDialog() {
  alert(
    `Herzlichen Glückwunsch! Sie haben ${correctAnswers} von ${vocabularyList.length} Vokabeln korrekt übersetzt.`
  );
  endTraining();
}

function endTraining() {
  document.getElementById("abortButton").classList.add("hidden");
  document.getElementById("settings").classList.remove("hidden");
  document.getElementById("flashcard-mode").classList.add("hidden");
  document.getElementById("multiple-choice-mode").classList.add("hidden");
  document.getElementById("fileselect").classList.remove("hidden");
}

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Prüfen, ob der AudioContext im "suspended" Zustand ist und ggf. auf "running" setzen
document.addEventListener("click", () => {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}, { once: true }); // Nur einmal ausführen

function playSound(frequency, duration) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.05);

  oscillator.start(audioContext.currentTime);
  gainNode.gain.setValueAtTime(1, audioContext.currentTime + duration - 0.1);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

  oscillator.stop(audioContext.currentTime + duration);
}

function playPositiveSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  // Klarere Frequenz und sanfte Sine-Welle
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(500, audioContext.currentTime); // Frequenz auf 500 Hz für Klarheit

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Schnellere, sanfte Ein- und Ausblendung für Klarheit
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.02); // Kürzere Einblendzeit
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2); // Kürzere Ausblendzeit

  // Start- und Stoppzeiten
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2); // Kurze Dauer für einen klaren, prägnanten Ton
}
