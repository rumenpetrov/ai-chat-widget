export const removeTrailingSlash = (string: string) => {
  return string.replace(/\/$/, "");
};

export default removeTrailingSlash;