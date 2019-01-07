"use strict";

function FC() {
	this.Use_requestAnimationFrame = typeof window.requestAnimationFrame !== "undefined";
	this.Use_GetGamepads = typeof navigator.getGamepads !== "undefined";

	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	this.Use_AudioContext = typeof window.AudioContext !== "undefined";
	this.TimerID = null;


/* **** FC CPU **** */
	this.CycleTable = [
	 7, 6, 2, 8, 3, 3, 5, 5, 3, 2, 2, 2, 4, 4, 6, 6, //0x00
	 2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 6, 7, //0x10
	 6, 6, 2, 8, 3, 3, 5, 5, 4, 2, 2, 2, 4, 4, 6, 6, //0x20
	 2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 6, 7, //0x30
	 6, 6, 2, 8, 3, 3, 5, 5, 3, 2, 2, 2, 3, 4, 6, 6, //0x40
	 2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 6, 7, //0x50
	 6, 6, 2, 8, 3, 3, 5, 5, 4, 2, 2, 2, 5, 4, 6, 6, //0x60
	 2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 6, 7, //0x70
	 2, 6, 2, 6, 3, 3, 3, 3, 2, 2, 2, 2, 4, 4, 4, 4, //0x80
	 2, 6, 2, 6, 4, 4, 4, 4, 2, 4, 2, 5, 5, 4, 5, 5, //0x90
	 2, 6, 2, 6, 3, 3, 3, 3, 2, 2, 2, 2, 4, 4, 4, 4, //0xA0
	 2, 5, 2, 5, 4, 4, 4, 4, 2, 4, 2, 4, 4, 4, 4, 4, //0xB0
	 2, 6, 2, 8, 3, 3, 5, 5, 2, 2, 2, 2, 4, 4, 6, 6, //0xC0
	 2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7, //0xD0
	 2, 6, 3, 8, 3, 3, 5, 5, 2, 2, 2, 2, 4, 4, 6, 6, //0xE0
	 2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7];//0xF0

	this.MainClock = 1789773;

	this.A = 0;
	this.X = 0;
	this.Y = 0;
	this.S = 0;
	this.P = 0;
	this.PC = 0;

	this.toNMI = false;
	this.toIRQ = 0x00;
	this.CPUClock = 0;

	//this.HalfCarry = false;

	this.ZNCacheTable = new Array(256);
	this.ZNCacheTable[0] = 0x02;
	for(let i=1; i<256; i++)
		this.ZNCacheTable[i] = i & 0x80;

	this.ZNCacheTableCMP = new Array(512);
	for(let i=0; i<256; i++) {
		this.ZNCacheTableCMP[i] = this.ZNCacheTable[i] | 0x01;
		this.ZNCacheTableCMP[i + 256] = this.ZNCacheTable[i];
	}


/* **** FC PPU **** */
	this.ScrollRegisterFlag = false;
	this.PPUAddressRegisterFlag = false;
	this.HScrollTmp = 0;
	this.PPUAddress = 0;
	this.PPUAddressBuffer = 0;
	this.PPUChrAreaWrite = false;

	this.Palette = null;
	this.SpriteLineBuffer = null;
	this.PPUReadBuffer = 0;

	this.PaletteTable = [
	[0x7C, 0x7C, 0x7C], [0x00, 0x00, 0xFC], [0x00, 0x00, 0xBC], [0x44, 0x28, 0xBC],
	[0x94, 0x00, 0x84], [0xA8, 0x00, 0x20], [0xA8, 0x10, 0x00], [0x88, 0x14, 0x00],
	[0x50, 0x30, 0x00], [0x00, 0x78, 0x00], [0x00, 0x68, 0x00], [0x00, 0x58, 0x00],
	[0x00, 0x40, 0x58], [0x00, 0x00, 0x00], [0x00, 0x00, 0x00], [0x00, 0x00, 0x00],
	[0xBC, 0xBC, 0xBC], [0x00, 0x78, 0xF8], [0x00, 0x58, 0xF8], [0x68, 0x44, 0xFC],
	[0xD8, 0x00, 0xCC], [0xE4, 0x00, 0x58], [0xF8, 0x38, 0x00], [0xE4, 0x5C, 0x10],
	[0xAC, 0x7C, 0x00], [0x00, 0xB8, 0x00], [0x00, 0xA8, 0x00], [0x00, 0xA8, 0x44],
	[0x00, 0x88, 0x88], [0x00, 0x00, 0x00], [0x00, 0x00, 0x00], [0x00, 0x00, 0x00],
	[0xF8, 0xF8, 0xF8], [0x3C, 0xBC, 0xFC], [0x68, 0x88, 0xFC], [0x98, 0x78, 0xF8],
	[0xF8, 0x78, 0xF8], [0xF8, 0x58, 0x98], [0xF8, 0x78, 0x58], [0xFC, 0xA0, 0x44],
	[0xF8, 0xB8, 0x00], [0xB8, 0xF8, 0x18], [0x58, 0xD8, 0x54], [0x58, 0xF8, 0x98],
	[0x00, 0xE8, 0xD8], [0x78, 0x78, 0x78], [0x00, 0x00, 0x00], [0x00, 0x00, 0x00],
	[0xFC, 0xFC, 0xFC], [0xA4, 0xE4, 0xFC], [0xB8, 0xB8, 0xF8], [0xD8, 0xB8, 0xF8],
	[0xF8, 0xB8, 0xF8], [0xF8, 0xA4, 0xC0], [0xF0, 0xD0, 0xB0], [0xFC, 0xE0, 0xA8],
	[0xF8, 0xD8, 0x78], [0xD8, 0xF8, 0x78], [0xB8, 0xF8, 0xB8], [0xB8, 0xF8, 0xD8],
	[0x00, 0xFC, 0xFC], [0xF8, 0xD8, 0xF8], [0x00, 0x00, 0x00], [0x00, 0x00, 0x00]];

	this.PaletteTablesWeight = [
	[1.000, 1.000, 1.000], [1.239, 0.915, 0.743], [0.794, 1.086, 0.882], [1.019, 0.980, 0.653],
	[0.905, 1.026, 1.277], [1.023, 0.908, 0.979], [0.741, 0.987, 1.001], [0.750, 0.750, 0.750]];

	this.PaletteTables = new Array(2);
	this.PaletteTables[0] = new Array(8);
	this.PaletteTables[1] = new Array(8);
	for(let i=0; i<8; i++) {
		this.PaletteTables[0][i] = new Array(64);
		this.PaletteTables[1][i] = new Array(64);
		for(let j=0; j<64; j++) {
			this.PaletteTables[0][i][j] = new Array(3);
			this.PaletteTables[1][i][j] = new Array(3);
			for(let k=0; k<3; k++) {
				this.PaletteTables[0][i][j][k] = (this.PaletteTable[j][k] * this.PaletteTablesWeight[i][k]) | 0;
				if(this.PaletteTables[0][i][j][k] > 0xFF)
					this.PaletteTables[0][i][j][k] = 0xFF;

				this.PaletteTables[1][i][j][k] = (this.PaletteTable[j & 0x30][k] * this.PaletteTablesWeight[i][k]) | 0;
				if(this.PaletteTables[1][i][j][k] > 0xFF)
					this.PaletteTables[1][i][j][k] = 0xFF;
			}
		}
	}

	this.BgLineBuffer = null;

	this.SPBitArray = new Array(256);
	for(let i=0; i<256; i++) {
		this.SPBitArray[i] = new Array(256);
		for(let j=0; j<256; j++) {
			this.SPBitArray[i][j] = new Array(8);
			for(let k=0; k<8; k++)
				this.SPBitArray[i][j][k] = (((i << k) & 0x80) >>> 7) | (((j << k) & 0x80) >>> 6);
		}
	}

	this.PPUAddrAttrTable = new Array(1024);
	this.PPUAddrAttrDataTable = new Array(1024);
	for(let i=0; i<1024; i++) {
		this.PPUAddrAttrTable[i]  = (((i & 0x0380) >> 4) | ((i & 0x001C) >> 2)) + 0x03C0;
		this.PPUAddrAttrDataTable[i] = new Array(256);
		let k = ((i & 0x0040) >> 4) | (i & 0x0002);
		for(let j=0; j<256; j++)
			this.PPUAddrAttrDataTable[i][j] = ((j << 2) >> k) & 0x0C;
	}

	this.PpuX = 0;
	this.PpuY = 0;

	this.Canvas = null;
	this.ctx = null;

	this.ImageData = null;
	this.DrawFlag = false;

	this.Sprite0Line = false;
	this.SpriteLimit = true;


/* **** FC Header **** */
	this.PrgRomPageCount = 0;
	this.ChrRomPageCount = 0;
	this.HMirror = false;
	this.VMirror = false;
	this.SramEnable = false;
	this.TrainerEnable = false;
	this.FourScreen = false;
	this.MapperNumber = -1;


/* **** FC Storage **** */
	this.RAM = new Array(0x800);

	this.INNERSRAM = new Array(0x2000);
	this.SRAM;

	this.VRAM = new Array(16);

	this.VRAMS = new Array(16);
	for(let i=0; i<16; i++)
		this.VRAMS[i] = new Array(0x0400);

	this.SPRITE_RAM = new Array(0x100);

	this.ROM = new Array(4);
	this.ROM0 = null;
	this.ROM1 = null;
	this.ROM2 = null;
	this.ROM3 = null;
	this.ROM_RAM = new Array(4);
	for(let i=0; i<4; i++)
		this.ROM_RAM[i] = new Array(0x2000);

	this.PRGROM_STATE = new Array(4);
	this.CHRROM_STATE = new Array(8);

	this.PRGROM_PAGES = null;
	this.CHRROM_PAGES = null;

	this.IO1 = new Array(8);
	this.IO2 = new Array(0x20);

	this.Rom = null;


/* **** FC JoyPad **** */
	this.JoyPadStrobe = false;
	this.JoyPadState = [0x00, 0x00];
	this.JoyPadBuffer = [0x00, 0x00];
	this.JoyPadKeyUpFunction = null;
	this.JoyPadKeyDownFunction = null;

	this.GamePadData = {};
	this.GamePadData["STANDARD PAD"] = [
		[{type:"B", index:1}, {type:"B", index:3}],// A
		[{type:"B", index:0}, {type:"B", index:2}],// B
		[{type:"B", index:8}],// SELECT
		[{type:"B", index:9}],// START
		[{type:"B", index:12}],// UP
		[{type:"B", index:13}],// DOWN
		[{type:"B", index:14}],// LEFT
		[{type:"B", index:15}]];// RIGHT

	this.GamePadData["UNKNOWN PAD"] = [
		[{type:"B", index:1}],// A
		[{type:"B", index:0}],// B
		[{type:"B", index:2}],// SELECT
		[{type:"B", index:3}],// START
		[{type:"A-", index:1}],// UP
		[{type:"A+", index:1}],// DOWN
		[{type:"A-", index:0}],// LEFT
		[{type:"A+", index:0}]];// RIGHT

	this.GamePadData["HORI PAD 3 TURBO (Vendor: 0f0d Product: 0009)"] = [// Chrome
		[{type:"B", index:2}, {type:"B", index:3}],// A
		[{type:"B", index:1}, {type:"B", index:0}],// B
		[{type:"B", index:8}],// SELECT
		[{type:"B", index:9}],// START
		[{type:"P", index:9}],// UP (POV)
		[],// DOWN (POV)
		[],// LEFT (POV)
		[]];// RIGHT (POV)

	this.GamePadData["0f0d-0009-HORI PAD 3 TURBO"] = [// Firefox
		[{type:"B", index:2}, {type:"B", index:3}],// A
		[{type:"B", index:1}, {type:"B", index:0}],// B
		[{type:"B", index:8}],// SELECT
		[{type:"B", index:9}],// START
		[{type:"AB", index:6}],// UP
		[{type:"AB", index:7}],// DOWN
		[{type:"AB", index:5}],// LEFT
		[{type:"AB", index:4}]];// RIGHT

	this.GamePadPovData = [0x10, 0x10|0x80, 0x80, 0x20|0x80, 0x20, 0x20|0x40, 0x40, 0x10|0x40];


/* **** FC APU **** */
	this.MicrophoneStream = null;
	this.isMicrophone = false;
	this.MicrophoneSource = null;
	this.MicrophoneJsNode = null;
	this.MicrophoneGainNode = null;
	this.MicrophoneOut = false;
	this.MicrophoneVolume = 0.5;
	this.MicrophoneLevel = 0.0;

	this.WaveOut = true;
	this.WaveProcessing = false;
	this.WaveDatas = new Array();
	this.WaveSampleRate = 24000;
	this.WaveFrameSequence = 0;
	this.WaveFrameSequenceCounter = 0;
	this.WaveVolume = 0.5;

	this.WaveCh1LengthCounter = 0;
	this.WaveCh1Envelope = 0;
	this.WaveCh1EnvelopeCounter = 0;
	this.WaveCh1Sweep = 0;
	this.WaveCh1Frequency = 0;
	this.WaveCh1Counter = 0;
	this.WaveCh1WaveCounter = 0;

	this.WaveCh2LengthCounter = 0;
	this.WaveCh2Envelope = 0;
	this.WaveCh2EnvelopeCounter = 0;
	this.WaveCh2Sweep = 0;
	this.WaveCh2Frequency = 0;
	this.WaveCh2Counter = 0;
	this.WaveCh2WaveCounter = 0;

	this.WaveCh3LengthCounter = 0;
	this.WaveCh3LinearCounter = 0;
	this.WaveCh3Counter = 0;
	this.WaveCh3WaveCounter = 0;

	this.WaveCh4LengthCounter = 0;
	this.WaveCh4Envelope = 0;
	this.WaveCh4EnvelopeCounter = 0;
	this.WaveCh4Register = 0;
	this.WaveCh4BitSequence = 0;
	this.WaveCh4Counter = 0;

	this.WaveCh5DeltaCounter = 0;
	this.WaveCh5Register = 0;
	this.WaveCh5SampleAddress = 0;
	this.WaveCh5SampleCounter = 0;
	this.WaveCh5Counter = 0;

	this.ApuClockCounter = 0;

	this.WaveLengthCount = [
	0x0A, 0xFE, 0x14, 0x02, 0x28, 0x04, 0x50, 0x06,
	0xA0, 0x08, 0x3C, 0x0A, 0x0E, 0x0C, 0x1A, 0x0E,
	0x0C, 0x10, 0x18, 0x12, 0x30, 0x14, 0x60, 0x16,
	0xC0, 0x18, 0x48, 0x1A, 0x10, 0x1C, 0x20, 0x1E];

	this.WaveCh1_2DutyData = [4, 8, 16, 24];

	this.WaveCh3SequenceData = [
	  15,  13,  11,  9,   7,   5,   3,   1,
	  -1,  -3,  -5, -7,  -9, -11, -13, -15,
	 -15, -13, -11, -9,  -7,  -5,  -3,  -1,
	   1,   3,   5,  7,   9,  11,  13,  15];

	this.WaveCh4FrequencyData = [
	0x004, 0x008, 0x010, 0x020,
	0x040, 0x060, 0x080, 0x0A0,
	0x0CA, 0x0FE, 0x17C, 0x1FC,
	0x2FA, 0x3F8, 0x7F2, 0xFE4];

	this.WaveCh5FrequencyData = [
	0x1AC, 0x17C, 0x154, 0x140,
	0x11E, 0x0FE, 0x0E2, 0x0D6,
	0x0BE, 0x0A0, 0x08E, 0x080,
	0x06A, 0x054, 0x048, 0x036];

	this.WebAudioCtx = null;
	this.WebAudioJsNode = null;
	this.WebAudioGainNode = null;
	this.WebAudioBufferSize = 1024;

	this.ApuCpuClockCounter = 0;


/* **** FC Mapper **** */
	this.Mapper = null;
}


