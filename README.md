# Cardano NextJS skeleton - Basic project skeleton

This is a basic skeleton to bootstrap Cardano Web3 applications in NextJS. This template uses [CIP-0008 signing spec](https://github.com/cardano-foundation/CIPs/blob/master/CIP-0008/README.md) for endpoint authentication. it also includes tools for creating your own custom authenticated endpoints with Cardano wallets signatures. 

The login model in this application uses wallet signatures to create the session JWT. This is useful for adding off-chain information to Cardano addresses and for creating own DIDs for your application.

Next JS allows you to build React applications much faster and easier. One of its multipe benefits is to implement single page applications with server side components that improve considerably the speed and SEO of your webpages.

## Features

*   Cardano [CIP-0008 signing spec](https://github.com/cardano-foundation/CIPs/blob/master/CIP-0008/README.md) for the login and registration process.
*   Multiple environment ready (development, production)
*   NextAuth standard implementation.
*   Encripted JWT token.
*   Server Side Rendering components.
*   User roles.
*   Pagination ready.
*   User profile.
*   Users list for admin area.
*   API collection example for Postman.
*   Testing for API endpoints.
*   NPM script for keeping good source code formatting using ESLint.
*   Mailer example with Nodemailer and Mailgun.
*   HTTPOnly jwt token cookie.

## Getting Started



First, you need to run a Mongo DB instance. The easiest way is a local instance deployed in a docker container:

```bash
docker pull mongo
docker run -d -p 27017:27017 --name YOUR_CONTAINER_NAME_HERE mongo
```

You can use Compass for exploring your MongoDB instance. Then, you can run the development server:

```bash
npm install
npm run dev
# or
yarn
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Postman

The `postman-example.json` contains a Postman collection with calls for all enpoints. You'll need to seed the database with the `seed.js` script before running the examples:

```bash
node ./seed.js
```
