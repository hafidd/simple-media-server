const toUrlParams = (arr = [], log = false) => {
  let urlParam = "";
  arr.forEach(
    (a) =>
      (urlParam += `/${
        Array.isArray(a) ? encodeURIComponent(JSON.stringify(a)) : a
      }`)
  );
  if (log) console.log({ arr, urlParam });
  return urlParam;
};

const getHours = (time) => Math.trunc(time / 3600);
const getMinutes = (time) => Math.trunc((time % 3600) / 60);
const getSeconds = (time) => time % 60;
const getTimer = (time) =>
  `
  ${getHours(time) > 0 ? `${getHours(time)}h ` : ""}
  ${getMinutes(time) > 0 ? `${getMinutes(time)}m ` : ""}
  ${
    getHours(time) === 0 && getMinutes(time) === 0 ? `${getSeconds(time)}s` : ""
  }
  `;

export { toUrlParams, getHours, getMinutes, getSeconds, getTimer };
