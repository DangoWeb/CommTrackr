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
let returnHandler = null;

function init({
  tenant: newTenant = {
    slug: 'commtrackr',
    name: 'CommTrackr',
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
    commissions: 'commissions'
  },
  fields: newFields = [],
  handler: newHandler = null
}) {
  tenant = {
    slug: 'commtrackr',
    name: 'CommTrackr',
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
    ...newVars
  };
  fields = newFields;
  returnHandler = newHandler;
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

app.get('/', async (req, res) => {
  if (!on) return res.render('off', { tenant, title: 'Activation - ' });
  if (!req.session) return res.render('session', { tenant, title: 'Session - ' });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.render('tenant', { tenant, title: 'Configuration - ' });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.render('auth', { tenant, title: 'Authenticate - ' });
  switch (getUserRole(req.session)) {
    case 'admin':
      res.render('admin', { tenant, title: 'Admin View - ', session: req.session, vars });
      break;
    case 'dev':
      res.render('dev', { tenant, title: 'Developer View - ', session: req.session, vars });
      break;
    default:
      res.render('user', { tenant, title: '', session: req.session, vars, fields });
      break;
  };
});

app.get('/create', async (req, res) => {
  if (!on) return res.render('off', { tenant, title: 'Activation - ' });
  if (!req.session) return res.render('session', { tenant, title: 'Session - ' });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.render('tenant', { tenant, title: 'Configuration - ' });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.render('auth', { tenant, title: 'Authenticate - ' });
  res.render('create', { tenant, title: 'New Commission - ', session: req.session, vars, fields });
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
  data.createdBy = (tenant.auth && tenant.auth.enabled) ? {
    id: req.session[vars.userId],
    name: req.session[vars.name] || req.session[vars.userId],
    role: getUserRole(req.session) || 'user'
  } : {};
  if (returnHandler && typeof returnHandler === 'function') {
    try {
      await returnHandler(data);
    } catch (error) {
      console.error('Error in handler function:', error);
      return res.status(500).json({ status: 'error', message: 'An error occurred while processing your request. Please try again later.' });
    };
  };
  res.status(200).json({ status: 'success', message: 'Your commission was created successfully.' });
});

module.exports = {
  routes: app,
  init,
  activate,
  on: activate
};