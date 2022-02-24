GAME_BG_AUDIO = "../rsc/audio/bg.mp3";
GAME_FLIP_AUDIO = "../rsc/audio/flip.mp3";

var audioPlayerInstance = null;
var bgAudioCtx;
var flipAudioVolume = 1;
function initGameBgAudio() {
    bgAudioCtx = new Audio(GAME_BG_AUDIO);
    // loop play
    bgAudioCtx.onended = function () {
        bgAudioCtx.play();
    }
    bgAudioCtx.play();
}
initGameBgAudio();

function playFlipAudio() {
    var flipAudioCtx = new Audio(GAME_FLIP_AUDIO);
    flipAudioCtx.volume = flipAudioVolume;
    flipAudioCtx.play();
}
document.getElementById("effectAudio").onchange = function () {
    let val = this.value;
    document.getElementById("effectAudioVal").innerText = val;
    flipAudioVolume = val / 100;
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
