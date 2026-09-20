import { expect, test, describe, afterEach, afterAll, beforeEach, vi } from 'vitest'
import { redirectToUrl, shortenUrl, type ShortenResponse } from '../services/index.js'
import { InvalidShortCodeError, ShortCodeExpiredError, ShortCodeNotFoundError } from "../types/error.js"
import { getPool } from '../config/db.js'
import * as utils from "../utils/index.js"

afterEach(async () => {
    const pool = getPool()
    await pool.query('TRUNCATE links RESTART IDENTITY CASCADE')
});

afterAll(async () => {
    const pool = getPool()
    await pool.end()
})

describe('should shorten URL', () => {
    test('should return a short_url and persists the long_url', async () => {
        const url = await shortenUrl("https://vitest.dev/guide/learn/async.html")
        expect(url.long_url).toBe("https://vitest.dev/guide/learn/async.html");

        const shortCode = url.short_url.split('/').pop()
        expect(shortCode).toMatch(/^[A-Za-z0-9_-]{7}$/)
        expect(url.short_url).toBe(`${process.env.BASE_URL}/${shortCode}`)
    })
})

describe('should redirect short code to original URL', () => {
    let createdVal: ShortenResponse;
    let before: number;

    beforeEach(async () => {
        before = Date.now();
        createdVal = await shortenUrl("https://vitest.dev/guide/learn/async.html");
    })

    test('should return the long_url from short code', async () => {
        const shortCode = createdVal.short_url.split('/').pop();
        const url = await redirectToUrl(shortCode as string);

        expect(url).toBe("https://vitest.dev/guide/learn/async.html")
    })

    test('should throw an error on malformed short code', async () => {
        await expect(redirectToUrl("qbd gghsf")).rejects.toBeInstanceOf(InvalidShortCodeError)
    })

    test('should throw an error short code does not exist', async () => {
        await expect(redirectToUrl("qbdgghs")).rejects.toBeInstanceOf(ShortCodeNotFoundError)
    })

    test('should set expires_at to 72 hours from now', async () => {
        const expiresAt = new Date(createdVal.expires_at).getTime();
        const expectedMs = before + 72 * 60 * 60 * 1000

        expect(expiresAt).toBeGreaterThanOrEqual(expectedMs - 1000);

        expect(expiresAt).toBeLessThanOrEqual(expectedMs + 1000);
    })

    test('should reject an expired short code', async () => {
        const pool = getPool()
        const client = await pool.connect();

        try {
            const query = {
                text: `INSERT INTO links(long_url, short_code, expires_at)
                  VALUES($1, $2, NOW() - INTERVAL '1 hour')
                  RETURNING short_code
                `,
                values: ['https://example.com', 'K91-mPz']
            }
            const res = await client.query(query)
            const result = res.rows[0];

            await expect(redirectToUrl(result.short_code)).rejects.toBeInstanceOf(ShortCodeExpiredError)

        } finally {
            client.release();
        }

    })

    test('should update accessed count on successful redirect', async () => {
        const shortCode = createdVal.short_url.split('/').pop();
        await redirectToUrl(shortCode as string)

        const pool = getPool()
        const res = await pool.query('SELECT accessed_count FROM links WHERE short_code = $1', [shortCode])
        expect(res.rows[0].accessed_count).toBe(1)
    })

    test('should not update accessed_count when redirecting an expired code', async () => {
        const pool = getPool()
        const client = await pool.connect();

        try {
            await client.query({
                text: `INSERT INTO links(long_url, short_code, expires_at)
                  VALUES($1, $2, NOW() - INTERVAL '1 hour')
                `,
                values: ['https://example.com', 'K91-mPz']
            })
        } finally {
            client.release();
        }
        await expect(redirectToUrl('K91-mPz')).rejects.toBeInstanceOf(ShortCodeExpiredError);

        const res = await pool.query(
            'SELECT accessed_count FROM links WHERE short_code = $1',
            ['K91-mPz']
        )
        expect(res.rows[0].accessed_count).toBe(0)
    })
})

test('regenerates short code on collision', async () => {
    const pool = getPool()
    const client = await pool.connect()

    try {
        await client.query({
            text: `INSERT INTO links(long_url, short_code, expires_at)
                   VALUES($1, $2, NOW() + INTERVAL '72 hours')`,
            values: ['https://existing.example.com', 'AAAAAAA']
        })
    } finally {
        client.release()
    }
    const spy = vi.spyOn(utils, 'generateShortCode')
        .mockImplementationOnce(() => 'AAAAAAA')
        .mockImplementationOnce(() => 'BBBBBBB')

    const result = await shortenUrl('https://new.example.com')

    expect(result.short_url.split('/').pop()).toBe('BBBBBBB')
    expect(spy).toHaveBeenCalledTimes(2)
    spy.mockRestore()
})