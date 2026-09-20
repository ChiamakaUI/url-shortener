
export class AppError extends Error {
    constructor(
        public statusCode: number,
        public title: string,
        message: string,
        public type: string = "about:blank",
    ) {
        super(message);
        // Object.setPrototypeOf(this, AppError.prototype);
    }
}

export class InvalidUrlError extends AppError {
    constructor(message = "The provided URL is not valid") { super(400, "URL is not valid", message, "https://yourapp.dev/errors/invalid-url") }
}
export class InvalidShortCodeError extends AppError {
    constructor(message = "The short code format is invalid") { super(400, "Invalid short code", message, "https://yourapp.dev/errors/invalid-short-code") }
}
export class ShortCodeNotFoundError extends AppError {
    constructor(message = "No link exists for this short code") {
        super(404, "Short code not found", message, "https://yourapp.dev/errors/short-code-not-found")
    }
}
export class ShortCodeExpiredError extends AppError {
    constructor(message = "This short code has expired") {
        super(410, "Short code has expired", message, "https://yourapp.dev/errors/short-code-expired")
    }
}