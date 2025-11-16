const commtrackr = require('./index.js');

async function commTrackrHandler(data) {
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
            handler: commTrackrHandler,
        })).not.toThrow();
    });
    test('handler', async () => {
        expect(typeof commTrackrHandler).toBe('function');
        const result = await commTrackrHandler({ test: 'data' });
        expect(typeof result).toBe('object');
        expect(result).toHaveProperty('test', 'data');
    });
});