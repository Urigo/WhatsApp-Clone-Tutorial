# Step 8: Sending messages with GraphQL mutations

[//]: # (head-end)


The view and the functionality for updating the component's state when sending a message already exists.
The thing is that messages are not really being sent, we only update the memory in the client.

If so, how exactly can we send messages and store them in the DB? For this purpose we're gonna learn about GraphQL mutations -
a method for sending and applying mutations in our back-end.

**What are GraphQL mutations?**

If you have an API endpoint that alters data, like inserting data into a database or altering data already in a database,
you should make this endpoint a `Mutation` rather than a `Query`.
This is as simple as making the API endpoint part of the top-level `Mutation` type instead of the top-level `Query` type.

It's often convenient to have a mutation that maps to a database create or update operation, return the same thing that the server stored.
That way, if you modify the data on the server, the client can learn about those modifications.
**A GraphQL mutation is like a GraphQL query, only with side effects**.
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

#### [Server Step 5.1: Add addMessage() mutation](https://github.com/Urigo/WhatsApp-Clone-Server/commit/5b54877)

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -18,3 +18,7 @@
 ┊18┊18┊  chats: [Chat!]!
 ┊19┊19┊  chat(chatId: ID!): Chat
 ┊20┊20┊}
+┊  ┊21┊
+┊  ┊22┊type Mutation {
+┊  ┊23┊  addMessage(chatId: ID!, content: String!): Message
+┊  ┊24┊}
```

[}]: #

Note that our mutation resolver `addMessage` receives a `chatId`. This is because when adding a message, we should update both the messages collection, and the correlated chat document. Mutations are resolved exactly like any other type in our resolvers manifest. The new resolver should look like this:

[{]: <helper> (diffStep 5.1 files="resolvers" module="server")

#### [Server Step 5.1: Add addMessage() mutation](https://github.com/Urigo/WhatsApp-Clone-Server/commit/5b54877)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -25,6 +25,31 @@
 ┊25┊25┊      return chats.find(c => c.id === chatId)
 ┊26┊26┊    },
 ┊27┊27┊  },
+┊  ┊28┊
+┊  ┊29┊  Mutation: {
+┊  ┊30┊    addMessage(root: any, { chatId, content }: any) {
+┊  ┊31┊      const chatIndex = chats.findIndex(c => c.id === chatId)
+┊  ┊32┊
+┊  ┊33┊      if (chatIndex === -1) return null
+┊  ┊34┊
+┊  ┊35┊      const chat = chats[chatIndex]
+┊  ┊36┊      const lastMessageId = chat.messages[chat.messages.length - 1]
+┊  ┊37┊      const messageId = String(Number(lastMessageId) + 1)
+┊  ┊38┊      const message = {
+┊  ┊39┊        id: messageId,
+┊  ┊40┊        createdAt: new Date(),
+┊  ┊41┊        content,
+┊  ┊42┊      }
+┊  ┊43┊
+┊  ┊44┊      messages.push(message)
+┊  ┊45┊      chat.messages.push(messageId)
+┊  ┊46┊      // The chat will appear at the top of the ChatsList component
+┊  ┊47┊      chats.splice(chatIndex, 1)
+┊  ┊48┊      chats.unshift(chat)
+┊  ┊49┊
+┊  ┊50┊      return message
+┊  ┊51┊    }
+┊  ┊52┊  }
 ┊28┊53┊}
 ┊29┊54┊
 ┊30┊55┊export default resolvers
```

[}]: #

In terms of testing, we will use a temporary solution for now to reset the DB each time we test a mutation. Since we make a modification in the DB, we need to make sure that each test is completely agnostic and doesn't affect one another, thus, we will export a `resetDB()` method from our `db.ts` module:

