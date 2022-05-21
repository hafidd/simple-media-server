const toUrlParams = (arr = []) => {
  let urlParam = "";
  arr.forEach(
    (a) =>
      (urlParam += `/${
        Array.isArray(a) ? encodeURIComponent(JSON.stringify(a)) : a
      }`)
  );
  return urlParam;
};

export { toUrlParams };
