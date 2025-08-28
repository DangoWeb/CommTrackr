# CommTrackr

Easily plan, manage, and track client commissions.

![Banner](/frontend/public/banner.png)

## Requirements

- Must be using `express` on Node.js
- Must be using `express-session` for session management
- Must be using a valid session store (e.g., `express-mysql-session` for MySQL)

## Usage

Include the `commtrackr` package in your Express.js application:

```javascript
const express = require('express');

const session = require("express-session");
const MySQLStore = require('express-mysql-session')(session); // Use a MySQL session store
const sessionStore = new MySQLStore({
  host: '',
  port: 3306,
  user: '',
  password: '',
  database: ''
});
app.use(session({
  name: '',
  key: '',
  secret: '',
  store: sessionStore,
  resave: false,
  saveUninitialized: false
}));

const app = express();

const commtrackr = require('commtrackr'); // Import the commtrackr package
app.use('/commtrackr', commtrackr.routes); // Mount routes to /commtrackr path
commtrackr.init({ // Initialize CommTracker with configurations
  tenant: {
    slug: 'commtrackr', // Unique identifier for the tenant
    name: 'CommTrackr', // Name of the tenant
    description: 'Easily plan, manage, and track client commissions.', // Description of the tenant
    logo: 'http://localhost:3000/commtrackr/logo.png', // Tenant logo image
    themeColor: '#ffffff', // Tenant theme color
    banner: 'http://localhost:3000/commtrackr/banner_public.png', // Tenant banner image
    domain: 'http://localhost:3000', // Domain for the tenant, including protocol
    path: '/commtrackr', // Path that CommTracker is mounted on
    auth: {
      enabled: false, // Enable or disable authentication
      provider: '', // Recognizable name of authentication provider
      url: '', // URL to redirect to for authentication
    },
  },
  vars: {
    userId: 'username', // req.session object variable for unique user identification
    userName: 'Name', // req.session object variable for user name
    role: 'role', // req.session object variable for user role
    roleAliases: { // Use if your role names differ from 'admin', 'dev', or 'user'
      user: ['user', 'standard', 'basic'], // Aliases for user roles
      dev: ['dev', 'developer'], // Aliases for developer roles
      admin: ['admin', 'administrator', 'superuser'] // Aliases for admin roles
    },
    access: { // Alternative access control using numeric levels
      var: 'access', // req.session object variable for access level
      user: [0], // Access levels for standard users
      dev: [1], // Access levels for developers
      admin: [2] // Access levels for admins
    },
    commissions: 'commissions', // req.session object variable for user commissions array
  },
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
```

## Session Variables Setup

These variables must be set in your `req.session` object to enable CommTrackr functionality:

### userId

`req.session.userId` must contain a unique identifier for the user, such as a username or user ID. This is used to track user-specific data. This must be present for CommTrackr to detect a logged-in user.

Type: `String`

Default: `'username'`

Fallback: None

Session Example: `'id'`

### userName

`req.session.userName` should contain the name of the user. This is used for display purposes in the CommTrackr interface. Fallback to `userId` if not set.

Type: `String`

Default: `'name'`

Fallback: `req.session.userId`

Session Example: `'John Doe'`

### role

`req.session.role` should contain the role of the user: 'admin', `dev`, or 'user'. This is used to control access to certain features and functionalities within CommTrackr.

Type: `String`

Default: `'role'`

Fallback: `user`

Session Example: `'user'`, `'dev'`, `'admin'`

### roleAliases

`req.session.role` can also be set to custom role names. Use `roleAliases` to map your custom role names to the standard roles used by CommTrackr.

Type: `Object`

Default:

```javascript
{}
```

### access

`req.session.access` can be used as an alternative to `role` for access control. It should contain numeric access levels. Use the `access` configuration to define which levels correspond to 'user', 'dev', and 'admin'.

Type: `Array`

Default:

```javascript
{}
```

### commissions

`req.session.commissions` should be an array of commission objects associated with the user. Each commission object should have the following structure:

Type: `Array`

Default: `'commissions'`

Session Example:

```javascript
[
  {
    id: 'unique-commission-id', // Unique identifier for the commission
    client: 'Client Name', // Name of the client
    amount: 1000, // Commission amount
    date: '2023-10-01', // Date of the commission
    status: 'pending' // Status of the commission (e.g., 'pending', 'paid')
  }
]
```
