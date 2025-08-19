# CommTrackr

Easily plan, manage, and track client commissions.

![Banner](/frontend/public/banner.png)

## Usage

Include the `commtrackr` package in your Express.js application:

```javascript
const express = require('express');
const commtrackr = require('commtrackr'); // Import the commtrackr package
const app = express();
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
});
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
```
