import { useSearchParams } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";

function Playlist(props) {
  const {
    className,
    fileSelected,
    activePlaylist,
    playlists,
    setShowPlaylist,
    setPlaylist,
    setPlaylists,
    createPlaylist,
  } = props;

  return (
    <div className={`${className} flex`}>
      <div
        className="w-full bg-white opacity-20"
        onClick={() => setShowPlaylist(false)}
      ></div>
      <div className="w-10/12 md:w-96 border-l-2 overflow-hidden overflow-y-auto flex-shrink-0 p-5 bg-white dark:bg-slate-900">
        <Playlists
          activePlaylist={activePlaylist}
          playlists={playlists}
          setPlaylist={setPlaylist}
          setPlaylists={setPlaylists}
          createPlaylist={createPlaylist}
        />
        <Queue fileSelected={fileSelected} activePlaylist={activePlaylist} />
      </div>
    </div>
  );
}

const Playlists = ({
  playlists = [],
  activePlaylist,
  createPlaylist,
  setPlaylist,
  setPlaylists,
}) => {
  const navigate = useNavigate();

  return (
    <div className="mb-5 w-full">
      <h2 className="text-lg font-bold mb-1">💽 Playlists</h2>
      <div className="flex flex-col">
        <Link
          to="#"
          className="ml-2 mb-2 py-1 border font-bold text-center"
          onClick={() => {
            const name = window.prompt("enter playlist name");
            if (name !== null) createPlaylist({ name });
          }}
        >
          New playlist
        </Link>
        <div className="ml-2 max-h-[200px] overflow-auto pr-1">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="flex border">
              <Link
                to="#"
                className="w-11/12"
                onClick={() => setPlaylist(playlist)}
              >
                <p className="px-1 p mb-1 break-all font-semibold">
                  {playlist.name}{" "}
                  <span className="text-sm">
                    ({playlist.files.length} files)
                  </span>
                  {/* <button className="float-right">X</button> */}
                </p>
              </Link>
              <Link
                to="#"
                className="w-1/12 text-center hover:bg-slate-300 hover:text-black"
                onClick={(e) => {
                  e.preventDefault();
                  if (window.confirm(`delete playlist ${playlist.name}?`))
                    setPlaylists((prev) =>
                      prev.filter((pl) => pl.id !== playlist.id)
                    );
                  if (playlist.id === activePlaylist.id) navigate("/");
                }}
              >
                x
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Queue = ({ fileSelected = {}, activePlaylist = {} }) => {
  const [search] = useSearchParams();
  const fileId = search.get("fileId");

  return (
    <div className="w-full">
      <h2 className="text-lg mb-1 font-bold">
        ▶ Now playing :{" "}
        {fileSelected ? (
          <span className="text-sm">
            {(activePlaylist && activePlaylist.name) || "Playlist"}
          </span>
        ) : (
          "-"
        )}
      </h2>
      <div className="ml-3">
        <div className={`text-sm font-bold`}>
          <p className="mb-2">{fileSelected && fileSelected.name}</p>
          {fileSelected && <p className="mb-1">Next :</p>}
        </div>
        <ul className="max-h-[250px] overflow-auto break-all pr-1">
          {activePlaylist &&
            activePlaylist.playlist &&
            [...activePlaylist.playlist]
              .splice(
                !fileSelected
                  ? 0
                  : activePlaylist.playlist.findIndex(
                      (file) => file.id === fileId
                    ) + 1,
                activePlaylist.playlist.length + 1
              )
              .map((file, i) => (
                <li
                  key={"playlist_" + file.name + i}
                  className={`text-sm mb-1`}
                >
                  {file.name}
                </li>
              ))}
        </ul>
        {/* {activePlaylist.files}
        <div className={`text-sm mt-4`}>
          
          <br /> ....
        </div> */}
      </div>
    </div>
  );
};

export default Playlist;