/* **************************************************************** */
FC.prototype.RequestAnimationFrame = function (){
	if(this.Use_requestAnimationFrame)
		this.UpdateAnimationFrame();
}


FC.prototype.CancelAnimationFrame = function (){
	if(this.Use_requestAnimationFrame)
		window.cancelAnimationFrame(this.TimerID);
}


FC.prototype.UpdateAnimationFrame = function () {
	this.TimerID = window.requestAnimationFrame(this.UpdateAnimationFrame.bind(this));
	this.Run();
}


FC.prototype.Run = function () {
	this.WaveProcessing = true;
	this.CheckGamePad();
	this.CpuRun();
}


FC.prototype.isRunning = function () {
	if(this.TimerID != null)
		return true;
	return false;
}


FC.prototype.Start = function () {
	if(this.Mapper != null && this.TimerID == null) {
		this.JoyPadInit();
		this.RequestAnimationFrame();
		return true;
	}
	return false;
}


FC.prototype.Pause = function () {
	if(this.Mapper != null && this.TimerID != null) {
		this.CancelAnimationFrame();
		this.JoyPadRelease();
		this.TimerID = null;
		return true;
	}
	return false;
}


FC.prototype.Init = function () {
	this.ParseHeader();
	this.StorageClear();
	this.StorageInit();
	this.PpuInit();
	this.ApuInit();

	if(!this.MapperSelect()) {
		console.log("Unsupported Mapper : " + this.MapperNumber);
		return false;
	}

	this.Mapper.Init();
	this.CpuInit();
	this.AudioInit();

	return true;
}


FC.prototype.Reset = function () {
	if(this.Mapper != null) {
		this.Pause();
		this.PpuInit();
		this.ApuInit();
		this.Mapper.Init();
		this.CpuReset();
		this.Start();
		return true;
	}
	return false;
}


/* **** FC CPU **** */
FC.prototype.CpuInit = function () {
	this.A = 0;
	this.X = 0;
	this.Y = 0;
	this.S = 0xFD;
	this.P = 0x34;
	this.toNMI = false;
	this.toIRQ = 0x00;
	this.PC = this.Get16(0xFFFC);

	this.CPUClock = 0;
}


FC.prototype.CpuReset = function () {
	this.S = (this.S - 3) & 0xFF;
	this.P |= 0x04;
	this.toNMI = false;
	this.toIRQ = 0x00;
	this.PC = this.Get16(0xFFFC);

	this.CPUClock = 0;
}


FC.prototype.NMI = function () {
	this.CPUClock += 7;
	this.Push((this.PC >> 8) & 0xFF);
	this.Push(this.PC & 0xFF);
	this.Push((this.P & 0xEF) | 0x20);
	this.P = (this.P | 0x04) & 0xEF;
	this.PC = this.Get16(0xFFFA);
}


FC.prototype.IRQ = function () {
	this.CPUClock += 7;
	this.Push((this.PC >> 8) & 0xFF);
	this.Push(this.PC & 0xFF);
	this.Push((this.P & 0xEF) | 0x20);
	this.P = (this.P | 0x04) & 0xEF;
	this.PC = this.Get16(0xFFFE);
}


FC.prototype.GetAddressZeroPage = function () {
	return this.Get(this.PC++);
}


FC.prototype.GetAddressImmediate = function () {
	return this.PC++;
}


FC.prototype.GetAddressAbsolute = function () {
	return this.Get(this.PC++) | (this.Get(this.PC++) << 8);
}


FC.prototype.GetAddressZeroPageX = function () {
	return (this.X + this.Get(this.PC++)) & 0xFF;
}


FC.prototype.GetAddressZeroPageY = function () {
	return (this.Y + this.Get(this.PC++)) & 0xFF;
}


FC.prototype.GetAddressIndirectX = function () {
	let tmp = (this.Get(this.PC++) + this.X) & 0xFF;
	return this.Get(tmp) | (this.Get((tmp + 1) & 0xFF) << 8);
}


FC.prototype.GetAddressIndirectY = function () {
	let tmp = this.Get(this.PC++);
	tmp = this.Get(tmp) | (this.Get((tmp + 1) & 0xFF) << 8);
	let address = tmp + this.Y;
	if(((address ^ tmp) & 0x100) > 0)
		this.CPUClock += 1;
	return address;
}


FC.prototype.GetAddressAbsoluteX = function () {
	let tmp = this.Get(this.PC++) | (this.Get(this.PC++) << 8);
	let address = tmp + this.X;
	if(((address ^ tmp) & 0x100) > 0)
		this.CPUClock += 1;
	return address;
}


FC.prototype.GetAddressAbsoluteY = function () {
	let tmp = this.Get(this.PC++) | (this.Get(this.PC++) << 8);
	let address = tmp + this.Y;
	if(((address ^ tmp) & 0x100) > 0)
		this.CPUClock += 1;
	return address;
}


FC.prototype.Push = function (data) {
	this.RAM[0x100 + this.S] = data;
	this.S = (this.S - 1) & 0xFF;
}


FC.prototype.Pop = function () {
	this.S = (this.S + 1) & 0xFF;
	return this.RAM[0x100 + this.S];
}


FC.prototype.LDA = function (address) {
	this.A = this.Get(address);
	this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
}


FC.prototype.LDX = function (address) {
	this.X = this.Get(address);
	this.P = this.P & 0x7D | this.ZNCacheTable[this.X];
}


FC.prototype.LDY = function (address) {
	this.Y = this.Get(address);
	this.P = this.P & 0x7D | this.ZNCacheTable[this.Y];
}


FC.prototype.STA = function (address) {
	this.Set(address, this.A);
}


FC.prototype.STX = function (address) {
	this.Set(address, this.X);
}


FC.prototype.STY = function (address) {
	this.Set(address, this.Y);
}


FC.prototype.Adder = function (data1) {
	/*let data0 = this.A;
	this.HalfCarry = ((data0 & 0x0F) + (data1 & 0x0F) + (this.P & 0x01)) >= 0x10 ? true : false;
	let tmp = data0 + data1 + (this.P & 0x01);
	this.A = tmp & 0xFF;
	this.P = (this.P & 0x3C) | ((~(data0 ^ data1) & (data0 ^ tmp) & 0x80) >>> 1) | (tmp >>> 8) | this.ZNCacheTable[this.A];*/

	let data0 = this.A;
	let tmp = data0 + data1 + (this.P & 0x01);
	this.A = tmp & 0xFF;
	this.P = (this.P & 0x3C) | ((~(data0 ^ data1) & (data0 ^ tmp) & 0x80) >>> 1) | (tmp >>> 8) | this.ZNCacheTable[this.A];
}


FC.prototype.ADC = function (address) {
	this.Adder(this.Get(address));

	/*if((this.P & 0x08) == 0x08) {
		if((this.A & 0x0F) > 0x09 || this.HalfCarry)
			this.A += 0x06;
		if((this.A & 0xF0) > 0x90 || (this.P & 0x01) == 0x01)
			this.A += 0x60;
		if(this.A > 0xFF) {
			this.A &= 0xFF;
			this.P |= 0x01;
		}
	}*/
}


FC.prototype.SBC = function (address) {
	this.Adder(~this.Get(address) & 0xFF);

	/*if((this.P & 0x08) == 0x08) {
		if((this.A & 0x0F) > 0x09 || !this.HalfCarry)
			this.A -= 0x06;
		if((this.A & 0xF0) > 0x90 || (this.P & 0x01) == 0x00)
			this.A -= 0x60;
	}*/
}


FC.prototype.CMP = function (address) {
	this.P = this.P & 0x7C | this.ZNCacheTableCMP[(this.A - this.Get(address)) & 0x1FF];
}


FC.prototype.CPX = function (address) {
	this.P = this.P & 0x7C | this.ZNCacheTableCMP[(this.X - this.Get(address)) & 0x1FF];
}


FC.prototype.CPY = function (address) {
	this.P = this.P & 0x7C | this.ZNCacheTableCMP[(this.Y - this.Get(address)) & 0x1FF];
}


FC.prototype.AND = function (address) {
	this.A &= this.Get(address);
	this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
}


FC.prototype.EOR = function (address) {
	this.A ^= this.Get(address);
	this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
}


FC.prototype.ORA = function (address) {
	this.A |= this.Get(address);
	this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
}


FC.prototype.BIT = function (address) {
	let x = this.Get(address);
	this.P = this.P & 0x3D | this.ZNCacheTable[x & this.A] & 0x02 | x & 0xC0;
}


FC.prototype.ASL_Sub = function (data) {
	this.P = this.P & 0xFE | (data >> 7);
	data = (data << 1) & 0xFF;
	this.P = this.P & 0x7D | this.ZNCacheTable[data];
	return data;
}


FC.prototype.ASL = function (address) {
	this.Set(address, this.ASL_Sub(this.Get(address)));
}


FC.prototype.LSR_Sub = function (data) {
	this.P = this.P & 0x7C | data & 0x01;
	data >>= 1;
	this.P |= this.ZNCacheTable[data];
	return data;
}


FC.prototype.LSR = function (address) {
	this.Set(address, this.LSR_Sub(this.Get(address)));
}


FC.prototype.ROL_Sub = function (data) {
	let carry = data >> 7;
	data = (data << 1) & 0xFF | this.P & 0x01;
	this.P = this.P & 0x7C | carry | this.ZNCacheTable[data];
	return data;
}


FC.prototype.ROL = function (address) {
	this.Set(address, this.ROL_Sub(this.Get(address)));
}


FC.prototype.ROR_Sub = function (data) {
	let carry = data & 0x01;
	data = (data >> 1) | ((this.P & 0x01) << 7);
	this.P = this.P & 0x7C | carry | this.ZNCacheTable[data];
	return  data;
}


FC.prototype.ROR = function (address) {
	this.Set(address, this.ROR_Sub(this.Get(address)));
}


FC.prototype.INC = function (address) {
	let data = (this.Get(address) + 1) & 0xFF;
	this.P = this.P & 0x7D | this.ZNCacheTable[data];
	this.Set(address, data);
}


FC.prototype.DEC = function (address) {
	let data = (this.Get(address) - 1) & 0xFF;
	this.P = this.P & 0x7D | this.ZNCacheTable[data];
	this.Set(address, data);
}


FC.prototype.Branch = function (state) {
	if(!state) {
		this.PC++;
		return;
	}
	let displace = this.Get(this.PC);
	let tmp = this.PC + 1;
	this.PC = (tmp + (displace >= 128 ? displace - 256 : displace)) & 0xFFFF;
	this.CPUClock += (((tmp ^ this.PC) & 0x100) > 0) ? 2 : 1;
}


/* Undocument */
FC.prototype.ANC = function (address) {
	this.A &= this.Get(address);
	this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
	this.P = this.P & 0xFE | (this.A >>> 7);
}


FC.prototype.ANE = function (address) {
	this.A = (this.A | 0xEE) & this.X & this.Get(address);
	this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
}


FC.prototype.ARR = function (address) {
	this.A &= this.Get(address);
	this.A = (this.A >> 1) | ((this.P & 0x01) << 7);
	this.P = this.P & 0x7D | this.ZNCacheTable[this.A];

	this.P = (this.P & 0xFE) | ((this.A & 0x40) >> 6);

	let tmp = (this.A ^ (this.A << 1)) & 0x40;
	this.P = (this.P & 0xBF) | tmp;
}


FC.prototype.ASR = function (address) {
	this.A &= this.Get(address);

	this.P = (this.P & 0xFE) | (this.A & 0x01);

	this.A = this.A >> 1;
	this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
}


FC.prototype.DCP = function (address) {
	let tmp = (this.Get(address) - 1) & 0xFF;
	this.P = this.P & 0x7C | this.ZNCacheTableCMP[(this.A - tmp) & 0x1FF];
	this.Set(address, tmp);
}


FC.prototype.ISB = function (address) {
	let tmp = (this.Get(address) + 1) & 0xFF;
	this.Adder(~tmp & 0xFF);
	this.Set(address, tmp);
}


FC.prototype.LAS = function (address) {
	let tmp = this.Get(address) & this.S;
	this.A = this.X = this.S = tmp;
	this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
}


FC.prototype.LAX = function (address) {
	this.A = this.X = this.Get(address);
	this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
}


FC.prototype.LXA = function (address) {
	let tmp = (this.A | 0xEE) & this.Get(address);
	this.A = this.X = tmp;
	this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
}


FC.prototype.RLA = function (address) {
	let tmp = this.Get(address);
	tmp = (tmp << 1) | (this.P & 0x01);
	this.P = (this.P & 0xFE) | (tmp >> 8);
	this.A &= tmp;
	this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
	this.Set(address, tmp);
}


FC.prototype.RRA = function (address) {
	let tmp = this.Get(address);
	let c = tmp & 0x01;
	tmp = (tmp >> 1) | ((this.P & 0x01) << 7)
	this.P = (this.P & 0xFE) | c;
	this.Adder(tmp);
	this.Set(address, tmp);
}


FC.prototype.SAX = function (address) {
	let tmp = this.A & this.X;
	this.Set(address, tmp);
}


FC.prototype.SBX = function (address) {
	let tmp = (this.A & this.X) - this.Get(address);
	this.P = (this.P & 0xFE) | ((~tmp >> 8) & 0x01);
	this.X = tmp & 0xFF;
	this.P = this.P & 0x7D | this.ZNCacheTable[this.X];
}


FC.prototype.SHA = function (address) {
	let tmp = this.A & this.X & ((address >> 8) + 1);
	this.Set(address, tmp);
}


FC.prototype.SHS = function (address) {
	this.S = this.A & this.X;
	let tmp = this.S & ((address >> 8) + 1);
	this.Set(address, tmp);
}


FC.prototype.SHX = function (address) {
	let tmp = this.X & ((address >> 8) + 1);
	this.Set(address, tmp);
}


FC.prototype.SHY = function (address) {
	let tmp = this.Y & ((address >> 8) + 1);
	this.Set(address, tmp);
}


FC.prototype.SLO = function (address) {
	let tmp = this.Get(address);
	this.P = (this.P & 0xFE) | (tmp >> 7);
	tmp = (tmp << 1) & 0xFF;
	this.A |= tmp;
	this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
	this.Set(address, tmp);
}


FC.prototype.SRE = function (address) {
	let tmp = this.Get(address);
	this.P = (this.P & 0xFE) | (tmp & 0x01);
	tmp >>= 1;
	this.A ^= tmp;
	this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
	this.Set(address, tmp);
}


