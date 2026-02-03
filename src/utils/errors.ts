export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly fields?: Record<string, string[]>;

    constructor(message: string, statusCode: number, code: string, fields?: Record<string, string[]>) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.fields = fields;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message: string = 'Bad Request', code: string = 'BAD_REQUEST', fields?: Record<string, string[]>) {
        super(message, 400, code, fields);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
        super(message, 401, code);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN') {
        super(message, 403, code);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Not Found', code: string = 'NOT_FOUND') {
        super(message, 404, code);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Conflict', code: string = 'CONFLICT') {
        super(message, 409, code);
    }
}

export class ValidationError extends AppError {
    constructor(message: string = 'Validation Error', fields?: Record<string, string[]>) {
        super(message, 400, 'VALIDATION_ERROR', fields);
    }
}

export class InternalServerError extends AppError {
    constructor(message: string = 'Internal Server Error', code: string = 'INTERNAL_SERVER_ERROR') {
        super(message, 500, code);
    }
}
