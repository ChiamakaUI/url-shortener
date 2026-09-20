import { generateShortCode, isValidUrl, createShortUrl } from "../utils/index.js"
import { getPool } from "../config/db.js"
import { InvalidShortCodeError, InvalidUrlError, ShortCodeExpiredError, ShortCodeNotFoundError } from "../types/error.js"

// 1. check that what is passed is a complete/valid URL
// 2. generates short code if valid URL
// 3. insert in db, check if unique constraint is violated, if it is, regenerate short code, if not return short code/url to user

export type ShortenResponse = {
    long_url: string,
    short_url: string,
    expires_at: Date,
}
/**
 * 
 * @param url 
 * @returns 
 */
export const shortenUrl = async (url: string): Promise<ShortenResponse> => {
    if (!isValidUrl(url)) throw new InvalidUrlError()
    const pool = getPool();
    const client = await pool.connect();
    try {
        while (true) {
            const code = generateShortCode();
            try {
                const query = {
                    text: `INSERT INTO links(long_url, short_code, expires_at) 
                       VALUES($1, $2, NOW() + INTERVAL '72 hours') 
                       RETURNING expires_at, long_url
                      `,
                    values: [url, code]
                }
                const res = await client.query(query)
                const result = res.rows[0];
                const shortUrl = createShortUrl(code)
                return {
                    ...result,
                    short_url: shortUrl,
                }
            } catch (error: any) {
                if (error.code === '23505' && error.constraint === 'links_short_code_key') {
                    continue; // regenerate short code
                }
                throw error
            }
        }
    } finally {
        client.release();
    }

}

// 1. Split the url and check code is a valid code, length is 7, no whitespace or empty string
// 2. if valid, check the db for that code, and return the long url

export const redirectToUrl = async (code: string): Promise<string> => {
    // Clean up the input just in case someone passed a full URL string directly to the API

    if (!/^[A-Za-z0-9_-]{7}$/.test(code)) {
        throw new InvalidShortCodeError();
    }
    const pool = getPool();
    const client = await pool.connect();

    try {
        const query = {
            text: `SELECT long_url, expires_at
               FROM links WHERE short_code = $1`,
            values: [code]
        }
        const res = await client.query(query)

        if (res.rows.length === 0) {
            throw new ShortCodeNotFoundError();
        }

        if (res.rows[0].expires_at && res.rows[0].expires_at < new Date()) {
            throw new ShortCodeExpiredError()
        }
        
        // Updated short url accessed_count
        await client.query({
            text: `UPDATE links SET accessed_count = accessed_count + 1
                WHERE short_code = $1            
            `,
            values: [code]
        })
        return res.rows[0].long_url;
    } finally {
        client.release();
    }

}