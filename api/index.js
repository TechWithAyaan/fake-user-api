const http = require('http');
const url = require('url');
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
 *   GET /api/stats   — Returns aggregate statistics across 1 000 generated users.
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

    } else if (path.startsWith('/api/data')) {
        /**
         * GET /api/data
         * Returns a paginated, filterable list of generated user objects.
         *
         * Query parameters:
         *   limit   {number}  Max records per page (default: 1000)
         *   page    {number}  1-based page number (default: 1)
         *   city    {string}  Filter by city name (case-insensitive substring)
         *   job     {string}  Filter by job title (case-insensitive substring)
         *   minAge  {number}  Minimum age (inclusive)
         *   maxAge  {number}  Maximum age (inclusive)
         *
         * Response 200: { data: User[], pagination: {...}, filters: {...} }
         */
        const parsedUrl = url.parse(req.url, true);
        const query = parsedUrl.query;
        const limit = parseInt(query.limit) || 1000;
        const page = parseInt(query.page) || 1;
        const filterCity = query.city;
        const filterJob = query.job;
        const minAge = parseInt(query.minAge);
        const maxAge = parseInt(query.maxAge);

        const users = [];
        for (let i = 1; i <= 1000; i++) {
            users.push(buildUser(i));
        }

        let filtered = users;
        if (filterCity) filtered = filtered.filter(u => u.city.toLowerCase().includes(filterCity.toLowerCase()));
        if (filterJob) filtered = filtered.filter(u => u.jobTitle.toLowerCase().includes(filterJob.toLowerCase()));
        if (!isNaN(minAge)) filtered = filtered.filter(u => u.age >= minAge);
        if (!isNaN(maxAge)) filtered = filtered.filter(u => u.age <= maxAge);

        const start = (page - 1) * limit;
        const paginatedUsers = filtered.slice(start, start + limit);

        const response = {
            data: paginatedUsers,
            pagination: {
                page,
                limit,
                total: filtered.length,
                pages: Math.ceil(filtered.length / limit)
            },
            filters: {
                city: filterCity || null,
                job: filterJob || null,
                ageRange: { min: minAge || null, max: maxAge || null }
            }
        };

        res.writeHead(200, { 'Content-Type': 'application/json', 'X-RateLimit-Limit': '100', 'X-RateLimit-Remaining': '99' });
        res.end(JSON.stringify(response, null, 2));

    } else if (path === '/api/stats') {
        /**
         * GET /api/stats
         * Returns aggregate statistics computed across 1 000 generated users.
         *
         * Response 200:
         *   {
         *     totalUsers:       number,
         *     averageAge:       number,
         *     activeUsers:      number,
         *     cities:           number,   // unique city count
         *     jobs:             number,   // unique job-title count
         *     ageDistribution:  { '18-25': number, '26-35': number,
         *                         '36-45': number, '46-60': number }
         *   }
         */
        const users = [];
        for (let i = 1; i <= 1000; i++) {
            users.push(buildUser(i));
        }

        const stats = {
            totalUsers: users.length,
            averageAge: Math.round(users.reduce((sum, u) => sum + u.age, 0) / users.length),
            activeUsers: users.filter(u => u.isActive).length,
            cities: [...new Set(users.map(u => u.city))].length,
            jobs: [...new Set(users.map(u => u.jobTitle))].length,
            ageDistribution: {
                '18-25': users.filter(u => u.age >= 18 && u.age <= 25).length,
                '26-35': users.filter(u => u.age >= 26 && u.age <= 35).length,
                '36-45': users.filter(u => u.age >= 36 && u.age <= 45).length,
                '46-60': users.filter(u => u.age >= 46 && u.age <= 60).length
            }
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats, null, 2));

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
            message: 'Use /api/data, /api/yolo, or /api/stats endpoints',
            availableEndpoints: ['/api/health', '/api/data', '/api/yolo', '/api/stats']
        }, null, 2));
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[${new Date().toISOString()}] Server listening on port ${PORT}`);
});
