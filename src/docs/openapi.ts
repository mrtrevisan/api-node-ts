// OpenAPI spec written by hand; keep it in sync with routes.ts
const credentials = {
    type: 'object',
    required: ['email', 'password'],
    properties: {
        email: { type: 'string', format: 'email', example: 'ana@example.com' },
        password: { type: 'string', minLength: 8, example: 'secret123' },
    },
};

const error = (description: string) => ({
    description,
    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

const code = { name: 'code', in: 'path', required: true, schema: { type: 'string' }, example: 'aB3x_9Z' };

export const openapi = {
    openapi: '3.0.3',
    info: { title: 'URL shortener', version: '1.0.0' },
    components: {
        securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
        schemas: {
            Error: {
                type: 'object',
                properties: { message: { type: 'string' }, code: { type: 'integer' } },
            },
            Link: {
                type: 'object',
                properties: { code: { type: 'string' }, url: { type: 'string' } },
            },
        },
    },
    paths: {
        '/auth/register': {
            post: {
                tags: ['auth'],
                summary: 'Create a user',
                requestBody: { required: true, content: { 'application/json': { schema: credentials } } },
                responses: {
                    201: {
                        description: 'User created',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { id: { type: 'integer' }, email: { type: 'string' } },
                                },
                            },
                        },
                    },
                    400: error('Invalid email or password'),
                    409: error('Email already registered'),
                },
            },
        },
        '/auth/login': {
            post: {
                tags: ['auth'],
                summary: 'Get a JWT valid for 1 hour',
                requestBody: { required: true, content: { 'application/json': { schema: credentials } } },
                responses: {
                    200: {
                        description: 'Logged in',
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { token: { type: 'string' } } },
                            },
                        },
                    },
                    401: error('Invalid credentials'),
                },
            },
        },
        '/links': {
            post: {
                tags: ['links'],
                summary: 'Shorten a URL',
                security: [{ bearer: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['url'],
                                properties: { url: { type: 'string', example: 'https://example.com' } },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Link created',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/Link' } } },
                    },
                    400: error('Invalid URL'),
                    401: error('Missing, invalid or expired token'),
                },
            },
        },
        '/links/{code}': {
            get: {
                tags: ['links'],
                summary: 'Stats of one of your links',
                security: [{ bearer: [] }],
                parameters: [code],
                responses: {
                    200: {
                        description: 'Link stats',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/Link' },
                                        {
                                            type: 'object',
                                            properties: {
                                                createdAt: { type: 'string', format: 'date-time' },
                                                clicks: { type: 'integer' },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    401: error('Missing, invalid or expired token'),
                    404: error('Link not found or owned by another user'),
                },
            },
        },
        '/{code}': {
            get: {
                tags: ['links'],
                summary: 'Follow a link (records a click)',
                parameters: [code],
                responses: {
                    302: { description: 'Redirect to the URL' },
                    404: error('Link not found'),
                },
            },
        },
    },
};
