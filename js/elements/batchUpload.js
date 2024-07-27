import Project from "../project";
import Loading from "./loading";
import AudioPlayer from "../audioPlayer";
import ExportFile from "./exportFile";

export default class BatchUpload {
  static btn = document.querySelector("#batch-upload");
  static fileInput = document.querySelector("#batch-file-input");
  static isUploading = false;

  constructor() {}

  static addListener() {
    this.btn.addEventListener("click", () => BatchUpload.fileInput.click());
    this.fileInput.addEventListener("change", (event) =>
      BatchUpload.upload(event)
    );
  }

  static async upload(event) {
    if (this.isUploading || ExportFile.isExporting) return;

    Loading.enable();
    this.disableUploadBtn();
    ExportFile.disableExportBtn();
    const files = event.target.files;
    const fileNames = Project.info.map((info) => info.fileName);
    for (let file of files) {
      const idx = Array.from(files).indexOf(file);
      Loading.setStatusMsg(`${idx + 1}번째 노래를 업로드 하는 중입니다...`);
      const fileName = file.name.replace(".mp3", "");
      if (fileNames.includes(fileName)) {
        const infoIdx = fileNames.indexOf(fileName);
        const audioBuffer = await readAudioData(file);
        await AudioPlayer.setSource(infoIdx, audioBuffer);
        updateFileName(infoIdx, file.name);
      }
    }
    Loading.disable();
    this.enableUploadBtn();
    ExportFile.enableExportBtn();

    async function readAudioData(file) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve(event.target.result);
          };
          reader.readAsArrayBuffer(file);
        });
      }, 0);
    }

    function updateFileName(idx, fileName) {
      const musicfileName = document.querySelector(
        `[data-id=\"${idx}\"] .music-file-name`
      );
      musicfileName.textContent = fileName;
    }
  }

  static disableUploadBtn() {
    this.isUploading = true;
    this.btn.classList.add("disabled-click");
  }

  static enableUploadBtn() {
    this.isUploading = false;
    this.btn.classList.remove("disabled-click");
  }
}
