export const supportsDB = () => {
  if ('indexedDB' in window) {
    return true;
  }

  return false;
};