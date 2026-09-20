import { expect, test, describe } from 'vitest'
import { isValidUrl, createShortUrl, generateShortCode } from '../utils/index.js';

describe('should validate URL', () => {
    test('should return true for valid URL', () => {
        const sampleUrl = isValidUrl("https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http");
        expect(sampleUrl).toEqual(true)
    })

    test('should return false for invalid URL', () => {
        const sampleUrl = isValidUrl("modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http");
        expect(sampleUrl).toEqual(false)
    })
})
// K91-mPz
describe('should create short URL', () => {
    test('should create short URL from code', () => {
        const shortUrl = createShortUrl("aB7_x2Q")
        expect(shortUrl).toBe(`${process.env.BASE_URL}/aB7_x2Q`)
    })
})

describe('should generate short code', () => {
    test('should generate a 7 character short code', () => {
        const shortCode = generateShortCode()
        expect(shortCode).toHaveLength(7)
    })

    test('should generate a valid base64url short code', () => {
        const shortCode = generateShortCode()
        expect(shortCode).toMatch(/^[A-Za-z0-9_-]{7}$/);
    })
})