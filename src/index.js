import simpleKeyboard from "https://cdn.jsdelivr.net/npm/simple-keyboard@3.7.77/+esm";
import { Romaji } from "https://cdn.jsdelivr.net/npm/@marmooo/romaji/+esm";
import { createWorker } from "https://cdn.jsdelivr.net/npm/emoji-particle@0.0.4/+esm";

const remSize = parseInt(getComputedStyle(document.documentElement).fontSize);
const gamePanel = document.getElementById("gamePanel");
const infoPanel = document.getElementById("infoPanel");
const countPanel = document.getElementById("countPanel");
const scorePanel = document.getElementById("scorePanel");
const startButton = document.getElementById("startButton");
const romaNode = document.getElementById("roma");
const japanese = document.getElementById("japanese");
const gradeOption = document.getElementById("gradeOption");
const aa = document.getElementById("aa");
const tmpCanvas = document.createElement("canvas");
const mode = document.getElementById("mode");
const gameTime = 120;
let playing;
let countdowning;
let typeTimer;
// https://dova-s.jp/bgm/play1754.html
const bgm = new Audio("mp3/bgm.mp3");
bgm.volume = 0.3;
bgm.loop = true;
let consecutiveWins = 0;
let errorCount = 0;
let normalCount = 0;
let solveCount = 0;
let problems = [];
let problem;
let guide = false;
const layout104 = {
  "default": [
    "q w e r t y u i o p",
    "a s d f g h j k l ;",
    "z x c v b n m , .",
    "🌏 {altLeft} {space} {altRight}",
  ],
  "shift": [
    "Q W E R T Y U I O P",
    "A S D F G H J K L :",
    "Z X C V B N M < >",
    "🌏 {altLeft} {space} {altRight}",
  ],
};
const layout109 = {
  "default": [
    "q w e r t y u i o p",
    "a s d f g h j k l ;",
    "z x c v b n m , .",
    "🌏 無変換 {space} 変換",
  ],
  "shift": [
    "Q W E R T Y U I O P",
    "A S D F G H J K L +",
    "Z X C V B N M < >",
    "🌏 無変換 {space} 変換",
  ],
};
const keyboardDisplay = {
  "{space}": " ",
  "{altLeft}": "Alt",
  "{altRight}": "Alt",
  "🌏": (navigator.language.startsWith("ja")) ? "🇯🇵" : "🇺🇸",
};
const keyboard = new simpleKeyboard.default({
  layout: (navigator.language.startsWith("ja")) ? layout109 : layout104,
  display: keyboardDisplay,
  onInit: () => {
    document.getElementById("keyboard").classList.add("d-none");
  },
  onKeyPress: (input) => {
    switch (input) {
      case "{space}":
        return typeEventKey(" ");
      case "無変換":
        return typeEventKey("NonConvert");
      case "変換":
        return typeEventKey("Convert");
      case "🌏": {
        if (keyboard.options.layout == layout109) {
          keyboardDisplay["🌏"] = "🇺🇸";
          keyboard.setOptions({
            layout: layout104,
            display: keyboardDisplay,
          });
        } else {
          keyboardDisplay["🌏"] = "🇯🇵";
          keyboard.setOptions({
            layout: layout109,
            display: keyboardDisplay,
          });
        }
        break;
      }
      default:
        return typeEventKey(input);
    }
  },
});
const emojiParticle = initEmojiParticle();
const maxParticleCount = 10;
let enableParticle = true;
let audioContext;
const audioBufferCache = {};
let japaneseVoices = [];
loadVoices();
loadConfig();

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
  if (localStorage.getItem("bgm") != 1) {
    document.getElementById("bgmOn").classList.add("d-none");
    document.getElementById("bgmOff").classList.remove("d-none");
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function toggleBGM() {
  if (localStorage.getItem("bgm") == 1) {
    document.getElementById("bgmOn").classList.add("d-none");
    document.getElementById("bgmOff").classList.remove("d-none");
    localStorage.setItem("bgm", 0);
    bgm.pause();
  } else {
    document.getElementById("bgmOn").classList.remove("d-none");
    document.getElementById("bgmOff").classList.add("d-none");
    localStorage.setItem("bgm", 1);
    bgm.play();
  }
}

function toggleKeyboard() {
  const virtualKeyboardOn = document.getElementById("virtualKeyboardOn");
  const virtualKeyboardOff = document.getElementById("virtualKeyboardOff");
  if (virtualKeyboardOn.classList.contains("d-none")) {
    virtualKeyboardOn.classList.remove("d-none");
    virtualKeyboardOff.classList.add("d-none");
    document.getElementById("keyboard").classList.remove("d-none");
    resizeFontSize(aa);
  } else {
    virtualKeyboardOn.classList.add("d-none");
    virtualKeyboardOff.classList.remove("d-none");
    document.getElementById("keyboard").classList.add("d-none");
    document.getElementById("guideSwitch").checked = false;
    guide = false;
    resizeFontSize(aa);
  }
}

function toggleGuide(event) {
  if (event.target.checked) {
    guide = true;
    if (problem) {
      const nextKey =
        problem.romajis[0].currentNode.children.keys().next().value;
      showGuide(nextKey);
    }
  } else {
    guide = false;
    if (problem) removePrevGuide(problem);
  }
}

function toggleParticle() {
  enableParticle = !enableParticle;
  document.getElementById("toggleParticle").classList.toggle("off");
}

function createAudioContext() {
  if (AudioContext) {
    return new AudioContext();
  } else {
    console.error("Web Audio API is not supported in this browser");
    return null;
  }
}

function unlockAudio() {
  if (audioContext) {
    audioContext.resume();
  } else {
    audioContext = createAudioContext();
    loadAudio("end", "mp3/end.mp3");
    loadAudio("keyboard", "mp3/keyboard.mp3");
    loadAudio("correct", "mp3/correct.mp3");
    loadAudio("incorrect", "mp3/cat.mp3");
  }
  document.removeEventListener("click", unlockAudio);
  document.removeEventListener("keydown", unlockAudio);
}

async function loadAudio(name, url) {
  if (!audioContext) return;
  if (audioBufferCache[name]) return audioBufferCache[name];
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioBufferCache[name] = audioBuffer;
    return audioBuffer;
  } catch (error) {
    console.error(`Loading audio ${name} error:`, error);
    throw error;
  }
}

