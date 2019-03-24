# Step 8: Sending messages with GraphQL mutations

[//]: # (head-end)


The view and the functionality for updating the component's state when sending a message already exists.
The thing is that messages are not really being sent, we only update the memory in the client.

If so, how exactly can we send messages and store them in the DB? For this purpose we're gonna learn about GraphQL mutations -
a method for sending and applying mutations in our back-end.

**What are GraphQL mutations?**

If you have an API endpoint that alters data, like inserting data into a database or altering data that's already in a database,
you should make this endpoint a `Mutation` rather than a `Query`.
This is as simple as making the API endpoint part of the top-level `Mutation` type instead of the top-level `Query` type.

Mutation is a remote procedure call (RPC), meaning it is used to trigger a function on the server,
but unlike other protocols which have RPCs, GraphQL Mutation also includes a query, which means the client can ask for data
once the operation is complete.

It's often convenient to have a mutation that maps to a database create or update operation and have it return the same thing that the server stored.
That way, if you modify the data on the server, the client can learn about those modifications.
You can also think about a GraphQL Mutation as a ** GraphQL query, only with side effects**.
It's equivalent to GET (query) and POST/PUT (mutation) in the context of REST API.

Below is a sample GraphQL mutation request:

```graphql
mutation AddMessage($chatId: ID!) {
  addMessage(chatId: $chatId) {
    id
    contents
    createdAt
  }
}
```

**How to implement a GraphQL mutation?**

Since GraphQL is schema based, we will need to create a new type called `Mutation` in the `typeDefs.graphql` file.
In this chapter we want to have the ability to send messages, thus we will have a field named `addMessage` in the new mutation type:

[{]: <helper> (diffStep 5.1 files="typeDefs" module="server")

#### [__Server__ Step 5.1: Add addMessage() mutation](https://github.com/Urigo/WhatsApp-Clone-Server/commit/1f221a904cf6ab1baa4c6b7670a74869517e3ae6)

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -19,3 +19,7 @@
 ┊19┊19┊  chats: [Chat!]!
 ┊20┊20┊  chat(chatId: ID!): Chat
 ┊21┊21┊}
+┊  ┊22┊
+┊  ┊23┊type Mutation {
+┊  ┊24┊  addMessage(chatId: ID!, content: String!): Message
+┊  ┊25┊}
```

[}]: #

Note that our mutation resolver `addMessage` receives a `chatId` and it is a non-optional parameter.
This is because when adding a message, we should update both the messages collection, and the correlated chat document.

Mutations are resolved exactly like any other type in our resolvers manifest. The new resolver should look like this:

[{]: <helper> (diffStep 5.1 files="resolvers" module="server")

#### [__Server__ Step 5.1: Add addMessage() mutation](https://github.com/Urigo/WhatsApp-Clone-Server/commit/1f221a904cf6ab1baa4c6b7670a74869517e3ae6)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -26,6 +26,32 @@
 ┊26┊26┊      return chats.find(c => c.id === chatId);
 ┊27┊27┊    },
 ┊28┊28┊  },
+┊  ┊29┊
+┊  ┊30┊  Mutation: {
+┊  ┊31┊    addMessage(root: any, { chatId, content }: any) {
+┊  ┊32┊      const chatIndex = chats.findIndex(c => c.id === chatId);
+┊  ┊33┊
+┊  ┊34┊      if (chatIndex === -1) return null;
+┊  ┊35┊
+┊  ┊36┊      const chat = chats[chatIndex];
+┊  ┊37┊
+┊  ┊38┊      const messagesIds = messages.map(currentMessage => Number(currentMessage.id));
+┊  ┊39┊      const messageId = String(Math.max(...messagesIds) + 1);
+┊  ┊40┊      const message = {
+┊  ┊41┊        id: messageId,
+┊  ┊42┊        createdAt: new Date(),
+┊  ┊43┊        content,
+┊  ┊44┊      };
+┊  ┊45┊
+┊  ┊46┊      messages.push(message);
+┊  ┊47┊      chat.messages.push(messageId);
+┊  ┊48┊      // The chat will appear at the top of the ChatsList component
+┊  ┊49┊      chats.splice(chatIndex, 1);
+┊  ┊50┊      chats.unshift(chat);
+┊  ┊51┊
+┊  ┊52┊      return message;
+┊  ┊53┊    },
+┊  ┊54┊  },
 ┊29┊55┊};
 ┊30┊56┊
 ┊31┊57┊export default resolvers;
```

[}]: #

