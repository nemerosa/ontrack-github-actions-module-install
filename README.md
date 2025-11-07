ontrack-github-actions-module-install
=====================================

Reusable JS module to download and configure the Yontrack CLI.

# Installation

```bash
npm login --scope=@nemerosa --registry=https://npm.pkg.github.com
npm install @nemerosa/ontrack-github-actions-module-install
```

# Usage

```javascript
const client = require('@nemerosa/ontrack-github-actions-module-install');

// Downloading and configuring the client using a known version (recommended)
const {dir} = client.install({
    version: '5.0.0',
    yontrackUrl: 'https://yontrack.example.com',
    yontrackToken: 'xxxx',
});
```
