import { DEFAULT_AUDIO_INFO } from "./config";

export default class Project {
  static info = null;
  constructor() {}

  static init(jsonData) {
    Project.info = [];
    for (let info of jsonData) {
      // info object에 기본값 할당
      for (let [key, value] of Object.entries(DEFAULT_AUDIO_INFO)) {
        if (!info[key]) {
          info[key] = value;
        }
      }
      Project.info.push(info);
    }
  }
}
