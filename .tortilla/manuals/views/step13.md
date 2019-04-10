# Step 13: Authentication

[//]: # (head-end)


In the previous step we’ve set the ground for the authentication system in our app. We have a users collection which can be used to distinguish which data the client is authorized to view, and we have a context handler which can retrieve the current user logged in based on the received value of the `cookie` header. It’s definitely a good starting point, but it misses a lot of things.

In this chapter we will implement a cookie-based authentication system. There are many ways to implement an authentication system in an app, but cookie-based authentication is one of the most popular ones, hence we will go with that method. Essentially the authentication flow in our app should look very simple: a user will be able to sign-in with a dedicated screen, and if he doesn’t own an account he can use the sign-up screen to create a new one. The more complicated part in this flow is the back-end, which is the core of this chapter. So before we get into the implementation, we need to understand the authentication process:

- A user logs in with a username and a password.
The server compares the received username and password to the ones stored in the database.
- If the comparison was successful, the server will generate a token and will set it as a cookie.
- Each time a request is sent, the server will retrieve the username from the stored token on the cookie header and will send data back accordingly.

![auth-flow](https://user-images.githubusercontent.com/7648874/55929679-55e94200-5c50-11e9-9fe7-54ad6194a572.png)

The stored token will save us the hassle of re-specifying the username and password over and over again each and every request. It’s important to note that everything in the authentication process is encrypted, **sensitive information will never be stored or sent in its raw form**, otherwise data might be stolen in case of a DB breach or a request hijacking. This is what it means for our app:

- Passwords will always be stored in an encrypted form in the DB using an algorithm called [Bcrypt](https://en.wikipedia.org/wiki/Bcrypt). Bcrypt has the ability to compare the password in its raw form to the encrypted one, which can help us authorize the user.

- Tokens are self contained. That means that once we decode the encrypted string we can get a hold of the username string. This form of encrypted tokens is called [Json Web Token (JWT)](https://jwt.io/).

> We're not going to elaborate about the algorithm behind each encryption method because we want to focus more on practicality, although it's very much recommended to understand how each method works before proceeding.

The implementation will follow the principles above. Authentication is a hot topic in the GraphQL world and there are several ways of doing so. We will start with the back-end and set the infrastructure for authentication, and then we will move on to the front-end.

We’re gonna expose 2 new mutations from GraphQL Schema: `signIn` and `signUp`. `/sign-out` is unnecessary because it can be done locally by deleting the right cookie. Our back-end is gonna grow bigger so first we will separate the Express app from the Apollo Server instance, and extract the env vars to a dedicated module:

[{]: <helper> (diffStep 10.1 module="server")

#### [__Server__ Step 10.1: Separate app into a different module](https://github.com/Urigo/WhatsApp-Clone-Server/commit/0e161bca7219679020b854c9f4d38b1ab1bc002d)

##### Added app.ts
```diff
@@ -0,0 +1,14 @@
+┊  ┊ 1┊import cors from 'cors';
+┊  ┊ 2┊import cookieParser from 'cookie-parser';
+┊  ┊ 3┊import express from 'express';
+┊  ┊ 4┊import { origin } from './env';
+┊  ┊ 5┊
+┊  ┊ 6┊export const app = express();
+┊  ┊ 7┊
+┊  ┊ 8┊app.use(cors({ credentials: true, origin }));
+┊  ┊ 9┊app.use(express.json());
+┊  ┊10┊app.use(cookieParser());
+┊  ┊11┊
+┊  ┊12┊app.get('/_ping', (req, res) => {
+┊  ┊13┊  res.send('pong');
+┊  ┊14┊});
```

##### Added env.ts
```diff
@@ -0,0 +1,2 @@
+┊ ┊1┊export const origin = process.env.ORIGIN || 'http://localhost:3000';
+┊ ┊2┊export const port = process.env.PORT || 4000;
```

##### Changed index.ts
```diff
@@ -1,23 +1,11 @@
 ┊ 1┊ 1┊import { ApolloServer, gql, PubSub } from 'apollo-server-express';
-┊ 2┊  ┊import cors from 'cors';
-┊ 3┊  ┊import cookieParser from 'cookie-parser';
 ┊ 4┊ 2┊import cookie from 'cookie';
-┊ 5┊  ┊import express from 'express';
 ┊ 6┊ 3┊import http from 'http';
+┊  ┊ 4┊import { app } from './app';
 ┊ 7┊ 5┊import { users } from './db';
+┊  ┊ 6┊import { origin, port } from './env';
 ┊ 8┊ 7┊import schema from './schema';
 ┊ 9┊ 8┊
-┊10┊  ┊const app = express();
-┊11┊  ┊
-┊12┊  ┊const origin = process.env.ORIGIN || 'http://localhost:3000';
-┊13┊  ┊app.use(cors({ credentials: true, origin }));
-┊14┊  ┊app.use(express.json());
-┊15┊  ┊app.use(cookieParser());
-┊16┊  ┊
-┊17┊  ┊app.get('/_ping', (req, res) => {
-┊18┊  ┊  res.send('pong');
-┊19┊  ┊});
-┊20┊  ┊
 ┊21┊ 9┊const pubsub = new PubSub();
 ┊22┊10┊const server = new ApolloServer({
 ┊23┊11┊  schema,
```
```diff
@@ -56,8 +44,6 @@
 ┊56┊44┊const httpServer = http.createServer(app);
 ┊57┊45┊server.installSubscriptionHandlers(httpServer);
 ┊58┊46┊
-┊59┊  ┊const port = process.env.PORT || 4000;
-┊60┊  ┊
 ┊61┊47┊httpServer.listen(port, () => {
 ┊62┊48┊  console.log(`Server is listening on port ${port}`);
 ┊63┊49┊});
```

[}]: #

We will first start with the `signIn` mutation, so we can test it against pre-defined user credentials, and then we will proceed to implementing the `signUp` mutation. It would be a lot easier to progress this way. For that we will install a couple of packages:

- `bcrypt` - which is responsible for running a one-way encryption against received passwords before they’re stored in the DB.
- `jsonwebtoken` - responsible for encrypting the logged-in username before it’s set as a cooky and decrypting it once it’s sent back with a request.

    $ yarn add bcrypt jsonwebtoken


    $ yarn add --dev @types/bcrypt @types/jsonwebtoken

And we will implement the `signIn` mutation:

[{]: <helper> (diffStep 10.2 module="server")

#### [__Server__ Step 10.2: Add signIn mutation](https://github.com/Urigo/WhatsApp-Clone-Server/commit/132f7fed900f8c52c1e5297e813a4a8c66e6f159)

##### Changed context.ts
```diff
@@ -1,7 +1,9 @@
 ┊1┊1┊import { PubSub } from 'apollo-server-express';
 ┊2┊2┊import { User } from './db';
+┊ ┊3┊import { Response } from 'express';
 ┊3┊4┊
 ┊4┊5┊export type MyContext = {
 ┊5┊6┊  pubsub: PubSub;
 ┊6┊7┊  currentUser: User;
+┊ ┊8┊  res: Response;
 ┊7┊9┊};
```

##### Changed env.ts
```diff
@@ -1,2 +1,6 @@
+┊ ┊1┊export const expiration = process.env.JWT_EXPIRATION_MS
+┊ ┊2┊  ? parseInt(process.env.JWT_EXPIRATION_MS)
+┊ ┊3┊  : 24 * 60 * 60 * 1000;
+┊ ┊4┊export const secret = process.env.JWT_SECRET || '70p53cr37';
 ┊1┊5┊export const origin = process.env.ORIGIN || 'http://localhost:3000';
 ┊2┊6┊export const port = process.env.PORT || 4000;
```

##### Changed index.ts
```diff
@@ -23,6 +23,7 @@
 ┊23┊23┊    return {
 ┊24┊24┊      currentUser: users.find((u) => u.id === req.cookies.currentUserId),
 ┊25┊25┊      pubsub,
+┊  ┊26┊      res: session.res,
 ┊26┊27┊    };
 ┊27┊28┊  },
 ┊28┊29┊  subscriptions: {
```

##### Changed package.json
```diff
@@ -20,12 +20,14 @@
 ┊20┊20┊    "@graphql-codegen/cli": "1.13.1",
 ┊21┊21┊    "@graphql-codegen/typescript": "1.13.1",
 ┊22┊22┊    "@graphql-codegen/typescript-resolvers": "1.13.1",
+┊  ┊23┊    "@types/bcrypt": "3.0.0",
 ┊23┊24┊    "@types/cors": "2.8.6",
 ┊24┊25┊    "@types/cookie": "0.3.3",
 ┊25┊26┊    "@types/cookie-parser": "1.4.2",
 ┊26┊27┊    "@types/express": "4.17.3",
 ┊27┊28┊    "@types/graphql": "14.5.0",
 ┊28┊29┊    "@types/jest": "25.1.4",
+┊  ┊30┊    "@types/jsonwebtoken": "8.3.8",
 ┊29┊31┊    "@types/node": "13.9.5",
 ┊30┊32┊    "jest": "25.2.3",
 ┊31┊33┊    "jest-junit": "10.0.0",
```
```diff
@@ -37,6 +39,7 @@
 ┊37┊39┊  "dependencies": {
 ┊38┊40┊    "apollo-server-express": "2.11.0",
 ┊39┊41┊    "apollo-server-testing": "2.11.0",
+┊  ┊42┊    "bcrypt": "4.0.1",
 ┊40┊43┊    "cookie": "0.4.0",
 ┊41┊44┊    "cors": "2.8.5",
 ┊42┊45┊    "cookie-parser": "1.4.5",
```
```diff
@@ -44,7 +47,8 @@
 ┊44┊47┊    "graphql": "14.6.0",
 ┊45┊48┊    "graphql-import": "1.0.1",
 ┊46┊49┊    "graphql-scalars": "1.0.9",
-┊47┊  ┊    "graphql-tools": "4.0.7"
+┊  ┊50┊    "graphql-tools": "4.0.7",
+┊  ┊51┊    "jsonwebtoken": "8.5.1"
 ┊48┊52┊  },
 ┊49┊53┊  "jest": {
 ┊50┊54┊    "transform": {
```

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -2,6 +2,9 @@
 ┊ 2┊ 2┊import { DateTimeResolver, URLResolver } from 'graphql-scalars';
 ┊ 3┊ 3┊import { User, Message, Chat, chats, messages, users } from '../db';
 ┊ 4┊ 4┊import { Resolvers } from '../types/graphql';
+┊  ┊ 5┊import { secret, expiration } from '../env';
+┊  ┊ 6┊import bcrypt from 'bcrypt';
+┊  ┊ 7┊import jwt from 'jsonwebtoken';
 ┊ 5┊ 8┊
 ┊ 6┊ 9┊const resolvers: Resolvers = {
 ┊ 7┊10┊  Date: DateTimeResolver,
```
```diff
@@ -89,11 +92,31 @@
 ┊ 89┊ 92┊    users(root, args, { currentUser }) {
 ┊ 90┊ 93┊      if (!currentUser) return [];
 ┊ 91┊ 94┊
-┊ 92┊   ┊      return users.filter(u => u.id !== currentUser.id);
+┊   ┊ 95┊      return users.filter((u) => u.id !== currentUser.id);
 ┊ 93┊ 96┊    },
 ┊ 94┊ 97┊  },
 ┊ 95┊ 98┊
 ┊ 96┊ 99┊  Mutation: {
+┊   ┊100┊    signIn(root, { username, password }, { res }) {
+┊   ┊101┊      const user = users.find((u) => u.username === username);
+┊   ┊102┊
+┊   ┊103┊      if (!user) {
+┊   ┊104┊        throw new Error('user not found');
+┊   ┊105┊      }
+┊   ┊106┊
+┊   ┊107┊      const passwordsMatch = bcrypt.compareSync(password, user.password);
+┊   ┊108┊
+┊   ┊109┊      if (!passwordsMatch) {
+┊   ┊110┊        throw new Error('password is incorrect');
+┊   ┊111┊      }
+┊   ┊112┊
+┊   ┊113┊      const authToken = jwt.sign(username, secret);
+┊   ┊114┊
+┊   ┊115┊      res.cookie('authToken', authToken, { maxAge: expiration });
+┊   ┊116┊
+┊   ┊117┊      return user;
+┊   ┊118┊    },
+┊   ┊119┊
 ┊ 97┊120┊    addMessage(root, { chatId, content }, { currentUser, pubsub }) {
 ┊ 98┊121┊      if (!currentUser) return null;
 ┊ 99┊122┊
```
```diff
@@ -133,17 +156,17 @@
 ┊133┊156┊
 ┊134┊157┊    addChat(root, { recipientId }, { currentUser, pubsub }) {
 ┊135┊158┊      if (!currentUser) return null;
-┊136┊   ┊      if (!users.some(u => u.id === recipientId)) return null;
+┊   ┊159┊      if (!users.some((u) => u.id === recipientId)) return null;
 ┊137┊160┊
 ┊138┊161┊      let chat = chats.find(
-┊139┊   ┊        c =>
+┊   ┊162┊        (c) =>
 ┊140┊163┊          c.participants.includes(currentUser.id) &&
 ┊141┊164┊          c.participants.includes(recipientId)
 ┊142┊165┊      );
 ┊143┊166┊
 ┊144┊167┊      if (chat) return chat;
 ┊145┊168┊
-┊146┊   ┊      const chatsIds = chats.map(c => Number(c.id));
+┊   ┊169┊      const chatsIds = chats.map((c) => Number(c.id));
 ┊147┊170┊
 ┊148┊171┊      chat = {
 ┊149┊172┊        id: String(Math.max(...chatsIds) + 1),
```
```diff
@@ -163,16 +186,18 @@
 ┊163┊186┊    removeChat(root, { chatId }, { currentUser, pubsub }) {
 ┊164┊187┊      if (!currentUser) return null;
 ┊165┊188┊
-┊166┊   ┊      const chatIndex = chats.findIndex(c => c.id === chatId);
+┊   ┊189┊      const chatIndex = chats.findIndex((c) => c.id === chatId);
 ┊167┊190┊
 ┊168┊191┊      if (chatIndex === -1) return null;
 ┊169┊192┊
 ┊170┊193┊      const chat = chats[chatIndex];
 ┊171┊194┊
-┊172┊   ┊      if (!chat.participants.some(p => p === currentUser.id)) return null;
+┊   ┊195┊      if (!chat.participants.some((p) => p === currentUser.id)) return null;
 ┊173┊196┊
-┊174┊   ┊      chat.messages.forEach(chatMessage => {
-┊175┊   ┊        const chatMessageIndex = messages.findIndex(m => m.id === chatMessage);
+┊   ┊197┊      chat.messages.forEach((chatMessage) => {
+┊   ┊198┊        const chatMessageIndex = messages.findIndex(
+┊   ┊199┊          (m) => m.id === chatMessage
+┊   ┊200┊        );
 ┊176┊201┊
 ┊177┊202┊        if (chatMessageIndex !== -1) {
 ┊178┊203┊          messages.splice(chatMessageIndex, 1);
```
```diff
@@ -210,7 +235,7 @@
 ┊210┊235┊        ({ chatAdded }: { chatAdded: Chat }, args, { currentUser }) => {
 ┊211┊236┊          if (!currentUser) return false;
 ┊212┊237┊
-┊213┊   ┊          return chatAdded.participants.some(p => p === currentUser.id);
+┊   ┊238┊          return chatAdded.participants.some((p) => p === currentUser.id);
 ┊214┊239┊        }
 ┊215┊240┊      ),
 ┊216┊241┊    },
```
```diff
@@ -221,7 +246,7 @@
 ┊221┊246┊        ({ targetChat }: { targetChat: Chat }, args, { currentUser }) => {
 ┊222┊247┊          if (!currentUser) return false;
 ┊223┊248┊
-┊224┊   ┊          return targetChat.participants.some(p => p === currentUser.id);
+┊   ┊249┊          return targetChat.participants.some((p) => p === currentUser.id);
 ┊225┊250┊        }
 ┊226┊251┊      ),
 ┊227┊252┊    },
```

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -33,6 +33,7 @@
 ┊33┊33┊}
 ┊34┊34┊
 ┊35┊35┊type Mutation {
+┊  ┊36┊  signIn(username: String!, password: String!): User
 ┊36┊37┊  addMessage(chatId: ID!, content: String!): Message
 ┊37┊38┊  addChat(recipientId: ID!): Chat
 ┊38┊39┊  removeChat(chatId: ID!): ID
```

[}]: #

As you can see we use a special secret before we encrypt the username with JWT. The same secret will be used later on to decrypt the token back into username when getting requests. If someone malicious will get a hold of that password, he can fabricate an authentication token for every user that he wants, **thus it’s important to choose a strong secret**.

When building the context for our GraphQL resolvers, we will decode the received cookie with JWT using the same secret to determine the username who made the request. Once we have that username, we can simply retrieve the original user from the DB and define it on the context:

[{]: <helper> (diffStep 10.3 module="server")

#### [__Server__ Step 10.3: Get current user from auth token](https://github.com/Urigo/WhatsApp-Clone-Server/commit/f7a86c6da3c9c2401b6fd9285e079fd506eb7157)

##### Changed index.ts
```diff
@@ -1,9 +1,10 @@
 ┊ 1┊ 1┊import { ApolloServer, gql, PubSub } from 'apollo-server-express';
 ┊ 2┊ 2┊import cookie from 'cookie';
 ┊ 3┊ 3┊import http from 'http';
+┊  ┊ 4┊import jwt from 'jsonwebtoken';
 ┊ 4┊ 5┊import { app } from './app';
 ┊ 5┊ 6┊import { users } from './db';
-┊ 6┊  ┊import { origin, port } from './env';
+┊  ┊ 7┊import { origin, port, secret } from './env';
 ┊ 7┊ 8┊import schema from './schema';
 ┊ 8┊ 9┊
 ┊ 9┊10┊const pubsub = new PubSub();
```
```diff
@@ -20,8 +21,14 @@
 ┊20┊21┊      req.cookies = cookie.parse(req.headers.cookie || '');
 ┊21┊22┊    }
 ┊22┊23┊
+┊  ┊24┊    let currentUser;
+┊  ┊25┊    if (req.cookies.authToken) {
+┊  ┊26┊      const username = jwt.verify(req.cookies.authToken, secret) as string;
+┊  ┊27┊      currentUser = username && users.find((u) => u.username === username);
+┊  ┊28┊    }
+┊  ┊29┊
 ┊23┊30┊    return {
-┊24┊  ┊      currentUser: users.find((u) => u.id === req.cookies.currentUserId),
+┊  ┊31┊      currentUser,
 ┊25┊32┊      pubsub,
 ┊26┊33┊      res: session.res,
 ┊27┊34┊    };
```

[}]: #

You might have noticed that the User schema has been updated, because we try to address the `user.username` property. The authentication in our app will be done with a username and a password; accordingly, we will update our User type definitions and the user documents in the users collection mock. The credentials that we’re going to store can actually be used to sign-in to our app:

[{]: <helper> (diffStep 10.4 module="server")

#### [__Server__ Step 10.4: Update user schema to contain credentials](https://github.com/Urigo/WhatsApp-Clone-Server/commit/1822f672aac6639ebb6fb58001a45d442b73e90a)

##### Changed db.ts
```diff
@@ -1,6 +1,8 @@
 ┊1┊1┊export type User = {
 ┊2┊2┊  id: string;
 ┊3┊3┊  name: string;
+┊ ┊4┊  username: string;
+┊ ┊5┊  password: string;
 ┊4┊6┊  picture: string;
 ┊5┊7┊};
 ┊6┊8┊
```
```diff
@@ -30,26 +32,41 @@
 ┊30┊32┊      {
 ┊31┊33┊        id: '1',
 ┊32┊34┊        name: 'Ray Edwards',
+┊  ┊35┊        username: 'ray',
+┊  ┊36┊        password:
+┊  ┊37┊          '$2a$08$NO9tkFLCoSqX1c5wk3s7z.JfxaVMKA.m7zUDdDwEquo4rvzimQeJm', // 111
 ┊33┊38┊        picture: 'https://randomuser.me/api/portraits/thumb/lego/1.jpg',
 ┊34┊39┊      },
 ┊35┊40┊      {
 ┊36┊41┊        id: '2',
 ┊37┊42┊        name: 'Ethan Gonzalez',
+┊  ┊43┊        username: 'ethan',
+┊  ┊44┊        password:
+┊  ┊45┊          '$2a$08$xE4FuCi/ifxjL2S8CzKAmuKLwv18ktksSN.F3XYEnpmcKtpbpeZgO', // 222
 ┊38┊46┊        picture: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
 ┊39┊47┊      },
 ┊40┊48┊      {
 ┊41┊49┊        id: '3',
 ┊42┊50┊        name: 'Bryan Wallace',
+┊  ┊51┊        username: 'bryan',
+┊  ┊52┊        password:
+┊  ┊53┊          '$2a$08$UHgH7J8G6z1mGQn2qx2kdeWv0jvgHItyAsL9hpEUI3KJmhVW5Q1d.', // 333
 ┊43┊54┊        picture: 'https://randomuser.me/api/portraits/thumb/men/2.jpg',
 ┊44┊55┊      },
 ┊45┊56┊      {
 ┊46┊57┊        id: '4',
 ┊47┊58┊        name: 'Avery Stewart',
+┊  ┊59┊        username: 'avery',
+┊  ┊60┊        password:
+┊  ┊61┊          '$2a$08$wR1k5Q3T9FC7fUgB7Gdb9Os/GV7dGBBf4PLlWT7HERMFhmFDt47xi', // 444
 ┊48┊62┊        picture: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
 ┊49┊63┊      },
 ┊50┊64┊      {
 ┊51┊65┊        id: '5',
 ┊52┊66┊        name: 'Katie Peterson',
+┊  ┊67┊        username: 'katie',
+┊  ┊68┊        password:
+┊  ┊69┊          '$2a$08$6.mbXqsDX82ZZ7q5d8Osb..JrGSsNp4R3IKj7mxgF6YGT0OmMw242', // 555
 ┊53┊70┊        picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
 ┊54┊71┊      },
 ┊55┊72┊    ]
```

[}]: #

To test it out, we will run our front-end application and open the dev-console. Using the Apollo Client we will send a request to the `signIn` mutation. We can use the credentials of one of the users stored in the DB. As for now all our restricted routes are observing the `currentUserId` cookie. This is wrong and no longer relevant. Let’s change the `withAuth()` method to observe the `authToken` cookie so we can test our new mutation successfully:

[{]: <helper> (diffStep 13.1 module="client")

#### [__Client__ Step 13.1: Use authToken cookie](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/9348bbfd926c99ac0bf7c5866b4dec103c1c10fd)

##### Changed src&#x2F;services&#x2F;auth.service.tsx
```diff
@@ -22,8 +22,8 @@
 ┊22┊22┊  };
 ┊23┊23┊};
 ┊24┊24┊
-┊25┊  ┊export const signIn = (currentUserId: string) => {
-┊26┊  ┊  document.cookie = `currentUserId=${currentUserId}`;
+┊  ┊25┊export const signIn = (authToken: string) => {
+┊  ┊26┊  document.cookie = `authToken=${authToken}`;
 ┊27┊27┊
 ┊28┊28┊  // This will become async in the near future
 ┊29┊29┊  return Promise.resolve();
```
```diff
@@ -35,7 +35,7 @@
 ┊35┊35┊  return useCallback(() => {
 ┊36┊36┊    // "expires" represents the lifespan of a cookie. Beyond that date the cookie will
 ┊37┊37┊    // be deleted by the browser. "expires" cannot be viewed from "document.cookie"
-┊38┊  ┊    document.cookie = `currentUserId=;expires=${new Date(0)}`;
+┊  ┊38┊    document.cookie = `authToken=;expires=${new Date(0)}`;
 ┊39┊39┊
 ┊40┊40┊    // Clear cache
 ┊41┊41┊    return client.clearStore();
```
```diff
@@ -43,5 +43,5 @@
 ┊43┊43┊};
 ┊44┊44┊
 ┊45┊45┊export const isSignedIn = () => {
-┊46┊  ┊  return /currentUserId=.+(;|$)/.test(document.cookie);
+┊  ┊46┊  return /authToken=.+(;|$)/.test(document.cookie);
 ┊47┊47┊};
```

[}]: #

Now we can perform the signIn. It would be a good idea to signIn with the first user - `ray`, since all the DB mock is built around him:

```js
mutation signIn(username: 'ray', password: '111') {
  id
}
```

Now if we would look at the value of `document.cookie` we should see a key named `authToken` with a JWT token and the `ChatsListScreen` should show the chats which are relevant to `ray`. To complete the sign-in flow we would need to update the `AuthScreen` and the `auth.service` to use username and password and the actual `sign-in` mutation we’ve just implemented.

Now back to the `auth.service`, we will replace the `signIn()` method implementation with one that actually calls the `signIn` mutation in our API. We will start by defining the mutation:

[{]: <helper> (diffStep 13.2 files="graphql/mutations" module="client")

#### [__Client__ Step 13.2: Update auth service to call signIn mutation](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/0fbeb9f18c7b308172a4ad4d4e455afc51dbe0ab)

##### Added src&#x2F;graphql&#x2F;mutations&#x2F;index.ts
```diff
@@ -0,0 +1 @@
+┊ ┊1┊export { default as signIn } from './signIn.mutation';
```

##### Added src&#x2F;graphql&#x2F;mutations&#x2F;signIn.mutation.ts
```diff
@@ -0,0 +1,9 @@
+┊ ┊1┊import gql from 'graphql-tag';
+┊ ┊2┊
+┊ ┊3┊export default gql`
+┊ ┊4┊  mutation signIn($username: String!, $password: String!) {
+┊ ┊5┊    signIn(username: $username, password: $password) {
+┊ ┊6┊      id
+┊ ┊7┊    }
+┊ ┊8┊  }
+┊ ┊9┊`;
```

[}]: #

Updating `codegen.yml` to include the file we've just added in the generation process:

[{]: <helper> (diffStep 13.2 files="codegen.yml" module="client")

#### [__Client__ Step 13.2: Update auth service to call signIn mutation](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/0fbeb9f18c7b308172a4ad4d4e455afc51dbe0ab)



[}]: #

And finally, we will update the service to use the generated mutation method `useSignInMutation()`:

[{]: <helper> (diffStep 13.2 files="auth.service.ts" module="client")

#### [__Client__ Step 13.2: Update auth service to call signIn mutation](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/0fbeb9f18c7b308172a4ad4d4e455afc51dbe0ab)

##### Changed src&#x2F;services&#x2F;auth.service.tsx
```diff
@@ -2,6 +2,7 @@
 ┊2┊2┊import { useCallback } from 'react';
 ┊3┊3┊import { useApolloClient } from '@apollo/react-hooks';
 ┊4┊4┊import { Redirect } from 'react-router-dom';
+┊ ┊5┊import { useSignInMutation } from '../graphql/types';
 ┊5┊6┊import { useCacheService } from './cache.service';
 ┊6┊7┊
 ┊7┊8┊export const withAuth = <P extends object>(
```
```diff
@@ -22,12 +23,7 @@
 ┊22┊23┊  };
 ┊23┊24┊};
 ┊24┊25┊
-┊25┊  ┊export const signIn = (authToken: string) => {
-┊26┊  ┊  document.cookie = `authToken=${authToken}`;
-┊27┊  ┊
-┊28┊  ┊  // This will become async in the near future
-┊29┊  ┊  return Promise.resolve();
-┊30┊  ┊};
+┊  ┊26┊export const useSignIn = useSignInMutation;
 ┊31┊27┊
 ┊32┊28┊export const useSignOut = () => {
 ┊33┊29┊  const client = useApolloClient();
```

[}]: #

To check if we’re authorized to visit a route, not only we would need to check if we have the `authToken` cookie defined, but we would also need to validate it against the server to see that it actually references a real user. For that we will implement `Query.me` which will send us back the current user logged in directly from the context:

[{]: <helper> (diffStep 10.5 module="server")

#### [__Server__ Step 10.5: Add Query.me](https://github.com/Urigo/WhatsApp-Clone-Server/commit/1ae7dbf25c93c8b49ea9cf6efa708ee5e94e84a7)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -73,6 +73,10 @@
 ┊73┊73┊  },
 ┊74┊74┊
 ┊75┊75┊  Query: {
+┊  ┊76┊    me(root, args, { currentUser }) {
+┊  ┊77┊      return currentUser || null;
+┊  ┊78┊    },
+┊  ┊79┊
 ┊76┊80┊    chats(root, args, { currentUser }) {
 ┊77┊81┊      if (!currentUser) return [];
 ┊78┊82┊
```

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -27,6 +27,7 @@
 ┊27┊27┊}
 ┊28┊28┊
 ┊29┊29┊type Query {
+┊  ┊30┊  me: User
 ┊30┊31┊  chats: [Chat!]!
 ┊31┊32┊  chat(chatId: ID!): Chat
 ┊32┊33┊  users: [User!]!
```

##### Added tests&#x2F;queries&#x2F;getMe.test.ts
```diff
@@ -0,0 +1,33 @@
+┊  ┊ 1┊import { createTestClient } from 'apollo-server-testing';
+┊  ┊ 2┊import { ApolloServer, gql } from 'apollo-server-express';
+┊  ┊ 3┊import schema from '../../schema';
+┊  ┊ 4┊import { users } from '../../db';
+┊  ┊ 5┊
+┊  ┊ 6┊describe('Query.me', () => {
+┊  ┊ 7┊  it('should fetch current user', async () => {
+┊  ┊ 8┊    const server = new ApolloServer({
+┊  ┊ 9┊      schema,
+┊  ┊10┊      context: () => ({
+┊  ┊11┊        currentUser: users[0],
+┊  ┊12┊      }),
+┊  ┊13┊    });
+┊  ┊14┊
+┊  ┊15┊    const { query } = createTestClient(server);
+┊  ┊16┊
+┊  ┊17┊    const res = await query({
+┊  ┊18┊      query: gql`
+┊  ┊19┊        query GetMe {
+┊  ┊20┊          me {
+┊  ┊21┊            id
+┊  ┊22┊            name
+┊  ┊23┊            picture
+┊  ┊24┊          }
+┊  ┊25┊        }
+┊  ┊26┊      `,
+┊  ┊27┊    });
+┊  ┊28┊
+┊  ┊29┊    expect(res.data).toBeDefined();
+┊  ┊30┊    expect(res.errors).toBeUndefined();
+┊  ┊31┊    expect(res.data).toMatchSnapshot();
+┊  ┊32┊  });
+┊  ┊33┊});
```

[}]: #

Now will use the GraphQL query we’ve just implemented to check if the user actually exists within the DB before we proceed to the restricted route:

[{]: <helper> (diffStep 13.3 module="client")

#### [__Client__ Step 13.3: Validate auth token against the back-end on restricted route](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/ebb33ded33d1c1a5da67a149fc259f69c02d51a9)

##### Added src&#x2F;graphql&#x2F;queries&#x2F;me.query.ts
```diff
@@ -0,0 +1,11 @@
+┊  ┊ 1┊import gql from 'graphql-tag';
+┊  ┊ 2┊import * as fragments from '../fragments';
+┊  ┊ 3┊
+┊  ┊ 4┊export default gql`
+┊  ┊ 5┊  query Me {
+┊  ┊ 6┊    me {
+┊  ┊ 7┊      ...User
+┊  ┊ 8┊    }
+┊  ┊ 9┊  }
+┊  ┊10┊  ${fragments.user}
+┊  ┊11┊`;
```

##### Changed src&#x2F;services&#x2F;auth.service.tsx
```diff
@@ -1,10 +1,16 @@
 ┊ 1┊ 1┊import React from 'react';
-┊ 2┊  ┊import { useCallback } from 'react';
+┊  ┊ 2┊import { useContext, useCallback } from 'react';
 ┊ 3┊ 3┊import { useApolloClient } from '@apollo/react-hooks';
 ┊ 4┊ 4┊import { Redirect } from 'react-router-dom';
-┊ 5┊  ┊import { useSignInMutation } from '../graphql/types';
+┊  ┊ 5┊import { useMeQuery, User, useSignInMutation } from '../graphql/types';
 ┊ 6┊ 6┊import { useCacheService } from './cache.service';
 ┊ 7┊ 7┊
+┊  ┊ 8┊const MyContext = React.createContext<User | null>(null);
+┊  ┊ 9┊
+┊  ┊10┊export const useMe = () => {
+┊  ┊11┊  return useContext(MyContext);
+┊  ┊12┊};
+┊  ┊13┊
 ┊ 8┊14┊export const withAuth = <P extends object>(
 ┊ 9┊15┊  Component: React.ComponentType<P>
 ┊10┊16┊) => {
```
```diff
@@ -17,9 +23,26 @@
 ┊17┊23┊      return <Redirect to="/sign-in" />;
 ┊18┊24┊    }
 ┊19┊25┊
+┊  ┊26┊    const signOut = useSignOut();
+┊  ┊27┊    const { data, error, loading } = useMeQuery();
+┊  ┊28┊
 ┊20┊29┊    useCacheService();
 ┊21┊30┊
-┊22┊  ┊    return <Component {...(props as P)} />;
+┊  ┊31┊    if (loading) return null;
+┊  ┊32┊
+┊  ┊33┊    if (data === undefined) return null;
+┊  ┊34┊
+┊  ┊35┊    if (error || !data.me) {
+┊  ┊36┊      signOut();
+┊  ┊37┊
+┊  ┊38┊      return <Redirect to="/sign-in" />;
+┊  ┊39┊    }
+┊  ┊40┊
+┊  ┊41┊    return (
+┊  ┊42┊      <MyContext.Provider value={data.me}>
+┊  ┊43┊        <Component {...(props as P)} />
+┊  ┊44┊      </MyContext.Provider>
+┊  ┊45┊    );
 ┊23┊46┊  };
 ┊24┊47┊};
```

[}]: #

we will use the new query to try and fetch the user directly from the back-end, and we will only proceed if the user was actually found. In addition, we will replace the `signIn()` method to call `signIn` mutation:

[{]: <helper> (diffStep 13.4 module="client")

#### [__Client__ Step 13.4: Add username and password to AuthScreen](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/a09bc986eb093981ac11a3e56e5ce17668b0090b)

##### Changed src&#x2F;components&#x2F;AuthScreen&#x2F;index.tsx
```diff
@@ -3,7 +3,7 @@
 ┊3┊3┊import React from 'react';
 ┊4┊4┊import { useCallback, useState } from 'react';
 ┊5┊5┊import styled from 'styled-components';
-┊6┊ ┊import { signIn } from '../../services/auth.service';
+┊ ┊6┊import { useSignIn } from '../../services/auth.service';
 ┊7┊7┊import { RouteComponentProps } from 'react-router-dom';
 ┊8┊8┊
 ┊9┊9┊const Container = styled.div`
```
```diff
@@ -114,21 +114,35 @@
 ┊114┊114┊`;
 ┊115┊115┊
 ┊116┊116┊const AuthScreen: React.FC<RouteComponentProps<any>> = ({ history }) => {
-┊117┊   ┊  const [userId, setUserId] = useState('');
+┊   ┊117┊  const [username, setUsername] = useState('');
+┊   ┊118┊  const [password, setPassword] = useState('');
+┊   ┊119┊  // eslint-disable-next-line
+┊   ┊120┊  const [error, setError] = useState('');
+┊   ┊121┊  const [signIn] = useSignIn();
+┊   ┊122┊
+┊   ┊123┊  const onUsernameChange = useCallback(({ target }) => {
+┊   ┊124┊    setError('');
+┊   ┊125┊    setUsername(target.value);
+┊   ┊126┊  }, []);
 ┊118┊127┊
-┊119┊   ┊  const onUserIdChange = useCallback(({ target }) => {
-┊120┊   ┊    setUserId(target.value);
+┊   ┊128┊  const onPasswordChange = useCallback(({ target }) => {
+┊   ┊129┊    setError('');
+┊   ┊130┊    setPassword(target.value);
 ┊121┊131┊  }, []);
 ┊122┊132┊
 ┊123┊133┊  const maySignIn = useCallback(() => {
-┊124┊   ┊    return !!userId;
-┊125┊   ┊  }, [userId]);
+┊   ┊134┊    return !!(username && password);
+┊   ┊135┊  }, [username, password]);
 ┊126┊136┊
 ┊127┊137┊  const handleSignIn = useCallback(() => {
-┊128┊   ┊    signIn(userId).then(() => {
-┊129┊   ┊      history.replace('/chats');
-┊130┊   ┊    });
-┊131┊   ┊  }, [userId, history]);
+┊   ┊138┊    signIn({ variables: { username, password } })
+┊   ┊139┊      .then(() => {
+┊   ┊140┊        history.push('/chats');
+┊   ┊141┊      })
+┊   ┊142┊      .catch((error) => {
+┊   ┊143┊        setError(error.message || error);
+┊   ┊144┊      });
+┊   ┊145┊  }, [username, password, history, signIn]);
 ┊132┊146┊
 ┊133┊147┊  return (
 ┊134┊148┊    <Container>
```
```diff
@@ -141,12 +155,21 @@
 ┊141┊155┊          <Legend>Sign in</Legend>
 ┊142┊156┊          <Section>
 ┊143┊157┊            <TextField
-┊144┊   ┊              data-testid="user-id-input"
-┊145┊   ┊              label="User ID"
-┊146┊   ┊              value={userId}
-┊147┊   ┊              onChange={onUserIdChange}
+┊   ┊158┊              className="AuthScreen-text-field"
+┊   ┊159┊              label="Username"
+┊   ┊160┊              value={username}
+┊   ┊161┊              onChange={onUsernameChange}
+┊   ┊162┊              margin="normal"
+┊   ┊163┊              placeholder="Enter your username"
+┊   ┊164┊            />
+┊   ┊165┊            <TextField
+┊   ┊166┊              className="AuthScreen-text-field"
+┊   ┊167┊              label="Password"
+┊   ┊168┊              type="password"
+┊   ┊169┊              value={password}
+┊   ┊170┊              onChange={onPasswordChange}
 ┊148┊171┊              margin="normal"
-┊149┊   ┊              placeholder="Enter current user ID"
+┊   ┊172┊              placeholder="Enter your password"
 ┊150┊173┊            />
 ┊151┊174┊          </Section>
 ┊152┊175┊          <Button
```

[}]: #

The behavior of the updated screen should be identical to what we had so far. To complete the flow we’ll need a way to signUp. When we signing-up we will need the following parameters: `name`, `username`, `password` and `passwordConfirm`. In addition we will need to run certain validations against the parameters:

- The name must be at least 3 and at most 50 characters long.
- The username must be at least 3 and at most 18 characters long.
- A password must be at least 8 and at most 30 characters long. In addition, it should contain English letters, numbers, and special characters.

For that we will implement a dedicated validations module:

[{]: <helper> (diffStep 10.6 files="validators" module="server")

#### [__Server__ Step 10.6: Add signUp mutation](https://github.com/Urigo/WhatsApp-Clone-Server/commit/8486018985a8a1e094c30f44d2241e21c5f6ea7d)

##### Added validators.ts
```diff
@@ -0,0 +1,43 @@
+┊  ┊ 1┊export const validatePassword = (ctx: string, str: string) => {
+┊  ┊ 2┊  if (typeof str !== 'string') {
+┊  ┊ 3┊    throw TypeError(`${ctx} must be a string`);
+┊  ┊ 4┊  }
+┊  ┊ 5┊
+┊  ┊ 6┊  validateLength(ctx, str, 8, 30);
+┊  ┊ 7┊
+┊  ┊ 8┊  if (!/[a-zA-Z]+/.test(str)) {
+┊  ┊ 9┊    throw TypeError(`${ctx} must contain english letters`);
+┊  ┊10┊  }
+┊  ┊11┊
+┊  ┊12┊  if (!/\d+/.test(str)) {
+┊  ┊13┊    throw TypeError(`${ctx} must contain numbers`);
+┊  ┊14┊  }
+┊  ┊15┊
+┊  ┊16┊  if (!/[^\da-zA-Z]+/.test(str)) {
+┊  ┊17┊    throw TypeError(`${ctx} must contain special charachters`);
+┊  ┊18┊  }
+┊  ┊19┊};
+┊  ┊20┊
+┊  ┊21┊export const validateLength = (ctx: string, str: string, ...args: number[]) => {
+┊  ┊22┊  let min, max;
+┊  ┊23┊
+┊  ┊24┊  if (args.length === 1) {
+┊  ┊25┊    min = 0;
+┊  ┊26┊    max = args[0];
+┊  ┊27┊  } else {
+┊  ┊28┊    min = args[0];
+┊  ┊29┊    max = args[1];
+┊  ┊30┊  }
+┊  ┊31┊
+┊  ┊32┊  if (typeof str !== 'string') {
+┊  ┊33┊    throw TypeError(`${ctx} must be a string`);
+┊  ┊34┊  }
+┊  ┊35┊
+┊  ┊36┊  if (str.length < min) {
+┊  ┊37┊    throw TypeError(`${ctx} must be at least ${min} chars long`);
+┊  ┊38┊  }
+┊  ┊39┊
+┊  ┊40┊  if (str.length > max) {
+┊  ┊41┊    throw TypeError(`${ctx} must contain ${max} chars at most`);
+┊  ┊42┊  }
+┊  ┊43┊};
```

[}]: #

And we will implement the resolver and schema for the `signUp` mutation:

[{]: <helper> (diffStep 10.6 files="schema" module="server")

#### [__Server__ Step 10.6: Add signUp mutation](https://github.com/Urigo/WhatsApp-Clone-Server/commit/8486018985a8a1e094c30f44d2241e21c5f6ea7d)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -5,6 +5,7 @@
 ┊ 5┊ 5┊import { secret, expiration } from '../env';
 ┊ 6┊ 6┊import bcrypt from 'bcrypt';
 ┊ 7┊ 7┊import jwt from 'jsonwebtoken';
+┊  ┊ 8┊import { validateLength, validatePassword } from '../validators';
 ┊ 8┊ 9┊
 ┊ 9┊10┊const resolvers: Resolvers = {
 ┊10┊11┊  Date: DateTimeResolver,
```
```diff
@@ -121,6 +122,34 @@
 ┊121┊122┊      return user;
 ┊122┊123┊    },
 ┊123┊124┊
+┊   ┊125┊    signUp(root, { name, username, password, passwordConfirm }) {
+┊   ┊126┊      validateLength('req.name', name, 3, 50);
+┊   ┊127┊      validateLength('req.username', username, 3, 18);
+┊   ┊128┊      validatePassword('req.password', password);
+┊   ┊129┊
+┊   ┊130┊      if (password !== passwordConfirm) {
+┊   ┊131┊        throw Error("req.password and req.passwordConfirm don't match");
+┊   ┊132┊      }
+┊   ┊133┊
+┊   ┊134┊      if (users.some(u => u.username === username)) {
+┊   ┊135┊        throw Error('username already exists');
+┊   ┊136┊      }
+┊   ┊137┊
+┊   ┊138┊      const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(8));
+┊   ┊139┊
+┊   ┊140┊      const user: User = {
+┊   ┊141┊        id: String(users.length + 1),
+┊   ┊142┊        password: passwordHash,
+┊   ┊143┊        picture: '',
+┊   ┊144┊        username,
+┊   ┊145┊        name,
+┊   ┊146┊      };
+┊   ┊147┊
+┊   ┊148┊      users.push(user);
+┊   ┊149┊
+┊   ┊150┊      return user;
+┊   ┊151┊    },
+┊   ┊152┊
 ┊124┊153┊    addMessage(root, { chatId, content }, { currentUser, pubsub }) {
 ┊125┊154┊      if (!currentUser) return null;
 ┊126┊155┊
```

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -35,6 +35,7 @@
 ┊35┊35┊
 ┊36┊36┊type Mutation {
 ┊37┊37┊  signIn(username: String!, password: String!): User
+┊  ┊38┊  signUp(name: String!, username: String!, password: String!, passwordConfirm: String!): User
 ┊38┊39┊  addMessage(chatId: ID!, content: String!): Message
 ┊39┊40┊  addChat(recipientId: ID!): Chat
 ┊40┊41┊  removeChat(chatId: ID!): ID
```

[}]: #

Before encrypting the password we append a string called “salt” to it. Even though the passwords are stored encrypted in the DB, a hacker might use a dictionary of common passwords in their encrypted form to decipher the original password. When adding salt to a password which is essentially a random string, the hacker cannot use a dictionary anymore since he would need to know the salt. Hypothetically, the hacker can get a hold of the salt and re-generate the entire dictionary, however that would take too long because of the way Bcrypt is designed to work.

Going back to the client, we will implement a new `signUp()` method in the `auth.service` that will call the `signUp` mutation:

[{]: <helper> (diffStep 13.5 module="client")

#### [__Client__ Step 13.5: Add signUp() method to auth.service](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/65e9d38630e90396bbddca03b61693b3ee431fc2)

##### Added src&#x2F;graphql&#x2F;mutations&#x2F;signUp.mutation.ts
```diff
@@ -0,0 +1,19 @@
+┊  ┊ 1┊import gql from 'graphql-tag';
+┊  ┊ 2┊
+┊  ┊ 3┊export default gql`
+┊  ┊ 4┊  mutation signUp(
+┊  ┊ 5┊    $name: String!
+┊  ┊ 6┊    $username: String!
+┊  ┊ 7┊    $password: String!
+┊  ┊ 8┊    $passwordConfirm: String!
+┊  ┊ 9┊  ) {
+┊  ┊10┊    signUp(
+┊  ┊11┊      name: $name
+┊  ┊12┊      username: $username
+┊  ┊13┊      password: $password
+┊  ┊14┊      passwordConfirm: $passwordConfirm
+┊  ┊15┊    ) {
+┊  ┊16┊      id
+┊  ┊17┊    }
+┊  ┊18┊  }
+┊  ┊19┊`;
```

##### Changed src&#x2F;services&#x2F;auth.service.tsx
```diff
@@ -2,7 +2,12 @@
 ┊ 2┊ 2┊import { useContext, useCallback } from 'react';
 ┊ 3┊ 3┊import { useApolloClient } from '@apollo/react-hooks';
 ┊ 4┊ 4┊import { Redirect } from 'react-router-dom';
-┊ 5┊  ┊import { useMeQuery, User, useSignInMutation } from '../graphql/types';
+┊  ┊ 5┊import {
+┊  ┊ 6┊  useMeQuery,
+┊  ┊ 7┊  User,
+┊  ┊ 8┊  useSignInMutation,
+┊  ┊ 9┊  useSignUpMutation,
+┊  ┊10┊} from '../graphql/types';
 ┊ 6┊11┊import { useCacheService } from './cache.service';
 ┊ 7┊12┊
 ┊ 8┊13┊const MyContext = React.createContext<User | null>(null);
```
```diff
@@ -47,6 +52,7 @@
 ┊47┊52┊};
 ┊48┊53┊
 ┊49┊54┊export const useSignIn = useSignInMutation;
+┊  ┊55┊export const useSignUp = useSignUpMutation;
 ┊50┊56┊
 ┊51┊57┊export const useSignOut = () => {
 ┊52┊58┊  const client = useApolloClient();
```

[}]: #

Now we will implement a dedicated `SignUpForm` that we can use to perform the sign-up. Instead of implementing a new screen, we will use the `AuthScreen` to alternate between the `SignInForm` and the `SignUpForm` using `AnimatedSwitch`. This way we can have a container component that is common for both forms, and we will be able to switch between the two very smoothly. We will first define a new `/sign-up` route in our router:

[{]: <helper> (diffStep 13.6 module="client")

#### [__Client__ Step 13.6: Split AuthScreen into SignInForm and SignUpForm](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/135ffd4d7a076082740740eb2e3be2e1a56ed888)

##### Added src&#x2F;components&#x2F;AuthScreen&#x2F;SignInForm.test.tsx
```diff
@@ -0,0 +1,161 @@
+┊   ┊  1┊import { createMemoryHistory } from 'history';
+┊   ┊  2┊import React from 'react';
+┊   ┊  3┊import { ApolloProvider } from '@apollo/react-hooks';
+┊   ┊  4┊import {
+┊   ┊  5┊  act,
+┊   ┊  6┊  cleanup,
+┊   ┊  7┊  render,
+┊   ┊  8┊  fireEvent,
+┊   ┊  9┊  waitFor,
+┊   ┊ 10┊} from '@testing-library/react';
+┊   ┊ 11┊import SignInForm from './SignInForm';
+┊   ┊ 12┊import { SignInDocument } from '../../graphql/types';
+┊   ┊ 13┊import { mockApolloClient } from '../../test-helpers';
+┊   ┊ 14┊
+┊   ┊ 15┊describe('SignInForm', () => {
+┊   ┊ 16┊  afterEach(cleanup);
+┊   ┊ 17┊
+┊   ┊ 18┊  it('enables sign-in button when filled in', async () => {
+┊   ┊ 19┊    const history = createMemoryHistory();
+┊   ┊ 20┊    const client = mockApolloClient();
+┊   ┊ 21┊
+┊   ┊ 22┊    let getByTestId: any = null;
+┊   ┊ 23┊
+┊   ┊ 24┊    act(() => {
+┊   ┊ 25┊      getByTestId = render(
+┊   ┊ 26┊        <ApolloProvider client={client}>
+┊   ┊ 27┊          <SignInForm history={history} />
+┊   ┊ 28┊        </ApolloProvider>
+┊   ┊ 29┊      ).getByTestId;
+┊   ┊ 30┊    });
+┊   ┊ 31┊
+┊   ┊ 32┊    const signInButton = await waitFor(
+┊   ┊ 33┊      () => getByTestId('sign-in-button') as HTMLButtonElement
+┊   ┊ 34┊    );
+┊   ┊ 35┊    const usernameInput = await waitFor(() =>
+┊   ┊ 36┊      getByTestId('username-input').querySelector('input')
+┊   ┊ 37┊    );
+┊   ┊ 38┊    const passwordInput = await waitFor(() =>
+┊   ┊ 39┊      getByTestId('password-input').querySelector('input')
+┊   ┊ 40┊    );
+┊   ┊ 41┊
+┊   ┊ 42┊    expect(signInButton.disabled).toEqual(true);
+┊   ┊ 43┊
+┊   ┊ 44┊    act(() => {
+┊   ┊ 45┊      fireEvent.change(usernameInput, { target: { value: 'username' } });
+┊   ┊ 46┊      fireEvent.change(passwordInput, { target: { value: 'password' } });
+┊   ┊ 47┊    });
+┊   ┊ 48┊
+┊   ┊ 49┊    await waitFor(() => expect(signInButton.disabled).toEqual(false));
+┊   ┊ 50┊  });
+┊   ┊ 51┊
+┊   ┊ 52┊  it('prints server error if input was wrong', async () => {
+┊   ┊ 53┊    const history = createMemoryHistory();
+┊   ┊ 54┊
+┊   ┊ 55┊    const client = mockApolloClient([
+┊   ┊ 56┊      {
+┊   ┊ 57┊        request: {
+┊   ┊ 58┊          query: SignInDocument,
+┊   ┊ 59┊          variables: {
+┊   ┊ 60┊            username: 'username',
+┊   ┊ 61┊            password: 'password',
+┊   ┊ 62┊          },
+┊   ┊ 63┊        },
+┊   ┊ 64┊        get result() {
+┊   ┊ 65┊          throw Error('sign-in failed');
+┊   ┊ 66┊        },
+┊   ┊ 67┊      },
+┊   ┊ 68┊    ]);
+┊   ┊ 69┊
+┊   ┊ 70┊    let getByTestId: any = null;
+┊   ┊ 71┊
+┊   ┊ 72┊    act(() => {
+┊   ┊ 73┊      getByTestId = render(
+┊   ┊ 74┊        <ApolloProvider client={client}>
+┊   ┊ 75┊          <SignInForm history={history} />
+┊   ┊ 76┊        </ApolloProvider>
+┊   ┊ 77┊      ).getByTestId;
+┊   ┊ 78┊    });
+┊   ┊ 79┊
+┊   ┊ 80┊    const signInButton = await waitFor(
+┊   ┊ 81┊      () => getByTestId('sign-in-button') as HTMLButtonElement
+┊   ┊ 82┊    );
+┊   ┊ 83┊    const usernameInput = await waitFor(() =>
+┊   ┊ 84┊      getByTestId('username-input').querySelector('input')
+┊   ┊ 85┊    );
+┊   ┊ 86┊    const passwordInput = await waitFor(() =>
+┊   ┊ 87┊      getByTestId('password-input').querySelector('input')
+┊   ┊ 88┊    );
+┊   ┊ 89┊
+┊   ┊ 90┊    act(() => {
+┊   ┊ 91┊      fireEvent.change(usernameInput, { target: { value: 'username' } });
+┊   ┊ 92┊      fireEvent.change(passwordInput, { target: { value: 'password' } });
+┊   ┊ 93┊    });
+┊   ┊ 94┊
+┊   ┊ 95┊    await waitFor(() => expect(usernameInput.value).toEqual('username'));
+┊   ┊ 96┊
+┊   ┊ 97┊    await waitFor(() => expect(passwordInput.value).toEqual('password'));
+┊   ┊ 98┊
+┊   ┊ 99┊    act(() => {
+┊   ┊100┊      fireEvent.click(signInButton);
+┊   ┊101┊    });
+┊   ┊102┊
+┊   ┊103┊    const errorMessage = await waitFor(() => getByTestId('error-message'));
+┊   ┊104┊
+┊   ┊105┊    await waitFor(() =>
+┊   ┊106┊      expect(errorMessage.innerHTML).toContain('sign-in failed')
+┊   ┊107┊    );
+┊   ┊108┊  });
+┊   ┊109┊
+┊   ┊110┊  it('navigates to /chats if everything went right', async () => {
+┊   ┊111┊    const history = createMemoryHistory();
+┊   ┊112┊
+┊   ┊113┊    const client = mockApolloClient([
+┊   ┊114┊      {
+┊   ┊115┊        request: {
+┊   ┊116┊          query: SignInDocument,
+┊   ┊117┊          variables: {
+┊   ┊118┊            username: 'username',
+┊   ┊119┊            password: 'password',
+┊   ┊120┊          },
+┊   ┊121┊        },
+┊   ┊122┊        result: { data: {} },
+┊   ┊123┊      },
+┊   ┊124┊    ]);
+┊   ┊125┊
+┊   ┊126┊    let getByTestId: any = null;
+┊   ┊127┊
+┊   ┊128┊    act(() => {
+┊   ┊129┊      getByTestId = render(
+┊   ┊130┊        <ApolloProvider client={client}>
+┊   ┊131┊          <SignInForm history={history} />
+┊   ┊132┊        </ApolloProvider>
+┊   ┊133┊      ).getByTestId;
+┊   ┊134┊    });
+┊   ┊135┊
+┊   ┊136┊    const usernameInput = await waitFor(() =>
+┊   ┊137┊      getByTestId('username-input').querySelector('input')
+┊   ┊138┊    );
+┊   ┊139┊    const passwordInput = await waitFor(() =>
+┊   ┊140┊      getByTestId('password-input').querySelector('input')
+┊   ┊141┊    );
+┊   ┊142┊    const signInButton = await waitFor(
+┊   ┊143┊      () => getByTestId('sign-in-button') as HTMLButtonElement
+┊   ┊144┊    );
+┊   ┊145┊
+┊   ┊146┊    act(() => {
+┊   ┊147┊      fireEvent.change(usernameInput, { target: { value: 'username' } });
+┊   ┊148┊      fireEvent.change(passwordInput, { target: { value: 'password' } });
+┊   ┊149┊    });
+┊   ┊150┊
+┊   ┊151┊    await waitFor(() => expect(usernameInput.value).toEqual('username'));
+┊   ┊152┊
+┊   ┊153┊    await waitFor(() => expect(passwordInput.value).toEqual('password'));
+┊   ┊154┊
+┊   ┊155┊    act(() => {
+┊   ┊156┊      fireEvent.click(signInButton);
+┊   ┊157┊    });
+┊   ┊158┊
+┊   ┊159┊    await waitFor(() => expect(history.location.pathname).toEqual('/chats'));
+┊   ┊160┊  });
+┊   ┊161┊});
```

##### Added src&#x2F;components&#x2F;AuthScreen&#x2F;SignInForm.tsx
```diff
@@ -0,0 +1,83 @@
+┊  ┊ 1┊import React from 'react';
+┊  ┊ 2┊import { useCallback, useState } from 'react';
+┊  ┊ 3┊import { useSignIn } from '../../services/auth.service';
+┊  ┊ 4┊import {
+┊  ┊ 5┊  SignForm,
+┊  ┊ 6┊  ActualForm,
+┊  ┊ 7┊  Legend,
+┊  ┊ 8┊  Section,
+┊  ┊ 9┊  TextField,
+┊  ┊10┊  Button,
+┊  ┊11┊  ErrorMessage,
+┊  ┊12┊} from './form-components';
+┊  ┊13┊import { RouteComponentProps } from 'react-router-dom';
+┊  ┊14┊
+┊  ┊15┊const SignInForm: React.FC<RouteComponentProps<any>> = ({ history }) => {
+┊  ┊16┊  const [username, setUsername] = useState('');
+┊  ┊17┊  const [password, setPassword] = useState('');
+┊  ┊18┊  const [error, setError] = useState('');
+┊  ┊19┊  const [signIn] = useSignIn();
+┊  ┊20┊
+┊  ┊21┊  const onUsernameChange = useCallback(({ target }) => {
+┊  ┊22┊    setError('');
+┊  ┊23┊    setUsername(target.value);
+┊  ┊24┊  }, []);
+┊  ┊25┊
+┊  ┊26┊  const onPasswordChange = useCallback(({ target }) => {
+┊  ┊27┊    setError('');
+┊  ┊28┊    setPassword(target.value);
+┊  ┊29┊  }, []);
+┊  ┊30┊
+┊  ┊31┊  const maySignIn = useCallback(() => {
+┊  ┊32┊    return !!(username && password);
+┊  ┊33┊  }, [username, password]);
+┊  ┊34┊
+┊  ┊35┊  const handleSignIn = useCallback(() => {
+┊  ┊36┊    signIn({ variables: { username, password } })
+┊  ┊37┊      .then(() => {
+┊  ┊38┊        history.replace('/chats');
+┊  ┊39┊      })
+┊  ┊40┊      .catch((error) => {
+┊  ┊41┊        setError(error.message || error);
+┊  ┊42┊      });
+┊  ┊43┊  }, [username, password, history, signIn]);
+┊  ┊44┊
+┊  ┊45┊  return (
+┊  ┊46┊    <SignForm>
+┊  ┊47┊      <ActualForm>
+┊  ┊48┊        <Legend>Sign in</Legend>
+┊  ┊49┊        <Section style={{ width: '100%' }}>
+┊  ┊50┊          <TextField
+┊  ┊51┊            data-testid="username-input"
+┊  ┊52┊            label="Username"
+┊  ┊53┊            value={username}
+┊  ┊54┊            onChange={onUsernameChange}
+┊  ┊55┊            margin="normal"
+┊  ┊56┊            placeholder="Enter your username"
+┊  ┊57┊          />
+┊  ┊58┊          <TextField
+┊  ┊59┊            data-testid="password-input"
+┊  ┊60┊            label="Password"
+┊  ┊61┊            type="password"
+┊  ┊62┊            value={password}
+┊  ┊63┊            onChange={onPasswordChange}
+┊  ┊64┊            margin="normal"
+┊  ┊65┊            placeholder="Enter your password"
+┊  ┊66┊          />
+┊  ┊67┊        </Section>
+┊  ┊68┊        <Button
+┊  ┊69┊          data-testid="sign-in-button"
+┊  ┊70┊          type="button"
+┊  ┊71┊          color="secondary"
+┊  ┊72┊          variant="contained"
+┊  ┊73┊          disabled={!maySignIn()}
+┊  ┊74┊          onClick={handleSignIn}>
+┊  ┊75┊          Sign in
+┊  ┊76┊        </Button>
+┊  ┊77┊        <ErrorMessage data-testid="error-message">{error}</ErrorMessage>
+┊  ┊78┊      </ActualForm>
+┊  ┊79┊    </SignForm>
+┊  ┊80┊  );
+┊  ┊81┊};
+┊  ┊82┊
+┊  ┊83┊export default SignInForm;
```

##### Added src&#x2F;components&#x2F;AuthScreen&#x2F;SignUpForm.test.tsx
```diff
@@ -0,0 +1,205 @@
+┊   ┊  1┊import { createMemoryHistory } from 'history';
+┊   ┊  2┊import React from 'react';
+┊   ┊  3┊import { ApolloProvider } from '@apollo/react-hooks';
+┊   ┊  4┊import {
+┊   ┊  5┊  act,
+┊   ┊  6┊  cleanup,
+┊   ┊  7┊  render,
+┊   ┊  8┊  fireEvent,
+┊   ┊  9┊  waitFor,
+┊   ┊ 10┊} from '@testing-library/react';
+┊   ┊ 11┊import SignUpForm from './SignUpForm';
+┊   ┊ 12┊import { SignUpDocument } from '../../graphql/types';
+┊   ┊ 13┊import { mockApolloClient } from '../../test-helpers';
+┊   ┊ 14┊
+┊   ┊ 15┊describe('SignUpForm', () => {
+┊   ┊ 16┊  afterEach(cleanup);
+┊   ┊ 17┊
+┊   ┊ 18┊  it('enables sign-up button when filled in', async () => {
+┊   ┊ 19┊    const history = createMemoryHistory();
+┊   ┊ 20┊    const client = mockApolloClient();
+┊   ┊ 21┊
+┊   ┊ 22┊    let getByTestId: any = null;
+┊   ┊ 23┊
+┊   ┊ 24┊    act(() => {
+┊   ┊ 25┊      getByTestId = render(
+┊   ┊ 26┊        <ApolloProvider client={client}>
+┊   ┊ 27┊          <SignUpForm history={history} />
+┊   ┊ 28┊        </ApolloProvider>
+┊   ┊ 29┊      ).getByTestId;
+┊   ┊ 30┊    });
+┊   ┊ 31┊
+┊   ┊ 32┊    const nameInput = await waitFor(() =>
+┊   ┊ 33┊      getByTestId('name-input').querySelector('input')
+┊   ┊ 34┊    );
+┊   ┊ 35┊    const usernameInput = await waitFor(() =>
+┊   ┊ 36┊      getByTestId('username-input').querySelector('input')
+┊   ┊ 37┊    );
+┊   ┊ 38┊    const passwordInput = await waitFor(() =>
+┊   ┊ 39┊      getByTestId('password-input').querySelector('input')
+┊   ┊ 40┊    );
+┊   ┊ 41┊    const passwordConfirmInput = await waitFor(() =>
+┊   ┊ 42┊      getByTestId('password-confirm-input').querySelector('input')
+┊   ┊ 43┊    );
+┊   ┊ 44┊    const signUpButton = await waitFor(
+┊   ┊ 45┊      () => getByTestId('sign-up-button') as HTMLButtonElement
+┊   ┊ 46┊    );
+┊   ┊ 47┊
+┊   ┊ 48┊    expect(signUpButton.disabled).toEqual(true);
+┊   ┊ 49┊
+┊   ┊ 50┊    act(() => {
+┊   ┊ 51┊      fireEvent.change(nameInput, { target: { value: 'User Name' } });
+┊   ┊ 52┊      fireEvent.change(usernameInput, { target: { value: 'username' } });
+┊   ┊ 53┊      fireEvent.change(passwordInput, { target: { value: 'password' } });
+┊   ┊ 54┊      fireEvent.change(passwordConfirmInput, { target: { value: 'password' } });
+┊   ┊ 55┊    });
+┊   ┊ 56┊
+┊   ┊ 57┊    await waitFor(() => expect(nameInput.value).toEqual('User Name'));
+┊   ┊ 58┊
+┊   ┊ 59┊    await waitFor(() => expect(usernameInput.value).toEqual('username'));
+┊   ┊ 60┊
+┊   ┊ 61┊    await waitFor(() => expect(passwordInput.value).toEqual('password'));
+┊   ┊ 62┊
+┊   ┊ 63┊    await waitFor(() => expect(passwordConfirmInput.value).toEqual('password'));
+┊   ┊ 64┊
+┊   ┊ 65┊    await waitFor(() => expect(signUpButton.disabled).toEqual(false));
+┊   ┊ 66┊  });
+┊   ┊ 67┊
+┊   ┊ 68┊  it('prints server error if input was wrong', async () => {
+┊   ┊ 69┊    const history = createMemoryHistory();
+┊   ┊ 70┊
+┊   ┊ 71┊    const client = mockApolloClient([
+┊   ┊ 72┊      {
+┊   ┊ 73┊        request: {
+┊   ┊ 74┊          query: SignUpDocument,
+┊   ┊ 75┊          variables: {
+┊   ┊ 76┊            name: 'User Name',
+┊   ┊ 77┊            username: 'username',
+┊   ┊ 78┊            password: 'password',
+┊   ┊ 79┊            passwordConfirm: 'password',
+┊   ┊ 80┊          },
+┊   ┊ 81┊        },
+┊   ┊ 82┊        get result() {
+┊   ┊ 83┊          throw Error('sign-up failed');
+┊   ┊ 84┊        },
+┊   ┊ 85┊      },
+┊   ┊ 86┊    ]);
+┊   ┊ 87┊
+┊   ┊ 88┊    let getByTestId: any = null;
+┊   ┊ 89┊
+┊   ┊ 90┊    act(() => {
+┊   ┊ 91┊      getByTestId = render(
+┊   ┊ 92┊        <ApolloProvider client={client}>
+┊   ┊ 93┊          <SignUpForm history={history} />
+┊   ┊ 94┊        </ApolloProvider>
+┊   ┊ 95┊      ).getByTestId;
+┊   ┊ 96┊    });
+┊   ┊ 97┊
+┊   ┊ 98┊    const nameInput = await waitFor(() =>
+┊   ┊ 99┊      getByTestId('name-input').querySelector('input')
+┊   ┊100┊    );
+┊   ┊101┊    const usernameInput = await waitFor(() =>
+┊   ┊102┊      getByTestId('username-input').querySelector('input')
+┊   ┊103┊    );
+┊   ┊104┊    const passwordInput = await waitFor(() =>
+┊   ┊105┊      getByTestId('password-input').querySelector('input')
+┊   ┊106┊    );
+┊   ┊107┊    const passwordConfirmInput = await waitFor(() =>
+┊   ┊108┊      getByTestId('password-confirm-input').querySelector('input')
+┊   ┊109┊    );
+┊   ┊110┊    const signUpButton = await waitFor(
+┊   ┊111┊      () => getByTestId('sign-up-button') as HTMLButtonElement
+┊   ┊112┊    );
+┊   ┊113┊
+┊   ┊114┊    act(() => {
+┊   ┊115┊      fireEvent.change(nameInput, { target: { value: 'User Name' } });
+┊   ┊116┊      fireEvent.change(usernameInput, { target: { value: 'username' } });
+┊   ┊117┊      fireEvent.change(passwordInput, { target: { value: 'password' } });
+┊   ┊118┊      fireEvent.change(passwordConfirmInput, { target: { value: 'password' } });
+┊   ┊119┊    });
+┊   ┊120┊
+┊   ┊121┊    await waitFor(() => expect(nameInput.value).toEqual('User Name'));
+┊   ┊122┊
+┊   ┊123┊    await waitFor(() => expect(usernameInput.value).toEqual('username'));
+┊   ┊124┊
+┊   ┊125┊    await waitFor(() => expect(passwordInput.value).toEqual('password'));
+┊   ┊126┊
+┊   ┊127┊    await waitFor(() => expect(passwordConfirmInput.value).toEqual('password'));
+┊   ┊128┊
+┊   ┊129┊    act(() => {
+┊   ┊130┊      fireEvent.click(signUpButton);
+┊   ┊131┊    });
+┊   ┊132┊
+┊   ┊133┊    const errorMessage = await waitFor(() => getByTestId('error-message'));
+┊   ┊134┊
+┊   ┊135┊    await waitFor(() =>
+┊   ┊136┊      expect(errorMessage.innerHTML).toContain('sign-up failed')
+┊   ┊137┊    );
+┊   ┊138┊  });
+┊   ┊139┊
+┊   ┊140┊  it('navigates to /sign-in if everything went right', async () => {
+┊   ┊141┊    const history = createMemoryHistory();
+┊   ┊142┊
+┊   ┊143┊    const client = mockApolloClient([
+┊   ┊144┊      {
+┊   ┊145┊        request: {
+┊   ┊146┊          query: SignUpDocument,
+┊   ┊147┊          variables: {
+┊   ┊148┊            name: 'User Name',
+┊   ┊149┊            username: 'username',
+┊   ┊150┊            password: 'password',
+┊   ┊151┊            passwordConfirm: 'password',
+┊   ┊152┊          },
+┊   ┊153┊        },
+┊   ┊154┊        result: { data: {} },
+┊   ┊155┊      },
+┊   ┊156┊    ]);
+┊   ┊157┊
+┊   ┊158┊    let getByTestId: any = null;
+┊   ┊159┊
+┊   ┊160┊    act(() => {
+┊   ┊161┊      getByTestId = render(
+┊   ┊162┊        <ApolloProvider client={client}>
+┊   ┊163┊          <SignUpForm history={history} />
+┊   ┊164┊        </ApolloProvider>
+┊   ┊165┊      ).getByTestId;
+┊   ┊166┊    });
+┊   ┊167┊
+┊   ┊168┊    const nameInput = await waitFor(() =>
+┊   ┊169┊      getByTestId('name-input').querySelector('input')
+┊   ┊170┊    );
+┊   ┊171┊    const usernameInput = await waitFor(() =>
+┊   ┊172┊      getByTestId('username-input').querySelector('input')
+┊   ┊173┊    );
+┊   ┊174┊    const passwordInput = await waitFor(() =>
+┊   ┊175┊      getByTestId('password-input').querySelector('input')
+┊   ┊176┊    );
+┊   ┊177┊    const passwordConfirmInput = await waitFor(() =>
+┊   ┊178┊      getByTestId('password-confirm-input').querySelector('input')
+┊   ┊179┊    );
+┊   ┊180┊    const signUpButton = await waitFor(
+┊   ┊181┊      () => getByTestId('sign-up-button') as HTMLButtonElement
+┊   ┊182┊    );
+┊   ┊183┊
+┊   ┊184┊    act(() => {
+┊   ┊185┊      fireEvent.change(nameInput, { target: { value: 'User Name' } });
+┊   ┊186┊      fireEvent.change(usernameInput, { target: { value: 'username' } });
+┊   ┊187┊      fireEvent.change(passwordInput, { target: { value: 'password' } });
+┊   ┊188┊      fireEvent.change(passwordConfirmInput, { target: { value: 'password' } });
+┊   ┊189┊    });
+┊   ┊190┊
+┊   ┊191┊    await waitFor(() => expect(nameInput.value).toEqual('User Name'));
+┊   ┊192┊
+┊   ┊193┊    await waitFor(() => expect(usernameInput.value).toEqual('username'));
+┊   ┊194┊
+┊   ┊195┊    await waitFor(() => expect(passwordInput.value).toEqual('password'));
+┊   ┊196┊
+┊   ┊197┊    await waitFor(() => expect(passwordConfirmInput.value).toEqual('password'));
+┊   ┊198┊
+┊   ┊199┊    act(() => {
+┊   ┊200┊      fireEvent.click(signUpButton);
+┊   ┊201┊    });
+┊   ┊202┊
+┊   ┊203┊    await waitFor(() => expect(history.location.pathname).toEqual('/sign-in'));
+┊   ┊204┊  });
+┊   ┊205┊});
```

##### Added src&#x2F;components&#x2F;AuthScreen&#x2F;SignUpForm.tsx
```diff
@@ -0,0 +1,124 @@
+┊   ┊  1┊import React from 'react';
+┊   ┊  2┊import { useCallback, useState } from 'react';
+┊   ┊  3┊import { useSignUp } from '../../services/auth.service';
+┊   ┊  4┊import {
+┊   ┊  5┊  SignForm,
+┊   ┊  6┊  ActualForm,
+┊   ┊  7┊  Legend,
+┊   ┊  8┊  Section,
+┊   ┊  9┊  TextField,
+┊   ┊ 10┊  Button,
+┊   ┊ 11┊  ErrorMessage,
+┊   ┊ 12┊} from './form-components';
+┊   ┊ 13┊import { RouteComponentProps } from 'react-router-dom';
+┊   ┊ 14┊
+┊   ┊ 15┊const SignUpForm: React.FC<RouteComponentProps<any>> = ({ history }) => {
+┊   ┊ 16┊  const [name, setName] = useState('');
+┊   ┊ 17┊  const [username, setUsername] = useState('');
+┊   ┊ 18┊  const [password, setPassword] = useState('');
+┊   ┊ 19┊  const [passwordConfirm, setPasswordConfirm] = useState('');
+┊   ┊ 20┊  const [error, setError] = useState('');
+┊   ┊ 21┊  const [signUp] = useSignUp();
+┊   ┊ 22┊
+┊   ┊ 23┊  const updateName = useCallback(({ target }) => {
+┊   ┊ 24┊    setError('');
+┊   ┊ 25┊    setName(target.value);
+┊   ┊ 26┊  }, []);
+┊   ┊ 27┊
+┊   ┊ 28┊  const updateUsername = useCallback(({ target }) => {
+┊   ┊ 29┊    setError('');
+┊   ┊ 30┊    setUsername(target.value);
+┊   ┊ 31┊  }, []);
+┊   ┊ 32┊
+┊   ┊ 33┊  const updatePassword = useCallback(({ target }) => {
+┊   ┊ 34┊    setError('');
+┊   ┊ 35┊    setPassword(target.value);
+┊   ┊ 36┊  }, []);
+┊   ┊ 37┊
+┊   ┊ 38┊  const updatePasswordConfirm = useCallback(({ target }) => {
+┊   ┊ 39┊    setError('');
+┊   ┊ 40┊    setPasswordConfirm(target.value);
+┊   ┊ 41┊  }, []);
+┊   ┊ 42┊
+┊   ┊ 43┊  const maySignUp = useCallback(() => {
+┊   ┊ 44┊    return !!(name && username && password && password === passwordConfirm);
+┊   ┊ 45┊  }, [name, username, password, passwordConfirm]);
+┊   ┊ 46┊
+┊   ┊ 47┊  const handleSignUp = useCallback(() => {
+┊   ┊ 48┊    signUp({ variables: { username, password, passwordConfirm, name } })
+┊   ┊ 49┊      .then(() => {
+┊   ┊ 50┊        history.replace('/sign-in');
+┊   ┊ 51┊      })
+┊   ┊ 52┊      .catch((error) => {
+┊   ┊ 53┊        setError(error.message || error);
+┊   ┊ 54┊      });
+┊   ┊ 55┊  }, [name, username, password, passwordConfirm, history, signUp]);
+┊   ┊ 56┊
+┊   ┊ 57┊  return (
+┊   ┊ 58┊    <SignForm>
+┊   ┊ 59┊      <ActualForm>
+┊   ┊ 60┊        <Legend>Sign up</Legend>
+┊   ┊ 61┊        <Section
+┊   ┊ 62┊          style={{
+┊   ┊ 63┊            float: 'left',
+┊   ┊ 64┊            width: 'calc(50% - 10px)',
+┊   ┊ 65┊            paddingRight: '10px',
+┊   ┊ 66┊          }}>
+┊   ┊ 67┊          <TextField
+┊   ┊ 68┊            data-testid="name-input"
+┊   ┊ 69┊            label="Name"
+┊   ┊ 70┊            value={name}
+┊   ┊ 71┊            onChange={updateName}
+┊   ┊ 72┊            autoComplete="off"
+┊   ┊ 73┊            margin="normal"
+┊   ┊ 74┊          />
+┊   ┊ 75┊          <TextField
+┊   ┊ 76┊            data-testid="username-input"
+┊   ┊ 77┊            label="Username"
+┊   ┊ 78┊            value={username}
+┊   ┊ 79┊            onChange={updateUsername}
+┊   ┊ 80┊            autoComplete="off"
+┊   ┊ 81┊            margin="normal"
+┊   ┊ 82┊          />
+┊   ┊ 83┊        </Section>
+┊   ┊ 84┊        <Section
+┊   ┊ 85┊          style={{
+┊   ┊ 86┊            float: 'right',
+┊   ┊ 87┊            width: 'calc(50% - 10px)',
+┊   ┊ 88┊            paddingLeft: '10px',
+┊   ┊ 89┊          }}>
+┊   ┊ 90┊          <TextField
+┊   ┊ 91┊            data-testid="password-input"
+┊   ┊ 92┊            label="Password"
+┊   ┊ 93┊            type="password"
+┊   ┊ 94┊            value={password}
+┊   ┊ 95┊            onChange={updatePassword}
+┊   ┊ 96┊            autoComplete="off"
+┊   ┊ 97┊            margin="normal"
+┊   ┊ 98┊          />
+┊   ┊ 99┊          <TextField
+┊   ┊100┊            data-testid="password-confirm-input"
+┊   ┊101┊            label="Confirm password"
+┊   ┊102┊            type="password"
+┊   ┊103┊            value={passwordConfirm}
+┊   ┊104┊            onChange={updatePasswordConfirm}
+┊   ┊105┊            autoComplete="off"
+┊   ┊106┊            margin="normal"
+┊   ┊107┊          />
+┊   ┊108┊        </Section>
+┊   ┊109┊        <Button
+┊   ┊110┊          data-testid="sign-up-button"
+┊   ┊111┊          type="button"
+┊   ┊112┊          color="secondary"
+┊   ┊113┊          variant="contained"
+┊   ┊114┊          disabled={!maySignUp()}
+┊   ┊115┊          onClick={handleSignUp}>
+┊   ┊116┊          Sign up
+┊   ┊117┊        </Button>
+┊   ┊118┊        <ErrorMessage data-testid="error-message">{error}</ErrorMessage>
+┊   ┊119┊      </ActualForm>
+┊   ┊120┊    </SignForm>
+┊   ┊121┊  );
+┊   ┊122┊};
+┊   ┊123┊
+┊   ┊124┊export default SignUpForm;
```

##### Added src&#x2F;components&#x2F;AuthScreen&#x2F;form-components.ts
```diff
@@ -0,0 +1,75 @@
+┊  ┊ 1┊import MaterialButton from '@material-ui/core/Button';
+┊  ┊ 2┊import MaterialTextField from '@material-ui/core/TextField';
+┊  ┊ 3┊import styled from 'styled-components';
+┊  ┊ 4┊
+┊  ┊ 5┊export const SignForm = styled.div`
+┊  ┊ 6┊  height: calc(100% - 265px);
+┊  ┊ 7┊`;
+┊  ┊ 8┊
+┊  ┊ 9┊export const ActualForm = styled.form`
+┊  ┊10┊  padding: 20px;
+┊  ┊11┊`;
+┊  ┊12┊
+┊  ┊13┊export const Section = styled.div`
+┊  ┊14┊  padding-bottom: 35px;
+┊  ┊15┊`;
+┊  ┊16┊
+┊  ┊17┊export const Legend = styled.legend`
+┊  ┊18┊  font-weight: bold;
+┊  ┊19┊  color: white;
+┊  ┊20┊`;
+┊  ┊21┊
+┊  ┊22┊export const Label = styled.label`
+┊  ┊23┊  color: white !important;
+┊  ┊24┊`;
+┊  ┊25┊
+┊  ┊26┊export const Input = styled.input`
+┊  ┊27┊  color: white;
+┊  ┊28┊
+┊  ┊29┊  &::placeholder {
+┊  ┊30┊    color: var(--primary-bg);
+┊  ┊31┊  }
+┊  ┊32┊`;
+┊  ┊33┊
+┊  ┊34┊export const TextField = styled(MaterialTextField)`
+┊  ┊35┊  width: 100%;
+┊  ┊36┊  position: relative;
+┊  ┊37┊
+┊  ┊38┊  > div::before {
+┊  ┊39┊    border-color: white !important;
+┊  ┊40┊  }
+┊  ┊41┊
+┊  ┊42┊  input {
+┊  ┊43┊    color: white !important;
+┊  ┊44┊
+┊  ┊45┊    &::placeholder {
+┊  ┊46┊      color: var(--primary-bg) !important;
+┊  ┊47┊    }
+┊  ┊48┊  }
+┊  ┊49┊
+┊  ┊50┊  label {
+┊  ┊51┊    color: white !important;
+┊  ┊52┊  }
+┊  ┊53┊`;
+┊  ┊54┊
+┊  ┊55┊export const Button = styled(MaterialButton)`
+┊  ┊56┊  width: 100px;
+┊  ┊57┊  display: block !important;
+┊  ┊58┊  margin: auto !important;
+┊  ┊59┊  background-color: var(--secondary-bg) !important;
+┊  ┊60┊
+┊  ┊61┊  &[disabled] {
+┊  ┊62┊    color: #38a81c;
+┊  ┊63┊  }
+┊  ┊64┊
+┊  ┊65┊  &:not([disabled]) {
+┊  ┊66┊    color: white;
+┊  ┊67┊  }
+┊  ┊68┊`;
+┊  ┊69┊
+┊  ┊70┊export const ErrorMessage = styled.div`
+┊  ┊71┊  position: fixed;
+┊  ┊72┊  color: red;
+┊  ┊73┊  font-size: 15px;
+┊  ┊74┊  margin-top: 20px;
+┊  ┊75┊`;
```

##### Changed src&#x2F;components&#x2F;AuthScreen&#x2F;index.tsx
```diff
@@ -1,13 +1,13 @@
-┊ 1┊  ┊import MaterialButton from '@material-ui/core/Button';
-┊ 2┊  ┊import MaterialTextField from '@material-ui/core/TextField';
 ┊ 3┊ 1┊import React from 'react';
-┊ 4┊  ┊import { useCallback, useState } from 'react';
+┊  ┊ 2┊import { useMemo } from 'react';
+┊  ┊ 3┊import { Route } from 'react-router-dom';
 ┊ 5┊ 4┊import styled from 'styled-components';
-┊ 6┊  ┊import { useSignIn } from '../../services/auth.service';
+┊  ┊ 5┊import AnimatedSwitch from '../AnimatedSwitch';
+┊  ┊ 6┊import SignInForm from './SignInForm';
+┊  ┊ 7┊import SignUpForm from './SignUpForm';
 ┊ 7┊ 8┊import { RouteComponentProps } from 'react-router-dom';
 ┊ 8┊ 9┊
 ┊ 9┊10┊const Container = styled.div`
-┊10┊  ┊  height: 100%;
 ┊11┊11┊  background: radial-gradient(rgb(34, 65, 67), rgb(17, 48, 50)),
 ┊12┊12┊    url(/assets/chat-background.jpg) no-repeat;
 ┊13┊13┊  background-size: cover;
```
```diff
@@ -40,149 +40,51 @@
 ┊ 40┊ 40┊  bottom: 10px;
 ┊ 41┊ 41┊  left: 10px;
 ┊ 42┊ 42┊
-┊ 43┊   ┊  a {
+┊   ┊ 43┊  label {
 ┊ 44┊ 44┊    color: var(--secondary-bg);
 ┊ 45┊ 45┊  }
 ┊ 46┊ 46┊`;
 ┊ 47┊ 47┊
-┊ 48┊   ┊const SignInForm = styled.div`
-┊ 49┊   ┊  height: calc(100% - 265px);
-┊ 50┊   ┊`;
-┊ 51┊   ┊
-┊ 52┊   ┊const ActualForm = styled.form`
-┊ 53┊   ┊  padding: 20px;
-┊ 54┊   ┊`;
-┊ 55┊   ┊
-┊ 56┊   ┊const Section = styled.div`
-┊ 57┊   ┊  width: 100%;
-┊ 58┊   ┊  padding-bottom: 35px;
-┊ 59┊   ┊`;
-┊ 60┊   ┊
-┊ 61┊   ┊const Legend = styled.legend`
-┊ 62┊   ┊  font-weight: bold;
-┊ 63┊   ┊  color: white;
-┊ 64┊   ┊`;
-┊ 65┊   ┊
-┊ 66┊   ┊// eslint-disable-next-line
-┊ 67┊   ┊const Label = styled.label`
-┊ 68┊   ┊  color: white !important;
-┊ 69┊   ┊`;
-┊ 70┊   ┊
-┊ 71┊   ┊// eslint-disable-next-line
-┊ 72┊   ┊const Input = styled.input`
-┊ 73┊   ┊  color: white;
-┊ 74┊   ┊
-┊ 75┊   ┊  &::placeholder {
-┊ 76┊   ┊    color: var(--primary-bg);
-┊ 77┊   ┊  }
-┊ 78┊   ┊`;
-┊ 79┊   ┊
-┊ 80┊   ┊const TextField = styled(MaterialTextField)`
-┊ 81┊   ┊  width: 100%;
-┊ 82┊   ┊  position: relative;
-┊ 83┊   ┊
-┊ 84┊   ┊  > div::before {
-┊ 85┊   ┊    border-color: white !important;
-┊ 86┊   ┊  }
-┊ 87┊   ┊
-┊ 88┊   ┊  input {
-┊ 89┊   ┊    color: white !important;
-┊ 90┊   ┊
-┊ 91┊   ┊    &::placeholder {
-┊ 92┊   ┊      color: var(--primary-bg) !important;
+┊   ┊ 48┊const AuthScreen: React.FC<RouteComponentProps<any>> = ({
+┊   ┊ 49┊  history,
+┊   ┊ 50┊  location,
+┊   ┊ 51┊}) => {
+┊   ┊ 52┊  const alternative = useMemo(() => {
+┊   ┊ 53┊    if (location.pathname === '/sign-in') {
+┊   ┊ 54┊      const handleSignUp = () => {
+┊   ┊ 55┊        history.replace('/sign-up');
+┊   ┊ 56┊      };
+┊   ┊ 57┊
+┊   ┊ 58┊      return (
+┊   ┊ 59┊        <Alternative>
+┊   ┊ 60┊          Don't have an account yet?{' '}
+┊   ┊ 61┊          <label onClick={handleSignUp}>Sign up!</label>
+┊   ┊ 62┊        </Alternative>
+┊   ┊ 63┊      );
+┊   ┊ 64┊    } else {
+┊   ┊ 65┊      const handleSignIn = () => {
+┊   ┊ 66┊        history.replace('/sign-in');
+┊   ┊ 67┊      };
+┊   ┊ 68┊
+┊   ┊ 69┊      return (
+┊   ┊ 70┊        <Alternative>
+┊   ┊ 71┊          Already have an accout? <label onClick={handleSignIn}>Sign in!</label>
+┊   ┊ 72┊        </Alternative>
+┊   ┊ 73┊      );
 ┊ 93┊ 74┊    }
-┊ 94┊   ┊  }
-┊ 95┊   ┊
-┊ 96┊   ┊  label {
-┊ 97┊   ┊    color: white !important;
-┊ 98┊   ┊  }
-┊ 99┊   ┊`;
-┊100┊   ┊
-┊101┊   ┊const Button = styled(MaterialButton)`
-┊102┊   ┊  width: 100px;
-┊103┊   ┊  display: block !important;
-┊104┊   ┊  margin: auto !important;
-┊105┊   ┊  background-color: var(--secondary-bg) !important;
-┊106┊   ┊
-┊107┊   ┊  &[disabled] {
-┊108┊   ┊    color: #38a81c;
-┊109┊   ┊  }
-┊110┊   ┊
-┊111┊   ┊  &:not([disabled]) {
-┊112┊   ┊    color: white;
-┊113┊   ┊  }
-┊114┊   ┊`;
-┊115┊   ┊
-┊116┊   ┊const AuthScreen: React.FC<RouteComponentProps<any>> = ({ history }) => {
-┊117┊   ┊  const [username, setUsername] = useState('');
-┊118┊   ┊  const [password, setPassword] = useState('');
-┊119┊   ┊  // eslint-disable-next-line
-┊120┊   ┊  const [error, setError] = useState('');
-┊121┊   ┊  const [signIn] = useSignIn();
-┊122┊   ┊
-┊123┊   ┊  const onUsernameChange = useCallback(({ target }) => {
-┊124┊   ┊    setError('');
-┊125┊   ┊    setUsername(target.value);
-┊126┊   ┊  }, []);
-┊127┊   ┊
-┊128┊   ┊  const onPasswordChange = useCallback(({ target }) => {
-┊129┊   ┊    setError('');
-┊130┊   ┊    setPassword(target.value);
-┊131┊   ┊  }, []);
-┊132┊   ┊
-┊133┊   ┊  const maySignIn = useCallback(() => {
-┊134┊   ┊    return !!(username && password);
-┊135┊   ┊  }, [username, password]);
-┊136┊   ┊
-┊137┊   ┊  const handleSignIn = useCallback(() => {
-┊138┊   ┊    signIn({ variables: { username, password } })
-┊139┊   ┊      .then(() => {
-┊140┊   ┊        history.push('/chats');
-┊141┊   ┊      })
-┊142┊   ┊      .catch((error) => {
-┊143┊   ┊        setError(error.message || error);
-┊144┊   ┊      });
-┊145┊   ┊  }, [username, password, history, signIn]);
+┊   ┊ 75┊  }, [location.pathname, history]);
 ┊146┊ 76┊
 ┊147┊ 77┊  return (
-┊148┊   ┊    <Container>
-┊149┊   ┊      <Intro>
+┊   ┊ 78┊    <Container className="AuthScreen Screen">
+┊   ┊ 79┊      <Intro className="AuthScreen-intro">
 ┊150┊ 80┊        <Icon src="assets/whatsapp-icon.png" className="AuthScreen-icon" />
 ┊151┊ 81┊        <Title className="AuthScreen-title">WhatsApp</Title>
 ┊152┊ 82┊      </Intro>
-┊153┊   ┊      <SignInForm>
-┊154┊   ┊        <ActualForm>
-┊155┊   ┊          <Legend>Sign in</Legend>
-┊156┊   ┊          <Section>
-┊157┊   ┊            <TextField
-┊158┊   ┊              className="AuthScreen-text-field"
-┊159┊   ┊              label="Username"
-┊160┊   ┊              value={username}
-┊161┊   ┊              onChange={onUsernameChange}
-┊162┊   ┊              margin="normal"
-┊163┊   ┊              placeholder="Enter your username"
-┊164┊   ┊            />
-┊165┊   ┊            <TextField
-┊166┊   ┊              className="AuthScreen-text-field"
-┊167┊   ┊              label="Password"
-┊168┊   ┊              type="password"
-┊169┊   ┊              value={password}
-┊170┊   ┊              onChange={onPasswordChange}
-┊171┊   ┊              margin="normal"
-┊172┊   ┊              placeholder="Enter your password"
-┊173┊   ┊            />
-┊174┊   ┊          </Section>
-┊175┊   ┊          <Button
-┊176┊   ┊            data-testid="sign-in-button"
-┊177┊   ┊            type="button"
-┊178┊   ┊            color="secondary"
-┊179┊   ┊            variant="contained"
-┊180┊   ┊            disabled={!maySignIn()}
-┊181┊   ┊            onClick={handleSignIn}>
-┊182┊   ┊            Sign in
-┊183┊   ┊          </Button>
-┊184┊   ┊        </ActualForm>
-┊185┊   ┊      </SignInForm>
+┊   ┊ 83┊      <AnimatedSwitch>
+┊   ┊ 84┊        <Route exact path="/sign-in" component={SignInForm} />
+┊   ┊ 85┊        <Route exact path="/sign-up" component={SignUpForm} />
+┊   ┊ 86┊      </AnimatedSwitch>
+┊   ┊ 87┊      {alternative}
 ┊186┊ 88┊    </Container>
 ┊187┊ 89┊  );
 ┊188┊ 90┊};
```

[}]: #

And then we will make the necessary changes in the `AuthScreen`:

[{]: <helper> (diffStep 13.6 module="client")

#### [__Client__ Step 13.6: Split AuthScreen into SignInForm and SignUpForm](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/135ffd4d7a076082740740eb2e3be2e1a56ed888)

##### Added src&#x2F;components&#x2F;AuthScreen&#x2F;SignInForm.test.tsx
```diff
@@ -0,0 +1,161 @@
+┊   ┊  1┊import { createMemoryHistory } from 'history';
+┊   ┊  2┊import React from 'react';
+┊   ┊  3┊import { ApolloProvider } from '@apollo/react-hooks';
+┊   ┊  4┊import {
+┊   ┊  5┊  act,
+┊   ┊  6┊  cleanup,
+┊   ┊  7┊  render,
+┊   ┊  8┊  fireEvent,
+┊   ┊  9┊  waitFor,
+┊   ┊ 10┊} from '@testing-library/react';
+┊   ┊ 11┊import SignInForm from './SignInForm';
+┊   ┊ 12┊import { SignInDocument } from '../../graphql/types';
+┊   ┊ 13┊import { mockApolloClient } from '../../test-helpers';
+┊   ┊ 14┊
+┊   ┊ 15┊describe('SignInForm', () => {
+┊   ┊ 16┊  afterEach(cleanup);
+┊   ┊ 17┊
+┊   ┊ 18┊  it('enables sign-in button when filled in', async () => {
+┊   ┊ 19┊    const history = createMemoryHistory();
+┊   ┊ 20┊    const client = mockApolloClient();
+┊   ┊ 21┊
+┊   ┊ 22┊    let getByTestId: any = null;
+┊   ┊ 23┊
+┊   ┊ 24┊    act(() => {
+┊   ┊ 25┊      getByTestId = render(
+┊   ┊ 26┊        <ApolloProvider client={client}>
+┊   ┊ 27┊          <SignInForm history={history} />
+┊   ┊ 28┊        </ApolloProvider>
+┊   ┊ 29┊      ).getByTestId;
+┊   ┊ 30┊    });
+┊   ┊ 31┊
+┊   ┊ 32┊    const signInButton = await waitFor(
+┊   ┊ 33┊      () => getByTestId('sign-in-button') as HTMLButtonElement
+┊   ┊ 34┊    );
+┊   ┊ 35┊    const usernameInput = await waitFor(() =>
+┊   ┊ 36┊      getByTestId('username-input').querySelector('input')
+┊   ┊ 37┊    );
+┊   ┊ 38┊    const passwordInput = await waitFor(() =>
+┊   ┊ 39┊      getByTestId('password-input').querySelector('input')
+┊   ┊ 40┊    );
+┊   ┊ 41┊
+┊   ┊ 42┊    expect(signInButton.disabled).toEqual(true);
+┊   ┊ 43┊
+┊   ┊ 44┊    act(() => {
+┊   ┊ 45┊      fireEvent.change(usernameInput, { target: { value: 'username' } });
+┊   ┊ 46┊      fireEvent.change(passwordInput, { target: { value: 'password' } });
+┊   ┊ 47┊    });
+┊   ┊ 48┊
+┊   ┊ 49┊    await waitFor(() => expect(signInButton.disabled).toEqual(false));
+┊   ┊ 50┊  });
+┊   ┊ 51┊
+┊   ┊ 52┊  it('prints server error if input was wrong', async () => {
+┊   ┊ 53┊    const history = createMemoryHistory();
+┊   ┊ 54┊
+┊   ┊ 55┊    const client = mockApolloClient([
+┊   ┊ 56┊      {
+┊   ┊ 57┊        request: {
+┊   ┊ 58┊          query: SignInDocument,
+┊   ┊ 59┊          variables: {
+┊   ┊ 60┊            username: 'username',
+┊   ┊ 61┊            password: 'password',
+┊   ┊ 62┊          },
+┊   ┊ 63┊        },
+┊   ┊ 64┊        get result() {
+┊   ┊ 65┊          throw Error('sign-in failed');
+┊   ┊ 66┊        },
+┊   ┊ 67┊      },
+┊   ┊ 68┊    ]);
+┊   ┊ 69┊
+┊   ┊ 70┊    let getByTestId: any = null;
+┊   ┊ 71┊
+┊   ┊ 72┊    act(() => {
+┊   ┊ 73┊      getByTestId = render(
+┊   ┊ 74┊        <ApolloProvider client={client}>
+┊   ┊ 75┊          <SignInForm history={history} />
+┊   ┊ 76┊        </ApolloProvider>
+┊   ┊ 77┊      ).getByTestId;
+┊   ┊ 78┊    });
+┊   ┊ 79┊
+┊   ┊ 80┊    const signInButton = await waitFor(
+┊   ┊ 81┊      () => getByTestId('sign-in-button') as HTMLButtonElement
+┊   ┊ 82┊    );
+┊   ┊ 83┊    const usernameInput = await waitFor(() =>
+┊   ┊ 84┊      getByTestId('username-input').querySelector('input')
+┊   ┊ 85┊    );
+┊   ┊ 86┊    const passwordInput = await waitFor(() =>
+┊   ┊ 87┊      getByTestId('password-input').querySelector('input')
+┊   ┊ 88┊    );
+┊   ┊ 89┊
+┊   ┊ 90┊    act(() => {
+┊   ┊ 91┊      fireEvent.change(usernameInput, { target: { value: 'username' } });
+┊   ┊ 92┊      fireEvent.change(passwordInput, { target: { value: 'password' } });
+┊   ┊ 93┊    });
+┊   ┊ 94┊
+┊   ┊ 95┊    await waitFor(() => expect(usernameInput.value).toEqual('username'));
+┊   ┊ 96┊
+┊   ┊ 97┊    await waitFor(() => expect(passwordInput.value).toEqual('password'));
+┊   ┊ 98┊
+┊   ┊ 99┊    act(() => {
+┊   ┊100┊      fireEvent.click(signInButton);
+┊   ┊101┊    });
+┊   ┊102┊
+┊   ┊103┊    const errorMessage = await waitFor(() => getByTestId('error-message'));
+┊   ┊104┊
+┊   ┊105┊    await waitFor(() =>
+┊   ┊106┊      expect(errorMessage.innerHTML).toContain('sign-in failed')
+┊   ┊107┊    );
+┊   ┊108┊  });
+┊   ┊109┊
+┊   ┊110┊  it('navigates to /chats if everything went right', async () => {
+┊   ┊111┊    const history = createMemoryHistory();
+┊   ┊112┊
+┊   ┊113┊    const client = mockApolloClient([
+┊   ┊114┊      {
+┊   ┊115┊        request: {
+┊   ┊116┊          query: SignInDocument,
+┊   ┊117┊          variables: {
+┊   ┊118┊            username: 'username',
+┊   ┊119┊            password: 'password',
+┊   ┊120┊          },
+┊   ┊121┊        },
+┊   ┊122┊        result: { data: {} },
+┊   ┊123┊      },
+┊   ┊124┊    ]);
+┊   ┊125┊
+┊   ┊126┊    let getByTestId: any = null;
+┊   ┊127┊
+┊   ┊128┊    act(() => {
+┊   ┊129┊      getByTestId = render(
+┊   ┊130┊        <ApolloProvider client={client}>
+┊   ┊131┊          <SignInForm history={history} />
+┊   ┊132┊        </ApolloProvider>
+┊   ┊133┊      ).getByTestId;
+┊   ┊134┊    });
+┊   ┊135┊
+┊   ┊136┊    const usernameInput = await waitFor(() =>
+┊   ┊137┊      getByTestId('username-input').querySelector('input')
+┊   ┊138┊    );
+┊   ┊139┊    const passwordInput = await waitFor(() =>
+┊   ┊140┊      getByTestId('password-input').querySelector('input')
+┊   ┊141┊    );
+┊   ┊142┊    const signInButton = await waitFor(
+┊   ┊143┊      () => getByTestId('sign-in-button') as HTMLButtonElement
+┊   ┊144┊    );
+┊   ┊145┊
+┊   ┊146┊    act(() => {
+┊   ┊147┊      fireEvent.change(usernameInput, { target: { value: 'username' } });
+┊   ┊148┊      fireEvent.change(passwordInput, { target: { value: 'password' } });
+┊   ┊149┊    });
+┊   ┊150┊
+┊   ┊151┊    await waitFor(() => expect(usernameInput.value).toEqual('username'));
+┊   ┊152┊
+┊   ┊153┊    await waitFor(() => expect(passwordInput.value).toEqual('password'));
+┊   ┊154┊
+┊   ┊155┊    act(() => {
+┊   ┊156┊      fireEvent.click(signInButton);
+┊   ┊157┊    });
+┊   ┊158┊
+┊   ┊159┊    await waitFor(() => expect(history.location.pathname).toEqual('/chats'));
+┊   ┊160┊  });
+┊   ┊161┊});
```

##### Added src&#x2F;components&#x2F;AuthScreen&#x2F;SignInForm.tsx
```diff
@@ -0,0 +1,83 @@
+┊  ┊ 1┊import React from 'react';
+┊  ┊ 2┊import { useCallback, useState } from 'react';
+┊  ┊ 3┊import { useSignIn } from '../../services/auth.service';
+┊  ┊ 4┊import {
+┊  ┊ 5┊  SignForm,
+┊  ┊ 6┊  ActualForm,
+┊  ┊ 7┊  Legend,
+┊  ┊ 8┊  Section,
+┊  ┊ 9┊  TextField,
+┊  ┊10┊  Button,
+┊  ┊11┊  ErrorMessage,
+┊  ┊12┊} from './form-components';
+┊  ┊13┊import { RouteComponentProps } from 'react-router-dom';
+┊  ┊14┊
+┊  ┊15┊const SignInForm: React.FC<RouteComponentProps<any>> = ({ history }) => {
+┊  ┊16┊  const [username, setUsername] = useState('');
+┊  ┊17┊  const [password, setPassword] = useState('');
+┊  ┊18┊  const [error, setError] = useState('');
+┊  ┊19┊  const [signIn] = useSignIn();
+┊  ┊20┊
+┊  ┊21┊  const onUsernameChange = useCallback(({ target }) => {
+┊  ┊22┊    setError('');
+┊  ┊23┊    setUsername(target.value);
+┊  ┊24┊  }, []);
+┊  ┊25┊
+┊  ┊26┊  const onPasswordChange = useCallback(({ target }) => {
+┊  ┊27┊    setError('');
+┊  ┊28┊    setPassword(target.value);
+┊  ┊29┊  }, []);
+┊  ┊30┊
+┊  ┊31┊  const maySignIn = useCallback(() => {
+┊  ┊32┊    return !!(username && password);
+┊  ┊33┊  }, [username, password]);
+┊  ┊34┊
+┊  ┊35┊  const handleSignIn = useCallback(() => {
+┊  ┊36┊    signIn({ variables: { username, password } })
+┊  ┊37┊      .then(() => {
+┊  ┊38┊        history.replace('/chats');
+┊  ┊39┊      })
+┊  ┊40┊      .catch((error) => {
+┊  ┊41┊        setError(error.message || error);
+┊  ┊42┊      });
+┊  ┊43┊  }, [username, password, history, signIn]);
+┊  ┊44┊
+┊  ┊45┊  return (
+┊  ┊46┊    <SignForm>
+┊  ┊47┊      <ActualForm>
+┊  ┊48┊        <Legend>Sign in</Legend>
+┊  ┊49┊        <Section style={{ width: '100%' }}>
+┊  ┊50┊          <TextField
+┊  ┊51┊            data-testid="username-input"
+┊  ┊52┊            label="Username"
+┊  ┊53┊            value={username}
+┊  ┊54┊            onChange={onUsernameChange}
+┊  ┊55┊            margin="normal"
+┊  ┊56┊            placeholder="Enter your username"
+┊  ┊57┊          />
+┊  ┊58┊          <TextField
+┊  ┊59┊            data-testid="password-input"
+┊  ┊60┊            label="Password"
+┊  ┊61┊            type="password"
+┊  ┊62┊            value={password}
+┊  ┊63┊            onChange={onPasswordChange}
+┊  ┊64┊            margin="normal"
+┊  ┊65┊            placeholder="Enter your password"
+┊  ┊66┊          />
+┊  ┊67┊        </Section>
+┊  ┊68┊        <Button
+┊  ┊69┊          data-testid="sign-in-button"
+┊  ┊70┊          type="button"
+┊  ┊71┊          color="secondary"
+┊  ┊72┊          variant="contained"
+┊  ┊73┊          disabled={!maySignIn()}
+┊  ┊74┊          onClick={handleSignIn}>
+┊  ┊75┊          Sign in
+┊  ┊76┊        </Button>
+┊  ┊77┊        <ErrorMessage data-testid="error-message">{error}</ErrorMessage>
+┊  ┊78┊      </ActualForm>
+┊  ┊79┊    </SignForm>
+┊  ┊80┊  );
+┊  ┊81┊};
+┊  ┊82┊
+┊  ┊83┊export default SignInForm;
```

##### Added src&#x2F;components&#x2F;AuthScreen&#x2F;SignUpForm.test.tsx
```diff
@@ -0,0 +1,205 @@
+┊   ┊  1┊import { createMemoryHistory } from 'history';
+┊   ┊  2┊import React from 'react';
+┊   ┊  3┊import { ApolloProvider } from '@apollo/react-hooks';
+┊   ┊  4┊import {
+┊   ┊  5┊  act,
+┊   ┊  6┊  cleanup,
+┊   ┊  7┊  render,
+┊   ┊  8┊  fireEvent,
+┊   ┊  9┊  waitFor,
+┊   ┊ 10┊} from '@testing-library/react';
+┊   ┊ 11┊import SignUpForm from './SignUpForm';
+┊   ┊ 12┊import { SignUpDocument } from '../../graphql/types';
+┊   ┊ 13┊import { mockApolloClient } from '../../test-helpers';
+┊   ┊ 14┊
+┊   ┊ 15┊describe('SignUpForm', () => {
+┊   ┊ 16┊  afterEach(cleanup);
+┊   ┊ 17┊
+┊   ┊ 18┊  it('enables sign-up button when filled in', async () => {
+┊   ┊ 19┊    const history = createMemoryHistory();
+┊   ┊ 20┊    const client = mockApolloClient();
+┊   ┊ 21┊
+┊   ┊ 22┊    let getByTestId: any = null;
+┊   ┊ 23┊
+┊   ┊ 24┊    act(() => {
+┊   ┊ 25┊      getByTestId = render(
+┊   ┊ 26┊        <ApolloProvider client={client}>
+┊   ┊ 27┊          <SignUpForm history={history} />
+┊   ┊ 28┊        </ApolloProvider>
+┊   ┊ 29┊      ).getByTestId;
+┊   ┊ 30┊    });
+┊   ┊ 31┊
+┊   ┊ 32┊    const nameInput = await waitFor(() =>
+┊   ┊ 33┊      getByTestId('name-input').querySelector('input')
+┊   ┊ 34┊    );
+┊   ┊ 35┊    const usernameInput = await waitFor(() =>
+┊   ┊ 36┊      getByTestId('username-input').querySelector('input')
+┊   ┊ 37┊    );
+┊   ┊ 38┊    const passwordInput = await waitFor(() =>
+┊   ┊ 39┊      getByTestId('password-input').querySelector('input')
+┊   ┊ 40┊    );
+┊   ┊ 41┊    const passwordConfirmInput = await waitFor(() =>
+┊   ┊ 42┊      getByTestId('password-confirm-input').querySelector('input')
+┊   ┊ 43┊    );
+┊   ┊ 44┊    const signUpButton = await waitFor(
+┊   ┊ 45┊      () => getByTestId('sign-up-button') as HTMLButtonElement
+┊   ┊ 46┊    );
+┊   ┊ 47┊
+┊   ┊ 48┊    expect(signUpButton.disabled).toEqual(true);
+┊   ┊ 49┊
+┊   ┊ 50┊    act(() => {
+┊   ┊ 51┊      fireEvent.change(nameInput, { target: { value: 'User Name' } });
+┊   ┊ 52┊      fireEvent.change(usernameInput, { target: { value: 'username' } });
+┊   ┊ 53┊      fireEvent.change(passwordInput, { target: { value: 'password' } });
+┊   ┊ 54┊      fireEvent.change(passwordConfirmInput, { target: { value: 'password' } });
+┊   ┊ 55┊    });
+┊   ┊ 56┊
+┊   ┊ 57┊    await waitFor(() => expect(nameInput.value).toEqual('User Name'));
+┊   ┊ 58┊
+┊   ┊ 59┊    await waitFor(() => expect(usernameInput.value).toEqual('username'));
+┊   ┊ 60┊
+┊   ┊ 61┊    await waitFor(() => expect(passwordInput.value).toEqual('password'));
+┊   ┊ 62┊
+┊   ┊ 63┊    await waitFor(() => expect(passwordConfirmInput.value).toEqual('password'));
+┊   ┊ 64┊
+┊   ┊ 65┊    await waitFor(() => expect(signUpButton.disabled).toEqual(false));
+┊   ┊ 66┊  });
+┊   ┊ 67┊
+┊   ┊ 68┊  it('prints server error if input was wrong', async () => {
+┊   ┊ 69┊    const history = createMemoryHistory();
+┊   ┊ 70┊
+┊   ┊ 71┊    const client = mockApolloClient([
+┊   ┊ 72┊      {
+┊   ┊ 73┊        request: {
+┊   ┊ 74┊          query: SignUpDocument,
+┊   ┊ 75┊          variables: {
+┊   ┊ 76┊            name: 'User Name',
+┊   ┊ 77┊            username: 'username',
+┊   ┊ 78┊            password: 'password',
+┊   ┊ 79┊            passwordConfirm: 'password',
+┊   ┊ 80┊          },
+┊   ┊ 81┊        },
+┊   ┊ 82┊        get result() {
+┊   ┊ 83┊          throw Error('sign-up failed');
+┊   ┊ 84┊        },
+┊   ┊ 85┊      },
+┊   ┊ 86┊    ]);
+┊   ┊ 87┊
+┊   ┊ 88┊    let getByTestId: any = null;
+┊   ┊ 89┊
+┊   ┊ 90┊    act(() => {
+┊   ┊ 91┊      getByTestId = render(
+┊   ┊ 92┊        <ApolloProvider client={client}>
+┊   ┊ 93┊          <SignUpForm history={history} />
+┊   ┊ 94┊        </ApolloProvider>
+┊   ┊ 95┊      ).getByTestId;
+┊   ┊ 96┊    });
+┊   ┊ 97┊
+┊   ┊ 98┊    const nameInput = await waitFor(() =>
+┊   ┊ 99┊      getByTestId('name-input').querySelector('input')
+┊   ┊100┊    );
+┊   ┊101┊    const usernameInput = await waitFor(() =>
+┊   ┊102┊      getByTestId('username-input').querySelector('input')
+┊   ┊103┊    );
+┊   ┊104┊    const passwordInput = await waitFor(() =>
+┊   ┊105┊      getByTestId('password-input').querySelector('input')
+┊   ┊106┊    );
+┊   ┊107┊    const passwordConfirmInput = await waitFor(() =>
+┊   ┊108┊      getByTestId('password-confirm-input').querySelector('input')
+┊   ┊109┊    );
+┊   ┊110┊    const signUpButton = await waitFor(
+┊   ┊111┊      () => getByTestId('sign-up-button') as HTMLButtonElement
+┊   ┊112┊    );
+┊   ┊113┊
+┊   ┊114┊    act(() => {
+┊   ┊115┊      fireEvent.change(nameInput, { target: { value: 'User Name' } });
+┊   ┊116┊      fireEvent.change(usernameInput, { target: { value: 'username' } });
+┊   ┊117┊      fireEvent.change(passwordInput, { target: { value: 'password' } });
+┊   ┊118┊      fireEvent.change(passwordConfirmInput, { target: { value: 'password' } });
+┊   ┊119┊    });
+┊   ┊120┊
+┊   ┊121┊    await waitFor(() => expect(nameInput.value).toEqual('User Name'));
+┊   ┊122┊
+┊   ┊123┊    await waitFor(() => expect(usernameInput.value).toEqual('username'));
+┊   ┊124┊
+┊   ┊125┊    await waitFor(() => expect(passwordInput.value).toEqual('password'));
+┊   ┊126┊
+┊   ┊127┊    await waitFor(() => expect(passwordConfirmInput.value).toEqual('password'));
+┊   ┊128┊
+┊   ┊129┊    act(() => {
+┊   ┊130┊      fireEvent.click(signUpButton);
+┊   ┊131┊    });
+┊   ┊132┊
+┊   ┊133┊    const errorMessage = await waitFor(() => getByTestId('error-message'));
+┊   ┊134┊
+┊   ┊135┊    await waitFor(() =>
+┊   ┊136┊      expect(errorMessage.innerHTML).toContain('sign-up failed')
+┊   ┊137┊    );
+┊   ┊138┊  });
+┊   ┊139┊
+┊   ┊140┊  it('navigates to /sign-in if everything went right', async () => {
+┊   ┊141┊    const history = createMemoryHistory();
+┊   ┊142┊
+┊   ┊143┊    const client = mockApolloClient([
+┊   ┊144┊      {
+┊   ┊145┊        request: {
+┊   ┊146┊          query: SignUpDocument,
+┊   ┊147┊          variables: {
+┊   ┊148┊            name: 'User Name',
+┊   ┊149┊            username: 'username',
+┊   ┊150┊            password: 'password',
+┊   ┊151┊            passwordConfirm: 'password',
+┊   ┊152┊          },
+┊   ┊153┊        },
+┊   ┊154┊        result: { data: {} },
+┊   ┊155┊      },
+┊   ┊156┊    ]);
+┊   ┊157┊
+┊   ┊158┊    let getByTestId: any = null;
+┊   ┊159┊
+┊   ┊160┊    act(() => {
+┊   ┊161┊      getByTestId = render(
+┊   ┊162┊        <ApolloProvider client={client}>
+┊   ┊163┊          <SignUpForm history={history} />
+┊   ┊164┊        </ApolloProvider>
+┊   ┊165┊      ).getByTestId;
+┊   ┊166┊    });
+┊   ┊167┊
+┊   ┊168┊    const nameInput = await waitFor(() =>
+┊   ┊169┊      getByTestId('name-input').querySelector('input')
+┊   ┊170┊    );
+┊   ┊171┊    const usernameInput = await waitFor(() =>
+┊   ┊172┊      getByTestId('username-input').querySelector('input')
+┊   ┊173┊    );
+┊   ┊174┊    const passwordInput = await waitFor(() =>
+┊   ┊175┊      getByTestId('password-input').querySelector('input')
+┊   ┊176┊    );
+┊   ┊177┊    const passwordConfirmInput = await waitFor(() =>
+┊   ┊178┊      getByTestId('password-confirm-input').querySelector('input')
+┊   ┊179┊    );
+┊   ┊180┊    const signUpButton = await waitFor(
+┊   ┊181┊      () => getByTestId('sign-up-button') as HTMLButtonElement
+┊   ┊182┊    );
+┊   ┊183┊
+┊   ┊184┊    act(() => {
+┊   ┊185┊      fireEvent.change(nameInput, { target: { value: 'User Name' } });
+┊   ┊186┊      fireEvent.change(usernameInput, { target: { value: 'username' } });
+┊   ┊187┊      fireEvent.change(passwordInput, { target: { value: 'password' } });
+┊   ┊188┊      fireEvent.change(passwordConfirmInput, { target: { value: 'password' } });
+┊   ┊189┊    });
+┊   ┊190┊
+┊   ┊191┊    await waitFor(() => expect(nameInput.value).toEqual('User Name'));
+┊   ┊192┊
+┊   ┊193┊    await waitFor(() => expect(usernameInput.value).toEqual('username'));
+┊   ┊194┊
+┊   ┊195┊    await waitFor(() => expect(passwordInput.value).toEqual('password'));
+┊   ┊196┊
+┊   ┊197┊    await waitFor(() => expect(passwordConfirmInput.value).toEqual('password'));
+┊   ┊198┊
+┊   ┊199┊    act(() => {
+┊   ┊200┊      fireEvent.click(signUpButton);
+┊   ┊201┊    });
+┊   ┊202┊
+┊   ┊203┊    await waitFor(() => expect(history.location.pathname).toEqual('/sign-in'));
+┊   ┊204┊  });
+┊   ┊205┊});
```

##### Added src&#x2F;components&#x2F;AuthScreen&#x2F;SignUpForm.tsx
```diff
@@ -0,0 +1,124 @@
+┊   ┊  1┊import React from 'react';
+┊   ┊  2┊import { useCallback, useState } from 'react';
+┊   ┊  3┊import { useSignUp } from '../../services/auth.service';
+┊   ┊  4┊import {
+┊   ┊  5┊  SignForm,
+┊   ┊  6┊  ActualForm,
+┊   ┊  7┊  Legend,
+┊   ┊  8┊  Section,
+┊   ┊  9┊  TextField,
+┊   ┊ 10┊  Button,
+┊   ┊ 11┊  ErrorMessage,
+┊   ┊ 12┊} from './form-components';
+┊   ┊ 13┊import { RouteComponentProps } from 'react-router-dom';
+┊   ┊ 14┊
+┊   ┊ 15┊const SignUpForm: React.FC<RouteComponentProps<any>> = ({ history }) => {
+┊   ┊ 16┊  const [name, setName] = useState('');
+┊   ┊ 17┊  const [username, setUsername] = useState('');
+┊   ┊ 18┊  const [password, setPassword] = useState('');
+┊   ┊ 19┊  const [passwordConfirm, setPasswordConfirm] = useState('');
+┊   ┊ 20┊  const [error, setError] = useState('');
+┊   ┊ 21┊  const [signUp] = useSignUp();
+┊   ┊ 22┊
+┊   ┊ 23┊  const updateName = useCallback(({ target }) => {
+┊   ┊ 24┊    setError('');
+┊   ┊ 25┊    setName(target.value);
+┊   ┊ 26┊  }, []);
+┊   ┊ 27┊
+┊   ┊ 28┊  const updateUsername = useCallback(({ target }) => {
+┊   ┊ 29┊    setError('');
+┊   ┊ 30┊    setUsername(target.value);
+┊   ┊ 31┊  }, []);
+┊   ┊ 32┊
+┊   ┊ 33┊  const updatePassword = useCallback(({ target }) => {
+┊   ┊ 34┊    setError('');
+┊   ┊ 35┊    setPassword(target.value);
+┊   ┊ 36┊  }, []);
+┊   ┊ 37┊
+┊   ┊ 38┊  const updatePasswordConfirm = useCallback(({ target }) => {
+┊   ┊ 39┊    setError('');
+┊   ┊ 40┊    setPasswordConfirm(target.value);
+┊   ┊ 41┊  }, []);
+┊   ┊ 42┊
+┊   ┊ 43┊  const maySignUp = useCallback(() => {
+┊   ┊ 44┊    return !!(name && username && password && password === passwordConfirm);
+┊   ┊ 45┊  }, [name, username, password, passwordConfirm]);
+┊   ┊ 46┊
+┊   ┊ 47┊  const handleSignUp = useCallback(() => {
+┊   ┊ 48┊    signUp({ variables: { username, password, passwordConfirm, name } })
+┊   ┊ 49┊      .then(() => {
+┊   ┊ 50┊        history.replace('/sign-in');
+┊   ┊ 51┊      })
+┊   ┊ 52┊      .catch((error) => {
+┊   ┊ 53┊        setError(error.message || error);
+┊   ┊ 54┊      });
+┊   ┊ 55┊  }, [name, username, password, passwordConfirm, history, signUp]);
+┊   ┊ 56┊
+┊   ┊ 57┊  return (
+┊   ┊ 58┊    <SignForm>
+┊   ┊ 59┊      <ActualForm>
+┊   ┊ 60┊        <Legend>Sign up</Legend>
+┊   ┊ 61┊        <Section
+┊   ┊ 62┊          style={{
+┊   ┊ 63┊            float: 'left',
+┊   ┊ 64┊            width: 'calc(50% - 10px)',
+┊   ┊ 65┊            paddingRight: '10px',
+┊   ┊ 66┊          }}>
+┊   ┊ 67┊          <TextField
+┊   ┊ 68┊            data-testid="name-input"
+┊   ┊ 69┊            label="Name"
+┊   ┊ 70┊            value={name}
+┊   ┊ 71┊            onChange={updateName}
+┊   ┊ 72┊            autoComplete="off"
+┊   ┊ 73┊            margin="normal"
+┊   ┊ 74┊          />
+┊   ┊ 75┊          <TextField
+┊   ┊ 76┊            data-testid="username-input"
+┊   ┊ 77┊            label="Username"
+┊   ┊ 78┊            value={username}
+┊   ┊ 79┊            onChange={updateUsername}
+┊   ┊ 80┊            autoComplete="off"
+┊   ┊ 81┊            margin="normal"
+┊   ┊ 82┊          />
+┊   ┊ 83┊        </Section>
+┊   ┊ 84┊        <Section
+┊   ┊ 85┊          style={{
+┊   ┊ 86┊            float: 'right',
+┊   ┊ 87┊            width: 'calc(50% - 10px)',
+┊   ┊ 88┊            paddingLeft: '10px',
+┊   ┊ 89┊          }}>
+┊   ┊ 90┊          <TextField
+┊   ┊ 91┊            data-testid="password-input"
+┊   ┊ 92┊            label="Password"
+┊   ┊ 93┊            type="password"
+┊   ┊ 94┊            value={password}
+┊   ┊ 95┊            onChange={updatePassword}
+┊   ┊ 96┊            autoComplete="off"
+┊   ┊ 97┊            margin="normal"
+┊   ┊ 98┊          />
+┊   ┊ 99┊          <TextField
+┊   ┊100┊            data-testid="password-confirm-input"
+┊   ┊101┊            label="Confirm password"
+┊   ┊102┊            type="password"
+┊   ┊103┊            value={passwordConfirm}
+┊   ┊104┊            onChange={updatePasswordConfirm}
+┊   ┊105┊            autoComplete="off"
+┊   ┊106┊            margin="normal"
+┊   ┊107┊          />
+┊   ┊108┊        </Section>
+┊   ┊109┊        <Button
+┊   ┊110┊          data-testid="sign-up-button"
+┊   ┊111┊          type="button"
+┊   ┊112┊          color="secondary"
+┊   ┊113┊          variant="contained"
+┊   ┊114┊          disabled={!maySignUp()}
+┊   ┊115┊          onClick={handleSignUp}>
+┊   ┊116┊          Sign up
+┊   ┊117┊        </Button>
+┊   ┊118┊        <ErrorMessage data-testid="error-message">{error}</ErrorMessage>
+┊   ┊119┊      </ActualForm>
+┊   ┊120┊    </SignForm>
+┊   ┊121┊  );
+┊   ┊122┊};
+┊   ┊123┊
+┊   ┊124┊export default SignUpForm;
```

##### Added src&#x2F;components&#x2F;AuthScreen&#x2F;form-components.ts
```diff
@@ -0,0 +1,75 @@
+┊  ┊ 1┊import MaterialButton from '@material-ui/core/Button';
+┊  ┊ 2┊import MaterialTextField from '@material-ui/core/TextField';
+┊  ┊ 3┊import styled from 'styled-components';
+┊  ┊ 4┊
+┊  ┊ 5┊export const SignForm = styled.div`
+┊  ┊ 6┊  height: calc(100% - 265px);
+┊  ┊ 7┊`;
+┊  ┊ 8┊
+┊  ┊ 9┊export const ActualForm = styled.form`
+┊  ┊10┊  padding: 20px;
+┊  ┊11┊`;
+┊  ┊12┊
+┊  ┊13┊export const Section = styled.div`
+┊  ┊14┊  padding-bottom: 35px;
+┊  ┊15┊`;
+┊  ┊16┊
+┊  ┊17┊export const Legend = styled.legend`
+┊  ┊18┊  font-weight: bold;
+┊  ┊19┊  color: white;
+┊  ┊20┊`;
+┊  ┊21┊
+┊  ┊22┊export const Label = styled.label`
+┊  ┊23┊  color: white !important;
+┊  ┊24┊`;
+┊  ┊25┊
+┊  ┊26┊export const Input = styled.input`
+┊  ┊27┊  color: white;
+┊  ┊28┊
+┊  ┊29┊  &::placeholder {
+┊  ┊30┊    color: var(--primary-bg);
+┊  ┊31┊  }
+┊  ┊32┊`;
+┊  ┊33┊
+┊  ┊34┊export const TextField = styled(MaterialTextField)`
+┊  ┊35┊  width: 100%;
+┊  ┊36┊  position: relative;
+┊  ┊37┊
+┊  ┊38┊  > div::before {
+┊  ┊39┊    border-color: white !important;
+┊  ┊40┊  }
+┊  ┊41┊
+┊  ┊42┊  input {
+┊  ┊43┊    color: white !important;
+┊  ┊44┊
+┊  ┊45┊    &::placeholder {
+┊  ┊46┊      color: var(--primary-bg) !important;
+┊  ┊47┊    }
+┊  ┊48┊  }
+┊  ┊49┊
+┊  ┊50┊  label {
+┊  ┊51┊    color: white !important;
+┊  ┊52┊  }
+┊  ┊53┊`;
+┊  ┊54┊
+┊  ┊55┊export const Button = styled(MaterialButton)`
+┊  ┊56┊  width: 100px;
+┊  ┊57┊  display: block !important;
+┊  ┊58┊  margin: auto !important;
+┊  ┊59┊  background-color: var(--secondary-bg) !important;
+┊  ┊60┊
+┊  ┊61┊  &[disabled] {
+┊  ┊62┊    color: #38a81c;
+┊  ┊63┊  }
+┊  ┊64┊
+┊  ┊65┊  &:not([disabled]) {
+┊  ┊66┊    color: white;
+┊  ┊67┊  }
+┊  ┊68┊`;
+┊  ┊69┊
+┊  ┊70┊export const ErrorMessage = styled.div`
+┊  ┊71┊  position: fixed;
+┊  ┊72┊  color: red;
+┊  ┊73┊  font-size: 15px;
+┊  ┊74┊  margin-top: 20px;
+┊  ┊75┊`;
```

##### Changed src&#x2F;components&#x2F;AuthScreen&#x2F;index.tsx
```diff
@@ -1,13 +1,13 @@
-┊ 1┊  ┊import MaterialButton from '@material-ui/core/Button';
-┊ 2┊  ┊import MaterialTextField from '@material-ui/core/TextField';
 ┊ 3┊ 1┊import React from 'react';
-┊ 4┊  ┊import { useCallback, useState } from 'react';
+┊  ┊ 2┊import { useMemo } from 'react';
+┊  ┊ 3┊import { Route } from 'react-router-dom';
 ┊ 5┊ 4┊import styled from 'styled-components';
-┊ 6┊  ┊import { useSignIn } from '../../services/auth.service';
+┊  ┊ 5┊import AnimatedSwitch from '../AnimatedSwitch';
+┊  ┊ 6┊import SignInForm from './SignInForm';
+┊  ┊ 7┊import SignUpForm from './SignUpForm';
 ┊ 7┊ 8┊import { RouteComponentProps } from 'react-router-dom';
 ┊ 8┊ 9┊
 ┊ 9┊10┊const Container = styled.div`
-┊10┊  ┊  height: 100%;
 ┊11┊11┊  background: radial-gradient(rgb(34, 65, 67), rgb(17, 48, 50)),
 ┊12┊12┊    url(/assets/chat-background.jpg) no-repeat;
 ┊13┊13┊  background-size: cover;
```
```diff
@@ -40,149 +40,51 @@
 ┊ 40┊ 40┊  bottom: 10px;
 ┊ 41┊ 41┊  left: 10px;
 ┊ 42┊ 42┊
-┊ 43┊   ┊  a {
+┊   ┊ 43┊  label {
 ┊ 44┊ 44┊    color: var(--secondary-bg);
 ┊ 45┊ 45┊  }
 ┊ 46┊ 46┊`;
 ┊ 47┊ 47┊
-┊ 48┊   ┊const SignInForm = styled.div`
-┊ 49┊   ┊  height: calc(100% - 265px);
-┊ 50┊   ┊`;
-┊ 51┊   ┊
-┊ 52┊   ┊const ActualForm = styled.form`
-┊ 53┊   ┊  padding: 20px;
-┊ 54┊   ┊`;
-┊ 55┊   ┊
-┊ 56┊   ┊const Section = styled.div`
-┊ 57┊   ┊  width: 100%;
-┊ 58┊   ┊  padding-bottom: 35px;
-┊ 59┊   ┊`;
-┊ 60┊   ┊
-┊ 61┊   ┊const Legend = styled.legend`
-┊ 62┊   ┊  font-weight: bold;
-┊ 63┊   ┊  color: white;
-┊ 64┊   ┊`;
-┊ 65┊   ┊
-┊ 66┊   ┊// eslint-disable-next-line
-┊ 67┊   ┊const Label = styled.label`
-┊ 68┊   ┊  color: white !important;
-┊ 69┊   ┊`;
-┊ 70┊   ┊
-┊ 71┊   ┊// eslint-disable-next-line
-┊ 72┊   ┊const Input = styled.input`
-┊ 73┊   ┊  color: white;
-┊ 74┊   ┊
-┊ 75┊   ┊  &::placeholder {
-┊ 76┊   ┊    color: var(--primary-bg);
-┊ 77┊   ┊  }
-┊ 78┊   ┊`;
-┊ 79┊   ┊
-┊ 80┊   ┊const TextField = styled(MaterialTextField)`
-┊ 81┊   ┊  width: 100%;
-┊ 82┊   ┊  position: relative;
-┊ 83┊   ┊
-┊ 84┊   ┊  > div::before {
-┊ 85┊   ┊    border-color: white !important;
-┊ 86┊   ┊  }
-┊ 87┊   ┊
-┊ 88┊   ┊  input {
-┊ 89┊   ┊    color: white !important;
-┊ 90┊   ┊
-┊ 91┊   ┊    &::placeholder {
-┊ 92┊   ┊      color: var(--primary-bg) !important;
+┊   ┊ 48┊const AuthScreen: React.FC<RouteComponentProps<any>> = ({
+┊   ┊ 49┊  history,
+┊   ┊ 50┊  location,
+┊   ┊ 51┊}) => {
+┊   ┊ 52┊  const alternative = useMemo(() => {
+┊   ┊ 53┊    if (location.pathname === '/sign-in') {
+┊   ┊ 54┊      const handleSignUp = () => {
+┊   ┊ 55┊        history.replace('/sign-up');
+┊   ┊ 56┊      };
+┊   ┊ 57┊
+┊   ┊ 58┊      return (
+┊   ┊ 59┊        <Alternative>
+┊   ┊ 60┊          Don't have an account yet?{' '}
+┊   ┊ 61┊          <label onClick={handleSignUp}>Sign up!</label>
+┊   ┊ 62┊        </Alternative>
+┊   ┊ 63┊      );
+┊   ┊ 64┊    } else {
+┊   ┊ 65┊      const handleSignIn = () => {
+┊   ┊ 66┊        history.replace('/sign-in');
+┊   ┊ 67┊      };
+┊   ┊ 68┊
+┊   ┊ 69┊      return (
+┊   ┊ 70┊        <Alternative>
+┊   ┊ 71┊          Already have an accout? <label onClick={handleSignIn}>Sign in!</label>
+┊   ┊ 72┊        </Alternative>
+┊   ┊ 73┊      );
 ┊ 93┊ 74┊    }
-┊ 94┊   ┊  }
-┊ 95┊   ┊
-┊ 96┊   ┊  label {
-┊ 97┊   ┊    color: white !important;
-┊ 98┊   ┊  }
-┊ 99┊   ┊`;
-┊100┊   ┊
-┊101┊   ┊const Button = styled(MaterialButton)`
-┊102┊   ┊  width: 100px;
-┊103┊   ┊  display: block !important;
-┊104┊   ┊  margin: auto !important;
-┊105┊   ┊  background-color: var(--secondary-bg) !important;
-┊106┊   ┊
-┊107┊   ┊  &[disabled] {
-┊108┊   ┊    color: #38a81c;
-┊109┊   ┊  }
-┊110┊   ┊
-┊111┊   ┊  &:not([disabled]) {
-┊112┊   ┊    color: white;
-┊113┊   ┊  }
-┊114┊   ┊`;
-┊115┊   ┊
-┊116┊   ┊const AuthScreen: React.FC<RouteComponentProps<any>> = ({ history }) => {
-┊117┊   ┊  const [username, setUsername] = useState('');
-┊118┊   ┊  const [password, setPassword] = useState('');
-┊119┊   ┊  // eslint-disable-next-line
-┊120┊   ┊  const [error, setError] = useState('');
-┊121┊   ┊  const [signIn] = useSignIn();
-┊122┊   ┊
-┊123┊   ┊  const onUsernameChange = useCallback(({ target }) => {
-┊124┊   ┊    setError('');
-┊125┊   ┊    setUsername(target.value);
-┊126┊   ┊  }, []);
-┊127┊   ┊
-┊128┊   ┊  const onPasswordChange = useCallback(({ target }) => {
-┊129┊   ┊    setError('');
-┊130┊   ┊    setPassword(target.value);
-┊131┊   ┊  }, []);
-┊132┊   ┊
-┊133┊   ┊  const maySignIn = useCallback(() => {
-┊134┊   ┊    return !!(username && password);
-┊135┊   ┊  }, [username, password]);
-┊136┊   ┊
-┊137┊   ┊  const handleSignIn = useCallback(() => {
-┊138┊   ┊    signIn({ variables: { username, password } })
-┊139┊   ┊      .then(() => {
-┊140┊   ┊        history.push('/chats');
-┊141┊   ┊      })
-┊142┊   ┊      .catch((error) => {
-┊143┊   ┊        setError(error.message || error);
-┊144┊   ┊      });
-┊145┊   ┊  }, [username, password, history, signIn]);
+┊   ┊ 75┊  }, [location.pathname, history]);
 ┊146┊ 76┊
 ┊147┊ 77┊  return (
-┊148┊   ┊    <Container>
-┊149┊   ┊      <Intro>
+┊   ┊ 78┊    <Container className="AuthScreen Screen">
+┊   ┊ 79┊      <Intro className="AuthScreen-intro">
 ┊150┊ 80┊        <Icon src="assets/whatsapp-icon.png" className="AuthScreen-icon" />
 ┊151┊ 81┊        <Title className="AuthScreen-title">WhatsApp</Title>
 ┊152┊ 82┊      </Intro>
-┊153┊   ┊      <SignInForm>
-┊154┊   ┊        <ActualForm>
-┊155┊   ┊          <Legend>Sign in</Legend>
-┊156┊   ┊          <Section>
-┊157┊   ┊            <TextField
-┊158┊   ┊              className="AuthScreen-text-field"
-┊159┊   ┊              label="Username"
-┊160┊   ┊              value={username}
-┊161┊   ┊              onChange={onUsernameChange}
-┊162┊   ┊              margin="normal"
-┊163┊   ┊              placeholder="Enter your username"
-┊164┊   ┊            />
-┊165┊   ┊            <TextField
-┊166┊   ┊              className="AuthScreen-text-field"
-┊167┊   ┊              label="Password"
-┊168┊   ┊              type="password"
-┊169┊   ┊              value={password}
-┊170┊   ┊              onChange={onPasswordChange}
-┊171┊   ┊              margin="normal"
-┊172┊   ┊              placeholder="Enter your password"
-┊173┊   ┊            />
-┊174┊   ┊          </Section>
-┊175┊   ┊          <Button
-┊176┊   ┊            data-testid="sign-in-button"
-┊177┊   ┊            type="button"
-┊178┊   ┊            color="secondary"
-┊179┊   ┊            variant="contained"
-┊180┊   ┊            disabled={!maySignIn()}
-┊181┊   ┊            onClick={handleSignIn}>
-┊182┊   ┊            Sign in
-┊183┊   ┊          </Button>
-┊184┊   ┊        </ActualForm>
-┊185┊   ┊      </SignInForm>
+┊   ┊ 83┊      <AnimatedSwitch>
+┊   ┊ 84┊        <Route exact path="/sign-in" component={SignInForm} />
+┊   ┊ 85┊        <Route exact path="/sign-up" component={SignUpForm} />
+┊   ┊ 86┊      </AnimatedSwitch>
+┊   ┊ 87┊      {alternative}
 ┊186┊ 88┊    </Container>
 ┊187┊ 89┊  );
 ┊188┊ 90┊};
```

[}]: #

> Note how we used the `/sign-(in|up)` pattern to define the `signUp` mutation. This is because the request will be further redirected in the `AuthScreen`.

The authentication flow is complete! To test it out, you can create a new user, log in with it and start chatting with other users.



[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step12.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step14.md) |
|:--------------------------------|--------------------------------:|

[}]: #
