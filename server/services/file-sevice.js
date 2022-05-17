const os = require("os");
const fs = require("fs");
const path = require("path");

const genThumbnail = require("simple-thumbnail");
const { SubtitleParser } = require("matroska-subtitles");
const Vtt = require("vtt-creator");

// [drivelist]
// get root directory
async function getRootDirs() {
  try {
    const drivelist = require("drivelist");
    const dirs = [];
    const drives = await drivelist.list();
    drives
      .filter((drive) => drive.mountpoints.length > 0)
      .forEach((drive) =>
        drive.mountpoints.forEach((mp) => dirs.push(mp.path))
      );
    return { dirs, files: [] };
  } catch (error) {
    //console.log(error);
    return getRootDirsV2();
  }
}
async function getRootDirsV2() {
  if (os.platform() === "win32") {
    console.log("windows");
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
      console.log(error);
      throw newErr({ status: 500 });
    }
  } else {
    try {
      const dirs = await getDirs(path.parse(process.cwd()).root);
      //const dirs = await getDirs("/");
      return dirs;
    } catch (error) {
      console.log(error);
      throw newErr({ status: 500 });
    }
  }
}

// get directory and file list
// p = ["/", "home", "prkm"]
function getDirs(
  p = [],
  ext = [".mp4", ".mkv", ".flv", ".mov", ".avi", ".wmv"]
) {
  try {
    if (p.length < 1) return getRootDirs();
    const fullPath = path.join(...p, "/");
    //console.log(fullPath);
    const allFiles = fs.readdirSync(fullPath, { withFileTypes: true });
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
    if (
      (error.code && (error.code === "ENOENT" || error.code === "EACCES")) ||
      error instanceof TypeError
    )
      throw newErr({ status: 404, message: "not found" });
    console.log(error);
    throw error;
  }
}

// create file stream
function getFileStream(props) {
  try {
    const { range, arrPath, stringPath } = props;
    filePath = arrPath ? getFilePath(arrPath) : stringPath;
    console.log(filePath);
    const stat = fs.statSync(filePath);
    const total = stat.size;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const partialstart = parts[0];
      const partialend = parts[1];

      const max = 2000000;

      const start = parseInt(partialstart, 10);
      //const endx = partialend ? parseInt(partialend, 10) : total - 1;
      const end = partialend
        ? parseInt(partialend, 10)
        : start + max < total
        ? start + max - 1
        : total - 1;
      const chunksize = end - start + 1;
      // console.log(
      //   filePath,
      //   `${total / 1000000} MB`,
      //   start,
      //   end,
      //   `${chunksize / 1000000} MB`
      // );

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
    throw fsErr(error);
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
            "server/files/subtitles",
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
  const tbPath = path.join("server", "files", "thumbnails", fileName);
  //console.log("FILENAME", fileName);
  // thumbnail exist
  if (checkFileExistsSync(tbPath)) return fs.createReadStream(tbPath);

  // thumbnail not exist, create new
  try {
    if (!checkFileExistsSync(videoPath)) throw newErr({ status: 404 });
    await genThumbnail(videoPath, tbPath, "?x85");
    return fs.createReadStream(tbPath);
  } catch (error) {
    console.log("error generate thumbnail");
    console.log(error);
    throw newErr({ status: 500 });
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

function fsErr(error) {
  const err = new Error();
  err.status = error.code && error.code === "ENOENT" ? 404 : 500;
  err.message =
    error.code && error.code === "ENOENT" ? "file not found" : error.message;
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
const getFilePath = (p = []) => path.join(...p);

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
    default:
      return "";
  }
};

module.exports = {
  getDirs,
  getMimeType,
  getFilePath,
  getFileStream,
  getMkvSubtitles,
  getThumbnailStream,
};
