const commtrackr = require('./index.js');

async function createHandler(data) {
    return data;
};

async function updateHandler(req, data) {
    return data;
};

async function syncHandler(req, data) {
    return data;
};

commtrackr.on();

describe('CommTrackr Backend Initialization', () => {
    test('on', () => {
        expect(typeof commtrackr.on).toBe('function');
        expect(() => commtrackr.on()).not.toThrow();
    });
    test('init', () => {
        expect(typeof commtrackr.init).toBe('function');
        expect(() => commtrackr.init({
            tenant: {
                slug: 'commtrackr',
                name: 'CommTrackr',
                description: 'Testing',
                logo: 'http://localhost:3000/logo.png',
                domain: 'http://localhost:3000',
                path: '/commissions',
                auth: {
                    enabled: true,
                    provider: 'Test Authentication Provider',
                    url: '/login'
                },
            },
            vars: {
                userId: 'id',
                name: 'name',
                access: {
                    var: 'access',
                    user: [0],
                    dev: [1],
                    admin: [2]
                },
            },
            fields: ['text', 'number', 'date', 'textarea', 'checkbox', 'radio', 'select'].flatMap(fieldType => [
                {
                    id: `test-${fieldType}`,
                    type: fieldType,
                    label: fieldType,
                    description: 'description',
                    placeholder: 'placeholder',
                    required: false
                },
                {
                    id: `test-${fieldType}-required`,
                    type: fieldType,
                    label: fieldType,
                    description: 'description',
                    placeholder: 'placeholder',
                    required: true
                }
            ]),
            handlers: {
                create: createHandler,
                update: updateHandler,
                sync: syncHandler
            }
        })).not.toThrow();
    });
    test('handlers', async () => {
        expect(typeof createHandler).toBe('function');
        var result = await createHandler({ test: 'data' });
        expect(typeof result).toBe('object');
        expect(result).toHaveProperty('test', 'data');
        expect(typeof updateHandler).toBe('function');
        result = await updateHandler({}, { test: 'data' });
        expect(typeof result).toBe('object');
        expect(result).toHaveProperty('test', 'data');
        expect(typeof syncHandler).toBe('function');
        result = await syncHandler({}, { test: 'data' });
        expect(typeof result).toBe('object');
        expect(result).toHaveProperty('test', 'data');
    });
});