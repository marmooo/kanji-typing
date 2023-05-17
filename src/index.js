const remSize = parseInt(getComputedStyle(document.documentElement).fontSize);
const gamePanel = document.getElementById("gamePanel");
const infoPanel = document.getElementById("infoPanel");
const countPanel = document.getElementById("countPanel");
const scorePanel = document.getElementById("scorePanel");
const startButton = document.getElementById("startButton");
const romasNode = document.getElementById("roma");
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
let typeIndex = 0;
let errorCount = 0;
let normalCount = 0;
let solveCount = 0;
let problems = [];
guide = false;
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
  "🌏": (navigator.language == "ja") ? "🇯🇵" : "🇺🇸",
};
const simpleKeyboard = new SimpleKeyboard.default({
  layout: (navigator.language == "ja") ? layout109 : layout104,
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
        if (simpleKeyboard.options.layout == layout109) {
          keyboardDisplay["🌏"] = "🇺🇸";
          simpleKeyboard.setOptions({
            layout: layout104,
            display: keyboardDisplay,
          });
        } else {
          keyboardDisplay["🌏"] = "🇯🇵";
          simpleKeyboard.setOptions({
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
const audioContext = new AudioContext();
const audioBufferCache = {};
loadAudio("end", "mp3/end.mp3");
loadAudio("keyboard", "mp3/keyboard.mp3");
loadAudio("correct", "mp3/correct.mp3");
loadAudio("incorrect", "mp3/cat.mp3");
let japaneseVoices = [];
loadVoices();
loadConfig();

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.dataset.theme = "dark";
  }
  if (localStorage.getItem("bgm") != 1) {
    document.getElementById("bgmOn").classList.add("d-none");
    document.getElementById("bgmOff").classList.remove("d-none");
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
  } else {
    guide = false;
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    delete document.documentElement.dataset.theme;
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.dataset.theme = "dark";
  }
}

async function playAudio(name, volume) {
  const audioBuffer = await loadAudio(name, audioBufferCache[name]);
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  if (volume) {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    sourceNode.connect(gainNode);
    sourceNode.start();
  } else {
    sourceNode.connect(audioContext.destination);
    sourceNode.start();
  }
}

async function loadAudio(name, url) {
  if (audioBufferCache[name]) return audioBufferCache[name];
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  audioBufferCache[name] = audioBuffer;
  return audioBuffer;
}

function unlockAudio() {
  audioContext.resume();
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

function loopVoice(text, n) {
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.voice = japaneseVoices[Math.floor(Math.random() * japaneseVoices.length)];
  msg.lang = "ja-JP";
  for (let i = 0; i < n; i++) {
    speechSynthesis.speak(msg);
  }
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

function fixTypeStyle(currNode, word, sound) {
  removeGuide(currNode);
  currNode.textContent = word;
  typeNormal(currNode, sound);
}

function appendWord(currNode, word) {
  removeGuide(currNode);
  const span = document.createElement("span");
  span.textContent = word;
  currNode.parentNode.insertBefore(span, currNode.nextSibling);
}

// http://typingx0.net/key_l.html
function checkTypeStyle(currNode, word, key, romaNode) {
  const ie = ["i", "e"];
  const auo = ["a", "u", "o"];
  const aueo = ["a", "u", "e", "o"];
  const aiueo = ["a", "i", "u", "e", "o"];
  const nodes = romaNode.childNodes;
  const nextNode = nodes[typeIndex + 1];
  let n;
  if (nextNode) { // 最後の文字を tu --> tsu に変換しようとした時 (nextNode = null)
    n = nextNode.textContent;
  }
  let p;
  if (typeIndex != 0) {
    p = nodes[typeIndex - 1].textContent;
  }
  let nn;
  if (nodes[typeIndex + 2]) {
    nn = nodes[typeIndex + 2].textContent;
  }
  if (key == "k" && word == "c" && auo.includes(n)) { // ca, cu, co --< ka, ku, ko
    fixTypeStyle(currNode, key);
  } else if (key == "c" && word == "k" && auo.includes(n)) { // ka, ku, ko --< ca, cu, co
    fixTypeStyle(currNode, key);
  } else if (key == "h" && p == "s" && word == "i") { // si --> shi
    fixTypeStyle(currNode, key);
    appendWord(currNode, "i");
  } else if (key == "i" && p == "s" && word == "h" && n == "i") { // shi --> si
    fixTypeStyle(currNode, key);
    if (n) nextNode.remove();
  } else if (key == "c" && word == "s" && ie.includes(n)) { // si, se --> ci, ce
    fixTypeStyle(currNode, key);
  } else if (key == "s" && word == "c" && ie.includes(n)) { // ci, ce --> si, se
    fixTypeStyle(currNode, key);
  } else if (key == "j" && word == "z" && n == "i") { // zi --> ji
    fixTypeStyle(currNode, key);
  } else if (key == "z" && word == "j" && n == "i") { // ji --> zi
    fixTypeStyle(currNode, key);
  } else if (key == "c" && word == "t" && n == "i") { // ti --> chi
    fixTypeStyle(currNode, key);
    appendWord(currNode, "h");
  } else if (key == "t" && word == "c" && n == "h" && nn == "i") { // chi --> ti
    fixTypeStyle(currNode, key);
    if (n) nextNode.remove();
  } else if (key == "s" && p == "t" && word == "u") { // tu --> tsu
    fixTypeStyle(currNode, key);
    appendWord(currNode, "u");
  } else if (key == "u" && p == "t" && word == "s" && n == "u") { // tsu --> tu
    fixTypeStyle(currNode, key);
    if (n) nextNode.remove();
  } else if (key == "f" && word == "h" && n == "u") { // hu --> fu
    fixTypeStyle(currNode, key);
  } else if (key == "h" && word == "f" && n == "u") { // fu --> hu
    fixTypeStyle(currNode, key);
  } else if (key == "x" && word == "n" && n == "n") { // nn --> xn
    fixTypeStyle(currNode, key);
  } else if (key == "n" && word == "x" && n == "n") { // xn --> nn
    fixTypeStyle(currNode, key);
  } else if (key == "l" && word == "x" && aiueo.includes(n)) { // xa, xi, xu, xe, xo --> la, li, lu, le, lo
    fixTypeStyle(currNode, key);
  } else if (key == "x" && word == "l" && aiueo.includes(n)) { // la, li, lu, le, lo --> xa, xi, xu, xe, xo
    fixTypeStyle(currNode, key);
  } else if (key == "x" && word == "l" && n == "y" && auo.includes(n)) { // TODO: lyi, lye
    // lya, lyu, lyo --> xya, xyu, xyo
    fixTypeStyle(currNode, key);
  } else if (key == "h" && p == "w" && ie.includes(word)) { // wi, we --> whi, whe
    fixTypeStyle(currNode, key);
    appendWord(currNode, word);
  } else if (ie.includes(key) && p == "w" && word == "h" && ie.includes(n)) { // whi, whe --> wi, we
    fixTypeStyle(currNode, key);
    if (n) nextNode.remove();
  } else if (key == "h" && p == "s" && word == "y" && aueo.includes(n)) {
    // sya, syu, sye, syo --> sha, shu, she, sho
    fixTypeStyle(currNode, key);
  } else if (key == "y" && p == "s" && word == "h" && aueo.includes(n)) {
    // sha, shu, she, sho --> sya, syu, sye, syo
    fixTypeStyle(currNode, key);
  } else if (key == "j" && word == "z" && n == "y" && auo.includes(nn)) { // zya, zyu, zyo --> ja, ju, jo
    fixTypeStyle(currNode, key);
    if (n) nextNode.remove();
  } else if (key == "z" && word == "j" && auo.includes(n)) { // ja, ju, jo --> zya, zyu, zyo
    fixTypeStyle(currNode, key);
    appendWord(currNode, "y");
  } else if (key == "j" && word == "z" && n == "y") { // zya, zyi, zyu, zye, zyo --> jya, jyi, jyu, jye, jyo
    fixTypeStyle(currNode, key);
  } else if (auo.includes(key) && p == "j" && word == "y" && auo.includes(n)) {
    // jya, jyu, jyo --> ja, ju, jo
    fixTypeStyle(currNode, key);
    if (n) nextNode.remove();
  } else if (key == "y" && p == "j" && auo.includes(word)) { // ja, ju, jo --> jya, jyu, jyo
    fixTypeStyle(currNode, key);
    appendWord(currNode, n);
  } else if (key == "z" && word == "j" && n == "y") { // jya, jyi, jyu, jye, jyo --> zya, zyi, zyu, zye, zyo
    fixTypeStyle(currNode, key);
  } else if (key == "t" && word == "c" && n == "y") { // cya, cyi, cyu, cye, cyo --> tya, tyi, tyu, tye, tyo
    fixTypeStyle(currNode, key);
  } else if (key == "c" && word == "t" && n == "y") {
    // tya, tyi, tyu, tye, tyo --> cya, cyi, cyu, cye, cyo
    // tya, tyu, tye, tyo --> cha, chu, che, cho (chi の問題があるので cyi を採用)
    fixTypeStyle(currNode, key);
  } else if (key == "t" && word == "c" && n == "h" && aueo.includes(n)) {
    // cha, chu, che, cho --> tya, tyu, tye, tyo
    fixTypeStyle(currNode, key);
    nextNode.textContent = "y";
  } else if (key == "h" && p == "c" && word == "y" && aueo.includes(n)) {
    // cya, cyu, cye, cyo --> cha, chu, che, cho
    fixTypeStyle(currNode, key);
    nextNode.textContent = n;
  } else if (key == "y" && p == "c" && word == "h" && aueo.includes(n)) {
    // cha, chu, che, cho --> cya, cyu, cye, cyo
    fixTypeStyle(currNode, key);
    nextNode.textContent = n;
  } else {
    return false;
  }
  return true;
}

function typeNormal(currNode, sound) {
  currNode.style.visibility = "visible";
  currNode.style.color = "silver";
  if (sound) {
    playAudio("keyboard");
    typeIndex += 1;
    normalCount += 1;
  }
}

function nextProblem() {
  playAudio("correct");
  typeIndex = 0;
  solveCount += 1;
  typable();
}

function removeGuide(currNode) {
  const prevNode = currNode.previousSiblingElement;
  if (prevNode) {
    let key = prevNode.textContent;
    if (key == " ") key = "{space}";
    const button = simpleKeyboard.getButtonElement(key);
    button.classList.remove("bg-info");
  }
  let key = currNode.textContent;
  if (key == " ") key = "{space}";
  const button = simpleKeyboard.getButtonElement(key);
  if (button) {
    button.classList.remove("bg-info");
    simpleKeyboard.setOptions({ layoutName: "default" });
  } else {
    const shift = simpleKeyboard.getButtonElement("{shift}");
    shift.classList.remove("bg-info");
  }
}

function showGuide(currNode) {
  if (guide) {
    let key = currNode.textContent;
    if (key == " ") key = "{space}";
    const button = simpleKeyboard.getButtonElement(key);
    if (button) {
      button.classList.add("bg-info");
    } else {
      const shift = simpleKeyboard.getButtonElement("{shift}");
      shift.classList.add("bg-info");
    }
  }
}

function upKeyEvent(event) {
  switch (event.key) {
    case "Shift":
    case "CapsLock":
      if (guide) {
        simpleKeyboard.setOptions({ layoutName: "default" });
        showGuide(romaNode.childNodes[typeIndex]);
      }
  }
}

function typeEvent(event) {
  if (event.key == " " || event.key == "Spacebar") {
    event.preventDefault(); // ScrollLock
  }
  typeEventKey(event.key);
}

function typeEventKey(key) {
  switch (key) {
    case "NonConvert": {
      const text = romasNode.children[0].textContent;
      loopVoice(text, 1);
      japanese.textContent = romasNode.children[0].dataset.yomi;
      japanese.style.visibility = "visible";
      [...romasNode.children[0].children].forEach((span) => {
        span.style.visibility = "visible";
      });
      downTime(5);
      return;
    }
    case "Shift":
    case "CapsLock":
      if (guide) {
        simpleKeyboard.setOptions({ layoutName: "shift" });
        showGuide(romaNode.childNodes[typeIndex]);
      }
      return;
    case "Escape":
      replay();
      return;
    case " ":
      if (!playing) {
        replay();
        return;
      }
  }
  if (/^[^0-9]$/.test(key)) {
    const romaNodes = [...romasNode.children];
    const sound = false;
    const states = romaNodes.map((romaNode) => {
      const currNode = romaNode.childNodes[typeIndex];
      if (key == currNode.textContent) {
        typeNormal(currNode, sound);
        removeGuide(currNode);
        return true;
      } else {
        return checkTypeStyle(
          currNode,
          currNode.textContent,
          key,
          romaNodes[0],
          sound,
        );
      }
    });
    // ローマ字の候補が全部外れたときはエラー
    if (states.every((state) => !state)) {
      playAudio("incorrect", 0.3);
      errorCount += 1;
    } else {
      playAudio("keyboard");
      typeIndex += 1;
      normalCount += 1;
      let firstHit = true;
      romaNodes.forEach((romaNode, i) => {
        if (!states[i]) {
          // ローマ字がヒットしていない候補は削除
          romaNode.remove();
        } else if (firstHit) {
          // ヒットしたら残し、先頭だけ見えるようにする
          romaNode.classList.remove("d-none");
          japanese.textContent = romaNode.dataset.yomi;
          firstHit = false;
        } else {
          romaNode.classList.add("d-none");
        }
      });
    }
    if (typeIndex == romaNodes[0].childNodes.length) { // tsu --> tu などの変換後に終端に到着したとき
      nextProblem();
    } else {
      showGuide(romaNodes[0].childNodes[typeIndex]);
    }
  }
}

function replay() {
  clearInterval(typeTimer);
  const romaNodes = [...romasNode.children];
  romaNodes.forEach((romaNode) => {
    removeGuide(romaNode.childNodes[typeIndex]);
  });
  initTime();
  loadProblems();
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
  const nodeHeight = document.getElementById("aaOuter").offsetHeight;
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

function typable() {
  const problem = problems[getRandomInt(0, problems.length)];
  const yomi = problem.yomis[0];
  japanese.textContent = yomi;
  if (mode.textContent == "EASY") {
    japanese.style.visibility = "visible";
    loopVoice(yomi, 1);
  } else {
    japanese.style.visibility = "hidden";
  }
  aa.textContent = problem.kanji;
  while (romasNode.firstChild) {
    romasNode.removeChild(romasNode.firstChild);
  }
  problem.romas.forEach((roma, i) => {
    const romaNode = document.createElement("span");
    if (i != 0) romaNode.classList.add("d-none");
    romaNode.dataset.yomi = problem.yomis[i];
    romasNode.appendChild(romaNode);
    for (let j = 0; j < roma.length; j++) {
      const span = document.createElement("span");
      if (mode.textContent != "EASY") {
        span.style.visibility = "hidden";
      }
      span.textContent = roma[j];
      romaNode.appendChild(span);
    }
  });
  resizeFontSize(aa);
  showGuide(romasNode.children[0].childNodes[0]);
}

function countdown() {
  if (countdowning) return;
  countdowning = true;
  typeIndex =
    normalCount =
    errorCount =
    solveCount =
      0;
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
      clearInterval(timer);
      document.getElementById("guideSwitch").disabled = false;
      document.getElementById("virtualKeyboard").disabled = false;
      gamePanel.classList.remove("d-none");
      countPanel.classList.add("d-none");
      infoPanel.classList.remove("d-none");
      scorePanel.classList.add("d-none");
      resizeFontSize(aa);
      window.scrollTo({
        top: document.getElementById("typePanel").getBoundingClientRect().top,
        behavior: "auto",
      });
      typable();
      startTypeTimer();
      if (localStorage.getItem("bgm") == 1) {
        bgm.play();
      }
      document.addEventListener("keydown", typeEvent);
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
  if (event.target.textContent == "EASY") {
    event.target.textContent = "HARD";
  } else {
    event.target.textContent = "EASY";
  }
}

resizeFontSize(aa);

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("toggleBGM").onclick = toggleBGM;
document.getElementById("virtualKeyboard").onclick = toggleKeyboard;
window.addEventListener("resize", () => {
  resizeFontSize(aa);
});
mode.onclick = changeMode;
document.getElementById("guideSwitch").onchange = toggleGuide;
startButton.addEventListener("click", replay);
document.addEventListener("keyup", upKeyEvent);
document.addEventListener("keydown", typeEvent);
document.addEventListener("click", unlockAudio, {
  once: true,
  useCapture: true,
});
