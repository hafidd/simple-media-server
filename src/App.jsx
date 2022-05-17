import React, { useState, useEffect, useRef, useCallback } from "react";

import { useParams, Navigate } from "react-router-dom";
import axios from "axios";

import {
  videoHistoryLocal,
  favoritesLocal,
  settings,
} from "./localStorageData";

import Main from "./components/Main";
import Sidebar from "./components/Sidebar";

function App(props) {
  const { notFound = false } = props;

  const { dirParam = "", fileParam = "" } = useParams();

  const [path, setPath] = useState(settings.startDir);

  const [fileSelected, setFileSelected] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [loadingSubtitles, setLoadingSubtitles] = useState(false);

  const [dirs, setDirs] = useState([]);
  const [files, setFiles] = useState([]);

  const [filterName, setFilterName] = useState("");

  const [favorites, setFavorites] = useState(favoritesLocal);
  const [videoHistory, setVideoHistory] = useState(videoHistoryLocal);

  const cancelTokenSource = useRef();

  const openDir = useCallback((dirPath) => {
    // cancel prev request
    if (cancelTokenSource.current) cancelTokenSource.current.cancel();
    cancelTokenSource.current = axios.CancelToken.source();

    axios
      .get("/dir/" + encodeURIComponent(JSON.stringify(dirPath)), {
        cancelToken: cancelTokenSource.current.token,
      })
      .then(({ data }) => {
        setPath(dirPath);
        setDirs(data.dirs);
        setFiles(
          data.files.map((file) => {
            const videoSrc = `/video/${encodeURIComponent(
              JSON.stringify([...dirPath, file])
            )}`;
            return {
              name: file,
              path: dirPath,
              videoSrc,
              subtitles: videoSrc + "/subtitles",
              imgSrc: videoSrc + "/thumbnail",
            };
          })
        );
      })
      .catch((err) => {
        <Navigate to="/" />;
      });
  }, []);

  useEffect(() => {
    openDir(settings.startDir);
  }, [openDir]);

  useEffect(() => {
    if (!dirParam) return;
    try {
      if (dirParam === "") return openDir(settings.startDir);
      const dirPath = dirParam !== "" ? JSON.parse(dirParam) : "";
      openDir(dirPath);
    } catch (error) {
      <Navigate to="/" />;
    }
  }, [dirParam, openDir]);

  useEffect(() => {
    try {
      const videoSrc =
        fileParam !== "" ? `/video/${encodeURIComponent(fileParam)}` : "";
      const file =
        fileParam !== ""
          ? {
              name: JSON.parse(fileParam)[JSON.parse(fileParam).length - 1],
              path: JSON.parse(fileParam).splice(
                0,
                JSON.parse(fileParam).length - 1
              ),
              videoSrc,
              subtitles: videoSrc + "/subtitles",
              imgSrc: videoSrc + "/thumbnail",
            }
          : "";
      // set file
      if (fileParam !== "") setFileSelected(file);
      else setFileSelected(null);
    } catch (error) {
      <Navigate to="/" />;
    }
  }, [fileParam]);

  useEffect(() => {
    if (fileSelected !== null) {
      setLoadingSubtitles(true);
      axios
        .get(fileSelected.subtitles)
        .then(({ data }) => setSubtitles(data))
        .catch((err) => console.log(err))
        .finally(() => setLoadingSubtitles(false));
    } else setSubtitles([]);
  }, [fileSelected]);

  const [smShowSidebar, setSmShowSidebar] = useState(false);

  useEffect(() => {
    window.localStorage.setItem("videoHistory", JSON.stringify(videoHistory));
  }, [videoHistory]);
  useEffect(() => {
    window.localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  return (
    <div className="md:flex h-screen overflow-auto">
      <Sidebar
        className={`${
          !smShowSidebar ? "hidden" : ""
        } fixed w-10/12 overflow-auto border-r-2 z-20 bg-white md:static md:block md:flex-shrink-0 md:w-96 h-full p-5`}
        dirs={dirs}
        path={path}
        home={JSON.stringify(path) === JSON.stringify(settings.startDir)}
        favorites={favorites}
        videoHistory={videoHistory.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        )}
        setSmShowSidebar={setSmShowSidebar}
      />

      {notFound ? (
        "Not found"
      ) : (
        <Main
          className="w-full h-full flex flex-col"
          dirs={dirs}
          path={path}
          files={
            filterName === ""
              ? files
              : files.filter(
                  (file) =>
                    file.name
                      .toLowerCase()
                      .indexOf(filterName.toLowerCase()) !== -1
                )
          }
          fileSelected={fileSelected}
          filterName={filterName}
          subtitles={subtitles}
          fav={
            favorites
              .map((f) => JSON.stringify(f))
              .indexOf(JSON.stringify(path)) !== -1
          }
          setFavorites={setFavorites}
          loadingSubtitles={loadingSubtitles}
          videoHistory={videoHistory}
          setVideoHistory={setVideoHistory}
          setFileSelected={setFileSelected}
          setFilterName={setFilterName}
        />
      )}

      {!smShowSidebar && (
        <div className="fixed bottom-4 right-4 md:hidden">
          <button
            className="px-4 py-2 bg-blue-100 opacity-80 border border-blue-200 font-extrabold md:hidden"
            onClick={() => {
              setSmShowSidebar(true);
            }}
          >
            {" "}
            &#9776;{" "}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
