export function isJwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiration = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expiration;
  } catch (e) {
    console.error("Invalid JWT", e);
    return true; // Assume expired if JWT is invalid
  }
}
