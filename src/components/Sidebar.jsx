import React from "react";
import { Link, useParams } from "react-router-dom";
import { toUrlParams } from "../helpers";

import noimg from "../noimg.png";

const Sidebar = (props) => {
  const {
    className = "",
    dirs,
    path,
    startDir,
    favorites,
    videoHistory,
    setSmShowSidebar,
  } = props;

  const { fileParam = "" } = useParams();

  return (
    <div className={className}>
      <div
        className="fixed w-1/6 right-0 h-full md:hidden bg-white opacity-20"
        onClick={() => setSmShowSidebar(false)}
      />
      <Favorites {...{ favorites, fileParam }} />
      <Directories {...{ fileParam, path, favorites, dirs, startDir }} />
      <RecentFiles {...{ videoHistory }} />
      <div className="p-1">
        <button
          className="p-2 w-full text-center border"
          onClick={() => {
            if (window.prompt("Clear data? yes/no") === "yes") {
              localStorage.clear();
              window.location.reload();
            }
          }}
        >
          Clear all data
        </button>
      </div>
    </div>
  );
};

const Favorites = ({ favorites, fileParam }) => (
  <div className="fav mb-5">
    <h2 className="text-lg font-bold">⭐ Favorites ({favorites.length})</h2>
    <div className="max-h-[150px] overflow-auto mr-2">
      <ul className="pl-4">
        {favorites.map((favorite) => (
          <li
            key={JSON.stringify(favorite)}
            className="w-full border px-1 mb-1"
          >
            <Link to={toUrlParams([favorite, fileParam])}>
              <span className="text-sm">
                {favorite.map((dir) => dir + "/")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const Directories = (props) => {
  const { fileParam, path, favorites, dirs, startDir } = props;
  return (
    <div className="mb-5">
      <div className="flex last:mr-0 flex-wrap">
        <span className="pr-1 text-sm mb-1">📁</span>
        <Link
          className="font-bold border px-1 mr-1 text-sm mb-1 min-w-[20px]"
          to={toUrlParams([[], fileParam])}
        >
          /
        </Link>
        {path.map((p, i) => (
          <React.Fragment key={i + p + "path"}>
            <Link
              className={`${
                i + 1 < path.length ? "border " : ""
              } font-bold px-1 text-sm mb-1 min-w-[20px]`}
              to={
                i + 1 < path.length
                  ? toUrlParams([...path].slice(0, i + 1), fileParam)
                  : "#"
              }
            >
              {favorites
                .map((fav) => JSON.stringify(fav))
                .indexOf(JSON.stringify([...path].splice(0, i + 1))) !== -1 &&
                "⭐"}
              {JSON.stringify(startDir) ===
                JSON.stringify([...path].splice(0, i + 1)) && "🏠"}
              {p}{" "}
            </Link>
            <span className="font-bold px-1 text-sm mb-1">
              {i + 1 < path.length && "/"}
            </span>
          </React.Fragment>
        ))}
      </div>
      <div className="px-2">
        <div className="flex flex-wrap max-h-[400px] overflow-auto">
          {path.length > 0 && (
            <Link
              className="border mr-1 mb-1 px-5 bg-yellow-50"
              to={toUrlParams([
                [...path].splice(0, path.length - 1),
                fileParam,
              ])}
            >
              ..
            </Link>
          )}
          {dirs.map((dir, i) => (
            <Link
              key={i + dir + "dira"}
              className="border mr-1 mb-1 px-1"
              to={toUrlParams([[...path, dir], fileParam])}
            >
              {dir}
            </Link>
          ))}
          {/* <TestNumbers /> */}
        </div>
      </div>
    </div>
  );
};

const RecentFiles = ({ videoHistory }) => (
  <div className="mb-4 w-full">
    <h2 className="text-lg font-bold">Recent</h2>
    <ul className="pl-4 w-full max-h-[500px] overflow-auto">
      {videoHistory.map((vh) => (
        <li key={vh.file.videoSrc} className="w-full mb-2">
          <Link
            className=""
            to={toUrlParams([vh.file.path, [...vh.file.path, vh.file.name]])}
          >
            <div className="mb-1 flex w-100">
              <img
                src={vh.file.imgSrc}
                alt="img"
                className="w-16 h-9 mr-1 flex-shrink-0"
                loading="lazy"
                onError={(e) => {
                  e.target.src = noimg;
                }}
              />
              <p className="overflow-hidden break-all h-9 text-sm">
                {vh.file.name}
              </p>
            </div>

            <div className="w-full border h-1">
              <div
                className={`bg-blue-500 h-full`}
                style={{
                  width: (vh.currentTime / vh.duration) * 100 + "%",
                }}
              >
                {" "}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default Sidebar;
