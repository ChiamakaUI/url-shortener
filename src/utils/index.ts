import { randomBytes } from "crypto"

/**
 * Checks if a URL is valid
 * @param urlString The URL to validate
 */
export const isValidUrl = (urlString: string): boolean => {
  return URL.canParse(urlString);
}

/**
 * Generates a random, URL-safe short code.
 * @param length The length of the code (default 7 creates ~3.5 trillion combinations)
 */
export const generateShortCode = (length: number = 7): string => {
  return randomBytes(length)
    .toString("base64url") // Uses A-Z, a-z, 0-9, "-", and "_"
    .substring(0, length);
}

/**
 * Creates the full short URL
 * @param baseUrl The URL to generate code for
 */
export const createShortUrl = (code: string): string => `${process.env.BASE_URL}/${code}`