FC.prototype.CpuRun = function () {
	this.DrawFlag = false;
	let cycletable = this.CycleTable;
	let mapper = this.Mapper;
	let opcode;

	do {
		if(this.toNMI) {
			this.NMI();
			this.toNMI = false;
		} else if((this.P & 0x04) == 0x00 && this.toIRQ != 0x00)
			this.IRQ();
		opcode = this.Get(this.PC++);
		this.CPUClock += cycletable[opcode];
		mapper.CPUSync(this.CPUClock);
		this.PpuRun();
		this.ApuRun();
		this.CPUClock = 0;

		switch (opcode) {
			case 0xA1://LDA XIND
				this.LDA(this.GetAddressIndirectX());
				break;

			case 0xA5://LDA ZP
				this.LDA(this.GetAddressZeroPage());
				break;

			case 0xA9://LDA IMM
				this.LDA(this.GetAddressImmediate());
				break;

			case 0xAD://LDA ABS
				this.LDA(this.GetAddressAbsolute());
				break;

			case 0xB1://LDA INDY
				this.LDA(this.GetAddressIndirectY());
				break;

			case 0xB5://LDA ZPX
				this.LDA(this.GetAddressZeroPageX());
				break;

			case 0xB9://LDA ABSY
				this.LDA(this.GetAddressAbsoluteY());
				break;

			case 0xBD://LDA ABSX
				this.LDA(this.GetAddressAbsoluteX());
				break;

			case 0xA2://LDX IMM
				this.LDX(this.GetAddressImmediate());
				break;

			case 0xA6://LDX ZP
				this.LDX(this.GetAddressZeroPage());
				break;

			case 0xAE://LDX ABS
				this.LDX(this.GetAddressAbsolute());
				break;

			case 0xB6://LDX ZPY
				this.LDX(this.GetAddressZeroPageY());
				break;

			case 0xBE://LDX ABSY
				this.LDX(this.GetAddressAbsoluteY());
				break;

			case 0xA0://LDY IMM
				this.LDY(this.GetAddressImmediate());
				break;

			case 0xA4://LDY ZP
				this.LDY(this.GetAddressZeroPage());
				break;

			case 0xAC://LDY ABS
				this.LDY(this.GetAddressAbsolute());
				break;

			case 0xB4://LDY ZPX
				this.LDY(this.GetAddressZeroPageX());
				break;

			case 0xBC://LDY ABSX
				this.LDY(this.GetAddressAbsoluteX());
				break;

			case 0x81://STA XIND
				this.STA(this.GetAddressIndirectX());
				break;

			case 0x85://STA ZP
				this.STA(this.GetAddressZeroPage());
				break;

			case 0x8D://STA ABS
				this.STA(this.GetAddressAbsolute());
				break;

			case 0x91://STA INDY
				this.STA(this.GetAddressIndirectY());
				break;

			case 0x95://STA ZPX
				this.STA(this.GetAddressZeroPageX());
				break;

			case 0x99://STA ABSY
				this.STA(this.GetAddressAbsoluteY());
				break;

			case 0x9D://STA ABSX
				this.STA(this.GetAddressAbsoluteX());
				break;

			case 0x86://STX ZP
				this.STX(this.GetAddressZeroPage());
				break;

			case 0x8E://STX ABS
				this.STX(this.GetAddressAbsolute());
				break;

			case 0x96://STX ZPY
				this.STX(this.GetAddressZeroPageY());
				break;

			case 0x84://STY ZP
				this.STY(this.GetAddressZeroPage());
				break;

			case 0x8C://STY ABS
				this.STY(this.GetAddressAbsolute());
				break;

			case 0x94://STY ZPX
				this.STY(this.GetAddressZeroPageX());
				break;

			case 0x8A://TXA
				this.A = this.X;
				this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
				break;

			case 0x98://TYA
				this.A = this.Y;
				this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
				break;

			case 0x9A://TXS
				this.S = this.X;
				break;

			case 0xA8://TAY
				this.Y = this.A;
				this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
				break;

			case 0xAA://TAX
				this.X = this.A;
				this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
				break;

			case 0xBA://TSX
				this.X = this.S;
				this.P = this.P & 0x7D | this.ZNCacheTable[this.X];
				break;

			case 0x08://PHP
				this.Push(this.P | 0x30);
				break;

			case 0x28://PLP
				this.P = this.Pop();
				break;

			case 0x48://PHA
				this.Push(this.A);
				break;

			case 0x68://PLA
				this.A = this.Pop();
				this.P = this.P & 0x7D | this.ZNCacheTable[this.A];
				break;

			case 0x61://ADC XIND
				this.ADC(this.GetAddressIndirectX());
				break;

			case 0x65://ADC ZP
				this.ADC(this.GetAddressZeroPage());
				break;

			case 0x69://ADC IMM
				this.ADC(this.GetAddressImmediate());
				break;

			case 0x6D://ADC ABS
				this.ADC(this.GetAddressAbsolute());
				break;

			case 0x71://ADC INDY
				this.ADC(this.GetAddressIndirectY());
				break;

			case 0x75://ADC ZPX
				this.ADC(this.GetAddressZeroPageX());
				break;

			case 0x79://ADC ABSY
				this.ADC(this.GetAddressAbsoluteY());
				break;

			case 0x7D://ADC ABSX
				this.ADC(this.GetAddressAbsoluteX());
				break;

			case 0xE1://SBC XIND
				this.SBC(this.GetAddressIndirectX());
				break;

			case 0xE5://SBC ZP
				this.SBC(this.GetAddressZeroPage());
				break;

			case 0xE9://SBC IMM
				this.SBC(this.GetAddressImmediate());
				break;

			case 0xED://SBC ABS
				this.SBC(this.GetAddressAbsolute());
				break;

			case 0xF1://SBC INDY
				this.SBC(this.GetAddressIndirectY());
				break;

			case 0xF5://SBC ZPX
				this.SBC(this.GetAddressZeroPageX());
				break;

			case 0xF9://SBC ABSY
				this.SBC(this.GetAddressAbsoluteY());
				break;

			case 0xFD://SBC ABSX
				this.SBC(this.GetAddressAbsoluteX());
				break;

			case 0xC1://CMP XIND
				this.CMP(this.GetAddressIndirectX());
				break;

			case 0xC5://CMP ZP
				this.CMP(this.GetAddressZeroPage());
				break;

			case 0xC9://CMP IMM
				this.CMP(this.GetAddressImmediate());
				break;

			case 0xCD://CMP ABS
				this.CMP(this.GetAddressAbsolute());
				break;

			case 0xD1://CMP INDY
				this.CMP(this.GetAddressIndirectY());
				break;

			case 0xD5://CMP ZPX
				this.CMP(this.GetAddressZeroPageX());
				break;

			case 0xD9://CMP ABSY
				this.CMP(this.GetAddressAbsoluteY());
				break;

			case 0xDD://CMP ABSX
				this.CMP(this.GetAddressAbsoluteX());
				break;

			case 0xE0://CPX IMM
				this.CPX(this.GetAddressImmediate());
				break;

			case 0xE4://CPX ZP
				this.CPX(this.GetAddressZeroPage());
				break;

			case 0xEC://CPX ABS
				this.CPX(this.GetAddressAbsolute());
				break;

			case 0xC0://CPY IMM
				this.CPY(this.GetAddressImmediate());
				break;

			case 0xC4://CPY ZP
				this.CPY(this.GetAddressZeroPage());
				break;

			case 0xCC://CPY ABS
				this.CPY(this.GetAddressAbsolute());
				break;

			case 0x21://AND XIND
				this.AND(this.GetAddressIndirectX());
				break;

			case 0x25://AND ZP
				this.AND(this.GetAddressZeroPage());
				break;

			case 0x29://AND IMM
				this.AND(this.GetAddressImmediate());
				break;

			case 0x2D://AND ABS
				this.AND(this.GetAddressAbsolute());
				break;

			case 0x31://AND INDY
				this.AND(this.GetAddressIndirectY());
				break;

			case 0x35://AND ZPX
				this.AND(this.GetAddressZeroPageX());
				break;

			case 0x39://AND ABSY
				this.AND(this.GetAddressAbsoluteY());
				break;

			case 0x3D://AND ABSX
				this.AND(this.GetAddressAbsoluteX());
				break;

			case 0x41://EOR XIND
				this.EOR(this.GetAddressIndirectX());
				break;

			case 0x45://EOR ZP
				this.EOR(this.GetAddressZeroPage());
				break;

			case 0x49://EOR IMM
				this.EOR(this.GetAddressImmediate());
				break;

			case 0x4D://EOR ABS
				this.EOR(this.GetAddressAbsolute());
				break;

			case 0x51://EOR INDY
				this.EOR(this.GetAddressIndirectY());
				break;

			case 0x55://EOR ZPX
				this.EOR(this.GetAddressZeroPageX());
				break;

			case 0x59://EOR ABSY
				this.EOR(this.GetAddressAbsoluteY());
				break;

			case 0x5D://EOR ABSX
				this.EOR(this.GetAddressAbsoluteX());
				break;

			case 0x01://ORA XIND
				this.ORA(this.GetAddressIndirectX());
				break;

			case 0x05://ORA ZP
				this.ORA(this.GetAddressZeroPage());
				break;

			case 0x09://ORA IMM
				this.ORA(this.GetAddressImmediate());
				break;

			case 0x0D://ORA ABS
				this.ORA(this.GetAddressAbsolute());
				break;

			case 0x11://ORA INDY
				this.ORA(this.GetAddressIndirectY());
				break;

			case 0x15://ORA ZPX
				this.ORA(this.GetAddressZeroPageX());
				break;

			case 0x19://ORA ABSY
				this.ORA(this.GetAddressAbsoluteY());
				break;

			case 0x1D://ORA ABSX
				this.ORA(this.GetAddressAbsoluteX());
				break;

			case 0x24://BIT ZP
				this.BIT(this.GetAddressZeroPage());
				break;

			case 0x2C://BIT ABS
				this.BIT(this.GetAddressAbsolute());
				break;

			case 0x06://ASL ZP
				this.ASL(this.GetAddressZeroPage());
				break;

			case 0x0A://ASL A
				this.A = this.ASL_Sub(this.A);
				break;

			case 0x0E://ASL ABS
				this.ASL(this.GetAddressAbsolute());
				break;

			case 0x16://ASL ZPX
				this.ASL(this.GetAddressZeroPageX());
				break;

			case 0x1E://ASL ABSX
				this.ASL(this.GetAddressAbsoluteX());
				break;

			case 0x46://LSR ZP
				this.LSR(this.GetAddressZeroPage());
				break;

			case 0x4A://LSR A
				this.A = this.LSR_Sub(this.A);
				break;

			case 0x4E://LSR ABS
				this.LSR(this.GetAddressAbsolute());
				break;

			case 0x56://LSR ZPX
				this.LSR(this.GetAddressZeroPageX());
				break;

			case 0x5E://LSR ABSX
				this.LSR(this.GetAddressAbsoluteX());
				break;

			case 0x26://ROL ZP
				this.ROL(this.GetAddressZeroPage());
				break;

			case 0x2A://ROL A
				this.A = this.ROL_Sub(this.A);
				break;

			case 0x2E://ROL ABS
				this.ROL(this.GetAddressAbsolute());
				break;

			case 0x36://ROL ZPX
				this.ROL(this.GetAddressZeroPageX());
				break;

			case 0x3E://ROL ABSX
				this.ROL(this.GetAddressAbsoluteX());
				break;

			case 0x66://ROR ZP
				this.ROR(this.GetAddressZeroPage());
				break;

			case 0x6A://ROR A
				this.A = this.ROR_Sub(this.A);
				break;

			case 0x6E://ROR ABS
				this.ROR(this.GetAddressAbsolute());
				break;

			case 0x76://ROR ZPX
				this.ROR(this.GetAddressZeroPageX());
				break;

			case 0x7E://ROR ABSX
				this.ROR(this.GetAddressAbsoluteX());
				break;

			case 0xE6://INC ZP
				this.INC(this.GetAddressZeroPage());
				break;

			case 0xEE://INC ABS
				this.INC(this.GetAddressAbsolute());
				break;

			case 0xF6://INC ZPX
				this.INC(this.GetAddressZeroPageX());
				break;

			case 0xFE://INC ABSX
				this.INC(this.GetAddressAbsoluteX());
				break;

			case 0xE8://INX
				this.X = (this.X + 1) & 0xFF;
				this.P = this.P & 0x7D | this.ZNCacheTable[this.X];
				break;

			case 0xC8://INY
				this.Y = (this.Y + 1) & 0xFF;
				this.P = this.P & 0x7D | this.ZNCacheTable[this.Y]; 
				break;

			case 0xC6://DEC ZP
				this.DEC(this.GetAddressZeroPage());
				break;

			case 0xCE://DEC ABS
				this.DEC(this.GetAddressAbsolute());
				break;

			case 0xD6://DEC ZPX
				this.DEC(this.GetAddressZeroPageX());
				break;

			case 0xDE://DEC ABSX
				this.DEC(this.GetAddressAbsoluteX());
				break;

			case 0xCA://DEX
				this.X = (this.X - 1) & 0xFF;
				this.P = this.P & 0x7D | this.ZNCacheTable[this.X];
				break;

			case 0x88://DEY
				this.Y = (this.Y - 1) & 0xFF;
				this.P = this.P & 0x7D | this.ZNCacheTable[this.Y];
				break;

			case 0x18://CLC
				this.P &= 0xFE;
				break;

			case 0x58://CLI
				this.P &= 0xFB;
				break;

			case 0xB8://CLV
				this.P &= 0xBF;
				break;

			case 0xD8://CLD
				this.P &= 0xF7;
				break;

			case 0x38://SEC
				this.P |= 0x01;
				break;

			case 0x78://SEI
				this.P |= 0x04;
				break;

			case 0xF8://SED
				this.P |= 0x08;
				break;

			case 0xEA://NOP
				break;

			case 0x00://BRK
				this.Push(++this.PC >> 8);
				this.Push(this.PC & 0xFF);
				this.Push(this.P | 0x30);
				this.P |= 0x14;
				this.PC = this.Get16(0xFFFE);
				break;

			case 0x4C://JMP ABS
				this.PC = this.GetAddressAbsolute();
				break;

			case 0x6C://JMP IND
				let address = this.GetAddressAbsolute();
				let tmp = (((address + 1) & 0x00FF) | (address & 0xFF00));
				this.PC = this.Get(address) | (this.Get(tmp) << 8);
				break;

			case 0x20://JSR ABS
				let PC = (this.PC + 1) & 0xFFFF;
				this.Push(PC >> 8);
				this.Push(PC & 0xFF);
				this.PC = this.GetAddressAbsolute();
				break;

			case 0x60://RTS
				this.PC = (this.Pop() | (this.Pop() << 8)) + 1;
				break;

			case 0x40://RTI
				this.P = this.Pop();
				this.PC = this.Pop() | (this.Pop() << 8);
				break;

			case 0x10://BPL REL
				this.Branch((this.P & 0x80) == 0);
				break;

			case 0x30://BMI REL
				this.Branch((this.P & 0x80) != 0);
				break;

			case 0x50://BVC REL
				this.Branch((this.P & 0x40) == 0);
				break;

			case 0x70://BVS REL
				this.Branch((this.P & 0x40) != 0);
				break;

			case 0x90://BCC REL
				this.Branch((this.P & 0x01) == 0);
				break;

			case 0xB0://BCS REL
				this.Branch((this.P & 0x01) != 0);
				break;

			case 0xD0://BNE REL
				this.Branch((this.P & 0x02) == 0);
				break;

			case 0xF0://BEQ REL
				this.Branch((this.P & 0x02) != 0);
				break;

			/* Undocument */
			case 0x0B://ANC IMM
				this.ANC(this.GetAddressImmediate());
				break;

			case 0x2B://ANC IMM
				this.ANC(this.GetAddressImmediate());
				break;

			case 0x8B://ANE IMM
				this.ANE(this.GetAddressImmediate());
				break;

			case 0x6B://ARR IMM
				this.ARR(this.GetAddressImmediate());
				break;

			case 0x4B://ASR IMM
				this.ASR(this.GetAddressImmediate());
				break;

			case 0xC7://DCP ZP
				this.DCP(this.GetAddressZeroPage());
				break;

			case 0xD7://DCP ZPX
				this.DCP(this.GetAddressZeroPageX());
				break;

			case 0xCF://DCP ABS
				this.DCP(this.GetAddressAbsolute());
				break;

			case 0xDF://DCP ABSX
				this.DCP(this.GetAddressAbsoluteX());
				break;

			case 0xDB://DCP ABSY
				this.DCP(this.GetAddressAbsoluteY());
				break;

			case 0xC3://DCP XIND
				this.DCP(this.GetAddressIndirectX());
				break;

			case 0xD3://DCP INDY
				this.DCP(this.GetAddressIndirectY());
				break;

			case 0xE7://ISB ZP
				this.ISB(this.GetAddressZeroPage());
				break;

			case 0xF7://ISB ZPX
				this.ISB(this.GetAddressZeroPageX());
				break;

			case 0xEF://ISB ABS
				this.ISB(this.GetAddressAbsolute());
				break;

			case 0xFF://ISB ABSX
				this.ISB(this.GetAddressAbsoluteX());
				break;

			case 0xFB://ISB ABSY
				this.ISB(this.GetAddressAbsoluteY());
				break;

			case 0xE3://ISB XIND
				this.ISB(this.GetAddressIndirectX());
				break;

			case 0xF3://ISB INDY
				this.ISB(this.GetAddressIndirectY());
				break;

			case 0xBB://LAS ABSY
				this.LAS(this.GetAddressAbsoluteY());
				break;

			case 0xA7://LAX ZP
				this.LAX(this.GetAddressZeroPage());
				break;

			case 0xB7://LAX ZPY
				this.LAX(this.GetAddressZeroPageY());
				break;

			case 0xAF://LAX ABS
				this.LAX(this.GetAddressAbsolute());
				break;

			case 0xBF://LAX ABSY
				this.LAX(this.GetAddressAbsoluteY());
				break;

			case 0xA3://LAX XIND
				this.LAX(this.GetAddressIndirectX());
				break;

			case 0xB3://LAX INDY
				this.LAX(this.GetAddressIndirectY());
				break;

			case 0xAB://LXA IMM
				this.LXA(this.GetAddressImmediate());
				break;

			case 0x27://RLA ZP
				this.RLA(this.GetAddressZeroPage());
				break;

			case 0x37://RLA ZPX
				this.RLA(this.GetAddressZeroPageX());
				break;

			case 0x2F://RLA ABS
				this.RLA(this.GetAddressAbsolute());
				break;

			case 0x3F://RLA ABSX
				this.RLA(this.GetAddressAbsoluteX());
				break;

			case 0x3B://RLA ABSY
				this.RLA(this.GetAddressAbsoluteY());
				break;

			case 0x23://RLA XIND
				this.RLA(this.GetAddressIndirectX());
				break;

			case 0x33://RLA INDY
				this.RLA(this.GetAddressIndirectY());
				break;

			case 0x67://RRA ZP
				this.RRA(this.GetAddressZeroPage());
				break;

			case 0x77://RRA ZPX
				this.RRA(this.GetAddressZeroPageX());
				break;

			case 0x6F://RRA ABS
				this.RRA(this.GetAddressAbsolute());
				break;

			case 0x7F://RRA ABSX
				this.RRA(this.GetAddressAbsoluteX());
				break;

			case 0x7B://RRA ABSY
				this.RRA(this.GetAddressAbsoluteY());
				break;

			case 0x63://RRA XIND
				this.RRA(this.GetAddressIndirectX());
				break;

			case 0x73://RRA INDY
				this.RRA(this.GetAddressIndirectY());
				break;

			case 0x87://SAX ZP
				this.SAX(this.GetAddressZeroPage());
				break;

			case 0x97://SAX ZPY
				this.SAX(this.GetAddressZeroPageY());
				break;

			case 0x8F://SAX ABS
				this.SAX(this.GetAddressAbsolute());
				break;

			case 0x83://SAX XIND
				this.SAX(this.GetAddressIndirectX());
				break;

			case 0xCB://SBX IMM
				this.SBX(this.GetAddressImmediate());
				break;

			case 0x9F://SHA ABSY
				this.SHA(this.GetAddressAbsoluteY());
				break;

			case 0x93://SHA INDY
				this.SHA(this.GetAddressIndirectY());
				break;

			case 0x9B://SHS ABSY
				this.SHS(this.GetAddressAbsoluteY());
				break;

			case 0x9E://SHX ABSY
				this.SHX(this.GetAddressAbsoluteY());
				break;

			case 0x9C://SHY ABSX
				this.SHY(this.GetAddressAbsoluteX());
				break;

			case 0x07://SLO ZP
				this.SLO(this.GetAddressZeroPage());
				break;

			case 0x17://SLO ZPX
				this.SLO(this.GetAddressZeroPageX());
				break;

			case 0x0F://SLO ABS
				this.SLO(this.GetAddressAbsolute());
				break;

			case 0x1F://SLO ABSX
				this.SLO(this.GetAddressAbsoluteX());
				break;

			case 0x1B://SLO ABSY
				this.SLO(this.GetAddressAbsoluteY());
				break;

			case 0x03://SLO XIND
				this.SLO(this.GetAddressIndirectX());
				break;

			case 0x13://SLO INDY
				this.SLO(this.GetAddressIndirectY());
				break;

			case 0x47://SRE ZP
				this.SRE(this.GetAddressZeroPage());
				break;

			case 0x57://SRE ZPX
				this.SRE(this.GetAddressZeroPageX());
				break;

			case 0x4F://SRE ABS
				this.SRE(this.GetAddressAbsolute());
				break;

			case 0x5F://SRE ABSX
				this.SRE(this.GetAddressAbsoluteX());
				break;

			case 0x5B://SRE ABSY
				this.SRE(this.GetAddressAbsoluteY());
				break;

			case 0x43://SRE XIND
				this.SRE(this.GetAddressIndirectX());
				break;

			case 0x53://SRE INDY
				this.SRE(this.GetAddressIndirectY());
				break;

			case 0xEB://SBC IMM
				this.SBC(this.GetAddressImmediate());
				break;

			case 0x1A://NOP
				break;

			case 0x3A://NOP
				break;

			case 0x5A://NOP
				break;

			case 0x7A://NOP
				break;

			case 0xDA://NOP
				break;

			case 0xFA://NOP
				break;

			case 0x80://DOP IMM
				this.PC++;
				break;

			case 0x82://DOP IMM
				this.PC++;
				break;

			case 0x89://DOP IMM
				this.PC++;
				break;

			case 0xC2://DOP IMM
				this.PC++;
				break;

			case 0xE2://DOP IMM
				this.PC++;
				break;

			case 0x04://DOP ZP
				this.PC++;
				break;

			case 0x44://DOP ZP
				this.PC++;
				break;

			case 0x64://DOP ZP
				this.PC++;
				break;

			case 0x14://DOP ZPX
				this.PC++;
				break;

			case 0x34://DOP ZPX
				this.PC++;
				break;

			case 0x54://DOP ZPX
				this.PC++;
				break;

			case 0x74://DOP ZPX
				this.PC++;
				break;

			case 0xD4://DOP ZPX
				this.PC++;
				break;

			case 0xF4://DOP ZPX
				this.PC++;
				break;

			case 0x0C://TOP ABS
				this.PC += 2;
				break;

			case 0x1C://TOP ABSX
				this.PC += 2;
				break;

			case 0x3C://TOP ABSX
				this.PC += 2;
				break;

			case 0x5C://TOP ABSX
				this.PC += 2;
				break;

			case 0x7C://TOP ABSX
				this.PC += 2;
				break;

			case 0xDC://TOP ABSX
				this.PC += 2;
				break;

			case 0xFC://TOP ABSX
				this.PC += 2;
				break;

			case 0x02://JAM
				this.PC--;
				this.Pause();
				console.log(this.PC.toString(16) + " : 0x02");
				break;

			case 0x12://JAM
				this.PC--;
				this.Pause();
				console.log(this.PC.toString(16) + " : 0x12");
				break;

			case 0x22://JAM
				this.PC--;
				this.Pause();
				console.log(this.PC.toString(16) + " : 0x22");
				break;

			case 0x32://JAM
				this.PC--;
				this.Pause();
				console.log(this.PC.toString(16) + " : 0x32");
				break;

			case 0x42://JAM
				this.PC--;
				this.Pause();
				console.log(this.PC.toString(16) + " : 0x42");
				break;

			case 0x52://JAM
				this.PC--;
				this.Pause();
				console.log(this.PC.toString(16) + " : 0x52");
				break;

			case 0x62://JAM
				this.PC--;
				this.Pause();
				console.log(this.PC.toString(16) + " : 0x62");
				break;

			case 0x72://JAM
				this.PC--;
				this.Pause();
				console.log(this.PC.toString(16) + " : 0x72");
				break;

			case 0x92://JAM
				this.PC--;
				this.Pause();
				console.log(this.PC.toString(16) + " : 0x92");
				break;

			case 0xB2://JAM
				this.PC--;
				this.Pause();
				console.log(this.PC.toString(16) + " : 0xB2");
				break;

			case 0xD2://JAM
				this.PC--;
				this.Pause();
				console.log(this.PC.toString(16) + " : 0xD2");
				break;

			case 0xF2://JAM
				this.PC--;
				this.Pause();
				console.log(this.PC.toString(16) + " : 0xF2");
				break;
		}
	} while(!this.DrawFlag);
}


