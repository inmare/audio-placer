import Loading from "./loading";
import Project from "../project";
import AudioConvert from "../audioConvert";

export default class ExportAudio {
  static btn = document.querySelector("#export-mp3");

  constructor() {}

  static addListener() {
    this.btn.addEventListener("click", () => ExportAudio.export());
  }

  static async export() {
    if (Project.info === null)
      return alert("플레이리스트 정보가 있는 파일을 업로드해주세요.");
    const isDataExist = ExportAudio.checkAudioDataExist();
    if (!isDataExist) return alert("모든 노래의 파일을 업로드해주세요.");

    console.log("test0");

    await Loading.enable();
    console.log("test");
    const audioOrder = this.getAudioOrder();
    const fullAudioBuffer = AudioConvert.createFullAudioBuffer(audioOrder);
    const mp3BlobURL = AudioConvert.createMP3BlobURL(fullAudioBuffer);
    Loading.disable();

    let link = document.createElement("a");
    link.href = mp3BlobURL;
    link.download = `${Loading.jsonFileName.replace(".json", "")}.mp3`;
    link.click();
    URL.revokeObjectURL(mp3BlobURL);
    alert("노래가 성공적으로 다운로드되었습니다!");
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
}
