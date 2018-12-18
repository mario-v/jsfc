"use strict";


let fc = null;


let FCUse_FileReader;


window.addEventListener('load', FCSet, false);


function FCRomFileChange(e) {
	if(e.target.value != "") {
		let xhr = new XMLHttpRequest();
		xhr.onload = function() {
			if (this.readyState === this.DONE) {
				if(this.status == 200 || this.status == 304)
					FCRomChange(this.response);
			}
		}
		xhr.open("GET", e.target.value);
		xhr.responseType = "arraybuffer";
		xhr.send();
	}
}


function FCFileChange(e) {
	FCFileRead(e.target.files[0]);
}


let File = null;
function FCFileRead(file) {
	File = file;
	let reader = new FileReader();
	reader.onload = function (e) {
		FCRomChange(e.target.result);
	};
	reader.readAsArrayBuffer(file);
}


function FCMute() {
	if(fc.isSuspend()) {
		if(fc.Resume())
			document.querySelector("#mute").textContent = "MUTE";
	} else {
		if(fc.Suspend())
			document.querySelector("#mute").textContent = "PLAY";
	}
}


function FCStart() {
	if(fc.isRunning()) {
		if(fc.Pause())
			document.querySelector("#start").textContent = "START";
	} else {
		if(fc.Start())
			document.querySelector("#start").textContent = "PAUSE";
	}

}


function FCReset() {
	if(fc.Reset())
		document.querySelector("#start").textContent = "PAUSE";
	else
		document.querySelector("#start").textContent = "START";
}


function FCRomChange(changerom) {
	let rom;
	let u8array = new Uint8Array(changerom);
	rom = new Array();
	for(let i=0; i<u8array.length; i++)
		rom.push(u8array[i]);

	fc.Pause();
	document.querySelector("#start").textContent = "START";
	fc.SetRom(rom);
	if(fc.Init()) {
		if(File != null)
			document.querySelector("#rom_filename").innerHTML = File.name;
		FCStart();
	}
}


function FCSetUp() {
	fc = new FC();
	return fc.SetCanvas("#canvas0");
}


function FCSet() {
	if(!FCSetUp())
		return;

	FCUse_FileReader = typeof window.FileReader !== "undefined";
	if(FCUse_FileReader) {
		window.addEventListener("dragenter",
			function (e) {
				e.preventDefault();
			}, false);

		window.addEventListener("dragover",
			function (e) {
				e.preventDefault();
			}, false);

		window.addEventListener("drop",
			function (e) {
				e.preventDefault();
				FCFileRead(e.dataTransfer.files[0]);
			}, false);

		document.querySelector("#file").addEventListener("change", FCFileChange, false);

		document.querySelector("#romfile").addEventListener("change", FCRomFileChange, false);

		document.querySelector("#start").addEventListener("click", FCStart, false);
		document.querySelector("#reset").addEventListener("click", FCReset, false);
		document.querySelector("#mute").addEventListener("click", FCMute, false);
		document.querySelector("#volume").addEventListener("change", FCVolume, false);

		window.addEventListener("gamepadconnected", function(e) {
			if(e.gamepad.index == 0)
				document.querySelector("#pad0state").innerHTML = "GAME PAD 0: " + e.gamepad.id;
			if(e.gamepad.index == 1)
				document.querySelector("#pad1state").innerHTML = "GAMEPAD 1: " + e.gamepad.id;
		});

		window.addEventListener("gamepaddisconnected", function(e) {
			if(e.gamepad.index == 0)
				document.querySelector("#pad0state").innerHTML = "GAME PAD 0: ";
			if(e.gamepad.index == 1)
				document.querySelector("#pad1state").innerHTML = "GAME PAD 1: ";
		});
		document.querySelector("#pad0state").innerHTML = "GAME PAD 0: ";
		document.querySelector("#pad1state").innerHTML = "GAME PAD 1: ";

		document.querySelector("#microphone").addEventListener("click", FCMicrophone, false);
		document.querySelector("#microphoneout").addEventListener("click", FCMicrophoneOut, false);
		document.querySelector("#microphonevolume").addEventListener("change", FCMicrophoneVolume, false);

		document.querySelector("#fullscreen").addEventListener("click",  FullScreen, false);
	}
}


function FCMicrophoneVolume() {
	fc.WebAudioVolume(document.querySelector("#microphonevolume").value);
}


function FCVolume() {
	fc.WebAudioVolume(document.querySelector("#volume").value);
}


function FCMicrophone() {
	if (document.querySelector("#microphone").checked)
		fc.MicrophoneStart();
	else
		fc.MicrophoneStop();
}

function FCMicrophoneOut() {
	fc.MicrophoneSpeaker(document.querySelector("#microphoneout").checked);
}


function FullScreen() {
	let canvas = document.querySelector("#canvas0");
	if(canvas.requestFullScreen)
		canvas.requestFullScreen();
	else if(canvas.webkitRequestFullScreen)
		canvas.webkitRequestFullScreen();
	else if(canvas.mozRequestFullScreen)
		canvas.mozRequestFullScreen();
}