function playAudio(name, volume) {
  if (!audioContext) return;
  const audioBuffer = audioBufferCache[name];
  if (!audioBuffer) {
    console.error(`Audio ${name} is not found in cache`);
    return;
  }
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  const gainNode = audioContext.createGain();
  if (volume) gainNode.gain.value = volume;
  gainNode.connect(audioContext.destination);
  sourceNode.connect(gainNode);
  sourceNode.start();
}

function loadVoices() {
  // https://stackoverflow.com/questions/21513706/
  const allVoicesObtained = new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      let supported = false;
      speechSynthesis.addEventListener("voiceschanged", () => {
        supported = true;
        voices = speechSynthesis.getVoices();
        resolve(voices);
      });
      setTimeout(() => {
        if (!supported) {
          document.getElementById("noTTS").classList.remove("d-none");
        }
      }, 1000);
    }
  });
  allVoicesObtained.then((voices) => {
    japaneseVoices = voices.filter((voice) => voice.lang == "ja-JP");
  });
}

function speak(text) {
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.voice = japaneseVoices[Math.floor(Math.random() * japaneseVoices.length)];
  msg.lang = "ja-JP";
  speechSynthesis.speak(msg);
}

function loadProblems() {
  const grade = gradeOption.selectedIndex + 1;
  if (grade > 0) {
    fetch("data/" + grade + ".tsv")
      .then((response) => response.text())
      .then((tsv) => {
        problems = tsv.trimEnd().split("\n").map((line) => {
          const [kanji, yomiStr, romaStr] = line.split("\t");
          const yomis = yomiStr.split("|");
          const romas = romaStr.split("|");
          return { kanji: kanji, yomis: yomis, romas: romas };
        });
      }).catch((err) => {
        console.error(err);
      });
  }
}

