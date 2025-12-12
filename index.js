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

const customText = {
  userWelcomeBefore: 'Welcome, ',
  userWelcomeAfter: '!',
  activationTitle: 'Activation',
  sessionTitle: 'Session',
  tenantTitle: 'Configuration',
  authTitle: 'Authentication Required',
  adminTitle: 'Commission Management',
  adminDescription: 'Manage commissions created on your platform.',
  devTitle: 'Commission Management',
  devDescription: 'Manage commissions assigned to you.',
  userTitle: 'Commissions',
  userDescription: 'View and manage your past commissions.',
  newCommissionTitle: 'New Commission',
  newTaskLabel: 'New Task',
  notFoundTitle: 'Not Found',
  forbiddenTitle: 'Forbidden',
  errorTitle: 'Error',
  labelStatus: 'Status',
  labelOwner: 'Owner',
  labelAmount: 'Amount',
  labelDate: 'Date',
  labelAssignedTo: 'Assigned To',
  labelCurrency: 'Currency',
  labelLocked: 'Locked',
  labelTasks: 'Tasks',
  labelSendEmail: 'Send Email',
  labelRequired: 'Required',
  labelOptional: 'Optional',
  youLabel: '(you)',
  noneLabel: 'None',
  backLabel: 'Back',
  nextLabel: 'Next',
  startLabel: 'Start',
  createLabel: 'Create',
  returnLabel: 'Return',
  restartLabel: 'Restart',
  saveLabel: 'Save',
  syncLabel: 'Sync',
  backToLabel: 'Back to ',
  changesSaved: 'Changes saved',
  changesRestored: 'Changes restored',
  clearChanges: 'Clear changes',
  brandName: 'CommTrackr',
  createEstimatedTime: 'Estimated time to complete: 2 minutes',
  commissionNotFound: 'The requested commission was not found.',
  commissionLocked: 'This commission is locked from user editing.',
  forbiddenMessage: 'You do not have permission to edit this commission.',
  resourceNotFound: 'The requested resource was not found.',
  serviceOffline: 'Service is currently offline.',
  noSession: 'No session found. Please enable cookies and try again.',
  userNotAuthenticated: 'User not authenticated. Please log in and try again.',
  serviceNotConfigured: 'Service is not properly configured. Please contact the administrator.',
  noFieldsConfigured: 'No fields configured for commission creation. Please contact the administrator.',
  createSuccess: 'Your commission was created successfully.',
  syncSuccess: 'Your commissions were synchronized successfully.',
  updateSuccess: 'Your commission was updated successfully.',
  commissionNotFoundJson: 'The requested commission was not found.',
  forbiddenJson: 'You do not have permission to edit this commission.'
};


function txt(key, def) {
  if (tenant && tenant.customText && Object.prototype.hasOwnProperty.call(tenant.customText, key)) return tenant.customText[key];
  return (customText[key] !== undefined) ? customText[key] : def;
};

function init({
  tenant: newTenant = {
    slug: 'commtrackr',
    name: 'CommTrackr',
    metaTitle: 'CommTrackr',
    description: 'Easily plan, manage, and track client commissions.',
    logo: 'http://localhost:3000/logo.png',
    banner: 'http://localhost:3000/banner_public.png',
    themeColor: '#ffffff',
    forceDarkMode: false,
    domain: 'http://localhost:3000',
    path: '',
    auth: {
      enabled: false,
      provider: '',
      url: ''
    },
    stylesheets: [],
    scripts: []
  },
  vars: newVars = {
    userId: 'username',
    userName: 'name',
    role: 'role',
    roleAliases: {},
    access: {},
    commissions: 'commissions',
    possibleStatuses: [],
    disableFieldEditing: [],
    users: 'users'
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
    forceDarkMode: false,
    domain: 'http://localhost:3000',
    path: '',
    auth: {
      enabled: false,
      provider: '',
      url: '',
    },
    stylesheets: [],
    scripts: [],
    ...newTenant
  };
  tenant.customText = Object.assign({}, customText, (tenant.customText || {}));
  vars = {
    userId: 'username',
    userName: 'name',
    role: 'role',
    roleAliases: {},
    access: {},
    commissions: 'commissions',
    possibleStatuses: [],
    disableFieldEditing: [],
    users: 'users',
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
          }) : [],
          assignedTo: Array.isArray(commission.assignedTo) ? commission.assignedTo.map(assigned => String(assigned)) : []
        };
      }).filter(commission => commission !== null);
  };
  return data;
};

