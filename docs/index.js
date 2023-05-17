const remSize=parseInt(getComputedStyle(document.documentElement).fontSize),gamePanel=document.getElementById("gamePanel"),infoPanel=document.getElementById("infoPanel"),countPanel=document.getElementById("countPanel"),scorePanel=document.getElementById("scorePanel"),startButton=document.getElementById("startButton"),romasNode=document.getElementById("roma"),japanese=document.getElementById("japanese"),gradeOption=document.getElementById("gradeOption"),aa=document.getElementById("aa"),tmpCanvas=document.createElement("canvas"),mode=document.getElementById("mode"),gameTime=120;let playing,countdowning,typeTimer;const bgm=new Audio("mp3/bgm.mp3");bgm.volume=.3,bgm.loop=!0;let typeIndex=0,errorCount=0,normalCount=0,solveCount=0,problems=[];guide=!1;const layout104={default:["q w e r t y u i o p","a s d f g h j k l ;","z x c v b n m , .","🌏 {altLeft} {space} {altRight}"],shift:["Q W E R T Y U I O P","A S D F G H J K L :","Z X C V B N M < >","🌏 {altLeft} {space} {altRight}"]},layout109={default:["q w e r t y u i o p","a s d f g h j k l ;","z x c v b n m , .","🌏 無変換 {space} 変換"],shift:["Q W E R T Y U I O P","A S D F G H J K L +","Z X C V B N M < >","🌏 無変換 {space} 変換"]},keyboardDisplay={"{space}":" ","{altLeft}":"Alt","{altRight}":"Alt","🌏":navigator.language=="ja"?"🇯🇵":"🇺🇸"},simpleKeyboard=new SimpleKeyboard.default({layout:navigator.language=="ja"?layout109:layout104,display:keyboardDisplay,onInit:()=>{document.getElementById("keyboard").classList.add("d-none")},onKeyPress:a=>{switch(a){case"{space}":return typeEventKey(" ");case"無変換":return typeEventKey("NonConvert");case"変換":return typeEventKey("Convert");case"🌏":{simpleKeyboard.options.layout==layout109?(keyboardDisplay["🌏"]="🇺🇸",simpleKeyboard.setOptions({layout:layout104,display:keyboardDisplay})):(keyboardDisplay["🌏"]="🇯🇵",simpleKeyboard.setOptions({layout:layout109,display:keyboardDisplay}));break}default:return typeEventKey(a)}}}),audioContext=new AudioContext,audioBufferCache={};loadAudio("end","mp3/end.mp3"),loadAudio("keyboard","mp3/keyboard.mp3"),loadAudio("correct","mp3/correct.mp3"),loadAudio("incorrect","mp3/cat.mp3");let japaneseVoices=[];loadVoices(),loadConfig();function loadConfig(){localStorage.getItem("darkMode")==1&&(document.documentElement.dataset.theme="dark"),localStorage.getItem("bgm")!=1&&(document.getElementById("bgmOn").classList.add("d-none"),document.getElementById("bgmOff").classList.remove("d-none"))}function toggleBGM(){localStorage.getItem("bgm")==1?(document.getElementById("bgmOn").classList.add("d-none"),document.getElementById("bgmOff").classList.remove("d-none"),localStorage.setItem("bgm",0),bgm.pause()):(document.getElementById("bgmOn").classList.remove("d-none"),document.getElementById("bgmOff").classList.add("d-none"),localStorage.setItem("bgm",1),bgm.play())}function toggleKeyboard(){const a=document.getElementById("virtualKeyboardOn"),b=document.getElementById("virtualKeyboardOff");a.classList.contains("d-none")?(a.classList.remove("d-none"),b.classList.add("d-none"),document.getElementById("keyboard").classList.remove("d-none"),resizeFontSize(aa)):(a.classList.add("d-none"),b.classList.remove("d-none"),document.getElementById("keyboard").classList.add("d-none"),document.getElementById("guideSwitch").checked=!1,guide=!1,resizeFontSize(aa))}function toggleGuide(a){a.target.checked?guide=!0:guide=!1}function toggleDarkMode(){localStorage.getItem("darkMode")==1?(localStorage.setItem("darkMode",0),delete document.documentElement.dataset.theme):(localStorage.setItem("darkMode",1),document.documentElement.dataset.theme="dark")}async function playAudio(b,c){const d=await loadAudio(b,audioBufferCache[b]),a=audioContext.createBufferSource();if(a.buffer=d,c){const b=audioContext.createGain();b.gain.value=c,b.connect(audioContext.destination),a.connect(b),a.start()}else a.connect(audioContext.destination),a.start()}async function loadAudio(a,c){if(audioBufferCache[a])return audioBufferCache[a];const d=await fetch(c),e=await d.arrayBuffer(),b=await audioContext.decodeAudioData(e);return audioBufferCache[a]=b,b}function unlockAudio(){audioContext.resume()}function loadVoices(){const a=new Promise(b=>{let a=speechSynthesis.getVoices();if(a.length!==0)b(a);else{let c=!1;speechSynthesis.addEventListener("voiceschanged",()=>{c=!0,a=speechSynthesis.getVoices(),b(a)}),setTimeout(()=>{c||document.getElementById("noTTS").classList.remove("d-none")},1e3)}});a.then(a=>{japaneseVoices=a.filter(a=>a.lang=="ja-JP")})}function loopVoice(b,c){speechSynthesis.cancel();const a=new SpeechSynthesisUtterance(b);a.voice=japaneseVoices[Math.floor(Math.random()*japaneseVoices.length)],a.lang="ja-JP";for(let b=0;b<c;b++)speechSynthesis.speak(a)}function loadProblems(){const a=gradeOption.selectedIndex+1;a>0&&fetch("data/"+a+".tsv").then(a=>a.text()).then(a=>{problems=a.trimEnd().split("\n").map(a=>{const[b,c,d]=a.split("	"),e=c.split("|"),f=d.split("|");return{kanji:b,yomis:e,romas:f}})}).catch(a=>{console.error(a)})}function fixTypeStyle(a,b,c){removeGuide(a),a.textContent=b,typeNormal(a,c)}function appendWord(a,c){removeGuide(a);const b=document.createElement("span");b.textContent=c,a.parentNode.insertBefore(b,a.nextSibling)}function checkTypeStyle(c,d,a,m){const i=["i","e"],g=["a","u","o"],h=["a","u","e","o"],l=["a","i","u","e","o"],j=m.childNodes,f=j[typeIndex+1];let b;f&&(b=f.textContent);let e;typeIndex!=0&&(e=j[typeIndex-1].textContent);let k;if(j[typeIndex+2]&&(k=j[typeIndex+2].textContent),a=="k"&&d=="c"&&g.includes(b))fixTypeStyle(c,a);else if(a=="c"&&d=="k"&&g.includes(b))fixTypeStyle(c,a);else if(a=="h"&&e=="s"&&d=="i")fixTypeStyle(c,a),appendWord(c,"i");else if(a=="i"&&e=="s"&&d=="h"&&b=="i")fixTypeStyle(c,a),b&&f.remove();else if(a=="c"&&d=="s"&&i.includes(b))fixTypeStyle(c,a);else if(a=="s"&&d=="c"&&i.includes(b))fixTypeStyle(c,a);else if(a=="j"&&d=="z"&&b=="i")fixTypeStyle(c,a);else if(a=="z"&&d=="j"&&b=="i")fixTypeStyle(c,a);else if(a=="c"&&d=="t"&&b=="i")fixTypeStyle(c,a),appendWord(c,"h");else if(a=="t"&&d=="c"&&b=="h"&&k=="i")fixTypeStyle(c,a),b&&f.remove();else if(a=="s"&&e=="t"&&d=="u")fixTypeStyle(c,a),appendWord(c,"u");else if(a=="u"&&e=="t"&&d=="s"&&b=="u")fixTypeStyle(c,a),b&&f.remove();else if(a=="f"&&d=="h"&&b=="u")fixTypeStyle(c,a);else if(a=="h"&&d=="f"&&b=="u")fixTypeStyle(c,a);else if(a=="x"&&d=="n"&&b=="n")fixTypeStyle(c,a);else if(a=="n"&&d=="x"&&b=="n")fixTypeStyle(c,a);else if(a=="l"&&d=="x"&&l.includes(b))fixTypeStyle(c,a);else if(a=="x"&&d=="l"&&l.includes(b))fixTypeStyle(c,a);else if(a=="x"&&d=="l"&&b=="y"&&g.includes(b))fixTypeStyle(c,a);else if(a=="h"&&e=="w"&&i.includes(d))fixTypeStyle(c,a),appendWord(c,d);else if(i.includes(a)&&e=="w"&&d=="h"&&i.includes(b))fixTypeStyle(c,a),b&&f.remove();else if(a=="h"&&e=="s"&&d=="y"&&h.includes(b))fixTypeStyle(c,a);else if(a=="y"&&e=="s"&&d=="h"&&h.includes(b))fixTypeStyle(c,a);else if(a=="j"&&d=="z"&&b=="y"&&g.includes(k))fixTypeStyle(c,a),b&&f.remove();else if(a=="z"&&d=="j"&&g.includes(b))fixTypeStyle(c,a),appendWord(c,"y");else if(a=="j"&&d=="z"&&b=="y")fixTypeStyle(c,a);else if(g.includes(a)&&e=="j"&&d=="y"&&g.includes(b))fixTypeStyle(c,a),b&&f.remove();else if(a=="y"&&e=="j"&&g.includes(d))fixTypeStyle(c,a),appendWord(c,b);else if(a=="z"&&d=="j"&&b=="y")fixTypeStyle(c,a);else if(a=="t"&&d=="c"&&b=="y")fixTypeStyle(c,a);else if(a=="c"&&d=="t"&&b=="y")fixTypeStyle(c,a);else if(a=="t"&&d=="c"&&b=="h"&&h.includes(b))fixTypeStyle(c,a),f.textContent="y";else if(a=="h"&&e=="c"&&d=="y"&&h.includes(b))fixTypeStyle(c,a),f.textContent=b;else if(a=="y"&&e=="c"&&d=="h"&&h.includes(b))fixTypeStyle(c,a),f.textContent=b;else return!1;return!0}function typeNormal(a,b){a.style.visibility="visible",a.style.color="silver",b&&(playAudio("keyboard"),typeIndex+=1,normalCount+=1)}function nextProblem(){playAudio("correct"),typeIndex=0,solveCount+=1,typable()}function removeGuide(b){const c=b.previousSiblingElement;if(c){let a=c.textContent;a==" "&&(a="{space}");const b=simpleKeyboard.getButtonElement(a);b.classList.remove("bg-info")}let a=b.textContent;a==" "&&(a="{space}");const d=simpleKeyboard.getButtonElement(a);if(d)d.classList.remove("bg-info"),simpleKeyboard.setOptions({layoutName:"default"});else{const a=simpleKeyboard.getButtonElement("{shift}");a.classList.remove("bg-info")}}function showGuide(a){if(guide){let b=a.textContent;b==" "&&(b="{space}");const c=simpleKeyboard.getButtonElement(b);if(c)c.classList.add("bg-info");else{const a=simpleKeyboard.getButtonElement("{shift}");a.classList.add("bg-info")}}}function upKeyEvent(a){switch(a.key){case"Shift":case"CapsLock":guide&&(simpleKeyboard.setOptions({layoutName:"default"}),showGuide(romaNode.childNodes[typeIndex]))}}function typeEvent(a){(a.key==" "||a.key=="Spacebar")&&a.preventDefault(),typeEventKey(a.key)}function typeEventKey(a){switch(a){case"NonConvert":{const a=romasNode.children[0].textContent;loopVoice(a,1),japanese.textContent=romasNode.children[0].dataset.yomi,japanese.style.visibility="visible",[...romasNode.children[0].children].forEach(a=>{a.style.visibility="visible"}),downTime(5);return}case"Shift":case"CapsLock":guide&&(simpleKeyboard.setOptions({layoutName:"shift"}),showGuide(romaNode.childNodes[typeIndex]));return;case"Escape":replay();return;case" ":if(!playing){replay();return}}if(/^[^0-9]$/.test(a)){const b=[...romasNode.children],c=!1,d=b.map(e=>{const d=e.childNodes[typeIndex];return a==d.textContent?(typeNormal(d,c),removeGuide(d),!0):checkTypeStyle(d,d.textContent,a,b[0],c)});if(d.every(a=>!a))playAudio("incorrect",.3),errorCount+=1;else{playAudio("keyboard"),typeIndex+=1,normalCount+=1;let a=!0;b.forEach((b,c)=>{d[c]?a?(b.classList.remove("d-none"),japanese.textContent=b.dataset.yomi,a=!1):b.classList.add("d-none"):b.remove()})}typeIndex==b[0].childNodes.length?nextProblem():showGuide(b[0].childNodes[typeIndex])}}function replay(){clearInterval(typeTimer);const a=[...romasNode.children];a.forEach(a=>{removeGuide(a.childNodes[typeIndex])}),initTime(),loadProblems(),countdown(),countPanel.classList.remove("d-none"),scorePanel.classList.add("d-none")}function resizeFontSize(a){function n(b,c){const a=tmpCanvas.getContext("2d");a.font=c;const d=a.measureText(b);return d.width}function i(g,c,d,e){const b=g.split("\n"),f=c+"px "+d;let a=0;for(let c=0;c<b.length;c++){const d=n(b[c],f);a<d&&(a=d)}return[a,c*b.length*e]}function m(a){const b=parseFloat(a.paddingLeft)+parseFloat(a.paddingRight),c=parseFloat(a.paddingTop)+parseFloat(a.paddingBottom);return[b,c]}const b=getComputedStyle(a),l=b.fontFamily,c=parseFloat(b.fontSize),o=parseFloat(b.lineHeight)/c,j=document.getElementById("aaOuter").offsetHeight,k=infoPanel.clientWidth,h=[k,j],f=i(a.textContent,c,l,o),g=m(b),d=c*(h[0]-g[0])/f[0]*.9,e=c*(h[1]-g[1])/f[1]*.9;e<d?e<remSize?a.style.fontSize=remSize+"px":a.style.fontSize=e+"px":d<remSize?a.style.fontSize=remSize+"px":a.style.fontSize=d+"px"}function getRandomInt(a,b){return a=Math.ceil(a),b=Math.floor(b),Math.floor(Math.random()*(b-a))+a}function typable(){const a=problems[getRandomInt(0,problems.length)],b=a.yomis[0];for(japanese.textContent=b,mode.textContent=="EASY"?(japanese.style.visibility="visible",loopVoice(b,1)):japanese.style.visibility="hidden",aa.textContent=a.kanji;romasNode.firstChild;)romasNode.removeChild(romasNode.firstChild);a.romas.forEach((c,d)=>{const b=document.createElement("span");d!=0&&b.classList.add("d-none"),b.dataset.yomi=a.yomis[d],romasNode.appendChild(b);for(let a=0;a<c.length;a++){const d=document.createElement("span");mode.textContent!="EASY"&&(d.style.visibility="hidden"),d.textContent=c[a],b.appendChild(d)}}),resizeFontSize(aa),showGuide(romasNode.children[0].childNodes[0])}function countdown(){if(countdowning)return;countdowning=!0,typeIndex=normalCount=errorCount=solveCount=0,document.getElementById("guideSwitch").disabled=!0,document.getElementById("virtualKeyboard").disabled=!0,gamePanel.classList.add("d-none"),infoPanel.classList.add("d-none"),countPanel.classList.remove("d-none"),counter.textContent=3;const a=setInterval(()=>{const b=document.getElementById("counter"),c=["skyblue","greenyellow","violet","tomato"];if(parseInt(b.textContent)>1){const a=parseInt(b.textContent)-1;b.style.backgroundColor=c[a],b.textContent=a}else countdowning=!1,playing=!0,clearInterval(a),document.getElementById("guideSwitch").disabled=!1,document.getElementById("virtualKeyboard").disabled=!1,gamePanel.classList.remove("d-none"),countPanel.classList.add("d-none"),infoPanel.classList.remove("d-none"),scorePanel.classList.add("d-none"),resizeFontSize(aa),window.scrollTo({top:document.getElementById("typePanel").getBoundingClientRect().top,behavior:"auto"}),typable(),startTypeTimer(),localStorage.getItem("bgm")==1&&bgm.play(),document.addEventListener("keydown",typeEvent)},1e3)}function startTypeTimer(){const a=document.getElementById("time");typeTimer=setInterval(()=>{const b=parseInt(a.textContent);b>0?a.textContent=b-1:(clearInterval(typeTimer),bgm.pause(),playAudio("end"),scoring())},1e3)}function downTime(c){const a=document.getElementById("time"),d=parseInt(a.textContent),b=d-c;b<0?a.textContent=0:a.textContent=b}function initTime(){document.getElementById("time").textContent=gameTime}gradeOption.addEventListener("change",()=>{initTime(),clearInterval(typeTimer)});function scoring(){playing=!1,infoPanel.classList.remove("d-none"),gamePanel.classList.add("d-none"),countPanel.classList.add("d-none"),scorePanel.classList.remove("d-none");const b=gradeOption.options[gradeOption.selectedIndex].value,a=(normalCount/gameTime).toFixed(2);document.getElementById("totalType").textContent=normalCount+errorCount,document.getElementById("typeSpeed").textContent=a,document.getElementById("errorType").textContent=errorCount,document.getElementById("twitter").href="https://twitter.com/intent/tweet?text=漢字タイピングの"+b+"をプレイしたよ! (速度: "+a+"回/秒) "+"&url=https%3a%2f%2fmarmooo.github.com/kanji-typing/%2f&hashtags=漢字タイピング"}function changeMode(a){a.target.textContent=="EASY"?a.target.textContent="HARD":a.target.textContent="EASY"}resizeFontSize(aa),document.getElementById("toggleDarkMode").onclick=toggleDarkMode,document.getElementById("toggleBGM").onclick=toggleBGM,document.getElementById("virtualKeyboard").onclick=toggleKeyboard,window.addEventListener("resize",()=>{resizeFontSize(aa)}),mode.onclick=changeMode,document.getElementById("guideSwitch").onchange=toggleGuide,startButton.addEventListener("click",replay),document.addEventListener("keyup",upKeyEvent),document.addEventListener("keydown",typeEvent),document.addEventListener("click",unlockAudio,{once:!0,useCapture:!0})