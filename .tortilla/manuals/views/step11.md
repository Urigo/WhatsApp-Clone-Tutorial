# Step 11: Users

[//]: # (head-end)


Our chat app is pretty functional. We can pick a chat from the chats list and we can send messages. It's not hard to notice that one of the most important mechanisms is missing, which is relating a chat or a message to a specific user. Even though we can send messages, it's basically pointless unless someone else receives it. In this chapter we will create a new users collection with pre-defined documents and we will learn how to simulate authentication programmatically so we can test the new mechanism.

**Reshaping the back-end**

To implement this feature we need to rethink our back-end and reshape the way our GraphQL schema is structured. Right now we only have 2 entities: Chat and Message, which are connected like so:



![chat-message-orm](https://user-images.githubusercontent.com/7648874/55325929-0faa1b00-54b9-11e9-8868-7a8ed3edcda1.png)


We want to have a new User entity where each user will have Chats he participates in and Messages he owns. Therefore, our new GraphQL schema should look like something like this:



![chat-message-user-orm](https://user-images.githubusercontent.com/7648874/55325935-146ecf00-54b9-11e9-8c0f-bc3b63cbe676.png)

This change would require us to update the GraphQL type definitions and handlers, the DB models, and the codegen configuration file:

[{]: <helper> (diffStep 8.1 module="server")

#### [__Server__ Step 8.1: Add User type](https://github.com/Urigo/WhatsApp-Clone-Server/commit/9e374b100676f189c734d5f02f7ca181666f49b4)

##### Changed codegen.yml
```diff
@@ -10,6 +10,7 @@
 ┊10┊10┊      mappers:
 ┊11┊11┊        # import { Message } from '../db'
 ┊12┊12┊        # The root types of Message resolvers
+┊  ┊13┊        User: ../db#User
 ┊13┊14┊        Message: ../db#Message
 ┊14┊15┊        Chat: ../db#Chat
 ┊15┊16┊      scalars:
```

##### Changed db.ts
```diff
@@ -1,20 +1,60 @@
+┊  ┊ 1┊export type User = {
+┊  ┊ 2┊  id: string;
+┊  ┊ 3┊  name: string;
+┊  ┊ 4┊  picture: string;
+┊  ┊ 5┊};
+┊  ┊ 6┊
 ┊ 1┊ 7┊export type Message = {
 ┊ 2┊ 8┊  id: string;
 ┊ 3┊ 9┊  content: string;
 ┊ 4┊10┊  createdAt: Date;
+┊  ┊11┊  sender: string;
+┊  ┊12┊  recipient: string;
 ┊ 5┊13┊};
 ┊ 6┊14┊
 ┊ 7┊15┊export type Chat = {
 ┊ 8┊16┊  id: string;
-┊ 9┊  ┊  name: string;
-┊10┊  ┊  picture: string;
 ┊11┊17┊  messages: string[];
+┊  ┊18┊  participants: string[];
 ┊12┊19┊};
 ┊13┊20┊
+┊  ┊21┊export const users: User[] = [];
 ┊14┊22┊export const messages: Message[] = [];
 ┊15┊23┊export const chats: Chat[] = [];
 ┊16┊24┊
 ┊17┊25┊export const resetDb = () => {
+┊  ┊26┊  users.splice(
+┊  ┊27┊    0,
+┊  ┊28┊    Infinity,
+┊  ┊29┊    ...[
+┊  ┊30┊      {
+┊  ┊31┊        id: '1',
+┊  ┊32┊        name: 'Ray Edwards',
+┊  ┊33┊        picture: 'https://randomuser.me/api/portraits/thumb/lego/1.jpg',
+┊  ┊34┊      },
+┊  ┊35┊      {
+┊  ┊36┊        id: '2',
+┊  ┊37┊        name: 'Ethan Gonzalez',
+┊  ┊38┊        picture: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
+┊  ┊39┊      },
+┊  ┊40┊      {
+┊  ┊41┊        id: '3',
+┊  ┊42┊        name: 'Bryan Wallace',
+┊  ┊43┊        picture: 'https://randomuser.me/api/portraits/thumb/men/2.jpg',
+┊  ┊44┊      },
+┊  ┊45┊      {
+┊  ┊46┊        id: '4',
+┊  ┊47┊        name: 'Avery Stewart',
+┊  ┊48┊        picture: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
+┊  ┊49┊      },
+┊  ┊50┊      {
+┊  ┊51┊        id: '5',
+┊  ┊52┊        name: 'Katie Peterson',
+┊  ┊53┊        picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
+┊  ┊54┊      },
+┊  ┊55┊    ]
+┊  ┊56┊  );
+┊  ┊57┊
 ┊18┊58┊  messages.splice(
 ┊19┊59┊    0,
 ┊20┊60┊    Infinity,
```
```diff
@@ -23,6 +63,8 @@
 ┊23┊63┊        id: '1',
 ┊24┊64┊        content: 'You on your way?',
 ┊25┊65┊        createdAt: new Date(new Date('1-1-2019').getTime() - 60 * 1000 * 1000),
+┊  ┊66┊        sender: '1',
+┊  ┊67┊        recipient: '2',
 ┊26┊68┊      },
 ┊27┊69┊      {
 ┊28┊70┊        id: '2',
```
```diff
@@ -30,6 +72,8 @@
 ┊30┊72┊        createdAt: new Date(
 ┊31┊73┊          new Date('1-1-2019').getTime() - 2 * 60 * 1000 * 1000
 ┊32┊74┊        ),
+┊  ┊75┊        sender: '1',
+┊  ┊76┊        recipient: '3',
 ┊33┊77┊      },
 ┊34┊78┊      {
 ┊35┊79┊        id: '3',
```
```diff
@@ -37,6 +81,8 @@
 ┊37┊81┊        createdAt: new Date(
 ┊38┊82┊          new Date('1-1-2019').getTime() - 24 * 60 * 1000 * 1000
 ┊39┊83┊        ),
+┊  ┊84┊        sender: '1',
+┊  ┊85┊        recipient: '4',
 ┊40┊86┊      },
 ┊41┊87┊      {
 ┊42┊88┊        id: '4',
```
```diff
@@ -44,6 +90,8 @@
 ┊44┊90┊        createdAt: new Date(
 ┊45┊91┊          new Date('1-1-2019').getTime() - 14 * 24 * 60 * 1000 * 1000
 ┊46┊92┊        ),
+┊  ┊93┊        sender: '1',
+┊  ┊94┊        recipient: '5',
 ┊47┊95┊      },
 ┊48┊96┊    ]
 ┊49┊97┊  );
```
```diff
@@ -54,26 +102,22 @@
 ┊ 54┊102┊    ...[
 ┊ 55┊103┊      {
 ┊ 56┊104┊        id: '1',
-┊ 57┊   ┊        name: 'Ethan Gonzalez',
-┊ 58┊   ┊        picture: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
+┊   ┊105┊        participants: ['1', '2'],
 ┊ 59┊106┊        messages: ['1'],
 ┊ 60┊107┊      },
 ┊ 61┊108┊      {
 ┊ 62┊109┊        id: '2',
-┊ 63┊   ┊        name: 'Bryan Wallace',
-┊ 64┊   ┊        picture: 'https://randomuser.me/api/portraits/thumb/men/2.jpg',
+┊   ┊110┊        participants: ['1', '3'],
 ┊ 65┊111┊        messages: ['2'],
 ┊ 66┊112┊      },
 ┊ 67┊113┊      {
 ┊ 68┊114┊        id: '3',
-┊ 69┊   ┊        name: 'Avery Stewart',
-┊ 70┊   ┊        picture: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
+┊   ┊115┊        participants: ['1', '4'],
 ┊ 71┊116┊        messages: ['3'],
 ┊ 72┊117┊      },
 ┊ 73┊118┊      {
 ┊ 74┊119┊        id: '4',
-┊ 75┊   ┊        name: 'Katie Peterson',
-┊ 76┊   ┊        picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
+┊   ┊120┊        participants: ['1', '5'],
 ┊ 77┊121┊        messages: ['4'],
 ┊ 78┊122┊      },
 ┊ 79┊123┊    ]
```

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -1,5 +1,5 @@
 ┊1┊1┊import { DateTimeResolver, URLResolver } from 'graphql-scalars';
-┊2┊ ┊import { Message, chats, messages } from '../db';
+┊ ┊2┊import { User, Message, chats, messages, users } from '../db';
 ┊3┊3┊import { Resolvers } from '../types/graphql';
 ┊4┊4┊
 ┊5┊5┊const resolvers: Resolvers = {
```
```diff
@@ -10,9 +10,27 @@
 ┊10┊10┊    chat(message) {
 ┊11┊11┊      return chats.find(c => c.messages.some(m => m === message.id)) || null;
 ┊12┊12┊    },
+┊  ┊13┊
+┊  ┊14┊    sender(message) {
+┊  ┊15┊      return users.find(u => u.id === message.sender) || null;
+┊  ┊16┊    },
+┊  ┊17┊
+┊  ┊18┊    recipient(message) {
+┊  ┊19┊      return users.find(u => u.id === message.recipient) || null;
+┊  ┊20┊    },
 ┊13┊21┊  },
 ┊14┊22┊
 ┊15┊23┊  Chat: {
+┊  ┊24┊    name() {
+┊  ┊25┊      // TODO: Resolve in relation to current user
+┊  ┊26┊      return null;
+┊  ┊27┊    },
+┊  ┊28┊
+┊  ┊29┊    picture() {
+┊  ┊30┊      // TODO: Resolve in relation to current user
+┊  ┊31┊      return null;
+┊  ┊32┊    },
+┊  ┊33┊
 ┊16┊34┊    messages(chat) {
 ┊17┊35┊      return messages.filter((m) => chat.messages.includes(m.id));
 ┊18┊36┊    },
```
```diff
@@ -22,6 +40,12 @@
 ┊22┊40┊
 ┊23┊41┊      return messages.find((m) => m.id === lastMessage) || null;
 ┊24┊42┊    },
+┊  ┊43┊
+┊  ┊44┊    participants(chat) {
+┊  ┊45┊      return chat.participants
+┊  ┊46┊        .map(p => users.find(u => u.id === p))
+┊  ┊47┊        .filter(Boolean) as User[];
+┊  ┊48┊    },
 ┊25┊49┊  },
 ┊26┊50┊
 ┊27┊51┊  Query: {
```
```diff
@@ -49,6 +73,8 @@
 ┊49┊73┊      const message: Message = {
 ┊50┊74┊        id: messageId,
 ┊51┊75┊        createdAt: new Date(),
+┊  ┊76┊        sender: '', // TODO: Fill-in
+┊  ┊77┊        recipient: '', // TODO: Fill-in
 ┊52┊78┊        content,
 ┊53┊79┊      };
 ┊54┊80┊
```

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -1,19 +1,29 @@
 ┊ 1┊ 1┊scalar Date
 ┊ 2┊ 2┊scalar URL
 ┊ 3┊ 3┊
+┊  ┊ 4┊type User {
+┊  ┊ 5┊  id: ID!
+┊  ┊ 6┊  name: String!
+┊  ┊ 7┊  picture: URL
+┊  ┊ 8┊}
+┊  ┊ 9┊
 ┊ 4┊10┊type Message {
 ┊ 5┊11┊  id: ID!
 ┊ 6┊12┊  content: String!
 ┊ 7┊13┊  createdAt: Date!
 ┊ 8┊14┊  chat: Chat
+┊  ┊15┊  sender: User
+┊  ┊16┊  recipient: User
+┊  ┊17┊  isMine: Boolean!
 ┊ 9┊18┊}
 ┊10┊19┊
 ┊11┊20┊type Chat {
 ┊12┊21┊  id: ID!
-┊13┊  ┊  name: String!
+┊  ┊22┊  name: String
 ┊14┊23┊  picture: URL
 ┊15┊24┊  lastMessage: Message
 ┊16┊25┊  messages: [Message!]!
+┊  ┊26┊  participants: [User!]!
 ┊17┊27┊}
 ┊18┊28┊
 ┊19┊29┊type Query {
```

[}]: #

Even though we made these changes, the app remained the same. That's because the Query type haven't changed at all, and we still serve the same data as before. What we need to do is to edit the Query resolvers to serve data based on the user that is currently logged-in to the app in the current session. Before we go all in with a robust authentication system, it would be smarter to simulate it, so we can test our app and see that everything works as intended.

For now, let's assume that we're logged in with user of ID 1 - Ray Edwards. Codewise, this would mean that we will need to have the current user defined on the resolver context. In the main file, let's add the `currentUser` field to the context using a simple `find()` method from our `users` collection:

[{]: <helper> (diffStep 8.2 files="index.ts" module="server")

#### [__Server__ Step 8.2: Resolve queries in relation to current user](https://github.com/Urigo/WhatsApp-Clone-Server/commit/d7d0a1df4e436f6c456533b0e494d5adaa7d33d2)

##### Changed index.ts
```diff
@@ -2,6 +2,7 @@
 ┊2┊2┊import cors from 'cors';
 ┊3┊3┊import express from 'express';
 ┊4┊4┊import http from 'http';
+┊ ┊5┊import { users } from './db';
 ┊5┊6┊import schema from './schema';
 ┊6┊7┊
 ┊7┊8┊const app = express();
```
```diff
@@ -16,7 +17,10 @@
 ┊16┊17┊const pubsub = new PubSub();
 ┊17┊18┊const server = new ApolloServer({
 ┊18┊19┊  schema,
-┊19┊  ┊  context: () => ({ pubsub }),
+┊  ┊20┊  context: () => ({
+┊  ┊21┊    currentUser: users.find((u) => u.id === '1'),
+┊  ┊22┊    pubsub,
+┊  ┊23┊  }),
 ┊20┊24┊});
 ┊21┊25┊
 ┊22┊26┊server.applyMiddleware({
```

[}]: #

And we will update the context type:

[{]: <helper> (diffStep 8.2 files="context" module="server")

#### [__Server__ Step 8.2: Resolve queries in relation to current user](https://github.com/Urigo/WhatsApp-Clone-Server/commit/d7d0a1df4e436f6c456533b0e494d5adaa7d33d2)

##### Changed context.ts
```diff
@@ -1,5 +1,7 @@
 ┊1┊1┊import { PubSub } from 'apollo-server-express';
+┊ ┊2┊import { User } from './db';
 ┊2┊3┊
 ┊3┊4┊export type MyContext = {
 ┊4┊5┊  pubsub: PubSub;
+┊ ┊6┊  currentUser: User;
 ┊5┊7┊};
```

[}]: #

Now we will update the resolvers to fetch data relatively to the current user logged in. If there's no user logged in, the resolvers should return `null`, as the client is not authorized to view the data he requested:

[{]: <helper> (diffStep 8.2 files="schema, tests" module="server")

#### [__Server__ Step 8.2: Resolve queries in relation to current user](https://github.com/Urigo/WhatsApp-Clone-Server/commit/d7d0a1df4e436f6c456533b0e494d5adaa7d33d2)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -8,27 +8,47 @@
 ┊ 8┊ 8┊
 ┊ 9┊ 9┊  Message: {
 ┊10┊10┊    chat(message) {
-┊11┊  ┊      return chats.find(c => c.messages.some(m => m === message.id)) || null;
+┊  ┊11┊      return (
+┊  ┊12┊        chats.find((c) => c.messages.some((m) => m === message.id)) || null
+┊  ┊13┊      );
 ┊12┊14┊    },
 ┊13┊15┊
 ┊14┊16┊    sender(message) {
-┊15┊  ┊      return users.find(u => u.id === message.sender) || null;
+┊  ┊17┊      return users.find((u) => u.id === message.sender) || null;
 ┊16┊18┊    },
 ┊17┊19┊
 ┊18┊20┊    recipient(message) {
-┊19┊  ┊      return users.find(u => u.id === message.recipient) || null;
+┊  ┊21┊      return users.find((u) => u.id === message.recipient) || null;
+┊  ┊22┊    },
+┊  ┊23┊
+┊  ┊24┊    isMine(message, args, { currentUser }) {
+┊  ┊25┊      return message.sender === currentUser.id;
 ┊20┊26┊    },
 ┊21┊27┊  },
 ┊22┊28┊
 ┊23┊29┊  Chat: {
-┊24┊  ┊    name() {
-┊25┊  ┊      // TODO: Resolve in relation to current user
-┊26┊  ┊      return null;
+┊  ┊30┊    name(chat, args, { currentUser }) {
+┊  ┊31┊      if (!currentUser) return null;
+┊  ┊32┊
+┊  ┊33┊      const participantId = chat.participants.find((p) => p !== currentUser.id);
+┊  ┊34┊
+┊  ┊35┊      if (!participantId) return null;
+┊  ┊36┊
+┊  ┊37┊      const participant = users.find((u) => u.id === participantId);
+┊  ┊38┊
+┊  ┊39┊      return participant ? participant.name : null;
 ┊27┊40┊    },
 ┊28┊41┊
-┊29┊  ┊    picture() {
-┊30┊  ┊      // TODO: Resolve in relation to current user
-┊31┊  ┊      return null;
+┊  ┊42┊    picture(chat, args, { currentUser }) {
+┊  ┊43┊      if (!currentUser) return null;
+┊  ┊44┊
+┊  ┊45┊      const participantId = chat.participants.find((p) => p !== currentUser.id);
+┊  ┊46┊
+┊  ┊47┊      if (!participantId) return null;
+┊  ┊48┊
+┊  ┊49┊      const participant = users.find((u) => u.id === participantId);
+┊  ┊50┊
+┊  ┊51┊      return participant ? participant.picture : null;
 ┊32┊52┊    },
 ┊33┊53┊
 ┊34┊54┊    messages(chat) {
```
```diff
@@ -43,28 +63,39 @@
 ┊ 43┊ 63┊
 ┊ 44┊ 64┊    participants(chat) {
 ┊ 45┊ 65┊      return chat.participants
-┊ 46┊   ┊        .map(p => users.find(u => u.id === p))
+┊   ┊ 66┊        .map((p) => users.find((u) => u.id === p))
 ┊ 47┊ 67┊        .filter(Boolean) as User[];
 ┊ 48┊ 68┊    },
 ┊ 49┊ 69┊  },
 ┊ 50┊ 70┊
 ┊ 51┊ 71┊  Query: {
-┊ 52┊   ┊    chats() {
-┊ 53┊   ┊      return chats;
+┊   ┊ 72┊    chats(root, args, { currentUser }) {
+┊   ┊ 73┊      if (!currentUser) return [];
+┊   ┊ 74┊
+┊   ┊ 75┊      return chats.filter((c) => c.participants.includes(currentUser.id));
 ┊ 54┊ 76┊    },
 ┊ 55┊ 77┊
-┊ 56┊   ┊    chat(root, { chatId }) {
-┊ 57┊   ┊      return chats.find((c) => c.id === chatId) || null;
+┊   ┊ 78┊    chat(root, { chatId }, { currentUser }) {
+┊   ┊ 79┊      if (!currentUser) return null;
+┊   ┊ 80┊
+┊   ┊ 81┊      const chat = chats.find((c) => c.id === chatId);
+┊   ┊ 82┊
+┊   ┊ 83┊      if (!chat) return null;
+┊   ┊ 84┊
+┊   ┊ 85┊      return chat.participants.includes(currentUser.id) ? chat : null;
 ┊ 58┊ 86┊    },
 ┊ 59┊ 87┊  },
 ┊ 60┊ 88┊
 ┊ 61┊ 89┊  Mutation: {
-┊ 62┊   ┊    addMessage(root, { chatId, content }, { pubsub }) {
+┊   ┊ 90┊    addMessage(root, { chatId, content }, { currentUser, pubsub }) {
+┊   ┊ 91┊      if (!currentUser) return null;
+┊   ┊ 92┊
 ┊ 63┊ 93┊      const chatIndex = chats.findIndex((c) => c.id === chatId);
 ┊ 64┊ 94┊
 ┊ 65┊ 95┊      if (chatIndex === -1) return null;
 ┊ 66┊ 96┊
 ┊ 67┊ 97┊      const chat = chats[chatIndex];
+┊   ┊ 98┊      if (!chat.participants.includes(currentUser.id)) return null;
 ┊ 68┊ 99┊
 ┊ 69┊100┊      const messagesIds = messages.map((currentMessage) =>
 ┊ 70┊101┊        Number(currentMessage.id)
```
```diff
@@ -73,8 +104,10 @@
 ┊ 73┊104┊      const message: Message = {
 ┊ 74┊105┊        id: messageId,
 ┊ 75┊106┊        createdAt: new Date(),
-┊ 76┊   ┊        sender: '', // TODO: Fill-in
-┊ 77┊   ┊        recipient: '', // TODO: Fill-in
+┊   ┊107┊        sender: currentUser.id,
+┊   ┊108┊        recipient: chat.participants.find(
+┊   ┊109┊          (p) => p !== currentUser.id
+┊   ┊110┊        ) as string,
 ┊ 78┊111┊        content,
 ┊ 79┊112┊      };
 ┊ 80┊113┊
```

##### Changed tests&#x2F;mutations&#x2F;addMessage.test.ts
```diff
@@ -1,7 +1,7 @@
 ┊1┊1┊import { createTestClient } from 'apollo-server-testing';
 ┊2┊2┊import { ApolloServer, PubSub, gql } from 'apollo-server-express';
 ┊3┊3┊import schema from '../../schema';
-┊4┊ ┊import { resetDb } from '../../db';
+┊ ┊4┊import { resetDb, users } from '../../db';
 ┊5┊5┊
 ┊6┊6┊describe('Mutation.addMessage', () => {
 ┊7┊7┊  beforeEach(resetDb);
```
```diff
@@ -9,7 +9,10 @@
 ┊ 9┊ 9┊  it('should add message to specified chat', async () => {
 ┊10┊10┊    const server = new ApolloServer({
 ┊11┊11┊      schema,
-┊12┊  ┊      context: () => ({ pubsub: new PubSub() }),
+┊  ┊12┊      context: () => ({
+┊  ┊13┊        pubsub: new PubSub(),
+┊  ┊14┊        currentUser: users[0],
+┊  ┊15┊      }),
 ┊13┊16┊    });
 ┊14┊17┊
 ┊15┊18┊    const { query, mutate } = createTestClient(server);
```

##### Changed tests&#x2F;queries&#x2F;getChat.test.ts
```diff
@@ -1,10 +1,16 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing';
 ┊ 2┊ 2┊import { ApolloServer, gql } from 'apollo-server-express';
 ┊ 3┊ 3┊import schema from '../../schema';
+┊  ┊ 4┊import { users } from '../../db';
 ┊ 4┊ 5┊
 ┊ 5┊ 6┊describe('Query.chat', () => {
 ┊ 6┊ 7┊  it('should fetch specified chat', async () => {
-┊ 7┊  ┊    const server = new ApolloServer({ schema });
+┊  ┊ 8┊    const server = new ApolloServer({
+┊  ┊ 9┊      schema,
+┊  ┊10┊      context: () => ({
+┊  ┊11┊        currentUser: users[0],
+┊  ┊12┊      }),
+┊  ┊13┊    });
 ┊ 8┊14┊
 ┊ 9┊15┊    const { query } = createTestClient(server);
 ┊10┊16┊
```

##### Changed tests&#x2F;queries&#x2F;getChats.test.ts
```diff
@@ -1,10 +1,16 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing';
 ┊ 2┊ 2┊import { ApolloServer, gql } from 'apollo-server-express';
 ┊ 3┊ 3┊import schema from '../../schema';
+┊  ┊ 4┊import { users } from '../../db';
 ┊ 4┊ 5┊
 ┊ 5┊ 6┊describe('Query.chats', () => {
 ┊ 6┊ 7┊  it('should fetch all chats', async () => {
-┊ 7┊  ┊    const server = new ApolloServer({ schema });
+┊  ┊ 8┊    const server = new ApolloServer({
+┊  ┊ 9┊      schema,
+┊  ┊10┊      context: () => ({
+┊  ┊11┊        currentUser: users[0],
+┊  ┊12┊      }),
+┊  ┊13┊    });
 ┊ 8┊14┊
 ┊ 9┊15┊    const { query } = createTestClient(server);
```

[}]: #

Now if we will get back to the app and refresh the page, we should see a new chats list which is only relevant to Ray Edwards.
Earlier in this chapter, we've defined a new `isMine` field on the `Message` type.
This field is useful because now we can differentiate between messages that are mine and messages that belong to the recipient.
We can use that information to distinct between messages in our UI.

But we should also take into account the current user when we publish real-time subscription events.

We will check if there is a logged in user and if the users is part of the actual conversation before we publish:

[{]: <helper> (diffStep 8.3 module="server")

#### [__Server__ Step 8.3: Resolve subscriptions in relation to current user](https://github.com/Urigo/WhatsApp-Clone-Server/commit/c692e05e7195f2ea3e22658d0f52a2396a721e3b)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -1,3 +1,4 @@
+┊ ┊1┊import { withFilter } from 'apollo-server-express';
 ┊1┊2┊import { DateTimeResolver, URLResolver } from 'graphql-scalars';
 ┊2┊3┊import { User, Message, chats, messages, users } from '../db';
 ┊3┊4┊import { Resolvers } from '../types/graphql';
```
```diff
@@ -127,8 +128,16 @@
 ┊127┊128┊
 ┊128┊129┊  Subscription: {
 ┊129┊130┊    messageAdded: {
-┊130┊   ┊      subscribe: (root, args, { pubsub }) =>
-┊131┊   ┊        pubsub.asyncIterator('messageAdded'),
+┊   ┊131┊      subscribe: withFilter(
+┊   ┊132┊        (root, args, { pubsub }) => pubsub.asyncIterator('messageAdded'),
+┊   ┊133┊        ({ messageAdded }, args, { currentUser }) => {
+┊   ┊134┊          if (!currentUser) return false;
+┊   ┊135┊
+┊   ┊136┊          return [messageAdded.sender, messageAdded.recipient].includes(
+┊   ┊137┊            currentUser.id
+┊   ┊138┊          );
+┊   ┊139┊        }
+┊   ┊140┊      ),
 ┊132┊141┊    },
 ┊133┊142┊  },
 ┊134┊143┊};
```

[}]: #

Let's first download a new image that will help us achieve the new style and save it under the [`src/public/assets/message-yours.png`](https://github.com/Urigo/WhatsApp-Clone-Client-React/blob/cordova/public/assets/message-other.png?raw=true) path. Then let's implement the new style:

[{]: <helper> (diffStep 11.1 files="src/components" module="client")

#### [__Client__ Step 11.1: Distinguish messages](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/6d6bd6424fda52de83f8144dac4f5edeaaf72411)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;MessagesList.tsx
```diff
@@ -2,7 +2,7 @@
 ┊2┊2┊import React from 'react';
 ┊3┊3┊import { useEffect, useRef } from 'react';
 ┊4┊4┊import ReactDOM from 'react-dom';
-┊5┊ ┊import styled from 'styled-components';
+┊ ┊5┊import styled, { css } from 'styled-components';
 ┊6┊6┊
 ┊7┊7┊const Container = styled.div`
 ┊8┊8┊  display: block;
```
```diff
@@ -11,9 +11,11 @@
 ┊11┊11┊  padding: 0 15px;
 ┊12┊12┊`;
 ┊13┊13┊
+┊  ┊14┊type StyledProp = {
+┊  ┊15┊  isMine: any;
+┊  ┊16┊};
+┊  ┊17┊
 ┊14┊18┊const MessageItem = styled.div`
-┊15┊  ┊  float: right;
-┊16┊  ┊  background-color: #dcf8c6;
 ┊17┊19┊  display: inline-block;
 ┊18┊20┊  position: relative;
 ┊19┊21┊  max-width: 100%;
```
```diff
@@ -30,17 +32,36 @@
 ┊30┊32┊  }
 ┊31┊33┊
 ┊32┊34┊  &::before {
-┊33┊  ┊    background-image: url(/assets/message-mine.png);
 ┊34┊35┊    content: '';
 ┊35┊36┊    position: absolute;
 ┊36┊37┊    bottom: 3px;
 ┊37┊38┊    width: 12px;
 ┊38┊39┊    height: 19px;
-┊39┊  ┊    right: -11px;
 ┊40┊40┊    background-position: 50% 50%;
 ┊41┊41┊    background-repeat: no-repeat;
 ┊42┊42┊    background-size: contain;
 ┊43┊43┊  }
+┊  ┊44┊
+┊  ┊45┊  ${(props: StyledProp) =>
+┊  ┊46┊    props.isMine
+┊  ┊47┊      ? css`
+┊  ┊48┊          float: right;
+┊  ┊49┊          background-color: #dcf8c6;
+┊  ┊50┊
+┊  ┊51┊          &::before {
+┊  ┊52┊            right: -11px;
+┊  ┊53┊            background-image: url(/assets/message-mine.png);
+┊  ┊54┊          }
+┊  ┊55┊        `
+┊  ┊56┊      : css`
+┊  ┊57┊          float: left;
+┊  ┊58┊          background-color: #fff;
+┊  ┊59┊
+┊  ┊60┊          &::before {
+┊  ┊61┊            left: -11px;
+┊  ┊62┊            background-image: url(/assets/message-other.png);
+┊  ┊63┊          }
+┊  ┊64┊        `}
 ┊44┊65┊`;
 ┊45┊66┊
 ┊46┊67┊const Contents = styled.div`
```
```diff
@@ -75,7 +96,6 @@
 ┊ 75┊ 96┊
 ┊ 76┊ 97┊  useEffect(() => {
 ┊ 77┊ 98┊    if (!selfRef.current) return;
-┊ 78┊   ┊
 ┊ 79┊ 99┊    const selfDOMNode = ReactDOM.findDOMNode(selfRef.current) as HTMLElement;
 ┊ 80┊100┊    selfDOMNode.scrollTop = Number.MAX_SAFE_INTEGER;
 ┊ 81┊101┊  }, [messages.length]);
```
```diff
@@ -83,7 +103,10 @@
 ┊ 83┊103┊  return (
 ┊ 84┊104┊    <Container ref={selfRef}>
 ┊ 85┊105┊      {messages.map((message: any) => (
-┊ 86┊   ┊        <MessageItem data-testid="message-item" key={message.id}>
+┊   ┊106┊        <MessageItem
+┊   ┊107┊          data-testid="message-item"
+┊   ┊108┊          isMine={message.isMine}
+┊   ┊109┊          key={message.id}>
 ┊ 87┊110┊          <Contents data-testid="message-content">{message.content}</Contents>
 ┊ 88┊111┊          <Timestamp data-testid="message-date">
 ┊ 89┊112┊            {moment(message.createdAt).format('HH:mm')}
```

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -68,6 +68,7 @@
 ┊68┊68┊            __typename: 'Message',
 ┊69┊69┊            id: Math.random().toString(36).substr(2, 9),
 ┊70┊70┊            createdAt: new Date(),
+┊  ┊71┊            isMine: true,
 ┊71┊72┊            chat: {
 ┊72┊73┊              __typename: 'Chat',
 ┊73┊74┊              id: chatId,
```

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.test.tsx
```diff
@@ -44,6 +44,7 @@
 ┊44┊44┊                  id: 1,
 ┊45┊45┊                  content: 'Hello',
 ┊46┊46┊                  createdAt: new Date('1 Jan 2019 GMT'),
+┊  ┊47┊                  isMine: true,
 ┊47┊48┊                  chat: {
 ┊48┊49┊                    __typename: 'Chat',
 ┊49┊50┊                    id: 1,
```
```diff
@@ -94,6 +95,7 @@
 ┊ 94┊ 95┊                  id: 1,
 ┊ 95┊ 96┊                  content: 'Hello',
 ┊ 96┊ 97┊                  createdAt: new Date('1 Jan 2019 GMT'),
+┊   ┊ 98┊                  isMine: true,
 ┊ 97┊ 99┊                  chat: {
 ┊ 98┊100┊                    __typename: 'Chat',
 ┊ 99┊101┊                    id: 1,
```

[}]: #

[{]: <helper> (diffStep 11.1 files="message.fragment.ts" module="client")

#### [__Client__ Step 11.1: Distinguish messages](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/6d6bd6424fda52de83f8144dac4f5edeaaf72411)

##### Changed src&#x2F;graphql&#x2F;fragments&#x2F;message.fragment.ts
```diff
@@ -5,6 +5,7 @@
 ┊ 5┊ 5┊    id
 ┊ 6┊ 6┊    createdAt
 ┊ 7┊ 7┊    content
+┊  ┊ 8┊    isMine
 ┊ 8┊ 9┊    chat {
 ┊ 9┊10┊      id
 ┊10┊11┊    }
```

[}]: #

This is how the updated `ChatRoomScreen` should look like:



![chat-room-screen](https://user-images.githubusercontent.com/7648874/55326701-face8700-54ba-11e9-877e-0b7dd71a1b68.png)



We can use a temporary solution to log-in and alternate between different users. This would be a good way to test data authorization without implementing an authentication mechanism. One way to know which user is logged in is via [cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies).

Cookies are just text files which are stored locally on your computer and they contain key-value data maps. Cookies will be sent automatically by the browser with every HTTP request under the `Cookie` header. The header can be parsed and read by the server and this way inform it about the state of the client. Cookie values can also be set by the server by sending back a response which contain a `Set-Cookie` header. The browser will automatically write these cookies because of its specification and how it works.

This is how you can set cookies on the client:

```js
document.cookie = "yummy_cookie=choco"
document.cookie = "tasty_cookie=strawberry"
// logs "yummy_cookie=choco; tasty_cookie=strawberry"
```

And this is how further requests would look like:

```
GET /sample_page.html HTTP/2.0
Host: www.example.org
Cookie: yummy_cookie=choco; tasty_cookie=strawberry
```

Using this method we can set the current user's ID. Open your browser's dev-console, and type the following:

```js
// Ray Edwards
document.cookie = 'currentUserId=1'
```

To be able to send cookies with Apollo Client, we need to set the [`credentials`](https://www.apollographql.com/docs/react/recipes/authentication#cookie) option to "include" when creating the HTTP link:

[{]: <helper> (diffStep 11.2 module="client")

#### [__Client__ Step 11.2: Support credentials](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/06ef4272b4986ea1c9e2855d914f8656b82216a3)

##### Changed src&#x2F;client.ts
```diff
@@ -10,6 +10,7 @@
 ┊10┊10┊
 ┊11┊11┊const httpLink = new HttpLink({
 ┊12┊12┊  uri: httpUri,
+┊  ┊13┊  credentials: 'include',
 ┊13┊14┊});
 ┊14┊15┊
 ┊15┊16┊const wsLink = new WebSocketLink({
```

[}]: #

This will set the [`Access-Control-Allow-Credentials`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials) header to “include” with each HTTP request which is necessary when using the POST method. In correlation to that, we would need to configure the server to be able to receive and set cookies. This can be done via CORS options like so:

[{]: <helper> (diffStep 8.4 files="index.ts" module="server")

#### [__Server__ Step 8.4: Support credentials](https://github.com/Urigo/WhatsApp-Clone-Server/commit/45b98da6ea1245432856132cb518c59c5c352cc2)

##### Changed index.ts
```diff
@@ -7,7 +7,8 @@
 ┊ 7┊ 7┊
 ┊ 8┊ 8┊const app = express();
 ┊ 9┊ 9┊
-┊10┊  ┊app.use(cors());
+┊  ┊10┊const origin = process.env.ORIGIN || 'http://localhost:3000';
+┊  ┊11┊app.use(cors({ credentials: true, origin }));
 ┊11┊12┊app.use(express.json());
 ┊12┊13┊
 ┊13┊14┊app.get('/_ping', (req, res) => {
```
```diff
@@ -26,6 +27,7 @@
 ┊26┊27┊server.applyMiddleware({
 ┊27┊28┊  app,
 ┊28┊29┊  path: '/graphql',
+┊  ┊30┊  cors: { credentials: true, origin },
 ┊29┊31┊});
 ┊30┊32┊
 ┊31┊33┊const httpServer = http.createServer(app);
```

[}]: #

So how exactly does one retrieve the values of the cookies? Like mentioned earlier, each and every request will have them set on the `cookie` header, so one way would be by reading the header directly, but a more convenient way would be using an Express middleware called [`cookie-parser`](https://www.npmjs.com/package/cookie-parser):

    $ yarn add cookie-parser

[{]: <helper> (diffStep 8.5 files="index.ts" module="server")

#### [__Server__ Step 8.5: Use cookie parser](https://github.com/Urigo/WhatsApp-Clone-Server/commit/a62b1694ebb545c95a614da6f41b9e6e30ab18ed)

##### Changed index.ts
```diff
@@ -1,5 +1,6 @@
 ┊1┊1┊import { ApolloServer, gql, PubSub } from 'apollo-server-express';
 ┊2┊2┊import cors from 'cors';
+┊ ┊3┊import cookieParser from 'cookie-parser';
 ┊3┊4┊import express from 'express';
 ┊4┊5┊import http from 'http';
 ┊5┊6┊import { users } from './db';
```
```diff
@@ -10,6 +11,7 @@
 ┊10┊11┊const origin = process.env.ORIGIN || 'http://localhost:3000';
 ┊11┊12┊app.use(cors({ credentials: true, origin }));
 ┊12┊13┊app.use(express.json());
+┊  ┊14┊app.use(cookieParser());
 ┊13┊15┊
 ┊14┊16┊app.get('/_ping', (req, res) => {
 ┊15┊17┊  res.send('pong');
```

[}]: #

`cookie-parser` will read the `Cookie` header, it will parse it into a JSON and will define it on `req.cookies`. Since we’re using Apollo-Server with Express, the `req` object should be accessible as the first argument in the `context` function. This means that we can use the `currentUserId` from the cookies to fetch the current user from our users collection and define it on the context object:

[{]: <helper> (diffStep 8.6 module="server")

#### [__Server__ Step 8.6: Define current user based on cookies](https://github.com/Urigo/WhatsApp-Clone-Server/commit/8444eacbef10804daf598130372ba2b2eed75774)

##### Changed index.ts
```diff
@@ -1,6 +1,7 @@
 ┊1┊1┊import { ApolloServer, gql, PubSub } from 'apollo-server-express';
 ┊2┊2┊import cors from 'cors';
 ┊3┊3┊import cookieParser from 'cookie-parser';
+┊ ┊4┊import cookie from 'cookie';
 ┊4┊5┊import express from 'express';
 ┊5┊6┊import http from 'http';
 ┊6┊7┊import { users } from './db';
```
```diff
@@ -20,10 +21,30 @@
 ┊20┊21┊const pubsub = new PubSub();
 ┊21┊22┊const server = new ApolloServer({
 ┊22┊23┊  schema,
-┊23┊  ┊  context: () => ({
-┊24┊  ┊    currentUser: users.find((u) => u.id === '1'),
-┊25┊  ┊    pubsub,
-┊26┊  ┊  }),
+┊  ┊24┊  context: (session: any) => {
+┊  ┊25┊    // Access the request object
+┊  ┊26┊    let req = session.connection
+┊  ┊27┊      ? session.connection.context.request
+┊  ┊28┊      : session.req;
+┊  ┊29┊
+┊  ┊30┊    // It's subscription
+┊  ┊31┊    if (session.connection) {
+┊  ┊32┊      req.cookies = cookie.parse(req.headers.cookie || '');
+┊  ┊33┊    }
+┊  ┊34┊
+┊  ┊35┊    return {
+┊  ┊36┊      currentUser: users.find((u) => u.id === req.cookies.currentUserId),
+┊  ┊37┊      pubsub,
+┊  ┊38┊    };
+┊  ┊39┊  },
+┊  ┊40┊  subscriptions: {
+┊  ┊41┊    onConnect(params, ws, ctx) {
+┊  ┊42┊      // pass the request object to context
+┊  ┊43┊      return {
+┊  ┊44┊        request: ctx.request,
+┊  ┊45┊      };
+┊  ┊46┊    },
+┊  ┊47┊  },
 ┊27┊48┊});
 ┊28┊49┊
 ┊29┊50┊server.applyMiddleware({
```

##### Changed package.json
```diff
@@ -21,6 +21,7 @@
 ┊21┊21┊    "@graphql-codegen/typescript": "1.13.1",
 ┊22┊22┊    "@graphql-codegen/typescript-resolvers": "1.13.1",
 ┊23┊23┊    "@types/cors": "2.8.6",
+┊  ┊24┊    "@types/cookie": "0.3.3",
 ┊24┊25┊    "@types/cookie-parser": "1.4.2",
 ┊25┊26┊    "@types/express": "4.17.3",
 ┊26┊27┊    "@types/graphql": "14.5.0",
```
```diff
@@ -36,6 +37,7 @@
 ┊36┊37┊  "dependencies": {
 ┊37┊38┊    "apollo-server-express": "2.11.0",
 ┊38┊39┊    "apollo-server-testing": "2.11.0",
+┊  ┊40┊    "cookie": "0.4.0",
 ┊39┊41┊    "cors": "2.8.5",
 ┊40┊42┊    "cookie-parser": "1.4.5",
 ┊41┊43┊    "express": "4.17.1",
```

[}]: #

Now you can go ahead and change the value of the `currentUserId` cookie and see how it affects the view anytime you refresh the page. Needless to say that this is not the most convenient way to switch between users, so we’re gonna implement a dedicated screen that will set the cookies for us.

All the auth related logic should go into a dedicated service since it can serve us vastly across the application, not just for a single component. Thus we will create a new service called `auth.service`, which will contain 3 basic functions for now: `signIn()`, `signOut()` and `isSignedIn():

[{]: <helper> (diffStep 11.3 module="client")

#### [__Client__ Step 11.3: Add basic auth.service](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/63487515cc7d775ac452c23e667d2ec330f6e91d)

##### Changed src&#x2F;App.test.tsx
```diff
@@ -9,8 +9,8 @@
 ┊ 9┊ 9┊  const client = mockApolloClient([
 ┊10┊10┊    {
 ┊11┊11┊      request: { query: subscriptions.messageAdded },
-┊12┊  ┊      result: { data: {} }
-┊13┊  ┊    }
+┊  ┊12┊      result: { data: {} },
+┊  ┊13┊    },
 ┊14┊14┊  ]);
 ┊15┊15┊  const div = document.createElement('div');
 ┊16┊16┊
```

##### Added src&#x2F;services&#x2F;auth.service.tsx
```diff
@@ -0,0 +1,26 @@
+┊  ┊ 1┊import { useCallback } from 'react';
+┊  ┊ 2┊import { useApolloClient } from '@apollo/react-hooks';
+┊  ┊ 3┊
+┊  ┊ 4┊export const signIn = (currentUserId: string) => {
+┊  ┊ 5┊  document.cookie = `currentUserId=${currentUserId}`;
+┊  ┊ 6┊
+┊  ┊ 7┊  // This will become async in the near future
+┊  ┊ 8┊  return Promise.resolve();
+┊  ┊ 9┊};
+┊  ┊10┊
+┊  ┊11┊export const useSignOut = () => {
+┊  ┊12┊  const client = useApolloClient();
+┊  ┊13┊
+┊  ┊14┊  return useCallback(() => {
+┊  ┊15┊    // "expires" represents the lifespan of a cookie. Beyond that date the cookie will
+┊  ┊16┊    // be deleted by the browser. "expires" cannot be viewed from "document.cookie"
+┊  ┊17┊    document.cookie = `currentUserId=;expires=${new Date(0)}`;
+┊  ┊18┊
+┊  ┊19┊    // Clear cache
+┊  ┊20┊    return client.clearStore();
+┊  ┊21┊  }, [client]);
+┊  ┊22┊};
+┊  ┊23┊
+┊  ┊24┊export const isSignedIn = () => {
+┊  ┊25┊  return /currentUserId=.+(;|$)/.test(document.cookie);
+┊  ┊26┊};
```

[}]: #

Now we will implement the `AuthScreen`. For now this screen should be fairly simple. It should contain a single `TextField` to specify the current user ID, and a `sign-in` button that will call the `signIn()` method with the specified ID. Once it does so, we will be proceeded to the `ChatsListScreen`. First we will download and save the following assets:

- [`src/public/assets/whatsapp-icon.ping`](https://github.com/Urigo/WhatsApp-Clone-Client-React/raw/wip/cookie-auth/public/assets/whatsapp-icon.png)

[{]: <helper> (diffStep 11.4 files="components" module="client")

#### [__Client__ Step 11.4: Add AuthScreen](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/9263e9e37e6480fd1e68d725c64053d553cd4771)

##### Added src&#x2F;components&#x2F;AuthScreen&#x2F;index.tsx
```diff
@@ -0,0 +1,167 @@
+┊   ┊  1┊import MaterialButton from '@material-ui/core/Button';
+┊   ┊  2┊import MaterialTextField from '@material-ui/core/TextField';
+┊   ┊  3┊import React from 'react';
+┊   ┊  4┊import { useCallback, useState } from 'react';
+┊   ┊  5┊import styled from 'styled-components';
+┊   ┊  6┊import { signIn } from '../../services/auth.service';
+┊   ┊  7┊import { RouteComponentProps } from 'react-router-dom';
+┊   ┊  8┊
+┊   ┊  9┊const Container = styled.div`
+┊   ┊ 10┊  height: 100%;
+┊   ┊ 11┊  background: radial-gradient(rgb(34, 65, 67), rgb(17, 48, 50)),
+┊   ┊ 12┊    url(/assets/chat-background.jpg) no-repeat;
+┊   ┊ 13┊  background-size: cover;
+┊   ┊ 14┊  background-blend-mode: multiply;
+┊   ┊ 15┊  color: white;
+┊   ┊ 16┊`;
+┊   ┊ 17┊
+┊   ┊ 18┊const Intro = styled.div`
+┊   ┊ 19┊  height: 265px;
+┊   ┊ 20┊`;
+┊   ┊ 21┊
+┊   ┊ 22┊const Icon = styled.img`
+┊   ┊ 23┊  width: 125px;
+┊   ┊ 24┊  height: auto;
+┊   ┊ 25┊  margin-left: auto;
+┊   ┊ 26┊  margin-right: auto;
+┊   ┊ 27┊  padding-top: 70px;
+┊   ┊ 28┊  display: block;
+┊   ┊ 29┊`;
+┊   ┊ 30┊
+┊   ┊ 31┊const Title = styled.h2`
+┊   ┊ 32┊  width: 100%;
+┊   ┊ 33┊  text-align: center;
+┊   ┊ 34┊  color: white;
+┊   ┊ 35┊`;
+┊   ┊ 36┊
+┊   ┊ 37┊// eslint-disable-next-line
+┊   ┊ 38┊const Alternative = styled.div`
+┊   ┊ 39┊  position: fixed;
+┊   ┊ 40┊  bottom: 10px;
+┊   ┊ 41┊  left: 10px;
+┊   ┊ 42┊
+┊   ┊ 43┊  a {
+┊   ┊ 44┊    color: var(--secondary-bg);
+┊   ┊ 45┊  }
+┊   ┊ 46┊`;
+┊   ┊ 47┊
+┊   ┊ 48┊const SignInForm = styled.div`
+┊   ┊ 49┊  height: calc(100% - 265px);
+┊   ┊ 50┊`;
+┊   ┊ 51┊
+┊   ┊ 52┊const ActualForm = styled.form`
+┊   ┊ 53┊  padding: 20px;
+┊   ┊ 54┊`;
+┊   ┊ 55┊
+┊   ┊ 56┊const Section = styled.div`
+┊   ┊ 57┊  width: 100%;
+┊   ┊ 58┊  padding-bottom: 35px;
+┊   ┊ 59┊`;
+┊   ┊ 60┊
+┊   ┊ 61┊const Legend = styled.legend`
+┊   ┊ 62┊  font-weight: bold;
+┊   ┊ 63┊  color: white;
+┊   ┊ 64┊`;
+┊   ┊ 65┊
+┊   ┊ 66┊// eslint-disable-next-line
+┊   ┊ 67┊const Label = styled.label`
+┊   ┊ 68┊  color: white !important;
+┊   ┊ 69┊`;
+┊   ┊ 70┊
+┊   ┊ 71┊// eslint-disable-next-line
+┊   ┊ 72┊const Input = styled.input`
+┊   ┊ 73┊  color: white;
+┊   ┊ 74┊
+┊   ┊ 75┊  &::placeholder {
+┊   ┊ 76┊    color: var(--primary-bg);
+┊   ┊ 77┊  }
+┊   ┊ 78┊`;
+┊   ┊ 79┊
+┊   ┊ 80┊const TextField = styled(MaterialTextField)`
+┊   ┊ 81┊  width: 100%;
+┊   ┊ 82┊  position: relative;
+┊   ┊ 83┊
+┊   ┊ 84┊  > div::before {
+┊   ┊ 85┊    border-color: white !important;
+┊   ┊ 86┊  }
+┊   ┊ 87┊
+┊   ┊ 88┊  input {
+┊   ┊ 89┊    color: white !important;
+┊   ┊ 90┊
+┊   ┊ 91┊    &::placeholder {
+┊   ┊ 92┊      color: var(--primary-bg) !important;
+┊   ┊ 93┊    }
+┊   ┊ 94┊  }
+┊   ┊ 95┊
+┊   ┊ 96┊  label {
+┊   ┊ 97┊    color: white !important;
+┊   ┊ 98┊  }
+┊   ┊ 99┊`;
+┊   ┊100┊
+┊   ┊101┊const Button = styled(MaterialButton)`
+┊   ┊102┊  width: 100px;
+┊   ┊103┊  display: block !important;
+┊   ┊104┊  margin: auto !important;
+┊   ┊105┊  background-color: var(--secondary-bg) !important;
+┊   ┊106┊
+┊   ┊107┊  &[disabled] {
+┊   ┊108┊    color: #38a81c;
+┊   ┊109┊  }
+┊   ┊110┊
+┊   ┊111┊  &:not([disabled]) {
+┊   ┊112┊    color: white;
+┊   ┊113┊  }
+┊   ┊114┊`;
+┊   ┊115┊
+┊   ┊116┊const AuthScreen: React.FC<RouteComponentProps<any>> = ({ history }) => {
+┊   ┊117┊  const [userId, setUserId] = useState('');
+┊   ┊118┊
+┊   ┊119┊  const onUserIdChange = useCallback(({ target }) => {
+┊   ┊120┊    setUserId(target.value);
+┊   ┊121┊  }, []);
+┊   ┊122┊
+┊   ┊123┊  const maySignIn = useCallback(() => {
+┊   ┊124┊    return !!userId;
+┊   ┊125┊  }, [userId]);
+┊   ┊126┊
+┊   ┊127┊  const handleSignIn = useCallback(() => {
+┊   ┊128┊    signIn(userId).then(() => {
+┊   ┊129┊      history.replace('/chats');
+┊   ┊130┊    });
+┊   ┊131┊  }, [userId, history]);
+┊   ┊132┊
+┊   ┊133┊  return (
+┊   ┊134┊    <Container>
+┊   ┊135┊      <Intro>
+┊   ┊136┊        <Icon src="assets/whatsapp-icon.png" className="AuthScreen-icon" />
+┊   ┊137┊        <Title className="AuthScreen-title">WhatsApp</Title>
+┊   ┊138┊      </Intro>
+┊   ┊139┊      <SignInForm>
+┊   ┊140┊        <ActualForm>
+┊   ┊141┊          <Legend>Sign in</Legend>
+┊   ┊142┊          <Section>
+┊   ┊143┊            <TextField
+┊   ┊144┊              data-testid="user-id-input"
+┊   ┊145┊              label="User ID"
+┊   ┊146┊              value={userId}
+┊   ┊147┊              onChange={onUserIdChange}
+┊   ┊148┊              margin="normal"
+┊   ┊149┊              placeholder="Enter current user ID"
+┊   ┊150┊            />
+┊   ┊151┊          </Section>
+┊   ┊152┊          <Button
+┊   ┊153┊            data-testid="sign-in-button"
+┊   ┊154┊            type="button"
+┊   ┊155┊            color="secondary"
+┊   ┊156┊            variant="contained"
+┊   ┊157┊            disabled={!maySignIn()}
+┊   ┊158┊            onClick={handleSignIn}>
+┊   ┊159┊            Sign in
+┊   ┊160┊          </Button>
+┊   ┊161┊        </ActualForm>
+┊   ┊162┊      </SignInForm>
+┊   ┊163┊    </Container>
+┊   ┊164┊  );
+┊   ┊165┊};
+┊   ┊166┊
+┊   ┊167┊export default AuthScreen;
```

[}]: #

Accordingly we will define a new `/sign-in` route that will render the `AuthScreen` we’re under that path name:

[{]: <helper> (diffStep 11.4 files="App" module="client")

#### [__Client__ Step 11.4: Add AuthScreen](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/9263e9e37e6480fd1e68d725c64053d553cd4771)

##### Changed src&#x2F;App.tsx
```diff
@@ -5,6 +5,7 @@
 ┊ 5┊ 5┊  Redirect,
 ┊ 6┊ 6┊  RouteComponentProps,
 ┊ 7┊ 7┊} from 'react-router-dom';
+┊  ┊ 8┊import AuthScreen from './components/AuthScreen';
 ┊ 8┊ 9┊import ChatRoomScreen from './components/ChatRoomScreen';
 ┊ 9┊10┊import ChatsListScreen from './components/ChatsListScreen';
 ┊10┊11┊import AnimatedSwitch from './components/AnimatedSwitch';
```
```diff
@@ -16,6 +17,7 @@
 ┊16┊17┊  return (
 ┊17┊18┊    <BrowserRouter>
 ┊18┊19┊      <AnimatedSwitch>
+┊  ┊20┊        <Route exact path="/sign-(in|up)" component={AuthScreen} />
 ┊19┊21┊        <Route exact path="/chats" component={ChatsListScreen} />
 ┊20┊22┊
 ┊21┊23┊        <Route
```

[}]: #

This is how the new screen should look like:

![auth-screen](https://user-images.githubusercontent.com/7648874/55606715-7a56a180-57ac-11e9-8eea-2da5931cccf5.png)

Now let’s type the `/sign-in` route in our browser’s navigation bar and assign a user ID, see how it affects what chats we see in the `ChatsListScreen`. You’ve probably noticed that there’s no way to escape from the `/chats` route unless we edit the browser’s navigation bar manually. To fix that, we will add a new sign-out button to the navbar of the `ChatsListScreen` that will call the `signOut()` method anytime we click on it, and will bring us back to the `AuthScreen`:

[{]: <helper> (diffStep 11.5 module="client")

#### [__Client__ Step 11.5: Add sign-out button that ChatsNavbar](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/77fed59f3c9e0ca2be6dcdf61bb281e40496c479)

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsNavbar.tsx
```diff
@@ -1,14 +1,48 @@
 ┊ 1┊ 1┊import React from 'react';
-┊ 2┊  ┊import { Toolbar } from '@material-ui/core';
+┊  ┊ 2┊import { Button, Toolbar } from '@material-ui/core';
 ┊ 3┊ 3┊import styled from 'styled-components';
+┊  ┊ 4┊import SignOutIcon from '@material-ui/icons/PowerSettingsNew';
+┊  ┊ 5┊import { useCallback } from 'react';
+┊  ┊ 6┊import { useSignOut } from '../../services/auth.service';
+┊  ┊ 7┊import { History } from 'history';
 ┊ 4┊ 8┊
 ┊ 5┊ 9┊const Container = styled(Toolbar)`
+┊  ┊10┊  display: flex;
 ┊ 6┊11┊  background-color: var(--primary-bg);
 ┊ 7┊12┊  color: var(--primary-text);
 ┊ 8┊13┊  font-size: 20px;
 ┊ 9┊14┊  line-height: 40px;
 ┊10┊15┊`;
 ┊11┊16┊
-┊12┊  ┊const ChatsNavbar: React.FC = () => <Container>Whatsapp Clone</Container>;
+┊  ┊17┊const Title = styled.div`
+┊  ┊18┊  flex: 1;
+┊  ┊19┊`;
+┊  ┊20┊
+┊  ┊21┊const LogoutButton = styled(Button)`
+┊  ┊22┊  color: var(--primary-text) !important;
+┊  ┊23┊`;
+┊  ┊24┊
+┊  ┊25┊interface ChildComponentProps {
+┊  ┊26┊  history: History;
+┊  ┊27┊}
+┊  ┊28┊
+┊  ┊29┊const ChatsNavbar: React.FC<ChildComponentProps> = ({ history }) => {
+┊  ┊30┊  const signOut = useSignOut();
+┊  ┊31┊
+┊  ┊32┊  const handleSignOut = useCallback(() => {
+┊  ┊33┊    signOut().then(() => {
+┊  ┊34┊      history.replace('/sign-in');
+┊  ┊35┊    });
+┊  ┊36┊  }, [history, signOut]);
+┊  ┊37┊
+┊  ┊38┊  return (
+┊  ┊39┊    <Container>
+┊  ┊40┊      <Title>Whatsapp Clone</Title>
+┊  ┊41┊      <LogoutButton data-testid="sign-out-button" onClick={handleSignOut}>
+┊  ┊42┊        <SignOutIcon />
+┊  ┊43┊      </LogoutButton>
+┊  ┊44┊    </Container>
+┊  ┊45┊  );
+┊  ┊46┊};
 ┊13┊47┊
 ┊14┊48┊export default ChatsNavbar;
```

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;index.tsx
```diff
@@ -14,7 +14,7 @@
 ┊14┊14┊
 ┊15┊15┊const ChatsListScreen: React.FC<ChatsListScreenProps> = ({ history }) => (
 ┊16┊16┊  <Container>
-┊17┊  ┊    <ChatsNavbar />
+┊  ┊17┊    <ChatsNavbar history={history} />
 ┊18┊18┊    <ChatsList history={history} />
 ┊19┊19┊  </Container>
 ┊20┊20┊);
```

[}]: #

At this point we’ve got everything we need, but we will add a small touch to improve the user experience and make it feel more complete. Users who aren’t logged in shouldn’t be able to view any screen besides the `AuthScreen`. First they need to sign-in, and only then they will be able to view the `ChatsListScreen` and `ChatRoomScreen`. To achieve that, we will wrap all the components which require authentication before we provide them into their routes. This wrap will basically check whether a user is logged in or not by reading the cookies, and if not we will be redirected to the `/sign-in` route. Let’s implement that wrap in the `auth.service` and call it `withAuth()`:

[{]: <helper> (diffStep 11.6 files="auth.service" module="client")

#### [__Client__ Step 11.6: Add withAuth() route wrapper](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/3d29b5816a1c86e7a9955c6981fe3dd17e2399b5)

##### Changed src&#x2F;services&#x2F;auth.service.tsx
```diff
@@ -1,5 +1,26 @@
+┊  ┊ 1┊import React from 'react';
 ┊ 1┊ 2┊import { useCallback } from 'react';
 ┊ 2┊ 3┊import { useApolloClient } from '@apollo/react-hooks';
+┊  ┊ 4┊import { Redirect } from 'react-router-dom';
+┊  ┊ 5┊import { useCacheService } from './cache.service';
+┊  ┊ 6┊
+┊  ┊ 7┊export const withAuth = <P extends object>(
+┊  ┊ 8┊  Component: React.ComponentType<P>
+┊  ┊ 9┊) => {
+┊  ┊10┊  return (props: any) => {
+┊  ┊11┊    if (!isSignedIn()) {
+┊  ┊12┊      if (props.history.location.pathname === '/sign-in') {
+┊  ┊13┊        return null;
+┊  ┊14┊      }
+┊  ┊15┊
+┊  ┊16┊      return <Redirect to="/sign-in" />;
+┊  ┊17┊    }
+┊  ┊18┊
+┊  ┊19┊    useCacheService();
+┊  ┊20┊
+┊  ┊21┊    return <Component {...(props as P)} />;
+┊  ┊22┊  };
+┊  ┊23┊};
 ┊ 3┊24┊
 ┊ 4┊25┊export const signIn = (currentUserId: string) => {
 ┊ 5┊26┊  document.cookie = `currentUserId=${currentUserId}`;
```

[}]: #

We will use this function to wrap the right components in our app’s router. Note that since we used the `useCacheService()` directly in the `withAuth()` method, there’s no need to use it in the router itself anymore. This makes a lot more sense since there’s no need to stay subscribed to data that you're not gonna receive from the first place unless you’re logged-in:

[{]: <helper> (diffStep 11.6 files="App" module="client")

#### [__Client__ Step 11.6: Add withAuth() route wrapper](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/3d29b5816a1c86e7a9955c6981fe3dd17e2399b5)

##### Changed src&#x2F;App.tsx
```diff
@@ -9,32 +9,27 @@
 ┊ 9┊ 9┊import ChatRoomScreen from './components/ChatRoomScreen';
 ┊10┊10┊import ChatsListScreen from './components/ChatsListScreen';
 ┊11┊11┊import AnimatedSwitch from './components/AnimatedSwitch';
-┊12┊  ┊import { useCacheService } from './services/cache.service';
+┊  ┊12┊import { withAuth } from './services/auth.service';
 ┊13┊13┊
-┊14┊  ┊const App: React.FC = () => {
-┊15┊  ┊  useCacheService();
+┊  ┊14┊const App: React.FC = () => (
+┊  ┊15┊  <BrowserRouter>
+┊  ┊16┊    <AnimatedSwitch>
+┊  ┊17┊      <Route exact path="/sign-(in|up)" component={AuthScreen} />
+┊  ┊18┊      <Route exact path="/chats" component={withAuth(ChatsListScreen)} />
 ┊16┊19┊
-┊17┊  ┊  return (
-┊18┊  ┊    <BrowserRouter>
-┊19┊  ┊      <AnimatedSwitch>
-┊20┊  ┊        <Route exact path="/sign-(in|up)" component={AuthScreen} />
-┊21┊  ┊        <Route exact path="/chats" component={ChatsListScreen} />
-┊22┊  ┊
-┊23┊  ┊        <Route
-┊24┊  ┊          exact
-┊25┊  ┊          path="/chats/:chatId"
-┊26┊  ┊          component={({
-┊27┊  ┊            match,
-┊28┊  ┊            history,
-┊29┊  ┊          }: RouteComponentProps<{ chatId: string }>) => (
+┊  ┊20┊      <Route
+┊  ┊21┊        exact
+┊  ┊22┊        path="/chats/:chatId"
+┊  ┊23┊        component={withAuth(
+┊  ┊24┊          ({ match, history }: RouteComponentProps<{ chatId: string }>) => (
 ┊30┊25┊            <ChatRoomScreen chatId={match.params.chatId} history={history} />
-┊31┊  ┊          )}
-┊32┊  ┊        />
-┊33┊  ┊      </AnimatedSwitch>
-┊34┊  ┊      <Route exact path="/" render={redirectToChats} />
-┊35┊  ┊    </BrowserRouter>
-┊36┊  ┊  );
-┊37┊  ┊};
+┊  ┊26┊          )
+┊  ┊27┊        )}
+┊  ┊28┊      />
+┊  ┊29┊    </AnimatedSwitch>
+┊  ┊30┊    <Route exact path="/" render={redirectToChats} />
+┊  ┊31┊  </BrowserRouter>
+┊  ┊32┊);
 ┊38┊33┊
 ┊39┊34┊const redirectToChats = () => <Redirect to="/chats" />;
 ┊40┊35┊
```

[}]: #

Assuming that you’re not logged-in, if you’ll try to force navigate to the `/chats` route you should be automatically redirected to the `/sign-in` form. We will finish the chapter here as we wanna keep things simple and gradual. It’s true that we haven’t implemented true authentication, but that would be addressed soon further in this tutorial.



[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step10.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step12.md) |
|:--------------------------------|--------------------------------:|

[}]: #
