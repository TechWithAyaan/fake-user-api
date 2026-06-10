const http = require('http');
const { faker } = require('@faker-js/faker');

/**
 * Fake User API
 *
 * A lightweight HTTP API that generates realistic fake user data using
 * @faker-js/faker. Intended for front-end prototyping, testing, and demos.
 *
 * Endpoints:
 *   GET /api/health  — Health check; returns service status and timestamp.
 *   GET /api/data    — Returns an array of 1 000 randomly generated users.
 *   GET /api/yolo    — Returns a single randomly generated user.
 */

/**
 * Log an incoming request to stdout.
 *
 * @param {http.IncomingMessage} req - The incoming request object.
 */
function logRequest(req) {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${req.method} ${req.url}`);
}

/**
 * Build a single fake-user object.
 *
 * @param {number} id - Numeric identifier to assign to the user.
 * @returns {{ id: number, firstName: string, lastName: string, email: string,
 *             phone: string, age: number, jobTitle: string, city: string,
 *             isActive: boolean }} A fake user record.
 */
function buildUser(id) {
    return {
        id,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        age: faker.number.int({ min: 18, max: 60 }),
        jobTitle: faker.person.jobTitle(),
        city: faker.location.city(),
        isActive: faker.datatype.boolean()
    };
}

const server = http.createServer((req, res) => {
    logRequest(req);

    const path = req.url;

    // Standard CORS headers applied to every response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Only GET and OPTIONS are supported
    if (req.method !== 'GET' && req.method !== 'OPTIONS') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed' }, null, 2));
        return;
    }

    // Handle pre-flight OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (path === '/api/health') {
        /**
         * GET /api/health
         * Returns the current health status of the service.
         *
         * Response 200:
         *   { status: 'healthy', timestamp: <ISO-8601 string> }
         */
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }, null, 2));

    } else if (path === '/api/data') {
        /**
         * GET /api/data
         * Returns an array of 1 000 randomly generated user objects.
         *
         * Response 200: User[]
         */
        const limit = 1000;
        const users = [];
        for (let i = 1; i <= limit; i++) {
            users.push(buildUser(i));
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(users, null, 2));

    } else if (path === '/api/yolo') {
        /**
         * GET /api/yolo
         * Returns a single randomly generated user with an extra attitude field.
         *
         * Response 200: User & { attitude: string }
         */
        const randomUser = {
            ...buildUser(Math.floor(Math.random() * 1000) + 1),
            attitude: 'YOLO! 🦈'
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(randomUser, null, 2));

    } else {
        /**
         * Catch-all — unknown route.
         * Response 404: { error, message, availableEndpoints }
         */
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Not Found',
            message: 'Use /api/data or /api/yolo endpoints',
            availableEndpoints: ['/api/health', '/api/data', '/api/yolo']
        }, null, 2));
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[${new Date().toISOString()}] Server listening on port ${PORT}`);
});
