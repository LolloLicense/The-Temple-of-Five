/**
 * Clean path for audio files and prepend base URL from Vite config. Because the audio files are located in the public folder, which is served at the root of the project.
 */

export function withBaseUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${cleanPath}`;
}
