const playPanel = document.getElementById("playPanel");
const infoPanel = document.getElementById("infoPanel");
const countPanel = document.getElementById("countPanel");
const scorePanel = document.getElementById("scorePanel");
const startButton = document.getElementById("startButton");
const romasNode = document.getElementById("roma");
const japanese = document.getElementById("japanese");
const gradeOption = document.getElementById("gradeOption");
const aa = document.getElementById("aa");
const gameTime = 120;
const tmpCanvas = document.createElement("canvas");
const mode = document.getElementById("mode");
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
let japaneseVoices = [];
guide = false;
let keyboardAudio, correctAudio, incorrectAudio, endAudio;
loadAudios();
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
const layout104 = {
  "default": [
    "q w e r t y u i o p",
    "a s d f g h j k l ;",
    "z x c v b n m , .",
    "🌏 無変換 {space} 変換",
  ],
  "shift": [
    "Q W E R T Y U I O P",
    'A S D F G H J K L :',
    "Z X C V B N M < >",
    "🌏 無変換 {space} 変換",
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
  "🌏": "🇯🇵",
};
const simpleKeyboard = new SimpleKeyboard.default({
  layout: layout109,
  display: keyboardDisplay,
  onInit: function () {
    document.getElementById("keyboard").classList.add("d-none");
  },
  onKeyPress: function (input) {
    switch (input) {
      case "{space}":
        return typeEventKey(" ");
      case "無変換":
        return typeEventKey("NoConvert");
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
    aa.parentNode.style.height = calcAAOuterSize() + "px";
    resizeFontSize(aa);
  } else {
    virtualKeyboardOn.classList.add("d-none");
    virtualKeyboardOff.classList.remove("d-none");
    document.getElementById("keyboard").classList.add("d-none");
    document.getElementById("guideSwitch").checked = false;
    guide = false;
    aa.parentNode.style.height = calcAAOuterSize() + "px";
    resizeFontSize(aa);
  }
}

function toggleGuide() {
  const virtualKeyboardOn = document.getElementById("virtualKeyboardOn");
  const virtualKeyboardOff = document.getElementById("virtualKeyboardOff");
  if (this.checked) {
    virtualKeyboardOn.classList.remove("d-none");
    virtualKeyboardOff.classList.add("d-none");
    document.getElementById("keyboard").classList.remove("d-none");
    aa.parentNode.style.height = calcAAOuterSize() + "px";
    resizeFontSize(aa);
    guide = true;
  } else {
    virtualKeyboardOn.classList.add("d-none");
    virtualKeyboardOff.classList.remove("d-none");
    document.getElementById("keyboard").classList.add("d-none");
    aa.parentNode.style.height = calcAAOuterSize() + "px";
    resizeFontSize(aa);
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

function playAudio(audioBuffer, volume) {
  const audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  if (volume) {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    audioSource.connect(gainNode);
    audioSource.start();
  } else {
    audioSource.connect(audioContext.destination);
    audioSource.start();
  }
}

function unlockAudio() {
  audioContext.resume();
}

function loadAudio(url) {
  return fetch(url)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => {
      return new Promise((resolve, reject) => {
        audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
          resolve(audioBuffer);
        }, (err) => {
          reject(err);
        });
      });
    });
}

function loadAudios() {
  promises = [
    loadAudio("mp3/keyboard.mp3"),
    loadAudio("mp3/correct.mp3"),
    loadAudio("mp3/cat.mp3"),
    loadAudio("mp3/end.mp3"),
  ];
  Promise.all(promises).then((audioBuffers) => {
    keyboardAudio = audioBuffers[0];
    correctAudio = audioBuffers[1];
    incorrectAudio = audioBuffers[2];
    endAudio = audioBuffers[3];
  });
}

function loadVoices() {
  // https://stackoverflow.com/questions/21513706/
  const allVoicesObtained = new Promise(function (resolve) {
    let voices = speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      speechSynthesis.addEventListener("voiceschanged", function () {
        voices = speechSynthesis.getVoices();
        resolve(voices);
      });
    }
  });
  allVoicesObtained.then((voices) => {
    japaneseVoices = voices.filter((voice) => voice.lang == "ja-JP");
  });
}
loadVoices();

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
    fetch("data/" + grade + ".tsv").then(function (response) {
      return response.text();
    }).then(function (tsv) {
      problems = tsv.split("\n").slice(0, -1).map((line) => {
        const [kanji, yomiStr, romaStr] = line.split("\t");
        const yomis = yomiStr.split("|");
        const romas = romaStr.split("|");
        return { kanji: kanji, yomis: yomis, romas: romas };
      });
    }).catch(function (err) {
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
  } else if (key == "h" && p == "s" && word == "y" && aiueo.includes(n)) {
    // sya, syu, sye, syo --> sha, shu, she, sho
    fixTypeStyle(currNode, key);
  } else if (key == "y" && p == "s" && word == "h" && aiueo.includes(n)) {
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
  } else if (key == "y" && word == "j" && auo.includes(n)) { // ja, ju, jo --> jya, jyu, jyo
    fixTypeStyle(currNode, key);
    fixTypeStyle(currNode, n);
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
  currNode.classList.remove("d-none");
  if (sound) {
    playAudio(keyboardAudio);
  }
  currNode.style.color = "silver";
  typeIndex += 1;
  normalCount += 1;
}

function nextProblem() {
  playAudio(correctAudio);
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
  typeEventKey(event.key);
}

function typeEventKey(key) {
  if (key.match(/^[^0-9]$/)) {
    const romaNodes = [...romasNode.children];
    const states = romaNodes.map((romaNode, i) => {
      let sound = false;
      if (i == 0) {
        sound = true;
      }
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
      playAudio(incorrectAudio, 0.3);
      errorCount += 1;
    } else {
      // ローマ字がヒットしていない候補は削除
      states.forEach((state, i) => {
        if (!state) {
          romaNodes[i].dataset.nohit = true;
        }
      });
      romaNodes.forEach((romaNode) => {
        if (romaNode.dataset.nohit) {
          romaNode.remove();
        }
      });
    }
    japanese.textContent = romaNodes[0].dataset.yomi;
    if (typeIndex == romaNodes[0].childNodes.length) { // tsu --> tu などの変換後に終端に到着したとき
      nextProblem();
    } else {
      showGuide(romaNodes[0].childNodes[typeIndex]);
    }
  } else {
    switch (key) {
      case "NonConvert": {
        const text = romasNode.children[0].textContent;
        loopVoice(text, 1);
        japanese.textContent = romasNode.children[0].dataset.yomi;
        japanese.style.visibility = "visible";
        [...romasNode.children[0].children].forEach((span) => {
          span.classList.remove("d-none");
        });
        downTime(5);
        break;
      }
      case "Shift":
      case "CapsLock":
        if (guide) {
          simpleKeyboard.setOptions({ layoutName: "shift" });
          showGuide(romaNode.childNodes[typeIndex]);
        }
        break;
      case "Escape":
      case "Esc":
        replay();
        break;
    }
  }
}

function replay() {
  clearInterval(typeTimer);
  const romaNodes = [...romasNode.children];
  romaNodes.forEach((romaNode) => {
    removeGuide(romaNode.childNodes[typeIndex]);
  });
  document.removeEventListener("keydown", typeEvent);
  initTime();
  loadProblems();
  countdown();
  typeIndex = normalCount = errorCount = solveCount = 0;
  countPanel.classList.remove("d-none");
  scorePanel.classList.add("d-none");
}

function calcAAOuterSize() {
  let height = document.documentElement.clientHeight;
  height -= document.getElementById("header").offsetHeight;
  height -= document.getElementById("infoPanel").offsetHeight;
  height -= document.getElementById("typePanel").offsetHeight;
  height -= document.getElementById("keyboard").offsetHeight;
  return height;
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
  const nodeHeight = calcAAOuterSize();
  const nodeWidth = infoPanel.clientWidth;
  const nodeRect = [nodeWidth, nodeHeight];
  const textRect = getTextRect(node.innerText, fontSize, font, lineHeight);
  const paddingRect = getPaddingRect(style);

  // https://stackoverflow.com/questions/46653569/
  // Safariで正確な算出ができないので誤差ぶんだけ縮小化 (10%)
  const rowFontSize = fontSize * (nodeRect[0] - paddingRect[0]) / textRect[0] *
    0.90;
  const colFontSize = fontSize * (nodeRect[1] - paddingRect[1]) / textRect[1] *
    0.90;
  if (colFontSize < rowFontSize) {
    node.style.fontSize = colFontSize + "px";
  } else {
    node.style.fontSize = rowFontSize + "px";
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
    romaNode.dataset.yomi = problem.yomis[i];
    romasNode.appendChild(romaNode);
    for (let j = 0; j < roma.length; j++) {
      const span = document.createElement("span");
      if (i != 0 || mode.textContent != "EASY") {
        span.classList.add("d-none");
      }
      span.textContent = roma[j];
      romaNode.appendChild(span);
    }
  });
  resizeFontSize(aa);
  showGuide(romasNode.children[0].childNodes[0]);
}

function countdown() {
  typeIndex = normalCount = errorCount = solveCount = 0;
  document.getElementById("guideSwitch").disabled = true;
  document.getElementById("virtualKeyboard").disabled = true;
  infoPanel.classList.add("d-none");
  playPanel.classList.add("d-none");
  countPanel.classList.remove("d-none");
  scorePanel.classList.add("d-none");
  counter.innerText = 3;
  const timer = setInterval(function () {
    const counter = document.getElementById("counter");
    const colors = ["skyblue", "greenyellow", "violet", "tomato"];
    if (parseInt(counter.innerText) > 1) {
      const t = parseInt(counter.innerText) - 1;
      counter.style.backgroundColor = colors[t];
      counter.innerText = t;
    } else {
      clearInterval(timer);
      document.getElementById("guideSwitch").disabled = false;
      document.getElementById("virtualKeyboard").disabled = false;
      infoPanel.classList.remove("d-none");
      playPanel.classList.remove("d-none");
      countPanel.classList.add("d-none");
      scorePanel.classList.add("d-none");
      typable();
      startTypeTimer();
      if (localStorage.getItem("bgm") == 1) {
        bgm.play();
      }
      document.addEventListener("keydown", typeEvent);
    }
  }, 1000);
}

function startKeyEvent(event) {
  if (event.key == " " || event.key == "Spacebar") {
    document.removeEventListener("keydown", startKeyEvent);
    replay();
  }
}

function startTypeTimer() {
  const timeNode = document.getElementById("time");
  typeTimer = setInterval(function () {
    const arr = timeNode.innerText.split("秒 /");
    const t = parseInt(arr[0]);
    if (t > 0) {
      timeNode.innerText = (t - 1) + "秒 /" + arr[1];
    } else {
      clearInterval(typeTimer);
      bgm.pause();
      playAudio(endAudio);
      scoring();
    }
  }, 1000);
}

function downTime(n) {
  const timeNode = document.getElementById("time");
  const arr = timeNode.innerText.split("秒 /");
  const t = parseInt(arr[0]);
  const downedTime = t - n;
  if (downedTime < 0) {
    timeNode.innerText = "0秒 /" + arr[1];
  } else {
    timeNode.innerText = downedTime + "秒 /" + arr[1];
  }
}

function initTime() {
  document.getElementById("time").innerText = gameTime + "秒 / " + gameTime +
    "秒";
}

gradeOption.addEventListener("change", function () {
  initTime();
  clearInterval(typeTimer);
});

function scoring() {
  infoPanel.classList.remove("d-none");
  playPanel.classList.add("d-none");
  countPanel.classList.add("d-none");
  scorePanel.classList.remove("d-none");
  document.removeEventListener("keydown", typeEvent);
  const grade = gradeOption.options[gradeOption.selectedIndex].value;
  const typeSpeed = (normalCount / gameTime).toFixed(2);
  document.getElementById("totalType").innerText = normalCount + errorCount;
  document.getElementById("typeSpeed").innerText = typeSpeed;
  document.getElementById("errorType").innerText = errorCount;
  document.getElementById("twitter").href =
    "https://twitter.com/intent/tweet?text=漢字タイピングの" + grade +
    "をプレイしたよ! (速度: " + typeSpeed + "回/秒) " +
    "&url=https%3a%2f%2fmarmooo.github.com/hageda%2f&hashtags=漢字タイピング";
  document.addEventListener("keydown", startKeyEvent);
}

function changeMode() {
  if (this.textContent == "EASY") {
    this.textContent = "HARD";
  } else {
    this.textContent = "EASY";
  }
}

aa.parentNode.style.height = calcAAOuterSize() + "px";
resizeFontSize(aa);

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("toggleBGM").onclick = toggleBGM;
document.getElementById("virtualKeyboard").onclick = toggleKeyboard;
window.addEventListener("resize", function () {
  aa.parentNode.style.height = calcAAOuterSize() + "px";
  resizeFontSize(aa);
});
mode.onclick = changeMode;
document.getElementById("guideSwitch").onchange = toggleGuide;
startButton.addEventListener("click", replay);
document.addEventListener("keyup", upKeyEvent);
document.addEventListener("keydown", startKeyEvent);
document.addEventListener("click", unlockAudio, {
  once: true,
  useCapture: true,
});
