import React from "react";
import { Link, useParams } from "react-router-dom";

export default function Sidebar(props) {
  const {
    className = "",
    dirs,
    path,
    home,
    favorites,
    videoHistory,
    setSmShowSidebar,
  } = props;

  const { fileParam = "" } = useParams();

  //console.log("rendering sidebar")
  return (
    <div className={className}>
      {/* close btn */}
      <div
        className="fixed w-1/6 right-0 h-full md:hidden -z-10 hover:cursor-pointer"
        onClick={() => {
          setSmShowSidebar(false);
        }}
      >
        <button className="fixed right-5 px-4 py-2 bg-blue-100 border border-blue-200 font-extrabold">
          {" "}
          X{" "}
        </button>
      </div>

      {/* fav */}
      <div className="fav mb-5">
        <h2 className="text-lg font-bold">⭐ Favorites ({favorites.length})</h2>
        <div className="max-h-[150px] overflow-auto mr-2">
          <ul className="pl-4">
            {favorites.map((favorite) => (
              <li
                key={JSON.stringify(favorite)}
                className="w-full border px-1 mb-1"
              >
                <Link
                  to={
                    "/" +
                    encodeURIComponent(JSON.stringify(favorite)) +
                    "/" +
                    encodeURIComponent(fileParam)
                  }
                >
                  <span className="text-sm">
                    {favorite.map((dir) => dir + "/")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* dirs */}
      <div className="mb-5">
        <div className="flex last:mr-0 flex-wrap">
          <span className="pr-1 text-sm mb-1">📁</span>
          <Link
            className="font-bold border px-1 mr-1 text-sm mb-1 min-w-[20px]"
            to={
              "/" +
              encodeURIComponent(JSON.stringify([])) +
              "/" +
              encodeURIComponent(fileParam)
            }
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
                    ? "/" +
                      encodeURIComponent(
                        JSON.stringify([...path].slice(0, i + 1))
                      ) +
                      "/" +
                      encodeURIComponent(fileParam)
                    : "#"
                }
              >
                {i + 1 === path.length && home && "🏠"}
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
                to={
                  "/" +
                  encodeURIComponent(
                    JSON.stringify([...path].splice(0, path.length - 1))
                  ) +
                  "/" +
                  encodeURIComponent(fileParam)
                }
              >
                ..
              </Link>
            )}
            {dirs.map((dir, i) => (
              <Link
                key={i + dir + "dira"}
                className="border mr-1 mb-1 px-1"
                to={
                  "/" +
                  encodeURIComponent(JSON.stringify([...path, dir])) +
                  "/" +
                  encodeURIComponent(fileParam)
                }
              >
                {dir}
              </Link>
            ))}
            {/* <TestNumbers /> */}
          </div>
        </div>
      </div>

      {/* history */}
      <div className="mb-4 w-full">
        <h2 className="text-lg font-bold">History</h2>
        <ul className="pl-4 w-full max-h-[500px] overflow-auto">
          {videoHistory.map((vh) => (
            <li key={vh.file.videoSrc} className="w-full mb-2">
              <Link
                className=""
                to={
                  "/" +
                  encodeURIComponent(JSON.stringify(vh.file.path)) +
                  "/" +
                  encodeURIComponent(
                    JSON.stringify([...vh.file.path, vh.file.name])
                  )
                }
              >
                <div className="mb-1 flex w-100">
                  <img
                    src={vh.file.imgSrc}
                    alt="a"
                    className="w-16 h-9 mr-1 flex-shrink-0"
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
    </div>
  );
}
