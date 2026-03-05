export class AppError extends Error {
    readonly timestamp: string
    readonly statusCode: number
    readonly details: unknown

    constructor(message: string, statusCode: number, details: unknown = undefined) {
        super(message)
        this.name = this.constructor.name
        this.timestamp = new Date().toISOString()
        this.statusCode = statusCode
        this.details = details

        // needed for instanceof to work correctly in TS
        Object.setPrototypeOf(this, new.target.prototype)
    }
}
