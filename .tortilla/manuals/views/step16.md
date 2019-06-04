# Step 16: Modularity

[//]: # (head-end)


This chapter is focused entirely on how to organize a GraphQL API. By far, our project's schema looks simple and keeping SDL and resolvers in two files is really enough.

## Issues we face when GraphQL API grows

Usually, every app starts small and the difficulty of maintenance grows while features are being implemented. I believe that you should always start small and see how a project involves. You could look up many articles about best practices of organising a project but they bring no benefit when your project is small. You don't want to jump between files in order to find what you're looking for, it should be intuitive. I agree a proper folder structure helps but if your schema has 100 lines of code then it makes no sense to split it into 5 files with 20 LOC each. The schema is so small that it won't hurt you when you hit the wall and separation will be necessary but until it happens you can easily move on with the project.

Bigger project means more people, more people means teams. In the current state of the app, they might interrupt each other and that eventually affects productivity.
Lack of separation makes the schema harder to maintain, especially once it grows rapidly.

## That's why modularity is a thing!

In order to improve and solve those issues we would have to split an API into many pieces.
Those might be files, even folders, doesn't really matter because the goal is to keep relevant chunks of code in one place, conceptually called module.

If done right, one team won't disturb another and it also helps to understand an entire codebase just by looking at those modules or even learn a feature because everything related to it is within a single module.

There's also a very important aspect, reusability. Most APIs have something in common, the first thing that comes to mind is authentication and user mechanism in general.
When working with modules, it gets easier to share those.

## Many ways to organize an API

GraphQL specification explains just the language and how to form an API. Managing codebase, that's on our side.

Since we're talking about modularity, let's see possible implementations.

The first thing on mind are files and folders. Putting relevant logic in a file won't scale well once we add more things, like business logic for example. Which means we need folders, that's for sure.

Okay, so the next question, how to store SDL and resolvers. Do we want to have them stored together or keep them separated?

I'm a big fan of the former because in schema-first approach the SDL is written first and you see exactly how to construct resolvers. The latter would require to jump between files or have them opened side-by-side.
Another benefit shows up when you add, remove or just change part of a schema, less likely that you'll miss something.

But as always, there are things you can't do with that approach.
One that pops into my head right away is an IDE support… ?
< guys, any ideas? >

Let's talk about modularity in terms of SDL.
We know how to define types in GraphQL but what if a type is a sum of many features?
There two ways to do it. One is to use the `extend` keyword, another to define a type multiple type. Both gave the same effect, all is merged into one type after all.

But there are few major differences.

The `extend` keyword is obviously a part of the specification so IDEs and most tools support it. It feels more natural than the second option.

Defining the same type multiple times is the opposite. It might feel odd, not many IDEs and
tools support it so you have to add a library that handles it but on the other way you don't care if there's already a type or not, you just make sure there's one with proper fields, no matter what. It might also warn you when fields overlap.

## Modularized schema

There are couple solutions to help you modularize the schema and we will look at 3 of them.

First, let's start by defining 3 modules:

- common - things we want to share with all the rest
- users - everything related to users
- chats - core logic of WhatsApp

### Using directories

The simplest and most obvious solution would be to split what we have and move that into directories.

Starting with common module. We need to create a folder at `/modules/common` and a `index.ts` file in it:

[{]: <helper> (diffStep "13.1" files="modules/common/index.ts" module="server")

#### [__Server__ Step 13.1: Modularize schema](https://github.com/Urigo/WhatsApp-Clone-Server/commit/afa13f92f502562b098153d971f84474d3a36d2c)

##### Added modules&#x2F;common&#x2F;index.ts
```diff
@@ -0,0 +1,25 @@
+┊  ┊ 1┊import { gql } from 'apollo-server-express';
+┊  ┊ 2┊import { DateTimeResolver, URLResolver } from 'graphql-scalars';
+┊  ┊ 3┊import { Resolvers } from '../../types/graphql';
+┊  ┊ 4┊
+┊  ┊ 5┊export const typeDefs = gql`
+┊  ┊ 6┊  scalar Date
+┊  ┊ 7┊  scalar URL
+┊  ┊ 8┊
+┊  ┊ 9┊  type Query {
+┊  ┊10┊    _dummy: Boolean
+┊  ┊11┊  }
+┊  ┊12┊
+┊  ┊13┊  type Mutation {
+┊  ┊14┊    _dummy: Boolean
+┊  ┊15┊  }
+┊  ┊16┊
+┊  ┊17┊  type Subscription {
+┊  ┊18┊    _dummy: Boolean
+┊  ┊19┊  }
+┊  ┊20┊`;
+┊  ┊21┊
+┊  ┊22┊export const resolvers: Resolvers = {
+┊  ┊23┊  Date: DateTimeResolver,
+┊  ┊24┊  URL: URLResolver,
+┊  ┊25┊};
```

[}]: #

You can see a pattern here, two things are being exported, one with type definitions and the other with resolvers. Why those `_dummy` fields? We want to use `extend` keyword, that require a base type and GraphQL doesn't accept empty objects.

Now, let's do the same but with Users module:

[{]: <helper> (diffStep "13.1" files="modules/users/index.ts" module="server")

#### [__Server__ Step 13.1: Modularize schema](https://github.com/Urigo/WhatsApp-Clone-Server/commit/afa13f92f502562b098153d971f84474d3a36d2c)

##### Added modules&#x2F;users&#x2F;index.ts
```diff
@@ -0,0 +1,100 @@
+┊   ┊  1┊import { gql } from 'apollo-server-express';
+┊   ┊  2┊import sql from 'sql-template-strings';
+┊   ┊  3┊import bcrypt from 'bcrypt';
+┊   ┊  4┊import jwt from 'jsonwebtoken';
+┊   ┊  5┊import { secret, expiration } from '../../env';
+┊   ┊  6┊import { validateLength, validatePassword } from '../../validators';
+┊   ┊  7┊import { Resolvers } from '../../types/graphql';
+┊   ┊  8┊
+┊   ┊  9┊export const typeDefs = gql`
+┊   ┊ 10┊  type User {
+┊   ┊ 11┊    id: ID!
+┊   ┊ 12┊    name: String!
+┊   ┊ 13┊    picture: URL
+┊   ┊ 14┊  }
+┊   ┊ 15┊
+┊   ┊ 16┊  extend type Query {
+┊   ┊ 17┊    me: User
+┊   ┊ 18┊    users: [User!]!
+┊   ┊ 19┊  }
+┊   ┊ 20┊
+┊   ┊ 21┊  extend type Mutation {
+┊   ┊ 22┊    signIn(username: String!, password: String!): User
+┊   ┊ 23┊    signUp(
+┊   ┊ 24┊      name: String!
+┊   ┊ 25┊      username: String!
+┊   ┊ 26┊      password: String!
+┊   ┊ 27┊      passwordConfirm: String!
+┊   ┊ 28┊    ): User
+┊   ┊ 29┊  }
+┊   ┊ 30┊`;
+┊   ┊ 31┊
+┊   ┊ 32┊export const resolvers: Resolvers = {
+┊   ┊ 33┊  Query: {
+┊   ┊ 34┊    me(root, args, { currentUser }) {
+┊   ┊ 35┊      return currentUser || null;
+┊   ┊ 36┊    },
+┊   ┊ 37┊    async users(root, args, { currentUser, db }) {
+┊   ┊ 38┊      if (!currentUser) return [];
+┊   ┊ 39┊
+┊   ┊ 40┊      const { rows } = await db.query(sql`
+┊   ┊ 41┊        SELECT * FROM users WHERE users.id != ${currentUser.id}
+┊   ┊ 42┊      `);
+┊   ┊ 43┊
+┊   ┊ 44┊      return rows;
+┊   ┊ 45┊    },
+┊   ┊ 46┊  },
+┊   ┊ 47┊  Mutation: {
+┊   ┊ 48┊    async signIn(root, { username, password }, { db, res }) {
+┊   ┊ 49┊      const { rows } = await db.query(
+┊   ┊ 50┊        sql`SELECT * FROM users WHERE username = ${username}`
+┊   ┊ 51┊      );
+┊   ┊ 52┊      const user = rows[0];
+┊   ┊ 53┊
+┊   ┊ 54┊      if (!user) {
+┊   ┊ 55┊        throw new Error('user not found');
+┊   ┊ 56┊      }
+┊   ┊ 57┊
+┊   ┊ 58┊      const passwordsMatch = bcrypt.compareSync(password, user.password);
+┊   ┊ 59┊
+┊   ┊ 60┊      if (!passwordsMatch) {
+┊   ┊ 61┊        throw new Error('password is incorrect');
+┊   ┊ 62┊      }
+┊   ┊ 63┊
+┊   ┊ 64┊      const authToken = jwt.sign(username, secret);
+┊   ┊ 65┊
+┊   ┊ 66┊      res.cookie('authToken', authToken, { maxAge: expiration });
+┊   ┊ 67┊
+┊   ┊ 68┊      return user;
+┊   ┊ 69┊    },
+┊   ┊ 70┊
+┊   ┊ 71┊    async signUp(root, { name, username, password, passwordConfirm }, { db }) {
+┊   ┊ 72┊      validateLength('req.name', name, 3, 50);
+┊   ┊ 73┊      validateLength('req.username', username, 3, 18);
+┊   ┊ 74┊      validatePassword('req.password', password);
+┊   ┊ 75┊
+┊   ┊ 76┊      if (password !== passwordConfirm) {
+┊   ┊ 77┊        throw Error("req.password and req.passwordConfirm don't match");
+┊   ┊ 78┊      }
+┊   ┊ 79┊
+┊   ┊ 80┊      const existingUserQuery = await db.query(
+┊   ┊ 81┊        sql`SELECT * FROM users WHERE username = ${username}`
+┊   ┊ 82┊      );
+┊   ┊ 83┊      if (existingUserQuery.rows[0]) {
+┊   ┊ 84┊        throw Error('username already exists');
+┊   ┊ 85┊      }
+┊   ┊ 86┊
+┊   ┊ 87┊      const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(8));
+┊   ┊ 88┊
+┊   ┊ 89┊      const createdUserQuery = await db.query(sql`
+┊   ┊ 90┊        INSERT INTO users(password, picture, username, name)
+┊   ┊ 91┊        VALUES(${passwordHash}, '', ${username}, ${name})
+┊   ┊ 92┊        RETURNING *
+┊   ┊ 93┊      `);
+┊   ┊ 94┊
+┊   ┊ 95┊      const user = createdUserQuery.rows[0];
+┊   ┊ 96┊
+┊   ┊ 97┊      return user;
+┊   ┊ 98┊    },
+┊   ┊ 99┊  },
+┊   ┊100┊};
```

[}]: #

And Chats module:

[{]: <helper> (diffStep "13.1" files="modules/chats/index.ts" module="server")

#### [__Server__ Step 13.1: Modularize schema](https://github.com/Urigo/WhatsApp-Clone-Server/commit/afa13f92f502562b098153d971f84474d3a36d2c)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -1,17 +1,47 @@
-┊ 1┊  ┊import { withFilter } from 'apollo-server-express';
-┊ 2┊  ┊import { DateTimeResolver, URLResolver } from 'graphql-scalars';
-┊ 3┊  ┊import { Message, Chat, pool } from '../db';
-┊ 4┊  ┊import { Resolvers } from '../types/graphql';
-┊ 5┊  ┊import { secret, expiration } from '../env';
-┊ 6┊  ┊import bcrypt from 'bcrypt';
-┊ 7┊  ┊import jwt from 'jsonwebtoken';
-┊ 8┊  ┊import { validateLength, validatePassword } from '../validators';
+┊  ┊ 1┊import { gql, withFilter } from 'apollo-server-express';
 ┊ 9┊ 2┊import sql from 'sql-template-strings';
-┊10┊  ┊
-┊11┊  ┊const resolvers: Resolvers = {
-┊12┊  ┊  Date: DateTimeResolver,
-┊13┊  ┊  URL: URLResolver,
-┊14┊  ┊
+┊  ┊ 3┊import { Message, Chat, pool } from '../../db';
+┊  ┊ 4┊import { Resolvers } from '../../types/graphql';
+┊  ┊ 5┊
+┊  ┊ 6┊export const typeDefs = gql`
+┊  ┊ 7┊  type Message {
+┊  ┊ 8┊    id: ID!
+┊  ┊ 9┊    content: String!
+┊  ┊10┊    createdAt: Date!
+┊  ┊11┊    chat: Chat
+┊  ┊12┊    sender: User
+┊  ┊13┊    recipient: User
+┊  ┊14┊    isMine: Boolean!
+┊  ┊15┊  }
+┊  ┊16┊
+┊  ┊17┊  type Chat {
+┊  ┊18┊    id: ID!
+┊  ┊19┊    name: String
+┊  ┊20┊    picture: URL
+┊  ┊21┊    lastMessage: Message
+┊  ┊22┊    messages: [Message!]!
+┊  ┊23┊    participants: [User!]!
+┊  ┊24┊  }
+┊  ┊25┊
+┊  ┊26┊  extend type Query {
+┊  ┊27┊    chats: [Chat!]!
+┊  ┊28┊    chat(chatId: ID!): Chat
+┊  ┊29┊  }
+┊  ┊30┊
+┊  ┊31┊  extend type Mutation {
+┊  ┊32┊    addMessage(chatId: ID!, content: String!): Message
+┊  ┊33┊    addChat(recipientId: ID!): Chat
+┊  ┊34┊    removeChat(chatId: ID!): ID
+┊  ┊35┊  }
+┊  ┊36┊
+┊  ┊37┊  extend type Subscription {
+┊  ┊38┊    messageAdded: Message!
+┊  ┊39┊    chatAdded: Chat!
+┊  ┊40┊    chatRemoved: ID!
+┊  ┊41┊  }
+┊  ┊42┊`;
+┊  ┊43┊
+┊  ┊44┊export const resolvers: Resolvers = {
 ┊15┊45┊  Message: {
 ┊16┊46┊    createdAt(message) {
 ┊17┊47┊      return new Date(message.created_at);
```
```diff
@@ -106,10 +136,6 @@
 ┊106┊136┊  },
 ┊107┊137┊
 ┊108┊138┊  Query: {
-┊109┊   ┊    me(root, args, { currentUser }) {
-┊110┊   ┊      return currentUser || null;
-┊111┊   ┊    },
-┊112┊   ┊
 ┊113┊139┊    async chats(root, args, { currentUser, db }) {
 ┊114┊140┊      if (!currentUser) return [];
 ┊115┊141┊
```
```diff
@@ -134,71 +160,9 @@
 ┊134┊160┊
 ┊135┊161┊      return rows[0] ? rows[0] : null;
 ┊136┊162┊    },
-┊137┊   ┊
-┊138┊   ┊    async users(root, args, { currentUser, db }) {
-┊139┊   ┊      if (!currentUser) return [];
-┊140┊   ┊
-┊141┊   ┊      const { rows } = await db.query(sql`
-┊142┊   ┊        SELECT * FROM users WHERE users.id != ${currentUser.id}
-┊143┊   ┊      `);
-┊144┊   ┊
-┊145┊   ┊      return rows;
-┊146┊   ┊    },
 ┊147┊163┊  },
 ┊148┊164┊
 ┊149┊165┊  Mutation: {
-┊150┊   ┊    async signIn(root, { username, password }, { db, res }) {
-┊151┊   ┊      const { rows } = await db.query(
-┊152┊   ┊        sql`SELECT * FROM users WHERE username = ${username}`
-┊153┊   ┊      );
-┊154┊   ┊      const user = rows[0];
-┊155┊   ┊
-┊156┊   ┊      if (!user) {
-┊157┊   ┊        throw new Error('user not found');
-┊158┊   ┊      }
-┊159┊   ┊
-┊160┊   ┊      const passwordsMatch = bcrypt.compareSync(password, user.password);
-┊161┊   ┊
-┊162┊   ┊      if (!passwordsMatch) {
-┊163┊   ┊        throw new Error('password is incorrect');
-┊164┊   ┊      }
-┊165┊   ┊
-┊166┊   ┊      const authToken = jwt.sign(username, secret);
-┊167┊   ┊
-┊168┊   ┊      res.cookie('authToken', authToken, { maxAge: expiration });
-┊169┊   ┊
-┊170┊   ┊      return user;
-┊171┊   ┊    },
-┊172┊   ┊
-┊173┊   ┊    async signUp(root, { name, username, password, passwordConfirm }, { db }) {
-┊174┊   ┊      validateLength('req.name', name, 3, 50);
-┊175┊   ┊      validateLength('req.username', username, 3, 18);
-┊176┊   ┊      validatePassword('req.password', password);
-┊177┊   ┊
-┊178┊   ┊      if (password !== passwordConfirm) {
-┊179┊   ┊        throw Error("req.password and req.passwordConfirm don't match");
-┊180┊   ┊      }
-┊181┊   ┊
-┊182┊   ┊      const existingUserQuery = await db.query(
-┊183┊   ┊        sql`SELECT * FROM users WHERE username = ${username}`
-┊184┊   ┊      );
-┊185┊   ┊      if (existingUserQuery.rows[0]) {
-┊186┊   ┊        throw Error('username already exists');
-┊187┊   ┊      }
-┊188┊   ┊
-┊189┊   ┊      const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(8));
-┊190┊   ┊
-┊191┊   ┊      const createdUserQuery = await db.query(sql`
-┊192┊   ┊        INSERT INTO users(password, picture, username, name)
-┊193┊   ┊        VALUES(${passwordHash}, '', ${username}, ${name})
-┊194┊   ┊        RETURNING *
-┊195┊   ┊      `);
-┊196┊   ┊
-┊197┊   ┊      const user = createdUserQuery.rows[0];
-┊198┊   ┊
-┊199┊   ┊      return user;
-┊200┊   ┊    },
-┊201┊   ┊
 ┊202┊166┊    async addMessage(root, { chatId, content }, { currentUser, pubsub, db }) {
 ┊203┊167┊      if (!currentUser) return null;
 ┊204┊168┊
```
```diff
@@ -359,5 +323,3 @@
 ┊359┊323┊    },
 ┊360┊324┊  },
 ┊361┊325┊};
-┊362┊   ┊
-┊363┊   ┊export default resolvers;
```

[}]: #

Seems like modules are ready but we still need to create a Schema out of them.

[{]: <helper> (diffStep "13.1" files="schema/index.ts" module="server")

#### [__Server__ Step 13.1: Modularize schema](https://github.com/Urigo/WhatsApp-Clone-Server/commit/afa13f92f502562b098153d971f84474d3a36d2c)

##### Changed schema&#x2F;index.ts
```diff
@@ -1,10 +1,15 @@
-┊ 1┊  ┊import { importSchema } from 'graphql-import';
 ┊ 2┊ 1┊import { makeExecutableSchema, IResolvers } from 'graphql-tools';
-┊ 3┊  ┊import resolvers from './resolvers';
-┊ 4┊  ┊
-┊ 5┊  ┊const typeDefs = importSchema('schema/typeDefs.graphql');
+┊  ┊ 2┊import { merge } from 'lodash';
+┊  ┊ 3┊import * as commonModule from '../modules/common';
+┊  ┊ 4┊import * as usersModule from '../modules/users';
+┊  ┊ 5┊import * as chatsModule from '../modules/chats';
 ┊ 6┊ 6┊
 ┊ 7┊ 7┊export default makeExecutableSchema({
-┊ 8┊  ┊  resolvers: resolvers as IResolvers,
-┊ 9┊  ┊  typeDefs,
+┊  ┊ 8┊  resolvers: merge(
+┊  ┊ 9┊    {},
+┊  ┊10┊    commonModule.resolvers,
+┊  ┊11┊    usersModule.resolvers,
+┊  ┊12┊    chatsModule.resolvers
+┊  ┊13┊  ) as IResolvers,
+┊  ┊14┊  typeDefs: [commonModule.typeDefs, usersModule.typeDefs, chatsModule.typeDefs],
 ┊10┊15┊});
```

[}]: #

Because we moved everything from `resolvers.ts` and `typeDefs.graphql` files, those can now be removed.

The last thing we need to adjust is the GraphQL Code Generator's config, in `codegen.yml`:

[{]: <helper> (diffStep "13.1" files="codegen.yml" module="server")

#### [__Server__ Step 13.1: Modularize schema](https://github.com/Urigo/WhatsApp-Clone-Server/commit/afa13f92f502562b098153d971f84474d3a36d2c)

##### Changed codegen.yml
```diff
@@ -1,7 +1,7 @@
 ┊1┊1┊overwrite: true
 ┊2┊2┊generates:
 ┊3┊3┊  ./types/graphql.d.ts:
-┊4┊ ┊    schema: ./schema/typeDefs.graphql
+┊ ┊4┊    schema: ./modules/*/index.ts
 ┊5┊5┊    plugins:
 ┊6┊6┊      - typescript
 ┊7┊7┊      - typescript-resolvers
```

[}]: #

We no longer keep all type definitions in one place and all documents are wrapped with `gql` tag, the codegen is smart enough to find those.

### Using Apollo Modules

An alternative to the previous solution and far more interesting is a module feature of Apollo Server.

Let's see how it all might look like when using Apollo Server's modules:

[{]: <helper> (diffStep "13.2" files="index.ts" module="server")

#### [__Server__ Step 13.2: Use Apollo Modules](https://github.com/Urigo/WhatsApp-Clone-Server/commit/7d76b520876f43973d41ec479f13dd907c7cc56c)

##### Changed index.ts
```diff
@@ -5,12 +5,15 @@
 ┊ 5┊ 5┊import { app } from './app';
 ┊ 6┊ 6┊import { pool } from './db';
 ┊ 7┊ 7┊import { origin, port, secret } from './env';
-┊ 8┊  ┊import schema from './schema';
 ┊ 9┊ 8┊import { MyContext } from './context';
 ┊10┊ 9┊import sql from 'sql-template-strings';
 ┊11┊10┊import { UnsplashApi } from './schema/unsplash.api';
 ┊12┊11┊const { PostgresPubSub } = require('graphql-postgres-subscriptions');
 ┊13┊12┊
+┊  ┊13┊import * as commonModule from './modules/common';
+┊  ┊14┊import * as usersModule from './modules/users';
+┊  ┊15┊import * as chatsModule from './modules/chats';
+┊  ┊16┊
 ┊14┊17┊const pubsub = new PostgresPubSub({
 ┊15┊18┊  host: 'localhost',
 ┊16┊19┊  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
```
```diff
@@ -19,7 +22,7 @@
 ┊19┊22┊  database: 'whatsapp',
 ┊20┊23┊});
 ┊21┊24┊const server = new ApolloServer({
-┊22┊  ┊  schema,
+┊  ┊25┊  modules: [commonModule, usersModule, chatsModule],
 ┊23┊26┊  context: async (session: any) => {
 ┊24┊27┊    // Access the request object
 ┊25┊28┊    let req = session.connection
```

##### Deleted schema&#x2F;index.ts
```diff
@@ -1,15 +0,0 @@
-┊ 1┊  ┊import { makeExecutableSchema, IResolvers } from 'graphql-tools';
-┊ 2┊  ┊import { merge } from 'lodash';
-┊ 3┊  ┊import * as commonModule from '../modules/common';
-┊ 4┊  ┊import * as usersModule from '../modules/users';
-┊ 5┊  ┊import * as chatsModule from '../modules/chats';
-┊ 6┊  ┊
-┊ 7┊  ┊export default makeExecutableSchema({
-┊ 8┊  ┊  resolvers: merge(
-┊ 9┊  ┊    {},
-┊10┊  ┊    commonModule.resolvers,
-┊11┊  ┊    usersModule.resolvers,
-┊12┊  ┊    chatsModule.resolvers
-┊13┊  ┊  ) as IResolvers,
-┊14┊  ┊  typeDefs: [commonModule.typeDefs, usersModule.typeDefs, chatsModule.typeDefs],
-┊15┊  ┊});
```

[}]: #

The `modules` of ApolloServer accepts an array of objects with `resolvers` and `typeDefs` properties. That's exactly what we exported and that's why we can use esmodules directly.

Because we no longer use `schema.ts`, let's remove it.

If you would run the server right now, you will see a lot of warnings about missing index signatures. It's definitely nothing to worry about and can be easily fixed by using `useIndexSignature` flag of codegen:

[{]: <helper> (diffStep "13.2" files="codegen.yml" module="server")

#### [__Server__ Step 13.2: Use Apollo Modules](https://github.com/Urigo/WhatsApp-Clone-Server/commit/7d76b520876f43973d41ec479f13dd907c7cc56c)

##### Changed codegen.yml
```diff
@@ -6,6 +6,7 @@
 ┊ 6┊ 6┊      - typescript
 ┊ 7┊ 7┊      - typescript-resolvers
 ┊ 8┊ 8┊    config:
+┊  ┊ 9┊      useIndexSignature: true
 ┊ 9┊10┊      contextType: ../context#MyContext
 ┊10┊11┊      mappers:
 ┊11┊12┊        # import { Message } from '../db'
```

[}]: #

You might ask how is that different from what we have already implemented. The code is a bit simpler because the merging part is done by Apollo Server. We get some helpful messages when type's definition is missing but one of the modules was extending it and also when there are duplicates. Apollo Modules are very straightforward and basic but maybe that's all you really need in a project.

### Using GraphQL Modules

There's an another alternative option that forces good patterns and providess a nice to work with API. It's called GraphQL Modules.
The main goal is to help organize an API and allow to develop it across multiple teams.

yarn add @graphql-modules/core

Same as Apollo Server's modules, has useful warnings and messages but you can use it with any implementation of GraphQL server.

```ts
import { GraphQLModule } from ‘@graphql-modules/core';

export default = new GraphQLModule({
  name: 'common',
  typeDefs,
  resolvers
});
```

It's a bit similar to what we have in Apollo Modules but as you probably noticed, it's wrapped within `GraphQLModule` class. The class manages a business logic, SDL, resolvers and dependencies between modules.

> An important thing to be aware of, GraphQL Modules encapsulates every module. To get a better understanding, think of it as CSS Modules.

Now that you know some basics, let's implement the simplest of all modules:

[{]: <helper> (diffStep "13.3" files="modules/common/index.ts" module="server")

#### [__Server__ Step 13.3: Use GraphQL Modules](https://github.com/Urigo/WhatsApp-Clone-Server/commit/8193caf7dba5feb36388975144061a221b119822)

##### Changed modules&#x2F;common&#x2F;index.ts
```diff
@@ -1,8 +1,12 @@
+┊  ┊ 1┊import { GraphQLModule } from '@graphql-modules/core';
 ┊ 1┊ 2┊import { gql } from 'apollo-server-express';
 ┊ 2┊ 3┊import { DateTimeResolver, URLResolver } from 'graphql-scalars';
+┊  ┊ 4┊import { pool } from '../../db';
 ┊ 3┊ 5┊import { Resolvers } from '../../types/graphql';
 ┊ 4┊ 6┊
-┊ 5┊  ┊export const typeDefs = gql`
+┊  ┊ 7┊const { PostgresPubSub } = require('graphql-postgres-subscriptions');
+┊  ┊ 8┊
+┊  ┊ 9┊const typeDefs = gql`
 ┊ 6┊10┊  scalar Date
 ┊ 7┊11┊  scalar URL
 ┊ 8┊12┊
```
```diff
@@ -19,7 +23,34 @@
 ┊19┊23┊  }
 ┊20┊24┊`;
 ┊21┊25┊
-┊22┊  ┊export const resolvers: Resolvers = {
+┊  ┊26┊const resolvers: Resolvers = {
 ┊23┊27┊  Date: DateTimeResolver,
 ┊24┊28┊  URL: URLResolver,
 ┊25┊29┊};
+┊  ┊30┊
+┊  ┊31┊const pubsub = new PostgresPubSub({
+┊  ┊32┊  host: 'localhost',
+┊  ┊33┊  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
+┊  ┊34┊  user: 'testuser',
+┊  ┊35┊  password: 'testpassword',
+┊  ┊36┊  database: 'whatsapp',
+┊  ┊37┊});
+┊  ┊38┊
+┊  ┊39┊export default new GraphQLModule({
+┊  ┊40┊  name: 'common',
+┊  ┊41┊  typeDefs,
+┊  ┊42┊  resolvers,
+┊  ┊43┊  async context({ res, connection }) {
+┊  ┊44┊    let db;
+┊  ┊45┊
+┊  ┊46┊    if (!connection) {
+┊  ┊47┊      db = await pool.connect();
+┊  ┊48┊    }
+┊  ┊49┊
+┊  ┊50┊    return {
+┊  ┊51┊      pubsub,
+┊  ┊52┊      res,
+┊  ┊53┊      db,
+┊  ┊54┊    };
+┊  ┊55┊  },
+┊  ┊56┊});
```

[}]: #

As we mentioned, there's no global context so we moved the common parts into Common module.

Let's take care of other two modules and migrate `modules/users/index.ts` first:

[{]: <helper> (diffStep "13.3" files="modules/users/index.ts" module="server")

#### [__Server__ Step 13.3: Use GraphQL Modules](https://github.com/Urigo/WhatsApp-Clone-Server/commit/8193caf7dba5feb36388975144061a221b119822)

##### Changed modules&#x2F;users&#x2F;index.ts
```diff
@@ -1,12 +1,16 @@
+┊  ┊ 1┊import { GraphQLModule } from '@graphql-modules/core';
 ┊ 1┊ 2┊import { gql } from 'apollo-server-express';
+┊  ┊ 3┊import cookie from 'cookie';
 ┊ 2┊ 4┊import sql from 'sql-template-strings';
 ┊ 3┊ 5┊import bcrypt from 'bcrypt';
 ┊ 4┊ 6┊import jwt from 'jsonwebtoken';
+┊  ┊ 7┊import commonModule from '../common';
 ┊ 5┊ 8┊import { secret, expiration } from '../../env';
+┊  ┊ 9┊import { pool } from '../../db';
 ┊ 6┊10┊import { validateLength, validatePassword } from '../../validators';
 ┊ 7┊11┊import { Resolvers } from '../../types/graphql';
 ┊ 8┊12┊
-┊ 9┊  ┊export const typeDefs = gql`
+┊  ┊13┊const typeDefs = gql`
 ┊10┊14┊  type User {
 ┊11┊15┊    id: ID!
 ┊12┊16┊    name: String!
```
```diff
@@ -29,7 +33,7 @@
 ┊29┊33┊  }
 ┊30┊34┊`;
 ┊31┊35┊
-┊32┊  ┊export const resolvers: Resolvers = {
+┊  ┊36┊const resolvers: Resolvers = {
 ┊33┊37┊  Query: {
 ┊34┊38┊    me(root, args, { currentUser }) {
 ┊35┊39┊      return currentUser || null;
```
```diff
@@ -98,3 +102,38 @@
 ┊ 98┊102┊    },
 ┊ 99┊103┊  },
 ┊100┊104┊};
+┊   ┊105┊
+┊   ┊106┊export default new GraphQLModule({
+┊   ┊107┊  name: 'users',
+┊   ┊108┊  typeDefs,
+┊   ┊109┊  resolvers,
+┊   ┊110┊  imports: () => [commonModule],
+┊   ┊111┊  async context(session) {
+┊   ┊112┊    let currentUser;
+┊   ┊113┊
+┊   ┊114┊    // Access the request object
+┊   ┊115┊    let req = session.connection
+┊   ┊116┊      ? session.connection.context.request
+┊   ┊117┊      : session.req;
+┊   ┊118┊
+┊   ┊119┊    // It's subscription
+┊   ┊120┊    if (session.connection) {
+┊   ┊121┊      req.cookies = cookie.parse(req.headers.cookie || '');
+┊   ┊122┊    }
+┊   ┊123┊
+┊   ┊124┊    if (req.cookies.authToken) {
+┊   ┊125┊      const username = jwt.verify(req.cookies.authToken, secret) as string;
+┊   ┊126┊
+┊   ┊127┊      if (username) {
+┊   ┊128┊        const { rows } = await pool.query(
+┊   ┊129┊          sql`SELECT * FROM users WHERE username = ${username}`
+┊   ┊130┊        );
+┊   ┊131┊        currentUser = rows[0];
+┊   ┊132┊      }
+┊   ┊133┊    }
+┊   ┊134┊
+┊   ┊135┊    return {
+┊   ┊136┊      currentUser,
+┊   ┊137┊    };
+┊   ┊138┊  },
+┊   ┊139┊});
```

[}]: #

Just like with Common, we also moved related context but there's a totally new thing called `imports`. In order to let Users module see Common's contents (types, resolvers, context etc) we need to include it in the dependencies.

Now `Chats` that depends on `Users` and `Common` modules:

[{]: <helper> (diffStep "13.3" files="modules/chats/index.ts" module="server")

#### [__Server__ Step 13.3: Use GraphQL Modules](https://github.com/Urigo/WhatsApp-Clone-Server/commit/8193caf7dba5feb36388975144061a221b119822)

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -1,9 +1,12 @@
+┊  ┊ 1┊import { GraphQLModule } from '@graphql-modules/core';
 ┊ 1┊ 2┊import { gql, withFilter } from 'apollo-server-express';
 ┊ 2┊ 3┊import sql from 'sql-template-strings';
+┊  ┊ 4┊import commonModule from '../common';
+┊  ┊ 5┊import usersModule from '../users';
 ┊ 3┊ 6┊import { Message, Chat, pool } from '../../db';
 ┊ 4┊ 7┊import { Resolvers } from '../../types/graphql';
 ┊ 5┊ 8┊
-┊ 6┊  ┊export const typeDefs = gql`
+┊  ┊ 9┊const typeDefs = gql`
 ┊ 7┊10┊  type Message {
 ┊ 8┊11┊    id: ID!
 ┊ 9┊12┊    content: String!
```
```diff
@@ -41,7 +44,7 @@
 ┊41┊44┊  }
 ┊42┊45┊`;
 ┊43┊46┊
-┊44┊  ┊export const resolvers: Resolvers = {
+┊  ┊47┊const resolvers: Resolvers = {
 ┊45┊48┊  Message: {
 ┊46┊49┊    createdAt(message) {
 ┊47┊50┊      return new Date(message.created_at);
```
```diff
@@ -323,3 +326,10 @@
 ┊323┊326┊    },
 ┊324┊327┊  },
 ┊325┊328┊};
+┊   ┊329┊
+┊   ┊330┊export default new GraphQLModule({
+┊   ┊331┊  name: 'chats',
+┊   ┊332┊  typeDefs,
+┊   ┊333┊  resolvers,
+┊   ┊334┊  imports: () => [commonModule, usersModule],
+┊   ┊335┊});
```

[}]: #

Since every module is now a GraphQL Module, we can take care of how to use them in the ApolloServer.

To make things easier, we're going to create a module that's called `Root` and represents our API.

```ts
export const rootModule = new GraphQLModule({
  name: 'root',
  imports: [usersModule, chatsModule],
});
```

We want to pass `schema` and `context` to ApolloServer:

```ts
const server = new ApolloServer({
  schema: rootModule.schema,
  context: rootModule.context,
  // ...
```

Now with all that knowledge, take a look at all changes at once:

[{]: <helper> (diffStep "13.3" files="index.ts" module="server")

#### [__Server__ Step 13.3: Use GraphQL Modules](https://github.com/Urigo/WhatsApp-Clone-Server/commit/8193caf7dba5feb36388975144061a221b119822)

##### Changed index.ts
```diff
@@ -1,71 +1,23 @@
 ┊ 1┊ 1┊import { ApolloServer } from 'apollo-server-express';
-┊ 2┊  ┊import cookie from 'cookie';
+┊  ┊ 2┊import { GraphQLModule } from '@graphql-modules/core';
 ┊ 3┊ 3┊import http from 'http';
-┊ 4┊  ┊import jwt from 'jsonwebtoken';
 ┊ 5┊ 4┊import { app } from './app';
-┊ 6┊  ┊import { pool } from './db';
-┊ 7┊  ┊import { origin, port, secret } from './env';
+┊  ┊ 5┊import { origin, port } from './env';
 ┊ 8┊ 6┊import { MyContext } from './context';
-┊ 9┊  ┊import sql from 'sql-template-strings';
 ┊10┊ 7┊import { UnsplashApi } from './schema/unsplash.api';
-┊11┊  ┊const { PostgresPubSub } = require('graphql-postgres-subscriptions');
 ┊12┊ 8┊
-┊13┊  ┊import * as commonModule from './modules/common';
-┊14┊  ┊import * as usersModule from './modules/users';
-┊15┊  ┊import * as chatsModule from './modules/chats';
+┊  ┊ 9┊import usersModule from './modules/users';
+┊  ┊10┊import chatsModule from './modules/chats';
 ┊16┊11┊
-┊17┊  ┊const pubsub = new PostgresPubSub({
-┊18┊  ┊  host: 'localhost',
-┊19┊  ┊  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
-┊20┊  ┊  user: 'testuser',
-┊21┊  ┊  password: 'testpassword',
-┊22┊  ┊  database: 'whatsapp',
+┊  ┊12┊export const rootModule = new GraphQLModule({
+┊  ┊13┊  name: 'root',
+┊  ┊14┊  imports: [usersModule, chatsModule],
 ┊23┊15┊});
-┊24┊  ┊const server = new ApolloServer({
-┊25┊  ┊  modules: [commonModule, usersModule, chatsModule],
-┊26┊  ┊  context: async (session: any) => {
-┊27┊  ┊    // Access the request object
-┊28┊  ┊    let req = session.connection
-┊29┊  ┊      ? session.connection.context.request
-┊30┊  ┊      : session.req;
-┊31┊  ┊
-┊32┊  ┊    // It's subscription
-┊33┊  ┊    if (session.connection) {
-┊34┊  ┊      req.cookies = cookie.parse(req.headers.cookie || '');
-┊35┊  ┊    }
-┊36┊  ┊
-┊37┊  ┊    let currentUser;
-┊38┊  ┊    if (req.cookies.authToken) {
-┊39┊  ┊      const username = jwt.verify(req.cookies.authToken, secret) as string;
-┊40┊  ┊      if (username) {
-┊41┊  ┊        const { rows } = await pool.query(
-┊42┊  ┊          sql`SELECT * FROM users WHERE username = ${username}`
-┊43┊  ┊        );
-┊44┊  ┊        currentUser = rows[0];
-┊45┊  ┊      }
-┊46┊  ┊    }
-┊47┊  ┊
-┊48┊  ┊    let db;
 ┊49┊16┊
-┊50┊  ┊    if (!session.connection) {
-┊51┊  ┊      db = await pool.connect();
-┊52┊  ┊    }
-┊53┊  ┊
-┊54┊  ┊    return {
-┊55┊  ┊      currentUser,
-┊56┊  ┊      pubsub,
-┊57┊  ┊      db,
-┊58┊  ┊      res: session.res,
-┊59┊  ┊    };
-┊60┊  ┊  },
-┊61┊  ┊  subscriptions: {
-┊62┊  ┊    onConnect(params, ws, ctx) {
-┊63┊  ┊      // pass the request object to context
-┊64┊  ┊      return {
-┊65┊  ┊        request: ctx.request,
-┊66┊  ┊      };
-┊67┊  ┊    },
-┊68┊  ┊  },
+┊  ┊17┊const server = new ApolloServer({
+┊  ┊18┊  schema: rootModule.schema,
+┊  ┊19┊  context: rootModule.context,
+┊  ┊20┊  subscriptions: rootModule.subscriptions,
 ┊69┊21┊  formatResponse: (res: any, { context }: any) => {
 ┊70┊22┊    context.db.release();
 ┊71┊23┊
```

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -1,9 +1,12 @@
+┊  ┊ 1┊import { GraphQLModule } from '@graphql-modules/core';
 ┊ 1┊ 2┊import { gql, withFilter } from 'apollo-server-express';
 ┊ 2┊ 3┊import sql from 'sql-template-strings';
+┊  ┊ 4┊import commonModule from '../common';
+┊  ┊ 5┊import usersModule from '../users';
 ┊ 3┊ 6┊import { Message, Chat, pool } from '../../db';
 ┊ 4┊ 7┊import { Resolvers } from '../../types/graphql';
 ┊ 5┊ 8┊
-┊ 6┊  ┊export const typeDefs = gql`
+┊  ┊ 9┊const typeDefs = gql`
 ┊ 7┊10┊  type Message {
 ┊ 8┊11┊    id: ID!
 ┊ 9┊12┊    content: String!
```
```diff
@@ -41,7 +44,7 @@
 ┊41┊44┊  }
 ┊42┊45┊`;
 ┊43┊46┊
-┊44┊  ┊export const resolvers: Resolvers = {
+┊  ┊47┊const resolvers: Resolvers = {
 ┊45┊48┊  Message: {
 ┊46┊49┊    createdAt(message) {
 ┊47┊50┊      return new Date(message.created_at);
```
```diff
@@ -323,3 +326,10 @@
 ┊323┊326┊    },
 ┊324┊327┊  },
 ┊325┊328┊};
+┊   ┊329┊
+┊   ┊330┊export default new GraphQLModule({
+┊   ┊331┊  name: 'chats',
+┊   ┊332┊  typeDefs,
+┊   ┊333┊  resolvers,
+┊   ┊334┊  imports: () => [commonModule, usersModule],
+┊   ┊335┊});
```

##### Changed modules&#x2F;common&#x2F;index.ts
```diff
@@ -1,8 +1,12 @@
+┊  ┊ 1┊import { GraphQLModule } from '@graphql-modules/core';
 ┊ 1┊ 2┊import { gql } from 'apollo-server-express';
 ┊ 2┊ 3┊import { DateTimeResolver, URLResolver } from 'graphql-scalars';
+┊  ┊ 4┊import { pool } from '../../db';
 ┊ 3┊ 5┊import { Resolvers } from '../../types/graphql';
 ┊ 4┊ 6┊
-┊ 5┊  ┊export const typeDefs = gql`
+┊  ┊ 7┊const { PostgresPubSub } = require('graphql-postgres-subscriptions');
+┊  ┊ 8┊
+┊  ┊ 9┊const typeDefs = gql`
 ┊ 6┊10┊  scalar Date
 ┊ 7┊11┊  scalar URL
 ┊ 8┊12┊
```
```diff
@@ -19,7 +23,34 @@
 ┊19┊23┊  }
 ┊20┊24┊`;
 ┊21┊25┊
-┊22┊  ┊export const resolvers: Resolvers = {
+┊  ┊26┊const resolvers: Resolvers = {
 ┊23┊27┊  Date: DateTimeResolver,
 ┊24┊28┊  URL: URLResolver,
 ┊25┊29┊};
+┊  ┊30┊
+┊  ┊31┊const pubsub = new PostgresPubSub({
+┊  ┊32┊  host: 'localhost',
+┊  ┊33┊  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
+┊  ┊34┊  user: 'testuser',
+┊  ┊35┊  password: 'testpassword',
+┊  ┊36┊  database: 'whatsapp',
+┊  ┊37┊});
+┊  ┊38┊
+┊  ┊39┊export default new GraphQLModule({
+┊  ┊40┊  name: 'common',
+┊  ┊41┊  typeDefs,
+┊  ┊42┊  resolvers,
+┊  ┊43┊  async context({ res, connection }) {
+┊  ┊44┊    let db;
+┊  ┊45┊
+┊  ┊46┊    if (!connection) {
+┊  ┊47┊      db = await pool.connect();
+┊  ┊48┊    }
+┊  ┊49┊
+┊  ┊50┊    return {
+┊  ┊51┊      pubsub,
+┊  ┊52┊      res,
+┊  ┊53┊      db,
+┊  ┊54┊    };
+┊  ┊55┊  },
+┊  ┊56┊});
```

##### Changed modules&#x2F;users&#x2F;index.ts
```diff
@@ -1,12 +1,16 @@
+┊  ┊ 1┊import { GraphQLModule } from '@graphql-modules/core';
 ┊ 1┊ 2┊import { gql } from 'apollo-server-express';
+┊  ┊ 3┊import cookie from 'cookie';
 ┊ 2┊ 4┊import sql from 'sql-template-strings';
 ┊ 3┊ 5┊import bcrypt from 'bcrypt';
 ┊ 4┊ 6┊import jwt from 'jsonwebtoken';
+┊  ┊ 7┊import commonModule from '../common';
 ┊ 5┊ 8┊import { secret, expiration } from '../../env';
+┊  ┊ 9┊import { pool } from '../../db';
 ┊ 6┊10┊import { validateLength, validatePassword } from '../../validators';
 ┊ 7┊11┊import { Resolvers } from '../../types/graphql';
 ┊ 8┊12┊
-┊ 9┊  ┊export const typeDefs = gql`
+┊  ┊13┊const typeDefs = gql`
 ┊10┊14┊  type User {
 ┊11┊15┊    id: ID!
 ┊12┊16┊    name: String!
```
```diff
@@ -29,7 +33,7 @@
 ┊29┊33┊  }
 ┊30┊34┊`;
 ┊31┊35┊
-┊32┊  ┊export const resolvers: Resolvers = {
+┊  ┊36┊const resolvers: Resolvers = {
 ┊33┊37┊  Query: {
 ┊34┊38┊    me(root, args, { currentUser }) {
 ┊35┊39┊      return currentUser || null;
```
```diff
@@ -98,3 +102,38 @@
 ┊ 98┊102┊    },
 ┊ 99┊103┊  },
 ┊100┊104┊};
+┊   ┊105┊
+┊   ┊106┊export default new GraphQLModule({
+┊   ┊107┊  name: 'users',
+┊   ┊108┊  typeDefs,
+┊   ┊109┊  resolvers,
+┊   ┊110┊  imports: () => [commonModule],
+┊   ┊111┊  async context(session) {
+┊   ┊112┊    let currentUser;
+┊   ┊113┊
+┊   ┊114┊    // Access the request object
+┊   ┊115┊    let req = session.connection
+┊   ┊116┊      ? session.connection.context.request
+┊   ┊117┊      : session.req;
+┊   ┊118┊
+┊   ┊119┊    // It's subscription
+┊   ┊120┊    if (session.connection) {
+┊   ┊121┊      req.cookies = cookie.parse(req.headers.cookie || '');
+┊   ┊122┊    }
+┊   ┊123┊
+┊   ┊124┊    if (req.cookies.authToken) {
+┊   ┊125┊      const username = jwt.verify(req.cookies.authToken, secret) as string;
+┊   ┊126┊
+┊   ┊127┊      if (username) {
+┊   ┊128┊        const { rows } = await pool.query(
+┊   ┊129┊          sql`SELECT * FROM users WHERE username = ${username}`
+┊   ┊130┊        );
+┊   ┊131┊        currentUser = rows[0];
+┊   ┊132┊      }
+┊   ┊133┊    }
+┊   ┊134┊
+┊   ┊135┊    return {
+┊   ┊136┊      currentUser,
+┊   ┊137┊    };
+┊   ┊138┊  },
+┊   ┊139┊});
```

[}]: #

#### Migrate Unsplash API to Chats

We still make use of global context which won't work with GraphQL Modules. To be more specific, it's not the context definition itself but the thing that's being added by ApolloServer, Data Sources.

The `RESTDataSource` is of course more than a class but in case of Unsplash API we won't loose any important features except the HTTP client. We're going to use `axios` instead:

yarn add axios

We've got everything now so let's migrate UnsplashAPI class and move it from `schema/unsplash.api.ts` under `modules/chats`!

[{]: <helper> (diffStep "13.3" files="modules/chats/unsplash.api.ts" module="server")

#### [__Server__ Step 13.3: Use GraphQL Modules](https://github.com/Urigo/WhatsApp-Clone-Server/commit/8193caf7dba5feb36388975144061a221b119822)



[}]: #

There is no big differences between now and what we had before, the only thing that's changed is the way we make http requests.

The `UnsplashAPI` can be now removed from `dataSources` and moved under Chats module's context:

[{]: <helper> (diffStep "13.3" files="index.ts" module="server")

#### [__Server__ Step 13.3: Use GraphQL Modules](https://github.com/Urigo/WhatsApp-Clone-Server/commit/8193caf7dba5feb36388975144061a221b119822)

##### Changed index.ts
```diff
@@ -1,71 +1,23 @@
 ┊ 1┊ 1┊import { ApolloServer } from 'apollo-server-express';
-┊ 2┊  ┊import cookie from 'cookie';
+┊  ┊ 2┊import { GraphQLModule } from '@graphql-modules/core';
 ┊ 3┊ 3┊import http from 'http';
-┊ 4┊  ┊import jwt from 'jsonwebtoken';
 ┊ 5┊ 4┊import { app } from './app';
-┊ 6┊  ┊import { pool } from './db';
-┊ 7┊  ┊import { origin, port, secret } from './env';
+┊  ┊ 5┊import { origin, port } from './env';
 ┊ 8┊ 6┊import { MyContext } from './context';
-┊ 9┊  ┊import sql from 'sql-template-strings';
 ┊10┊ 7┊import { UnsplashApi } from './schema/unsplash.api';
-┊11┊  ┊const { PostgresPubSub } = require('graphql-postgres-subscriptions');
 ┊12┊ 8┊
-┊13┊  ┊import * as commonModule from './modules/common';
-┊14┊  ┊import * as usersModule from './modules/users';
-┊15┊  ┊import * as chatsModule from './modules/chats';
+┊  ┊ 9┊import usersModule from './modules/users';
+┊  ┊10┊import chatsModule from './modules/chats';
 ┊16┊11┊
-┊17┊  ┊const pubsub = new PostgresPubSub({
-┊18┊  ┊  host: 'localhost',
-┊19┊  ┊  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
-┊20┊  ┊  user: 'testuser',
-┊21┊  ┊  password: 'testpassword',
-┊22┊  ┊  database: 'whatsapp',
+┊  ┊12┊export const rootModule = new GraphQLModule({
+┊  ┊13┊  name: 'root',
+┊  ┊14┊  imports: [usersModule, chatsModule],
 ┊23┊15┊});
-┊24┊  ┊const server = new ApolloServer({
-┊25┊  ┊  modules: [commonModule, usersModule, chatsModule],
-┊26┊  ┊  context: async (session: any) => {
-┊27┊  ┊    // Access the request object
-┊28┊  ┊    let req = session.connection
-┊29┊  ┊      ? session.connection.context.request
-┊30┊  ┊      : session.req;
-┊31┊  ┊
-┊32┊  ┊    // It's subscription
-┊33┊  ┊    if (session.connection) {
-┊34┊  ┊      req.cookies = cookie.parse(req.headers.cookie || '');
-┊35┊  ┊    }
-┊36┊  ┊
-┊37┊  ┊    let currentUser;
-┊38┊  ┊    if (req.cookies.authToken) {
-┊39┊  ┊      const username = jwt.verify(req.cookies.authToken, secret) as string;
-┊40┊  ┊      if (username) {
-┊41┊  ┊        const { rows } = await pool.query(
-┊42┊  ┊          sql`SELECT * FROM users WHERE username = ${username}`
-┊43┊  ┊        );
-┊44┊  ┊        currentUser = rows[0];
-┊45┊  ┊      }
-┊46┊  ┊    }
-┊47┊  ┊
-┊48┊  ┊    let db;
 ┊49┊16┊
-┊50┊  ┊    if (!session.connection) {
-┊51┊  ┊      db = await pool.connect();
-┊52┊  ┊    }
-┊53┊  ┊
-┊54┊  ┊    return {
-┊55┊  ┊      currentUser,
-┊56┊  ┊      pubsub,
-┊57┊  ┊      db,
-┊58┊  ┊      res: session.res,
-┊59┊  ┊    };
-┊60┊  ┊  },
-┊61┊  ┊  subscriptions: {
-┊62┊  ┊    onConnect(params, ws, ctx) {
-┊63┊  ┊      // pass the request object to context
-┊64┊  ┊      return {
-┊65┊  ┊        request: ctx.request,
-┊66┊  ┊      };
-┊67┊  ┊    },
-┊68┊  ┊  },
+┊  ┊17┊const server = new ApolloServer({
+┊  ┊18┊  schema: rootModule.schema,
+┊  ┊19┊  context: rootModule.context,
+┊  ┊20┊  subscriptions: rootModule.subscriptions,
 ┊69┊21┊  formatResponse: (res: any, { context }: any) => {
 ┊70┊22┊    context.db.release();
 ┊71┊23┊
```

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -1,9 +1,12 @@
+┊  ┊ 1┊import { GraphQLModule } from '@graphql-modules/core';
 ┊ 1┊ 2┊import { gql, withFilter } from 'apollo-server-express';
 ┊ 2┊ 3┊import sql from 'sql-template-strings';
+┊  ┊ 4┊import commonModule from '../common';
+┊  ┊ 5┊import usersModule from '../users';
 ┊ 3┊ 6┊import { Message, Chat, pool } from '../../db';
 ┊ 4┊ 7┊import { Resolvers } from '../../types/graphql';
 ┊ 5┊ 8┊
-┊ 6┊  ┊export const typeDefs = gql`
+┊  ┊ 9┊const typeDefs = gql`
 ┊ 7┊10┊  type Message {
 ┊ 8┊11┊    id: ID!
 ┊ 9┊12┊    content: String!
```
```diff
@@ -41,7 +44,7 @@
 ┊41┊44┊  }
 ┊42┊45┊`;
 ┊43┊46┊
-┊44┊  ┊export const resolvers: Resolvers = {
+┊  ┊47┊const resolvers: Resolvers = {
 ┊45┊48┊  Message: {
 ┊46┊49┊    createdAt(message) {
 ┊47┊50┊      return new Date(message.created_at);
```
```diff
@@ -323,3 +326,10 @@
 ┊323┊326┊    },
 ┊324┊327┊  },
 ┊325┊328┊};
+┊   ┊329┊
+┊   ┊330┊export default new GraphQLModule({
+┊   ┊331┊  name: 'chats',
+┊   ┊332┊  typeDefs,
+┊   ┊333┊  resolvers,
+┊   ┊334┊  imports: () => [commonModule, usersModule],
+┊   ┊335┊});
```

##### Changed modules&#x2F;common&#x2F;index.ts
```diff
@@ -1,8 +1,12 @@
+┊  ┊ 1┊import { GraphQLModule } from '@graphql-modules/core';
 ┊ 1┊ 2┊import { gql } from 'apollo-server-express';
 ┊ 2┊ 3┊import { DateTimeResolver, URLResolver } from 'graphql-scalars';
+┊  ┊ 4┊import { pool } from '../../db';
 ┊ 3┊ 5┊import { Resolvers } from '../../types/graphql';
 ┊ 4┊ 6┊
-┊ 5┊  ┊export const typeDefs = gql`
+┊  ┊ 7┊const { PostgresPubSub } = require('graphql-postgres-subscriptions');
+┊  ┊ 8┊
+┊  ┊ 9┊const typeDefs = gql`
 ┊ 6┊10┊  scalar Date
 ┊ 7┊11┊  scalar URL
 ┊ 8┊12┊
```
```diff
@@ -19,7 +23,34 @@
 ┊19┊23┊  }
 ┊20┊24┊`;
 ┊21┊25┊
-┊22┊  ┊export const resolvers: Resolvers = {
+┊  ┊26┊const resolvers: Resolvers = {
 ┊23┊27┊  Date: DateTimeResolver,
 ┊24┊28┊  URL: URLResolver,
 ┊25┊29┊};
+┊  ┊30┊
+┊  ┊31┊const pubsub = new PostgresPubSub({
+┊  ┊32┊  host: 'localhost',
+┊  ┊33┊  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
+┊  ┊34┊  user: 'testuser',
+┊  ┊35┊  password: 'testpassword',
+┊  ┊36┊  database: 'whatsapp',
+┊  ┊37┊});
+┊  ┊38┊
+┊  ┊39┊export default new GraphQLModule({
+┊  ┊40┊  name: 'common',
+┊  ┊41┊  typeDefs,
+┊  ┊42┊  resolvers,
+┊  ┊43┊  async context({ res, connection }) {
+┊  ┊44┊    let db;
+┊  ┊45┊
+┊  ┊46┊    if (!connection) {
+┊  ┊47┊      db = await pool.connect();
+┊  ┊48┊    }
+┊  ┊49┊
+┊  ┊50┊    return {
+┊  ┊51┊      pubsub,
+┊  ┊52┊      res,
+┊  ┊53┊      db,
+┊  ┊54┊    };
+┊  ┊55┊  },
+┊  ┊56┊});
```

##### Changed modules&#x2F;users&#x2F;index.ts
```diff
@@ -1,12 +1,16 @@
+┊  ┊ 1┊import { GraphQLModule } from '@graphql-modules/core';
 ┊ 1┊ 2┊import { gql } from 'apollo-server-express';
+┊  ┊ 3┊import cookie from 'cookie';
 ┊ 2┊ 4┊import sql from 'sql-template-strings';
 ┊ 3┊ 5┊import bcrypt from 'bcrypt';
 ┊ 4┊ 6┊import jwt from 'jsonwebtoken';
+┊  ┊ 7┊import commonModule from '../common';
 ┊ 5┊ 8┊import { secret, expiration } from '../../env';
+┊  ┊ 9┊import { pool } from '../../db';
 ┊ 6┊10┊import { validateLength, validatePassword } from '../../validators';
 ┊ 7┊11┊import { Resolvers } from '../../types/graphql';
 ┊ 8┊12┊
-┊ 9┊  ┊export const typeDefs = gql`
+┊  ┊13┊const typeDefs = gql`
 ┊10┊14┊  type User {
 ┊11┊15┊    id: ID!
 ┊12┊16┊    name: String!
```
```diff
@@ -29,7 +33,7 @@
 ┊29┊33┊  }
 ┊30┊34┊`;
 ┊31┊35┊
-┊32┊  ┊export const resolvers: Resolvers = {
+┊  ┊36┊const resolvers: Resolvers = {
 ┊33┊37┊  Query: {
 ┊34┊38┊    me(root, args, { currentUser }) {
 ┊35┊39┊      return currentUser || null;
```
```diff
@@ -98,3 +102,38 @@
 ┊ 98┊102┊    },
 ┊ 99┊103┊  },
 ┊100┊104┊};
+┊   ┊105┊
+┊   ┊106┊export default new GraphQLModule({
+┊   ┊107┊  name: 'users',
+┊   ┊108┊  typeDefs,
+┊   ┊109┊  resolvers,
+┊   ┊110┊  imports: () => [commonModule],
+┊   ┊111┊  async context(session) {
+┊   ┊112┊    let currentUser;
+┊   ┊113┊
+┊   ┊114┊    // Access the request object
+┊   ┊115┊    let req = session.connection
+┊   ┊116┊      ? session.connection.context.request
+┊   ┊117┊      : session.req;
+┊   ┊118┊
+┊   ┊119┊    // It's subscription
+┊   ┊120┊    if (session.connection) {
+┊   ┊121┊      req.cookies = cookie.parse(req.headers.cookie || '');
+┊   ┊122┊    }
+┊   ┊123┊
+┊   ┊124┊    if (req.cookies.authToken) {
+┊   ┊125┊      const username = jwt.verify(req.cookies.authToken, secret) as string;
+┊   ┊126┊
+┊   ┊127┊      if (username) {
+┊   ┊128┊        const { rows } = await pool.query(
+┊   ┊129┊          sql`SELECT * FROM users WHERE username = ${username}`
+┊   ┊130┊        );
+┊   ┊131┊        currentUser = rows[0];
+┊   ┊132┊      }
+┊   ┊133┊    }
+┊   ┊134┊
+┊   ┊135┊    return {
+┊   ┊136┊      currentUser,
+┊   ┊137┊    };
+┊   ┊138┊  },
+┊   ┊139┊});
```

[}]: #

[{]: <helper> (diffStep "13.3" files="context.ts" module="server")

#### [__Server__ Step 13.3: Use GraphQL Modules](https://github.com/Urigo/WhatsApp-Clone-Server/commit/8193caf7dba5feb36388975144061a221b119822)



[}]: #

[{]: <helper> (diffStep "13.3" files="modules/chats/index.ts" module="server")

#### [__Server__ Step 13.3: Use GraphQL Modules](https://github.com/Urigo/WhatsApp-Clone-Server/commit/8193caf7dba5feb36388975144061a221b119822)

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -1,9 +1,12 @@
+┊  ┊ 1┊import { GraphQLModule } from '@graphql-modules/core';
 ┊ 1┊ 2┊import { gql, withFilter } from 'apollo-server-express';
 ┊ 2┊ 3┊import sql from 'sql-template-strings';
+┊  ┊ 4┊import commonModule from '../common';
+┊  ┊ 5┊import usersModule from '../users';
 ┊ 3┊ 6┊import { Message, Chat, pool } from '../../db';
 ┊ 4┊ 7┊import { Resolvers } from '../../types/graphql';
 ┊ 5┊ 8┊
-┊ 6┊  ┊export const typeDefs = gql`
+┊  ┊ 9┊const typeDefs = gql`
 ┊ 7┊10┊  type Message {
 ┊ 8┊11┊    id: ID!
 ┊ 9┊12┊    content: String!
```
```diff
@@ -41,7 +44,7 @@
 ┊41┊44┊  }
 ┊42┊45┊`;
 ┊43┊46┊
-┊44┊  ┊export const resolvers: Resolvers = {
+┊  ┊47┊const resolvers: Resolvers = {
 ┊45┊48┊  Message: {
 ┊46┊49┊    createdAt(message) {
 ┊47┊50┊      return new Date(message.created_at);
```
```diff
@@ -323,3 +326,10 @@
 ┊323┊326┊    },
 ┊324┊327┊  },
 ┊325┊328┊};
+┊   ┊329┊
+┊   ┊330┊export default new GraphQLModule({
+┊   ┊331┊  name: 'chats',
+┊   ┊332┊  typeDefs,
+┊   ┊333┊  resolvers,
+┊   ┊334┊  imports: () => [commonModule, usersModule],
+┊   ┊335┊});
```

[}]: #

#### Dependency Injection in GraphQL Modules

The major feature of GraphQL Modules is the Dependency Injection. It's optional, you don't have to use it until it's really necessary. Even though WhatsApp clone doesn't need it yet, we're going to talk about DI and implement a simple thing, just for educational purpose.

If you're familiar with Dependency Injection then you will get it straight away. If not, please read about it here or here (**links**).

To start working with DI, we we need to install two packages:

yarn add @graphql-modules/di reflect-metadata

Let's now adjust the context type and import `reflect-metadata` into the project:

[{]: <helper> (diffStep "13.5" files="context.ts" module="server")

#### [__Server__ Step 13.5: Use Dependency Injection](https://github.com/Urigo/WhatsApp-Clone-Server/commit/029e3bf323456a82c0aa4e9a2e6341cc91ce7f9d)

##### Changed context.ts
```diff
@@ -1,13 +1,12 @@
 ┊ 1┊ 1┊import { PubSub } from 'apollo-server-express';
+┊  ┊ 2┊import { ModuleContext } from '@graphql-modules/core';
 ┊ 2┊ 3┊import { User } from './db';
 ┊ 3┊ 4┊import { Response } from 'express';
 ┊ 4┊ 5┊import { PoolClient } from 'pg';
-┊ 5┊  ┊import { UnsplashApi } from './modules/chats/unsplash.api';
 ┊ 6┊ 6┊
 ┊ 7┊ 7┊export type MyContext = {
 ┊ 8┊ 8┊  pubsub: PubSub;
 ┊ 9┊ 9┊  currentUser: User;
 ┊10┊10┊  res: Response;
 ┊11┊11┊  db: PoolClient;
-┊12┊  ┊  unsplashApi: UnsplashApi;
-┊13┊  ┊};
+┊  ┊12┊} & ModuleContext;
```

[}]: #

[{]: <helper> (diffStep "13.5" files="index.ts" module="server")

#### [__Server__ Step 13.5: Use Dependency Injection](https://github.com/Urigo/WhatsApp-Clone-Server/commit/029e3bf323456a82c0aa4e9a2e6341cc91ce7f9d)

##### Changed index.ts
```diff
@@ -1,3 +1,4 @@
+┊ ┊1┊import 'reflect-metadata';
 ┊1┊2┊import { ApolloServer } from 'apollo-server-express';
 ┊2┊3┊import { GraphQLModule } from '@graphql-modules/core';
 ┊3┊4┊import http from 'http';
```

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -11,7 +11,7 @@
 ┊11┊11┊  type Message {
 ┊12┊12┊    id: ID!
 ┊13┊13┊    content: String!
-┊14┊  ┊    createdAt: Date!
+┊  ┊14┊    createdAt: DateTime!
 ┊15┊15┊    chat: Chat
 ┊16┊16┊    sender: User
 ┊17┊17┊    recipient: User
```
```diff
@@ -94,7 +94,7 @@
 ┊ 94┊ 94┊      return participant ? participant.name : null;
 ┊ 95┊ 95┊    },
 ┊ 96┊ 96┊
-┊ 97┊   ┊    async picture(chat, args, { currentUser, db, unsplashApi }) {
+┊   ┊ 97┊    async picture(chat, args, { currentUser, db, injector }) {
 ┊ 98┊ 98┊      if (!currentUser) return null;
 ┊ 99┊ 99┊
 ┊100┊100┊      const { rows } = await db.query(sql`
```
```diff
@@ -107,7 +107,7 @@
 ┊107┊107┊
 ┊108┊108┊      return participant && participant.picture
 ┊109┊109┊        ? participant.picture
-┊110┊   ┊        : unsplashApi.getRandomPhoto();
+┊   ┊110┊        : injector.get(UnsplashApi).getRandomPhoto();
 ┊111┊111┊    },
 ┊112┊112┊
 ┊113┊113┊    async messages(chat, args, { db }) {
```
```diff
@@ -333,9 +333,5 @@
 ┊333┊333┊  typeDefs,
 ┊334┊334┊  resolvers,
 ┊335┊335┊  imports: () => [commonModule, usersModule],
-┊336┊   ┊  context() {
-┊337┊   ┊    return {
-┊338┊   ┊      unsplashApi: new UnsplashApi(),
-┊339┊   ┊    };
-┊340┊   ┊  },
+┊   ┊336┊  providers: () => [UnsplashApi],
 ┊341┊337┊});
```

##### Changed modules&#x2F;common&#x2F;index.ts
```diff
@@ -7,7 +7,7 @@
 ┊ 7┊ 7┊const { PostgresPubSub } = require('graphql-postgres-subscriptions');
 ┊ 8┊ 8┊
 ┊ 9┊ 9┊const typeDefs = gql`
-┊10┊  ┊  scalar Date
+┊  ┊10┊  scalar DateTime
 ┊11┊11┊  scalar URL
 ┊12┊12┊
 ┊13┊13┊  type Query {
```
```diff
@@ -24,7 +24,7 @@
 ┊24┊24┊`;
 ┊25┊25┊
 ┊26┊26┊const resolvers: Resolvers = {
-┊27┊  ┊  Date: DateTimeResolver,
+┊  ┊27┊  DateTime: DateTimeResolver,
 ┊28┊28┊  URL: URLResolver,
 ┊29┊29┊};
 ┊30┊30┊
```

[}]: #

In short, Iependency Injection will instantiate classes, manage dependencies between them and so on and in addition to that, the GraphQL Modules allows to define when each provider / class should be created. We call it scopes.

- Application scope - provider is created when application starts (default)
- Session - providers are constructed in the beginning of the network request, then kept until the network request is closed
- Request - creates an instance each time you request it from the injector

Because our `UnsplashApi` doesn't have to be recreated on every request, we can easily use Application scope, which is the default. The `Injectable` decorator is just to attach some metadata to the class.

[{]: <helper> (diffStep "13.5" files="modules/chats/unsplash.api.ts" module="server")

#### [__Server__ Step 13.5: Use Dependency Injection](https://github.com/Urigo/WhatsApp-Clone-Server/commit/029e3bf323456a82c0aa4e9a2e6341cc91ce7f9d)

##### Changed modules&#x2F;chats&#x2F;unsplash.api.ts
```diff
@@ -1,3 +1,4 @@
+┊ ┊1┊import { Injectable, ProviderScope } from '@graphql-modules/di';
 ┊1┊2┊import { resolve } from 'path';
 ┊2┊3┊import axios from 'axios';
 ┊3┊4┊import { trackProvider } from '@safe-api/middleware';
```
```diff
@@ -8,6 +9,9 @@
 ┊ 8┊ 9┊  orientation: 'landscape' | 'portrait' | 'squarish';
 ┊ 9┊10┊}
 ┊10┊11┊
+┊  ┊12┊@Injectable({
+┊  ┊13┊  scope: ProviderScope.Application,
+┊  ┊14┊})
 ┊11┊15┊export class UnsplashApi {
 ┊12┊16┊  baseURL = 'https://api.unsplash.com/';
 ┊13┊17┊
```

[}]: #

Here's how to register the UnsplashApi provider in Chats module:

[{]: <helper> (diffStep "13.5" files="modules/chats/index.ts" module="server")

#### [__Server__ Step 13.5: Use Dependency Injection](https://github.com/Urigo/WhatsApp-Clone-Server/commit/029e3bf323456a82c0aa4e9a2e6341cc91ce7f9d)

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -11,7 +11,7 @@
 ┊11┊11┊  type Message {
 ┊12┊12┊    id: ID!
 ┊13┊13┊    content: String!
-┊14┊  ┊    createdAt: Date!
+┊  ┊14┊    createdAt: DateTime!
 ┊15┊15┊    chat: Chat
 ┊16┊16┊    sender: User
 ┊17┊17┊    recipient: User
```
```diff
@@ -94,7 +94,7 @@
 ┊ 94┊ 94┊      return participant ? participant.name : null;
 ┊ 95┊ 95┊    },
 ┊ 96┊ 96┊
-┊ 97┊   ┊    async picture(chat, args, { currentUser, db, unsplashApi }) {
+┊   ┊ 97┊    async picture(chat, args, { currentUser, db, injector }) {
 ┊ 98┊ 98┊      if (!currentUser) return null;
 ┊ 99┊ 99┊
 ┊100┊100┊      const { rows } = await db.query(sql`
```
```diff
@@ -107,7 +107,7 @@
 ┊107┊107┊
 ┊108┊108┊      return participant && participant.picture
 ┊109┊109┊        ? participant.picture
-┊110┊   ┊        : unsplashApi.getRandomPhoto();
+┊   ┊110┊        : injector.get(UnsplashApi).getRandomPhoto();
 ┊111┊111┊    },
 ┊112┊112┊
 ┊113┊113┊    async messages(chat, args, { db }) {
```
```diff
@@ -333,9 +333,5 @@
 ┊333┊333┊  typeDefs,
 ┊334┊334┊  resolvers,
 ┊335┊335┊  imports: () => [commonModule, usersModule],
-┊336┊   ┊  context() {
-┊337┊   ┊    return {
-┊338┊   ┊      unsplashApi: new UnsplashApi(),
-┊339┊   ┊    };
-┊340┊   ┊  },
+┊   ┊336┊  providers: () => [UnsplashApi],
 ┊341┊337┊});
```

[}]: #

Please also take a look at `injector.get(UnsplashApi)` part. There's `injector` instance in every module's context that allows to consume providers and everything that is defined within DI. You simply pass a class / token to the `get` method and GraphQL Modules takes care of the rest.

**What are the benefits of DI?**

You can have a different implementation of Users based on the same interface. Maybe right now you're using PostgreSQL but at some point a project will be migrated to MongoDB. You could do it through GraphQL context, of course but with Dependency Injection, GraphQL Modules is able to tell you exactly what's missing and where. It reduces boiler plate because instantiation is done by the injector, code is loosely coupled.

Helps maintainability but also comes with few disadvantages. It's a bit complex concept to learn and what could be done on compile time (TypeScript) is moved to run-time.

You might find DI useful while testing. Let's say you want to test a query that involves `UnsplashApi` provider, you simply replace it with a mocked version without touching the context or internals and you get the expected result every single time.

We know there's only one provider by far, the `UnsplashApi`, but we're going to implement more and more in following steps.

#### Continuing with DI

We want to have everything easily accesible and DI helps with that so let's move on and continue migrating things.

One of the shared objects is database connection and we're going to create a Database provider:

[{]: <helper> (diffStep "13.6" files="modules/common/database.provider.ts" module="server")

#### [__Server__ Step 13.6: Define Database provider](https://github.com/Urigo/WhatsApp-Clone-Server/commit/6bca55b13a049eadb8cafcd0d5e3a041d5f7fce5)

##### Added modules&#x2F;common&#x2F;database.provider.ts
```diff
@@ -0,0 +1,26 @@
+┊  ┊ 1┊import { Injectable, ProviderScope } from '@graphql-modules/di';
+┊  ┊ 2┊import { OnResponse } from '@graphql-modules/core';
+┊  ┊ 3┊import { Pool, PoolClient } from 'pg';
+┊  ┊ 4┊
+┊  ┊ 5┊@Injectable({
+┊  ┊ 6┊  scope: ProviderScope.Session,
+┊  ┊ 7┊})
+┊  ┊ 8┊export class Database implements OnResponse {
+┊  ┊ 9┊  private instance: PoolClient;
+┊  ┊10┊
+┊  ┊11┊  constructor(private pool: Pool) {}
+┊  ┊12┊
+┊  ┊13┊  async onRequest() {
+┊  ┊14┊    this.instance = await this.pool.connect();
+┊  ┊15┊  }
+┊  ┊16┊
+┊  ┊17┊  onResponse() {
+┊  ┊18┊    if (this.instance) {
+┊  ┊19┊      this.instance.release();
+┊  ┊20┊    }
+┊  ┊21┊  }
+┊  ┊22┊
+┊  ┊23┊  async getClient() {
+┊  ┊24┊    return this.instance;
+┊  ┊25┊  }
+┊  ┊26┊}
```

[}]: #

Things we did there:
- Session scope was used, which makes sure our provider is created and destroyed on every GraphQL Operation
- `onRequest` hook is called when a GraphQL Operation starts and we create a database connection in it.
- `onResponse` hook is triggered when GraphQL Response is about to be sent to the consumer, so we destroy the connection there.
- `getClient` method exposes the connection
- `Pool` in constructor means we expect `Pool` to be injected into `Database` provider.

Now we can define `Pool` token and register `Database`:

[{]: <helper> (diffStep "13.6" files="modules/common/index.ts" module="server")

#### [__Server__ Step 13.6: Define Database provider](https://github.com/Urigo/WhatsApp-Clone-Server/commit/6bca55b13a049eadb8cafcd0d5e3a041d5f7fce5)

##### Changed modules&#x2F;common&#x2F;index.ts
```diff
@@ -1,8 +1,10 @@
 ┊ 1┊ 1┊import { GraphQLModule } from '@graphql-modules/core';
 ┊ 2┊ 2┊import { gql } from 'apollo-server-express';
 ┊ 3┊ 3┊import { DateTimeResolver, URLResolver } from 'graphql-scalars';
+┊  ┊ 4┊import { Pool } from 'pg';
 ┊ 4┊ 5┊import { pool } from '../../db';
 ┊ 5┊ 6┊import { Resolvers } from '../../types/graphql';
+┊  ┊ 7┊import { Database } from './database.provider';
 ┊ 6┊ 8┊
 ┊ 7┊ 9┊const { PostgresPubSub } = require('graphql-postgres-subscriptions');
 ┊ 8┊10┊
```
```diff
@@ -40,6 +42,13 @@
 ┊40┊42┊  name: 'common',
 ┊41┊43┊  typeDefs,
 ┊42┊44┊  resolvers,
+┊  ┊45┊  providers: () => [
+┊  ┊46┊    {
+┊  ┊47┊      provide: Pool,
+┊  ┊48┊      useValue: pool,
+┊  ┊49┊    },
+┊  ┊50┊    Database,
+┊  ┊51┊  ],
 ┊43┊52┊  async context({ res, connection }) {
 ┊44┊53┊    let db;
```

[}]: #

[{]: <helper> (diffStep "13.6" files="modules/index.ts" module="server")

#### [__Server__ Step 13.6: Define Database provider](https://github.com/Urigo/WhatsApp-Clone-Server/commit/6bca55b13a049eadb8cafcd0d5e3a041d5f7fce5)



[}]: #

#### Creating Users and Chats services

It's not really recommended to put logic in resolvers so we're going to create a layer with business logic. A good example of that are Users and Chats modules so let's start with the former.

We're going to create `Users` service and move `Query.users` logic into `findAllExcept` method:

[{]: <helper> (diffStep "13.7" files="modules/users/users.provider.ts,modules/users/index.ts" module="server")

#### [__Server__ Step 13.7: Basic User provider](https://github.com/Urigo/WhatsApp-Clone-Server/commit/29bddafbfb56c3ded9d39a65fea471dbab58d295)

##### Changed modules&#x2F;users&#x2F;index.ts
```diff
@@ -9,6 +9,7 @@
 ┊ 9┊ 9┊import { pool } from '../../db';
 ┊10┊10┊import { validateLength, validatePassword } from '../../validators';
 ┊11┊11┊import { Resolvers } from '../../types/graphql';
+┊  ┊12┊import { Users } from './users.provider';
 ┊12┊13┊
 ┊13┊14┊const typeDefs = gql`
 ┊14┊15┊  type User {
```
```diff
@@ -38,14 +39,10 @@
 ┊38┊39┊    me(root, args, { currentUser }) {
 ┊39┊40┊      return currentUser || null;
 ┊40┊41┊    },
-┊41┊  ┊    async users(root, args, { currentUser, db }) {
+┊  ┊42┊    async users(root, args, { currentUser, injector }) {
 ┊42┊43┊      if (!currentUser) return [];
 ┊43┊44┊
-┊44┊  ┊      const { rows } = await db.query(sql`
-┊45┊  ┊        SELECT * FROM users WHERE users.id != ${currentUser.id}
-┊46┊  ┊      `);
-┊47┊  ┊
-┊48┊  ┊      return rows;
+┊  ┊45┊      return injector.get(Users).findAllExcept(currentUser.id);
 ┊49┊46┊    },
 ┊50┊47┊  },
 ┊51┊48┊  Mutation: {
```
```diff
@@ -108,6 +105,7 @@
 ┊108┊105┊  typeDefs,
 ┊109┊106┊  resolvers,
 ┊110┊107┊  imports: () => [commonModule],
+┊   ┊108┊  providers: () => [Users],
 ┊111┊109┊  async context(session) {
 ┊112┊110┊    let currentUser;
 ┊113┊111┊
```

##### Added modules&#x2F;users&#x2F;users.provider.ts
```diff
@@ -0,0 +1,19 @@
+┊  ┊ 1┊import { Injectable, Inject, ProviderScope } from '@graphql-modules/di';
+┊  ┊ 2┊import sql from 'sql-template-strings';
+┊  ┊ 3┊import { Database } from '../common/database.provider';
+┊  ┊ 4┊
+┊  ┊ 5┊@Injectable({
+┊  ┊ 6┊  scope: ProviderScope.Session,
+┊  ┊ 7┊})
+┊  ┊ 8┊export class Users {
+┊  ┊ 9┊  @Inject() private db: Database;
+┊  ┊10┊
+┊  ┊11┊  async findAllExcept(userId: string) {
+┊  ┊12┊    const db = await this.db.getClient();
+┊  ┊13┊    const { rows } = await db.query(
+┊  ┊14┊      sql`SELECT * FROM users WHERE id != ${userId}`
+┊  ┊15┊    );
+┊  ┊16┊
+┊  ┊17┊    return rows;
+┊  ┊18┊  }
+┊  ┊19┊}
```

[}]: #

A very interesting thing to notice is `@Inject()` decorator.

```ts
@Inject() private db: Database;
```

The @Inject, well... injects `Database` provider as `db` property so you don't have to use the `constructor`.

Back to the Users service. It's very similar to what we did with the `UnsplashApi` so let's move on and implement more methods.

[{]: <helper> (diffStep "13.8" module="server")

#### [__Server__ Step 13.8: Implement newUser and findByUsername](https://github.com/Urigo/WhatsApp-Clone-Server/commit/171cdd718fcb4b892fe0759089269b50e612a274)

##### Changed modules&#x2F;users&#x2F;index.ts
```diff
@@ -46,11 +46,8 @@
 ┊46┊46┊    },
 ┊47┊47┊  },
 ┊48┊48┊  Mutation: {
-┊49┊  ┊    async signIn(root, { username, password }, { db, res }) {
-┊50┊  ┊      const { rows } = await db.query(
-┊51┊  ┊        sql`SELECT * FROM users WHERE username = ${username}`
-┊52┊  ┊      );
-┊53┊  ┊      const user = rows[0];
+┊  ┊49┊    async signIn(root, { username, password }, { injector, res }) {
+┊  ┊50┊      const user = await injector.get(Users).findByUsername(username);
 ┊54┊51┊
 ┊55┊52┊      if (!user) {
 ┊56┊53┊        throw new Error('user not found');
```
```diff
@@ -69,7 +66,11 @@
 ┊69┊66┊      return user;
 ┊70┊67┊    },
 ┊71┊68┊
-┊72┊  ┊    async signUp(root, { name, username, password, passwordConfirm }, { db }) {
+┊  ┊69┊    async signUp(
+┊  ┊70┊      root,
+┊  ┊71┊      { name, username, password, passwordConfirm },
+┊  ┊72┊      { injector }
+┊  ┊73┊    ) {
 ┊73┊74┊      validateLength('req.name', name, 3, 50);
 ┊74┊75┊      validateLength('req.username', username, 3, 18);
 ┊75┊76┊      validatePassword('req.password', password);
```
```diff
@@ -78,24 +79,18 @@
 ┊ 78┊ 79┊        throw Error("req.password and req.passwordConfirm don't match");
 ┊ 79┊ 80┊      }
 ┊ 80┊ 81┊
-┊ 81┊   ┊      const existingUserQuery = await db.query(
-┊ 82┊   ┊        sql`SELECT * FROM users WHERE username = ${username}`
-┊ 83┊   ┊      );
-┊ 84┊   ┊      if (existingUserQuery.rows[0]) {
+┊   ┊ 82┊      const existingUser = await injector.get(Users).findByUsername(username);
+┊   ┊ 83┊      if (existingUser) {
 ┊ 85┊ 84┊        throw Error('username already exists');
 ┊ 86┊ 85┊      }
 ┊ 87┊ 86┊
-┊ 88┊   ┊      const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(8));
+┊   ┊ 87┊      const createdUser = await injector.get(Users).newUser({
+┊   ┊ 88┊        username,
+┊   ┊ 89┊        password,
+┊   ┊ 90┊        name,
+┊   ┊ 91┊      });
 ┊ 89┊ 92┊
-┊ 90┊   ┊      const createdUserQuery = await db.query(sql`
-┊ 91┊   ┊        INSERT INTO users(password, picture, username, name)
-┊ 92┊   ┊        VALUES(${passwordHash}, '', ${username}, ${name})
-┊ 93┊   ┊        RETURNING *
-┊ 94┊   ┊      `);
-┊ 95┊   ┊
-┊ 96┊   ┊      const user = createdUserQuery.rows[0];
-┊ 97┊   ┊
-┊ 98┊   ┊      return user;
+┊   ┊ 93┊      return createdUser;
 ┊ 99┊ 94┊    },
 ┊100┊ 95┊  },
 ┊101┊ 96┊};
```

##### Changed modules&#x2F;users&#x2F;users.provider.ts
```diff
@@ -1,7 +1,10 @@
 ┊ 1┊ 1┊import { Injectable, Inject, ProviderScope } from '@graphql-modules/di';
 ┊ 2┊ 2┊import sql from 'sql-template-strings';
+┊  ┊ 3┊import bcrypt from 'bcrypt';
 ┊ 3┊ 4┊import { Database } from '../common/database.provider';
 ┊ 4┊ 5┊
+┊  ┊ 6┊const DEFAULT_PROFILE_PIC = 'https://raw.githubusercontent.com/Urigo/WhatsApp-Clone-Client-React/legacy/public/assets/default-profile-pic.jpg'
+┊  ┊ 7┊
 ┊ 5┊ 8┊@Injectable({
 ┊ 6┊ 9┊  scope: ProviderScope.Session,
 ┊ 7┊10┊})
```
```diff
@@ -16,4 +19,34 @@
 ┊16┊19┊
 ┊17┊20┊    return rows;
 ┊18┊21┊  }
+┊  ┊22┊
+┊  ┊23┊  async findByUsername(username: string) {
+┊  ┊24┊    const db = await this.db.getClient();
+┊  ┊25┊    const { rows } = await db.query(
+┊  ┊26┊      sql`SELECT * FROM users WHERE username = ${username}`
+┊  ┊27┊    );
+┊  ┊28┊
+┊  ┊29┊    return rows[0] || null;
+┊  ┊30┊  }
+┊  ┊31┊
+┊  ┊32┊  async newUser({
+┊  ┊33┊    username,
+┊  ┊34┊    name,
+┊  ┊35┊    password,
+┊  ┊36┊  }: {
+┊  ┊37┊    username: string;
+┊  ┊38┊    name: string;
+┊  ┊39┊    password: string;
+┊  ┊40┊  }) {
+┊  ┊41┊    const db = await this.db.getClient();
+┊  ┊42┊    const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(8));
+┊  ┊43┊    const createdUserQuery = await db.query(sql`
+┊  ┊44┊        INSERT INTO users(password, picture, username, name)
+┊  ┊45┊        VALUES(${passwordHash}, ${DEFAULT_PROFILE_PIC}, ${username}, ${name})
+┊  ┊46┊        RETURNING *
+┊  ┊47┊      `);
+┊  ┊48┊    const user = createdUserQuery.rows[0];
+┊  ┊49┊
+┊  ┊50┊    return user;
+┊  ┊51┊  }
 ┊19┊52┊}
```

[}]: #
[{]: <helper> (diffStep "13.9" module="server")

#### [__Server__ Step 13.9: Implement findById and use in Chats module](https://github.com/Urigo/WhatsApp-Clone-Server/commit/1b45f4f5c7bc7d96fcc5bb0136d1a4527da66190)

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -6,6 +6,7 @@
 ┊ 6┊ 6┊import { Message, Chat, pool } from '../../db';
 ┊ 7┊ 7┊import { Resolvers } from '../../types/graphql';
 ┊ 8┊ 8┊import { UnsplashApi } from './unsplash.api';
+┊  ┊ 9┊import { Users } from './../users/users.provider';
 ┊ 9┊10┊
 ┊10┊11┊const typeDefs = gql`
 ┊11┊12┊  type Message {
```
```diff
@@ -58,11 +59,8 @@
 ┊58┊59┊      return rows[0] || null;
 ┊59┊60┊    },
 ┊60┊61┊
-┊61┊  ┊    async sender(message, args, { db }) {
-┊62┊  ┊      const { rows } = await db.query(sql`
-┊63┊  ┊        SELECT * FROM users WHERE id = ${message.sender_user_id}
-┊64┊  ┊      `);
-┊65┊  ┊      return rows[0] || null;
+┊  ┊62┊    async sender(message, args, { injector }) {
+┊  ┊63┊      return injector.get(Users).findById(message.sender_user_id);
 ┊66┊64┊    },
 ┊67┊65┊
 ┊68┊66┊    async recipient(message, args, { db }) {
```

##### Changed modules&#x2F;users&#x2F;users.provider.ts
```diff
@@ -11,6 +11,15 @@
 ┊11┊11┊export class Users {
 ┊12┊12┊  @Inject() private db: Database;
 ┊13┊13┊
+┊  ┊14┊  async findById(userId: string) {
+┊  ┊15┊    const db = await this.db.getClient();
+┊  ┊16┊    const { rows } = await db.query(
+┊  ┊17┊      sql`SELECT * FROM users WHERE id = ${userId}`
+┊  ┊18┊    );
+┊  ┊19┊
+┊  ┊20┊    return rows[0] || null;
+┊  ┊21┊  }
+┊  ┊22┊
 ┊14┊23┊  async findAllExcept(userId: string) {
 ┊15┊24┊    const db = await this.db.getClient();
 ┊16┊25┊    const { rows } = await db.query(
```

[}]: #

Let's now implement `Chats` service with two basic methods:

[{]: <helper> (diffStep "13.10" module="server")

#### [__Server__ Step 13.10: Basic Chats provider](https://github.com/Urigo/WhatsApp-Clone-Server/commit/400d12d9cd499adbf57b07d7bfd76da2a659bf36)

##### Added modules&#x2F;chats&#x2F;chats.provider.ts
```diff
@@ -0,0 +1,34 @@
+┊  ┊ 1┊import { Injectable, Inject, ProviderScope } from '@graphql-modules/di';
+┊  ┊ 2┊import sql from 'sql-template-strings';
+┊  ┊ 3┊import { Database } from '../common/database.provider';
+┊  ┊ 4┊
+┊  ┊ 5┊@Injectable({
+┊  ┊ 6┊  scope: ProviderScope.Session,
+┊  ┊ 7┊})
+┊  ┊ 8┊export class Chats {
+┊  ┊ 9┊  @Inject() private db: Database;
+┊  ┊10┊
+┊  ┊11┊  async findChatsByUser(userId: string) {
+┊  ┊12┊    const db = await this.db.getClient();
+┊  ┊13┊
+┊  ┊14┊    const { rows } = await db.query(sql`
+┊  ┊15┊      SELECT chats.* FROM chats, chats_users
+┊  ┊16┊      WHERE chats.id = chats_users.chat_id
+┊  ┊17┊      AND chats_users.user_id = ${userId}
+┊  ┊18┊    `);
+┊  ┊19┊
+┊  ┊20┊    return rows;
+┊  ┊21┊  }
+┊  ┊22┊
+┊  ┊23┊  async findChatByUser({ chatId, userId }: { chatId: string; userId: string }) {
+┊  ┊24┊    const db = await this.db.getClient();
+┊  ┊25┊    const { rows } = await db.query(sql`
+┊  ┊26┊      SELECT chats.* FROM chats, chats_users
+┊  ┊27┊      WHERE chats_users.chat_id = ${chatId}
+┊  ┊28┊      AND chats.id = chats_users.chat_id
+┊  ┊29┊      AND chats_users.user_id = ${userId}
+┊  ┊30┊    `);
+┊  ┊31┊
+┊  ┊32┊    return rows[0] || null;
+┊  ┊33┊  }
+┊  ┊34┊}
```

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -7,6 +7,7 @@
 ┊ 7┊ 7┊import { Resolvers } from '../../types/graphql';
 ┊ 8┊ 8┊import { UnsplashApi } from './unsplash.api';
 ┊ 9┊ 9┊import { Users } from './../users/users.provider';
+┊  ┊10┊import { Chats } from './chats.provider';
 ┊10┊11┊
 ┊11┊12┊const typeDefs = gql`
 ┊12┊13┊  type Message {
```
```diff
@@ -138,29 +139,18 @@
 ┊138┊139┊  },
 ┊139┊140┊
 ┊140┊141┊  Query: {
-┊141┊   ┊    async chats(root, args, { currentUser, db }) {
+┊   ┊142┊    async chats(root, args, { currentUser, injector }) {
 ┊142┊143┊      if (!currentUser) return [];
 ┊143┊144┊
-┊144┊   ┊      const { rows } = await db.query(sql`
-┊145┊   ┊        SELECT chats.* FROM chats, chats_users
-┊146┊   ┊        WHERE chats.id = chats_users.chat_id
-┊147┊   ┊        AND chats_users.user_id = ${currentUser.id}
-┊148┊   ┊      `);
-┊149┊   ┊
-┊150┊   ┊      return rows;
+┊   ┊145┊      return injector.get(Chats).findChatsByUser(currentUser.id);
 ┊151┊146┊    },
 ┊152┊147┊
-┊153┊   ┊    async chat(root, { chatId }, { currentUser, db }) {
+┊   ┊148┊    async chat(root, { chatId }, { currentUser, injector }) {
 ┊154┊149┊      if (!currentUser) return null;
 ┊155┊150┊
-┊156┊   ┊      const { rows } = await db.query(sql`
-┊157┊   ┊        SELECT chats.* FROM chats, chats_users
-┊158┊   ┊        WHERE chats_users.chat_id = ${chatId}
-┊159┊   ┊        AND chats.id = chats_users.chat_id
-┊160┊   ┊        AND chats_users.user_id = ${currentUser.id}
-┊161┊   ┊      `);
-┊162┊   ┊
-┊163┊   ┊      return rows[0] ? rows[0] : null;
+┊   ┊151┊      return injector
+┊   ┊152┊        .get(Chats)
+┊   ┊153┊        .findChatByUser({ chatId, userId: currentUser.id });
 ┊164┊154┊    },
 ┊165┊155┊  },
 ┊166┊156┊
```
```diff
@@ -331,5 +321,5 @@
 ┊331┊321┊  typeDefs,
 ┊332┊322┊  resolvers,
 ┊333┊323┊  imports: () => [commonModule, usersModule],
-┊334┊   ┊  providers: () => [UnsplashApi],
+┊   ┊324┊  providers: () => [UnsplashApi, Chats],
 ┊335┊325┊});
```

[}]: #

It looks exatly like `Users` and also has only `database` provider in it.

We're going to move on and more things:

[{]: <helper> (diffStep "13.11" module="server")

#### [__Server__ Step 13.11: Implement findChatById](https://github.com/Urigo/WhatsApp-Clone-Server/commit/f81308928899928da6712758f2507f5ac515330e)

##### Changed modules&#x2F;chats&#x2F;chats.provider.ts
```diff
@@ -31,4 +31,12 @@
 ┊31┊31┊
 ┊32┊32┊    return rows[0] || null;
 ┊33┊33┊  }
+┊  ┊34┊
+┊  ┊35┊  async findChatById(chatId: string) {
+┊  ┊36┊    const db = await this.db.getClient();
+┊  ┊37┊    const { rows } = await db.query(sql`
+┊  ┊38┊      SELECT * FROM chats WHERE id = ${chatId}
+┊  ┊39┊    `);
+┊  ┊40┊    return rows[0] || null;
+┊  ┊41┊  }
 ┊34┊42┊}
```

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -53,11 +53,8 @@
 ┊53┊53┊      return new Date(message.created_at);
 ┊54┊54┊    },
 ┊55┊55┊
-┊56┊  ┊    async chat(message, args, { db }) {
-┊57┊  ┊      const { rows } = await db.query(sql`
-┊58┊  ┊        SELECT * FROM chats WHERE id = ${message.chat_id}
-┊59┊  ┊      `);
-┊60┊  ┊      return rows[0] || null;
+┊  ┊56┊    async chat(message, args, { injector }) {
+┊  ┊57┊      return injector.get(Chats).findChatById(message.chat_id);
 ┊61┊58┊    },
 ┊62┊59┊
 ┊63┊60┊    async sender(message, args, { injector }) {
```

[}]: #
[{]: <helper> (diffStep "13.12" module="server")

#### [__Server__ Step 13.12: Find chat&#x27;s messages](https://github.com/Urigo/WhatsApp-Clone-Server/commit/53fea198629fc7e50c8853de132f9ae233a647d6)

##### Changed modules&#x2F;chats&#x2F;chats.provider.ts
```diff
@@ -39,4 +39,25 @@
 ┊39┊39┊    `);
 ┊40┊40┊    return rows[0] || null;
 ┊41┊41┊  }
+┊  ┊42┊
+┊  ┊43┊  async findMessagesByChat(chatId: string) {
+┊  ┊44┊    const db = await this.db.getClient();
+┊  ┊45┊    const { rows } = await db.query(
+┊  ┊46┊      sql`SELECT * FROM messages WHERE chat_id = ${chatId}`
+┊  ┊47┊    );
+┊  ┊48┊
+┊  ┊49┊    return rows;
+┊  ┊50┊  }
+┊  ┊51┊
+┊  ┊52┊  async lastMessage(chatId: string) {
+┊  ┊53┊    const db = await this.db.getClient();
+┊  ┊54┊    const { rows } = await db.query(sql`
+┊  ┊55┊      SELECT * FROM messages
+┊  ┊56┊      WHERE chat_id = ${chatId}
+┊  ┊57┊      ORDER BY created_at DESC
+┊  ┊58┊      LIMIT 1
+┊  ┊59┊    `);
+┊  ┊60┊
+┊  ┊61┊    return rows[0];
+┊  ┊62┊  }
 ┊42┊63┊}
```

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -106,22 +106,12 @@
 ┊106┊106┊        : injector.get(UnsplashApi).getRandomPhoto();
 ┊107┊107┊    },
 ┊108┊108┊
-┊109┊   ┊    async messages(chat, args, { db }) {
-┊110┊   ┊      const { rows } = await db.query(
-┊111┊   ┊        sql`SELECT * FROM messages WHERE chat_id = ${chat.id}`
-┊112┊   ┊      );
-┊113┊   ┊
-┊114┊   ┊      return rows;
+┊   ┊109┊    async messages(chat, args, { injector }) {
+┊   ┊110┊      return injector.get(Chats).findMessagesByChat(chat.id);
 ┊115┊111┊    },
 ┊116┊112┊
-┊117┊   ┊    async lastMessage(chat, args, { db }) {
-┊118┊   ┊      const { rows } = await db.query(sql`
-┊119┊   ┊        SELECT * FROM messages
-┊120┊   ┊        WHERE chat_id = ${chat.id}
-┊121┊   ┊        ORDER BY created_at DESC
-┊122┊   ┊        LIMIT 1`);
-┊123┊   ┊
-┊124┊   ┊      return rows[0];
+┊   ┊113┊    async lastMessage(chat, args, { injector }) {
+┊   ┊114┊      return injector.get(Chats).lastMessage(chat.id);
 ┊125┊115┊    },
 ┊126┊116┊
 ┊127┊117┊    async participants(chat, args, { db }) {
```

[}]: #
[{]: <helper> (diffStep "13.13" module="server")

#### [__Server__ Step 13.13: Find first participant](https://github.com/Urigo/WhatsApp-Clone-Server/commit/1a07a45579491f050daa88d87aaf2e2829ca3973)

##### Changed modules&#x2F;chats&#x2F;chats.provider.ts
```diff
@@ -60,4 +60,16 @@
 ┊60┊60┊
 ┊61┊61┊    return rows[0];
 ┊62┊62┊  }
+┊  ┊63┊
+┊  ┊64┊  async firstRecipient({ chatId, userId }: { chatId: string; userId: string }) {
+┊  ┊65┊    const db = await this.db.getClient();
+┊  ┊66┊    const { rows } = await db.query(sql`
+┊  ┊67┊      SELECT users.* FROM users, chats_users
+┊  ┊68┊      WHERE users.id != ${userId}
+┊  ┊69┊      AND users.id = chats_users.user_id
+┊  ┊70┊      AND chats_users.chat_id = ${chatId}
+┊  ┊71┊    `);
+┊  ┊72┊
+┊  ┊73┊    return rows[0] || null;
+┊  ┊74┊  }
 ┊63┊75┊}
```

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -61,13 +61,11 @@
 ┊61┊61┊      return injector.get(Users).findById(message.sender_user_id);
 ┊62┊62┊    },
 ┊63┊63┊
-┊64┊  ┊    async recipient(message, args, { db }) {
-┊65┊  ┊      const { rows } = await db.query(sql`
-┊66┊  ┊        SELECT users.* FROM users, chats_users
-┊67┊  ┊        WHERE chats_users.user_id != ${message.sender_user_id}
-┊68┊  ┊        AND chats_users.chat_id = ${message.chat_id}
-┊69┊  ┊      `);
-┊70┊  ┊      return rows[0] || null;
+┊  ┊64┊    async recipient(message, args, { injector }) {
+┊  ┊65┊      return injector.get(Chats).firstRecipient({
+┊  ┊66┊        chatId: message.chat_id,
+┊  ┊67┊        userId: message.sender_user_id,
+┊  ┊68┊      });
 ┊71┊69┊    },
 ┊72┊70┊
 ┊73┊71┊    isMine(message, args, { currentUser }) {
```
```diff
@@ -76,16 +74,13 @@
 ┊76┊74┊  },
 ┊77┊75┊
 ┊78┊76┊  Chat: {
-┊79┊  ┊    async name(chat, args, { currentUser, db }) {
+┊  ┊77┊    async name(chat, args, { currentUser, injector }) {
 ┊80┊78┊      if (!currentUser) return null;
 ┊81┊79┊
-┊82┊  ┊      const { rows } = await db.query(sql`
-┊83┊  ┊        SELECT users.* FROM users, chats_users
-┊84┊  ┊        WHERE users.id != ${currentUser.id}
-┊85┊  ┊        AND users.id = chats_users.user_id
-┊86┊  ┊        AND chats_users.chat_id = ${chat.id}`);
-┊87┊  ┊
-┊88┊  ┊      const participant = rows[0];
+┊  ┊80┊      const participant = await injector.get(Chats).firstRecipient({
+┊  ┊81┊        chatId: chat.id,
+┊  ┊82┊        userId: currentUser.id,
+┊  ┊83┊      });
 ┊89┊84┊
 ┊90┊85┊      return participant ? participant.name : null;
 ┊91┊86┊    },
```
```diff
@@ -93,13 +88,10 @@
 ┊ 93┊ 88┊    async picture(chat, args, { currentUser, db, injector }) {
 ┊ 94┊ 89┊      if (!currentUser) return null;
 ┊ 95┊ 90┊
-┊ 96┊   ┊      const { rows } = await db.query(sql`
-┊ 97┊   ┊        SELECT users.* FROM users, chats_users
-┊ 98┊   ┊        WHERE users.id != ${currentUser.id}
-┊ 99┊   ┊        AND users.id = chats_users.user_id
-┊100┊   ┊        AND chats_users.chat_id = ${chat.id}`);
-┊101┊   ┊
-┊102┊   ┊      const participant = rows[0];
+┊   ┊ 91┊      const participant = await injector.get(Chats).firstRecipient({
+┊   ┊ 92┊        chatId: chat.id,
+┊   ┊ 93┊        userId: currentUser.id,
+┊   ┊ 94┊      });
 ┊103┊ 95┊
 ┊104┊ 96┊      return participant && participant.picture
 ┊105┊ 97┊        ? participant.picture
```

[}]: #
[{]: <helper> (diffStep "13.14" module="server")

#### [__Server__ Step 13.14: Find all participants](https://github.com/Urigo/WhatsApp-Clone-Server/commit/673a0485195f58a2a44ad085c3b36e858902e078)

##### Changed modules&#x2F;chats&#x2F;chats.provider.ts
```diff
@@ -72,4 +72,15 @@
 ┊72┊72┊
 ┊73┊73┊    return rows[0] || null;
 ┊74┊74┊  }
+┊  ┊75┊
+┊  ┊76┊  async participants(chatId: string) {
+┊  ┊77┊    const db = await this.db.getClient();
+┊  ┊78┊    const { rows } = await db.query(sql`
+┊  ┊79┊      SELECT users.* FROM users, chats_users
+┊  ┊80┊      WHERE chats_users.chat_id = ${chatId}
+┊  ┊81┊      AND chats_users.user_id = users.id
+┊  ┊82┊    `);
+┊  ┊83┊
+┊  ┊84┊    return rows;
+┊  ┊85┊  }
 ┊75┊86┊}
```

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -106,14 +106,8 @@
 ┊106┊106┊      return injector.get(Chats).lastMessage(chat.id);
 ┊107┊107┊    },
 ┊108┊108┊
-┊109┊   ┊    async participants(chat, args, { db }) {
-┊110┊   ┊      const { rows } = await db.query(sql`
-┊111┊   ┊        SELECT users.* FROM users, chats_users
-┊112┊   ┊        WHERE chats_users.chat_id = ${chat.id}
-┊113┊   ┊        AND chats_users.user_id = users.id
-┊114┊   ┊      `);
-┊115┊   ┊
-┊116┊   ┊      return rows;
+┊   ┊109┊    async participants(chat, args, { injector }) {
+┊   ┊110┊      return injector.get(Chats).participants(chat.id);
 ┊117┊111┊    },
 ┊118┊112┊  },
```

[}]: #
[{]: <helper> (diffStep "13.15" module="server")

#### [__Server__ Step 13.15: Check if a user belongs to a chat](https://github.com/Urigo/WhatsApp-Clone-Server/commit/82d7835457d7eb524700eac06404b45ae68d4c61)

##### Changed modules&#x2F;chats&#x2F;chats.provider.ts
```diff
@@ -83,4 +83,15 @@
 ┊83┊83┊
 ┊84┊84┊    return rows;
 ┊85┊85┊  }
+┊  ┊86┊
+┊  ┊87┊  async isParticipant({ chatId, userId }: { chatId: string; userId: string }) {
+┊  ┊88┊    const db = await this.db.getClient();
+┊  ┊89┊    const { rows } = await db.query(sql`
+┊  ┊90┊      SELECT * FROM chats_users
+┊  ┊91┊      WHERE chat_id = ${chatId}
+┊  ┊92┊      AND user_id = ${userId}
+┊  ┊93┊    `);
+┊  ┊94┊
+┊  ┊95┊    return !!rows.length;
+┊  ┊96┊  }
 ┊86┊97┊}
```

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -241,16 +241,14 @@
 ┊241┊241┊        async (
 ┊242┊242┊          { messageAdded }: { messageAdded: Message },
 ┊243┊243┊          args,
-┊244┊   ┊          { currentUser }
+┊   ┊244┊          { currentUser, injector }
 ┊245┊245┊        ) => {
 ┊246┊246┊          if (!currentUser) return false;
 ┊247┊247┊
-┊248┊   ┊          const { rows } = await pool.query(sql`
-┊249┊   ┊            SELECT * FROM chats_users
-┊250┊   ┊            WHERE chat_id = ${messageAdded.chat_id}
-┊251┊   ┊            AND user_id = ${currentUser.id}`);
-┊252┊   ┊
-┊253┊   ┊          return !!rows.length;
+┊   ┊248┊          return injector.get(Chats).isParticipant({
+┊   ┊249┊            chatId: messageAdded.chat_id,
+┊   ┊250┊            userId: currentUser.id,
+┊   ┊251┊          });
 ┊254┊252┊        }
 ┊255┊253┊      ),
 ┊256┊254┊    },
```
```diff
@@ -258,15 +256,17 @@
 ┊258┊256┊    chatAdded: {
 ┊259┊257┊      subscribe: withFilter(
 ┊260┊258┊        (root, args, { pubsub }) => pubsub.asyncIterator('chatAdded'),
-┊261┊   ┊        async ({ chatAdded }: { chatAdded: Chat }, args, { currentUser }) => {
+┊   ┊259┊        async (
+┊   ┊260┊          { chatAdded }: { chatAdded: Chat },
+┊   ┊261┊          args,
+┊   ┊262┊          { currentUser, injector }
+┊   ┊263┊        ) => {
 ┊262┊264┊          if (!currentUser) return false;
 ┊263┊265┊
-┊264┊   ┊          const { rows } = await pool.query(sql`
-┊265┊   ┊            SELECT * FROM chats_users
-┊266┊   ┊            WHERE chat_id = ${chatAdded.id}
-┊267┊   ┊            AND user_id = ${currentUser.id}`);
-┊268┊   ┊
-┊269┊   ┊          return !!rows.length;
+┊   ┊266┊          return injector.get(Chats).isParticipant({
+┊   ┊267┊            chatId: chatAdded.id,
+┊   ┊268┊            userId: currentUser.id,
+┊   ┊269┊          });
 ┊270┊270┊        }
 ┊271┊271┊      ),
 ┊272┊272┊    },
```
```diff
@@ -274,15 +274,17 @@
 ┊274┊274┊    chatRemoved: {
 ┊275┊275┊      subscribe: withFilter(
 ┊276┊276┊        (root, args, { pubsub }) => pubsub.asyncIterator('chatRemoved'),
-┊277┊   ┊        async ({ targetChat }: { targetChat: Chat }, args, { currentUser }) => {
+┊   ┊277┊        async (
+┊   ┊278┊          { targetChat }: { targetChat: Chat },
+┊   ┊279┊          args,
+┊   ┊280┊          { currentUser, injector }
+┊   ┊281┊        ) => {
 ┊278┊282┊          if (!currentUser) return false;
 ┊279┊283┊
-┊280┊   ┊          const { rows } = await pool.query(sql`
-┊281┊   ┊            SELECT * FROM chats_users
-┊282┊   ┊            WHERE chat_id = ${targetChat.id}
-┊283┊   ┊            AND user_id = ${currentUser.id}`);
-┊284┊   ┊
-┊285┊   ┊          return !!rows.length;
+┊   ┊284┊          return injector.get(Chats).isParticipant({
+┊   ┊285┊            chatId: targetChat.id,
+┊   ┊286┊            userId: currentUser.id,
+┊   ┊287┊          });
 ┊286┊288┊        }
 ┊287┊289┊      ),
 ┊288┊290┊    },
```

[}]: #

#### Sharing PubSub

One of things that are still in the context is `PubSub`. Because we're moving an entire business logic into a separate layer and as part of GraphQL Module's providers we need to make sure that PubSub is accessible throug DI.

Let's register the PubSub and migrate resolvers:

[{]: <helper> (diffStep "13.16" module="server")

#### [__Server__ Step 13.16: Move PubSub to Dependency Injection](https://github.com/Urigo/WhatsApp-Clone-Server/commit/2b5a60a03829478d0f3ce8c5369dbe4cf0c183de)

##### Changed context.ts
```diff
@@ -1,11 +1,9 @@
-┊ 1┊  ┊import { PubSub } from 'apollo-server-express';
 ┊ 2┊ 1┊import { ModuleContext } from '@graphql-modules/core';
 ┊ 3┊ 2┊import { User } from './db';
 ┊ 4┊ 3┊import { Response } from 'express';
 ┊ 5┊ 4┊import { PoolClient } from 'pg';
 ┊ 6┊ 5┊
 ┊ 7┊ 6┊export type MyContext = {
-┊ 8┊  ┊  pubsub: PubSub;
 ┊ 9┊ 7┊  currentUser: User;
 ┊10┊ 8┊  res: Response;
 ┊11┊ 9┊  db: PoolClient;
```

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -8,6 +8,7 @@
 ┊ 8┊ 8┊import { UnsplashApi } from './unsplash.api';
 ┊ 9┊ 9┊import { Users } from './../users/users.provider';
 ┊10┊10┊import { Chats } from './chats.provider';
+┊  ┊11┊import { PubSub } from '../common/pubsub.provider';
 ┊11┊12┊
 ┊12┊13┊const typeDefs = gql`
 ┊13┊14┊  type Message {
```
```diff
@@ -128,7 +129,7 @@
 ┊128┊129┊  },
 ┊129┊130┊
 ┊130┊131┊  Mutation: {
-┊131┊   ┊    async addMessage(root, { chatId, content }, { currentUser, pubsub, db }) {
+┊   ┊132┊    async addMessage(root, { chatId, content }, { currentUser, injector, db }) {
 ┊132┊133┊      if (!currentUser) return null;
 ┊133┊134┊
 ┊134┊135┊      const { rows } = await db.query(sql`
```
```diff
@@ -139,14 +140,14 @@
 ┊139┊140┊
 ┊140┊141┊      const messageAdded = rows[0];
 ┊141┊142┊
-┊142┊   ┊      pubsub.publish('messageAdded', {
+┊   ┊143┊      injector.get(PubSub).publish('messageAdded', {
 ┊143┊144┊        messageAdded,
 ┊144┊145┊      });
 ┊145┊146┊
 ┊146┊147┊      return messageAdded;
 ┊147┊148┊    },
 ┊148┊149┊
-┊149┊   ┊    async addChat(root, { recipientId }, { currentUser, pubsub, db }) {
+┊   ┊150┊    async addChat(root, { recipientId }, { currentUser, injector, db }) {
 ┊150┊151┊      if (!currentUser) return null;
 ┊151┊152┊
 ┊152┊153┊      const { rows } = await db.query(sql`
```
```diff
@@ -184,7 +185,7 @@
 ┊184┊185┊
 ┊185┊186┊        await db.query('COMMIT');
 ┊186┊187┊
-┊187┊   ┊        pubsub.publish('chatAdded', {
+┊   ┊188┊        injector.get(PubSub).publish('chatAdded', {
 ┊188┊189┊          chatAdded,
 ┊189┊190┊        });
 ┊190┊191┊
```
```diff
@@ -195,7 +196,7 @@
 ┊195┊196┊      }
 ┊196┊197┊    },
 ┊197┊198┊
-┊198┊   ┊    async removeChat(root, { chatId }, { currentUser, pubsub, db }) {
+┊   ┊199┊    async removeChat(root, { chatId }, { currentUser, injector, db }) {
 ┊199┊200┊      if (!currentUser) return null;
 ┊200┊201┊
 ┊201┊202┊      try {
```
```diff
@@ -219,7 +220,7 @@
 ┊219┊220┊          DELETE FROM chats WHERE chats.id = ${chatId}
 ┊220┊221┊        `);
 ┊221┊222┊
-┊222┊   ┊        pubsub.publish('chatRemoved', {
+┊   ┊223┊        injector.get(PubSub).publish('chatRemoved', {
 ┊223┊224┊          chatRemoved: chat.id,
 ┊224┊225┊          targetChat: chat,
 ┊225┊226┊        });
```
```diff
@@ -237,7 +238,8 @@
 ┊237┊238┊  Subscription: {
 ┊238┊239┊    messageAdded: {
 ┊239┊240┊      subscribe: withFilter(
-┊240┊   ┊        (root, args, { pubsub }) => pubsub.asyncIterator('messageAdded'),
+┊   ┊241┊        (root, args, { injector }) =>
+┊   ┊242┊          injector.get(PubSub).asyncIterator('messageAdded'),
 ┊241┊243┊        async (
 ┊242┊244┊          { messageAdded }: { messageAdded: Message },
 ┊243┊245┊          args,
```
```diff
@@ -255,7 +257,8 @@
 ┊255┊257┊
 ┊256┊258┊    chatAdded: {
 ┊257┊259┊      subscribe: withFilter(
-┊258┊   ┊        (root, args, { pubsub }) => pubsub.asyncIterator('chatAdded'),
+┊   ┊260┊        (root, args, { injector }) =>
+┊   ┊261┊          injector.get(PubSub).asyncIterator('chatAdded'),
 ┊259┊262┊        async (
 ┊260┊263┊          { chatAdded }: { chatAdded: Chat },
 ┊261┊264┊          args,
```
```diff
@@ -273,7 +276,8 @@
 ┊273┊276┊
 ┊274┊277┊    chatRemoved: {
 ┊275┊278┊      subscribe: withFilter(
-┊276┊   ┊        (root, args, { pubsub }) => pubsub.asyncIterator('chatRemoved'),
+┊   ┊279┊        (root, args, { injector }) =>
+┊   ┊280┊          injector.get(PubSub).asyncIterator('chatRemoved'),
 ┊277┊281┊        async (
 ┊278┊282┊          { targetChat }: { targetChat: Chat },
 ┊279┊283┊          args,
```

##### Changed modules&#x2F;common&#x2F;index.ts
```diff
@@ -1,10 +1,12 @@
 ┊ 1┊ 1┊import { GraphQLModule } from '@graphql-modules/core';
+┊  ┊ 2┊import { ProviderScope } from '@graphql-modules/di';
 ┊ 2┊ 3┊import { gql } from 'apollo-server-express';
 ┊ 3┊ 4┊import { DateTimeResolver, URLResolver } from 'graphql-scalars';
 ┊ 4┊ 5┊import { Pool } from 'pg';
 ┊ 5┊ 6┊import { pool } from '../../db';
 ┊ 6┊ 7┊import { Resolvers } from '../../types/graphql';
 ┊ 7┊ 8┊import { Database } from './database.provider';
+┊  ┊ 9┊import { PubSub } from './pubsub.provider';
 ┊ 8┊10┊
 ┊ 9┊11┊const { PostgresPubSub } = require('graphql-postgres-subscriptions');
 ┊10┊12┊
```
```diff
@@ -47,6 +49,11 @@
 ┊47┊49┊      provide: Pool,
 ┊48┊50┊      useValue: pool,
 ┊49┊51┊    },
+┊  ┊52┊    {
+┊  ┊53┊      provide: PubSub,
+┊  ┊54┊      scope: ProviderScope.Application,
+┊  ┊55┊      useValue: pubsub,
+┊  ┊56┊    },
 ┊50┊57┊    Database,
 ┊51┊58┊  ],
 ┊52┊59┊  async context({ res, connection }) {
```
```diff
@@ -57,7 +64,6 @@
 ┊57┊64┊    }
 ┊58┊65┊
 ┊59┊66┊    return {
-┊60┊  ┊      pubsub,
 ┊61┊67┊      res,
 ┊62┊68┊      db,
 ┊63┊69┊    };
```

##### Added modules&#x2F;common&#x2F;pubsub.provider.ts
```diff
@@ -0,0 +1 @@
+┊ ┊1┊export { PubSub } from 'apollo-server-express';
```

[}]: #

Now, we're going to use `PubSub` within `Chats` service:

[{]: <helper> (diffStep "13.17" module="server")

#### [__Server__ Step 13.17: Migrate addMessage to Chats provider](https://github.com/Urigo/WhatsApp-Clone-Server/commit/6b739ff08803fb68d8a29eeb735c49c724808afe)

##### Changed modules&#x2F;chats&#x2F;chats.provider.ts
```diff
@@ -1,12 +1,14 @@
 ┊ 1┊ 1┊import { Injectable, Inject, ProviderScope } from '@graphql-modules/di';
 ┊ 2┊ 2┊import sql from 'sql-template-strings';
 ┊ 3┊ 3┊import { Database } from '../common/database.provider';
+┊  ┊ 4┊import { PubSub } from '../common/pubsub.provider';
 ┊ 4┊ 5┊
 ┊ 5┊ 6┊@Injectable({
 ┊ 6┊ 7┊  scope: ProviderScope.Session,
 ┊ 7┊ 8┊})
 ┊ 8┊ 9┊export class Chats {
 ┊ 9┊10┊  @Inject() private db: Database;
+┊  ┊11┊  @Inject() private pubsub: PubSub;
 ┊10┊12┊
 ┊11┊13┊  async findChatsByUser(userId: string) {
 ┊12┊14┊    const db = await this.db.getClient();
```
```diff
@@ -94,4 +96,29 @@
 ┊ 94┊ 96┊
 ┊ 95┊ 97┊    return !!rows.length;
 ┊ 96┊ 98┊  }
+┊   ┊ 99┊
+┊   ┊100┊  async addMessage({
+┊   ┊101┊    chatId,
+┊   ┊102┊    userId,
+┊   ┊103┊    content,
+┊   ┊104┊  }: {
+┊   ┊105┊    chatId: string;
+┊   ┊106┊    userId: string;
+┊   ┊107┊    content: string;
+┊   ┊108┊  }) {
+┊   ┊109┊    const db = await this.db.getClient();
+┊   ┊110┊    const { rows } = await db.query(sql`
+┊   ┊111┊      INSERT INTO messages(chat_id, sender_user_id, content)
+┊   ┊112┊      VALUES(${chatId}, ${userId}, ${content})
+┊   ┊113┊      RETURNING *
+┊   ┊114┊    `);
+┊   ┊115┊
+┊   ┊116┊    const messageAdded = rows[0];
+┊   ┊117┊
+┊   ┊118┊    this.pubsub.publish('messageAdded', {
+┊   ┊119┊      messageAdded,
+┊   ┊120┊    });
+┊   ┊121┊
+┊   ┊122┊    return messageAdded;
+┊   ┊123┊  }
 ┊ 97┊124┊}
```

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -129,22 +129,12 @@
 ┊129┊129┊  },
 ┊130┊130┊
 ┊131┊131┊  Mutation: {
-┊132┊   ┊    async addMessage(root, { chatId, content }, { currentUser, injector, db }) {
+┊   ┊132┊    async addMessage(root, { chatId, content }, { currentUser, injector }) {
 ┊133┊133┊      if (!currentUser) return null;
 ┊134┊134┊
-┊135┊   ┊      const { rows } = await db.query(sql`
-┊136┊   ┊        INSERT INTO messages(chat_id, sender_user_id, content)
-┊137┊   ┊        VALUES(${chatId}, ${currentUser.id}, ${content})
-┊138┊   ┊        RETURNING *
-┊139┊   ┊      `);
-┊140┊   ┊
-┊141┊   ┊      const messageAdded = rows[0];
-┊142┊   ┊
-┊143┊   ┊      injector.get(PubSub).publish('messageAdded', {
-┊144┊   ┊        messageAdded,
-┊145┊   ┊      });
-┊146┊   ┊
-┊147┊   ┊      return messageAdded;
+┊   ┊135┊      return injector
+┊   ┊136┊        .get(Chats)
+┊   ┊137┊        .addMessage({ chatId, content, userId: currentUser.id });
 ┊148┊138┊    },
 ┊149┊139┊
 ┊150┊140┊    async addChat(root, { recipientId }, { currentUser, injector, db }) {
```

[}]: #
[{]: <helper> (diffStep "13.18" module="server")

#### [__Server__ Step 13.18: Migrate addChat to Chats provider](https://github.com/Urigo/WhatsApp-Clone-Server/commit/94e40b4db3c13db4da048ca2ea8b1382e2793219)

##### Changed modules&#x2F;chats&#x2F;chats.provider.ts
```diff
@@ -121,4 +121,58 @@
 ┊121┊121┊
 ┊122┊122┊    return messageAdded;
 ┊123┊123┊  }
+┊   ┊124┊
+┊   ┊125┊  async addChat({
+┊   ┊126┊    userId,
+┊   ┊127┊    recipientId,
+┊   ┊128┊  }: {
+┊   ┊129┊    userId: string;
+┊   ┊130┊    recipientId: string;
+┊   ┊131┊  }) {
+┊   ┊132┊    const db = await this.db.getClient();
+┊   ┊133┊    const { rows } = await db.query(sql`
+┊   ┊134┊      SELECT chats.* FROM chats, (SELECT * FROM chats_users WHERE user_id = ${userId}) AS chats_of_current_user, chats_users
+┊   ┊135┊      WHERE chats_users.chat_id = chats_of_current_user.chat_id
+┊   ┊136┊      AND chats.id = chats_users.chat_id
+┊   ┊137┊      AND chats_users.user_id = ${recipientId}
+┊   ┊138┊    `);
+┊   ┊139┊
+┊   ┊140┊    // If there is already a chat between these two users, return it
+┊   ┊141┊    if (rows[0]) {
+┊   ┊142┊      return rows[0];
+┊   ┊143┊    }
+┊   ┊144┊
+┊   ┊145┊    try {
+┊   ┊146┊      await db.query('BEGIN');
+┊   ┊147┊
+┊   ┊148┊      const { rows } = await db.query(sql`
+┊   ┊149┊        INSERT INTO chats
+┊   ┊150┊        DEFAULT VALUES
+┊   ┊151┊        RETURNING *
+┊   ┊152┊      `);
+┊   ┊153┊
+┊   ┊154┊      const chatAdded = rows[0];
+┊   ┊155┊
+┊   ┊156┊      await db.query(sql`
+┊   ┊157┊        INSERT INTO chats_users(chat_id, user_id)
+┊   ┊158┊        VALUES(${chatAdded.id}, ${userId})
+┊   ┊159┊      `);
+┊   ┊160┊
+┊   ┊161┊      await db.query(sql`
+┊   ┊162┊        INSERT INTO chats_users(chat_id, user_id)
+┊   ┊163┊        VALUES(${chatAdded.id}, ${recipientId})
+┊   ┊164┊      `);
+┊   ┊165┊
+┊   ┊166┊      await db.query('COMMIT');
+┊   ┊167┊
+┊   ┊168┊      this.pubsub.publish('chatAdded', {
+┊   ┊169┊        chatAdded,
+┊   ┊170┊      });
+┊   ┊171┊
+┊   ┊172┊      return chatAdded;
+┊   ┊173┊    } catch (e) {
+┊   ┊174┊      await db.query('ROLLBACK');
+┊   ┊175┊      throw e;
+┊   ┊176┊    }
+┊   ┊177┊  }
 ┊124┊178┊}
```

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -137,53 +137,12 @@
 ┊137┊137┊        .addMessage({ chatId, content, userId: currentUser.id });
 ┊138┊138┊    },
 ┊139┊139┊
-┊140┊   ┊    async addChat(root, { recipientId }, { currentUser, injector, db }) {
+┊   ┊140┊    async addChat(root, { recipientId }, { currentUser, injector }) {
 ┊141┊141┊      if (!currentUser) return null;
 ┊142┊142┊
-┊143┊   ┊      const { rows } = await db.query(sql`
-┊144┊   ┊        SELECT chats.* FROM chats, (SELECT * FROM chats_users WHERE user_id = ${currentUser.id}) AS chats_of_current_user, chats_users
-┊145┊   ┊        WHERE chats_users.chat_id = chats_of_current_user.chat_id
-┊146┊   ┊        AND chats.id = chats_users.chat_id
-┊147┊   ┊        AND chats_users.user_id = ${recipientId}
-┊148┊   ┊      `);
-┊149┊   ┊
-┊150┊   ┊      // If there is already a chat between these two users, return it
-┊151┊   ┊      if (rows[0]) {
-┊152┊   ┊        return rows[0];
-┊153┊   ┊      }
-┊154┊   ┊
-┊155┊   ┊      try {
-┊156┊   ┊        await db.query('BEGIN');
-┊157┊   ┊
-┊158┊   ┊        const { rows } = await db.query(sql`
-┊159┊   ┊          INSERT INTO chats
-┊160┊   ┊          DEFAULT VALUES
-┊161┊   ┊          RETURNING *
-┊162┊   ┊        `);
-┊163┊   ┊
-┊164┊   ┊        const chatAdded = rows[0];
-┊165┊   ┊
-┊166┊   ┊        await db.query(sql`
-┊167┊   ┊          INSERT INTO chats_users(chat_id, user_id)
-┊168┊   ┊          VALUES(${chatAdded.id}, ${currentUser.id})
-┊169┊   ┊        `);
-┊170┊   ┊
-┊171┊   ┊        await db.query(sql`
-┊172┊   ┊          INSERT INTO chats_users(chat_id, user_id)
-┊173┊   ┊          VALUES(${chatAdded.id}, ${recipientId})
-┊174┊   ┊        `);
-┊175┊   ┊
-┊176┊   ┊        await db.query('COMMIT');
-┊177┊   ┊
-┊178┊   ┊        injector.get(PubSub).publish('chatAdded', {
-┊179┊   ┊          chatAdded,
-┊180┊   ┊        });
-┊181┊   ┊
-┊182┊   ┊        return chatAdded;
-┊183┊   ┊      } catch (e) {
-┊184┊   ┊        await db.query('ROLLBACK');
-┊185┊   ┊        throw e;
-┊186┊   ┊      }
+┊   ┊143┊      return injector
+┊   ┊144┊        .get(Chats)
+┊   ┊145┊        .addChat({ recipientId, userId: currentUser.id });
 ┊187┊146┊    },
 ┊188┊147┊
 ┊189┊148┊    async removeChat(root, { chatId }, { currentUser, injector, db }) {
```

##### Changed modules&#x2F;users&#x2F;users.provider.ts
```diff
@@ -3,7 +3,8 @@
 ┊ 3┊ 3┊import bcrypt from 'bcrypt';
 ┊ 4┊ 4┊import { Database } from '../common/database.provider';
 ┊ 5┊ 5┊
-┊ 6┊  ┊const DEFAULT_PROFILE_PIC = 'https://raw.githubusercontent.com/Urigo/WhatsApp-Clone-Client-React/legacy/public/assets/default-profile-pic.jpg'
+┊  ┊ 6┊const DEFAULT_PROFILE_PIC =
+┊  ┊ 7┊  'https://raw.githubusercontent.com/Urigo/WhatsApp-Clone-Client-React/legacy/public/assets/default-profile-pic.jpg';
 ┊ 7┊ 8┊
 ┊ 8┊ 9┊@Injectable({
 ┊ 9┊10┊  scope: ProviderScope.Session,
```

[}]: #
[{]: <helper> (diffStep "13.19" module="server")

#### [__Server__ Step 13.19: Migrate removeChat to Chats provider](https://github.com/Urigo/WhatsApp-Clone-Server/commit/16eda99f63e053ae2e1c9206b87e81fc9460214b)

##### Changed modules&#x2F;chats&#x2F;chats.provider.ts
```diff
@@ -175,4 +175,42 @@
 ┊175┊175┊      throw e;
 ┊176┊176┊    }
 ┊177┊177┊  }
+┊   ┊178┊
+┊   ┊179┊  async removeChat({ chatId, userId }: { chatId: string; userId: string }) {
+┊   ┊180┊    const db = await this.db.getClient();
+┊   ┊181┊
+┊   ┊182┊    try {
+┊   ┊183┊      await db.query('BEGIN');
+┊   ┊184┊
+┊   ┊185┊      const { rows } = await db.query(sql`
+┊   ┊186┊        SELECT chats.* FROM chats, chats_users
+┊   ┊187┊        WHERE id = ${chatId}
+┊   ┊188┊        AND chats.id = chats_users.chat_id
+┊   ┊189┊        AND chats_users.user_id = ${userId}
+┊   ┊190┊      `);
+┊   ┊191┊
+┊   ┊192┊      const chat = rows[0];
+┊   ┊193┊
+┊   ┊194┊      if (!chat) {
+┊   ┊195┊        await db.query('ROLLBACK');
+┊   ┊196┊        return null;
+┊   ┊197┊      }
+┊   ┊198┊
+┊   ┊199┊      await db.query(sql`
+┊   ┊200┊        DELETE FROM chats WHERE chats.id = ${chatId}
+┊   ┊201┊      `);
+┊   ┊202┊
+┊   ┊203┊      this.pubsub.publish('chatRemoved', {
+┊   ┊204┊        chatRemoved: chat.id,
+┊   ┊205┊        targetChat: chat,
+┊   ┊206┊      });
+┊   ┊207┊
+┊   ┊208┊      await db.query('COMMIT');
+┊   ┊209┊
+┊   ┊210┊      return chatId;
+┊   ┊211┊    } catch (e) {
+┊   ┊212┊      await db.query('ROLLBACK');
+┊   ┊213┊      throw e;
+┊   ┊214┊    }
+┊   ┊215┊  }
 ┊178┊216┊}
```

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -145,42 +145,10 @@
 ┊145┊145┊        .addChat({ recipientId, userId: currentUser.id });
 ┊146┊146┊    },
 ┊147┊147┊
-┊148┊   ┊    async removeChat(root, { chatId }, { currentUser, injector, db }) {
+┊   ┊148┊    async removeChat(root, { chatId }, { currentUser, injector }) {
 ┊149┊149┊      if (!currentUser) return null;
 ┊150┊150┊
-┊151┊   ┊      try {
-┊152┊   ┊        await db.query('BEGIN');
-┊153┊   ┊
-┊154┊   ┊        const { rows } = await db.query(sql`
-┊155┊   ┊          SELECT chats.* FROM chats, chats_users
-┊156┊   ┊          WHERE id = ${chatId}
-┊157┊   ┊          AND chats.id = chats_users.chat_id
-┊158┊   ┊          AND chats_users.user_id = ${currentUser.id}
-┊159┊   ┊        `);
-┊160┊   ┊
-┊161┊   ┊        const chat = rows[0];
-┊162┊   ┊
-┊163┊   ┊        if (!chat) {
-┊164┊   ┊          await db.query('ROLLBACK');
-┊165┊   ┊          return null;
-┊166┊   ┊        }
-┊167┊   ┊
-┊168┊   ┊        await db.query(sql`
-┊169┊   ┊          DELETE FROM chats WHERE chats.id = ${chatId}
-┊170┊   ┊        `);
-┊171┊   ┊
-┊172┊   ┊        injector.get(PubSub).publish('chatRemoved', {
-┊173┊   ┊          chatRemoved: chat.id,
-┊174┊   ┊          targetChat: chat,
-┊175┊   ┊        });
-┊176┊   ┊
-┊177┊   ┊        await db.query('COMMIT');
-┊178┊   ┊
-┊179┊   ┊        return chatId;
-┊180┊   ┊      } catch (e) {
-┊181┊   ┊        await db.query('ROLLBACK');
-┊182┊   ┊        throw e;
-┊183┊   ┊      }
+┊   ┊151┊      return injector.get(Chats).removeChat({ chatId, userId: currentUser.id });
 ┊184┊152┊    },
 ┊185┊153┊  },
```

[}]: #

#### Implementing Auth service

The last missing piece of our "context migration" journey is `currentUser` object. We're going to define the `Auth` service.

[{]: <helper> (diffStep "13.20" files="modules/users/auth.provider.ts" module="server")

#### [__Server__ Step 13.20: Implement Auth provider with currentUser method](https://github.com/Urigo/WhatsApp-Clone-Server/commit/5abd40972147b5b3ff95895d59a06697abdc273e)

##### Added modules&#x2F;users&#x2F;auth.provider.ts
```diff
@@ -0,0 +1,30 @@
+┊  ┊ 1┊import { Injectable, Inject, ProviderScope } from '@graphql-modules/di';
+┊  ┊ 2┊import { ModuleSessionInfo } from '@graphql-modules/core';
+┊  ┊ 3┊import jwt from 'jsonwebtoken';
+┊  ┊ 4┊import { secret } from '../../env';
+┊  ┊ 5┊import { Users } from './users.provider';
+┊  ┊ 6┊import { User } from '../../db';
+┊  ┊ 7┊
+┊  ┊ 8┊@Injectable({
+┊  ┊ 9┊  scope: ProviderScope.Session,
+┊  ┊10┊})
+┊  ┊11┊export class Auth {
+┊  ┊12┊  @Inject() private users: Users;
+┊  ┊13┊  @Inject() private module: ModuleSessionInfo;
+┊  ┊14┊
+┊  ┊15┊  private get req() {
+┊  ┊16┊    return this.module.session.req || this.module.session.request;
+┊  ┊17┊  }
+┊  ┊18┊
+┊  ┊19┊  async currentUser(): Promise<User | null> {
+┊  ┊20┊    if (this.req.cookies.authToken) {
+┊  ┊21┊      const username = jwt.verify(this.req.cookies.authToken, secret) as string;
+┊  ┊22┊
+┊  ┊23┊      if (username) {
+┊  ┊24┊        return this.users.findByUsername(username);
+┊  ┊25┊      }
+┊  ┊26┊    }
+┊  ┊27┊
+┊  ┊28┊    return null;
+┊  ┊29┊  }
+┊  ┊30┊}
```

[}]: #

It still needs to be registered and few resolvers in Users module have to be migrated:

[{]: <helper> (diffStep "13.20" files="modules/users/index.ts, context.ts" module="server")

#### [__Server__ Step 13.20: Implement Auth provider with currentUser method](https://github.com/Urigo/WhatsApp-Clone-Server/commit/5abd40972147b5b3ff95895d59a06697abdc273e)

##### Changed context.ts
```diff
@@ -1,10 +1,8 @@
 ┊ 1┊ 1┊import { ModuleContext } from '@graphql-modules/core';
-┊ 2┊  ┊import { User } from './db';
 ┊ 3┊ 2┊import { Response } from 'express';
 ┊ 4┊ 3┊import { PoolClient } from 'pg';
 ┊ 5┊ 4┊
 ┊ 6┊ 5┊export type MyContext = {
-┊ 7┊  ┊  currentUser: User;
 ┊ 8┊ 6┊  res: Response;
 ┊ 9┊ 7┊  db: PoolClient;
 ┊10┊ 8┊} & ModuleContext;
```

##### Changed modules&#x2F;users&#x2F;index.ts
```diff
@@ -1,6 +1,5 @@
 ┊1┊1┊import { GraphQLModule } from '@graphql-modules/core';
 ┊2┊2┊import { gql } from 'apollo-server-express';
-┊3┊ ┊import cookie from 'cookie';
 ┊4┊3┊import sql from 'sql-template-strings';
 ┊5┊4┊import bcrypt from 'bcrypt';
 ┊6┊5┊import jwt from 'jsonwebtoken';
```
```diff
@@ -10,6 +9,7 @@
 ┊10┊ 9┊import { validateLength, validatePassword } from '../../validators';
 ┊11┊10┊import { Resolvers } from '../../types/graphql';
 ┊12┊11┊import { Users } from './users.provider';
+┊  ┊12┊import { Auth } from './auth.provider';
 ┊13┊13┊
 ┊14┊14┊const typeDefs = gql`
 ┊15┊15┊  type User {
```
```diff
@@ -36,10 +36,12 @@
 ┊36┊36┊
 ┊37┊37┊const resolvers: Resolvers = {
 ┊38┊38┊  Query: {
-┊39┊  ┊    me(root, args, { currentUser }) {
-┊40┊  ┊      return currentUser || null;
+┊  ┊39┊    me(root, args, { injector }) {
+┊  ┊40┊      return injector.get(Auth).currentUser();
 ┊41┊41┊    },
-┊42┊  ┊    async users(root, args, { currentUser, injector }) {
+┊  ┊42┊    async users(root, args, { injector }) {
+┊  ┊43┊      const currentUser = await injector.get(Auth).currentUser();
+┊  ┊44┊
 ┊43┊45┊      if (!currentUser) return [];
 ┊44┊46┊
 ┊45┊47┊      return injector.get(Users).findAllExcept(currentUser.id);
```
```diff
@@ -100,33 +102,5 @@
 ┊100┊102┊  typeDefs,
 ┊101┊103┊  resolvers,
 ┊102┊104┊  imports: () => [commonModule],
-┊103┊   ┊  providers: () => [Users],
-┊104┊   ┊  async context(session) {
-┊105┊   ┊    let currentUser;
-┊106┊   ┊
-┊107┊   ┊    // Access the request object
-┊108┊   ┊    let req = session.connection
-┊109┊   ┊      ? session.connection.context.request
-┊110┊   ┊      : session.req;
-┊111┊   ┊
-┊112┊   ┊    // It's subscription
-┊113┊   ┊    if (session.connection) {
-┊114┊   ┊      req.cookies = cookie.parse(req.headers.cookie || '');
-┊115┊   ┊    }
-┊116┊   ┊
-┊117┊   ┊    if (req.cookies.authToken) {
-┊118┊   ┊      const username = jwt.verify(req.cookies.authToken, secret) as string;
-┊119┊   ┊
-┊120┊   ┊      if (username) {
-┊121┊   ┊        const { rows } = await pool.query(
-┊122┊   ┊          sql`SELECT * FROM users WHERE username = ${username}`
-┊123┊   ┊        );
-┊124┊   ┊        currentUser = rows[0];
-┊125┊   ┊      }
-┊126┊   ┊    }
-┊127┊   ┊
-┊128┊   ┊    return {
-┊129┊   ┊      currentUser,
-┊130┊   ┊    };
-┊131┊   ┊  },
+┊   ┊105┊  providers: () => [Users, Auth],
 ┊132┊106┊});
```

[}]: #

Now let's use the Auth service in Chats:

[{]: <helper> (diffStep "13.20" files="modules/chats/index.ts" module="server")

#### [__Server__ Step 13.20: Implement Auth provider with currentUser method](https://github.com/Urigo/WhatsApp-Clone-Server/commit/5abd40972147b5b3ff95895d59a06697abdc273e)

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -7,6 +7,7 @@
 ┊ 7┊ 7┊import { Resolvers } from '../../types/graphql';
 ┊ 8┊ 8┊import { UnsplashApi } from './unsplash.api';
 ┊ 9┊ 9┊import { Users } from './../users/users.provider';
+┊  ┊10┊import { Auth } from './../users/auth.provider';
 ┊10┊11┊import { Chats } from './chats.provider';
 ┊11┊12┊import { PubSub } from '../common/pubsub.provider';
 ┊12┊13┊
```
```diff
@@ -69,13 +70,16 @@
 ┊69┊70┊      });
 ┊70┊71┊    },
 ┊71┊72┊
-┊72┊  ┊    isMine(message, args, { currentUser }) {
-┊73┊  ┊      return message.sender_user_id === currentUser.id;
+┊  ┊73┊    async isMine(message, args, { injector }) {
+┊  ┊74┊      const currentUser = await injector.get(Auth).currentUser();
+┊  ┊75┊      return message.sender_user_id === currentUser!.id;
 ┊74┊76┊    },
 ┊75┊77┊  },
 ┊76┊78┊
 ┊77┊79┊  Chat: {
-┊78┊  ┊    async name(chat, args, { currentUser, injector }) {
+┊  ┊80┊    async name(chat, args, { injector }) {
+┊  ┊81┊      const currentUser = await injector.get(Auth).currentUser();
+┊  ┊82┊
 ┊79┊83┊      if (!currentUser) return null;
 ┊80┊84┊
 ┊81┊85┊      const participant = await injector.get(Chats).firstRecipient({
```
```diff
@@ -86,7 +90,9 @@
 ┊86┊90┊      return participant ? participant.name : null;
 ┊87┊91┊    },
 ┊88┊92┊
-┊89┊  ┊    async picture(chat, args, { currentUser, db, injector }) {
+┊  ┊93┊    async picture(chat, args, { injector }) {
+┊  ┊94┊      const currentUser = await injector.get(Auth).currentUser();
+┊  ┊95┊
 ┊90┊96┊      if (!currentUser) return null;
 ┊91┊97┊
 ┊92┊98┊      const participant = await injector.get(Chats).firstRecipient({
```
```diff
@@ -113,13 +119,17 @@
 ┊113┊119┊  },
 ┊114┊120┊
 ┊115┊121┊  Query: {
-┊116┊   ┊    async chats(root, args, { currentUser, injector }) {
+┊   ┊122┊    async chats(root, args, { injector }) {
+┊   ┊123┊      const currentUser = await injector.get(Auth).currentUser();
+┊   ┊124┊
 ┊117┊125┊      if (!currentUser) return [];
 ┊118┊126┊
 ┊119┊127┊      return injector.get(Chats).findChatsByUser(currentUser.id);
 ┊120┊128┊    },
 ┊121┊129┊
-┊122┊   ┊    async chat(root, { chatId }, { currentUser, injector }) {
+┊   ┊130┊    async chat(root, { chatId }, { injector }) {
+┊   ┊131┊      const currentUser = await injector.get(Auth).currentUser();
+┊   ┊132┊
 ┊123┊133┊      if (!currentUser) return null;
 ┊124┊134┊
 ┊125┊135┊      return injector
```
```diff
@@ -129,7 +139,9 @@
 ┊129┊139┊  },
 ┊130┊140┊
 ┊131┊141┊  Mutation: {
-┊132┊   ┊    async addMessage(root, { chatId, content }, { currentUser, injector }) {
+┊   ┊142┊    async addMessage(root, { chatId, content }, { injector }) {
+┊   ┊143┊      const currentUser = await injector.get(Auth).currentUser();
+┊   ┊144┊
 ┊133┊145┊      if (!currentUser) return null;
 ┊134┊146┊
 ┊135┊147┊      return injector
```
```diff
@@ -137,7 +149,9 @@
 ┊137┊149┊        .addMessage({ chatId, content, userId: currentUser.id });
 ┊138┊150┊    },
 ┊139┊151┊
-┊140┊   ┊    async addChat(root, { recipientId }, { currentUser, injector }) {
+┊   ┊152┊    async addChat(root, { recipientId }, { injector }) {
+┊   ┊153┊      const currentUser = await injector.get(Auth).currentUser();
+┊   ┊154┊
 ┊141┊155┊      if (!currentUser) return null;
 ┊142┊156┊
 ┊143┊157┊      return injector
```
```diff
@@ -145,7 +159,9 @@
 ┊145┊159┊        .addChat({ recipientId, userId: currentUser.id });
 ┊146┊160┊    },
 ┊147┊161┊
-┊148┊   ┊    async removeChat(root, { chatId }, { currentUser, injector }) {
+┊   ┊162┊    async removeChat(root, { chatId }, { injector }) {
+┊   ┊163┊      const currentUser = await injector.get(Auth).currentUser();
+┊   ┊164┊
 ┊149┊165┊      if (!currentUser) return null;
 ┊150┊166┊
 ┊151┊167┊      return injector.get(Chats).removeChat({ chatId, userId: currentUser.id });
```
```diff
@@ -160,8 +176,10 @@
 ┊160┊176┊        async (
 ┊161┊177┊          { messageAdded }: { messageAdded: Message },
 ┊162┊178┊          args,
-┊163┊   ┊          { currentUser, injector }
+┊   ┊179┊          { injector }
 ┊164┊180┊        ) => {
+┊   ┊181┊          const currentUser = await injector.get(Auth).currentUser();
+┊   ┊182┊
 ┊165┊183┊          if (!currentUser) return false;
 ┊166┊184┊
 ┊167┊185┊          return injector.get(Chats).isParticipant({
```
```diff
@@ -176,11 +194,9 @@
 ┊176┊194┊      subscribe: withFilter(
 ┊177┊195┊        (root, args, { injector }) =>
 ┊178┊196┊          injector.get(PubSub).asyncIterator('chatAdded'),
-┊179┊   ┊        async (
-┊180┊   ┊          { chatAdded }: { chatAdded: Chat },
-┊181┊   ┊          args,
-┊182┊   ┊          { currentUser, injector }
-┊183┊   ┊        ) => {
+┊   ┊197┊        async ({ chatAdded }: { chatAdded: Chat }, args, { injector }) => {
+┊   ┊198┊          const currentUser = await injector.get(Auth).currentUser();
+┊   ┊199┊
 ┊184┊200┊          if (!currentUser) return false;
 ┊185┊201┊
 ┊186┊202┊          return injector.get(Chats).isParticipant({
```
```diff
@@ -195,11 +211,9 @@
 ┊195┊211┊      subscribe: withFilter(
 ┊196┊212┊        (root, args, { injector }) =>
 ┊197┊213┊          injector.get(PubSub).asyncIterator('chatRemoved'),
-┊198┊   ┊        async (
-┊199┊   ┊          { targetChat }: { targetChat: Chat },
-┊200┊   ┊          args,
-┊201┊   ┊          { currentUser, injector }
-┊202┊   ┊        ) => {
+┊   ┊214┊        async ({ targetChat }: { targetChat: Chat }, args, { injector }) => {
+┊   ┊215┊          const currentUser = await injector.get(Auth).currentUser();
+┊   ┊216┊
 ┊203┊217┊          if (!currentUser) return false;
 ┊204┊218┊
 ┊205┊219┊          return injector.get(Chats).isParticipant({
```

[}]: #

Because we no longer need `db` instance in the context, let's remove it:

[{]: <helper> (diffStep "13.21" module="server")

#### [__Server__ Step 13.21: Remove db from context](https://github.com/Urigo/WhatsApp-Clone-Server/commit/14c6bda2d89d505129e26c73d7e42451454faa50)

##### Changed context.ts
```diff
@@ -1,8 +1,6 @@
 ┊1┊1┊import { ModuleContext } from '@graphql-modules/core';
 ┊2┊2┊import { Response } from 'express';
-┊3┊ ┊import { PoolClient } from 'pg';
 ┊4┊3┊
 ┊5┊4┊export type MyContext = {
 ┊6┊5┊  res: Response;
-┊7┊ ┊  db: PoolClient;
 ┊8┊6┊} & ModuleContext;
```

##### Changed modules&#x2F;chats&#x2F;index.ts
```diff
@@ -1,9 +1,8 @@
 ┊1┊1┊import { GraphQLModule } from '@graphql-modules/core';
 ┊2┊2┊import { gql, withFilter } from 'apollo-server-express';
-┊3┊ ┊import sql from 'sql-template-strings';
 ┊4┊3┊import commonModule from '../common';
 ┊5┊4┊import usersModule from '../users';
-┊6┊ ┊import { Message, Chat, pool } from '../../db';
+┊ ┊5┊import { Message, Chat } from '../../db';
 ┊7┊6┊import { Resolvers } from '../../types/graphql';
 ┊8┊7┊import { UnsplashApi } from './unsplash.api';
 ┊9┊8┊import { Users } from './../users/users.provider';
```

##### Changed modules&#x2F;common&#x2F;index.ts
```diff
@@ -56,16 +56,9 @@
 ┊56┊56┊    },
 ┊57┊57┊    Database,
 ┊58┊58┊  ],
-┊59┊  ┊  async context({ res, connection }) {
-┊60┊  ┊    let db;
-┊61┊  ┊
-┊62┊  ┊    if (!connection) {
-┊63┊  ┊      db = await pool.connect();
-┊64┊  ┊    }
-┊65┊  ┊
+┊  ┊59┊  async context({ res }) {
 ┊66┊60┊    return {
 ┊67┊61┊      res,
-┊68┊  ┊      db,
 ┊69┊62┊    };
 ┊70┊63┊  },
 ┊71┊64┊});
```

##### Changed modules&#x2F;users&#x2F;index.ts
```diff
@@ -1,11 +1,9 @@
 ┊ 1┊ 1┊import { GraphQLModule } from '@graphql-modules/core';
 ┊ 2┊ 2┊import { gql } from 'apollo-server-express';
-┊ 3┊  ┊import sql from 'sql-template-strings';
 ┊ 4┊ 3┊import bcrypt from 'bcrypt';
 ┊ 5┊ 4┊import jwt from 'jsonwebtoken';
 ┊ 6┊ 5┊import commonModule from '../common';
 ┊ 7┊ 6┊import { secret, expiration } from '../../env';
-┊ 8┊  ┊import { pool } from '../../db';
 ┊ 9┊ 7┊import { validateLength, validatePassword } from '../../validators';
 ┊10┊ 8┊import { Resolvers } from '../../types/graphql';
 ┊11┊ 9┊import { Users } from './users.provider';
```

[}]: #

Besides the `currentUser` method we're going to have two more, one to sign in and the other to sign up:

[{]: <helper> (diffStep "13.22" module="server")

#### [__Server__ Step 13.22: Move signUp logic to Auth provider](https://github.com/Urigo/WhatsApp-Clone-Server/commit/3fbc44507cd19a81d3461f331289438cf54620e7)

##### Changed modules&#x2F;users&#x2F;auth.provider.ts
```diff
@@ -2,6 +2,7 @@
 ┊2┊2┊import { ModuleSessionInfo } from '@graphql-modules/core';
 ┊3┊3┊import jwt from 'jsonwebtoken';
 ┊4┊4┊import { secret } from '../../env';
+┊ ┊5┊import { validateLength, validatePassword } from '../../validators';
 ┊5┊6┊import { Users } from './users.provider';
 ┊6┊7┊import { User } from '../../db';
 ┊7┊8┊
```
```diff
@@ -16,6 +17,38 @@
 ┊16┊17┊    return this.module.session.req || this.module.session.request;
 ┊17┊18┊  }
 ┊18┊19┊
+┊  ┊20┊  async signUp({
+┊  ┊21┊    name,
+┊  ┊22┊    password,
+┊  ┊23┊    passwordConfirm,
+┊  ┊24┊    username,
+┊  ┊25┊  }: {
+┊  ┊26┊    name: string;
+┊  ┊27┊    password: string;
+┊  ┊28┊    passwordConfirm: string;
+┊  ┊29┊    username: string;
+┊  ┊30┊  }) {
+┊  ┊31┊    validateLength('req.name', name, 3, 50);
+┊  ┊32┊    validateLength('req.username', username, 3, 18);
+┊  ┊33┊    validatePassword('req.password', password);
+┊  ┊34┊
+┊  ┊35┊    if (password !== passwordConfirm) {
+┊  ┊36┊      throw Error("req.password and req.passwordConfirm don't match");
+┊  ┊37┊    }
+┊  ┊38┊
+┊  ┊39┊    const existingUser = await this.users.findByUsername(username);
+┊  ┊40┊
+┊  ┊41┊    if (existingUser) {
+┊  ┊42┊      throw Error('username already exists');
+┊  ┊43┊    }
+┊  ┊44┊
+┊  ┊45┊    return this.users.newUser({
+┊  ┊46┊      username,
+┊  ┊47┊      name,
+┊  ┊48┊      password,
+┊  ┊49┊    });
+┊  ┊50┊  }
+┊  ┊51┊
 ┊19┊52┊  async currentUser(): Promise<User | null> {
 ┊20┊53┊    if (this.req.cookies.authToken) {
 ┊21┊54┊      const username = jwt.verify(this.req.cookies.authToken, secret) as string;
```

##### Changed modules&#x2F;users&#x2F;index.ts
```diff
@@ -4,7 +4,6 @@
 ┊ 4┊ 4┊import jwt from 'jsonwebtoken';
 ┊ 5┊ 5┊import commonModule from '../common';
 ┊ 6┊ 6┊import { secret, expiration } from '../../env';
-┊ 7┊  ┊import { validateLength, validatePassword } from '../../validators';
 ┊ 8┊ 7┊import { Resolvers } from '../../types/graphql';
 ┊ 9┊ 8┊import { Users } from './users.provider';
 ┊10┊ 9┊import { Auth } from './auth.provider';
```
```diff
@@ -71,26 +70,9 @@
 ┊71┊70┊      { name, username, password, passwordConfirm },
 ┊72┊71┊      { injector }
 ┊73┊72┊    ) {
-┊74┊  ┊      validateLength('req.name', name, 3, 50);
-┊75┊  ┊      validateLength('req.username', username, 3, 18);
-┊76┊  ┊      validatePassword('req.password', password);
-┊77┊  ┊
-┊78┊  ┊      if (password !== passwordConfirm) {
-┊79┊  ┊        throw Error("req.password and req.passwordConfirm don't match");
-┊80┊  ┊      }
-┊81┊  ┊
-┊82┊  ┊      const existingUser = await injector.get(Users).findByUsername(username);
-┊83┊  ┊      if (existingUser) {
-┊84┊  ┊        throw Error('username already exists');
-┊85┊  ┊      }
-┊86┊  ┊
-┊87┊  ┊      const createdUser = await injector.get(Users).newUser({
-┊88┊  ┊        username,
-┊89┊  ┊        password,
-┊90┊  ┊        name,
-┊91┊  ┊      });
-┊92┊  ┊
-┊93┊  ┊      return createdUser;
+┊  ┊73┊      return injector
+┊  ┊74┊        .get(Auth)
+┊  ┊75┊        .signUp({ name, username, password, passwordConfirm });
 ┊94┊76┊    },
 ┊95┊77┊  },
 ┊96┊78┊};
```

[}]: #
[{]: <helper> (diffStep "13.23" module="server")

#### [__Server__ Step 13.23: Move signIn logic to Auth provider](https://github.com/Urigo/WhatsApp-Clone-Server/commit/3f87467b9dc3a6653a39e70fec48ba5c784c52be)

##### Changed context.ts
```diff
@@ -1,6 +1,3 @@
 ┊1┊1┊import { ModuleContext } from '@graphql-modules/core';
-┊2┊ ┊import { Response } from 'express';
 ┊3┊2┊
-┊4┊ ┊export type MyContext = {
-┊5┊ ┊  res: Response;
-┊6┊ ┊} & ModuleContext;
+┊ ┊3┊export type MyContext = ModuleContext;
```

##### Changed modules&#x2F;common&#x2F;index.ts
```diff
@@ -56,9 +56,4 @@
 ┊56┊56┊    },
 ┊57┊57┊    Database,
 ┊58┊58┊  ],
-┊59┊  ┊  async context({ res }) {
-┊60┊  ┊    return {
-┊61┊  ┊      res,
-┊62┊  ┊    };
-┊63┊  ┊  },
 ┊64┊59┊});
```

##### Changed modules&#x2F;users&#x2F;auth.provider.ts
```diff
@@ -1,7 +1,9 @@
 ┊1┊1┊import { Injectable, Inject, ProviderScope } from '@graphql-modules/di';
 ┊2┊2┊import { ModuleSessionInfo } from '@graphql-modules/core';
+┊ ┊3┊import { Response } from 'express';
+┊ ┊4┊import bcrypt from 'bcrypt';
 ┊3┊5┊import jwt from 'jsonwebtoken';
-┊4┊ ┊import { secret } from '../../env';
+┊ ┊6┊import { secret, expiration } from '../../env';
 ┊5┊7┊import { validateLength, validatePassword } from '../../validators';
 ┊6┊8┊import { Users } from './users.provider';
 ┊7┊9┊import { User } from '../../db';
```
```diff
@@ -17,6 +19,30 @@
 ┊17┊19┊    return this.module.session.req || this.module.session.request;
 ┊18┊20┊  }
 ┊19┊21┊
+┊  ┊22┊  private get res(): Response {
+┊  ┊23┊    return this.module.session.res;
+┊  ┊24┊  }
+┊  ┊25┊
+┊  ┊26┊  async signIn({ username, password }: { username: string; password: string }) {
+┊  ┊27┊    const user = await this.users.findByUsername(username);
+┊  ┊28┊
+┊  ┊29┊    if (!user) {
+┊  ┊30┊      throw new Error('user not found');
+┊  ┊31┊    }
+┊  ┊32┊
+┊  ┊33┊    const passwordsMatch = bcrypt.compareSync(password, user.password);
+┊  ┊34┊
+┊  ┊35┊    if (!passwordsMatch) {
+┊  ┊36┊      throw new Error('password is incorrect');
+┊  ┊37┊    }
+┊  ┊38┊
+┊  ┊39┊    const authToken = jwt.sign(username, secret);
+┊  ┊40┊
+┊  ┊41┊    this.res.cookie('authToken', authToken, { maxAge: expiration });
+┊  ┊42┊
+┊  ┊43┊    return user;
+┊  ┊44┊  }
+┊  ┊45┊
 ┊20┊46┊  async signUp({
 ┊21┊47┊    name,
 ┊22┊48┊    password,
```

##### Changed modules&#x2F;users&#x2F;index.ts
```diff
@@ -1,9 +1,6 @@
 ┊1┊1┊import { GraphQLModule } from '@graphql-modules/core';
 ┊2┊2┊import { gql } from 'apollo-server-express';
-┊3┊ ┊import bcrypt from 'bcrypt';
-┊4┊ ┊import jwt from 'jsonwebtoken';
 ┊5┊3┊import commonModule from '../common';
-┊6┊ ┊import { secret, expiration } from '../../env';
 ┊7┊4┊import { Resolvers } from '../../types/graphql';
 ┊8┊5┊import { Users } from './users.provider';
 ┊9┊6┊import { Auth } from './auth.provider';
```
```diff
@@ -45,24 +42,8 @@
 ┊45┊42┊    },
 ┊46┊43┊  },
 ┊47┊44┊  Mutation: {
-┊48┊  ┊    async signIn(root, { username, password }, { injector, res }) {
-┊49┊  ┊      const user = await injector.get(Users).findByUsername(username);
-┊50┊  ┊
-┊51┊  ┊      if (!user) {
-┊52┊  ┊        throw new Error('user not found');
-┊53┊  ┊      }
-┊54┊  ┊
-┊55┊  ┊      const passwordsMatch = bcrypt.compareSync(password, user.password);
-┊56┊  ┊
-┊57┊  ┊      if (!passwordsMatch) {
-┊58┊  ┊        throw new Error('password is incorrect');
-┊59┊  ┊      }
-┊60┊  ┊
-┊61┊  ┊      const authToken = jwt.sign(username, secret);
-┊62┊  ┊
-┊63┊  ┊      res.cookie('authToken', authToken, { maxAge: expiration });
-┊64┊  ┊
-┊65┊  ┊      return user;
+┊  ┊45┊    async signIn(root, { username, password }, { injector }) {
+┊  ┊46┊      return injector.get(Auth).signIn({ username, password });
 ┊66┊47┊    },
 ┊67┊48┊
 ┊68┊49┊    async signUp(
```

[}]: #

#### Exposing server instance

If you would run `yarn test` right now, you will see a lot of errors, every test will fail. That's because we changed our setup but we didn't adjusted tests.

We're going to change the setup of tests as well so whenever we do something on server it won't affect them. Instead of exposing schema and context as we did before, we're going to base the tests on a ready to use ApolloServer instance.

In order to achieve it, we need to separate ApolloServer from other server related logic.

[{]: <helper> (diffStep "13.24" module="server")

#### [__Server__ Step 13.24: Move ApolloServer and RootModule into a separate file](https://github.com/Urigo/WhatsApp-Clone-Server/commit/6122e12b5ddc0740593de67ec2831b3140d2c364)

##### Changed index.ts
```diff
@@ -1,35 +1,7 @@
-┊ 1┊  ┊import 'reflect-metadata';
-┊ 2┊  ┊import { ApolloServer } from 'apollo-server-express';
-┊ 3┊  ┊import { GraphQLModule } from '@graphql-modules/core';
-┊ 4┊  ┊import cookie from 'cookie';
 ┊ 5┊ 1┊import http from 'http';
 ┊ 6┊ 2┊import { app } from './app';
 ┊ 7┊ 3┊import { origin, port } from './env';
-┊ 8┊  ┊
-┊ 9┊  ┊import usersModule from './modules/users';
-┊10┊  ┊import chatsModule from './modules/chats';
-┊11┊  ┊
-┊12┊  ┊export const rootModule = new GraphQLModule({
-┊13┊  ┊  name: 'root',
-┊14┊  ┊  imports: [usersModule, chatsModule],
-┊15┊  ┊});
-┊16┊  ┊
-┊17┊  ┊const server = new ApolloServer({
-┊18┊  ┊  schema: rootModule.schema,
-┊19┊  ┊  context: (session: any) => {
-┊20┊  ┊    if (session.connection) {
-┊21┊  ┊      const req = session.connection.context.session.request;
-┊22┊  ┊      const cookies = req.headers.cookie;
-┊23┊  ┊
-┊24┊  ┊      if (cookies) {
-┊25┊  ┊        req.cookies = cookie.parse(cookies);
-┊26┊  ┊      }
-┊27┊  ┊    }
-┊28┊  ┊
-┊29┊  ┊    return rootModule.context(session);
-┊30┊  ┊  },
-┊31┊  ┊  subscriptions: rootModule.subscriptions,
-┊32┊  ┊});
+┊  ┊ 4┊import { server } from './server';
 ┊33┊ 5┊
 ┊34┊ 6┊server.applyMiddleware({
 ┊35┊ 7┊  app,
```

##### Added server.ts
```diff
@@ -0,0 +1,29 @@
+┊  ┊ 1┊import 'reflect-metadata';
+┊  ┊ 2┊import { ApolloServer } from 'apollo-server-express';
+┊  ┊ 3┊import { GraphQLModule } from '@graphql-modules/core';
+┊  ┊ 4┊import cookie from 'cookie';
+┊  ┊ 5┊
+┊  ┊ 6┊import usersModule from './modules/users';
+┊  ┊ 7┊import chatsModule from './modules/chats';
+┊  ┊ 8┊
+┊  ┊ 9┊export const rootModule = new GraphQLModule({
+┊  ┊10┊  name: 'root',
+┊  ┊11┊  imports: [usersModule, chatsModule],
+┊  ┊12┊});
+┊  ┊13┊
+┊  ┊14┊const server = new ApolloServer({
+┊  ┊15┊  schema: rootModule.schema,
+┊  ┊16┊  context: (session: any) => {
+┊  ┊17┊    if (session.connection) {
+┊  ┊18┊      const req = session.connection.context.session.request;
+┊  ┊19┊      const cookies = req.headers.cookie;
+┊  ┊20┊
+┊  ┊21┊      if (cookies) {
+┊  ┊22┊        req.cookies = cookie.parse(cookies);
+┊  ┊23┊      }
+┊  ┊24┊    }
+┊  ┊25┊
+┊  ┊26┊    return rootModule.context(session);
+┊  ┊27┊  },
+┊  ┊28┊  subscriptions: rootModule.subscriptions,
+┊  ┊29┊});
```

[}]: #
[{]: <helper> (diffStep "13.25" module="server")

#### [__Server__ Step 13.25: Export server instance](https://github.com/Urigo/WhatsApp-Clone-Server/commit/91de613fb1ef98c492c38eb3c9ab50b8c55c8a40)

##### Changed server.ts
```diff
@@ -11,7 +11,7 @@
 ┊11┊11┊  imports: [usersModule, chatsModule],
 ┊12┊12┊});
 ┊13┊13┊
-┊14┊  ┊const server = new ApolloServer({
+┊  ┊14┊export const server = new ApolloServer({
 ┊15┊15┊  schema: rootModule.schema,
 ┊16┊16┊  context: (session: any) => {
 ┊17┊17┊    if (session.connection) {
```

[}]: #

There's one thing that changed and might break our tests, this line fix it:

[{]: <helper> (diffStep "13.26" module="server")

#### [__Server__ Step 13.26: Define mocked version of Auth provider](https://github.com/Urigo/WhatsApp-Clone-Server/commit/c2069618e883fbf820070ccad06f07f2a2c8f717)

##### Added tests&#x2F;mocks&#x2F;auth.provider.ts
```diff
@@ -0,0 +1,21 @@
+┊  ┊ 1┊import sql from 'sql-template-strings';
+┊  ┊ 2┊import { Auth } from './../../modules/users/auth.provider';
+┊  ┊ 3┊import usersModule from './../../modules/users';
+┊  ┊ 4┊import { pool } from '../../db';
+┊  ┊ 5┊
+┊  ┊ 6┊export function mockAuth(userId: number) {
+┊  ┊ 7┊  class AuthMock extends Auth {
+┊  ┊ 8┊    async currentUser() {
+┊  ┊ 9┊      const { rows } = await pool.query(
+┊  ┊10┊        sql`SELECT * FROM users WHERE id = ${userId}`
+┊  ┊11┊      );
+┊  ┊12┊      return rows[0];
+┊  ┊13┊    }
+┊  ┊14┊  }
+┊  ┊15┊
+┊  ┊16┊  usersModule.injector.provide({
+┊  ┊17┊    provide: Auth,
+┊  ┊18┊    useClass: AuthMock,
+┊  ┊19┊    overwrite: true,
+┊  ┊20┊  });
+┊  ┊21┊}
```

[}]: #

Remember when I said about benefits of Dependency Injection? Here's one of them. We create a function that overwrites the `currentUser` method so it always returns a specific user.

[{]: <helper> (diffStep "13.27" module="server")

#### [__Server__ Step 13.27: Adjust tests](https://github.com/Urigo/WhatsApp-Clone-Server/commit/9cae9d676a71773097d666ce8b2085e3d722b04c)

##### Changed tests&#x2F;mutations&#x2F;addChat.test.ts
```diff
@@ -1,28 +1,14 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing';
-┊ 2┊  ┊import { ApolloServer, PubSub, gql } from 'apollo-server-express';
-┊ 3┊  ┊import { rootModule } from '../../index';
-┊ 4┊  ┊import { resetDb, pool } from '../../db';
-┊ 5┊  ┊import sql from 'sql-template-strings';
-┊ 6┊  ┊import { MyContext } from '../../context';
+┊  ┊ 2┊import { gql } from 'apollo-server-express';
+┊  ┊ 3┊import { server } from '../../server';
+┊  ┊ 4┊import { resetDb } from '../../db';
+┊  ┊ 5┊import { mockAuth } from '../mocks/auth.provider';
 ┊ 7┊ 6┊
 ┊ 8┊ 7┊describe('Mutation.addChat', () => {
 ┊ 9┊ 8┊  beforeEach(resetDb);
 ┊10┊ 9┊
 ┊11┊10┊  it('creates a new chat between current user and specified recipient', async () => {
-┊12┊  ┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 2`);
-┊13┊  ┊    const currentUser = rows[0];
-┊14┊  ┊    const server = new ApolloServer({
-┊15┊  ┊      schema: rootModule.schema,
-┊16┊  ┊      context: async () => ({
-┊17┊  ┊        pubsub: new PubSub(),
-┊18┊  ┊        currentUser,
-┊19┊  ┊        db: await pool.connect(),
-┊20┊  ┊      }),
-┊21┊  ┊      formatResponse: (res: any, { context }: any) => {
-┊22┊  ┊        context.db.release();
-┊23┊  ┊        return res;
-┊24┊  ┊      },
-┊25┊  ┊    });
+┊  ┊11┊    mockAuth(2);
 ┊26┊12┊
 ┊27┊13┊    const { query, mutate } = createTestClient(server);
 ┊28┊14┊
```
```diff
@@ -66,20 +52,7 @@
 ┊66┊52┊  });
 ┊67┊53┊
 ┊68┊54┊  it('returns the existing chat if so', async () => {
-┊69┊  ┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`);
-┊70┊  ┊    const currentUser = rows[0];
-┊71┊  ┊    const server = new ApolloServer({
-┊72┊  ┊      schema: rootModule.schema,
-┊73┊  ┊      context: async () => ({
-┊74┊  ┊        pubsub: new PubSub(),
-┊75┊  ┊        currentUser,
-┊76┊  ┊        db: await pool.connect(),
-┊77┊  ┊      }),
-┊78┊  ┊      formatResponse: (res: any, { context }: any) => {
-┊79┊  ┊        context.db.release();
-┊80┊  ┊        return res;
-┊81┊  ┊      },
-┊82┊  ┊    });
+┊  ┊55┊    mockAuth(1);
 ┊83┊56┊
 ┊84┊57┊    const { query, mutate } = createTestClient(server);
 ┊85┊58┊
```

##### Changed tests&#x2F;mutations&#x2F;addMessage.test.ts
```diff
@@ -1,28 +1,14 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing';
-┊ 2┊  ┊import { ApolloServer, PubSub, gql } from 'apollo-server-express';
-┊ 3┊  ┊import { rootModule } from '../../index';
-┊ 4┊  ┊import { resetDb, pool } from '../../db';
-┊ 5┊  ┊import sql from 'sql-template-strings';
-┊ 6┊  ┊import { MyContext } from '../../context';
+┊  ┊ 2┊import { gql } from 'apollo-server-express';
+┊  ┊ 3┊import { server } from '../../server';
+┊  ┊ 4┊import { resetDb } from '../../db';
+┊  ┊ 5┊import { mockAuth } from '../mocks/auth.provider';
 ┊ 7┊ 6┊
 ┊ 8┊ 7┊describe('Mutation.addMessage', () => {
 ┊ 9┊ 8┊  beforeEach(resetDb);
 ┊10┊ 9┊
 ┊11┊10┊  it('should add message to specified chat', async () => {
-┊12┊  ┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`);
-┊13┊  ┊    const currentUser = rows[0];
-┊14┊  ┊    const server = new ApolloServer({
-┊15┊  ┊      schema: rootModule.schema,
-┊16┊  ┊      context: async () => ({
-┊17┊  ┊        pubsub: new PubSub(),
-┊18┊  ┊        currentUser,
-┊19┊  ┊        db: await pool.connect(),
-┊20┊  ┊      }),
-┊21┊  ┊      formatResponse: (res: any, { context }: any) => {
-┊22┊  ┊        context.db.release();
-┊23┊  ┊        return res;
-┊24┊  ┊      },
-┊25┊  ┊    });
+┊  ┊11┊    mockAuth(1);
 ┊26┊12┊
 ┊27┊13┊    const { query, mutate } = createTestClient(server);
 ┊28┊14┊
```

##### Changed tests&#x2F;mutations&#x2F;removeChat.test.ts
```diff
@@ -1,28 +1,14 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing';
-┊ 2┊  ┊import { ApolloServer, PubSub, gql } from 'apollo-server-express';
-┊ 3┊  ┊import { rootModule } from '../../index';
-┊ 4┊  ┊import { resetDb, pool } from '../../db';
-┊ 5┊  ┊import sql from 'sql-template-strings';
-┊ 6┊  ┊import { MyContext } from '../../context';
+┊  ┊ 2┊import { gql } from 'apollo-server-express';
+┊  ┊ 3┊import { server } from '../../server';
+┊  ┊ 4┊import { resetDb } from '../../db';
+┊  ┊ 5┊import { mockAuth } from '../mocks/auth.provider';
 ┊ 7┊ 6┊
 ┊ 8┊ 7┊describe('Mutation.removeChat', () => {
 ┊ 9┊ 8┊  beforeEach(resetDb);
 ┊10┊ 9┊
 ┊11┊10┊  it('removes chat by id', async () => {
-┊12┊  ┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`);
-┊13┊  ┊    const currentUser = rows[0];
-┊14┊  ┊    const server = new ApolloServer({
-┊15┊  ┊      schema: rootModule.schema,
-┊16┊  ┊      context: async () => ({
-┊17┊  ┊        pubsub: new PubSub(),
-┊18┊  ┊        currentUser,
-┊19┊  ┊        db: await pool.connect(),
-┊20┊  ┊      }),
-┊21┊  ┊      formatResponse: (res: any, { context }: any) => {
-┊22┊  ┊        context.db.release();
-┊23┊  ┊        return res;
-┊24┊  ┊      },
-┊25┊  ┊    });
+┊  ┊11┊    mockAuth(1);
 ┊26┊12┊
 ┊27┊13┊    const { query, mutate } = createTestClient(server);
 ┊28┊14┊
```

##### Changed tests&#x2F;queries&#x2F;getChat.test.ts
```diff
@@ -1,27 +1,14 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing';
-┊ 2┊  ┊import { ApolloServer, gql } from 'apollo-server-express';
-┊ 3┊  ┊import { rootModule } from '../../index';
-┊ 4┊  ┊import { pool, resetDb } from '../../db';
-┊ 5┊  ┊import sql from 'sql-template-strings';
-┊ 6┊  ┊import { MyContext } from '../../context';
+┊  ┊ 2┊import { gql } from 'apollo-server-express';
+┊  ┊ 3┊import { server } from '../../server';
+┊  ┊ 4┊import { resetDb } from '../../db';
+┊  ┊ 5┊import { mockAuth } from '../mocks/auth.provider';
 ┊ 7┊ 6┊
 ┊ 8┊ 7┊describe('Query.chat', () => {
 ┊ 9┊ 8┊  beforeEach(resetDb);
 ┊10┊ 9┊
 ┊11┊10┊  it('should fetch specified chat', async () => {
-┊12┊  ┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`);
-┊13┊  ┊    const currentUser = rows[0];
-┊14┊  ┊    const server = new ApolloServer({
-┊15┊  ┊      schema: rootModule.schema,
-┊16┊  ┊      context: async () => ({
-┊17┊  ┊        currentUser,
-┊18┊  ┊        db: await pool.connect(),
-┊19┊  ┊      }),
-┊20┊  ┊      formatResponse: (res: any, { context }: any) => {
-┊21┊  ┊        context.db.release();
-┊22┊  ┊        return res;
-┊23┊  ┊      },
-┊24┊  ┊    });
+┊  ┊11┊    mockAuth(1);
 ┊25┊12┊
 ┊26┊13┊    const { query } = createTestClient(server);
 ┊27┊14┊
```

##### Changed tests&#x2F;queries&#x2F;getChats.test.ts
```diff
@@ -1,27 +1,14 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing';
-┊ 2┊  ┊import { ApolloServer, gql } from 'apollo-server-express';
-┊ 3┊  ┊import { rootModule } from '../../index';
-┊ 4┊  ┊import { pool, resetDb } from '../../db';
-┊ 5┊  ┊import sql from 'sql-template-strings';
-┊ 6┊  ┊import { MyContext } from '../../context';
+┊  ┊ 2┊import { gql } from 'apollo-server-express';
+┊  ┊ 3┊import { server } from '../../server';
+┊  ┊ 4┊import { resetDb } from '../../db';
+┊  ┊ 5┊import { mockAuth } from '../mocks/auth.provider';
 ┊ 7┊ 6┊
 ┊ 8┊ 7┊describe('Query.chats', () => {
 ┊ 9┊ 8┊  beforeEach(resetDb);
 ┊10┊ 9┊
 ┊11┊10┊  it('should fetch all chats', async () => {
-┊12┊  ┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`);
-┊13┊  ┊    const currentUser = rows[0];
-┊14┊  ┊    const server = new ApolloServer({
-┊15┊  ┊      schema: rootModule.schema,
-┊16┊  ┊      context: async () => ({
-┊17┊  ┊        currentUser,
-┊18┊  ┊        db: await pool.connect(),
-┊19┊  ┊      }),
-┊20┊  ┊      formatResponse: (res: any, { context }: any) => {
-┊21┊  ┊        context.db.release();
-┊22┊  ┊        return res;
-┊23┊  ┊      },
-┊24┊  ┊    });
+┊  ┊11┊    mockAuth(1);
 ┊25┊12┊
 ┊26┊13┊    const { query } = createTestClient(server);
 ┊27┊14┊
```

##### Changed tests&#x2F;queries&#x2F;getMe.test.ts
```diff
@@ -1,25 +1,14 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing';
-┊ 2┊  ┊import { ApolloServer, gql } from 'apollo-server-express';
-┊ 3┊  ┊import { rootModule } from '../../index';
-┊ 4┊  ┊import { pool } from '../../db';
-┊ 5┊  ┊import sql from 'sql-template-strings';
-┊ 6┊  ┊import { MyContext } from '../../context';
+┊  ┊ 2┊import { gql } from 'apollo-server-express';
+┊  ┊ 3┊import { server } from '../../server';
+┊  ┊ 4┊import { resetDb } from '../../db';
+┊  ┊ 5┊import { mockAuth } from '../mocks/auth.provider';
 ┊ 7┊ 6┊
 ┊ 8┊ 7┊describe('Query.me', () => {
+┊  ┊ 8┊  beforeEach(resetDb);
+┊  ┊ 9┊
 ┊ 9┊10┊  it('should fetch current user', async () => {
-┊10┊  ┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`);
-┊11┊  ┊    const currentUser = rows[0];
-┊12┊  ┊    const server = new ApolloServer({
-┊13┊  ┊      schema: rootModule.schema,
-┊14┊  ┊      context: async () => ({
-┊15┊  ┊        currentUser,
-┊16┊  ┊        db: await pool.connect(),
-┊17┊  ┊      }),
-┊18┊  ┊      formatResponse: (res: any, { context }: any) => {
-┊19┊  ┊        context.db.release();
-┊20┊  ┊        return res;
-┊21┊  ┊      },
-┊22┊  ┊    });
+┊  ┊11┊    mockAuth(1);
 ┊23┊12┊
 ┊24┊13┊    const { query } = createTestClient(server);
 ┊25┊14┊
```

##### Changed tests&#x2F;queries&#x2F;getUsers.test.ts
```diff
@@ -1,28 +1,14 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing';
-┊ 2┊  ┊import { ApolloServer, gql } from 'apollo-server-express';
-┊ 3┊  ┊import { rootModule } from '../../index';
-┊ 4┊  ┊import { pool } from '../../db';
-┊ 5┊  ┊import sql from 'sql-template-strings';
-┊ 6┊  ┊import { MyContext } from '../../context';
+┊  ┊ 2┊import { gql } from 'apollo-server-express';
+┊  ┊ 3┊import { server } from '../../server';
+┊  ┊ 4┊import { resetDb } from '../../db';
+┊  ┊ 5┊import { mockAuth } from '../mocks/auth.provider';
 ┊ 7┊ 6┊
 ┊ 8┊ 7┊describe('Query.getUsers', () => {
+┊  ┊ 8┊  beforeEach(resetDb);
+┊  ┊ 9┊
 ┊ 9┊10┊  it('should fetch all users except the one signed-in', async () => {
-┊10┊  ┊    const firstUserQuery = await pool.query(
-┊11┊  ┊      sql`SELECT * FROM users WHERE id = 1`
-┊12┊  ┊    );
-┊13┊  ┊    let currentUser = firstUserQuery.rows[0];
-┊14┊  ┊    const db = await pool.connect();
-┊15┊  ┊    const server = new ApolloServer({
-┊16┊  ┊      schema: rootModule.schema,
-┊17┊  ┊      context: async () => ({
-┊18┊  ┊        currentUser,
-┊19┊  ┊        db: await pool.connect(),
-┊20┊  ┊      }),
-┊21┊  ┊      formatResponse: (res: any, { context }: any) => {
-┊22┊  ┊        context.db.release();
-┊23┊  ┊        return res;
-┊24┊  ┊      },
-┊25┊  ┊    });
+┊  ┊11┊    mockAuth(1);
 ┊26┊12┊
 ┊27┊13┊    const { query } = createTestClient(server);
 ┊28┊14┊
```
```diff
@@ -42,10 +28,7 @@
 ┊42┊28┊    expect(res.errors).toBeUndefined();
 ┊43┊29┊    expect(res.data).toMatchSnapshot();
 ┊44┊30┊
-┊45┊  ┊    const secondUserQuery = await pool.query(
-┊46┊  ┊      sql`SELECT * FROM users WHERE id = '2'`
-┊47┊  ┊    );
-┊48┊  ┊    currentUser = secondUserQuery.rows[0];
+┊  ┊31┊    mockAuth(2);
 ┊49┊32┊
 ┊50┊33┊    res = await query({
 ┊51┊34┊      query: gql`
```

[}]: #

Let's now migrate all tests and see how easier it is now to manage those. Because we use ApolloServer's instance, we don't need to understand how it's implemented.

[{]: <helper> (diffStep "13.28" module="server")

#### Step 13.28: NOT FOUND!

[}]: #

## Adjusting client

We still need to update `codegen.yml` in the client app because of the changes we introduced in this chapter:

[{]: <helper> (diffStep "14.1" module="client")

#### [__Client__ Step 14.1: Adjust to GraphQL Modules](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/84db248a2ed70cabbd050b9cb8d73d93ef1e8547)

##### Changed codegen.yml
```diff
@@ -1,4 +1,4 @@
-┊1┊ ┊schema: ../WhatsApp-Clone-Server/schema/typeDefs.graphql
+┊ ┊1┊schema: ../WhatsApp-Clone-Server/modules/*/index.ts
 ┊2┊2┊documents: './src/**/*.{tsx,ts}'
 ┊3┊3┊overwrite: true
 ┊4┊4┊generates:
```

[}]: #

## Many ways to write GraphQL

We’re going to discuss what are the possible options of building GraphQL API and why schema-first approach was our choice.

The main ingredient of a GraphQL API is, of course the schema. It’s built out of type definitions where each of them describes a piece of data, connections between them and how data is actually resolved.

The way we develop all of it changes the way we work with the API.

We could define two main approaches:
  - schema-first
  - resolver-first

The former means design comes before code, the latter vice-versa.

In schema-first development you start with SDL, resolvers and code go next. Schema is sort of a contract between teams and also between frontend and backend. With schema-first approach it’s easier to cooperate, discuss and write a better API. Because the SDL is written upfront, the frontend developers can use a mocked version of it and start working on the product while the backend team does the API, in parallel.
There are of course some pain points. Once schema is splitted into SDL and resolvers it’s hard to keep them in sync and that’s why things like GraphQL Code Generator were developed, to add type safety on top of all.

The resolver-first approach is a bit different. The schema is defined programmatically, which usually means it’s more flexible and combined with TypeScript or Flow gives you type-safety out of the box.

We think it’s less readable than having a SDL and there’s a lack of separation between schema and code which might be a blocker for some teams.


[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step15.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step17.md) |
|:--------------------------------|--------------------------------:|

[}]: #
