# Catapult
[![Netlify Status](https://api.netlify.com/api/v1/badges/e5aa07d2-125c-44b7-9cf1-5ac7c38b80f2/deploy-status)](https://app.netlify.com/sites/catapultapp/deploys)

[Demo](https://catapultapp.netlify.app)

A file sharing application inspired from Apple’s Airdrop

Functionality so far: 
- Create and join a room
- Ping each other via sockets
- Establish connection between sockets
- Find users in local network
- File sharing

> Still in development

To set up the development environment

```bash
npm install

npm run dev
```

and

```bash
npm run server
```

- Add your Firebase config to `config.ts` ([More info](https://medium.com/orion-innovation-turkey/webrtc-demystified-project-setup-28494c4f6a05))