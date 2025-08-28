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
  },
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

// function setUser(newUser = {}) {
//   if (!newUser.id) return user = {};
//   user = newUser;
// };

app.get('/', async (req, res) => {
  console.log('Session:', req.session);
  if (!on) return res.render('off', { tenant, title: 'Activation - ' });
  if (!req.session) return res.render('session', { tenant, title: 'Session - ' });
  if (!tenant.slug || !tenant.name || !tenant.domain) return res.render('tenant', { tenant, title: 'Configuration - ' });
  if (tenant.auth && tenant.auth.enabled && vars.userId && !req.session[vars.userId]) return res.render('auth', { tenant, title: 'Authenticate - ' });
  console.log('User ID:', req.session[vars.userId]);
  console.log('Role:', getUserRole(req.session));
  res.send(`Hello ${req.session[vars.name] || req.session[vars.userId]}`);
});

module.exports = {
  routes: app,
  init,
  activate,
  on: activate,
  // setUser
};