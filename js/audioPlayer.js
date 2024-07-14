import { AUDIO_STATUS } from "./config";
import Playlist from "./playlist";
import CanvasDraw from "./canvasDraw";

export default class AudioPlayer {
  static current = {
    context: new AudioContext(),
    idx: null,
    source: null,
    start: 0,
    offset: 0,
  };
  static elem = {
    playBtn: document.querySelector("#audio-play"),
    forwardBtn: document.querySelector("#move-forward"),
    backwardBtn: document.querySelector("#move-backward"),
    canvasWrapper: document.querySelector("#canvas-wrapper"),
    statusCanvas: document.querySelector("#audio-status"),
  };

  constructor() {}

  static init() {
    this.elem.playBtn.addEventListener("click", (e) => {
      if (this.current.idx !== null) {
        const status = this.elem.playBtn.dataset.status;
        const img = this.elem.playBtn.querySelector("img");
        if (status === AUDIO_STATUS.pause) {
          this.play(this.current.offset);
          CanvasDraw.reqId = requestAnimationFrame(
            CanvasDraw.drawOffsetAnimation.bind(CanvasDraw)
          );
          img.src = "img/pause-solid.svg";
          this.elem.playBtn.dataset.status = AUDIO_STATUS.play;
        } else if (status === AUDIO_STATUS.play) {
          this.stop();
          cancelAnimationFrame(CanvasDraw.reqId);
          img.src = "img/play-solid.svg";
          this.elem.playBtn.dataset.status = AUDIO_STATUS.pause;
        }
      }
    });
    this.elem.forwardBtn.addEventListener("click", () => this.moveTo("start"));
    this.elem.backwardBtn.addEventListener("click", () => this.moveTo("end"));
    this.elem.statusCanvas.addEventListener("click", (e) => {
      const offsetPx = e.offsetX;
      const duration = Playlist.list[this.current.idx].info.audioData.duration;
      const offsetTime = (offsetPx / e.target.width) * duration;

      this.seek(offsetTime);
      CanvasDraw.drawStatus(offsetTime, null, null);
    });
  }

  static moveTo(type) {
    if (this.current.idx !== null) {
      const info = Playlist.list[this.current.idx].info;
      const wrapper = this.elem.canvasWrapper;
      let time, offset;
      if (type === "start") {
        time = info.audioStart;
        offset = 0;
      } else if (type === "end") {
        time = info.audioEnd;
        offset = wrapper.scrollWidth;
      }
      wrapper.scrollLeft = offset;
      this.seek(time);
    }
  }

  static async setSource(idx) {
    if (this.current.source) this.stop();
    this.current.idx = idx;
    const info = Playlist.list[idx].info;
    if (idx != null && info.audioData === null) {
      const fileName = info.fileName + ".mp3";
      const audioData = await this.getAudioData(fileName);
      const initGain = this.calculateGain(audioData);

      // audioData와 gain값 초기화
      info.audioData = audioData;
      info.audioInitGain = initGain;
      info.audioGain = initGain;
    }
  }

  static play(offset) {
    // static 변수 offset에 따라 audio start, end 값 설정
    const idx = this.current.idx;
    const audioCtx = this.current.context;

    if (idx !== null) {
      const info = Playlist.list[idx].info;
      this.current.source = audioCtx.createBufferSource();
      this.current.source.buffer = info.audioData;

      const gainNode = audioCtx.createGain();
      // 실제보다 살짝 작은 볼륨으로 재생
      gainNode.gain.value = info.audioInitGain / 3;

      this.current.source.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      this.current.source.start(0, offset);
      // this.current.source.start(0, 100);
      this.current.start = audioCtx.currentTime;

      this.current.source.onended = () => {
        // AudioCanvas.audioOffset = 0;
        const img = this.elem.playBtn.querySelector("img");
        img.src = "img/play-solid.svg";
        this.elem.playBtn.dataset.status = AUDIO_STATUS.pause;
        // cancelAnimationFrame(reqId);
      };
    }
  }

  static stop() {
    // static 변수 offset에 값을 저장함
    this.current.source.stop();
    this.current.offset +=
      this.current.context.currentTime - this.current.start;
    // cancelAnimationFrame(canvasDraw.reqId);
    this.current.source = null;
    this.current.start = 0;
  }

  static seek(offset) {
    this.current.offset = offset;
    const status = this.elem.playBtn.dataset.status;
    if (status === AUDIO_STATUS.play) {
      this.stop();
      this.play(offset);
    } else if (status === AUDIO_STATUS.pause) {
      // 필요할까 싶은 초기화
      this.current.start = 0;
      this.current.source = null;
    }
  }

  // 쓰이려나?
  static resetValues() {
    this.current.idx = null;
    this.current.source = null;
    this.current.start = 0;
    this.current.offset = 0;
  }

  // --- utils functions ---

  static async getAudioData(fileName) {
    const response = await fetch(`music/${fileName}`);

    const audioContext = new AudioContext();
    const audioData = await audioContext.decodeAudioData(
      await response.arrayBuffer()
    );

    return audioData;
  }

  static getMonoChannelData(audioData) {
    let channelData;
    if (audioData.numberOfChannels === 2) {
      const ch0 = audioData.getChannelData(0);
      const ch1 = audioData.getChannelData(1);
      let newData = new Float32Array(ch0.length);
      for (let i = 0; i < ch0.length; i++) {
        newData[i] = (ch0[i] + ch1[i]) / 2;
      }
      channelData = newData;
    } else if (audioData.numberOfChannels === 1) {
      channelData = audioData.getChannelData(0);
    }
    return channelData;
  }

  static calculateGain(audioData, start = null, end = null) {
    const channelData = this.getMonoChannelData(audioData);
    const sampleRate = audioData.sampleRate;

    const startIdx = start !== null ? Math.round(sampleRate * start) : 0;
    const endIdx =
      end !== null ? Math.round(sampleRate * end) : channelData.length;

    let square = 0;
    for (let i = startIdx; i < endIdx; i++) {
      square += Math.pow(channelData[i], 2);
    }

    const referenceValue = 1;
    const mean = square / channelData.length;
    const rms = Math.sqrt(mean);
    const rmsDecibel = 20 * Math.log10(rms / referenceValue);

    const targetDecibel = -9;
    const gainDecibel = targetDecibel - rmsDecibel;
    const audioGain = Math.pow(10, gainDecibel / 20);

    return audioGain;
  }
}
