import Playlist from "./playlist";
import CanvasDraw from "./canvasDraw";
import AudioPlayer from "./audioPlayer";
import { DEFAULT_AUDIO_INFO } from "./config";

const res = await fetch("../playlist-info.json");
const playlistInfo = await res.json();

for (let info of playlistInfo) {
  const infoIdx = playlistInfo.indexOf(info);
  for (let [key, value] of Object.entries(DEFAULT_AUDIO_INFO)) {
    if (!info[key]) {
      info[key] = value;
    }
  }
  const playlistItem = new Playlist(info, infoIdx);
  Playlist.list.push(playlistItem);
}

Playlist.addDragEventListeners();
AudioPlayer.init();
CanvasDraw.init();

const ranges = document.querySelectorAll("input[type='range']");
ranges.forEach((range) => {
  range.addEventListener("input", CanvasDraw.drawAudioDeselectRegion);
});
