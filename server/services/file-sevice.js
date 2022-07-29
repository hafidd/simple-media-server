const os = require("os");
const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");

const genThumbnail = require("simple-thumbnail");
const { SubtitleParser } = require("matroska-subtitles");
const Vtt = require("vtt-creator");

const platform = os.platform();

const { serverPath } = require("../");

//const scanIds = require("../index");

async function getRootDirs() {
  if (platform === "win32") {
    //console.log("windows");
    try {
      const child = require("child_process");
      // nyari C: D: E: dst...
      const stdout = child.execSync("wmic logicaldisk get name").toString();
      const dirs = stdout
        .split("\r\r\n")
        .filter((value) => /[A-Za-z]:/.test(value))
        .map((value) => value.trim());
      return { dirs, files: [] };
    } catch (error) {
      __returnError(error);
    }
  } else {
    try {
      const dirs = await getDirs(path.parse(process.cwd()).root);
      //const dirs = await getDirs("/");
      return dirs;
    } catch (error) {
      __returnError(error);
    }
  }
}

// get directory and file list
// p = ["/", "home", "prkm"]
async function getDirs(
  p = [],
  ext = [
    ".mp4",
    ".mkv",
    ".flv",
    ".mov",
    ".avi",
    ".wmv",
    ".ts",
    ".mp3",
    ".wav",
    ".ogg",
  ]
) {
  p = getFilePath(p);
  //console.log(p);
  try {
    if (p.length < 1) return getRootDirs();
    const fullPath = path.join(p, "/");
    //console.log(fullPath);
    //const allFiles = fs.readdirSync(fullPath, { withFileTypes: true });
    const allFiles = await fsPromises.readdir(fullPath, {
      withFileTypes: true,
    });
    const dirs = allFiles
      .filter((item) => item.isDirectory())
      .map((item) => item.name);
    // filter files
    const files = allFiles
      .filter(
        (item) =>
          item.isFile() &&
          ext.indexOf(path.extname(item.name).toLowerCase()) !== -1
      )
      .map((item) => item.name);
    return { dirs, files };
  } catch (error) {
    __returnError(error);
  }
}

// get files recursive
// return = [{dirPath: arr, file: string}]
const getFiles = async function ({
  id,
  dirPath,
  arrayOfFiles,
  exclude = [
    "node_modules",
    "windows",
    ".pnpm-store",
    "program files",
    "programdata",
    "appdata",
    "program files (x86)",
  ],
}) {
  if (
    exclude
      .map((e) => e.toLowerCase())
      .indexOf(dirPath[dirPath.length - 1].toLowerCase()) !== -1
  ) {
    console.log(`skip ${dirPath.join("/")}`);
    throw new Error("");
  }

  // cancel
  if (scanIds.indexOf(id) === -1) return [];

  dirs = await getDirs(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  arrayOfFiles = [
    ...arrayOfFiles,
    ...dirs.files.map((file) => ({ dirPath, file })),
  ];

  for (const dir of dirs.dirs) {
    try {
      if (
        exclude.map((e) => e.toLowerCase()).indexOf(dir.toLowerCase()) !== -1
      ) {
        console.log(`skip ${[...dirPath, dir].join("/")}`);
        continue;
      }
      arrayOfFiles = await getFiles({
        id,
        dirPath: [...dirPath, dir],
        arrayOfFiles,
      });
    } catch (error) {
      console.log(
        `skip ${[...dirPath, dir].join("/")}`,
        error && error.status ? error.status : ""
      );
      continue;
    }
  }

  return arrayOfFiles;
};

let test = 1;
// create file stream
function getFileStream(props) {
  try {
    const { range, arrPath, stringPath } = props;
    filePath = arrPath ? getFilePath(arrPath) : stringPath;
    // console.log(filePath);
    const stat = fs.statSync(filePath);
    // console.log(filePath, stat);
    const total = stat.size;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const partialstart = parts[0];
      const partialend = parts[1];

      const max = 8 * 1024 * 1024;

      const start = parseInt(partialstart, 10);
      //const endx = partialend ? parseInt(partialend, 10) : total - 1;
      const end = partialend
        ? parseInt(partialend, 10)
        : start + max < total
        ? start + max - 1
        : total - 1;
      const chunksize = end - start + 1;
      console.log(
        { start: partialstart / 1024 / 1024 },
        { end: partialend / 1024 / 1024 }
      );
      console.log(
        filePath,
        `(${test++})`,
        `Total:${Math.trunc(total / (1024 * 1024))}MB`,
        `Start:${Math.floor(start / 1024 / 1024)}`,
        `End:${Math.floor(end / 1024 / 1024)}`,
        `Size:${Math.floor(chunksize / 1024 / 1024)}`
      );

      return {
        stream: fs.createReadStream(filePath, { start: start, end: end }),
        stats: { start, end, chunksize, total },
      };
    } else {
      return {
        stream: fs.createReadStream(filePath),
        stats: { total },
      };
    }
  } catch (error) {
    __returnError(error);
  }
}