/* **** FC PPU **** */
FC.prototype.PpuInit = function () {
	this.ScrollRegisterFlag = false;
	this.PPUAddressRegisterFlag = false;
	this.HScrollTmp = 0;
	this.PPUAddress = 0;
	this.PPUAddressBuffer = 0;
	this.PPUChrAreaWrite = false;

	this.Palette = new Array(32);
	this.Palette.fill(0x0F);

	this.SpriteLineBuffer = new Array(256);
	this.SpriteLineBuffer.fill(0);

	this.PPUReadBuffer = 0;

	if(this.FourScreen)
		this.SetMirrors(0, 1, 2, 3);
	else
		this.SetMirror(this.HMirror);

	this.BgLineBuffer = new Array(256 + 8);
	this.BgLineBuffer.fill(0);

	this.PpuX = 0;
	this.PpuY = 0;

	this.Sprite0Line = false;
}


FC.prototype.SetMirror = function (value) {
	if(value)
		this.SetMirrors(0, 0, 1, 1);
	else
		this.SetMirrors(0, 1, 0, 1);
}


FC.prototype.SetMirrors = function (value0, value1, value2, value3) {
	this.SetChrRomPage1K( 8, value0 + 8 + 0x0100);
	this.SetChrRomPage1K( 9, value1 + 8 + 0x0100);
	this.SetChrRomPage1K(10, value2 + 8 + 0x0100);
	this.SetChrRomPage1K(11, value3 + 8 + 0x0100);
}


FC.prototype.SetChrRomPage1K = function (page, romPage){
	if(romPage >= 0x0100) {
		this.CHRROM_STATE[page] = romPage;
		this.VRAM[page] = this.VRAMS[romPage & 0xFF];
	} else {
		if(this.ChrRomPageCount > 0) {
			this.CHRROM_STATE[page] = romPage % (this.ChrRomPageCount * 8);
			this.VRAM[page] = this.CHRROM_PAGES[this.CHRROM_STATE[page]];
		}
	}
}


FC.prototype.SetChrRomPages1K = function (romPage0, romPage1, romPage2, romPage3, romPage4, romPage5, romPage6, romPage7){
	this.SetChrRomPage1K(0, romPage0);
	this.SetChrRomPage1K(1, romPage1);
	this.SetChrRomPage1K(2, romPage2);
	this.SetChrRomPage1K(3, romPage3);
	this.SetChrRomPage1K(4, romPage4);
	this.SetChrRomPage1K(5, romPage5);
	this.SetChrRomPage1K(6, romPage6);
	this.SetChrRomPage1K(7, romPage7);
}


FC.prototype.SetChrRomPage = function (num){
	num <<= 3;
	for(let i=0; i<8; i++)
		this.SetChrRomPage1K(i, num + i);
}


FC.prototype.SetCanvas = function (id) {
	this.Canvas = document.querySelector(id);
	if(!this.Canvas.getContext)
		return false;
	this.ctx = this.Canvas.getContext("2d");
	this.ImageData = this.ctx.createImageData(256, 240);
	for(let i=0; i<256 * 240 * 4; i+=4)
		this.ImageData.data[i + 3] = 255;
	this.ctx.putImageData(this.ImageData, 0, 0);
	return true;
}


FC.prototype.PpuRun = function () {
	let tmpIO1 = this.IO1;
	let tmpSpLine = this.SpriteLineBuffer;
	let tmpx = this.PpuX;
	this.PpuX += this.CPUClock * 3;

	while(this.PpuX >= 341) {
		let tmpIsScreenEnable = (tmpIO1[0x01] & 0x08) == 0x08;
		let tmpIsSpriteEnable = (tmpIO1[0x01] & 0x10) == 0x10;

		this.PpuX -= 341;
		tmpx = 0;
		this.Sprite0Line = false;
		this.PpuY++;

		if(this.PpuY == 262) {
			this.PpuY = 0;
			if(tmpIsScreenEnable || tmpIsSpriteEnable)
				this.PPUAddress = (this.PPUAddress & 0x841F) | (this.PPUAddressBuffer & 0x7BE0);
		}
		if(this.PpuY == 261)
			tmpIO1[0x02] &= 0x1F;

		this.Mapper.HSync(this.PpuY);

		if(this.PpuY == 241) {
			this.ctx.putImageData(this.ImageData, 0, 0);

			this.DrawFlag = true;
			this.ScrollRegisterFlag = false;
			tmpIO1[0x02] = (tmpIO1[0x02] & 0x7F) | 0x80;

			this.toNMI = (tmpIO1[0x00] & 0x80) == 0x80;
			continue;
		}

		if(this.PpuY < 240) {
			let tmpPalette = this.Palette;
			let tmpPaletteTable = this.PaletteTables[tmpIO1[0x01] & 0x01][tmpIO1[0x01] >> 5];
			let tmpImageData = this.ImageData.data;
			let tmpBgLineBuffer = this.BgLineBuffer;

			if(tmpIsScreenEnable || tmpIsSpriteEnable) {
				this.PPUAddress = (this.PPUAddress & 0xFBE0) | (this.PPUAddressBuffer & 0x041F);

				if((this.IO1[0x01] & 0x08) == 0x08) {
					this.Mapper.BuildBGLine();
					if((this.IO1[0x01] & 0x02) != 0x02) {
						tmpBgLineBuffer.fill(0x10, 0, 8);
					}
				} else {
					tmpBgLineBuffer.fill(0x10);
				}

				if((this.IO1[0x01] & 0x10) == 0x10)
					this.Mapper.BuildSpriteLine();

				let tmpDist = this.PpuY << 10;
				for(let p=0; p<256; p++, tmpDist+=4) {
					let tmpPal = tmpPaletteTable[tmpPalette[tmpBgLineBuffer[p]]];
					tmpImageData[tmpDist] = tmpPal[0];
					tmpImageData[tmpDist + 1] = tmpPal[1];
					tmpImageData[tmpDist + 2] = tmpPal[2];
				}

				if((this.PPUAddress & 0x7000) == 0x7000) {
					this.PPUAddress &= 0x8FFF;
					if((this.PPUAddress & 0x03E0) == 0x03A0)
						this.PPUAddress = (this.PPUAddress ^ 0x0800) & 0xFC1F;
					else if((this.PPUAddress & 0x03E0) == 0x03E0)
						this.PPUAddress &= 0xFC1F;
					else
						this.PPUAddress += 0x0020;
				} else
					this.PPUAddress += 0x1000;

			} else {
				let tmpDist = this.PpuY << 10;
				let tmpPal = tmpPaletteTable[tmpPalette[0x10]];
				for(let p=0; p<256; p++, tmpDist += 4) {
					tmpImageData[tmpDist] = tmpPal[0];
					tmpImageData[tmpDist + 1] = tmpPal[1];
					tmpImageData[tmpDist + 2] = tmpPal[2];
				}
			}
		}
	}

	if(this.Sprite0Line && (tmpIO1[0x02] & 0x40) != 0x40) {
		let i = this.PpuX > 255 ? 255 : this.PpuX;
		for(; tmpx<=i; tmpx++) {
			if(tmpSpLine[tmpx] == 0) {
				tmpIO1[0x02] |= 0x40;
				break;
			}
		}
	}
}


