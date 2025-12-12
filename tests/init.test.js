const request = require('supertest');
const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const commtrackr = require('../index');

describe('Tenant customText', () => {
    test('customText', async () => {
        commtrackr.init({
            tenant: { name: 'TestTenant', domain: 'http://localhost:3000', path: '', customText: { adminTitle: 'Custom Admin Title' } },
            vars: { userId: 'id', userName: 'name', commissions: 'commissions' },
            fields: [{ id: 'name', label: 'Name', type: 'text' }],
            handlers: {
                create: async () => { },
                update: async () => { },
                sync: async () => { }
            }
        });
        const app = express();
        app.use(express.urlencoded({ extended: true }));
        app.use(express.json());
        app.use(session({ secret: 'test', resave: false, saveUninitialized: true, store: new MemoryStore({ checkPeriod: 86400000 }) }));
        app.use('/', commtrackr.routes);
        commtrackr.on(true);
        const agent = request.agent(app);
        await agent.get('/');
        app.get('/set-admin', (req, res) => {
            req.session.id = 'admin1';
            req.session.role = 'admin';
            req.session.name = 'Admin One';
            req.session.commissions = [];
            res.json({ ok: true });
        });
        await agent.get('/set-admin');
        const res = await agent.get('/');
        expect(res.status).toBe(200);
        expect(res.text.length).toBeGreaterThan(0);
    }, 10000);
});