[{]: <helper> (diffStep 5.2 files="db.ts" module="server")

#### [Server Step 5.2: Test addMessage() mutation](https://github.com/Urigo/WhatsApp-Clone-Server/commit/78b7349)

##### Changed db.ts
```diff
@@ -1,49 +1,69 @@
-┊ 1┊  ┊export const messages = [
-┊ 2┊  ┊  {
-┊ 3┊  ┊    id: '1',
-┊ 4┊  ┊    content: "You on your way?",
-┊ 5┊  ┊    createdAt: new Date(new Date('1-1-2019').getTime() - 60 * 1000 * 1000),
-┊ 6┊  ┊  },
-┊ 7┊  ┊  {
-┊ 8┊  ┊    id: '2',
-┊ 9┊  ┊    content: "Hey, it's me",
-┊10┊  ┊    createdAt: new Date(new Date('1-1-2019').getTime() - 2 * 60 * 1000 * 1000),
-┊11┊  ┊  },
-┊12┊  ┊  {
-┊13┊  ┊    id: '3',
-┊14┊  ┊    content: "I should buy a boat",
-┊15┊  ┊    createdAt: new Date(new Date('1-1-2019').getTime() - 24 * 60 * 1000 * 1000),
-┊16┊  ┊  },
-┊17┊  ┊  {
-┊18┊  ┊    id: '4',
-┊19┊  ┊    content: "This is wicked good ice cream.",
-┊20┊  ┊    createdAt: new Date(new Date('1-1-2019').getTime() - 14 * 24 * 60 * 1000 * 1000),
-┊21┊  ┊  },
-┊22┊  ┊]
+┊  ┊ 1┊export type Message = {
+┊  ┊ 2┊  id: string
+┊  ┊ 3┊  content: string
+┊  ┊ 4┊  createdAt: Date
+┊  ┊ 5┊}
 ┊23┊ 6┊
-┊24┊  ┊export const chats = [
-┊25┊  ┊  {
-┊26┊  ┊    id: '1',
-┊27┊  ┊    name: 'Ethan Gonzalez',
-┊28┊  ┊    picture: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
-┊29┊  ┊    messages: ['1'],
-┊30┊  ┊  },
-┊31┊  ┊  {
-┊32┊  ┊    id: '2',
-┊33┊  ┊    name: 'Bryan Wallace',
-┊34┊  ┊    picture: 'https://randomuser.me/api/portraits/thumb/men/2.jpg',
-┊35┊  ┊    messages: ['2'],
-┊36┊  ┊  },
-┊37┊  ┊  {
-┊38┊  ┊    id: '3',
-┊39┊  ┊    name: 'Avery Stewart',
-┊40┊  ┊    picture: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
-┊41┊  ┊    messages: ['3'],
-┊42┊  ┊  },
-┊43┊  ┊  {
-┊44┊  ┊    id: '4',
-┊45┊  ┊    name: 'Katie Peterson',
-┊46┊  ┊    picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
-┊47┊  ┊    messages: ['4'],
-┊48┊  ┊  },
-┊49┊  ┊]
+┊  ┊ 7┊export type Chat = {
+┊  ┊ 8┊  id: string
+┊  ┊ 9┊  name: string
+┊  ┊10┊  picture: string
+┊  ┊11┊  messages: string[]
+┊  ┊12┊}
+┊  ┊13┊
+┊  ┊14┊export const messages: Message[] = []
+┊  ┊15┊export const chats: Chat[] = []
+┊  ┊16┊
+┊  ┊17┊export const resetDb = () => {
+┊  ┊18┊  messages.splice(0, Infinity, ...[
+┊  ┊19┊    {
+┊  ┊20┊      id: '1',
+┊  ┊21┊      content: "You on your way?",
+┊  ┊22┊      createdAt: new Date(new Date('1-1-2019').getTime() - 60 * 1000 * 1000),
+┊  ┊23┊    },
+┊  ┊24┊    {
+┊  ┊25┊      id: '2',
+┊  ┊26┊      content: "Hey, it's me",
+┊  ┊27┊      createdAt: new Date(new Date('1-1-2019').getTime() - 2 * 60 * 1000 * 1000),
+┊  ┊28┊    },
+┊  ┊29┊    {
+┊  ┊30┊      id: '3',
+┊  ┊31┊      content: "I should buy a boat",
+┊  ┊32┊      createdAt: new Date(new Date('1-1-2019').getTime() - 24 * 60 * 1000 * 1000),
+┊  ┊33┊    },
+┊  ┊34┊    {
+┊  ┊35┊      id: '4',
+┊  ┊36┊      content: "This is wicked good ice cream.",
+┊  ┊37┊      createdAt: new Date(new Date('1-1-2019').getTime() - 14 * 24 * 60 * 1000 * 1000),
+┊  ┊38┊    },
+┊  ┊39┊  ])
+┊  ┊40┊
+┊  ┊41┊  chats.splice(0, Infinity, ...[
+┊  ┊42┊    {
+┊  ┊43┊      id: '1',
+┊  ┊44┊      name: 'Ethan Gonzalez',
+┊  ┊45┊      picture: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
+┊  ┊46┊      messages: ['1'],
+┊  ┊47┊    },
+┊  ┊48┊    {
+┊  ┊49┊      id: '2',
+┊  ┊50┊      name: 'Bryan Wallace',
+┊  ┊51┊      picture: 'https://randomuser.me/api/portraits/thumb/men/2.jpg',
+┊  ┊52┊      messages: ['2'],
+┊  ┊53┊    },
+┊  ┊54┊    {
+┊  ┊55┊      id: '3',
+┊  ┊56┊      name: 'Avery Stewart',
+┊  ┊57┊      picture: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
+┊  ┊58┊      messages: ['3'],
+┊  ┊59┊    },
+┊  ┊60┊    {
+┊  ┊61┊      id: '4',
+┊  ┊62┊      name: 'Katie Peterson',
+┊  ┊63┊      picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
+┊  ┊64┊      messages: ['4'],
+┊  ┊65┊    },
+┊  ┊66┊  ])
+┊  ┊67┊}
+┊  ┊68┊
+┊  ┊69┊resetDb()
```

[}]: #

