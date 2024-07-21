import { AUDIO_STATUS, DEFAULT_AUDIO_INFO } from "./config";
import Playlist from "./playlist";
import CanvasDraw from "./canvasDraw";
import Elements from "./elements";

export default class AudioPlayer {
  static current = {
    context: new AudioContext(),
    idx: null,
    source: null,
    start: 0,
    offset: 0,
  };
  static reqId = null;

  constructor() {}

  static async setSource(idx, audioBuffer) {
    if (this.current.source) this.stop();
    const info = Playlist.list[idx].info;
    const audioData = await this.getAudioData(audioBuffer);
    const initGain = this.calculateGain(audioData);

    // audioData와 gain값 초기화
    info.audioData = audioData;
    info.audioInitGain = initGain;
    info.audioGain = initGain;
    info.audioStart = DEFAULT_AUDIO_INFO.audioStart;
    info.audioEnd = DEFAULT_AUDIO_INFO.audioEnd;
  }

  static play(offset) {
    // static 변수 offset에 따라 audio start, end 값 설정
    const idx = this.current.idx;
    if (idx === null) return;

    const audioCtx = this.current.context;
    const info = Playlist.list[idx].info;
    if (this.current.source) {
      this.current.source.stop();
      this.current.source = null;
    }
    this.current.source = audioCtx.createBufferSource();
    this.current.source.buffer = info.audioData;

    const gainNode = audioCtx.createGain();
    // 실제보다 살짝 작은 볼륨으로 재생
    gainNode.gain.value = info.audioInitGain / 3;

    this.current.source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    this.current.source.start(0, offset);
    this.current.start = audioCtx.currentTime;
  }

  static stop() {
    // static 변수 offset에 값을 저장함
    if (this.current.source) {
      this.current.source.stop();
      this.current.source = null;
    }
    // this.current.offset +=
    //   this.current.context.currentTime - this.current.start;
    this.current.start = 0;
  }

  static seek(offset) {
    this.stop();
    this.current.offset = offset;
    const status = Elements.audio.playBtn.dataset.status;
    if (status === AUDIO_STATUS.play) {
      this.play(offset);
    } else if (status === AUDIO_STATUS.pause) {
      // 필요할까 싶은 초기화
      this.current.start = 0;
      this.current.source = null;
    }
  }

  // --- utils functions ---

  static async getAudioData(audioBuffer) {
    const audioContext = new AudioContext();
    const audioData = await audioContext.decodeAudioData(audioBuffer);

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

  // requestAnimationFrame으로 실시간으로 offset 위치를 설정하는 함수
  static moveOffset(prevTime) {
    if (this.current.idx === null) return;

    const audioCtx = this.current.context;
    const currentTime = audioCtx.currentTime;

    const offset = this.current.offset + currentTime - prevTime;
    this.current.offset = offset;

    const info = Playlist.list[this.current.idx].info;
    const duration = info.audioData.duration;
    const endTime = info.audioEnd;
    // 만약 audioEnd를 넘어가면 멈춤
    if (offset > duration - endTime) {
      this.stopOffset();
      return;
    }

    // requestAnimationFrame을 통해서 캔버스에도 실시간으로 그림을 그림
    CanvasDraw.drawStatus(offset, null, null);

    this.reqId = requestAnimationFrame(() => {
      this.moveOffset(currentTime);
    });
  }

  static cancelOffset() {
    if (this.reqId) cancelAnimationFrame(this.reqId);
    this.reqId = null;
  }

  static stopOffset() {
    const startTime = Playlist.list[this.current.idx].info.audioStart;
    this.current.offset = startTime;
    this.cancelOffset();
    CanvasDraw.drawStatus(startTime, null, null);
    Elements.audio.playBtn.click();
  }
}
