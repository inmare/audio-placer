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
    const mp3BlobURL = await AudioConvert.createMP3BlobURL(fullAudioBuffer);
    Loading.disable();
    this.enableExportBtn();
    BatchUpload.enableUploadBtn();

    let link = document.createElement("a");
    link.href = mp3BlobURL;
    link.download = `${Loading.jsonFileName.replace(".json", "")}.mp3`;
    link.click();
    URL.revokeObjectURL(mp3BlobURL);
    Loading.setStatusMsg("노래 변환이 완료되었습니다!");

    const cleanedInfo = this.cleanInfo(audioOrder);
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
    const cleanedInfo = audioOrder.map((idx) => {
      const projectInfo = Project.info[idx];
      const info = {};
      for (let key in Object.keys(projectInfo)) {
        if (!audioRelatedKeys.includes(key)) {
          info[key] = projectInfo[key];
        }
      }
      return info;
    });

    return cleanedInfo;
  }
}