And we will use the `beforeEach()` test hook to reset the `chats` and `messages` collections:

[{]: <helper> (diffStep 5.2 files="tests" module="server")

#### [Server Step 5.2: Test addMessage() mutation](https://github.com/Urigo/WhatsApp-Clone-Server/commit/78b7349)

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
+┊  ┊ 1┊import { createTestClient } from 'apollo-server-testing'
+┊  ┊ 2┊import { ApolloServer, gql } from 'apollo-server-express'
+┊  ┊ 3┊import schema from '../../schema'
+┊  ┊ 4┊import { resetDb } from '../../db'
+┊  ┊ 5┊
+┊  ┊ 6┊describe('Mutation.addMessage', () => {
+┊  ┊ 7┊  beforeEach(resetDb)
+┊  ┊ 8┊
+┊  ┊ 9┊  it('should add message to specified chat', async () => {
+┊  ┊10┊    const server = new ApolloServer({ schema })
+┊  ┊11┊
+┊  ┊12┊    const { query, mutate } = createTestClient(server)
+┊  ┊13┊
+┊  ┊14┊    const addMessageRes = await mutate({
+┊  ┊15┊      variables: { chatId: '1', content: 'Hello World' },
+┊  ┊16┊      mutation: gql `
+┊  ┊17┊        mutation AddMessage($chatId: ID!, $content: String!) {
+┊  ┊18┊          addMessage(chatId: $chatId, content: $content) {
+┊  ┊19┊            id
+┊  ┊20┊            content
+┊  ┊21┊          }
+┊  ┊22┊        }
+┊  ┊23┊      `,
+┊  ┊24┊    })
+┊  ┊25┊
+┊  ┊26┊    expect(addMessageRes.data).toBeDefined()
+┊  ┊27┊    expect(addMessageRes.errors).toBeUndefined()
+┊  ┊28┊    expect(addMessageRes.data).toMatchSnapshot()
+┊  ┊29┊
+┊  ┊30┊    const getChatRes = await query({
+┊  ┊31┊      variables: { chatId: '1' },
+┊  ┊32┊      query: gql `
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
+┊  ┊43┊    })
+┊  ┊44┊
+┊  ┊45┊    expect(getChatRes.data).toBeDefined()
+┊  ┊46┊    expect(getChatRes.errors).toBeUndefined()
+┊  ┊47┊    expect(getChatRes.data).toMatchSnapshot()
+┊  ┊48┊  })
+┊  ┊49┊})
```

[}]: #

Now we have the infrastructure set for sending a new message and we can start using it in our client.

**How to use a GraphQL mutation?**

Like in the previous chapters, we're gonna use a React hook so we can run a mutation more efficiently in a React.Component.
For this we're gonna use the [`useMutation()`](https://github.com/trojanowski/react-apollo-hooks#usemutation) react hook.
The first argument of the hook is the mutation string, and the second one is the [mutation options](https://www.apollographql.com/docs/react/api/apollo-client.html#ApolloClient.mutate).
We're gonna provide our mutation call with a single option called `optimisticResponse`.

Optimistic response is a common pattern that will update the state of the component twice so we can have a better UX: First it updates the component's state with the predicted result,
and then it will update the state with the actual result.



![optimistic_response](https://user-images.githubusercontent.com/7648874/54883302-859df900-4e9f-11e9-9eb7-a98108cd2482.png)


This is how the component should look like:

[{]: <helper> (diffStep 8.1 module="client")

#### Client Step 8.1: Send message with a GraphQL mutation

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -1,7 +1,7 @@
 ┊1┊1┊import gql from 'graphql-tag';
 ┊2┊2┊import React from 'react';
 ┊3┊3┊import { useCallback } from 'react';
-┊4┊ ┊import { useApolloClient, useQuery } from 'react-apollo-hooks';
+┊ ┊4┊import { useQuery, useMutation } from 'react-apollo-hooks';
 ┊5┊5┊import styled from 'styled-components';
 ┊6┊6┊import ChatNavbar from './ChatNavbar';
 ┊7┊7┊import MessageInput from './MessageInput';
```
```diff
@@ -30,6 +30,16 @@
 ┊30┊30┊  }
 ┊31┊31┊`;
 ┊32┊32┊
+┊  ┊33┊const addMessageMutation = gql `
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
 ┊34┊44┊  chatId: string
 ┊35┊45┊  history: History;
```
```diff
@@ -51,32 +61,37 @@
 ┊51┊61┊type OptionalChatQueryResult = ChatQueryResult | null;
 ┊52┊62┊
 ┊53┊63┊const ChatRoomScreen: React.FC<ChatRoomScreenParams> = ({ history, chatId }) => {
-┊54┊  ┊  const client = useApolloClient();
 ┊55┊64┊  const { data: { chat } } = useQuery<any>(getChatQuery, {
 ┊56┊65┊    variables: { chatId }
 ┊57┊66┊  });
+┊  ┊67┊  const addMessage = useMutation(addMessageMutation);
 ┊58┊68┊
 ┊59┊69┊  const onSendMessage = useCallback((content: string) => {
-┊60┊  ┊    if (!chat) return null;
-┊61┊  ┊
-┊62┊  ┊    const message = {
-┊63┊  ┊      id: (chat.messages.length + 10).toString(),
-┊64┊  ┊      createdAt: Date.now(),
-┊65┊  ┊      content,
-┊66┊  ┊      __typename: "Chat",
-┊67┊  ┊    };
-┊68┊  ┊
-┊69┊  ┊    client.writeQuery({
-┊70┊  ┊      query: getChatQuery,
-┊71┊  ┊      variables: { chatId },
-┊72┊  ┊      data: {
-┊73┊  ┊        chat: {
-┊74┊  ┊          ...chat,
-┊75┊  ┊          messages: chat.messages.concat(message),
-┊76┊  ┊        },
+┊  ┊70┊    addMessage({
+┊  ┊71┊      variables: { chatId, content },
+┊  ┊72┊      optimisticResponse: {
+┊  ┊73┊        __typename: 'Mutation',
+┊  ┊74┊        addMessage: {
+┊  ┊75┊          __typename: 'Message',
+┊  ┊76┊          id: Math.random().toString(36).substr(2, 9),
+┊  ┊77┊          createdAt: new Date(),
+┊  ┊78┊          content,
+┊  ┊79┊        }
 ┊77┊80┊      },
-┊78┊  ┊    })
-┊79┊  ┊  }, [chat, chatId, client]);
+┊  ┊81┊      update: (client, { data: { addMessage } }) => {
+┊  ┊82┊        client.writeQuery({
+┊  ┊83┊          query: getChatQuery,
+┊  ┊84┊          variables: { chatId },
+┊  ┊85┊          data: {
+┊  ┊86┊            chat: {
+┊  ┊87┊              ...chat,
+┊  ┊88┊              messages: chat.messages.concat(addMessage)
+┊  ┊89┊            }
+┊  ┊90┊          }
+┊  ┊91┊        });
+┊  ┊92┊      }
+┊  ┊93┊    });
+┊  ┊94┊  }, [chat, chatId, addMessage]);
 ┊80┊95┊
 ┊81┊96┊  if (!chat) return null;
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

#### Client Step 8.2: Rewrite lastMessage to chats query

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

#### Client Step 8.2: Rewrite lastMessage to chats query

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -7,6 +7,7 @@
 ┊ 7┊ 7┊import MessageInput from './MessageInput';
 ┊ 8┊ 8┊import MessagesList from './MessagesList';
 ┊ 9┊ 9┊import { History } from 'history';
+┊  ┊10┊import * as queries from '../../graphql/queries';
 ┊10┊11┊
 ┊11┊12┊ const Container = styled.div `
 ┊12┊13┊  background: url(/assets/chat-background.jpg);
```
```diff
@@ -26,8 +27,8 @@
 ┊26┊27┊        content
 ┊27┊28┊        createdAt
 ┊28┊29┊      }
-┊29┊  ┊    }
 ┊30┊30┊  }
+┊  ┊31┊}
 ┊31┊32┊`;
 ┊32┊33┊
 ┊33┊34┊const addMessageMutation = gql `
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
 ┊63┊68┊const ChatRoomScreen: React.FC<ChatRoomScreenParams> = ({ history, chatId }) => {
 ┊64┊69┊  const { data: { chat } } = useQuery<any>(getChatQuery, {
 ┊65┊70┊    variables: { chatId }
```
```diff
@@ -89,6 +94,33 @@
 ┊ 89┊ 94┊            }
 ┊ 90┊ 95┊          }
 ┊ 91┊ 96┊        });
+┊   ┊ 97┊
+┊   ┊ 98┊        let data;
+┊   ┊ 99┊        try {
+┊   ┊100┊          data = client.readQuery<ChatsResult>({
+┊   ┊101┊            query: queries.chats,
+┊   ┊102┊          });
+┊   ┊103┊        } catch (e) {
+┊   ┊104┊          return;
+┊   ┊105┊        }
+┊   ┊106┊
+┊   ┊107┊        if (!data) return;
+┊   ┊108┊        const chats = data.chats;
+┊   ┊109┊        if (!chats) return;
+┊   ┊110┊
+┊   ┊111┊        const chatIndex = chats.findIndex((c:any) => c.id === chatId);
+┊   ┊112┊        if (chatIndex === -1) return;
+┊   ┊113┊        const chatWhereAdded = chats[chatIndex];
+┊   ┊114┊
+┊   ┊115┊        chatWhereAdded.lastMessage = addMessage;
+┊   ┊116┊        // The chat will appear at the top of the ChatsList component
+┊   ┊117┊        chats.splice(chatIndex, 1);
+┊   ┊118┊        chats.unshift(chatWhereAdded);
+┊   ┊119┊
+┊   ┊120┊        client.writeQuery({
+┊   ┊121┊          query: queries.chats,
+┊   ┊122┊          data: { chats: chats },
+┊   ┊123┊        });
 ┊ 92┊124┊      }
 ┊ 93┊125┊    });
 ┊ 94┊126┊  }, [chat, chatId, addMessage]);
```

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.test.tsx
```diff
@@ -5,6 +5,7 @@
 ┊ 5┊ 5┊import { createBrowserHistory } from 'history';
 ┊ 6┊ 6┊import { mockApolloClient } from '../../test-helpers';
 ┊ 7┊ 7┊import ChatsList, { getChatsQuery } from './ChatsList';
+┊  ┊ 8┊import * as queries from '../../graphql/queries';
 ┊ 8┊ 9┊
 ┊ 9┊10┊describe('ChatsList', () => {
 ┊10┊11┊  afterEach(() => {
```
```diff
@@ -15,7 +16,7 @@
 ┊15┊16┊  it('renders fetched chats data', async () => {
 ┊16┊17┊    const client = mockApolloClient([
 ┊17┊18┊      {
-┊18┊  ┊        request: { query: getChatsQuery },
+┊  ┊19┊        request: { query: queries.chats },
 ┊19┊20┊        result: {
 ┊20┊21┊          data: {
 ┊21┊22┊            chats: [
```
```diff
@@ -56,7 +57,7 @@
 ┊56┊57┊  it('should navigate to the target chat room on chat item click', async () => {
 ┊57┊58┊    const client = mockApolloClient([
 ┊58┊59┊      {
-┊59┊  ┊        request: { query: getChatsQuery },
+┊  ┊60┊        request: { query: queries.chats },
 ┊60┊61┊        result: {
 ┊61┊62┊          data: {
 ┊62┊63┊            chats: [
```

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.tsx
```diff
@@ -4,8 +4,8 @@
 ┊ 4┊ 4┊import styled from 'styled-components';
 ┊ 5┊ 5┊import { useCallback } from 'react';
 ┊ 6┊ 6┊import { History } from 'history';
-┊ 7┊  ┊import gql from 'graphql-tag';
 ┊ 8┊ 7┊import { useQuery } from 'react-apollo-hooks';
+┊  ┊ 8┊import * as queries from '../../graphql/queries';
 ┊ 9┊ 9┊
 ┊10┊10┊const Container = styled.div `
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
 ┊78┊63┊  history : History;
 ┊79┊64┊};
 ┊80┊65┊
 ┊81┊66┊const ChatsList: React.FC<ChatsListProps> = ({ history }) => {
-┊82┊  ┊  const { data: { chats = [] } } = useQuery<any>(getChatsQuery);
+┊  ┊67┊  const { data: { chats = [] } } = useQuery<any>(queries.chats);
 ┊83┊68┊
 ┊84┊69┊  const navToChat = useCallback((chat) => {
 ┊85┊70┊    history.push(`chats/${chat.id}`)
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

#### Client Step 8.3: Update queries to use GraphQL fragments

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

#### Client Step 8.3: Update queries to use GraphQL fragments

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -8,6 +8,7 @@
 ┊ 8┊ 8┊import MessagesList from './MessagesList';
 ┊ 9┊ 9┊import { History } from 'history';
 ┊10┊10┊import * as queries from '../../graphql/queries';
+┊  ┊11┊import * as fragments from '../../graphql/fragments';
 ┊11┊12┊
 ┊12┊13┊ const Container = styled.div `
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
+┊  ┊24┊    }
 ┊30┊25┊  }
-┊31┊  ┊}
+┊  ┊26┊  ${fragments.fullChat}
 ┊32┊27┊`;
 ┊33┊28┊
 ┊34┊29┊const addMessageMutation = gql `
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

#### Client Step 8.4: Rewrite fragments

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -1,3 +1,4 @@
+┊ ┊1┊import { defaultDataIdFromObject } from 'apollo-cache-inmemory';
 ┊1┊2┊import gql from 'graphql-tag';
 ┊2┊3┊import React from 'react';
 ┊3┊4┊import { useCallback } from 'react';
```
```diff
@@ -78,15 +79,33 @@
 ┊ 78┊ 79┊        }
 ┊ 79┊ 80┊      },
 ┊ 80┊ 81┊      update: (client, { data: { addMessage } }) => {
-┊ 81┊   ┊        client.writeQuery({
-┊ 82┊   ┊          query: getChatQuery,
-┊ 83┊   ┊          variables: { chatId },
-┊ 84┊   ┊          data: {
-┊ 85┊   ┊            chat: {
-┊ 86┊   ┊              ...chat,
-┊ 87┊   ┊              messages: chat.messages.concat(addMessage)
-┊ 88┊   ┊            }
-┊ 89┊   ┊          }
+┊   ┊ 82┊        type FullChat = { [key: string]: any };
+┊   ┊ 83┊        let fullChat;
+┊   ┊ 84┊        const chatIdFromStore = defaultDataIdFromObject(chat);
+┊   ┊ 85┊
+┊   ┊ 86┊        if (chatIdFromStore === null) { return; }
+┊   ┊ 87┊
+┊   ┊ 88┊        try {
+┊   ┊ 89┊          fullChat = client.readFragment<FullChat>({
+┊   ┊ 90┊            id: chatIdFromStore,
+┊   ┊ 91┊            fragment: fragments.fullChat,
+┊   ┊ 92┊            fragmentName: 'FullChat',
+┊   ┊ 93┊          });
+┊   ┊ 94┊        } catch (e) {
+┊   ┊ 95┊          return;
+┊   ┊ 96┊        }
+┊   ┊ 97┊
+┊   ┊ 98┊        if (fullChat === null) { return; }
+┊   ┊ 99┊        if (fullChat.messages.some((m:any) => m.id === addMessage.id)) return;
+┊   ┊100┊
+┊   ┊101┊        fullChat.messages.push(addMessage);
+┊   ┊102┊        fullChat.lastMessage = addMessage;
+┊   ┊103┊
+┊   ┊104┊        client.writeFragment({
+┊   ┊105┊          id: chatIdFromStore,
+┊   ┊106┊          fragment: fragments.fullChat,
+┊   ┊107┊          fragmentName: 'FullChat',
+┊   ┊108┊          data: fullChat,
 ┊ 90┊109┊        });
 ┊ 91┊110┊
 ┊ 92┊111┊        let data;
```
```diff
@@ -106,7 +125,6 @@
 ┊106┊125┊        if (chatIndex === -1) return;
 ┊107┊126┊        const chatWhereAdded = chats[chatIndex];
 ┊108┊127┊
-┊109┊   ┊        chatWhereAdded.lastMessage = addMessage;
 ┊110┊128┊        // The chat will appear at the top of the ChatsList component
 ┊111┊129┊        chats.splice(chatIndex, 1);
 ┊112┊130┊        chats.unshift(chatWhereAdded);
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

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@0.1.0/.tortilla/manuals/views/step7.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@0.1.0/.tortilla/manuals/views/step9.md) |
|:--------------------------------|--------------------------------:|

[}]: #