app.get('/', async (req, res) => {
  if (!on) return res.render('off', { tenant, title: txt('activationTitle') });
  if (!req.session) return res.render('session', { tenant, title: txt('sessionTitle') });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.render('tenant', { tenant, title: txt('tenantTitle') });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.render('auth', { tenant, title: txt('authTitle') });
  req.session[vars.commissions] = verifyAgainstSchema('commission', req.session[vars.commissions] || []);
  switch (getUserRole(req.session)) {
    case 'admin':
      return res.render('admin', { tenant, title: txt('adminTitle'), session: req.session, vars });
    case 'dev':
      return res.render('dev', { tenant, title: txt('devTitle'), session: req.session, vars });
    default:
      req.session[vars.commissions] = req.session[vars.commissions].filter(commission => commission.user === req.session[vars.userId]);
      return res.render('user', { tenant, title: '', session: req.session, vars, fields });
  };
});

app.get('/create', async (req, res) => {
  if (!on) return res.render('off', { tenant, title: txt('activationTitle') });
  if (!req.session) return res.render('session', { tenant, title: txt('sessionTitle') });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.render('tenant', { tenant, title: txt('tenantTitle') });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.render('auth', { tenant, title: txt('authTitle') });
  return res.render('create', {
    tenant, title: txt('newCommissionTitle'), session: req.session, vars, fields: (getUserRole(req.session) === 'admin') ? [{
      id: 'user',
      label: 'User ID',
      description: 'The identifier of the user for whom this commission is created for, if any.',
      type: (vars.users || []).filter(user => getUserRole(user) === 'user').length ? 'select' : 'text',
      options: (vars.users || []).filter(user => getUserRole(user) === 'user').length ? vars.users.filter(user => getUserRole(user) === 'user').map(user => {
        return {
          label: user[vars.userName] ? `${user[vars.userName]} (${user[vars.userId]})` : user[vars.userId],
          value: user[vars.userId]
        };
      }) : [],
      required: false
    }, ...fields] : fields
  });
});

app.post('/create', async (req, res) => {
  if (!on) return res.status(503).json({ status: 'error', message: txt('serviceOffline') });
  if (!req.session) return res.status(401).json({ status: 'error', message: txt('noSession') });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.status(401).json({ status: 'error', message: txt('userNotAuthenticated') });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.status(500).json({ status: 'error', message: txt('serviceNotConfigured') });
  if (!fields || !fields.length) return res.status(500).json({ status: 'error', message: txt('noFieldsConfigured') });
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
  return res.status(200).json({ status: 'success', message: txt('createSuccess') });
});

app.put('/sync', async (req, res) => {
  if (!on) return res.status(503).json({ status: 'error', message: txt('serviceOffline') });
  if (!req.session) return res.status(401).json({ status: 'error', message: txt('noSession') });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.status(401).json({ status: 'error', message: txt('userNotAuthenticated') });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.status(500).json({ status: 'error', message: txt('serviceNotConfigured') });
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
  if (getUserRole(req.session) === 'dev') req.session[vars.commissions] = req.session[vars.commissions].filter(commission => (commission.assignedTo || []).includes(req.session[vars.userId]));
  const commission = (req.session[vars.commissions] || []).find(commission => String(commission.id) === String(req.params.id));
  if (!commission) return res.status(404).render('error', { tenant, title: txt('notFoundTitle'), message: txt('commissionNotFound') });
  return res.render('commission', { tenant, title: `Commission ${commission.id}`, session: req.session, vars, fields, role: getUserRole(req.session), commission });
});

