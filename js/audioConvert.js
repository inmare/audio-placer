import utils from "audio-buffer-utils";
import { Mp3Encoder } from "@breezystack/lamejs";
import Project from "./project";
import Loading from "./elements/loading";
import { MP3_CONFIG } from "./config";
import AudioPlayer from "./audioPlayer";

export default class AudioConvert {
  constructor() {}

  static async createFullAudioBuffer(audioOrder) {
    const bufferList = [];

    let totalDuration = 0;

    for (let i = 0; i < audioOrder.length; i++) {
      Loading.setStatusMsg(`${i + 1}번째 노래를 변환중 입니다...`);
      const audioIdx = audioOrder[i];
      const info = Project.info[audioIdx];
      const adujstedBuffer = await createBuffer(i, info);
      bufferList.push(adujstedBuffer);
      // pad되는 second와 audio의 index를 고려해서 시작지점, 끝지점 설정
      let startSecond, endSecond;
      if (i === 0) {
        startSecond = 0;
        endSecond = adujstedBuffer.duration + MP3_CONFIG.padSecond / 2;
      } else if (i !== 0) {
        startSecond = totalDuration + MP3_CONFIG.padSecond / 2;
        endSecond =
          totalDuration + adujstedBuffer.duration + MP3_CONFIG.padSecond / 2;
      } else if (i === audioOrder.length - 1) {
        startSecond = totalDuration + MP3_CONFIG.padSecond / 2;
        endSecond = totalDuration + adujstedBuffer.duration;
      }
      // 소수점 1자리까지 반올림
      startSecond = Math.round(startSecond * 10) / 10;
      endSecond = Math.round(endSecond * 10) / 10;
      Project.info[audioIdx].startSecond = startSecond;
      Project.info[audioIdx].endSecond = endSecond;
      totalDuration += adujstedBuffer.duration;
    }

    return utils.concat(bufferList);

    async function createBuffer(idx, info) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const buffer = info.audioData;
          const startTime = info.audioStart;
          const endTime = info.audioEnd;
          const duration = buffer.duration;

          const sliced = utils.slice(
            buffer,
            Math.round(startTime * MP3_CONFIG.sampleRate),
            Math.round((duration - endTime) * MP3_CONFIG.sampleRate)
          );

          const gain = AudioPlayer.calculateGain(sliced);
          const bufferSource = new AudioContext().createBufferSource();
          bufferSource.buffer = sliced;

          const numberOfChannels = sliced.numberOfChannels;
          const length = sliced.length;
          const maxVolume = 1.0;
          const minVolume = 0.0;

          for (let i = 0; i < numberOfChannels; i++) {
            const channelData = sliced.getChannelData(i);
            for (let j = 0; j < length; j++) {
              let value = channelData[j];
              let adjustedValue = Math.abs(value) * gain;
              adjustedValue = Math.min(maxVolume, adjustedValue);
              adjustedValue = Math.max(minVolume, adjustedValue);
              adjustedValue = value < 0 ? -adjustedValue : adjustedValue;

              channelData[j] = adjustedValue;
            }
          }

          const normalized = bufferSource.buffer;

          if (idx !== 0) {
            // pad가 작동을 안해서 빈 buffer를 만들어서 concat함
            const empty = utils.create(
              Math.round(MP3_CONFIG.padSecond * MP3_CONFIG.sampleRate),
              MP3_CONFIG.channels,
              MP3_CONFIG.sampleRate
            );
            utils.fill(empty, 0);
            const padded = utils.concat([empty, normalized]);
            resolve(padded);
          } else {
            resolve(normalized);
          }
        }, 0);
      });
    }
  }

  static async createMP3Blob(fullAudioBuffer) {
    const mp3encoder = new Mp3Encoder(
      MP3_CONFIG.channels,
      MP3_CONFIG.sampleRate,
      MP3_CONFIG.kbps
    );

    const samplesLeft = fullAudioBuffer.getChannelData(0);
    const samplesRight = fullAudioBuffer.getChannelData(1);

    const mp3Data = [];
    const blockSize = MP3_CONFIG.sampleBlockSize;

    for (let i = 0; i < fullAudioBuffer.length; i += blockSize) {
      if (i % 1000 === 0) {
        const percent = Math.round((i / fullAudioBuffer.length) * 100);
        Loading.setStatusMsg(
          `데이터를 mp3파일로 변환 중입니다.<br>이 페이지를 계속 열어두세요.<br>${percent}% 진행 중...`
        );
      }
      const leftChunk = samplesLeft.subarray(i, i + blockSize);
      const rightChunk = samplesRight.subarray(i, i + blockSize);
      const mp3buf = await createMP3Buffer(
        mp3encoder,
        leftChunk,
        rightChunk,
        blockSize
      );
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }

    // mp3 파일 작성 마무리
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    const blob = new Blob(mp3Data, { type: "audio/mp3" });
    Loading.setStatusMsg("변환이 완료되었습니다...");

    return blob;

    async function createMP3Buffer(
      mp3encoder,
      leftChunk,
      rightChunk,
      blockSize
    ) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Float32Array를 Int16Array로 변환
          const leftPCM = new Int16Array(blockSize);
          const rightPCM = new Int16Array(blockSize);
          for (let i = 0; i < blockSize; i++) {
            leftPCM[i] = leftChunk[i] * (Math.pow(2, 15) - 1);
            rightPCM[i] = rightChunk[i] * (Math.pow(2, 15) - 1);
          }

          const mp3buf = mp3encoder.encodeBuffer(leftPCM, rightPCM);
          resolve(mp3buf);
        }, 0);
      });
    }
  }
}