function initEmojiParticle() {
  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "fixed",
    pointerEvents: "none",
    top: "0px",
    left: "0px",
  });
  canvas.width = document.documentElement.clientWidth;
  canvas.height = document.documentElement.clientHeight;
  document.body.prepend(canvas);

  const offscreen = canvas.transferControlToOffscreen();
  const worker = createWorker();
  worker.postMessage({ type: "init", canvas: offscreen }, [offscreen]);

  globalThis.addEventListener("resize", () => {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    worker.postMessage({ type: "resize", width, height });
  });
  return { canvas, offscreen, worker };
}

function nextProblem() {
  if (enableParticle) {
    for (let i = 0; i < Math.min(consecutiveWins, maxParticleCount); i++) {
      emojiParticle.worker.postMessage({
        type: "spawn",
        options: {
          particleType: "popcorn",
          originX: Math.random() * emojiParticle.canvas.width,
          originY: Math.random() * emojiParticle.canvas.height,
        },
      });
    }
  }
  playAudio("correct", 0.3);
  solveCount += 1;
  typable();
}

function removePrevGuide(problem) {
  if (!problem) return;
  const prevNode = problem.romajis[0].currentNode;
  if (!prevNode) return;
  for (const key of prevNode.children.keys()) {
    removeGuide(key);
  }
}

function removeGuide(key) {
  if (key == " ") key = "{space}";
  const button = keyboard.getButtonElement(key);
  if (button) {
    button.classList.remove("guide");
    keyboard.setOptions({ layoutName: "default" });
  } else {
    const shift = keyboard.getButtonElement("{shift}");
    if (shift) shift.classList.remove("guide");
  }
}

function showGuide(key) {
  if (key == " ") key = "{space}";
  const button = keyboard.getButtonElement(key);
  if (button) {
    button.classList.add("guide");
  } else {
    const shift = keyboard.getButtonElement("{shift}");
    if (shift) shift.classList.add("guide");
  }
}

function typeEvent(event) {
  switch (event.code) {
    case "Space":
      event.preventDefault();
      // falls through
    default:
      return typeEventKey(event.key);
  }
}

function typeEventKey(key) {
  switch (key) {
    case "NonConvert": {
      const text = problem.yomis[0];
      speak(text);
      japanese.textContent = problem.yomis[0];
      changeVisibility("visible");
      downTime(5);
      return;
    }
    case "Escape":
      startGame();
      return;
    case " ":
      if (!playing) {
        startGame();
        return;
      }
  }
  if (key.length == 1) {
    if (!problem) return;
    const prevNode = problem.romajis[0].currentNode;
    const states = problem.romajis.map((romaji) => romaji.input(key));
    if (states.some((state) => state)) {
      playAudio("keyboard");
      normalCount += 1;
      problem.romajis = problem.romajis.filter((_, i) => states[i]);
      problem.romas = problem.romas.filter((_, i) => states[i]);
      problem.yomis = problem.yomis.filter((_, i) => states[i]);
      const romaji = problem.romajis[0];
      const remainedRomaji = romaji.remainedRomaji;
      romaNode.children[0].textContent += key;
      romaNode.children[1].textContent = remainedRomaji[0];
      romaNode.children[2].textContent = remainedRomaji.slice(1);
      for (const key of prevNode.children.keys()) {
        removeGuide(key);
      }
      if (romaji.isEnd()) {
        consecutiveWins += 1;
        nextProblem();
      } else if (guide) {
        showGuide(remainedRomaji[0]);
      }
    } else {
      playAudio("incorrect", 0.3);
      errorCount += 1;
      consecutiveWins = 0;
    }
  }
}

