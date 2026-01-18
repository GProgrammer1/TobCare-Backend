
import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import { ZodSchema } from 'zod';
import { PrismaClient } from '../../lib/generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare module 'aws-lambda' {
    export interface Context {
        prisma: PrismaClient;
    }
}

let prisma: PrismaClient;

const prismaMiddleware = () => {
    return {
        before: async (request: middy.Request) => {
            if (!prisma) {
                const connectionString = process.env.DATABASE_URL;
                if (!connectionString) {
                    console.warn("DATABASE_URL not set in environment");
                }
                const pool = new Pool({ connectionString });
                const adapter = new PrismaPg(pool);
                prisma = new PrismaClient({ adapter });
            }
            request.context.prisma = prisma;
        }
    };
};

const bigIntReplacer = (key: string, value: any) => {
    return typeof value === 'bigint' ? value.toString() : value;
};

const responseMiddleware = () => {
    return {
        after: async (request: middy.Request) => {
            const headers = {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE"
            };

            if (request.response === undefined) {
                request.response = {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true })
                };
                return;
            }

            if (request.response.headers) {
                request.response.headers = { ...headers, ...request.response.headers };
            } else {
                request.response.headers = headers;
            }

            if (request.response.body && typeof request.response.body !== 'string') {
                request.response.body = JSON.stringify(request.response.body, bigIntReplacer);
            }
            else if (!request.response.statusCode && typeof request.response === 'object') {
                request.response = {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(request.response, bigIntReplacer)
                };
            }
        },
        onError: async (request: middy.Request) => {
            if (request.response) {
                request.response.headers = {
                    ...(request.response.headers || {}),
                    "Access-Control-Allow-Origin": "*",
                }
            }
        }
    };
};

export const zodValidator = (schemaOrMap: ZodSchema | Record<string, ZodSchema>) => {
    return {
        before: async (request: middy.Request) => {
            if (!request.event.body) return; 

            let schema: ZodSchema | undefined;

            if ('parse' in schemaOrMap) {
                schema = schemaOrMap as ZodSchema;
            } else {
                const path = request.event.path || request.event.resource;
                const found = Object.keys(schemaOrMap).find(key => path === key || path.includes(key));
                if (found) {
                    schema = schemaOrMap[found];
                }
            }

            if (schema) {
                const result = schema.safeParse(request.event.body);
                if (!result.success) {
                    throw {
                        statusCode: 400,
                        body: {
                            message: "Validation Error",
                            errors: result.error.issues
                        }
                    };
                }
                request.event.body = result.data; 
            }
        }
    };
};

export const commonMiddleware = (handler: any, schema?: ZodSchema | Record<string, ZodSchema>) => {
    const chain = middy(handler)
        .use(jsonBodyParser())
        .use(prismaMiddleware())
        .use(responseMiddleware());

    if (schema) {
        chain.use(zodValidator(schema));
    }

    chain.use(httpErrorHandler()); 
    return chain;
};