FC.prototype.BuildBGLine_SUB = function () {
	let tmpBgLineBuffer = this.BgLineBuffer;
	let tmpVRAM = this.VRAM;
	let nameAddr = 0x2000 | (this.PPUAddress & 0x0FFF);
	let tableAddr = ((this.PPUAddress & 0x7000) >> 12) | (this.IO1[0x00] & 0x10) << 8;
	let nameAddrHigh = nameAddr >> 10;
	let nameAddrLow = nameAddr & 0x03FF;
	let tmpVRAMHigh = tmpVRAM[nameAddrHigh];
	let tmpSPBitArray = this.SPBitArray;
	let tmpAttrTable = this.PPUAddrAttrTable;
	let tmpAttrDataTable = this.PPUAddrAttrDataTable;

	let q = 0;
	let s = this.HScrollTmp;

	for(let p=0; p<33; p++) {
		let ptnDist = (tmpVRAMHigh[nameAddrLow] << 4) | tableAddr;
		let tmpSrcV = tmpVRAM[ptnDist >> 10];
		ptnDist &= 0x03FF;
		let attr = tmpAttrDataTable[nameAddrLow][tmpVRAMHigh[tmpAttrTable[nameAddrLow]]];
		let ptn = tmpSPBitArray[tmpSrcV[ptnDist]][tmpSrcV[ptnDist + 8]];

		for(; s<8; s++, q++)
			tmpBgLineBuffer[q] = ptn[s] | attr;
		s = 0;

		if((nameAddrLow & 0x001F) == 0x001F) {
			nameAddrLow &= 0xFFE0;
			tmpVRAMHigh = tmpVRAM[(nameAddrHigh ^= 0x01)];
		} else
			nameAddrLow++;
	}
}


FC.prototype.BuildSpriteLine_SUB = function () {
	let tmpBgLineBuffer = this.BgLineBuffer;
	let tmpIsSpriteClipping = (this.IO1[0x01] & 0x04) == 0x04 ? 0 : 8;

	if((this.IO1[0x01] & 0x10) == 0x10) {
		let tmpSpLine = this.SpriteLineBuffer;
		for(let p=0; p<256; p++)
			tmpSpLine[p] = 256;

		let tmpSpRAM = this.SPRITE_RAM;
		let tmpBigSize = (this.IO1[0x00] & 0x20) == 0x20 ? 16 : 8;
		let tmpSpPatternTableAddress = (this.IO1[0x00] & 0x08) << 9;

		let tmpVRAM = this.VRAM;
		let tmpSPBitArray = this.SPBitArray;

		let lineY = this.PpuY;
		let count = 0;

		for(let i=0; i<=252; i+=4) {
			let isy = tmpSpRAM[i] + 1;
			if(isy > lineY || (isy + tmpBigSize) <= lineY)
				continue;

			if(i == 0)
				this.Sprite0Line = true;

			if(++count == 9 && this.SpriteLimit)
				break;

			let x = tmpSpRAM[i + 3];
			let ex = x + 8;
			if(ex > 256)
				ex = 256;

			let attr = tmpSpRAM[i + 2];

			let attribute = ((attr & 0x03) << 2) | 0x10;
			let bgsp = (attr & 0x20) == 0x00;

			let iy = (attr & 0x80) == 0x80 ? tmpBigSize - 1 - (lineY - isy) : lineY - isy;
			let tileNum = ((iy & 0x08) << 1) + (iy & 0x07) +
				(tmpBigSize == 8 ? (tmpSpRAM[i + 1] << 4) + tmpSpPatternTableAddress : ((tmpSpRAM[i + 1] & 0xFE) << 4) + ((tmpSpRAM[i + 1] & 0x01) << 12));
			let tmpHigh = tmpVRAM[tileNum >> 10];
			let tmpLow = tileNum & 0x03FF;
			let ptn = tmpSPBitArray[tmpHigh[tmpLow]][tmpHigh[tmpLow + 8]];

			let is;
			let ia;
			if((attr & 0x40) == 0x00) {
				is = 0;
				ia = 1;
			} else {
				is = 7;
				ia = -1;
			}

			for(; x<ex; x++, is+=ia) {
				let tmpPtn = ptn[is];
				if(tmpPtn != 0x00 && tmpSpLine[x] == 256) {
					tmpSpLine[x] = i;
					if(x >= tmpIsSpriteClipping && (bgsp || (tmpBgLineBuffer[x] & 0x03) == 0x00))
							tmpBgLineBuffer[x] = tmpPtn | attribute;
				}
			}
		}

		if(count >= 9)
			this.IO1[0x02] |= 0x20;
		else
			this.IO1[0x02] &= 0xDF;
	}
}


FC.prototype.WriteScrollRegister = function (value) {
	this.IO1[0x05] = value;

	if(this.ScrollRegisterFlag) {
		this.PPUAddressBuffer = (this.PPUAddressBuffer & 0x8C1F) | ((value & 0xF8) << 2) | ((value & 0x07) << 12);
	} else {
		this.PPUAddressBuffer = (this.PPUAddressBuffer & 0xFFE0) | ((value & 0xF8) >> 3);
		this.HScrollTmp = value & 7;
	}
	this.ScrollRegisterFlag = !this.ScrollRegisterFlag;
}


FC.prototype.WritePPUControlRegister0 = function (value) {
	this.IO1[0x00] = value;

	this.PPUAddressBuffer = (this.PPUAddressBuffer & 0xF3FF) | ((value & 0x03) << 10);
}


FC.prototype.WritePPUControlRegister1 = function (value) {
	this.IO1[0x01] = value;
}


FC.prototype.WritePPUAddressRegister = function (value) {
	this.IO1[0x06] = value;

	if(this.PPUAddressRegisterFlag)
		this.PPUAddress = this.PPUAddressBuffer = (this.PPUAddressBuffer & 0xFF00) | value;
	else
		this.PPUAddressBuffer = (this.PPUAddressBuffer & 0x00FF) | ((value & 0x3F) << 8);
	this.PPUAddressRegisterFlag = !this.PPUAddressRegisterFlag;
}


FC.prototype.ReadPPUStatus = function () {
	let result = this.IO1[0x02];
	this.IO1[0x02] &= 0x7F;
	this.ScrollRegisterFlag = false;
	this.PPUAddressRegisterFlag = false;
	return result;
}


FC.prototype.ReadPPUData_SUB = function () {
	let tmp = this.PPUReadBuffer;
	let addr = this.PPUAddress & 0x3FFF;

	if(addr < 0x3000)
		this.PPUReadBuffer = this.VRAM[addr >> 10][addr & 0x03FF];
	else if(addr < 0x3F00)
		this.PPUReadBuffer = this.VRAM[(addr - 0x1000) >> 10][(addr - 0x1000) & 0x03FF];
	else
		tmp = this.PPUReadBuffer = this.VRAM[0x0F][addr & 0x031F];

	this.PPUAddress = (this.PPUAddress + ((this.IO1[0x00] & 0x04) == 0x04 ? 32 : 1)) & 0xFFFF;

	return tmp;
}


FC.prototype.WritePPUData_SUB = function (value) {
	this.IO1[0x07] = value;

	let tmpPPUAddress = this.PPUAddress & 0x3FFF;

	if(tmpPPUAddress < 0x2000) {
		if(this.PPUChrAreaWrite)
			this.VRAM[tmpPPUAddress >> 10][tmpPPUAddress & 0x03FF] = value;
	} else if(tmpPPUAddress < 0x3000) {
		this.VRAM[tmpPPUAddress >> 10][tmpPPUAddress & 0x03FF] = value;
	} else if(tmpPPUAddress < 0x3F00) {
		this.VRAM[(tmpPPUAddress - 0x1000) >> 10][(tmpPPUAddress - 0x1000) & 0x03FF] = value;
	} else {
		let palNo = tmpPPUAddress & 0x001F;
		value &= 0x3F;
		if((palNo & 0x03) == 0x00) {
			this.VRAM[0x0F][0x0300 | palNo & 0x0C] = value;
			this.VRAM[0x0F][0x0310 | palNo & 0x0C] = value;
			if(palNo == 0x00 || palNo == 0x10)
				this.Palette[0x00] = this.Palette[0x04] = this.Palette[0x08] = this.Palette[0x0C] = this.Palette[0x10] = value;
		} else {
			this.VRAM[0x0F][0x0300 | palNo] = value;
			this.Palette[palNo] = value;
		}
	}

	this.PPUAddress = (this.PPUAddress + ((this.IO1[0x00] & 0x04) == 0x04 ? 32 : 1)) & 0xFFFF;
}


FC.prototype.WriteSpriteData = function (data){
	this.SPRITE_RAM[this.IO1[0x03]] = data;
	this.IO1[0x03] = (this.IO1[0x03] + 1) & 0xFF;
}


FC.prototype.WriteSpriteAddressRegister = function (data) {
	this.IO1[0x03] = data;
}


FC.prototype.StartDMA = function (data) {
	let offset = data << 8;
	let tmpDist = this.SPRITE_RAM;
	let tmpSrc = this.RAM;
	let adr = this.IO1[0x03];
	for(let i = 0; i < 0x100; i++, offset++)
		tmpDist[(adr + i) & 0xFF] = tmpSrc[offset];
	this.CPUClock += 513;
}

/* **** FC Header **** */
FC.prototype.ParseHeader = function () {
	if(this.Rom.length < 0x10 || this.Rom[0] != 0x4E || this.Rom[1] != 0x45 ||  this.Rom[2] != 0x53 || this.Rom[3] != 0x1A)
		return false;

	this.PrgRomPageCount = this.Rom[4]
	this.ChrRomPageCount = this.Rom[5];
	this.HMirror  = (this.Rom[6] & 0x01) == 0;
	this.VMirror  = (this.Rom[6] & 0x01) != 0;
	this.SramEnable = (this.Rom[6] & 0x02) != 0;
	this.TrainerEnable = (this.Rom[6] & 0x04) != 0;
	this.FourScreen = (this.Rom[6] & 0x08) != 0;
	this.MapperNumber = (this.Rom[6] >> 4) | (this.Rom[7] & 0xF0);

	return true;
}


/* **** FC Storage **** */
FC.prototype.StorageClear = function () {
	let i;

	this.RAM.fill(0);

	this.INNERSRAM.fill(0);
	this.SRAM = this.INNERSRAM;

	this.PRGROM_STATE.fill(0);
	this.CHRROM_STATE.fill(0);

	for(i=0; i<this.VRAMS.length; i++) {
		this.VRAMS[i].fill(0);
		this.SetChrRomPage1K(i, i + 0x0100);
	}

	this.SPRITE_RAM.fill(0);

	for(i=0; i<this.ROM_RAM.length; i++) {
		this.ROM_RAM[i].fill(0);
		this.SetPrgRomPage8K(i, -(i + 1));
	}

	this.IO1.fill(0);
	this.IO2.fill(0);
	this.IO2[0x17] = 0x40;
}


FC.prototype.SetRom = function (rom) {
	this.Rom = rom.concat(0);
}


FC.prototype.StorageInit = function () {
	this.PRGROM_PAGES = null;
	this.CHRROM_PAGES = null;

	let i;
	this.PRGROM_PAGES = new Array(this.PrgRomPageCount * 2);
	for(i=0; i< this.PrgRomPageCount * 2; i++)
		this.PRGROM_PAGES[i] = this.Rom.slice(i * 0x2000 + 0x0010, i * 0x2000 + 0x2010);

	if(this.ChrRomPageCount > 0) {
		this.CHRROM_PAGES = new Array(this.ChrRomPageCount * 8);
		for(i=0; i< this.ChrRomPageCount * 8; i++)
			this.CHRROM_PAGES[i] = this.Rom.slice(this.PrgRomPageCount * 0x4000 + i * 0x0400 + 0x0010,
							this.PrgRomPageCount * 0x4000 + i * 0x0400 + 0x0410);
	}
}


FC.prototype.Get = function (address) {
	switch(address & 0xE000) {
		case 0x0000:
			return this.RAM[address & 0x7FF];
		case 0x2000:
			switch (address & 0x07) {
				case 0x02:
					return this.ReadPPUStatus();
				case 0x07:
					return this.Mapper.ReadPPUData();
			}
			return 0;
		case 0x4000:
			switch (address) {
				case 0x4015:
					return this.ReadWaveControl();
				case 0x4016:
					return this.ReadJoyPadRegister1();
				case 0x4017:
					return this.ReadJoyPadRegister2();
				default:
					return this.Mapper.ReadLow(address);
			}
		case 0x6000:
			return this.Mapper.ReadSRAM(address);
		case 0x8000:
			return this.ROM0[address & 0x1FFF];
		case 0xA000:
			return this.ROM1[address & 0x1FFF];
		case 0xC000:
			return this.ROM2[address & 0x1FFF];
		case 0xE000:
			return this.ROM3[address & 0x1FFF];
	}
}


FC.prototype.Get16 = function (address) {
	return this.Get(address) | (this.Get(address + 1) << 8);
}


FC.prototype.Set = function (address, data) {
	switch(address & 0xE000) {
		case 0x0000:
			this.RAM[address & 0x7FF] = data;
			return;
		case 0x2000:
			switch (address & 0x07) {
				case 0:
					this.WritePPUControlRegister0(data);
					return;
				case 1:
					this.WritePPUControlRegister1(data);
					return;
				case 2:
					return;
				case 3:
					this.WriteSpriteAddressRegister(data);
					return;
				case 4:
					this.WriteSpriteData(data);
					return;
				case 5:
					this.WriteScrollRegister(data);
					return;
				case 6:
					this.WritePPUAddressRegister(data);
					return;
				case 7:
					this.Mapper.WritePPUData(data);
					return;
			}
		case 0x4000:
			if(address < 0x4020) {
				this.IO2[address & 0x00FF] = data;
				switch (address) {
					case 0x4002:
						this.WriteCh1Length0();
						return;
					case 0x4003:
						this.WriteCh1Length1();
						return;
					case 0x4006:
						this.WriteCh2Length0();
						return;
					case 0x4007:
						this.WriteCh2Length1();
						return;
					case 0x4008:
						this.WriteCh3LinearCounter();
						return;
					case 0x400B:
						this.WriteCh3Length1();
						return;
					case 0x400F:
						this.WriteCh4Length1();
						return;
					case 0x4010:
						this.WriteCh5DeltaControl();
						return;
					case 0x4011:
						this.WriteCh5DeltaCounter();
						return;
					case 0x4014:
						this.StartDMA(data);
						return;
					case 0x4015:
						this.WriteWaveControl();
						return;
					case 0x4016:
						this.WriteJoyPadRegister1(data);
						return;
				}
				return;
			}
			this.Mapper.WriteLow(address, data);
			return;
		case 0x6000:
			this.Mapper.WriteSRAM(address, data);
			return;
		case 0x8000:
		case 0xA000:
		case 0xC000:
		case 0xE000:
			this.Mapper.Write(address, data);
			return;
	}
}


FC.prototype.SetPrgRomPage8K = function (page, romPage){
	if(romPage < 0) {
		this.PRGROM_STATE[page] = romPage;
		this.ROM[page] = this.ROM_RAM[-(romPage + 1)];
	} else {
		this.PRGROM_STATE[page] = romPage % (this.PrgRomPageCount * 2);
		this.ROM[page] = this.PRGROM_PAGES[this.PRGROM_STATE[page]];
	}

	this.ROM0 = this.ROM[0];
	this.ROM1 = this.ROM[1];
	this.ROM2 = this.ROM[2];
	this.ROM3 = this.ROM[3];
}


