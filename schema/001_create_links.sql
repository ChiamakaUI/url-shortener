CREATE TABLE links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    long_url TEXT NOT NULL,
    short_code TEXT UNIQUE NOT NULL,
    accessed_count INT NOT NULL DEFAULT 0, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ
);

