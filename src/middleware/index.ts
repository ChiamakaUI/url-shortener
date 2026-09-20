import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/error.js';

export function logger(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
        console.log(JSON.stringify({
            method: req.method,
            path: req.path,
            status: res.statusCode,
            latency_ms: Date.now() - start,
        }))
    })
    next()
}

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction,
): void {
    if (err instanceof AppError) {
        res.status(err.statusCode)
            .type('application/problem+json')
            .json({
                type: err.type,
                title: err.title,
                status: err.statusCode,
                detail: err.message,
                instance: req.originalUrl,
            });
        return;
    }

    console.error('Unhandled error:', err);
    res.status(500)
        .type('application/problem+json')
        .json({
            type: "about:blank",
            title: "Internal Server Error",
            status: 500,
            detail: "An unexpected error occurred",
            instance: req.originalUrl,
        });
}