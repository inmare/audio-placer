import {
  BlobReader,
  BlobWriter,
  TextReader,
  TextWriter,
  ZipWriter,
} from "@zip.js/zip.js";
import Loading from "./loading";
import Project from "../project";
import AudioConvert from "../audioConvert";
import BatchUpload from "./batchUpload";
import { DEFAULT_AUDIO_INFO } from "../config";

export default class ExportFile {
  static btn = document.querySelector("#export-mp3");
  static isExporting = false;

  constructor() {}

  static addListener() {
    this.btn.addEventListener("click", () => ExportFile.export());
  }

  static async export() {
    if (this.isExporting || BatchUpload.isUploading) return;
    if (Project.info === null)
      return alert("플레이리스트 정보가 있는 파일을 업로드해주세요.");
    const isDataExist = ExportFile.checkAudioDataExist();
    if (!isDataExist) return alert("모든 노래의 파일을 업로드해주세요.");

    Loading.enable();
    this.disableExportBtn();
    BatchUpload.disableUploadBtn();
    Loading.setStatusMsg("노래를 변환하는 중입니다...");
    const audioOrder = this.getAudioOrder();
    const fullAudioBuffer = await AudioConvert.createFullAudioBuffer(
      audioOrder
    );
    const mp3Blob = await AudioConvert.createMP3Blob(fullAudioBuffer);
    Loading.disable();
    this.enableExportBtn();
    BatchUpload.enableUploadBtn();

    const cleanedInfo = this.cleanInfo(audioOrder);

    Loading.setStatusMsg("파일을 압축하는 중입니다...");
    const zipFile = await this.createZipFile(mp3Blob, cleanedInfo);
    const zipFileName = Loading.jsonFileName.replace(".json", ".zip");
    const zipUrl = URL.createObjectURL(zipFile);
    const a = document.createElement("a");
    a.href = zipUrl;
    a.download = zipFileName;
    a.click();
    URL.revokeObjectURL(zipUrl);
  }

  static checkAudioDataExist() {
    const audioDataList = Project.info.map((info) => info.audioData);
    const isDataExist = audioDataList.every((audioData) => audioData !== null);
    return isDataExist;
  }

  static getAudioOrder() {
    const playlistItem = document.querySelectorAll(".playlist-item");
    const audioOrder = Array.from(playlistItem).map((item) => {
      return parseInt(item.dataset.id);
    });

    return audioOrder;
  }

  static disableExportBtn() {
    this.btn.classList.add("disabled-click");
    this.exporting = true;
  }

  static enableExportBtn() {
    this.btn.classList.remove("disabled-click");
    this.exporting = false;
  }

  static cleanInfo(audioOrder) {
    const audioRelatedKeys = Array.from(Object.keys(DEFAULT_AUDIO_INFO));
    // 순서에 맞게 info 정리 및 mp3를 만드는 과정에서 추가된 정보 제거
    const cleanedInfo = audioOrder.map((idx) => {
      const projectInfo = Project.info[idx];
      const info = {};
      for (let key of Object.keys(projectInfo)) {
        if (!audioRelatedKeys.includes(key)) {
          info[key] = projectInfo[key];
        }
      }
      return info;
    });

    return cleanedInfo;
  }

  static async createZipFile(mp3Blob, cleanedInfo) {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        const filePrefix = Loading.jsonFileName.replace(".json", "");

        const zipFileWriter = new BlobWriter();
        const jsonReader = new TextReader(JSON.stringify(cleanedInfo));
        const mp3Reader = new BlobReader(mp3Blob);

        const zipWriter = new ZipWriter(zipFileWriter);
        await zipWriter.add(`${filePrefix}.json`, jsonReader);
        await zipWriter.add(`${filePrefix}.mp3`, mp3Reader);
        await zipWriter.close();

        const zipBlob = await zipFileWriter.getData();
        resolve(zipBlob);
      }, 0);
    });
  }
}
