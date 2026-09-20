import pg from "pg"

const { Pool } = pg
let _pool: pg.Pool

export function getPool(): pg.Pool {
    if (!_pool) {
        _pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            //connectionString: "postgresql://postgres:password@localhost:5433/url_shortener",
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        })

        _pool.on("error", (err) => {
            console.error("Unexpected database pool error:", err)
        })
    }

    return _pool
}