FC.prototype.SetPrgRomPages8K = function (romPage0, romPage1, romPage2, romPage3){
	this.SetPrgRomPage8K(0, romPage0);
	this.SetPrgRomPage8K(1, romPage1);
	this.SetPrgRomPage8K(2, romPage2);
	this.SetPrgRomPage8K(3, romPage3);
}


FC.prototype.SetPrgRomPage = function (no, num){
	this.SetPrgRomPage8K(no * 2, num * 2);
	this.SetPrgRomPage8K(no * 2 + 1, num * 2 + 1);
}


/* **** FC JoyPad **** */
FC.prototype.WriteJoyPadRegister1 = function (value) {
	let s = (value & 0x01) == 0x01;
	if(this.JoyPadStrobe && !s) {
		this.JoyPadBuffer[0] = this.JoyPadState[0];
		this.JoyPadBuffer[1] = this.JoyPadState[1];
	}
	this.JoyPadStrobe = s;
}


FC.prototype.ReadJoyPadRegister1 = function () {
	let result = this.JoyPadBuffer[0] & 0x01 | (this.MicrophoneLevel >= 0.1 ? 0x04 : 0x00);
	this.JoyPadBuffer[0] >>>= 1;
	return result;
}


FC.prototype.ReadJoyPadRegister2 = function () {
	let result = this.JoyPadBuffer[1] & 0x01;
	this.JoyPadBuffer[1] >>>= 1;
	return result;
}


FC.prototype.KeyUpFunction = function (evt){
	switch (evt.keyCode){
		//1CON
		case 88:// A
			this.JoyPadState[0] &= ~0x01;
			break;
		case 90:// B
			this.JoyPadState[0] &= ~0x02;
			break;
		case 65:// SELECT
			this.JoyPadState[0] &= ~0x04;
			break;
		case 83:// START
			this.JoyPadState[0] &= ~0x08;
			break;
		case 38:// UP
			this.JoyPadState[0] &= ~0x10;
			break;
		case 40:// DOWN
			this.JoyPadState[0] &= ~0x20;
			break;
		case 37:// LEFT
			this.JoyPadState[0] &= ~0x40;
			break;
		case 39:// RIGHT
			this.JoyPadState[0] &= ~0x80;
			break;

		//2CON
		case 105:// A
			this.JoyPadState[1] &= ~0x01;
			break;
		case 103:// B
			this.JoyPadState[1] &= ~0x02;
			break;
		case 104:// UP
			this.JoyPadState[1] &= ~0x10;
			break;
		case 98:// DOWN
			this.JoyPadState[1] &= ~0x20;
			break;
		case 100:// LEFT
			this.JoyPadState[1] &= ~0x40;
			break;
		case 102:// RIGHT
			this.JoyPadState[1] &= ~0x80;
			break;
	}
	evt.preventDefault();
}


FC.prototype.KeyDownFunction = function (evt){
	switch (evt.keyCode){
		//1CON
		case 88:// A
			this.JoyPadState[0] |= 0x01;
			break;
		case 90:// B
			this.JoyPadState[0] |= 0x02;
			break;
		case 65:// SELECT
			this.JoyPadState[0] |= 0x04;
			break;
		case 83:// START
			this.JoyPadState[0] |= 0x08;
			break;
		case 38:// UP
			this.JoyPadState[0] |= 0x10;
			break;
		case 40:// DOWN
			this.JoyPadState[0] |= 0x20;
			break;
		case 37:// LEFT
			this.JoyPadState[0] |= 0x40;
			break;
		case 39:// RIGHT
			this.JoyPadState[0] |= 0x80;
			break;

		//2CON
		case 105:// A
			this.JoyPadState[1] |= 0x01;
			break;
		case 103:// B
			this.JoyPadState[1] |= 0x02;
			break;
		case 104:// UP
			this.JoyPadState[1] |= 0x10;
			break;
		case 98:// DOWN
			this.JoyPadState[1] |= 0x20;
			break;
		case 100:// LEFT
			this.JoyPadState[1] |= 0x40;
			break;
		case 102:// RIGHT
			this.JoyPadState[1] |= 0x80;
			break;
	}
	evt.preventDefault();
}


FC.prototype.JoyPadInit = function () {
	this.JoyPadKeyUpFunction = this.KeyUpFunction.bind(this);
	this.JoyPadKeyDownFunction = this.KeyDownFunction.bind(this);
	document.addEventListener("keyup", this.JoyPadKeyUpFunction, true);
	document.addEventListener("keydown", this.JoyPadKeyDownFunction, true);
}


FC.prototype.JoyPadRelease = function () {
	document.removeEventListener("keyup", this.JoyPadKeyUpFunction, true);
	document.removeEventListener("keydown", this.JoyPadKeyDownFunction, true);
}


FC.prototype.CheckGamePad = function () {
	if(!this.Use_GetGamepads)
		return;

	let pads = navigator.getGamepads();
	for(let i=0; i<2; i++) {
		let pad = pads[i];
		let paddata;
		if(typeof pad !== "undefined" && pad !== null) {
			this.JoyPadState[i] = 0x00;

			if(pad.mapping === "standard")
				paddata = this.GamePadData["STANDARD PAD"];
			else {
				paddata = this.GamePadData[pad.id];
				if(typeof paddata === "undefined")
					paddata = this.GamePadData["UNKNOWN PAD"];
			}

			let tmp = 0x01;
			for(const val0 of paddata) {
				for(const val1 of val0) {
					switch(val1.type) {
						case "B":
							if(pad.buttons[val1.index].pressed)
								this.JoyPadState[i] |= tmp;
							break;
						case "A-":
							if(pad.axes[val1.index] < -0.5)
								this.JoyPadState[i] |= tmp;
							break;
						case "A+":
							if(pad.axes[val1.index] > 0.5)
								this.JoyPadState[i] |= tmp;
							break;
						case "AB":
							if(pad.axes[val1.index] > -0.75)
								this.JoyPadState[i] |= tmp;
							break;
						case "P":
							let povtmp = ((pad.axes[val1.index] + 1) * 7 / 2 + 0.5) | 0;
							this.JoyPadState[i] |= povtmp <= 7 ? this.GamePadPovData[povtmp] : 0x00;
							break;
					}
				}
				tmp <<= 1;
			}
		}
	}
}


/* **** FC APU **** */
FC.prototype.AudioInit = function () {
	if(this.WebAudioCtx != null)
		return true;

	if(this.Use_AudioContext) {
		this.WebAudioCtx = new window.AudioContext();
		this.WebAudioJsNode = this.WebAudioCtx.createScriptProcessor(this.WebAudioBufferSize, 1, 1);
		this.WebAudioJsNode.onaudioprocess = this.WebAudioFunction.bind(this);
		this.WebAudioGainNode = this.WebAudioCtx.createGain();
		this.WebAudioGainNode.gain.value = this.WaveVolume;
		this.WebAudioJsNode.connect(this.WebAudioGainNode);
		this.WebAudioGainNode.connect(this.WebAudioCtx.destination);
		this.WaveSampleRate = this.WebAudioCtx.sampleRate;
		return true;
	}

	return false;
}


FC.prototype.MicrophoneFunction = function (e) {
	let output = e.outputBuffer.getChannelData(0);
	let input = e.inputBuffer.getChannelData(0);

	if(this.isMicrophone)
		this.MicrophoneLevel = Math.max(...input);
	else
		this.MicrophoneLevel = 0.0;

	if(this.isMicrophone && this.MicrophoneOut) {
		output.set(input);
	} else {
		for (let i=0; i<output.length; i++)
			output[i] = 0.0;
	}
}


FC.prototype.MicrophoneStart = function () {
	this.isMicrophone = false;

	if(!this.AudioInit())
		return;

	if(navigator.mediaDevices.getUserMedia) {
		if(this.MicrophoneStream == null) {
			this.MicrophoneStream = navigator.mediaDevices.getUserMedia({ audio: true, video: false });
			this.MicrophoneStream.then((stream) => {
					this.isMicrophone = true;

					this.MicrophoneSource = this.WebAudioCtx.createMediaStreamSource(stream);
					this.MicrophoneJsNode = this.WebAudioCtx.createScriptProcessor(this.WebAudioBufferSize, 1, 1);
					this.MicrophoneJsNode.onaudioprocess = this.MicrophoneFunction.bind(this);
					this.MicrophoneGainNode = this.WebAudioCtx.createGain();
					this.MicrophoneGainNode.gain.value = this.MicrophoneVolume;

					this.MicrophoneSource.connect(this.MicrophoneGainNode);
					this.MicrophoneGainNode.connect(this.MicrophoneJsNode);
					this.MicrophoneJsNode.connect(this.WebAudioGainNode);
				},
				() => {
				}
			);
		} else
			this.isMicrophone = true;
	}
}


FC.prototype.MicrophoneStop = function () {
	this.isMicrophone = false;
}


FC.prototype.MicrophoneSpeaker = function (value) {
	this.MicrophoneOut = value;
}


FC.prototype.SetMicrophoneVolume = function (value) {
	this.MicrophoneVolume = value;
	if(this.MicrophoneStream != null)
		this.MicrophoneGainNode.gain.value = this.MicrophoneVolume;
}


FC.prototype.SetWebAudioVolume = function (value) {
	this.WaveVolume = value;
	if(this.WebAudioCtx != null)
		this.WebAudioGainNode.gain.value = this.WaveVolume;
}


FC.prototype.WebAudioFunction = function (e) {
	let output = e.outputBuffer.getChannelData(0);
	let data;
	let len;
	let i;

	if(!this.WaveProcessing) {
		for (let i=0; i<output.length; i++)
			output[i] = 0.0;
	} else if(this.WaveDatas.length > 0) {
		len = this.WaveDatas.length > this.WebAudioBufferSize ? this.WebAudioBufferSize : this.WaveDatas.length;
		data = new Float32Array(len);
		for(i=0; i<len; i++)
			data[i] = this.WaveDatas.shift() / (128 * 32);
		output.set(data);
	}

	this.WaveProcessing = false;
}


FC.prototype.isSuspend = function () {
	if(this.WebAudioCtx != null) {
		if(this.WebAudioCtx.state === 'running')
			return false;
		if(this.WebAudioCtx.state === 'suspended')
			return true;
	}
	return false;
}


FC.prototype.Suspend = function () {
	if(this.WebAudioCtx != null) {
		this.WebAudioCtx.suspend();
		return true;
	}
	return false;
}


FC.prototype.Resume = function () {
	if(this.WebAudioCtx != null) {
		this.WebAudioCtx.resume();
		return true;
	}
	return false;
}


FC.prototype.ReadWaveControl = function () {
	let tmp = 0x00;
	if(this.WaveCh1LengthCounter != 0)
		tmp |= 0x01;

	if(this.WaveCh2LengthCounter != 0)
		tmp |= 0x02;

	if(this.WaveCh3LengthCounter != 0)
		tmp |= 0x04;

	if(this.WaveCh4LengthCounter != 0)
		tmp |= 0x08;

	if(this.WaveCh5SampleCounter != 0)
		tmp |= 0x10;

	tmp |= this.toIRQ & 0xC0;

	this.toIRQ &= ~0x40;

	return tmp;
}


FC.prototype.WriteWaveControl = function () {
	let tmp = this.IO2[0x15];

	if((tmp & 0x01) != 0x01)
		this.WaveCh1LengthCounter = 0;

	if((tmp & 0x02) != 0x02)
		this.WaveCh2LengthCounter = 0;

	if((tmp & 0x04) != 0x04)
		this.WaveCh3LengthCounter = 0;

	if((tmp & 0x08) != 0x08)
		this.WaveCh4LengthCounter = 0;

	if((tmp & 0x10) != 0x10) {
		this.WaveCh5SampleCounter = 0;
		this.toIRQ &= ~0x80;
	} else if(this.WaveCh5SampleCounter == 0) {
		this.SetCh5Delta();
	}
}


FC.prototype.WriteCh1Length0 = function () {
	this.WaveCh1Frequency = ((this.IO2[0x03] & 0x07) << 8) + this.IO2[0x02] + 1;
}


FC.prototype.WriteCh1Length1 = function () {
	this.WaveCh1LengthCounter = this.WaveLengthCount[this.IO2[0x03] >> 3];
	this.WaveCh1Envelope = 0;
	this.WaveCh1EnvelopeCounter = 0x0F;
	this.WaveCh1Sweep = 0;
	this.WaveCh1Frequency = ((this.IO2[0x03] & 0x07) << 8) + this.IO2[0x02] + 1;
}


FC.prototype.WriteCh2Length0 = function () {
	this.WaveCh2Frequency = ((this.IO2[0x07] & 0x07) << 8) + this.IO2[0x06] + 1;
}


FC.prototype.WriteCh2Length1 = function () {
	this.WaveCh2LengthCounter = this.WaveLengthCount[this.IO2[0x07] >> 3];
	this.WaveCh2Envelope = 0;
	this.WaveCh2EnvelopeCounter = 0x0F;
	this.WaveCh2Sweep = 0;
	this.WaveCh2Frequency = ((this.IO2[0x07] & 0x07) << 8) + this.IO2[0x06] + 1;
}


FC.prototype.WriteCh3LinearCounter = function (){
	this.WaveCh3LinearCounter = this.IO2[0x08] & 0x7F;
}


FC.prototype.WriteCh3Length1 = function () {
	this.WaveCh3LengthCounter = this.WaveLengthCount[this.IO2[0x0B] >> 3];
	this.WaveCh3LinearCounter = this.IO2[0x08] & 0x7F;
}


FC.prototype.WriteCh4Length1 = function () {
	this.WaveCh4LengthCounter = this.WaveLengthCount[this.IO2[0x0F] >> 3];
	this.WaveCh4Envelope = 0;
	this.WaveCh4EnvelopeCounter = 0x0F;
}


FC.prototype.WriteCh5DeltaControl = function () {
	if((this.IO2[0x10] & 0x80) != 0x80)
		this.toIRQ &= ~0x80;
}


FC.prototype.WriteCh5DeltaCounter = function () {
	this.WaveCh5DeltaCounter = this.IO2[0x11] & 0x7F;
}


FC.prototype.SetCh5Delta = function () {
	let tmpIO2 = this.IO2;
	this.WaveCh5DeltaCounter = tmpIO2[0x11] & 0x7F;
	this.WaveCh5SampleAddress = (tmpIO2[0x12] << 6) + 0xC000;
	this.WaveCh5SampleCounter = ((tmpIO2[0x13] << 4) + 1) << 3;
	this.WaveCh5Register = 0;
	this.toIRQ &= ~0x80;
}


FC.prototype.ApuInit = function () {
	this.WaveProcessing = false;

	this.WaveFrameSequence = 0;

	this.WaveCh1LengthCounter = 0;
	this.WaveCh1Envelope = 0;
	this.WaveCh1EnvelopeCounter = 0;
	this.WaveCh1Sweep = 0;
	this.WaveCh1Frequency = 0;
	this.WaveCh1Counter = 0;
	this.WaveCh1WaveCounter = 0;

	this.WaveCh2LengthCounter = 0;
	this.WaveCh2Envelope = 0;
	this.WaveCh2EnvelopeCounter = 0;
	this.WaveCh2Sweep = 0;
	this.WaveCh2Frequency = 0;
	this.WaveCh2Counter = 0;
	this.WaveCh2WaveCounter = 0;

	this.WaveCh3LengthCounter = 0;
	this.WaveCh3LinearCounter = 0;
	this.WaveCh3Counter = 0;
	this.WaveCh3WaveCounter = 0;

	this.WaveCh4LengthCounter = 0;
	this.WaveCh4Envelope = 0;
	this.WaveCh4EnvelopeCounter = 0;
	this.WaveCh4Register = 1;
	this.WaveCh4BitSequence = 0;
	this.WaveCh4Counter = 0;

	this.WaveCh5DeltaCounter = 0;
	this.WaveCh5Register = 0;
	this.WaveCh5SampleAddress = 0;
	this.WaveCh5SampleCounter = 0;
	this.WaveCh5Counter = 0;

	this.ApuClockCounter = 0;

	this.WaveFrameSequenceCounter = 0;

	this.WaveDatas = new Array();

	this.ApuCpuClockCounter = 0;
}


