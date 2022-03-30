GAME_BG_AUDIO = "../rsc/audio/bg.mp3";
GAME_FLIP_AUDIO = "../rsc/audio/flip.mp3";
GAME_OVER = "../rsc/audio/game_over.wav";
WIN_SCORE = "../rsc/audio/win.mp3";
LOSE_SCORE = "../rsc/audio/lose.wav";

var audioPlayerInstance = null;
var effectAudioVolume = 1;
var bgAudioCtx = new Audio(GAME_BG_AUDIO);
var flipAudioCtx = new Audio(GAME_FLIP_AUDIO);
var gmAudioCtx = new Audio(GAME_OVER);
var winAudioCtx = new Audio(WIN_SCORE);
var loseAudioCtx = new Audio(LOSE_SCORE);

function initGameBgAudio() {
    // loop play
    bgAudioCtx.onended = function () {bgAudioCtx.play();}
    bgAudioCtx.play();
}

function playFlipAudio() {
    flipAudioCtx.volume = effectAudioVolume;
    flipAudioCtx.play();
}

function gameOverAudio() {
    gmAudioCtx.volume = effectAudioVolume;
    gmAudioCtx.play();
}

function addScoreAudio() {
    winAudioCtx.volume = effectAudioVolume;
    winAudioCtx.play();
}

function loseScoreAudio() {
    loseAudioCtx.volume = effectAudioVolume;
    loseAudioCtx.play();
}

document.getElementById("effectAudio").onchange = function () {
    let val = this.value;
    document.getElementById("effectAudioVal").innerText = val;
    effectAudioVolume = val / 100;
}

document.getElementById("music").onchange = function () {
    let val = this.value;
    document.getElementById("musicVal").innerText = val;
    bgAudioCtx.volume = val / 100;
}

document.getElementById("back").onclick = function () {
    document.getElementById("setBox").style.display = "none";
}

document.getElementById("set").onclick = function () {
    document.getElementById("setBox").style.display = "block";
}
