import utils from "audio-buffer-utils";
import { Mp3Encoder } from "@breezystack/lamejs";
import Project from "./project";
import Loading from "./elements/loading";
import { MP3_CONFIG } from "./config";

export default class AudioConvert {
  constructor() {}

  static async createFullAudioBuffer(audioOrder) {
    const bufferList = [];

    let accmulatedDuration = 0;

    for (let i = 0; i < audioOrder.length; i++) {
      Loading.setStatusMsg(`${i + 1}번째 노래를 변환중 입니다...`);
      const audioIdx = audioOrder[i];
      const info = Project.info[audioIdx];
      const adujstedBuffer = await createBuffer(i, info);
      bufferList.push(adujstedBuffer);
      Project.info[audioIdx].startSecond = accmulatedDuration;
      Project.info[audioIdx].endSecond =
        accmulatedDuration + info.adujstedBuffer.duration;
      accmulatedDuration += info.adujstedBuffer.duration;
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
          const normalized = utils.normalize(sliced);

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

  static async createMP3BlobURL(fullAudioBuffer) {
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
      const mp3buf = await createMP3Buffer(leftChunk, rightChunk, blockSize);
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
    const url = window.URL.createObjectURL(blob);

    Loading.setStatusMsg("변환이 완료되었습니다...");

    return url;

    async function createMP3Buffer(leftChunk, rightChunk, blockSize) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const mp3encoder = new Mp3Encoder(
            AudioConvert.channelNum,
            AudioConvert.sampleRate,
            AudioConvert.kbps
          );
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
