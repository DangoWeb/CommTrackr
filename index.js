const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const app = express();
require('dotenv').config();

app.engine('.ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'frontend/pages'));
app.use(express.static(path.join(__dirname, 'frontend/public'), { redirect: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  skip: (req, res) => {
    return req.ip !== undefined;
  },
  message: "Too many requests from this IP, please try again in a minute."
}));

let on = false;
let tenant = {};
let vars = {};
let fields = [];
let createHandler = null;
let updateHandler = null;
let syncHandler = null;

function init({
  tenant: newTenant = {
    slug: 'commtrackr',
    name: 'CommTrackr',
    metaTitle: 'CommTrackr',
    description: 'Easily plan, manage, and track client commissions.',
    logo: 'http://localhost:3000/logo.png',
    banner: 'http://localhost:3000/banner_public.png',
    themeColor: '#ffffff',
    domain: 'http://localhost:3000',
    path: '',
    auth: {
      enabled: false,
      provider: '',
      url: ''
    }
  },
  vars: newVars = {
    userId: 'username',
    userName: 'name',
    role: 'role',
    roleAliases: {},
    access: {},
    commissions: 'commissions',
    possibleStatuses: [],
    disableFieldEditing: []
  },
  fields: newFields = [],
  handlers: {
    create: newCreateHandler = null,
    update: newUpdateHandler = null,
    sync: newSyncHandler = null
  }
}) {
  tenant = {
    slug: 'commtrackr',
    name: 'CommTrackr',
    metaTitle: 'CommTrackr',
    description: 'Easily plan, manage, and track client commissions.',
    logo: 'http://localhost:3000/logo.png',
    banner: 'http://localhost:3000/banner_public.png',
    themeColor: '#ffffff',
    domain: 'http://localhost:3000',
    path: '',
    auth: {
      enabled: false,
      provider: '',
      url: '',
    },
    ...newTenant
  };
  vars = {
    userId: 'username',
    userName: 'name',
    role: 'role',
    roleAliases: {},
    access: {},
    commissions: 'commissions',
    possibleStatuses: [],
    disableFieldEditing: [],
    ...newVars
  };
  fields = newFields.filter(field => field.id !== 'user');
  createHandler = newCreateHandler;
  updateHandler = newUpdateHandler;
  syncHandler = newSyncHandler;
};

function activate(isOn = true) {
  on = isOn;
  if (!on) user = {};
};

function getUserRole(session) {
  if (!session) return null;
  if (vars.access && Object.keys(vars.access).length && vars.access.var) {
    const access = session[vars.access.var];
    if (access === undefined || access === null) return null;
    for (const [key, values] of Object.entries(vars.access)) {
      if (key === 'var') continue;
      if (values.includes(access)) return key;
    };
  } else {
    const role = session[vars.role];
    if (!role) return null;
    const aliases = vars.roleAliases || {};
    for (const [key, values] of Object.entries(aliases)) {
      if (values.includes(role.toLowerCase())) return key;
    };
  };
  return 'user';
};

function verifyAgainstSchema(type, data) {
  switch (type) {
    case 'commission':
      if (!Array.isArray(data)) return [];
      return data.map(commission => {
        if (!commission.id || !commission.user || (commission.date ? isNaN(new Date(commission.date).getTime()) : false) || (typeof commission.status !== 'string') || (typeof commission.tasks !== 'object')) return null;
        return {
          id: commission.id,
          user: commission.user,
          amount: commission.amount ? Number(commission.amount) : null,
          currency: commission.currency ? String(commission.currency) : 'USD',
          date: commission.date ? new Date(commission.date) : null,
          status: commission.status,
          fields: fields.reduce((acc, field) => {
            acc[field.id] = (commission.fields && (commission.fields[field.id] !== undefined)) ? commission.fields[field.id] : null;
            return acc;
          }, {}),
          tasks: Array.isArray(commission.tasks) ? commission.tasks.map(task => {
            return {
              done: task.done || false,
              content: task.content ? String(task.content) : ''
            }
          }) : [],
          locked: commission.locked || false,
          links: Array.isArray(commission.links) ? commission.links.map(link => {
            return {
              label: link.label ? String(link.label) : '',
              url: link.url ? String(link.url) : ''
            };
          }) : []
        };
      }).filter(commission => commission !== null);
  };
  return data;
};

app.get('/', async (req, res) => {
  if (!on) return res.render('off', { tenant, title: 'Activation' });
  if (!req.session) return res.render('session', { tenant, title: 'Session' });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.render('tenant', { tenant, title: 'Configuration' });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.render('auth', { tenant, title: 'Authenticate' });
  req.session[vars.commissions] = verifyAgainstSchema('commission', req.session[vars.commissions] || []);
  switch (getUserRole(req.session)) {
    case 'admin':
      return res.render('admin', { tenant, title: 'Admin View', session: req.session, vars });
    case 'dev':
      return res.render('dev', { tenant, title: 'Developer View', session: req.session, vars });
    default:
      req.session[vars.commissions] = req.session[vars.commissions].filter(commission => commission.user === req.session[vars.userId]);
      return res.render('user', { tenant, title: '', session: req.session, vars, fields });
  };
});

app.get('/create', async (req, res) => {
  if (!on) return res.render('off', { tenant, title: 'Activation' });
  if (!req.session) return res.render('session', { tenant, title: 'Session' });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.render('tenant', { tenant, title: 'Configuration' });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.render('auth', { tenant, title: 'Authenticate' });
  return res.render('create', {
    tenant, title: 'New Commission', session: req.session, vars, fields: (getUserRole(req.session) === 'admin') ? [{
      id: 'user',
      label: 'User ID',
      description: 'The identifier of the user for whom this commission is created for, if any.',
      type: 'text',
      required: false
    }, ...fields] : fields
  });
});

app.post('/create', async (req, res) => {
  if (!on) return res.status(503).json({ status: 'error', message: 'Service is currently offline.' });
  if (!req.session) return res.status(401).json({ status: 'error', message: 'No session found. Please enable cookies and try again.' });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.status(401).json({ status: 'error', message: 'User not authenticated. Please log in and try again.' });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.status(500).json({ status: 'error', message: 'Service is not properly configured. Please contact the administrator.' });
  if (!fields || !fields.length) return res.status(500).json({ status: 'error', message: 'No fields configured for commission creation. Please contact the administrator.' });
  const data = {};
  fields.forEach(field => {
    if (field.id) data[field.id] = req.body[field.id] || null;
  });
  data.createdAt = new Date();
  data.createdBy = (tenant.auth && tenant.auth.enabled) ? (((getUserRole(req.session) === 'admin') && req.body.user) ? {
    id: req.body.user,
    name: req.body.user,
    role: 'user'
  } : {
    id: req.session[vars.userId],
    name: req.session[vars.userName] || req.session[vars.userId],
    role: getUserRole(req.session) || 'user'
  }) : {};
  if (createHandler && typeof createHandler === 'function') {
    try {
      await createHandler(req, data);
    } catch (error) {
      console.error('Error in handler function:', error);
      return res.status(500).json({ status: 'error', message: 'An error occurred while processing your request. Please try again later.' });
    };
  };
  return res.status(200).json({ status: 'success', message: 'Your commission was created successfully.' });
});

app.put('/sync', async (req, res) => {
  if (!on) return res.status(503).json({ status: 'error', message: 'Service is currently offline.' });
  if (!req.session) return res.status(401).json({ status: 'error', message: 'No session found. Please enable cookies and try again.' });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.status(401).json({ status: 'error', message: 'User not authenticated. Please log in and try again.' });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.status(500).json({ status: 'error', message: 'Service is not properly configured. Please contact the administrator.' });
  if (syncHandler && typeof syncHandler === 'function') {
    try {
      await syncHandler(req);
    } catch (error) {
      console.error('Error in handler function:', error);
      return res.status(500).json({ status: 'error', message: 'An error occurred while processing your request. Please try again later.' });
    };
  };
  return res.status(200).json({ status: 'success', message: 'Your commissions were synchronized successfully.' });
});

app.get('/:id', async (req, res) => {
  if (!on) return res.render('off', { tenant, title: 'Activation' });
  if (!req.session) return res.render('session', { tenant, title: 'Session' });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.render('tenant', { tenant, title: 'Configuration' });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.render('auth', { tenant, title: 'Authenticate' });
  req.session[vars.commissions] = verifyAgainstSchema('commission', req.session[vars.commissions] || []);
  if (getUserRole(req.session) === 'user') req.session[vars.commissions] = req.session[vars.commissions].filter(commission => commission.user === req.session[vars.userId]);
  const commission = (req.session[vars.commissions] || []).find(commission => (String(commission.id) === String(req.params.id)) && (getUserRole(req.session) === 'admin' ? true : (commission.user === req.session[vars.userId])));
  if (!commission) return res.status(404).render('error', { tenant, title: 'Not Found', message: 'The requested commission was not found.' });
  return res.render('commission', { tenant, title: `Commission ${commission.id}`, session: req.session, vars, fields, role: getUserRole(req.session), commission });
});

app.get('/:id/edit', async (req, res) => {
  if (!on) return res.render('off', { tenant, title: 'Activation' });
  if (!req.session) return res.render('session', { tenant, title: 'Session' });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.render('tenant', { tenant, title: 'Configuration' });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.render('auth', { tenant, title: 'Authenticate' });
  req.session[vars.commissions] = verifyAgainstSchema('commission', req.session[vars.commissions] || []);
  if (getUserRole(req.session) === 'user') req.session[vars.commissions] = req.session[vars.commissions].filter(commission => commission.user === req.session[vars.userId]);
  const commission = (req.session[vars.commissions] || []).find(commission => (String(commission.id) === String(req.params.id)) && (getUserRole(req.session) === 'admin' ? true : (commission.user === req.session[vars.userId])));
  if (!commission) return res.status(404).render('error', { tenant, title: 'Not Found', message: 'The requested commission was not found.' });
  if (commission.locked && (getUserRole(req.session) === 'user')) return res.status(403).render('error', { tenant, title: 'Forbidden', message: 'You do not have permission to edit this commission.' });
  return res.render('edit', { tenant, title: `Edit Commission ${commission.id}`, session: req.session, vars, fields, commission, role: getUserRole(req.session) });
});

app.post('/:id/edit', async (req, res) => {
  if (!on) return res.status(503).json({ status: 'error', message: 'Service is currently offline.' });
  if (!req.session) return res.status(401).json({ status: 'error', message: 'No session found. Please enable cookies and try again.' });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.status(401).json({ status: 'error', message: 'User not authenticated. Please log in and try again.' });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.status(500).json({ status: 'error', message: 'Service is not properly configured. Please contact the administrator.' });
  req.session[vars.commissions] = verifyAgainstSchema('commission', req.session[vars.commissions] || []);
  if (getUserRole(req.session) === 'user') req.session[vars.commissions] = req.session[vars.commissions].filter(commission => commission.user === req.session[vars.userId]);
  const commissionIndex = (req.session[vars.commissions] || []).findIndex(commission => (String(commission.id) === String(req.params.id)) && (getUserRole(req.session) === 'admin' ? true : (commission.user === req.session[vars.userId])));
  if (commissionIndex === -1) return res.status(404).json({ status: 'error', message: 'The requested commission was not found.' });
  const commission = req.session[vars.commissions][commissionIndex];
  if (commission.locked && (getUserRole(req.session) === 'user')) return res.status(403).json({ status: 'error', message: 'You do not have permission to edit this commission.' });
  const data = {};
  fields.forEach(field => {
    if (field.id) data[field.id] = req.body[field.id] || null;
  });
  const update = {};
  update.updatedAt = new Date();
  update.updatedBy = (tenant.auth && tenant.auth.enabled) ? {
    id: req.session[vars.userId],
    name: req.session[vars.userName] || req.session[vars.userId],
    role: getUserRole(req.session) || 'user'
  } : {};
  update.user = (getUserRole(req.session) === 'admin') ? (req.body.owner || commission.user) : commission.user;
  update.amount = req.body.amount ? Number(req.body.amount) : commission.amount;
  update.currency = req.body.currency ? String(req.body.currency) : commission.currency;
  update.date = req.body.date ? new Date(req.body.date) : commission.date;
  update.status = req.body.status ? String(req.body.status) : commission.status;
  update.locked = (getUserRole(req.session) === 'admin') ? ((req.body.locked === true) || (req.body.locked === 'true') || (req.body.locked === 'on')) : commission.locked;
  update.sendEmail = (req.body.sendEmail === true) || (req.body.sendEmail === 'true') || (req.body.sendEmail === 'on');
  vars.disableFieldEditing.forEach(fieldId => {
    if (fieldId in data) delete data[fieldId];
  });
  if (updateHandler && typeof updateHandler === 'function') {
    try {
      await updateHandler(req, { ...commission, ...update, fields: data });
      await syncHandler(req);
    } catch (error) {
      console.error('Error in handler function:', error);
      return res.status(500).json({ status: 'error', message: 'An error occurred while processing your request. Please try again later.' });
    };
  };
  return res.status(200).json({ status: 'success', message: 'Your commission was updated successfully.' });
});

app.use((req, res) => {
  return res.status(404).render('error', { tenant, title: 'Not Found', message: 'The requested resource was not found.' });
});

module.exports = {
  routes: app,
  init,
  activate,
  on: activate
};