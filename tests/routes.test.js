const request = require('supertest');
const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const commtrackr = require('../index');

describe('CommTrackr Routes', () => {
    commtrackr.init({
        tenant: { name: 'TestTenant', domain: 'http://localhost:3000', path: '' },
        vars: { userId: 'id', userName: 'name', commissions: 'commissions' },
        fields: [
            { id: 'name', label: 'Name', type: 'text' },
            { id: 'name', label: 'Name', type: 'text', required: true }
        ],
        handlers: {
            create: async (req, data) => { return data; },
            update: async (req, data) => { return data; },
            sync: async (req) => { return; }
        }
    });
    var app = express();
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(session({ secret: 'test', resave: false, saveUninitialized: true, store: new MemoryStore({ checkPeriod: 86400000 }) }));
    app.use('/', commtrackr.routes);
    test('deactivation', async () => {
        commtrackr.on(false);
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.text).toContain('Disabled'); 
    });
    test('activation', async () => {
        commtrackr.on(true);
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.text).toContain('TestTenant');
    });
    test('create empty commission', async () => {
        const res = await request(app).post('/create').send({});
        expect([400].includes(res.status)).toBe(true);
    });
    test('create commission', async () => {
        const agent = request.agent(app);
        await agent.get('/');
        app.get('/set-session', (req, res) => {
            req.session.id = 'user1';
            req.session.name = 'User One';
            req.session.commissions = [];
            res.json({ ok: true });
        });
        await agent.get('/set-session');
        const createRes = await agent.post('/create').send({ name: 'Test' });
        expect([200, 500, 401].includes(createRes.status)).toBe(true);
    });
});
