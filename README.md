# CommTrackr

Easily plan, manage, and track client commissions.

[![Banner](/frontend/public/banner.png)](https://commtrackr.dangoweb.com/)

[![NPM](https://github.com/DangoWeb/CommTrackr/actions/workflows/npm.yml/badge.svg)](https://commtrackr.dangoweb.com/)

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
    metaTitle: 'CommTrackr', // Name of the tenant for meta title tags
    description: 'Easily plan, manage, and track client commissions.', // Description of the tenant
    logo: 'http://localhost:3000/commtrackr/logo.png', // Tenant logo image
    themeColor: '#ffffff', // Tenant theme color (optional)
    forceDarkMode: false, // Force dark mode for the tenant (optional)
    banner: 'http://localhost:3000/commtrackr/banner_public.png', // Tenant banner image
    domain: 'http://localhost:3000', // Domain for the tenant, including protocol
    path: '/commtrackr', // Path that CommTracker is mounted on
    auth: {
      enabled: false, // Enable or disable authentication
      provider: '', // Recognizable name of authentication provider
      url: '', // URL to redirect to for authentication
    },
    stylesheets: [], // Additional stylesheets to include
    scripts: [], // Additional scripts to include
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
    possibleStatuses: [ // Possible commission status strings
      {
        label: 'Completed', // Status label
        value: 'Completed' // Status value
      }, {
        label: 'In Progress',
        value: 'In Progress'
      }, {
        label: 'On Hold',
        value: 'On Hold'
      }, {
        label: 'Cancelled',
        value: 'Cancelled'
      }
    ],
    disableFieldEditing: ['amount', 'currency'], // Array of field IDs that admins cannot edit
    users: 'users' // req.session object variable for all users array
  },
  fields: [
    {
      id: 'name', // Unique identifier for the field. ID 'user' is reserved by the system and may not be used here
      type: 'text', // Field type ('text', 'number', 'date', 'textarea', 'checkbox', 'radio', 'select', 'multiselect')
      label: 'Website Name', // Field label
      description: 'The name of the website or project.', // Field description
      placeholder: 'e.g. My Website', // Placeholder text for the field
      required: true, // Whether the field is required
      options: [ // Options for select, radio, and multiselect fields
        {
          label: 'Option 1', // Option label
          value: 'option1' // Option value
        }
      ],
    },
  ],
  handlers: {
    create: (req, data) => {
      // Custom handler function for processing commission data
      // This function is called when a commission is created
      // You can implement your own logic here, such as saving to a database
      // data contains the commission fields data array
      // Action metadata can be accessed via data.createdAt and data.createdBy
    },
    update: (req, data) => {
      // Custom handler function for updating commission data
      // This function is called when a commission is updated
      // You can implement your own logic here, such as saving to a database
      // data contains the updated commission object
      // The constant data.id contains the unique commission ID
      // Action metadata can be accessed via data.updatedAt, data.updatedBy, and data.sendEmail
      // Updated metadata can be accessed via data.user, data.amount, data.currency, data.date, data.status, data.locked, and data.assignedTo
      // Updated fields can be accessed via data.fields
      // Updated tasks can be accessed via data.tasks
    },
    sync: (req) => {
      // Custom handler function for syncing user's commissions
      // This function is called when the user manually triggers a sync
      // You can implement your own logic here, such as syncing your commissions session variable
    },
  },
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
```

## Session Variables Setup

These variables must be set in your `req.session` object to enable CommTrackr functionality. Alternatively, you can modify the variable names to match your custom session configuration using the `vars` configuration during initialization.

### userId

`userId` must contain a unique identifier for the user, such as a username or user ID. This is used to track user-specific data. This must be present for CommTrackr to detect a logged-in user.

Type: `String`

Default: `'username'`

Fallback: None

Session Example: `'id'`

### userName

`userName` should contain the name of the user. This is used for display purposes in the CommTrackr interface. Fallback to `userId` if not set.

Type: `String`

Default: `'name'`

Fallback: `userId`

Session Example: `'John Doe'`

### role

`role` should contain the role of the user: `'admin'`, `'dev'`, or `'user'`. This is used to control access to certain features and functionalities within CommTrackr.

Type: `String`

Default: `'role'`

Fallback: `'user'`

Session Example: `'user'`, `'dev'`, `'admin'`

### roleAliases

`role` can also be set to custom role names. Use `roleAliases` to map your custom role names to the standard roles used by CommTrackr.

Type: `Object`

Default:

```javascript
{}
```

### access

`access` can be used as an alternative to `role` for access control. It should contain numeric access levels. Use the `access` configuration to define which levels correspond to `'user'`, `'dev'`, and `'admin'`.

Type: `Array`

Default:

```javascript
{}
```

### commissions

`commissions` should be an array of commission objects associated with the user. Each commission object should have the following structure:

Type: `Array`

Default: `'commissions'`

Session Example:

```javascript
[
  {
    id: 'unique-commission-id', // Unique identifier for the commission
    user: 'userId', // Commission creator's unique userId. Should match the userId variable, otherwise the commission will only be accessible in admin/dev views
    amount: 1000, // Commission amount as a number, or null if not applicable. Defaults to null
    currency: 'USD', // Currency code for the commission amount as a string. Defaults to 'USD'
    date: '2023-10-01', // Date of the commission in any valid date/datetime format. Defaults to null
    status: 'On Hold', // Status of the commission as a string (e.g., 'Completed', 'In Progress', 'On Hold', 'Cancelled')
    fields: { // Custom fields associated with the commission
      'id': 'value' // Key-value pairs for custom fields
    },
    tasks: [ // Array of tasks associated with the commission
      {
        done: false, // Task completion status. Defaults to false
        content: '' // Task description. Defaults to ''
      }
    ],
    locked: false, // Whether commission is locked from being edited by user. Defaults to false
    links: [ // Array of links associated with the commission
      {
        label: 'Link Label', // Link label
        url: 'http://example.com' // Link URL
      }
    ],
    assignedTo: ['dev1UserId', 'dev2UserId'] // Array of userIds of the developers assigned to this commission
  }
]
```

### possibleStatuses

`possibleStatuses` should be an array of possible commission status objects. Each status object should have a label and value property.

Type: `Array`

Default:

```javascript
[]
```

### disableFieldEditing

`disableFieldEditing` should be an array of field IDs that admins cannot edit. This is useful for restricting access to certain fields even for admin users.

Type: `Array`

Default:

```javascript
[]
```

### users

`users` should contain an array of all users and developers in the system. Each user object should have at least `userId` and defined matching `role` or `access.var` properties. `userName` property is recommended, but not required. This is used for assigning commissions to owners and developers.

Type: `Array`

Default: `'users'`
