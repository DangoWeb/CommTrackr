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
  authDescriptionBefore: 'You\'ll need to log into your ',
  authDescriptionAfter: ' account before managing your commissions.',
  authContinueLabel: 'Continue',
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
  errorMessage: 'An unexpected error occurred. Please try again later.',
  labelStatus: 'Status',
  labelStatusDescription: 'Required: Commission status.',
  labelOwner: 'Owner',
  labelOwnerDescription: 'Required: Commission owner.',
  labelAmount: 'Amount',
  labelAmountDescription: 'Optional: Commission amount.',
  labelDate: 'Date',
  labelDateDescription: 'Optional: Commission creation date.',
  labelAssignedTo: 'Assigned To',
  labelAssignedToDescription: 'Optional: The developer to assign this commission to.',
  labelCurrency: 'Currency',
  labelCurrencyDescription: 'Optional: Commission currency.',
  labelLocked: 'Locked',
  labelLockedDescription: 'Optional: Whether or not the commission is locked from user editing.',
  labelTasks: 'Tasks',
  labelSendEmail: 'Send Email',
  labelSendEmailDescription: 'Optional: Send an email to the user regarding this update.',
  labelRequired: 'Required',
  labelOptional: 'Optional',
  youLabel: '(you)',
  noneLabel: 'None',
  backLabel: 'Back',
  backLabelWithArrow: '← Back',
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
  offTitle: 'CommTrackr Disabled',
  offDescription: 'Enable CommTrackr for your app using <code>commtrackr.on();</code>',
  tenantMisconfiguredTitle: 'Tenant Misconfigured',
  tenantMisconfiguredDescription: 'Configure your CommTrackr tenant using <code>commtrackr.init({ tenant: { ... } });</code>',
  serviceOffline: 'Service is currently offline.',
  noSession: 'No session found. Please enable cookies and try again.',
  userNotAuthenticated: 'User not authenticated. Please log in and try again.',
  serviceNotConfigured: 'Service is not properly configured. Please contact the administrator.',
  noFieldsConfigured: 'No fields configured for commission creation. Please contact the administrator.',
  createSuccess: 'Your commission was created successfully.',
  syncSuccess: 'Your commissions were synchronized successfully.',
  updateSuccess: 'Your commission was updated successfully.',
  commissionNotFoundJson: 'The requested commission was not found.',
  forbiddenMessage: 'You do not have permission to edit this commission.'
};


function getCustomText(key, def) {
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
  if (!on) return res.render('off', { tenant, title: getCustomText('activationTitle') });
  if (!req.session) return res.render('session', { tenant, title: getCustomText('sessionTitle') });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.render('tenant', { tenant, title: getCustomText('tenantTitle') });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.render('auth', { tenant, title: getCustomText('authTitle') });
  req.session[vars.commissions] = verifyAgainstSchema('commission', req.session[vars.commissions] || []);
  switch (getUserRole(req.session)) {
    case 'admin':
      return res.render('admin', { tenant, title: getCustomText('adminTitle'), session: req.session, vars });
    case 'dev':
      return res.render('dev', { tenant, title: getCustomText('devTitle'), session: req.session, vars });
    default:
      req.session[vars.commissions] = req.session[vars.commissions].filter(commission => commission.user === req.session[vars.userId]);
      return res.render('user', { tenant, title: '', session: req.session, vars, fields });
  };
});