function startGame() {
  clearInterval(typeTimer);
  initTime();
  countdown();
  countPanel.classList.remove("d-none");
  scorePanel.classList.add("d-none");
}

function resizeFontSize(node) {
  // https://stackoverflow.com/questions/118241/
  function getTextWidth(text, font) {
    // re-use canvas object for better performance
    // const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const context = tmpCanvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
  }
  function getTextRect(text, fontSize, font, lineHeight) {
    const lines = text.split("\n");
    const fontConfig = fontSize + "px " + font;
    let maxWidth = 0;
    for (let i = 0; i < lines.length; i++) {
      const width = getTextWidth(lines[i], fontConfig);
      if (maxWidth < width) {
        maxWidth = width;
      }
    }
    return [maxWidth, fontSize * lines.length * lineHeight];
  }
  function getPaddingRect(style) {
    const width = parseFloat(style.paddingLeft) +
      parseFloat(style.paddingRight);
    const height = parseFloat(style.paddingTop) +
      parseFloat(style.paddingBottom);
    return [width, height];
  }
  const style = getComputedStyle(node);
  const font = style.fontFamily;
  const fontSize = parseFloat(style.fontSize);
  const lineHeight = parseFloat(style.lineHeight) / fontSize;
  const nodeHeight = globalThis.innerHeight - 320;
  const nodeWidth = infoPanel.clientWidth;
  const nodeRect = [nodeWidth, nodeHeight];
  const textRect = getTextRect(node.textContent, fontSize, font, lineHeight);
  const paddingRect = getPaddingRect(style);

  // https://stackoverflow.com/questions/46653569/
  // Safariで正確な算出ができないので誤差ぶんだけ縮小化 (10%)
  const rowFontSize = fontSize * (nodeRect[0] - paddingRect[0]) / textRect[0] *
    0.90;
  const colFontSize = fontSize * (nodeRect[1] - paddingRect[1]) / textRect[1] *
    0.90;
  if (colFontSize < rowFontSize) {
    if (colFontSize < remSize) {
      node.style.fontSize = remSize + "px";
    } else {
      node.style.fontSize = colFontSize + "px";
    }
  } else {
    if (rowFontSize < remSize) {
      node.style.fontSize = remSize + "px";
    } else {
      node.style.fontSize = rowFontSize + "px";
    }
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function changeVisibility(visibility) {
  const children = romaNode.children;
  children[1].style.visibility = visibility;
  children[2].style.visibility = visibility;
  japanese.style.visibility = visibility;
}

function typable() {
  const prevProblem = problem;
  problem = problems[getRandomInt(0, problems.length)];
  const yomi = problem.yomis[0];
  japanese.textContent = yomi;
  aa.textContent = problem.kanji;
  problem.romajis = problem.yomis.map((yomi) => new Romaji(yomi));
  const romaji = problem.romajis[0];
  const children = romaNode.children;
  children[0].textContent = romaji.inputedRomaji;
  children[1].textContent = romaji.remainedRomaji[0];
  children[2].textContent = romaji.remainedRomaji.slice(1);

  if (mode.textContent == "EASY") speak(yomi);
  const visibility = (mode.textContent == "EASY") ? "visible" : "hidden";
  changeVisibility(visibility);
  resizeFontSize(aa);
  if (guide) {
    removePrevGuide(prevProblem);
    showGuide(problem.romas[0][0]);
  }
}

function countdown() {
  if (countdowning) return;
  countdowning = true;
  const aaOuter = document.getElementById("aaOuter");
  const typePanel = document.getElementById("typePanel");
  const keyboardPanel = document.getElementById("keyboard");
  aaOuter.after(typePanel, keyboardPanel);
  speak("Ready"); // unlock

  if (localStorage.getItem("bgm") == 1) bgm.play();
  document.getElementById("guideSwitch").disabled = true;
  document.getElementById("virtualKeyboard").disabled = true;
  gamePanel.classList.add("d-none");
  infoPanel.classList.add("d-none");
  countPanel.classList.remove("d-none");
  counter.textContent = 3;
  const timer = setInterval(() => {
    const counter = document.getElementById("counter");
    const colors = ["skyblue", "greenyellow", "violet", "tomato"];
    if (parseInt(counter.textContent) > 1) {
      const t = parseInt(counter.textContent) - 1;
      counter.style.backgroundColor = colors[t];
      counter.textContent = t;
    } else {
      countdowning = false;
      playing = true;
      removePrevGuide(problem);
      normalCount = errorCount = solveCount = 0;
      consecutiveWins = 0;
      clearInterval(timer);
      document.getElementById("guideSwitch").disabled = false;
      document.getElementById("virtualKeyboard").disabled = false;
      gamePanel.classList.remove("d-none");
      countPanel.classList.add("d-none");
      infoPanel.classList.remove("d-none");
      scorePanel.classList.add("d-none");
      resizeFontSize(aa);
      globalThis.scrollTo({
        top: document.getElementById("aaOuter").getBoundingClientRect().top,
        behavior: "auto",
      });
      typable();
      startTypeTimer();
    }
  }, 1000);
}

function startTypeTimer() {
  const timeNode = document.getElementById("time");
  typeTimer = setInterval(() => {
    const t = parseInt(timeNode.textContent);
    if (t > 0) {
      timeNode.textContent = t - 1;
    } else {
      clearInterval(typeTimer);
      bgm.pause();
      playAudio("end");
      scoring();
    }
  }, 1000);
}

function downTime(n) {
  const timeNode = document.getElementById("time");
  const t = parseInt(timeNode.textContent);
  const downedTime = t - n;
  if (downedTime < 0) {
    timeNode.textContent = 0;
  } else {
    timeNode.textContent = downedTime;
  }
}

function initTime() {
  document.getElementById("time").textContent = gameTime;
}

gradeOption.addEventListener("change", () => {
  initTime();
  clearInterval(typeTimer);
});

function scoring() {
  playing = false;
  infoPanel.classList.remove("d-none");
  gamePanel.classList.add("d-none");
  countPanel.classList.add("d-none");
  scorePanel.classList.remove("d-none");
  const grade = gradeOption.options[gradeOption.selectedIndex].value;
  const typeSpeed = (normalCount / gameTime).toFixed(2);
  document.getElementById("totalType").textContent = normalCount + errorCount;
  document.getElementById("typeSpeed").textContent = typeSpeed;
  document.getElementById("errorType").textContent = errorCount;
  document.getElementById("twitter").href =
    "https://twitter.com/intent/tweet?text=漢字タイピングの" + grade +
    "をプレイしたよ! (速度: " + typeSpeed + "回/秒) " +
    "&url=https%3a%2f%2fmarmooo.github.com/kanji-typing/%2f&hashtags=漢字タイピング";
}

function changeMode(event) {
  normalCount = errorCount = solveCount = 0;
  document.getElementById("time").textContent = gameTime;
  if (event.target.textContent == "EASY") {
    event.target.textContent = "HARD";
  } else {
    event.target.textContent = "EASY";
  }
  const visibility = (mode.textContent == "EASY") ? "visible" : "hidden";
  changeVisibility(visibility);
}

resizeFontSize(aa);
loadProblems();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("toggleParticle").onclick = toggleParticle;
document.getElementById("toggleBGM").onclick = toggleBGM;
document.getElementById("gradeOption").onchange = loadProblems;
document.getElementById("virtualKeyboard").onclick = toggleKeyboard;
globalThis.addEventListener("resize", () => {
  resizeFontSize(aa);
});
mode.onclick = changeMode;
document.getElementById("guideSwitch").onchange = toggleGuide;
startButton.addEventListener("click", startGame);
document.addEventListener("keydown", typeEvent);
document.addEventListener("click", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });
