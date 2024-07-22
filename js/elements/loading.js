import Project from "../project";
import Playlist from "./playlist";

export default class Loading {
  static loading = document.querySelector("#loading");
  static jsonWrapper = document.querySelector("#json-file-wrapper");
  static uploadBtn = document.querySelector("#upload-json-file");
  static fileInput = document.querySelector("#json-file-input");
  static progress = document.querySelector("#loading-progress");
  static jsonFileName = null;

  constructor() {}

  static addListener() {
    this.uploadBtn.addEventListener("click", () => {
      this.fileInput.click();
    });
    this.fileInput.addEventListener("change", (event) =>
      this.uploadJsonFile(event)
    );
  }

  static uploadJsonFile(event) {
    const file = event.target.files[0];
    Loading.jsonFileName = file.name;
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (event) => {
      const data = JSON.parse(event.target.result);
      Project.init(data);
      Loading.disable();
      Loading.jsonWrapper.remove();
      Project.info.forEach((value, idx) => {
        Playlist.createDiv(value, idx);
      });
    };
  }
  static disable() {
    setTimeout(() => {
      console.log("loading disable");
      this.progress.innerHTML = "";
      this.loading.classList.add("disable-loading");
    }, 0);
  }

  static async enable() {
    setTimeout(() => {
      console.log("loading enable");
      this.progress.innerHTML = "";
      this.loading.classList.remove("disable-loading");
    }, 0);
  }

  static setStatusMsg(msg) {
    setTimeout(() => {
      console.log(msg);
      this.progress.innerHTML = msg;
    }, 0);
  }
}
