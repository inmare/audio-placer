import Crunker from "crunker";
import { Mp3Encoder } from "@breezystack/lamejs";
import Project from "./project";
import AudioPlayer from "./audioPlayer";
import Loading from "./elements/loading";

export default class AudioConvert {
  static sampleRate = 48000;
  static channelNum = 2;
  static kbps = 128;
  static sampleBlockSize = 1152;

  constructor() {}

  static createFullAudioBuffer(audioOrder) {
    const crunker = new Crunker();
    const bufferList = [];

    for (let i = 0; i < audioOrder.length; i++) {
      Loading.setStatusMsg(`${i + 1}번째 노래를 변환중 입니다...`);
      const audioIdx = audioOrder[i];
      const info = Project.info[audioIdx];
      const adujstedBuffer = createBuffer(i, info);
      bufferList.push(adujstedBuffer);
    }

    const fullAudioBuffer = crunker.concatAudio(bufferList);

    return fullAudioBuffer;

    function createBuffer(idx, info) {
      const buffer = info.audioData;
      const startTime = info.audioStart;
      const endTime = info.audioEnd;
      const duration = buffer.duration;
      const slicedBuffer = crunker.sliceAudio(
        buffer,
        startTime,
        duration - endTime
      );
      const gain = AudioPlayer.calculateGain(slicedBuffer);
      const gainAdujustedBuffer = AudioConvert.changeAudioGain(
        slicedBuffer,
        gain
      );

      if (idx !== 0) return crunker.padAudio(gainAdujustedBuffer, 0, 1);
      else return buffer;
    }
  }

  static changeAudioGain(audioBuffer, gain) {
    const channelNum = audioBuffer.numberOfChannels;
    for (let channel = 0; channel < channelNum; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] *= gain;
      }
    }
    return audioBuffer;
  }

  static createMP3BlobURL(fullAudioBuffer) {
    const mp3encoder = new Mp3Encoder(
      this.channelNum,
      this.sampleRate,
      this.kbps
    );

    const samplesLeft = fullAudioBuffer.getChannelData(0);
    const samplesRight = fullAudioBuffer.getChannelData(1);

    const mp3Data = [];
    const blockSize = this.sampleBlockSize;

    for (let i = 0; i < fullAudioBuffer.length; i += blockSize) {
      const leftChunk = samplesLeft.subarray(i, i + blockSize);
      const rightChunk = samplesRight.subarray(i, i + blockSize);
      const mp3buf = createMP3Buffer(leftChunk, rightChunk, blockSize);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }

      Loading.setStatusMsg(
        `데이터를 mp3파일로 변환 중입니다...<br>(${i}/${fullAudioBuffer.length})`
      );
    }

    // mp3 파일 작성 마무리
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    const blob = new Blob(mp3Data, { type: "audio/mp3" });
    const url = window.URL.createObjectURL(blob);

    return url;

    function createMP3Buffer(leftChunk, rightChunk, blockSize) {
      const mp3encoder = new Mp3Encoder(
        AudioConvert.channelNum,
        AudioConvert.sampleRate,
        AudioConvert.kbps
      );
      // Float32Array를 Int16Array로 변환
      const leftPCM = new Int16Array(blockSize);
      const rightPCM = new Int16Array(blockSize);
      for (let i = 0; i < blockSize; i++) {
        leftPCM[i] = leftChunk[i] * 32767;
        rightPCM[i] = rightChunk[i] * 32767;
      }

      const mp3buf = mp3encoder.encodeBuffer(leftPCM, rightPCM);
      return mp3buf;
    }
  }
}
