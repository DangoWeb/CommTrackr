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
let returnHandler = null;
let user = {};

function init({
  tenant: newTenant = {
    slug: 'commtrackr',
    name: 'CommTrackr',
    description: 'This is a default tenant configuration.',
    auth: {
      enabled: false,
      provider: '',
      url: '',
    },
  },
  handler: newHandler = null
}) {
  tenant = {
    slug: 'commtrackr',
    name: 'CommTrackr',
    description: 'This is a default tenant configuration.',
    auth: {
      enabled: false,
      provider: '',
      url: '',
    },
    ...newTenant
  };
  returnHandler = newHandler;
};

function activate(isOn = true) {
  on = isOn;
  if (!on) user = {};
};

function setUser(newUser = {}) {
  if (!newUser.id) return user = {};
  user = newUser;
};

app.get('/', async (req, res) => {
  if (!on) return res.send('Service is not active');
  if (!tenant.slug) return res.send('No tenant configured');
  if (tenant.auth && tenant.auth.enabled && !user.id) return res.send('Authentication required');
  res.send(tenant.slug);
});

module.exports = {
  routes: app,
  init,
  activate,
  setUser
};