app.get('/create', async (req, res) => {
  if (!on) return res.render('off', { tenant, title: getCustomText('activationTitle') });
  if (!req.session) return res.render('session', { tenant, title: getCustomText('sessionTitle') });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.render('tenant', { tenant, title: getCustomText('tenantTitle') });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.render('auth', { tenant, title: getCustomText('authTitle') });
  return res.render('create', {
    tenant, title: getCustomText('newCommissionTitle'), session: req.session, vars, fields: (getUserRole(req.session) === 'admin') ? [{
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
  if (!on) return res.status(503).json({ status: 'error', message: getCustomText('serviceOffline') });
  if (!req.session) return res.status(401).json({ status: 'error', message: getCustomText('noSession') });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.status(401).json({ status: 'error', message: getCustomText('userNotAuthenticated') });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.status(500).json({ status: 'error', message: getCustomText('serviceNotConfigured') });
  if (!fields || !fields.length) return res.status(500).json({ status: 'error', message: getCustomText('noFieldsConfigured') });
  const data = {};
  const validateFields = fields.filter(field => field.id);
  for (const field of validateFields) {
    if (field.required && ((req.body[field.id] === undefined) || (req.body[field.id] === null) || (req.body[field.id] === ''))) return res.status(400).json({ status: 'error', message: `Field ${field.label} is required.` });
    data[field.id] = (typeof req.body[field.id] !== 'undefined') ? req.body[field.id] : null;
  };
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
  return res.status(200).json({ status: 'success', message: getCustomText('createSuccess') });
});

app.put('/sync', async (req, res) => {
  if (!on) return res.status(503).json({ status: 'error', message: getCustomText('serviceOffline') });
  if (!req.session) return res.status(401).json({ status: 'error', message: getCustomText('noSession') });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.status(401).json({ status: 'error', message: getCustomText('userNotAuthenticated') });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.status(500).json({ status: 'error', message: getCustomText('serviceNotConfigured') });
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
  if (!commission) return res.status(404).render('error', { tenant, title: getCustomText('notFoundTitle'), message: getCustomText('commissionNotFound') });
  return res.render('commission', { tenant, title: `Commission ${commission.id}`, session: req.session, vars, fields, role: getUserRole(req.session), commission });
});

app.get('/:id/edit', async (req, res) => {
  if (!on) return res.render('off', { tenant, title: getCustomText('activationTitle') });
  if (!req.session) return res.render('session', { tenant, title: getCustomText('sessionTitle') });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.render('tenant', { tenant, title: getCustomText('tenantTitle') });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.render('auth', { tenant, title: getCustomText('authTitle') });
  req.session[vars.commissions] = verifyAgainstSchema('commission', req.session[vars.commissions] || []);
  if (getUserRole(req.session) === 'user') req.session[vars.commissions] = req.session[vars.commissions].filter(commission => commission.user === req.session[vars.userId]);
  if (getUserRole(req.session) === 'dev') req.session[vars.commissions] = req.session[vars.commissions].filter(commission => (commission.assignedTo || []).includes(req.session[vars.userId]));
  const commission = (req.session[vars.commissions] || []).find(commission => String(commission.id) === String(req.params.id));
  if (!commission) return res.status(404).render('error', { tenant, title: getCustomText('notFoundTitle'), message: getCustomText('commissionNotFound') });
  if (commission.locked && (getUserRole(req.session) === 'user')) return res.status(403).render('error', { tenant, title: getCustomText('forbiddenTitle'), message: getCustomText('forbiddenMessage') });
  return res.render('edit', { tenant, title: `Edit Commission ${commission.id}`, session: req.session, vars, fields, commission, role: getUserRole(req.session), getUserRole });
});

app.post('/:id/edit', async (req, res) => {
  if (!on) return res.status(503).json({ status: 'error', message: getCustomText('serviceOffline') });
  if (!req.session) return res.status(401).json({ status: 'error', message: getCustomText('noSession') });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.status(401).json({ status: 'error', message: getCustomText('userNotAuthenticated') });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.status(500).json({ status: 'error', message: getCustomText('serviceNotConfigured') });
  req.session[vars.commissions] = verifyAgainstSchema('commission', req.session[vars.commissions] || []);
  if (getUserRole(req.session) === 'user') req.session[vars.commissions] = req.session[vars.commissions].filter(commission => commission.user === req.session[vars.userId]);
  if (getUserRole(req.session) === 'dev') req.session[vars.commissions] = req.session[vars.commissions].filter(commission => (commission.assignedTo || []).includes(req.session[vars.userId]));
  const commissionIndex = (req.session[vars.commissions] || []).findIndex(commission => String(commission.id) === String(req.params.id));
  if (commissionIndex === -1) return res.status(404).json({ status: 'error', message: getCustomText('commissionNotFoundJson') });
  const commission = req.session[vars.commissions][commissionIndex];
  if (commission.locked && (getUserRole(req.session) === 'user')) return res.status(403).json({ status: 'error', message: getCustomText('forbiddenMessage') });
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
  return res.status(200).json({ status: 'success', message: getCustomText('updateSuccess') });
});

app.use((req, res) => {
  return res.status(404).render('error', { tenant, title: getCustomText('notFoundTitle'), message: getCustomText('resourceNotFound') });
});

module.exports = {
  routes: app,
  init,
  activate,
  on: activate
};