// [matroska-subtitles, vtt-creator]
// extract subtitle, convert to vtt
function getMkvSubtitles(arrPath) {
  return new Promise((resolve, reject) => {
    try {
      const filePath = getFilePath(arrPath);
      const parser = new SubtitleParser();

      let subtitles = [];
      let files = [];

      // create file stream
      const fileStream = fs.createReadStream(filePath);
      fileStream.on("error", (err) => reject(err));
      fileStream.on("ready", () => fileStream.pipe(parser));

      // first an array of subtitle track information is emitted
      parser.once("tracks", (tracks) => {
        //console.log(tracks)
        // ???
        let subtitlesExist = true;
        tracks.forEach((track, i) => {
          // check
          const subtitlePath = path.join(
            serverPath,
            "files/subtitles",
            filePath.replace(/[/\\?%*:|"<>]/g, "-") +
              `-${track.number}-${track.language || "unknown"}` +
              ".vtt"
          );
          tracks[i].p = subtitlePath;
          files[track.number] = { path: null, file: null };
          files[track.number].path = subtitlePath;
          if (!checkFileExistsSync(subtitlePath)) subtitlesExist = false;
        });

        subtitles = tracks;

        if (!subtitlesExist)
          tracks.forEach((track) => {
            files[track.number].file = fs.createWriteStream(
              files[track.number].path
            );
          });
        else parser.emit("finish");
      });

      // afterwards each subtitle is emitted
      parser.on("subtitle", (subtitle, trackNumber) => {
        subtitle = {
          time: subtitle.time,
          duration: subtitle.duration,
          text: subtitle.text.replace(/(\{.+\})/g, "").split("\\N"),
        };
        subtitles = subtitles.map((sub) => {
          if (trackNumber === sub.number) {
            if (sub.v === undefined) sub.v = new Vtt();
            sub.v.add(
              subtitle.time / 1000,
              (subtitle.time + subtitle.duration) / 1000,
              subtitle.text
            );
          }
          return sub;
        });
      });

      parser.on("finish", () => {
        // write to file
        subtitles.forEach((subtitle) => {
          if (files[subtitle.number].file !== null) {
            files[subtitle.number].file.write(subtitle.v.toString());
            files[subtitle.number].file.end();
          }
        });

        resolve(
          subtitles.map((sub) => ({
            number: sub.number,
            language: sub.language || "",
            p: "/subtitle/" + encodeURIComponent(sub.p),
          }))
        );
      });
    } catch (error) {
      reject(error);
    }
  });
}

// [simple-thumbnail]
// get video thumbnail
async function getThumbnailStream(videoPath) {
  if (!videoPath) throw newErr({ status: 400 });
  videoPath = getFilePath(videoPath);

  // thumbnail filepath
  const fileName = videoPath.replace(/[/\\?%*:|"<>]/g, "-") + ".png";
  const tbPath = path.join(serverPath, "files", "thumbnails", fileName);
  console.log(typeof __dirname);
  //console.log("FILENAME", fileName);
  // thumbnail exist
  if (checkFileExistsSync(tbPath)) return fs.createReadStream(tbPath);

  // thumbnail not exist, create new
  try {
    if (!checkFileExistsSync(videoPath))
      throw newErr({ status: 404, message: "file not found" });
    await genThumbnail(videoPath, tbPath, "?x85");
    return fs.createReadStream(tbPath);
  } catch (error) {
    //__returnError(error);
    __returnError({});
  }
}

// error object
function newErr(props) {
  //console.log("new error" , props)
  const { status = "", message = "error" } = props;
  const err = new Error();
  err.status = status;
  err.message = message;
  return err;
}

function checkFileExistsSync(filepath) {
  let flag = true;
  try {
    fs.accessSync(filepath, fs.constants.F_OK);
  } catch (e) {
    flag = false;
  }
  return flag;
}

// convert array to filepath
const getFilePath = (p = []) => {
  p = platform === "win32" ? p : ["/", ...p];
  return path.join(...p);
};

const getMimeType = (fileName) => {
  switch (fileName) {
    case "mp4":
      return "video/mp4";
    case "mkv":
      //return "video/x-matroska"
      return "mkv";
    case "flv":
      return "video/x-flv";
    case "avi":
      return "video/x-msvideo";
    case "wmv":
      return "video/x-ms-wmv";
    case "mov":
      return "video/quicktime";
    case "ts":
      return "video/MP2T";
    case "mp3":
      return "audio/mpeg";
    case "ogg":
      return "audio/ogg";
    case "wav":
      return "audio/vnd.wav";
    default:
      return "video/mp4";
  }
};

function __returnError(error) {
  if (
    (error.code && (error.code === "ENOENT" || error.code === "EACCES")) ||
    error instanceof TypeError ||
    (error.status && error.status === 404)
  )
    throw newErr({ status: 404, message: "not found" });
  console.log(error);
  throw error;
}

function testy() {
  return scanIds;
}
module.exports = {
  getDirs,
  getFiles,
  getMimeType,
  getFilePath,
  getFileStream,
  getMkvSubtitles,
  getThumbnailStream,
  testy,
};
