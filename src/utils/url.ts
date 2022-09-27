export function hashObjectValueOrNull(key: string) {
  try {
    return JSON.parse(decodeURI(window.location.hash).slice(1))[key];
  } catch (e) {
    return null;
  }
}
