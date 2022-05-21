let settings = {
  startDir: [],
  colorMode: "auto",
  autoPlay: false,
  autoNext: false,
};
let favoritesLocal = [];
let videoHistoryLocal = [];
let playlistLocal = [];
let playlistsLocal = [];

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

try {
  const playlist = JSON.parse(window.localStorage.getItem("playlist"));
  if (
    !playlist ||
    !playlist.id ||
    !playlist.name ||
    !playlist.files ||
    playlist.isDirectory === undefined
  )
    throw new Error();
  playlistLocal = playlist;
} catch (error) {
  window.localStorage.removeItem("playlist");
}

try {
  playlistsLocal =
    window.localStorage.getItem("playlists") !== null
      ? JSON.parse(window.localStorage.getItem("playlists"))
      : playlistsLocal;
} catch (error) {
  window.localStorage.removeItem("playlists");
}

console.log({
  settings,
  favoritesLocal,
  videoHistoryLocal,
  playlistLocal,
  playlistsLocal,
});

export {
  videoHistoryLocal,
  favoritesLocal,
  playlistLocal,
  playlistsLocal,
  settings,
};