FC.prototype.WaveFrameSequencer = function () {
	this.WaveFrameSequenceCounter += 240;
	if(this.WaveFrameSequenceCounter >= this.MainClock) {
		this.WaveFrameSequenceCounter -= this.MainClock;

		if((this.IO2[0x17] & 0x80) == 0x00) {
			this.WaveCh1_2_4_Envelope_WaveCh3_Linear();
			if(this.WaveFrameSequence == 1 || this.WaveFrameSequence == 3)
				this.WaveCh1_2_3_4_Length_WaveCh1_2_Sweep();
			if(this.WaveFrameSequence == 3 && (this.IO2[0x17] & 0x40) == 0x00)
				this.toIRQ |= 0x40;
			this.WaveFrameSequence = ++this.WaveFrameSequence & 0x03;
		} else {
			if(this.WaveFrameSequence != 4)
				this.WaveCh1_2_4_Envelope_WaveCh3_Linear();
			if(this.WaveFrameSequence == 0 || this.WaveFrameSequence == 2)
				this.WaveCh1_2_3_4_Length_WaveCh1_2_Sweep();
			this.WaveFrameSequence = ++this.WaveFrameSequence % 5;
		}
	}
}


FC.prototype.WaveSequencer = function () {
	let tmpIO2 = this.IO2;
	let ch3freq = 0;
	let ch4freq = 0;
	let ch5freq = 0;

	if(this.WaveCh1Frequency > 8) {
		this.WaveCh1Counter += 2;
		if(this.WaveCh1Counter >= this.WaveCh1Frequency) {
			this.WaveCh1WaveCounter = (this.WaveCh1WaveCounter + 1) & 0x1F;
			this.WaveCh1Counter -= this.WaveCh1Frequency;
		}
	}

	if(this.WaveCh2Frequency > 8) {
		this.WaveCh2Counter += 2;
		if(this.WaveCh2Counter >= this.WaveCh2Frequency) {
			this.WaveCh2WaveCounter = (this.WaveCh2WaveCounter + 1) & 0x1F;
			this.WaveCh2Counter -= this.WaveCh2Frequency;
		}
	}

	ch3freq = ((tmpIO2[0x0B] & 0x07) << 8) + tmpIO2[0x0A] + 1;
	if(ch3freq > 8) {
		this.WaveCh3Counter += 1;
		if(this.WaveCh3Counter >= ch3freq) {
			this.WaveCh3WaveCounter = (this.WaveCh3WaveCounter + 1) & 0x1F;
			this.WaveCh3Counter -= ch3freq;
		}
	}

	ch4freq = this.WaveCh4FrequencyData[tmpIO2[0x0E] & 0x0F];
	this.WaveCh4Counter += 1;
	if(this.WaveCh4Counter >= ch4freq) {
		this.WaveCh4Counter -= ch4freq;
		this.WaveCh4Register = (tmpIO2[0x0E] & 0x80) == 0x80 ?
				(this.WaveCh4Register >> 1) | ((((this.WaveCh4Register >> 6) ^ this.WaveCh4Register) & 0x0001) << 14) :
				(this.WaveCh4Register >> 1) | ((((this.WaveCh4Register >> 1) ^ this.WaveCh4Register) & 0x0001) << 14);
	}

	if(this.WaveCh5SampleCounter != 0) {
		ch5freq = this.WaveCh5FrequencyData[tmpIO2[0x10] & 0x0F];
		this.WaveCh5Counter += 1;
		if(this.WaveCh5Counter >= ch5freq) {
			this.WaveCh5Counter -= ch5freq;

			if((this.WaveCh5SampleCounter & 0x0007) == 0) {
				if(this.WaveCh5SampleCounter != 0){
					this.WaveCh5Register = this.Get(this.WaveCh5SampleAddress++);
					this.CPUClock += 4;
				}
			}

			if(this.WaveCh5SampleCounter != 0) {
				if((this.WaveCh5Register & 0x01) == 0x00) {
					if(this.WaveCh5DeltaCounter > 1)
						this.WaveCh5DeltaCounter -= 2;
				} else {
					if(this.WaveCh5DeltaCounter < 126)
						this.WaveCh5DeltaCounter += 2;
				}
				this.WaveCh5Register >>= 1;
				this.WaveCh5SampleCounter--;
			}
		}

		if(this.WaveCh5SampleCounter == 0) {
			if((tmpIO2[0x10] & 0x40) == 0x40)
				this.SetCh5Delta();
			else
				this.toIRQ |= tmpIO2[0x10] & 0x80;
		}
	}
}


FC.prototype.ApuRun = function () {
	let tmpIO2 = this.IO2;
	let all_out = 0;
	let ch3freq = 0;

	ch3freq = ((tmpIO2[0x0B] & 0x07) << 8) + tmpIO2[0x0A] + 1;

	for(let i=0; i<this.CPUClock; i++) {
		this.WaveFrameSequencer();
		this.WaveSequencer();

		this.ApuClockCounter += this.WaveSampleRate;
		if(this.ApuClockCounter >= this.MainClock) {
			this.ApuClockCounter -= this.MainClock;

			all_out = 0;

			if(this.WaveCh1LengthCounter != 0 && this.WaveCh1Frequency > 8)
				all_out += ((tmpIO2[0x00] & 0x10) == 0x10 ? (tmpIO2[0x00] & 0x0F) : this.WaveCh1EnvelopeCounter) * (this.WaveCh1WaveCounter < this.WaveCh1_2DutyData[(tmpIO2[0x00] & 0xC0) >> 6] ? 1 : -1);

			if(this.WaveCh2LengthCounter != 0 && this.WaveCh2Frequency > 8)
				all_out += ((tmpIO2[0x04] & 0x10) == 0x10 ? (tmpIO2[0x04] & 0x0F) : this.WaveCh2EnvelopeCounter) * (this.WaveCh2WaveCounter < this.WaveCh1_2DutyData[(tmpIO2[0x04] & 0xC0) >> 6] ? 1 : -1);

			if(this.WaveCh3LengthCounter != 0 && this.WaveCh3LinearCounter != 0 && ch3freq > 8)
				all_out += this.WaveCh3SequenceData[this.WaveCh3WaveCounter];

			if(this.WaveCh4LengthCounter != 0 && (this.WaveCh4Register & 0x0001) == 0x0000)
				all_out += (tmpIO2[0x0C] & 0x10) == 0x10 ? (tmpIO2[0x0C] & 0x0F) : this.WaveCh4EnvelopeCounter;

			all_out = (all_out + this.WaveCh5DeltaCounter) << 5;

			if(this.Use_AudioContext && this.WaveOut) {
				this.WaveDatas.push(all_out);
				if(this.WaveDatas.length >= this.WebAudioBufferSize * 2)
					this.WaveDatas = this.WaveDatas.slice(this.WebAudioBufferSize * 2);
				this.WebAudioGainNode.gain.value = this.WaveVolume;
			}
		}
	}
}


FC.prototype.WaveCh1_2_3_4_Length_WaveCh1_2_Sweep = function () {
	let tmpIO2 = this.IO2;

	if((tmpIO2[0x00] & 0x20) == 0x00 && this.WaveCh1LengthCounter != 0) {
		if(--this.WaveCh1LengthCounter == 0)
			tmpIO2[0x15] &= 0xFE;
	}

	if((tmpIO2[0x04] & 0x20) == 0x00 && this.WaveCh2LengthCounter != 0) {
		if(--this.WaveCh2LengthCounter == 0)
			tmpIO2[0x15] &= 0xFD;
	}

	if((tmpIO2[0x08] & 0x80) == 0x00 && this.WaveCh3LengthCounter != 0) {
		if(--this.WaveCh3LengthCounter == 0)
			tmpIO2[0x15] &= 0xFB;
	}

	if((tmpIO2[0x0C] & 0x20) == 0x00 && this.WaveCh4LengthCounter != 0) {
		if(--this.WaveCh4LengthCounter == 0)
			tmpIO2[0x15] &= 0xF7;
	}

	if(++this.WaveCh1Sweep == (((tmpIO2[0x01] & 0x70) >> 4) + 1)) {
		this.WaveCh1Sweep = 0;
		if((tmpIO2[0x01] & 0x80) == 0x80 && (tmpIO2[0x01] & 0x07) != 0x00 && this.WaveCh1LengthCounter != 0) {
			if((tmpIO2[0x01] & 0x08) == 0x00)
				this.WaveCh1Frequency += this.WaveCh1Frequency >> (tmpIO2[0x01] & 0x07);
			else
				this.WaveCh1Frequency += ~this.WaveCh1Frequency >> (tmpIO2[0x01] & 0x07);

			if(this.WaveCh1Frequency < 0x08 || this.WaveCh1Frequency > 0x7FF) {
				this.WaveCh1LengthCounter = 0;
				tmpIO2[0x15] &= 0xFE;
			}
		}
	}

	if(++this.WaveCh2Sweep == (((tmpIO2[0x05] & 0x70) >> 4) + 1)) {
		this.WaveCh2Sweep = 0;
		if((tmpIO2[0x05] & 0x80) == 0x80 && (tmpIO2[0x05] & 0x07) != 0x00 && this.WaveCh2LengthCounter != 0) {
			if((tmpIO2[0x05] & 0x08) == 0x00)
				this.WaveCh2Frequency += this.WaveCh2Frequency >> (tmpIO2[0x05] & 0x07);
			else
				this.WaveCh2Frequency += (~this.WaveCh2Frequency + 1) >> (tmpIO2[0x05] & 0x07);

			if(this.WaveCh2Frequency < 0x08 || this.WaveCh2Frequency > 0x7FF) {
				this.WaveCh2LengthCounter = 0;
				tmpIO2[0x15] &= 0xFD;
			}
		}
	}
}


FC.prototype.WaveCh1_2_4_Envelope_WaveCh3_Linear = function () {
	let tmpIO2 = this.IO2;

	if((tmpIO2[0x00] & 0x10) == 0x00) {
		if(++this.WaveCh1Envelope == ((tmpIO2[0x00] & 0x0F) + 1)) {
			this.WaveCh1Envelope = 0;
			if(this.WaveCh1EnvelopeCounter == 0) {
				if((tmpIO2[0x00] & 0x20) == 0x20)
					this.WaveCh1EnvelopeCounter = 0x0F;
			} else
				this.WaveCh1EnvelopeCounter--;
		}
	}

	if((tmpIO2[0x04] & 0x10) == 0x00) {
		if(++this.WaveCh2Envelope == ((tmpIO2[0x04] & 0x0F) + 1)) {
			this.WaveCh2Envelope = 0;
			if(this.WaveCh2EnvelopeCounter == 0) {
				if((tmpIO2[0x04] & 0x20) == 0x20)
					this.WaveCh2EnvelopeCounter = 0x0F;
			} else
				this.WaveCh2EnvelopeCounter--;
		}
	}

	if((tmpIO2[0x0C] & 0x10) == 0x00) {
		if(++this.WaveCh4Envelope == ((tmpIO2[0x0C] & 0x0F) + 1)) {
			this.WaveCh4Envelope = 0;
			if(this.WaveCh4EnvelopeCounter == 0) {
				if((tmpIO2[0x0C] & 0x20) == 0x20)
					this.WaveCh4EnvelopeCounter = 0x0F;
			} else
				this.WaveCh4EnvelopeCounter--;
		}
	}

	if((tmpIO2[0x08] & 0x80) == 0x00 && this.WaveCh3LinearCounter != 0)
		this.WaveCh3LinearCounter--;
}


/* **** FC Mapper **** */
/**** MapperPrototype ****/
FC.prototype.MapperPrototype = function(core) {
	this.Core = core;
	this.MAPPER_REG = null;
}

FC.prototype.MapperPrototype.prototype.Init = function() {
}

FC.prototype.MapperPrototype.prototype.ReadLow = function(address) {
	return 0x40;
}

FC.prototype.MapperPrototype.prototype.WriteLow = function(address, data) {
}

FC.prototype.MapperPrototype.prototype.ReadPPUData = function () {
	return this.Core.ReadPPUData_SUB();
}

FC.prototype.MapperPrototype.prototype.WritePPUData = function (value) {
	this.Core.WritePPUData_SUB(value);
}

FC.prototype.MapperPrototype.prototype.BuildBGLine = function () {
	this.Core.BuildBGLine_SUB();
}

FC.prototype.MapperPrototype.prototype.BuildSpriteLine = function () {
	this.Core.BuildSpriteLine_SUB();
}

FC.prototype.MapperPrototype.prototype.ReadSRAM = function(address) {
	return this.Core.SRAM[address & 0x1FFF];
}

FC.prototype.MapperPrototype.prototype.WriteSRAM = function(address, data) {
	this.Core.SRAM[address & 0x1FFF] = data;
}

FC.prototype.MapperPrototype.prototype.Write = function(address, data) {
}

FC.prototype.MapperPrototype.prototype.HSync = function(y) {
}

FC.prototype.MapperPrototype.prototype.CPUSync = function(clock) {
}

FC.prototype.MapperPrototype.prototype.SetIRQ = function() {
	this.Core.toIRQ |= 0x04;
}

FC.prototype.MapperPrototype.prototype.ClearIRQ = function() {
	this.Core.toIRQ &= ~0x04;
}


/**** Mapper0 ****/
FC.prototype.Mapper0 = function(core) {
	FC.prototype.MapperPrototype.apply(this, arguments);
}

FC.prototype.Mapper0.prototype = Object.create(FC.prototype.MapperPrototype.prototype);

FC.prototype.Mapper0.prototype.Init = function() {
	this.Core.SetPrgRomPage(0, 0);
	this.Core.SetPrgRomPage(1, this.Core.PrgRomPageCount - 1);
	this.Core.SetChrRomPage(0);
}


/**** Mapper1 ****/
FC.prototype.Mapper1 = function(core) {
	FC.prototype.MapperPrototype.apply(this, arguments);
	this.MAPPER_REG = new Array(16);
}

FC.prototype.Mapper1.prototype = Object.create(FC.prototype.MapperPrototype.prototype);

FC.prototype.Mapper1.prototype.Init = function() {
	this.Core.PPUChrAreaWrite = true;

	this.MAPPER_REG.fill(0);

	this.MAPPER_REG[13] = 0;
	this.MAPPER_REG[14] = 0x00;
	this.MAPPER_REG[0] = 0x0C;
	this.MAPPER_REG[1] = 0x00;
	this.MAPPER_REG[2] = 0x00;
	this.MAPPER_REG[3] = 0x00;

	if(this.Core.PrgRomPageCount == 64) {
		this.MAPPER_REG[10] = 2;
	} else if(this.Core.PrgRomPageCount == 32) {
		this.MAPPER_REG[10] = 1;
	} else {
		this.MAPPER_REG[10] = 0;
	}
	this.MAPPER_REG[11] = 0;
	this.MAPPER_REG[12] = 0;

	if(this.MAPPER_REG[10] == 0) {
		this.MAPPER_REG[8] = this.Core.PrgRomPageCount * 2 - 2;
		this.MAPPER_REG[9] = this.Core.PrgRomPageCount * 2 - 1;
	} else {
		this.MAPPER_REG[8] = 30;
		this.MAPPER_REG[9] = 31;
	}

	this.MAPPER_REG[4] = 0;
	this.MAPPER_REG[5] = 1;
	this.MAPPER_REG[6] = this.MAPPER_REG[8];
	this.MAPPER_REG[7] = this.MAPPER_REG[9];

	this.Core.SetPrgRomPages8K(this.MAPPER_REG[4], this.MAPPER_REG[5], this.MAPPER_REG[6], this.MAPPER_REG[7]);
}

