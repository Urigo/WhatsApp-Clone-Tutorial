# Step 8: Sending messages with GraphQL mutations

[//]: # (head-end)


The view and the functionality for updating the component's state when sending a message already exists. The thing is that messages are not really being sent, we only update the memory in the client. If so, how exactly can we send messages and store them in the DB? For this purpose we're gonna learn about GraphQL mutations - a method for sending and applying mutations in our back-end.

**What are GraphQL mutations?**

If you have an API endpoint that alters data, like inserting data into a database or altering data already in a database, you should make this endpoint a `Mutation` rather than a `Query`. This is as simple as making the API endpoint part of the top-level `Mutation` type instead of the top-level `Query` type.

It's often convenient to have a mutation that maps to a database create or update operation, return the same thing that the server stored. That way, if you modify the data on the server, the client can learn about those modifications. **A GraphQL mutation is like a GraphQL query, only with side effects**. It's equivalent to GET (query) and POST/PUT (mutation) in the context of REST API.

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

Since GraphQL is schema based, we will need to create a new type called `Mutation` in the `typeDefs.graphql` file. In this chapter we want to have the ability to send messages, thus we will have a field named `addMessage` in the new mutation type:

[{]: <helper> (diffStep 5.1 files="typeDefs" module="server")

#### [Server Step 5.1: Add addMessage() mutation](https://github.com/Urigo/WhatsApp-Clone-Server/commit/a78d3cf)

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

#### [Server Step 5.1: Add addMessage() mutation](https://github.com/Urigo/WhatsApp-Clone-Server/commit/a78d3cf)

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

#### [Server Step 5.2: Test addMessage() mutation](https://github.com/Urigo/WhatsApp-Clone-Server/commit/6a8697e)

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

#### [Server Step 5.2: Test addMessage() mutation](https://github.com/Urigo/WhatsApp-Clone-Server/commit/6a8697e)

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

Like in the previous chapters, we're gonna use a React hook so we can run a mutation more efficiently in a React.Component. For this we're gonna use the [`useMutation()`](https://github.com/trojanowski/react-apollo-hooks#usemutation) react hook. The first argument of the hook is the mutation string, and the second one is the [mutation options](https://www.apollographql.com/docs/react/api/apollo-client.html#ApolloClient.mutate). We're gonna provide our mutation call with a single option called `optimisticResponse`.

Optimistic response is a common pattern that will update the state of the component twice so we can have a better UX: First it updates the component's state with the predicted result, and then it will update the state with the actual result.



![optimistic_response](https://user-images.githubusercontent.com/7648874/54883302-859df900-4e9f-11e9-9eb7-a98108cd2482.png)


This is how the component should look like:

[{]: <helper> (diffStep 8.1 module="client")

#### [Client Step 8.1: Send message with a GraphQL mutation](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/1080824)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -1,7 +1,7 @@
 ┊1┊1┊import gql from 'graphql-tag'
 ┊2┊2┊import * as React from 'react'
 ┊3┊3┊import { useCallback } from 'react'
-┊4┊ ┊import { useApolloClient, useQuery } from 'react-apollo-hooks'
+┊ ┊4┊import { useApolloClient, useQuery, useMutation } from 'react-apollo-hooks'
 ┊5┊5┊import styled from 'styled-components'
 ┊6┊6┊import ChatNavbar from './ChatNavbar'
 ┊7┊7┊import MessageInput from './MessageInput'
```
```diff
@@ -29,28 +29,47 @@
 ┊29┊29┊  }
 ┊30┊30┊`
 ┊31┊31┊
+┊  ┊32┊const addMessageMutation = gql `
+┊  ┊33┊  mutation AddMessage($chatId: ID!, $content: String!) {
+┊  ┊34┊    addMessage(chatId: $chatId, content: $content) {
+┊  ┊35┊      id
+┊  ┊36┊      content
+┊  ┊37┊      createdAt
+┊  ┊38┊    }
+┊  ┊39┊  }
+┊  ┊40┊`
+┊  ┊41┊
 ┊32┊42┊const ChatRoomScreen = ({ history, match }) => {
 ┊33┊43┊  const { params: { chatId } } = match
 ┊34┊44┊  const client = useApolloClient()
 ┊35┊45┊  const { data: { chat } } = useQuery(getChatQuery, {
 ┊36┊46┊    variables: { chatId }
 ┊37┊47┊  })
+┊  ┊48┊  const addMessage = useMutation(addMessageMutation)
 ┊38┊49┊
 ┊39┊50┊  const onSendMessage = useCallback((content) => {
-┊40┊  ┊    const message = {
-┊41┊  ┊      id: chat.messages.length + 1,
-┊42┊  ┊      createdAt: Date.now(),
-┊43┊  ┊      content,
-┊44┊  ┊    }
-┊45┊  ┊
-┊46┊  ┊    client.writeQuery({
-┊47┊  ┊      query: getChatQuery,
-┊48┊  ┊      variables: { chatId },
-┊49┊  ┊      data: {
-┊50┊  ┊        chat: {
-┊51┊  ┊          ...chat,
-┊52┊  ┊          messages: chat.messages.concat(message),
-┊53┊  ┊        },
+┊  ┊51┊    addMessage({
+┊  ┊52┊      variables: { chatId, content },
+┊  ┊53┊      optimisticResponse: {
+┊  ┊54┊        __typename: 'Mutation',
+┊  ┊55┊        addMessage: {
+┊  ┊56┊          __typename: 'Message',
+┊  ┊57┊          id: Math.random().toString(36).substr(2, 9),
+┊  ┊58┊          createdAt: new Date(),
+┊  ┊59┊          content,
+┊  ┊60┊        }
+┊  ┊61┊      },
+┊  ┊62┊      update: (client, { data: { addMessage } }) => {
+┊  ┊63┊        client.writeQuery({
+┊  ┊64┊          query: getChatQuery,
+┊  ┊65┊          variables: { chatId },
+┊  ┊66┊          data: {
+┊  ┊67┊            chat: {
+┊  ┊68┊              ...chat,
+┊  ┊69┊              messages: chat.messages.concat(addMessage),
+┊  ┊70┊            },
+┊  ┊71┊          },
+┊  ┊72┊        })
 ┊54┊73┊      },
 ┊55┊74┊    })
 ┊56┊75┊  }, [chat])
```

[}]: #

Note that unlike `useQuery()`, `useMutation()` returns a callback that will run the mutation only once called, NOT immediately. Seemingly, everything works fine, but if you'll try to navigate from `ChatsListScreen` to `ChatRoomScreen`, send a message, and then go back, you'll see that the last message was not updated. So why is that exactly?

**Cache updating**

As explained in the previous chapter, Apollo-Client will cache all the results in a data-store. Later on, rather than re-fetching the data, it will look up for the result in the store and will serve it to you in case it exists. That means, that even though we ran the mutation and updated the data on the server, our data-store is still left behind and it needs to be updated as well, otherwise Apollo-Client will see nothing wrong with the outcome.

Apollo-Client stores the data in a hash, where the key represents the query and the value represents the retrieved result. This means that the cache will need to be updated for:



*   `chats` query - which we already did, without really diving into the reason behind it.
*   `chat(chatId: $chatId)` where `chatId` is the chat that was just mutated.

Indeed, a query will be duplicated for each and every distinct set of parameters. So potentially our data-store can grow infinite amount of times, and we will need to take care of it and manage it correctly, so things won't get out of hand.

To update a query, we will first export the `getChats` query to a separate file so it can be imported in the `ChatRoomScreen`. We will define all our GraphQL assets under the `src/graphql` directory:

[{]: <helper> (diffStep 8.2 files="graphql" module="client")

#### [Client Step 8.2: Rewrite lastMessage to chats query](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/a7b69fa)

##### Added src&#x2F;graphql&#x2F;queries&#x2F;chats.query.ts
```diff
@@ -0,0 +1,16 @@
+┊  ┊ 1┊import gql from 'graphql-tag'
+┊  ┊ 2┊
+┊  ┊ 3┊export default gql `
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
+┊  ┊16┊`
```

##### Added src&#x2F;graphql&#x2F;queries&#x2F;index.ts
```diff
@@ -0,0 +1 @@
+┊ ┊1┊export { default as chats } from './chats.query'
```

[}]: #

And then we will read the memoized result from the store using [`client.readQuery`](https://www.apollographql.com/docs/react/features/caching.html#readquery), update it, and then rewrite it using [`client.writeQuery`](https://www.apollographql.com/docs/react/features/caching.html#writequery-and-writefragment). We can gain access to the client object via the `update` callback which will be triggered right after the mutation has been successfully executed. This is how it should look like:

[{]: <helper> (diffStep 8.2 files="components" module="client")

#### [Client Step 8.2: Rewrite lastMessage to chats query](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/a7b69fa)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -6,6 +6,7 @@
 ┊ 6┊ 6┊import ChatNavbar from './ChatNavbar'
 ┊ 7┊ 7┊import MessageInput from './MessageInput'
 ┊ 8┊ 8┊import MessagesList from './MessagesList'
+┊  ┊ 9┊import * as queries from '../../graphql/queries'
 ┊ 9┊10┊
 ┊10┊11┊const Container = styled.div `
 ┊11┊12┊  background: url(/assets/chat-background.jpg);
```
```diff
@@ -70,6 +71,40 @@
 ┊ 70┊ 71┊            },
 ┊ 71┊ 72┊          },
 ┊ 72┊ 73┊        })
+┊   ┊ 74┊
+┊   ┊ 75┊        rewriteChats:
+┊   ┊ 76┊        {
+┊   ┊ 77┊          let data
+┊   ┊ 78┊          try {
+┊   ┊ 79┊            data = client.readQuery({
+┊   ┊ 80┊              query: queries.chats,
+┊   ┊ 81┊            })
+┊   ┊ 82┊          } catch (e) {
+┊   ┊ 83┊            break rewriteChats
+┊   ┊ 84┊          }
+┊   ┊ 85┊
+┊   ┊ 86┊          if (!data) break rewriteChats
+┊   ┊ 87┊
+┊   ┊ 88┊          const chats = data.chats
+┊   ┊ 89┊
+┊   ┊ 90┊          if (!chats) break rewriteChats
+┊   ┊ 91┊
+┊   ┊ 92┊          const chatIndex = chats.findIndex(c => c.id === chatId)
+┊   ┊ 93┊
+┊   ┊ 94┊          if (chatIndex === -1) break rewriteChats
+┊   ┊ 95┊
+┊   ┊ 96┊          const chat = chats[chatIndex]
+┊   ┊ 97┊
+┊   ┊ 98┊          chat.lastMessage = addMessage
+┊   ┊ 99┊          // The chat will appear at the top of the ChatsList component
+┊   ┊100┊          chats.splice(chatIndex, 1)
+┊   ┊101┊          chats.unshift(chat)
+┊   ┊102┊
+┊   ┊103┊          client.writeQuery({
+┊   ┊104┊            query: queries.chats,
+┊   ┊105┊            data: { chats: chats },
+┊   ┊106┊          })
+┊   ┊107┊        }
 ┊ 73┊108┊      },
 ┊ 74┊109┊    })
 ┊ 75┊110┊  }, [chat])
```

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.test.tsx
```diff
@@ -5,6 +5,7 @@
 ┊ 5┊ 5┊import { cleanup, render, fireEvent, wait, waitForDomChange } from 'react-testing-library'
 ┊ 6┊ 6┊import { mockApolloClient } from '../../test-helpers'
 ┊ 7┊ 7┊import ChatsList, { getChatsQuery } from './ChatsList'
+┊  ┊ 8┊import * as queries from '../../graphql/queries'
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
@@ -5,6 +5,7 @@
 ┊ 5┊ 5┊import { useCallback } from 'react'
 ┊ 6┊ 6┊import { useQuery } from 'react-apollo-hooks'
 ┊ 7┊ 7┊import styled from 'styled-components'
+┊  ┊ 8┊import * as queries from '../../graphql/queries'
 ┊ 8┊ 9┊
 ┊ 9┊10┊const Container = styled.div `
 ┊10┊11┊  height: calc(100% - 56px);
```
```diff
@@ -58,23 +59,8 @@
 ┊58┊59┊  font-size: 13px;
 ┊59┊60┊`
 ┊60┊61┊
-┊61┊  ┊export const getChatsQuery = gql `
-┊62┊  ┊  query GetChats {
-┊63┊  ┊    chats {
-┊64┊  ┊      id
-┊65┊  ┊      name
-┊66┊  ┊      picture
-┊67┊  ┊      lastMessage {
-┊68┊  ┊        id
-┊69┊  ┊        content
-┊70┊  ┊        createdAt
-┊71┊  ┊      }
-┊72┊  ┊    }
-┊73┊  ┊  }
-┊74┊  ┊`
-┊75┊  ┊
 ┊76┊62┊const ChatsList = ({ history }) => {
-┊77┊  ┊  const { data: { chats = [] } } = useQuery(getChatsQuery)
+┊  ┊63┊  const { data: { chats = [] } } = useQuery(queries.chats)
 ┊78┊64┊
 ┊79┊65┊  const navToChat = useCallback((chat) => {
 ┊80┊66┊    history.push(`chats/${chat.id}`)
```

[}]: #

Right now what happens is that we update a single chat document twice: Once for the `chats` query and another time for the `chat($chatId)` query. This work is redundant and become more complex as we add more `chat` related queries. To solve it, we can define and use a [GraphQL fragment](https://www.apollographql.com/docs/react/advanced/fragments.html).

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

#### [Client Step 8.3: Update queries to use GraphQL fragments](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/3cd6e31)

##### Added src&#x2F;graphql&#x2F;fragments&#x2F;chat.fragment.ts
```diff
@@ -0,0 +1,14 @@
+┊  ┊ 1┊import gql from 'graphql-tag'
+┊  ┊ 2┊import message from './message.fragment'
+┊  ┊ 3┊
+┊  ┊ 4┊export default gql `
+┊  ┊ 5┊  fragment Chat on Chat {
+┊  ┊ 6┊    id
+┊  ┊ 7┊    name
+┊  ┊ 8┊    picture
+┊  ┊ 9┊    lastMessage {
+┊  ┊10┊      ...Message
+┊  ┊11┊    }
+┊  ┊12┊  }
+┊  ┊13┊  ${message}
+┊  ┊14┊`
```

##### Added src&#x2F;graphql&#x2F;fragments&#x2F;fullChat.fragment.ts
```diff
@@ -0,0 +1,14 @@
+┊  ┊ 1┊import gql from 'graphql-tag'
+┊  ┊ 2┊import chat from './chat.fragment'
+┊  ┊ 3┊import message from './message.fragment'
+┊  ┊ 4┊
+┊  ┊ 5┊export default gql `
+┊  ┊ 6┊  fragment FullChat on Chat {
+┊  ┊ 7┊    ...Chat
+┊  ┊ 8┊    messages {
+┊  ┊ 9┊      ...Message
+┊  ┊10┊    }
+┊  ┊11┊  }
+┊  ┊12┊  ${chat}
+┊  ┊13┊  ${message}
+┊  ┊14┊`
```

##### Added src&#x2F;graphql&#x2F;fragments&#x2F;index.ts
```diff
@@ -0,0 +1,3 @@
+┊ ┊1┊export { default as chat } from './chat.fragment'
+┊ ┊2┊export { default as fullChat } from './fullChat.fragment'
+┊ ┊3┊export { default as message } from './message.fragment'
```

##### Added src&#x2F;graphql&#x2F;fragments&#x2F;message.fragment.ts
```diff
@@ -0,0 +1,9 @@
+┊ ┊1┊import gql from 'graphql-tag'
+┊ ┊2┊
+┊ ┊3┊export default gql`
+┊ ┊4┊  fragment Message on Message {
+┊ ┊5┊    id
+┊ ┊6┊    createdAt
+┊ ┊7┊    content
+┊ ┊8┊  }
+┊ ┊9┊`
```

[}]: #

And now that we have the fragments available to us, let's embed them in the relevant queries:

[{]: <helper> (diffStep 8.3 files="components, graphql/queries" module="client")

#### [Client Step 8.3: Update queries to use GraphQL fragments](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/3cd6e31)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -7,6 +7,7 @@
 ┊ 7┊ 7┊import MessageInput from './MessageInput'
 ┊ 8┊ 8┊import MessagesList from './MessagesList'
 ┊ 9┊ 9┊import * as queries from '../../graphql/queries'
+┊  ┊10┊import * as fragments from '../../graphql/fragments'
 ┊10┊11┊
 ┊11┊12┊const Container = styled.div `
 ┊12┊13┊  background: url(/assets/chat-background.jpg);
```
```diff
@@ -18,26 +19,19 @@
 ┊18┊19┊const getChatQuery = gql `
 ┊19┊20┊  query GetChat($chatId: ID!) {
 ┊20┊21┊    chat(chatId: $chatId) {
-┊21┊  ┊      id
-┊22┊  ┊      name
-┊23┊  ┊      picture
-┊24┊  ┊      messages {
-┊25┊  ┊        id
-┊26┊  ┊        content
-┊27┊  ┊        createdAt
-┊28┊  ┊      }
+┊  ┊22┊      ...FullChat
 ┊29┊23┊    }
 ┊30┊24┊  }
+┊  ┊25┊  ${fragments.fullChat}
 ┊31┊26┊`
 ┊32┊27┊
 ┊33┊28┊const addMessageMutation = gql `
 ┊34┊29┊  mutation AddMessage($chatId: ID!, $content: String!) {
 ┊35┊30┊    addMessage(chatId: $chatId, content: $content) {
-┊36┊  ┊      id
-┊37┊  ┊      content
-┊38┊  ┊      createdAt
+┊  ┊31┊      ...Message
 ┊39┊32┊    }
 ┊40┊33┊  }
+┊  ┊34┊  ${fragments.message}
 ┊41┊35┊`
 ┊42┊36┊
 ┊43┊37┊const ChatRoomScreen = ({ history, match }) => {
```

##### Changed src&#x2F;graphql&#x2F;queries&#x2F;chats.query.ts
```diff
@@ -1,16 +1,11 @@
 ┊ 1┊ 1┊import gql from 'graphql-tag'
+┊  ┊ 2┊import * as fragments from '../fragments'
 ┊ 2┊ 3┊
 ┊ 3┊ 4┊export default gql `
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
 ┊16┊11┊`
```

[}]: #

Similarly to query rewriting, we will use the [`readFragment()`](https://www.apollographql.com/docs/react/features/caching.html#readfragment) and [`writeFragment()`](https://www.apollographql.com/docs/react/features/caching.html#writefragment) methods in the same way to rewrite the fragments. When working with a fragment we need to compose its ID, just like explained earlier. The default mapping function called `defaultDataIdFromObject` can be imported from `apollo-cache-inmemory` and be used to specify the fragment that we would like to read/write. Accordingly, we're gonna replace all our query re-writings with fragments re-writings, as we don't need them anymore:

[{]: <helper> (diffStep 8.4 module="client")

#### [Client Step 8.4: Rewrite fragments](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/c97ebaf)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -1,3 +1,4 @@
+┊ ┊1┊import { defaultDataIdFromObject } from 'apollo-cache-inmemory'
 ┊1┊2┊import gql from 'graphql-tag'
 ┊2┊3┊import * as React from 'react'
 ┊3┊4┊import { useCallback } from 'react'
```
```diff
@@ -55,15 +56,27 @@
 ┊55┊56┊        }
 ┊56┊57┊      },
 ┊57┊58┊      update: (client, { data: { addMessage } }) => {
-┊58┊  ┊        client.writeQuery({
-┊59┊  ┊          query: getChatQuery,
-┊60┊  ┊          variables: { chatId },
-┊61┊  ┊          data: {
-┊62┊  ┊            chat: {
-┊63┊  ┊              ...chat,
-┊64┊  ┊              messages: chat.messages.concat(addMessage),
-┊65┊  ┊            },
-┊66┊  ┊          },
+┊  ┊59┊        let fullChat
+┊  ┊60┊        try {
+┊  ┊61┊          fullChat = client.readFragment({
+┊  ┊62┊            id: defaultDataIdFromObject(chat),
+┊  ┊63┊            fragment: fragments.fullChat,
+┊  ┊64┊            fragmentName: 'FullChat',
+┊  ┊65┊          })
+┊  ┊66┊        } catch (e) {
+┊  ┊67┊          return
+┊  ┊68┊        }
+┊  ┊69┊
+┊  ┊70┊        if (fullChat.messages.some(m => m.id === message.id)) return
+┊  ┊71┊
+┊  ┊72┊        fullChat.messages.push(addMessage)
+┊  ┊73┊        fullChat.lastMessage = addMessage
+┊  ┊74┊
+┊  ┊75┊        client.writeFragment({
+┊  ┊76┊          id: defaultDataIdFromObject(chat),
+┊  ┊77┊          fragment: fragments.fullChat,
+┊  ┊78┊          fragmentName: 'FullChat',
+┊  ┊79┊          data: fullChat,
 ┊67┊80┊        })
 ┊68┊81┊
 ┊69┊82┊        rewriteChats:
```
```diff
@@ -89,7 +102,6 @@
 ┊ 89┊102┊
 ┊ 90┊103┊          const chat = chats[chatIndex]
 ┊ 91┊104┊
-┊ 92┊   ┊          chat.lastMessage = addMessage
 ┊ 93┊105┊          // The chat will appear at the top of the ChatsList component
 ┊ 94┊106┊          chats.splice(chatIndex, 1)
 ┊ 95┊107┊          chats.unshift(chat)
```

[}]: #


[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/final@next/.tortilla/manuals/views/step7.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/final@next/.tortilla/manuals/views/step9.md) |
|:--------------------------------|--------------------------------:|

[}]: #