When we add a message, we first find the right chat,
then we generate a new message ID that is bigger then all the previous messages (when we'll move to a real database it will do that for us)
and push the message into the right chat.

In terms of testing, we will use a temporary solution for now to reset the DB each time we test a mutation. Since we make a modification in the DB, we need to make sure that each test is completely agnostic and doesn't affect one another, thus, we will export a `resetDB()` method from our `db.ts` module:

[{]: <helper> (diffStep 5.2 files="db.ts" module="server")

#### [__Server__ Step 5.2: Test addMessage() mutation](https://github.com/Urigo/WhatsApp-Clone-Server/commit/97c478ce8820807174b96ada2318d8bcaf21de9e)

##### Changed db.ts
```diff
@@ -1,51 +1,83 @@
-┊ 1┊  ┊export const messages = [
-┊ 2┊  ┊  {
-┊ 3┊  ┊    id: '1',
-┊ 4┊  ┊    content: 'You on your way?',
-┊ 5┊  ┊    createdAt: new Date(new Date('1-1-2019').getTime() - 60 * 1000 * 1000),
-┊ 6┊  ┊  },
-┊ 7┊  ┊  {
-┊ 8┊  ┊    id: '2',
-┊ 9┊  ┊    content: "Hey, it's me",
-┊10┊  ┊    createdAt: new Date(new Date('1-1-2019').getTime() - 2 * 60 * 1000 * 1000),
-┊11┊  ┊  },
-┊12┊  ┊  {
-┊13┊  ┊    id: '3',
-┊14┊  ┊    content: 'I should buy a boat',
-┊15┊  ┊    createdAt: new Date(new Date('1-1-2019').getTime() - 24 * 60 * 1000 * 1000),
-┊16┊  ┊  },
-┊17┊  ┊  {
-┊18┊  ┊    id: '4',
-┊19┊  ┊    content: 'This is wicked good ice cream.',
-┊20┊  ┊    createdAt: new Date(
-┊21┊  ┊      new Date('1-1-2019').getTime() - 14 * 24 * 60 * 1000 * 1000
-┊22┊  ┊    ),
-┊23┊  ┊  },
-┊24┊  ┊];
+┊  ┊ 1┊export type Message = {
+┊  ┊ 2┊  id: string;
+┊  ┊ 3┊  content: string;
+┊  ┊ 4┊  createdAt: Date;
+┊  ┊ 5┊};
 ┊25┊ 6┊
-┊26┊  ┊export const chats = [
-┊27┊  ┊  {
-┊28┊  ┊    id: '1',
-┊29┊  ┊    name: 'Ethan Gonzalez',
-┊30┊  ┊    picture: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
-┊31┊  ┊    messages: ['1'],
-┊32┊  ┊  },
-┊33┊  ┊  {
-┊34┊  ┊    id: '2',
-┊35┊  ┊    name: 'Bryan Wallace',
-┊36┊  ┊    picture: 'https://randomuser.me/api/portraits/thumb/men/2.jpg',
-┊37┊  ┊    messages: ['2'],
-┊38┊  ┊  },
-┊39┊  ┊  {
-┊40┊  ┊    id: '3',
-┊41┊  ┊    name: 'Avery Stewart',
-┊42┊  ┊    picture: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
-┊43┊  ┊    messages: ['3'],
-┊44┊  ┊  },
-┊45┊  ┊  {
-┊46┊  ┊    id: '4',
-┊47┊  ┊    name: 'Katie Peterson',
-┊48┊  ┊    picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
-┊49┊  ┊    messages: ['4'],
-┊50┊  ┊  },
-┊51┊  ┊];
+┊  ┊ 7┊export type Chat = {
+┊  ┊ 8┊  id: string;
+┊  ┊ 9┊  name: string;
+┊  ┊10┊  picture: string;
+┊  ┊11┊  messages: string[];
+┊  ┊12┊};
+┊  ┊13┊
+┊  ┊14┊export const messages: Message[] = [];
+┊  ┊15┊export const chats: Chat[] = [];
+┊  ┊16┊
+┊  ┊17┊export const resetDb = () => {
+┊  ┊18┊  messages.splice(
+┊  ┊19┊    0,
+┊  ┊20┊    Infinity,
+┊  ┊21┊    ...[
+┊  ┊22┊      {
+┊  ┊23┊        id: '1',
+┊  ┊24┊        content: 'You on your way?',
+┊  ┊25┊        createdAt: new Date(new Date('1-1-2019').getTime() - 60 * 1000 * 1000),
+┊  ┊26┊      },
+┊  ┊27┊      {
+┊  ┊28┊        id: '2',
+┊  ┊29┊        content: "Hey, it's me",
+┊  ┊30┊        createdAt: new Date(
+┊  ┊31┊          new Date('1-1-2019').getTime() - 2 * 60 * 1000 * 1000
+┊  ┊32┊        ),
+┊  ┊33┊      },
+┊  ┊34┊      {
+┊  ┊35┊        id: '3',
+┊  ┊36┊        content: 'I should buy a boat',
+┊  ┊37┊        createdAt: new Date(
+┊  ┊38┊          new Date('1-1-2019').getTime() - 24 * 60 * 1000 * 1000
+┊  ┊39┊        ),
+┊  ┊40┊      },
+┊  ┊41┊      {
+┊  ┊42┊        id: '4',
+┊  ┊43┊        content: 'This is wicked good ice cream.',
+┊  ┊44┊        createdAt: new Date(
+┊  ┊45┊          new Date('1-1-2019').getTime() - 14 * 24 * 60 * 1000 * 1000
+┊  ┊46┊        ),
+┊  ┊47┊      },
+┊  ┊48┊    ]
+┊  ┊49┊  );
+┊  ┊50┊
+┊  ┊51┊  chats.splice(
+┊  ┊52┊    0,
+┊  ┊53┊    Infinity,
+┊  ┊54┊    ...[
+┊  ┊55┊      {
+┊  ┊56┊        id: '1',
+┊  ┊57┊        name: 'Ethan Gonzalez',
+┊  ┊58┊        picture: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
+┊  ┊59┊        messages: ['1'],
+┊  ┊60┊      },
+┊  ┊61┊      {
+┊  ┊62┊        id: '2',
+┊  ┊63┊        name: 'Bryan Wallace',
+┊  ┊64┊        picture: 'https://randomuser.me/api/portraits/thumb/men/2.jpg',
+┊  ┊65┊        messages: ['2'],
+┊  ┊66┊      },
+┊  ┊67┊      {
+┊  ┊68┊        id: '3',
+┊  ┊69┊        name: 'Avery Stewart',
+┊  ┊70┊        picture: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
+┊  ┊71┊        messages: ['3'],
+┊  ┊72┊      },
+┊  ┊73┊      {
+┊  ┊74┊        id: '4',
+┊  ┊75┊        name: 'Katie Peterson',
+┊  ┊76┊        picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
+┊  ┊77┊        messages: ['4'],
+┊  ┊78┊      },
+┊  ┊79┊    ]
+┊  ┊80┊  );
+┊  ┊81┊};
+┊  ┊82┊
+┊  ┊83┊resetDb();
```

[}]: #

And we will use the `beforeEach()` test hook to reset the `chats` and `messages` collections:

[{]: <helper> (diffStep 5.2 files="tests" module="server")

#### [__Server__ Step 5.2: Test addMessage() mutation](https://github.com/Urigo/WhatsApp-Clone-Server/commit/97c478ce8820807174b96ada2318d8bcaf21de9e)

##### Added tests&#x2F;mutations&#x2F;\__snapshots__&#x2F;addMessage.test.ts.snap
```diff
@@ -0,0 +1,22 @@
+┊  ┊ 1┊// Jest Snapshot v1, https://goo.gl/fbAQLP
+┊  ┊ 2┊
+┊  ┊ 3┊exports[`Mutation.addMessage should add message to specified chat 1`] = `
+┊  ┊ 4┊Object {
+┊  ┊ 5┊  "addMessage": Object {
+┊  ┊ 6┊    "content": "Hello World",
+┊  ┊ 7┊    "id": "5",
+┊  ┊ 8┊  },
+┊  ┊ 9┊}
+┊  ┊10┊`;
+┊  ┊11┊
+┊  ┊12┊exports[`Mutation.addMessage should add message to specified chat 2`] = `
+┊  ┊13┊Object {
+┊  ┊14┊  "chat": Object {
+┊  ┊15┊    "id": "1",
+┊  ┊16┊    "lastMessage": Object {
+┊  ┊17┊      "content": "Hello World",
+┊  ┊18┊      "id": "5",
+┊  ┊19┊    },
+┊  ┊20┊  },
+┊  ┊21┊}
+┊  ┊22┊`;
```

##### Added tests&#x2F;mutations&#x2F;addMessage.test.ts
```diff
@@ -0,0 +1,49 @@
+┊  ┊ 1┊import { createTestClient } from 'apollo-server-testing';
+┊  ┊ 2┊import { ApolloServer, gql } from 'apollo-server-express';
+┊  ┊ 3┊import schema from '../../schema';
+┊  ┊ 4┊import { resetDb } from '../../db';
+┊  ┊ 5┊
+┊  ┊ 6┊describe('Mutation.addMessage', () => {
+┊  ┊ 7┊  beforeEach(resetDb);
+┊  ┊ 8┊
+┊  ┊ 9┊  it('should add message to specified chat', async () => {
+┊  ┊10┊    const server = new ApolloServer({ schema });
+┊  ┊11┊
+┊  ┊12┊    const { query, mutate } = createTestClient(server);
+┊  ┊13┊
+┊  ┊14┊    const addMessageRes = await mutate({
+┊  ┊15┊      variables: { chatId: '1', content: 'Hello World' },
+┊  ┊16┊      mutation: gql`
+┊  ┊17┊        mutation AddMessage($chatId: ID!, $content: String!) {
+┊  ┊18┊          addMessage(chatId: $chatId, content: $content) {
+┊  ┊19┊            id
+┊  ┊20┊            content
+┊  ┊21┊          }
+┊  ┊22┊        }
+┊  ┊23┊      `,
+┊  ┊24┊    });
+┊  ┊25┊
+┊  ┊26┊    expect(addMessageRes.data).toBeDefined();
+┊  ┊27┊    expect(addMessageRes.errors).toBeUndefined();
+┊  ┊28┊    expect(addMessageRes.data).toMatchSnapshot();
+┊  ┊29┊
+┊  ┊30┊    const getChatRes = await query({
+┊  ┊31┊      variables: { chatId: '1' },
+┊  ┊32┊      query: gql`
+┊  ┊33┊        query GetChat($chatId: ID!) {
+┊  ┊34┊          chat(chatId: $chatId) {
+┊  ┊35┊            id
+┊  ┊36┊            lastMessage {
+┊  ┊37┊              id
+┊  ┊38┊              content
+┊  ┊39┊            }
+┊  ┊40┊          }
+┊  ┊41┊        }
+┊  ┊42┊      `,
+┊  ┊43┊    });
+┊  ┊44┊
+┊  ┊45┊    expect(getChatRes.data).toBeDefined();
+┊  ┊46┊    expect(getChatRes.errors).toBeUndefined();
+┊  ┊47┊    expect(getChatRes.data).toMatchSnapshot();
+┊  ┊48┊  });
+┊  ┊49┊});
```

[}]: #

Now we have the infrastructure set for sending a new message and we can start using it in our client.

**How to use a GraphQL mutation?**

Like in the previous chapters, we're gonna use a React hook so we can run a mutation more efficiently in a React.Component.
For this we're gonna use the [`useMutation()`](https://www.apollographql.com/docs/react/essentials/mutations/#the-usemutation-hook) react hook.
The first argument of the hook is the mutation string, and the second one is the [mutation options](https://www.apollographql.com/docs/react/api/apollo-client.html#ApolloClient.mutate).
We're gonna provide our mutation call with a single option called `optimisticResponse`.

Optimistic response is a common pattern that will update the state of the component twice so we can have a better UX: First it updates the component's state with the predicted result,
and then it will update the state with the actual result.



![optimistic_response](https://user-images.githubusercontent.com/7648874/54883302-859df900-4e9f-11e9-9eb7-a98108cd2482.png)


This is how the component should look like:

[{]: <helper> (diffStep 8.1 module="client")

#### [__Client__ Step 8.1: Send message with a GraphQL mutation](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/586f2c71e1fa3bb55e69426b5c1bcc205e0a5ede)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -1,7 +1,7 @@
 ┊1┊1┊import gql from 'graphql-tag';
 ┊2┊2┊import React from 'react';
 ┊3┊3┊import { useCallback } from 'react';
-┊4┊ ┊import { useApolloClient, useQuery } from '@apollo/react-hooks';
+┊ ┊4┊import { useQuery, useMutation } from '@apollo/react-hooks';
 ┊5┊5┊import styled from 'styled-components';
 ┊6┊6┊import ChatNavbar from './ChatNavbar';
 ┊7┊7┊import MessageInput from './MessageInput';
```
```diff
@@ -30,6 +30,16 @@
 ┊30┊30┊  }
 ┊31┊31┊`;
 ┊32┊32┊
+┊  ┊33┊const addMessageMutation = gql`
+┊  ┊34┊  mutation AddMessage($chatId: ID!, $content: String!) {
+┊  ┊35┊    addMessage(chatId: $chatId, content: $content) {
+┊  ┊36┊      id
+┊  ┊37┊      content
+┊  ┊38┊      createdAt
+┊  ┊39┊    }
+┊  ┊40┊  }
+┊  ┊41┊`;
+┊  ┊42┊
 ┊33┊43┊interface ChatRoomScreenParams {
 ┊34┊44┊  chatId: string;
 ┊35┊45┊  history: History;
```
```diff
@@ -54,35 +64,42 @@
 ┊ 54┊ 64┊  history,
 ┊ 55┊ 65┊  chatId,
 ┊ 56┊ 66┊}) => {
-┊ 57┊   ┊  const client = useApolloClient();
 ┊ 58┊ 67┊  const { data } = useQuery<any>(getChatQuery, {
 ┊ 59┊ 68┊    variables: { chatId },
 ┊ 60┊ 69┊  });
 ┊ 61┊ 70┊  const chat = data?.chat;
+┊   ┊ 71┊  const [addMessage] = useMutation(addMessageMutation);
 ┊ 62┊ 72┊
 ┊ 63┊ 73┊  const onSendMessage = useCallback(
 ┊ 64┊ 74┊    (content: string) => {
-┊ 65┊   ┊      if (!chat) return null;
-┊ 66┊   ┊
-┊ 67┊   ┊      const message = {
-┊ 68┊   ┊        id: (chat.messages.length + 10).toString(),
-┊ 69┊   ┊        createdAt: new Date(),
-┊ 70┊   ┊        content,
-┊ 71┊   ┊        __typename: 'Chat',
-┊ 72┊   ┊      };
-┊ 73┊   ┊
-┊ 74┊   ┊      client.writeQuery({
-┊ 75┊   ┊        query: getChatQuery,
-┊ 76┊   ┊        variables: { chatId },
-┊ 77┊   ┊        data: {
-┊ 78┊   ┊          chat: {
-┊ 79┊   ┊            ...chat,
-┊ 80┊   ┊            messages: chat.messages.concat(message),
+┊   ┊ 75┊      addMessage({
+┊   ┊ 76┊        variables: { chatId, content },
+┊   ┊ 77┊        optimisticResponse: {
+┊   ┊ 78┊          __typename: 'Mutation',
+┊   ┊ 79┊          addMessage: {
+┊   ┊ 80┊            __typename: 'Message',
+┊   ┊ 81┊            id: Math.random().toString(36).substr(2, 9),
+┊   ┊ 82┊            createdAt: new Date(),
+┊   ┊ 83┊            content,
 ┊ 81┊ 84┊          },
 ┊ 82┊ 85┊        },
+┊   ┊ 86┊        update: (client, { data }) => {
+┊   ┊ 87┊          if (data && data.addMessage) {
+┊   ┊ 88┊            client.writeQuery({
+┊   ┊ 89┊              query: getChatQuery,
+┊   ┊ 90┊              variables: { chatId },
+┊   ┊ 91┊              data: {
+┊   ┊ 92┊                chat: {
+┊   ┊ 93┊                  ...chat,
+┊   ┊ 94┊                  messages: chat.messages.concat(data.addMessage),
+┊   ┊ 95┊                },
+┊   ┊ 96┊              },
+┊   ┊ 97┊            });
+┊   ┊ 98┊          }
+┊   ┊ 99┊        },
 ┊ 83┊100┊      });
 ┊ 84┊101┊    },
-┊ 85┊   ┊    [chat, chatId, client]
+┊   ┊102┊    [chat, chatId, addMessage]
 ┊ 86┊103┊  );
 ┊ 87┊104┊
 ┊ 88┊105┊  if (!chat) return null;
```

[}]: #

Note that unlike `useQuery()`, `useMutation()` returns a callback that will run the mutation only once called, NOT immediately.
Seemingly, everything works fine, but if you'll try to navigate from `ChatsListScreen` to `ChatRoomScreen`, send a message, and then go back, you'll see that the last message was not updated.
So why is that exactly?

**Cache updating**

As explained in the previous chapter, Apollo-Client will cache all the results in a data-store.
Later on, rather than re-fetching the data, it will look up for the result in the store and will serve it to you in case it exists.
That means, that even though we ran the mutation and updated the data on the server, our data-store is still left behind and it needs to be updated as well,
otherwise Apollo-Client will see nothing wrong with the outcome.

Apollo-Client stores the data in a hash, where the key represents the query and the value represents the retrieved result.
This means that the cache will need to be updated for:


*   `chats` query - which we already did, without really diving into the reason behind it.
*   `chat(chatId: $chatId)` where `chatId` is the chat that was just mutated.

Indeed, a query will be duplicated for each and every distinct set of parameters.
So potentially our data-store can grow infinite amount of times, and we will need to take care of it and manage it correctly, so things won't get out of hand.

To update a query, we will first export the `getChats` query to a separate file so it can be imported in the `ChatRoomScreen`.
We will define all our GraphQL assets under the `src/graphql` directory:

[{]: <helper> (diffStep 8.2 files="graphql" module="client")

#### [__Client__ Step 8.2: Rewrite lastMessage to chats query](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/44289acb95f437eeca2e5ffaf7847f8442fb6187)

##### Added src&#x2F;graphql&#x2F;queries&#x2F;chats.query.ts
```diff
@@ -0,0 +1,16 @@
+┊  ┊ 1┊import gql from 'graphql-tag';
+┊  ┊ 2┊
+┊  ┊ 3┊export default gql`
+┊  ┊ 4┊  query Chats {
+┊  ┊ 5┊    chats {
+┊  ┊ 6┊      id
+┊  ┊ 7┊      name
+┊  ┊ 8┊      picture
+┊  ┊ 9┊      lastMessage {
+┊  ┊10┊        id
+┊  ┊11┊        content
+┊  ┊12┊        createdAt
+┊  ┊13┊      }
+┊  ┊14┊    }
+┊  ┊15┊  }
+┊  ┊16┊`;
```

##### Added src&#x2F;graphql&#x2F;queries&#x2F;index.ts
```diff
@@ -0,0 +1 @@
+┊ ┊1┊export { default as chats } from './chats.query';
```

[}]: #

And then we will read the memoized result from the store using [`client.readQuery`](https://www.apollographql.com/docs/react/features/caching.html#readquery),
update it, and then rewrite it using [`client.writeQuery`](https://www.apollographql.com/docs/react/features/caching.html#writequery-and-writefragment).
We can gain access to the client object via the `update` callback which will be triggered right after the mutation has been successfully executed.
This is how it should look like:

[{]: <helper> (diffStep 8.2 files="components" module="client")

#### [__Client__ Step 8.2: Rewrite lastMessage to chats query](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/44289acb95f437eeca2e5ffaf7847f8442fb6187)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -7,6 +7,7 @@
 ┊ 7┊ 7┊import MessageInput from './MessageInput';
 ┊ 8┊ 8┊import MessagesList from './MessagesList';
 ┊ 9┊ 9┊import { History } from 'history';
+┊  ┊10┊import * as queries from '../../graphql/queries';
 ┊10┊11┊
 ┊11┊12┊const Container = styled.div`
 ┊12┊13┊  background: url(/assets/chat-background.jpg);
```
```diff
@@ -60,6 +61,10 @@
 ┊60┊61┊
 ┊61┊62┊type OptionalChatQueryResult = ChatQueryResult | null;
 ┊62┊63┊
+┊  ┊64┊interface ChatsResult {
+┊  ┊65┊  chats: any[];
+┊  ┊66┊}
+┊  ┊67┊
 ┊63┊68┊const ChatRoomScreen: React.FC<ChatRoomScreenParams> = ({
 ┊64┊69┊  history,
 ┊65┊70┊  chatId,
```
```diff
@@ -96,6 +101,37 @@
 ┊ 96┊101┊              },
 ┊ 97┊102┊            });
 ┊ 98┊103┊          }
+┊   ┊104┊
+┊   ┊105┊          let clientChatsData;
+┊   ┊106┊          try {
+┊   ┊107┊            clientChatsData = client.readQuery<ChatsResult>({
+┊   ┊108┊              query: queries.chats,
+┊   ┊109┊            });
+┊   ┊110┊          } catch (e) {
+┊   ┊111┊            return;
+┊   ┊112┊          }
+┊   ┊113┊
+┊   ┊114┊          if (!clientChatsData || clientChatsData === null) {
+┊   ┊115┊            return null;
+┊   ┊116┊          }
+┊   ┊117┊          if (!clientChatsData.chats || clientChatsData.chats === undefined) {
+┊   ┊118┊            return null;
+┊   ┊119┊          }
+┊   ┊120┊          const chats = clientChatsData.chats;
+┊   ┊121┊
+┊   ┊122┊          const chatIndex = chats.findIndex((currentChat: any) => currentChat.id === chatId);
+┊   ┊123┊          if (chatIndex === -1) return;
+┊   ┊124┊          const chatWhereAdded = chats[chatIndex];
+┊   ┊125┊
+┊   ┊126┊          chatWhereAdded.lastMessage = data.addMessage;
+┊   ┊127┊          // The chat will appear at the top of the ChatsList component
+┊   ┊128┊          chats.splice(chatIndex, 1);
+┊   ┊129┊          chats.unshift(chatWhereAdded);
+┊   ┊130┊
+┊   ┊131┊          client.writeQuery({
+┊   ┊132┊            query: queries.chats,
+┊   ┊133┊            data: { chats: chats },
+┊   ┊134┊          });
 ┊ 99┊135┊        },
 ┊100┊136┊      });
 ┊101┊137┊    },
```

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.test.tsx
```diff
@@ -11,6 +11,7 @@
 ┊11┊11┊import { createBrowserHistory } from 'history';
 ┊12┊12┊import { mockApolloClient } from '../../test-helpers';
 ┊13┊13┊import ChatsList, { getChatsQuery } from './ChatsList';
+┊  ┊14┊import * as queries from '../../graphql/queries';
 ┊14┊15┊
 ┊15┊16┊describe('ChatsList', () => {
 ┊16┊17┊  afterEach(() => {
```
```diff
@@ -29,7 +30,7 @@
 ┊29┊30┊  it('renders fetched chats data', async () => {
 ┊30┊31┊    const client = mockApolloClient([
 ┊31┊32┊      {
-┊32┊  ┊        request: { query: getChatsQuery },
+┊  ┊33┊        request: { query: queries.chats },
 ┊33┊34┊        result: {
 ┊34┊35┊          data: {
 ┊35┊36┊            chats: [
```
```diff
@@ -75,7 +76,7 @@
 ┊75┊76┊  it('should navigate to the target chat room on chat item click', async () => {
 ┊76┊77┊    const client = mockApolloClient([
 ┊77┊78┊      {
-┊78┊  ┊        request: { query: getChatsQuery },
+┊  ┊79┊        request: { query: queries.chats },
 ┊79┊80┊        result: {
 ┊80┊81┊          data: {
 ┊81┊82┊            chats: [
```

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.tsx
```diff
@@ -4,8 +4,8 @@
 ┊ 4┊ 4┊import styled from 'styled-components';
 ┊ 5┊ 5┊import { useCallback } from 'react';
 ┊ 6┊ 6┊import { History } from 'history';
-┊ 7┊  ┊import gql from 'graphql-tag';
 ┊ 8┊ 7┊import { useQuery } from '@apollo/react-hooks';
+┊  ┊ 8┊import * as queries from '../../graphql/queries';
 ┊ 9┊ 9┊
 ┊10┊10┊const Container = styled.div`
 ┊11┊11┊  height: calc(100% - 56px);
```
```diff
@@ -59,27 +59,12 @@
 ┊59┊59┊  font-size: 13px;
 ┊60┊60┊`;
 ┊61┊61┊
-┊62┊  ┊export const getChatsQuery = gql`
-┊63┊  ┊  query GetChats {
-┊64┊  ┊    chats {
-┊65┊  ┊      id
-┊66┊  ┊      name
-┊67┊  ┊      picture
-┊68┊  ┊      lastMessage {
-┊69┊  ┊        id
-┊70┊  ┊        content
-┊71┊  ┊        createdAt
-┊72┊  ┊      }
-┊73┊  ┊    }
-┊74┊  ┊  }
-┊75┊  ┊`;
-┊76┊  ┊
 ┊77┊62┊interface ChatsListProps {
 ┊78┊63┊  history: History;
 ┊79┊64┊}
 ┊80┊65┊
 ┊81┊66┊const ChatsList: React.FC<ChatsListProps> = ({ history }) => {
-┊82┊  ┊  const { data } = useQuery<any>(getChatsQuery);
+┊  ┊67┊  const { data } = useQuery<any>(queries.chats);
 ┊83┊68┊
 ┊84┊69┊  const navToChat = useCallback(
 ┊85┊70┊    (chat) => {
```

[}]: #

Right now what happens is that we update a single chat document twice: Once for the `chats` query and another time for the `chat($chatId)` query.
This work is redundant and become more complex as we add more `chat` related queries.
To solve it, we can define and use a [GraphQL fragment](https://www.apollographql.com/docs/react/advanced/fragments.html).

**Using Fragments**

A GraphQL fragment is a shared piece of query logic.

```graphql
fragment NameParts on Person {
  firstName
  lastName
}

query GetPerson {
  people(id: "7") {
    ...NameParts
    avatar(size: LARGE)
  }
}
```

It's important to note that the component after the `on` clause is designated for the type we are selecting from. In this case, `people` is of type `Person` and we want to select the `firstName` and `lastName` fields from `people(id: "7")`.

Apollo maps the fragment ID to its retrieved data in the store. By default, Apollo will compose the fragment ID out of the entity type and the ID of the document. For example, for a `Chat` document with an ID of `7`, the fragment ID would be `Chat:7`. This behavior can be modified, but there's no need to.

We will define the following fragments in our app:



*   `Message` - represents a message
*   `Chat` - represents a chat, **without its messages list**.
*   `FullChat` - represents a chat, **including its messages list**.

Once we define the fragments we can start embedding them in our queries. We will create a new directory path `src/graphql/fragments`, and inside we will create a dedicated fragment file for each fragment type: `message.fragment.ts`, `chat.fragment.ts` and `fullChat.fragment.ts`:

[{]: <helper> (diffStep 8.3 files="graphql/fragments" module="client")

#### [__Client__ Step 8.3: Update queries to use GraphQL fragments](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/20a5964c850d4ee4281fbf73f2886e14e2520cb2)

##### Added src&#x2F;graphql&#x2F;fragments&#x2F;chat.fragment.ts
```diff
@@ -0,0 +1,14 @@
+┊  ┊ 1┊import gql from 'graphql-tag';
+┊  ┊ 2┊import message from './message.fragment';
+┊  ┊ 3┊
+┊  ┊ 4┊export default gql`
+┊  ┊ 5┊  fragment Chat on Chat {
+┊  ┊ 6┊    id
+┊  ┊ 7┊    name
+┊  ┊ 8┊    picture
+┊  ┊ 9┊    lastMessage {
+┊  ┊10┊      ...Message
+┊  ┊11┊    }
+┊  ┊12┊  }
+┊  ┊13┊  ${message}
+┊  ┊14┊`;
```

##### Added src&#x2F;graphql&#x2F;fragments&#x2F;fullChat.fragment.ts
```diff
@@ -0,0 +1,14 @@
+┊  ┊ 1┊import gql from 'graphql-tag';
+┊  ┊ 2┊import chat from './chat.fragment';
+┊  ┊ 3┊import message from './message.fragment';
+┊  ┊ 4┊
+┊  ┊ 5┊export default gql`
+┊  ┊ 6┊  fragment FullChat on Chat {
+┊  ┊ 7┊    ...Chat
+┊  ┊ 8┊    messages {
+┊  ┊ 9┊      ...Message
+┊  ┊10┊    }
+┊  ┊11┊  }
+┊  ┊12┊  ${chat}
+┊  ┊13┊  ${message}
+┊  ┊14┊`;
```

##### Added src&#x2F;graphql&#x2F;fragments&#x2F;index.ts
```diff
@@ -0,0 +1,3 @@
+┊ ┊1┊export { default as chat } from './chat.fragment';
+┊ ┊2┊export { default as fullChat } from './fullChat.fragment';
+┊ ┊3┊export { default as message } from './message.fragment';
```

##### Added src&#x2F;graphql&#x2F;fragments&#x2F;message.fragment.ts
```diff
@@ -0,0 +1,9 @@
+┊ ┊1┊import gql from 'graphql-tag';
+┊ ┊2┊
+┊ ┊3┊export default gql`
+┊ ┊4┊  fragment Message on Message {
+┊ ┊5┊    id
+┊ ┊6┊    createdAt
+┊ ┊7┊    content
+┊ ┊8┊  }
+┊ ┊9┊`;
```

[}]: #

And now that we have the fragments available to us, let's embed them in the relevant queries:

[{]: <helper> (diffStep 8.3 files="components, graphql/queries" module="client")

#### [__Client__ Step 8.3: Update queries to use GraphQL fragments](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/20a5964c850d4ee4281fbf73f2886e14e2520cb2)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -8,6 +8,7 @@
 ┊ 8┊ 8┊import MessagesList from './MessagesList';
 ┊ 9┊ 9┊import { History } from 'history';
 ┊10┊10┊import * as queries from '../../graphql/queries';
+┊  ┊11┊import * as fragments from '../../graphql/fragments';
 ┊11┊12┊
 ┊12┊13┊const Container = styled.div`
 ┊13┊14┊  background: url(/assets/chat-background.jpg);
```
```diff
@@ -19,26 +20,19 @@
 ┊19┊20┊const getChatQuery = gql`
 ┊20┊21┊  query GetChat($chatId: ID!) {
 ┊21┊22┊    chat(chatId: $chatId) {
-┊22┊  ┊      id
-┊23┊  ┊      name
-┊24┊  ┊      picture
-┊25┊  ┊      messages {
-┊26┊  ┊        id
-┊27┊  ┊        content
-┊28┊  ┊        createdAt
-┊29┊  ┊      }
+┊  ┊23┊      ...FullChat
 ┊30┊24┊    }
 ┊31┊25┊  }
+┊  ┊26┊  ${fragments.fullChat}
 ┊32┊27┊`;
 ┊33┊28┊
 ┊34┊29┊const addMessageMutation = gql`
 ┊35┊30┊  mutation AddMessage($chatId: ID!, $content: String!) {
 ┊36┊31┊    addMessage(chatId: $chatId, content: $content) {
-┊37┊  ┊      id
-┊38┊  ┊      content
-┊39┊  ┊      createdAt
+┊  ┊32┊      ...Message
 ┊40┊33┊    }
 ┊41┊34┊  }
+┊  ┊35┊  ${fragments.message}
 ┊42┊36┊`;
 ┊43┊37┊
 ┊44┊38┊interface ChatRoomScreenParams {
```

##### Changed src&#x2F;graphql&#x2F;queries&#x2F;chats.query.ts
```diff
@@ -1,16 +1,11 @@
 ┊ 1┊ 1┊import gql from 'graphql-tag';
+┊  ┊ 2┊import * as fragments from '../fragments';
 ┊ 2┊ 3┊
 ┊ 3┊ 4┊export default gql`
 ┊ 4┊ 5┊  query Chats {
 ┊ 5┊ 6┊    chats {
-┊ 6┊  ┊      id
-┊ 7┊  ┊      name
-┊ 8┊  ┊      picture
-┊ 9┊  ┊      lastMessage {
-┊10┊  ┊        id
-┊11┊  ┊        content
-┊12┊  ┊        createdAt
-┊13┊  ┊      }
+┊  ┊ 7┊      ...Chat
 ┊14┊ 8┊    }
 ┊15┊ 9┊  }
+┊  ┊10┊  ${fragments.chat}
 ┊16┊11┊`;
```

[}]: #

Similarly to query rewriting, we will use the [`readFragment()`](https://www.apollographql.com/docs/react/features/caching.html#readfragment) and [`writeFragment()`](https://www.apollographql.com/docs/react/features/caching.html#writefragment) methods in the same way to rewrite the fragments. When working with a fragment we need to compose its ID, just like explained earlier. The default mapping function called `defaultDataIdFromObject` can be imported from `apollo-cache-inmemory` and be used to specify the fragment that we would like to read/write. Accordingly, we're gonna replace all our query re-writings with fragments re-writings, as we don't need them anymore:

[{]: <helper> (diffStep 8.4 module="client")

#### [__Client__ Step 8.4: Rewrite fragments](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/c6fac82214ce5160a883e41e09d5bd45f22c2de2)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -1,3 +1,4 @@
+┊ ┊1┊import { defaultDataIdFromObject } from 'apollo-cache-inmemory';
 ┊1┊2┊import gql from 'graphql-tag';
 ┊2┊3┊import React from 'react';
 ┊3┊4┊import { useCallback } from 'react';
```
```diff
@@ -84,48 +85,75 @@
 ┊ 84┊ 85┊        },
 ┊ 85┊ 86┊        update: (client, { data }) => {
 ┊ 86┊ 87┊          if (data && data.addMessage) {
-┊ 87┊   ┊            client.writeQuery({
-┊ 88┊   ┊              query: getChatQuery,
-┊ 89┊   ┊              variables: { chatId },
-┊ 90┊   ┊              data: {
-┊ 91┊   ┊                chat: {
-┊ 92┊   ┊                  ...chat,
-┊ 93┊   ┊                  messages: chat.messages.concat(data.addMessage),
-┊ 94┊   ┊                },
-┊ 95┊   ┊              },
+┊   ┊ 88┊            type FullChat = { [key: string]: any };
+┊   ┊ 89┊            let fullChat;
+┊   ┊ 90┊            const chatIdFromStore = defaultDataIdFromObject(chat);
+┊   ┊ 91┊
+┊   ┊ 92┊            if (chatIdFromStore === null) {
+┊   ┊ 93┊              return;
+┊   ┊ 94┊            }
+┊   ┊ 95┊
+┊   ┊ 96┊            try {
+┊   ┊ 97┊              fullChat = client.readFragment<FullChat>({
+┊   ┊ 98┊                id: chatIdFromStore,
+┊   ┊ 99┊                fragment: fragments.fullChat,
+┊   ┊100┊                fragmentName: 'FullChat',
+┊   ┊101┊              });
+┊   ┊102┊            } catch (e) {
+┊   ┊103┊              return;
+┊   ┊104┊            }
+┊   ┊105┊
+┊   ┊106┊            if (fullChat === null ||
+┊   ┊107┊                fullChat.messages === null ||
+┊   ┊108┊                data === null ||
+┊   ┊109┊                data.addMessage === null ||
+┊   ┊110┊                data.addMessage.id === null) {
+┊   ┊111┊              return;
+┊   ┊112┊            }
+┊   ┊113┊            if (fullChat.messages.some((currentMessage: any) => currentMessage.id === data.addMessage.id)){
+┊   ┊114┊              return;
+┊   ┊115┊            }
+┊   ┊116┊
+┊   ┊117┊            fullChat.messages.push(data.addMessage);
+┊   ┊118┊            fullChat.lastMessage = data.addMessage;
+┊   ┊119┊
+┊   ┊120┊            client.writeFragment({
+┊   ┊121┊              id: chatIdFromStore,
+┊   ┊122┊              fragment: fragments.fullChat,
+┊   ┊123┊              fragmentName: 'FullChat',
+┊   ┊124┊              data: fullChat,
 ┊ 96┊125┊            });
-┊ 97┊   ┊          }
 ┊ 98┊126┊
-┊ 99┊   ┊          let clientChatsData;
-┊100┊   ┊          try {
-┊101┊   ┊            clientChatsData = client.readQuery<ChatsResult>({
+┊   ┊127┊            let clientChatsData;
+┊   ┊128┊            try {
+┊   ┊129┊              clientChatsData = client.readQuery<ChatsResult>({
+┊   ┊130┊                query: queries.chats,
+┊   ┊131┊              });
+┊   ┊132┊            } catch (e) {
+┊   ┊133┊              return;
+┊   ┊134┊            }
+┊   ┊135┊
+┊   ┊136┊            if (!clientChatsData || clientChatsData === null) {
+┊   ┊137┊              return null;
+┊   ┊138┊            }
+┊   ┊139┊            if (!clientChatsData.chats || clientChatsData.chats === undefined) {
+┊   ┊140┊              return null;
+┊   ┊141┊            }
+┊   ┊142┊            const chats = clientChatsData.chats;
+┊   ┊143┊
+┊   ┊144┊            const chatIndex = chats.findIndex((currentChat: any) => currentChat.id === chatId);
+┊   ┊145┊            if (chatIndex === -1) return;
+┊   ┊146┊            const chatWhereAdded = chats[chatIndex];
+┊   ┊147┊
+┊   ┊148┊            // The chat will appear at the top of the ChatsList component
+┊   ┊149┊            chats.splice(chatIndex, 1);
+┊   ┊150┊            chats.unshift(chatWhereAdded);
+┊   ┊151┊
+┊   ┊152┊            client.writeQuery({
 ┊102┊153┊              query: queries.chats,
+┊   ┊154┊              data: { chats: chats },
 ┊103┊155┊            });
-┊104┊   ┊          } catch (e) {
-┊105┊   ┊            return;
-┊106┊   ┊          }
-┊107┊   ┊
-┊108┊   ┊          if (!clientChatsData || clientChatsData === null) {
-┊109┊   ┊            return null;
 ┊110┊156┊          }
-┊111┊   ┊          if (!clientChatsData.chats || clientChatsData.chats === undefined) {
-┊112┊   ┊            return null;
-┊113┊   ┊          }
-┊114┊   ┊          const chats = clientChatsData.chats;
-┊115┊   ┊
-┊116┊   ┊          const chatIndex = chats.findIndex((currentChat: any) => currentChat.id === chatId);
-┊117┊   ┊          if (chatIndex === -1) return;
-┊118┊   ┊          const chatWhereAdded = chats[chatIndex];
-┊119┊   ┊
-┊120┊   ┊          chatWhereAdded.lastMessage = data.addMessage;
-┊121┊   ┊          // The chat will appear at the top of the ChatsList component
-┊122┊   ┊          chats.splice(chatIndex, 1);
-┊123┊   ┊          chats.unshift(chatWhereAdded);
-┊124┊   ┊
-┊125┊   ┊          client.writeQuery({
-┊126┊   ┊            query: queries.chats,
-┊127┊   ┊            data: { chats: chats },
-┊128┊   ┊          });
 ┊129┊157┊        },
 ┊130┊158┊      });
 ┊131┊159┊    },
```

[}]: #


----------
TODO: Isn’t `chats.splice(0, Infinity, ...[ … ])` the same as `chats = [...]` ?
I see an explanation of apollo-cache but it makes you feel it’s the fragment that’s being cached, which is not true, it’s the object type.
We shouldn’t use `defaultDataIdFromObject` directly from `apollo-cache-inmemory` but define it somewhere in our code and use that. It might change in the future and then we would have to do it in 500 files.
I would explain a lot more than it is now, about the caching. It should be based on a simpler example and show that when an entity `Foo:1` is modified, the change reflects in all component. We should describe how it’s stored, as references and not real data and so on.

TODO: Better fragments naming and convensions

[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step7.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step9.md) |
|:--------------------------------|--------------------------------:|

[}]: #