FC.prototype.Mapper1.prototype.Write = function(address, data) {
	let reg_num;

	if((address & 0x6000) != (this.MAPPER_REG[15] & 0x6000)) {
		this.MAPPER_REG[13] = 0;
		this.MAPPER_REG[14] = 0x00;
	}
	this.MAPPER_REG[15] = address;

	if((data & 0x80) != 0) {
		this.MAPPER_REG[13] = 0;
		this.MAPPER_REG[14] = 0x00;
		return;
	}

	if((data & 0x01) != 0)
		this.MAPPER_REG[14] |= (1 << this.MAPPER_REG[13]);
		this.MAPPER_REG[13]++;
	if(this.MAPPER_REG[13] < 5)
		return;

	reg_num = (address & 0x7FFF) >> 13;
	this.MAPPER_REG[reg_num] = this.MAPPER_REG[14];

	this.MAPPER_REG[13] = 0;
	this.MAPPER_REG[14] = 0x00;

	let bank_num;

	switch (reg_num) {
		case 0 :
			if((this.MAPPER_REG[0] & 0x02) != 0) {
				if((this.MAPPER_REG[0] & 0x01) != 0) {
					this.Core.SetMirror(true);
				} else {
					this.Core.SetMirror(false);
				}
			} else {
				if((this.MAPPER_REG[0] & 0x01) != 0) {
					this.Core.SetMirrors(1, 1, 1, 1);
				} else {
					this.Core.SetMirrors(0, 0, 0, 0);
				}
			}
			break;

		case 1 :
			bank_num = this.MAPPER_REG[1];
			if(this.MAPPER_REG[10] == 2) {
				if((this.MAPPER_REG[0] & 0x10) != 0) {
					if(this.MAPPER_REG[12] != 0) {
						this.MAPPER_REG[11] = (this.MAPPER_REG[1] & 0x10) >> 4;
						if((this.MAPPER_REG[0] & 0x08) != 0) {
							this.MAPPER_REG[11] |= ((this.MAPPER_REG[2] & 0x10) >> 3);
						}
						this.SetPrgRomPages8K_Mapper01();
						this.MAPPER_REG[12] = 0;
					} else {
						this.MAPPER_REG[12] = 1;
					}
				} else {
					this.MAPPER_REG[11] = (this.MAPPER_REG[1] & 0x10) != 0 ? 3 : 0;
					this.SetPrgRomPages8K_Mapper01();
				}
			} else if((this.MAPPER_REG[10] == 1) && (this.Core.ChrRomPageCount == 0)) {
				this.MAPPER_REG[11] = (this.MAPPER_REG[1] & 0x10) >> 4;
				this.SetPrgRomPages8K_Mapper01();
			} else if(this.Core.ChrRomPageCount != 0) {
    				if((this.MAPPER_REG[0] & 0x10) != 0) {
					bank_num <<= 2;
					this.Core.SetChrRomPage1K(0, bank_num + 0);
					this.Core.SetChrRomPage1K(1, bank_num + 1);
					this.Core.SetChrRomPage1K(2, bank_num + 2);
					this.Core.SetChrRomPage1K(3, bank_num + 3);
				} else {
					bank_num <<= 2;
					this.Core.SetChrRomPages1K(bank_num + 0, bank_num + 1, bank_num + 2, bank_num + 3,
								 bank_num + 4, bank_num + 5, bank_num + 6, bank_num + 7);
				}
			} else {
				if((this.MAPPER_REG[0] & 0x10) != 0) {
					bank_num <<= 2;
					this.Core.VRAM[0] = this.Core.VRAMS[bank_num + 0];
					this.Core.VRAM[1] = this.Core.VRAMS[bank_num + 1];
					this.Core.VRAM[2] = this.Core.VRAMS[bank_num + 2];
					this.Core.VRAM[3] = this.Core.VRAMS[bank_num + 3];
				}
			}
	                break;

		case 2 :
			bank_num = this.MAPPER_REG[2];

			if((this.MAPPER_REG[10] == 2) && (this.MAPPER_REG[0] & 0x08) != 0) {
				if(this.MAPPER_REG[12] != 0) {
					this.MAPPER_REG[11] = (this.MAPPER_REG[1] & 0x10) >> 4;
					this.MAPPER_REG[11] |= ((this.MAPPER_REG[2] & 0x10) >> 3);
					this.SetPrgRomPages8K_Mapper01();
					this.MAPPER_REG[12] = 0;
				} else {
					this.MAPPER_REG[12] = 1;
				}
			}

			if(this.Core.ChrRomPageCount == 0) {
				if((this.MAPPER_REG[0] & 0x10) != 0) {
					bank_num <<= 2;
					this.Core.VRAM[4] = this.Core.VRAMS[bank_num + 0];
					this.Core.VRAM[5] = this.Core.VRAMS[bank_num + 1];
					this.Core.VRAM[6] = this.Core.VRAMS[bank_num + 2];
					this.Core.VRAM[7] = this.Core.VRAMS[bank_num + 3];
					break;
				}
			}

			if((this.MAPPER_REG[0] & 0x10) != 0) {
					bank_num <<= 2;
					this.Core.SetChrRomPage1K(4, bank_num + 0);
					this.Core.SetChrRomPage1K(5, bank_num + 1);
					this.Core.SetChrRomPage1K(6, bank_num + 2);
					this.Core.SetChrRomPage1K(7, bank_num + 3);
			}
			break;


		case 3 :
			bank_num = this.MAPPER_REG[3];

			if((this.MAPPER_REG[0] & 0x08) != 0) {
				bank_num <<= 1;

				if((this.MAPPER_REG[0] & 0x04) != 0) {
					this.MAPPER_REG[4] = bank_num;
					this.MAPPER_REG[5] = bank_num + 1;
					this.MAPPER_REG[6] = this.MAPPER_REG[8];
					this.MAPPER_REG[7] = this.MAPPER_REG[9];
				} else {
					if(this.MAPPER_REG[10] == 0) {
						this.MAPPER_REG[4] = 0;
						this.MAPPER_REG[5] = 1;
						this.MAPPER_REG[6] = bank_num;
						this.MAPPER_REG[7] = bank_num + 1;
					}
				}
			} else {
	                        bank_num <<= 1;
				this.MAPPER_REG[4] = bank_num;
				this.MAPPER_REG[5] = bank_num + 1;
				if(this.MAPPER_REG[10] == 0) {
					this.MAPPER_REG[6] = bank_num + 2;
					this.MAPPER_REG[7] = bank_num + 3;
				}
			}

			this.SetPrgRomPages8K_Mapper01();
			break;
	}
}

FC.prototype.Mapper1.prototype.SetPrgRomPages8K_Mapper01 = function (){
	this.Core.SetPrgRomPage8K(0, (this.MAPPER_REG[11] << 5) + (this.MAPPER_REG[4] & 31));
	this.Core.SetPrgRomPage8K(1, (this.MAPPER_REG[11] << 5) + (this.MAPPER_REG[5] & 31));
	this.Core.SetPrgRomPage8K(2, (this.MAPPER_REG[11] << 5) + (this.MAPPER_REG[6] & 31));
	this.Core.SetPrgRomPage8K(3, (this.MAPPER_REG[11] << 5) + (this.MAPPER_REG[7] & 31));
}


/**** Mapper2 ****/
FC.prototype.Mapper2 = function(core) {
	FC.prototype.MapperPrototype.apply(this, arguments);
}

FC.prototype.Mapper2.prototype = Object.create(FC.prototype.MapperPrototype.prototype);

FC.prototype.Mapper2.prototype.Init = function() {
	this.Core.PPUChrAreaWrite = true;

	this.Core.SetPrgRomPage(0, 0);
	this.Core.SetPrgRomPage(1, this.Core.PrgRomPageCount - 1);
	this.Core.SetChrRomPage(0);
}

FC.prototype.Mapper2.prototype.Write = function(address, data) {
	this.Core.SetPrgRomPage(0, data);
}


/**** Mapper3 ****/
FC.prototype.Mapper3 = function(core) {
	FC.prototype.MapperPrototype.apply(this, arguments);
}

FC.prototype.Mapper3.prototype = Object.create(FC.prototype.MapperPrototype.prototype);

FC.prototype.Mapper3.prototype.Init = function() {
	this.Core.SetPrgRomPage(0, 0);
	this.Core.SetPrgRomPage(1, this.Core.PrgRomPageCount - 1);
	this.Core.SetChrRomPage(0);
}

FC.prototype.Mapper3.prototype.Write = function(address, data) {
	this.Core.SetChrRomPage(data & 0x0F);
}


/**** Mapper4 ****/
FC.prototype.Mapper4 = function(core) {
	FC.prototype.MapperPrototype.apply(this, arguments);
	this.MAPPER_REG = new Array(21);
}

FC.prototype.Mapper4.prototype = Object.create(FC.prototype.MapperPrototype.prototype);

FC.prototype.Mapper4.prototype.Init = function() {
	this.MAPPER_REG.fill(0);

	this.MAPPER_REG[16] = 0;
	this.MAPPER_REG[17] = 1;
	this.MAPPER_REG[18] = (this.Core.PrgRomPageCount - 1) * 2;
	this.MAPPER_REG[19] = (this.Core.PrgRomPageCount - 1) * 2 + 1;
	this.Core.SetPrgRomPages8K(this.MAPPER_REG[16], this.MAPPER_REG[17], this.MAPPER_REG[18], this.MAPPER_REG[19]);

	this.MAPPER_REG[8] = 0;
	this.MAPPER_REG[9] = 1;
	this.MAPPER_REG[10] = 2;
	this.MAPPER_REG[11] = 3;
	this.MAPPER_REG[12] = 4;
	this.MAPPER_REG[13] = 5;
	this.MAPPER_REG[14] = 6;
	this.MAPPER_REG[15] = 7;
	this.Core.SetChrRomPages1K(this.MAPPER_REG[8], this.MAPPER_REG[9], this.MAPPER_REG[10], this.MAPPER_REG[11],
				this.MAPPER_REG[12], this.MAPPER_REG[13], this.MAPPER_REG[14], this.MAPPER_REG[15]);
}

FC.prototype.Mapper4.prototype.Write = function(address, data) {
	switch (address & 0xE001) {
		case 0x8000:
			this.MAPPER_REG[0] = data;
			if((data & 0x80) == 0x80) {
				this.Core.SetChrRomPages1K(this.MAPPER_REG[12], this.MAPPER_REG[13], this.MAPPER_REG[14], this.MAPPER_REG[15], 
							this.MAPPER_REG[8], this.MAPPER_REG[9], this.MAPPER_REG[10], this.MAPPER_REG[11]); 
			} else {
				this.Core.SetChrRomPages1K(this.MAPPER_REG[8], this.MAPPER_REG[9], this.MAPPER_REG[10], this.MAPPER_REG[11], 
							this.MAPPER_REG[12], this.MAPPER_REG[13], this.MAPPER_REG[14], this.MAPPER_REG[15]); 
			}

			if((data & 0x40) == 0x40) {
				this.Core.SetPrgRomPages8K(this.MAPPER_REG[18], this.MAPPER_REG[17], this.MAPPER_REG[16],this.MAPPER_REG[19]);
			} else {
				this.Core.SetPrgRomPages8K(this.MAPPER_REG[16], this.MAPPER_REG[17], this.MAPPER_REG[18],this.MAPPER_REG[19]);
			}
			break;
		case 0x8001:
			this.MAPPER_REG[1] = data;
			switch (this.MAPPER_REG[0] & 0x07) {
				case 0:
					data &= 0xFE;
					this.MAPPER_REG[8] = data;
					this.MAPPER_REG[9] = data + 1;
					break;
				case 1:
					data &= 0xFE;
					this.MAPPER_REG[10] = data;
					this.MAPPER_REG[11] = data + 1;
					break;
				case 2:
					this.MAPPER_REG[12] = data;
					break;
				case 3:
					this.MAPPER_REG[13] = data;
					break;
				case 4:
					this.MAPPER_REG[14] = data;
					break;
				case 5:
					this.MAPPER_REG[15] = data;
					break;
				case 6:
					this.MAPPER_REG[16] = data;
					break;
				case 7:
					this.MAPPER_REG[17] = data;
					break;
			}

			if((this.MAPPER_REG[0] & 0x80) == 0x80) {
				this.Core.SetChrRomPages1K(this.MAPPER_REG[12], this.MAPPER_REG[13], this.MAPPER_REG[14], this.MAPPER_REG[15], 
							this.MAPPER_REG[8], this.MAPPER_REG[9], this.MAPPER_REG[10], this.MAPPER_REG[11]); 
			} else {
				this.Core.SetChrRomPages1K(this.MAPPER_REG[8], this.MAPPER_REG[9], this.MAPPER_REG[10], this.MAPPER_REG[11], 
							this.MAPPER_REG[12], this.MAPPER_REG[13], this.MAPPER_REG[14], this.MAPPER_REG[15]); 
			}

			if((this.MAPPER_REG[0] & 0x40) == 0x40) {
				this.Core.SetPrgRomPages8K(this.MAPPER_REG[18], this.MAPPER_REG[17], this.MAPPER_REG[16],this.MAPPER_REG[19]);
			} else {
				this.Core.SetPrgRomPages8K(this.MAPPER_REG[16], this.MAPPER_REG[17], this.MAPPER_REG[18],this.MAPPER_REG[19]);
			}
			break;

		case 0xA000:
			if((data & 0x01) == 0x01)
				this.Core.SetMirror(true);
			else
				this.Core.SetMirror(false);
			this.MAPPER_REG[2] = data;
			break;
		case 0xA001:
			this.MAPPER_REG[3] = data;
			break;

		case 0xC000:
			this.MAPPER_REG[4] = data;
			break;
		case 0xC001:
			this.MAPPER_REG[5] = 1;
			break;

		case 0xE000:
			this.MAPPER_REG[7] = 0;
			this.ClearIRQ();
			break;
		case 0xE001:
			this.MAPPER_REG[7] = 1;
			break;
	}
}

FC.prototype.Mapper4.prototype.HSync = function(y) {
	if(y < 240 && (this.Core.IO1[0x01] & 0x08) == 0x08) {
		if(this.MAPPER_REG[20] == 0 || this.MAPPER_REG[5] == 1) {
			this.MAPPER_REG[20] = this.MAPPER_REG[4];
			this.MAPPER_REG[5] = 0;
		} else
			this.MAPPER_REG[20]--;

		if(this.MAPPER_REG[20] == 0){
			if(this.MAPPER_REG[7] == 1) {
				this.SetIRQ();
			}
		}
	}
}


FC.prototype.MapperSelect = function () {
	switch(this.MapperNumber) {
		case 0:
			this.Mapper = new this.Mapper0(this);
			break;
		case 1:
			this.Mapper = new this.Mapper1(this);
			break;
		case 2:
			this.Mapper = new this.Mapper2(this);
			break;
		case 3:
			this.Mapper = new this.Mapper3(this);
			break;
		case 4:
			this.Mapper = new this.Mapper4(this);
			break;
		default:
			return false;
	}
	return true;
}
