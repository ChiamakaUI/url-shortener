import request from 'supertest'
import { afterAll, afterEach, expect, test, vi } from 'vitest'
import app from '../app.js'
import { getPool } from '../config/db.js'
import * as services from '../services/index.js'


afterEach(async () => {
    const pool = getPool()
    await pool.query('TRUNCATE links RESTART IDENTITY CASCADE')
    vi.restoreAllMocks()
})

afterAll(async () => {
    const pool = getPool()
    await pool.end()
})

test('POST /shorten returns 400 for missing url', async () => {
    const res = (await request(app).post('/shorten').send({}))
    expect(res.status).toBe(400)
})

test('POST /shorten returns 400 for invalid url', async () => {
    const res = (await request(app).post('/shorten').send({ url: "ggsd" }))
    expect(res.status).toBe(400)
})

test('POST /shorten returns 400 when url is an object, not a string', async () => {
    const res = (await request(app).post('/shorten').send({ url: {} }))
    expect(res.status).toBe(400)
})

test('POST /shorten returns 400 when url is a number not string', async () => {
    const res = (await request(app).post('/shorten').send({ url: 12345 }))
    expect(res.status).toBe(400)
})

test('POST /shorten returns 201 for valid url', async () => {
    const res = (await request(app).post('/shorten').send({ url: "https://github.com/forwardemail/supertest" }))
    expect(res.status).toBe(201)
})

test('GET /:code returns 400 for malformed code', async () => {
    const res = await request(app).get('/qb%20d')
    expect(res.status).toBe(400)
})
test('GET /:code returns 404 for non-existent code', async () => {
    const res = await request(app).get('/qbdgghs')
    expect(res.status).toBe(404)
})

test('GET /:code returns 410 for expired code', async () => {
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
        const requestRes = await request(app).get(`/${result.short_code}`)
        expect(requestRes.status).toBe(410)
    } finally {
        client.release();
    }

})

test('GET /:code returns 302 and redirects for valid code', async () => {
    const shortCode = await services.shortenUrl("https://vitest.dev/guide/learn/async.html");

    const urlPath = new URL(shortCode.short_url).pathname;
    const res = await request(app).get(urlPath)
    expect(res.status).toBe(302)
    expect(res.header.location).toBe("https://vitest.dev/guide/learn/async.html");
})

test('POST /shorten returns 500 for unknown error', async () => {

    const spy = vi.spyOn(services, 'shortenUrl').mockRejectedValueOnce(new Error("boom"))
    const res = await request(app).post('/shorten').send({ url: 'https://example.com' })

    expect(res.status).toBe(500)
    expect(res.body).toMatchObject({ status: 500, title: "Internal Server Error" })
})