app.get('/:id/edit', async (req, res) => {
  if (!on) return res.render('off', { tenant, title: txt('activationTitle') });
  if (!req.session) return res.render('session', { tenant, title: txt('sessionTitle') });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.render('tenant', { tenant, title: txt('tenantTitle') });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.render('auth', { tenant, title: txt('authTitle') });
  req.session[vars.commissions] = verifyAgainstSchema('commission', req.session[vars.commissions] || []);
  if (getUserRole(req.session) === 'user') req.session[vars.commissions] = req.session[vars.commissions].filter(commission => commission.user === req.session[vars.userId]);
  if (getUserRole(req.session) === 'dev') req.session[vars.commissions] = req.session[vars.commissions].filter(commission => (commission.assignedTo || []).includes(req.session[vars.userId]));
  const commission = (req.session[vars.commissions] || []).find(commission => String(commission.id) === String(req.params.id));
  if (!commission) return res.status(404).render('error', { tenant, title: txt('notFoundTitle'), message: txt('commissionNotFound') });
  if (commission.locked && (getUserRole(req.session) === 'user')) return res.status(403).render('error', { tenant, title: txt('forbiddenTitle'), message: txt('forbiddenMessage') });
  return res.render('edit', { tenant, title: `Edit Commission ${commission.id}`, session: req.session, vars, fields, commission, role: getUserRole(req.session), getUserRole });
});

app.post('/:id/edit', async (req, res) => {
  if (!on) return res.status(503).json({ status: 'error', message: txt('serviceOffline') });
  if (!req.session) return res.status(401).json({ status: 'error', message: txt('noSession') });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.status(401).json({ status: 'error', message: txt('userNotAuthenticated') });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.status(500).json({ status: 'error', message: txt('serviceNotConfigured') });
  req.session[vars.commissions] = verifyAgainstSchema('commission', req.session[vars.commissions] || []);
  if (getUserRole(req.session) === 'user') req.session[vars.commissions] = req.session[vars.commissions].filter(commission => commission.user === req.session[vars.userId]);
  if (getUserRole(req.session) === 'dev') req.session[vars.commissions] = req.session[vars.commissions].filter(commission => (commission.assignedTo || []).includes(req.session[vars.userId]));
  const commissionIndex = (req.session[vars.commissions] || []).findIndex(commission => String(commission.id) === String(req.params.id));
  if (commissionIndex === -1) return res.status(404).json({ status: 'error', message: txt('commissionNotFoundJson') });
  const commission = req.session[vars.commissions][commissionIndex];
  if (commission.locked && (getUserRole(req.session) === 'user')) return res.status(403).json({ status: 'error', message: txt('forbiddenJson') });
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
  update.assignedTo = (getUserRole(req.session) === 'admin') ? (Array.isArray(req.body.assignedTo) ? req.body.assignedTo.filter(id => String(id).trim() !== '') : (req.body.assignedTo ? [String(req.body.assignedTo).trim()] : [])) : commission.assignedTo;
  update.sendEmail = (getUserRole(req.session) !== 'user') ? ((req.body.sendEmail === true) || (req.body.sendEmail === 'true') || (req.body.sendEmail === 'on')) : true;
  vars.disableFieldEditing.forEach(fieldId => {
    if (fieldId in data) delete data[fieldId];
  });
  if (updateHandler && typeof updateHandler === 'function') {
    try {
      await updateHandler(req, {
        ...commission, ...update, fields: data, tasks: Array.isArray(req.body.tasks) ? req.body.tasks.map(task => {
          return {
            done: task.done || false,
            content: task.content ? String(task.content) : ''
          }
        }) : commission.tasks
      });
      await syncHandler(req);
    } catch (error) {
      console.error('Error in handler function:', error);
      return res.status(500).json({ status: 'error', message: 'An error occurred while processing your request. Please try again later.' });
    };
  };
  return res.status(200).json({ status: 'success', message: txt('updateSuccess') });
});

app.use((req, res) => {
  return res.status(404).render('error', { tenant, title: txt('notFoundTitle'), message: txt('resourceNotFound') });
});

module.exports = {
  routes: app,
  init,
  activate,
  on: activate
};