let settings = { startDir: ["/"] };
let favoritesLocal = [];
let videoHistoryLocal = [];

console.log("loading local storage data");

try {
  videoHistoryLocal =
    window.localStorage.getItem("videoHistory") !== null
      ? JSON.parse(window.localStorage.getItem("videoHistory"))
      : videoHistoryLocal;
} catch (error) {
  window.localStorage.removeItem("videoHistory");
}

try {
  favoritesLocal =
    window.localStorage.getItem("favorites") !== null
      ? JSON.parse(window.localStorage.getItem("favorites"))
      : favoritesLocal;
} catch (error) {
  window.localStorage.removeItem("favorites");
}

try {
  settings =
    window.localStorage.getItem("settings") !== null
      ? JSON.parse(window.localStorage.getItem("settings"))
      : settings;
} catch (error) {
  window.localStorage.removeItem("settings");
}

export { videoHistoryLocal, favoritesLocal, settings };
