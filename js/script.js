import { DEFAULT_AUDIO_INFO } from "./config";
import initElement from "./elements/elements";
import Project from "./project";

const res = await fetch("../playlist-info.json");
const playlistInfo = await res.json();

for (let info of playlistInfo) {
  // info object에 기본값 할당
  for (let [key, value] of Object.entries(DEFAULT_AUDIO_INFO)) {
    if (!info[key]) {
      info[key] = value;
    }
  }
  Project.info.push(info);
}
initElement();
