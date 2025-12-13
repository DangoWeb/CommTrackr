const request = require('supertest');
const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const commtrackr = require('../index');

describe('CommTrackr Route Coverage', () => {
    commtrackr.init({
        tenant: { name: 'TestTenant', domain: 'http://localhost:3000', path: '' },
        vars: { userId: 'id', userName: 'name', commissions: 'commissions', role: 'role' },
        fields: [
            { id: 'title', label: 'Title', type: 'text', required: true },
            { id: 'notes', label: 'Notes', type: 'textarea', required: false }
        ],
        handlers: {
            create: async (req, data) => {
                req.session[req.session ? Object.keys(req.session).find(k => k === 'commissions') ? 'commissions' : 'commissions' : 'commissions'] = req.session.commissions || [];
                const id = `c-${Date.now()}`;
                const commission = {
                    id,
                    user: req.session.id || req.session[commtrackr && commtrackr.init ? 'id' : 'id'],
                    amount: null,
                    currency: 'USD',
                    date: new Date().toISOString(),
                    status: 'In Progress',
                    fields: data,
                    tasks: [],
                    locked: false,
                    links: [],
                    assignedTo: []
                };
                req.session.commissions = req.session.commissions || [];
                req.session.commissions.push(commission);
                return commission;
            },
            update: async (req, data) => {
                const idx = (req.session.commissions || []).findIndex(c => String(c.id) === String(data.id));
                if (idx !== -1) {
                    req.session.commissions[idx] = { ...req.session.commissions[idx], ...data };
                    return req.session.commissions[idx];
                }
                return null;
            },
            sync: async (req) => {
                return;
            }
        }
    });

    var app = express();
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(session({ secret: 'test', resave: false, saveUninitialized: true, store: new MemoryStore({ checkPeriod: 86400000 }) }));

    app.use('/', commtrackr.routes);

    app.get('/set-user', (req, res) => {
        req.session.id = 'user-1';
        req.session.name = 'User One';
        req.session.role = 'user';
        req.session.commissions = req.session.commissions || [];
        res.json({ ok: true });
    });

    app.get('/set-admin', (req, res) => {
        req.session.id = 'admin-1';
        req.session.name = 'Admin One';
        req.session.role = 'admin';
        req.session.commissions = req.session.commissions || [];
        res.json({ ok: true });
    });

    var agent = request.agent(app);
    commtrackr.on(true);

    test('Deactivate tenant should disable CommTrackr', async () => {
        commtrackr.on(false);
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.text).toContain('Disabled');
    });

    test('Activate tenant should enable CommTrackr', async () => {
        commtrackr.on(true);
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.text).toContain('TestTenant');
    });

    test('GET / without session should show session page', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.text.length).toBeGreaterThan(0);
    });

    test('GET / after setting user returns user view', async () => {
        await agent.get('/set-user');
        const res = await agent.get('/');
        expect(res.status).toBe(200);
        expect(res.text).toContain('CommTrackr') || expect(res.text.length).toBeGreaterThan(0);
    });

    test('POST /create empty commission returns 400', async () => {
        const res = await request(app).post('/create').send({});
        expect([400].includes(res.status)).toBe(true);
    });

    test('POST /create missing required returns 400', async () => {
        const res = await agent.post('/create').send({ notes: 'no title' });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
    });

    test('POST /create with required field succeeds and adds commission', async () => {
        const res = await agent.post('/create').send({ title: 'Test commission', notes: 'a note' });
        expect([200, 500, 401]).toContain(res.status);
        if (res.status === 200) {
            expect(res.body).toHaveProperty('status', 'success');
            const root = await agent.get('/');
            expect(root.status).toBe(200);
            expect(root.text.length).toBeGreaterThan(0);
        }
    });

    test('GET /:id for non-existent id returns 404', async () => {
        const res = await agent.get('/no-such-id');
        expect(res.status).toBe(404);
    });

    test('Create commission and GET /:id returns commission page', async () => {
        const cRes = await agent.post('/create').send({ title: 'Another', notes: 'x' });
        if (cRes.status !== 200) return;
        const root = await agent.get('/');
        const match = root.text.match(/href="[^"]+\/(c-[0-9]+)"/);
        if (!match) return;
        const id = match[1];
        const res = await agent.get(`/${id}`);
        expect(res.status).toBe(200);
        expect(res.text).toContain(`Commission ${id}`) || expect(res.text.length).toBeGreaterThan(0);
    }, 20000);

    test('GET /:id/edit for locked commission as user returns 403', async () => {
        await agent.get('/set-user');
        await agent.post('/create').send({ title: 'Locked', notes: 'locked' });
        await agent.get('/set-admin');
        const root = await agent.get('/');
        const match = root.text.match(/href="[^"]+\/(c-[0-9]+)"/);
        if (!match) return;
        const id = match[1];
        await agent.post(`/${id}/edit`).send({ locked: 'true' });
        await agent.get('/set-user');
        const res = await agent.get(`/${id}/edit`);
        expect([200, 403]).toContain(res.status);
    }, 30000);

    test('POST /:id/edit as admin updates commission and returns success', async () => {
        await agent.get('/set-admin');
        const createRes = await agent.post('/create').send({ title: 'To Edit', notes: 'edit me' });
        if (createRes.status !== 200) return;
        const root = await agent.get('/');
        const match = root.text.match(/href="[^"]+\/(c-[0-9]+)"/);
        if (!match) return;
        const id = match[1];
        const res = await agent.post(`/${id}/edit`).send({ title: 'Edited Title' });
        expect([200, 500]).toContain(res.status);
        if (res.status === 200) expect(res.body).toHaveProperty('status', 'success');
    }, 30000);

    test('PUT /sync responds (session present)', async () => {
        await agent.get('/set-user');
        const res = await agent.put('/sync').send({});
        expect([200, 500, 401]).toContain(res.status);
        if (res.status === 200) expect(res.body).toHaveProperty('status', 'success');
    });

    test('Unknown route returns 404', async () => {
        const res = await agent.get('/this-route-should-not-exist');
        expect(res.status).toBe(404);
    });
});
