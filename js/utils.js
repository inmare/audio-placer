export default class Utils {
  constructor() {}

  static getOverElement(e) {
    const x = e.clientX;
    const y = e.clientY;
    const items = document.querySelectorAll(".playlist-item");
    for (let item of items) {
      const rect = item.getBoundingClientRect();
      if (rect.left < x && x < rect.right && rect.top < y && y < rect.bottom) {
        return item;
      }
    }
    return null;
  }
}
