# Step 6: Creating an app router and implementing a chat room

[//]: # (head-end)


In this chapter we will learn how to build a chat room screen. We will setup a router, implement the necessary components, and update the state whenever we send a new message. The screen is NOT gonna be connected to the back-end as it will over complicate things for now. Further this tutorial, we will get to make it full-stack.

Since we're gonna have to screens in our app now - `ChatsListScreen` and `ChatRoomScreen`, we will need a router that will be able to alternate between them. We will be using the [`react-router-dom`](https://www.npmjs.com/package/react-router-dom) package to manage the routes of the application:

  $ npm install react-router-dom

And we will implement a router directly in the `<App />` component:

[{]: <helper> (diffStep 6.1 files="App" module="client")

#### [Client Step 6.1: Add router](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/7f46257)

##### Changed src&#x2F;App.jsx
```diff
@@ -1,10 +1,20 @@
 ┊ 1┊ 1┊import * as React from 'react'
+┊  ┊ 2┊import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom'
+┊  ┊ 3┊import ChatRoomScreen from './components/ChatRoomScreen'
 ┊ 2┊ 4┊import ChatsListScreen from './components/ChatsListScreen'
 ┊ 3┊ 5┊
 ┊ 4┊ 6┊const App = () => (
-┊ 5┊  ┊  <div>
-┊ 6┊  ┊    <ChatsListScreen />
-┊ 7┊  ┊  </div>
+┊  ┊ 7┊  <BrowserRouter>
+┊  ┊ 8┊    <Switch>
+┊  ┊ 9┊      <Route exact path="/chats" component={ChatsListScreen} />
+┊  ┊10┊      <Route exact path="/chats/:chatId" component={ChatRoomScreen} />
+┊  ┊11┊    </Switch>
+┊  ┊12┊    <Route exact path="/" render={redirectToChats} />
+┊  ┊13┊  </BrowserRouter>
+┊  ┊14┊)
+┊  ┊15┊
+┊  ┊16┊const redirectToChats = () => (
+┊  ┊17┊  <Redirect to="/chats" />
 ┊ 8┊18┊)
 ┊ 9┊19┊
 ┊10┊20┊export default App
```

[}]: #

The purpose of a router is to make route managing easy and declarative. It will take care of managing the history within our app and parameterizing certain screens according to our need. Essentially it's a wrap around the `window.history` object which is also compatible with React. I recommend you to go through the [official MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/History) if you're not yet familiar with the concept.

The `<Route />` component represents a path for a route in our application. Using the colon syntax (`:chatId`) we basically tell the router that the `/chat` route should be followed by a string whose value can later on be addressed via a parameter called `chatId` when navigating to the route. So here's a sum-up of the routes manifest:



*   `/chats` - will navigate to the `ChatsListScreen`.
*   `/chat/:chatId` - e.g. `/chat/1`, will navigate to the `ChatRoomScreen` and will parameterize it to show data which is related to chat ID 1.
*   Any other route will fallback to the `/chats` route which will redirect us to the `ChatsListScreen`.

Now we will implement the `ChatRoomScreen` so the router can function properly. For now we will make it a plain screen which simply prints out the information of the chat that was clicked so we can have a complete flow, and then we will take care of the rest.

To do so, we will first implement the `chat` query in our backend. This would be a parameterized query that will provide us with a specific chat according to the received ID, and it will be used by the new screen as soon as it is initialized. First we would update the `Chat` type to contain a `messages` field:

[{]: <helper> (diffStep 4.1 files="schema" module="server")

#### [Server Step 4.1: Add messages field to Chat type](https://github.com/Urigo/WhatsApp-Clone-Server/commit/a956ba7)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -5,6 +5,10 @@
 ┊ 5┊ 5┊  Date: GraphQLDateTime,
 ┊ 6┊ 6┊
 ┊ 7┊ 7┊  Chat: {
+┊  ┊ 8┊    messages(chat: any) {
+┊  ┊ 9┊      return messages.filter(m => chat.messages.includes(m.id))
+┊  ┊10┊    },
+┊  ┊11┊
 ┊ 8┊12┊    lastMessage(chat: any) {
 ┊ 9┊13┊      return messages.find(m => m.id === chat.lastMessage)
 ┊10┊14┊    },
```

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -11,6 +11,7 @@
 ┊11┊11┊  name: String!
 ┊12┊12┊  picture: String
 ┊13┊13┊  lastMessage: Message
+┊  ┊14┊  messages: [Message!]!
 ┊14┊15┊}
 ┊15┊16┊
 ┊16┊17┊type Query {
```

[}]: #

And then we will update our DB mock to be aligned with these changes:

[{]: <helper> (diffStep 4.1 files="db" module="server")

#### [Server Step 4.1: Add messages field to Chat type](https://github.com/Urigo/WhatsApp-Clone-Server/commit/a956ba7)

##### Changed db.ts
```diff
@@ -27,23 +27,27 @@
 ┊27┊27┊    name: 'Ethan Gonzalez',
 ┊28┊28┊    picture: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
 ┊29┊29┊    lastMessage: '1',
+┊  ┊30┊    messages: ['1'],
 ┊30┊31┊  },
 ┊31┊32┊  {
 ┊32┊33┊    id: '2',
 ┊33┊34┊    name: 'Bryan Wallace',
 ┊34┊35┊    picture: 'https://randomuser.me/api/portraits/thumb/men/2.jpg',
 ┊35┊36┊    lastMessage: '2',
+┊  ┊37┊    messages: ['2'],
 ┊36┊38┊  },
 ┊37┊39┊  {
 ┊38┊40┊    id: '3',
 ┊39┊41┊    name: 'Avery Stewart',
 ┊40┊42┊    picture: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
 ┊41┊43┊    lastMessage: '3',
+┊  ┊44┊    messages: ['3'],
 ┊42┊45┊  },
 ┊43┊46┊  {
 ┊44┊47┊    id: '4',
 ┊45┊48┊    name: 'Katie Peterson',
 ┊46┊49┊    picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
 ┊47┊50┊    lastMessage: '4',
+┊  ┊51┊    messages: ['4'],
 ┊48┊52┊  },
 ┊49┊53┊]
```

[}]: #

This means that when we resolve `Chat.lastMessage`, we should get it directly from the `Chat.messages` field:

[{]: <helper> (diffStep 4.2 module="server")

#### [Server Step 4.2: Resolve last message based on messages array](https://github.com/Urigo/WhatsApp-Clone-Server/commit/3672e75)

##### Changed db.ts
```diff
@@ -26,28 +26,24 @@
 ┊26┊26┊    id: '1',
 ┊27┊27┊    name: 'Ethan Gonzalez',
 ┊28┊28┊    picture: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
-┊29┊  ┊    lastMessage: '1',
 ┊30┊29┊    messages: ['1'],
 ┊31┊30┊  },
 ┊32┊31┊  {
 ┊33┊32┊    id: '2',
 ┊34┊33┊    name: 'Bryan Wallace',
 ┊35┊34┊    picture: 'https://randomuser.me/api/portraits/thumb/men/2.jpg',
-┊36┊  ┊    lastMessage: '2',
 ┊37┊35┊    messages: ['2'],
 ┊38┊36┊  },
 ┊39┊37┊  {
 ┊40┊38┊    id: '3',
 ┊41┊39┊    name: 'Avery Stewart',
 ┊42┊40┊    picture: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
-┊43┊  ┊    lastMessage: '3',
 ┊44┊41┊    messages: ['3'],
 ┊45┊42┊  },
 ┊46┊43┊  {
 ┊47┊44┊    id: '4',
 ┊48┊45┊    name: 'Katie Peterson',
 ┊49┊46┊    picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
-┊50┊  ┊    lastMessage: '4',
 ┊51┊47┊    messages: ['4'],
 ┊52┊48┊  },
 ┊53┊49┊]
```

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -10,7 +10,9 @@
 ┊10┊10┊    },
 ┊11┊11┊
 ┊12┊12┊    lastMessage(chat: any) {
-┊13┊  ┊      return messages.find(m => m.id === chat.lastMessage)
+┊  ┊13┊      const lastMessage = chat.messages[chat.messages.length - 1]
+┊  ┊14┊
+┊  ┊15┊      return messages.find(m => m.id === lastMessage)
 ┊14┊16┊    },
 ┊15┊17┊  },
```

[}]: #

Now that we have an updated schema which is relevant to the new screen that we would like to add, we will declare a new query called `chat`:

[{]: <helper> (diffStep 4.3 files="schema/typeDefs" module="server")

#### [Server Step 4.3: Add chat field to Query type](https://github.com/Urigo/WhatsApp-Clone-Server/commit/f803126)

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -16,4 +16,5 @@
 ┊16┊16┊
 ┊17┊17┊type Query {
 ┊18┊18┊  chats: [Chat!]!
+┊  ┊19┊  chat(chatId: ID!): Chat
 ┊19┊20┊}
```

[}]: #

Note that unlike the `chats` query, this time we have a parameter. The parameters are provided to the resolver function as the second parameter as a JSON. Using the provided parameter - the chat ID, we will find and return the relevant chat from the DB:

[{]: <helper> (diffStep 4.3 files="schema/resolvers" module="server")

#### [Server Step 4.3: Add chat field to Query type](https://github.com/Urigo/WhatsApp-Clone-Server/commit/f803126)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -20,6 +20,10 @@
 ┊20┊20┊    chats() {
 ┊21┊21┊      return chats
 ┊22┊22┊    },
+┊  ┊23┊
+┊  ┊24┊    chat(root: any, { chatId }: any) {
+┊  ┊25┊      return chats.find(c => c.id === chatId)
+┊  ┊26┊    },
 ┊23┊27┊  },
 ┊24┊28┊}
 ┊25┊29┊
```

[}]: #

> More about the resolver signature can be read in [Apollo-GraphQL's official docs page](https://www.apollographql.com/docs/apollo-server/essentials/data.html#type-signature).

Now we will add a test suite:

[{]: <helper> (diffStep 4.3 files="tests/queries/getChat.test" module="server")

#### [Server Step 4.3: Add chat field to Query type](https://github.com/Urigo/WhatsApp-Clone-Server/commit/f803126)

##### Added tests&#x2F;queries&#x2F;getChat.test.ts
```diff
@@ -0,0 +1,33 @@
+┊  ┊ 1┊import { createTestClient } from 'apollo-server-testing'
+┊  ┊ 2┊import { ApolloServer, gql } from 'apollo-server-express'
+┊  ┊ 3┊import schema from '../../schema'
+┊  ┊ 4┊
+┊  ┊ 5┊describe('Query.chat', () => {
+┊  ┊ 6┊  it('should fetch specified chat', async () => {
+┊  ┊ 7┊    const server = new ApolloServer({ schema })
+┊  ┊ 8┊
+┊  ┊ 9┊    const { query } = createTestClient(server)
+┊  ┊10┊
+┊  ┊11┊    const res = await query({
+┊  ┊12┊      variables: { chatId: '1' },
+┊  ┊13┊      query: gql `
+┊  ┊14┊        query GetChat($chatId: ID!) {
+┊  ┊15┊          chat(chatId: $chatId) {
+┊  ┊16┊            id
+┊  ┊17┊            name
+┊  ┊18┊            picture
+┊  ┊19┊            lastMessage {
+┊  ┊20┊              id
+┊  ┊21┊              content
+┊  ┊22┊              createdAt
+┊  ┊23┊            }
+┊  ┊24┊          }
+┊  ┊25┊        }
+┊  ┊26┊      `,
+┊  ┊27┊    })
+┊  ┊28┊
+┊  ┊29┊    expect(res.data).toBeDefined()
+┊  ┊30┊    expect(res.errors).toBeUndefined()
+┊  ┊31┊    expect(res.data).toMatchSnapshot()
+┊  ┊32┊  })
+┊  ┊33┊})
```

[}]: #

We can observe the snapshot created by Jest to get a better understanding of how the response should look like:

[{]: <helper> (diffStep 4.3 files="__snapshot__" module="server")

#### [Server Step 4.3: Add chat field to Query type](https://github.com/Urigo/WhatsApp-Clone-Server/commit/f803126)



[}]: #

If you experience any TypeScript related issues with the following error:

```
Object literal may only specify known properties, and 'variables' does not exist in type 'Query'.
```

Add the following declaration file to your project:

[{]: <helper> (diffStep 4.3 files="types" module="server")

#### [Server Step 4.3: Add chat field to Query type](https://github.com/Urigo/WhatsApp-Clone-Server/commit/f803126)

##### Added types&#x2F;apollo-server-testing.d.ts
```diff
@@ -0,0 +1,27 @@
+┊  ┊ 1┊declare module 'apollo-server-testing' {
+┊  ┊ 2┊  import { ApolloServerBase } from 'apollo-server-core';
+┊  ┊ 3┊  import { print, DocumentNode } from 'graphql';
+┊  ┊ 4┊  import { GraphQLResponse } from 'graphql-extensions';
+┊  ┊ 5┊
+┊  ┊ 6┊  type StringOrAst = string | DocumentNode;
+┊  ┊ 7┊
+┊  ┊ 8┊  // A query must not come with a mutation (and vice versa).
+┊  ┊ 9┊  type Query<TVariables> = {
+┊  ┊10┊    query: StringOrAst;
+┊  ┊11┊    mutation?: undefined;
+┊  ┊12┊    variables?: TVariables;
+┊  ┊13┊  };
+┊  ┊14┊
+┊  ┊15┊  type Mutation<TVariables> = {
+┊  ┊16┊    mutation: StringOrAst;
+┊  ┊17┊    query?: undefined;
+┊  ┊18┊    variables?: TVariables;
+┊  ┊19┊  };
+┊  ┊20┊
+┊  ┊21┊  export const createTestClient: <TVariables>(
+┊  ┊22┊    server: ApolloServerBase,
+┊  ┊23┊  ) => {
+┊  ┊24┊    query: (query: Query<TVariables>) => Promise<GraphQLResponse>;
+┊  ┊25┊    mutate: (mutation: Mutation<TVariables>) => Promise<GraphQLResponse>;
+┊  ┊26┊  };
+┊  ┊27┊}
```

[}]: #

This is a [known issue](https://github.com/apollographql/apollo-server/issues/2172) in the `apollo-server-testing` package and has a pending [fix PR](https://github.com/apollographql/apollo-server/pull/2307). Now getting back to the client, let's implement a basic version of the `ChatRoomScreen` where we will fetch the new query and print it to the screen:

[{]: <helper> (diffStep 6.2 module="client")

#### [Client Step 6.2: Add basic ChatRoomScreen](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/1809f98)

##### Added src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -0,0 +1,55 @@
+┊  ┊ 1┊import * as React from 'react'
+┊  ┊ 2┊import { useMemo, useState } from 'react'
+┊  ┊ 3┊
+┊  ┊ 4┊const getChatQuery = `
+┊  ┊ 5┊  query GetChat($chatId: ID!) {
+┊  ┊ 6┊    chat(chatId: $chatId) {
+┊  ┊ 7┊      id
+┊  ┊ 8┊      name
+┊  ┊ 9┊      picture
+┊  ┊10┊      messages {
+┊  ┊11┊        id
+┊  ┊12┊        content
+┊  ┊13┊        createdAt
+┊  ┊14┊      }
+┊  ┊15┊    }
+┊  ┊16┊  }
+┊  ┊17┊`
+┊  ┊18┊
+┊  ┊19┊const ChatRoomScreen = ({ match }) => {
+┊  ┊20┊  const { params: { chatId } } = match
+┊  ┊21┊  const [chat, setChat] = useState(null)
+┊  ┊22┊
+┊  ┊23┊  useMemo(async () => {
+┊  ┊24┊    const body = await fetch(`${process.env.REACT_APP_SERVER_URL}/graphql`, {
+┊  ┊25┊      method: 'POST',
+┊  ┊26┊      headers: {
+┊  ┊27┊        'Content-Type': 'application/json',
+┊  ┊28┊      },
+┊  ┊29┊      body: JSON.stringify({
+┊  ┊30┊        query: getChatQuery,
+┊  ┊31┊        variables: { chatId },
+┊  ┊32┊      }),
+┊  ┊33┊    })
+┊  ┊34┊    const { data: { chat } } = await body.json()
+┊  ┊35┊    setChat(chat)
+┊  ┊36┊  }, [true])
+┊  ┊37┊
+┊  ┊38┊  if (!chat) return null
+┊  ┊39┊
+┊  ┊40┊  return (
+┊  ┊41┊    <div>
+┊  ┊42┊      <img src={chat.picture} /><div>{chat.name}</div>
+┊  ┊43┊      <ul>
+┊  ┊44┊        {chat.messages.map((message) =>
+┊  ┊45┊          <li key={message.id}>
+┊  ┊46┊            <div>{message.content}</div>
+┊  ┊47┊            <div>{message.createdAt}</div>
+┊  ┊48┊          </li>
+┊  ┊49┊        )}
+┊  ┊50┊      </ul>
+┊  ┊51┊    </div>
+┊  ┊52┊  )
+┊  ┊53┊}
+┊  ┊54┊
+┊  ┊55┊export default ChatRoomScreen
```

[}]: #

Note how we used the `match.params.chatId` variable to get the selected chat ID. The `match` prop is defined and provided to us by the `<Route />` component, since it interfaces directly with the `ChatRoomScreen`. More about that can be read in the [official docs page](https://reacttraining.com/react-router/core/api/match). If you'll run the application and type `/chats/1` in the URL bar, this is what you should see on the screen:

![naked-chat](https://user-images.githubusercontent.com/7648874/54664314-d4096b80-4b1e-11e9-9e06-1323cf7b0abe.png)

The view has no styling at all but it should be fixed in a moment. To make navigation more convenient we will add an `onClick` listener for each chat item in the `ChatsList`. Using the [history](https://reacttraining.com/react-router/core/api/history) object, provided to us by the `<Route />` component, we will navigate to the correlated `ChatRoomScreen`:

[{]: <helper> (diffStep 6.3 module="client")

#### [Client Step 6.3: Nav to chat on click](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/95c0c4b)

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.tsx
```diff
@@ -1,7 +1,7 @@
 ┊1┊1┊import { List, ListItem } from '@material-ui/core'
 ┊2┊2┊import moment from 'moment'
 ┊3┊3┊import * as React from 'react'
-┊4┊ ┊import { useState, useMemo } from 'react'
+┊ ┊4┊import { useCallback, useState, useMemo } from 'react'
 ┊5┊5┊import styled from 'styled-components'
 ┊6┊6┊
 ┊7┊7┊const Container = styled.div `
```
```diff
@@ -71,7 +71,7 @@
 ┊71┊71┊  }
 ┊72┊72┊`
 ┊73┊73┊
-┊74┊  ┊const ChatsList = () => {
+┊  ┊74┊const ChatsList = ({ history }) => {
 ┊75┊75┊  const [chats, setChats] = useState([])
 ┊76┊76┊
 ┊77┊77┊  useMemo(async () => {
```
```diff
@@ -86,11 +86,15 @@
 ┊ 86┊ 86┊    setChats(chats)
 ┊ 87┊ 87┊  }, [true])
 ┊ 88┊ 88┊
+┊   ┊ 89┊  const navToChat = useCallback((chat) => {
+┊   ┊ 90┊    history.push(`chats/${chat.id}`)
+┊   ┊ 91┊  }, [true])
+┊   ┊ 92┊
 ┊ 89┊ 93┊  return (
 ┊ 90┊ 94┊    <Container>
 ┊ 91┊ 95┊      <StyledList>
 ┊ 92┊ 96┊        {chats.map((chat) => (
-┊ 93┊   ┊          <StyledListItem key={chat.id} button>
+┊   ┊ 97┊          <StyledListItem key={chat.id} data-testid="chat" button onClick={navToChat.bind(null, chat)}>
 ┊ 94┊ 98┊            <ChatPicture data-testid="picture" src={chat.picture} />
 ┊ 95┊ 99┊            <ChatInfo>
 ┊ 96┊100┊              <ChatName data-testid="name">{chat.name}</ChatName>
```

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;index.tsx
```diff
@@ -7,10 +7,10 @@
 ┊ 7┊ 7┊  height: 100vh;
 ┊ 8┊ 8┊`
 ┊ 9┊ 9┊
-┊10┊  ┊const ChatsListScreen = () => (
+┊  ┊10┊const ChatsListScreen = ({ history }) => (
 ┊11┊11┊  <Container>
 ┊12┊12┊    <ChatsNavbar />
-┊13┊  ┊    <ChatsList />
+┊  ┊13┊    <ChatsList history={history} />
 ┊14┊14┊  </Container>
 ┊15┊15┊)
```

[}]: #

And add test the new logic:

[{]: <helper> (diffStep 6.4 module="client")

#### [Client Step 6.4: Test new navigation logic](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/65a540a)

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.test.tsx
```diff
@@ -1,10 +1,14 @@
+┊  ┊ 1┊import { createBrowserHistory } from 'history'
 ┊ 1┊ 2┊import React from 'react'
 ┊ 2┊ 3┊import ReactDOM from 'react-dom'
-┊ 3┊  ┊import { cleanup, render, waitForDomChange } from 'react-testing-library'
+┊  ┊ 4┊import { cleanup, render, fireEvent, wait, waitForDomChange } from 'react-testing-library'
 ┊ 4┊ 5┊import ChatsList from './ChatsList'
 ┊ 5┊ 6┊
 ┊ 6┊ 7┊describe('ChatsList', () => {
-┊ 7┊  ┊  afterEach(cleanup)
+┊  ┊ 8┊  afterEach(() => {
+┊  ┊ 9┊    cleanup()
+┊  ┊10┊    window.location.pathname = '/'
+┊  ┊11┊  })
 ┊ 8┊12┊
 ┊ 9┊13┊  it('renders fetched chats data', async () => {
 ┊10┊14┊    fetch.mockResponseOnce(JSON.stringify({
```
```diff
@@ -35,4 +39,37 @@
 ┊35┊39┊      expect(getByTestId('date')).toHaveTextContent('08:00')
 ┊36┊40┊    }
 ┊37┊41┊  })
+┊  ┊42┊
+┊  ┊43┊  it('should navigate to the target chat room on chat item click', async () => {
+┊  ┊44┊    fetch.mockResponseOnce(JSON.stringify({
+┊  ┊45┊      data: {
+┊  ┊46┊        chats: [
+┊  ┊47┊          {
+┊  ┊48┊            id: 1,
+┊  ┊49┊            name: 'Foo Bar',
+┊  ┊50┊            picture: 'https://localhost:4000/picture.jpg',
+┊  ┊51┊            lastMessage: {
+┊  ┊52┊              id: 1,
+┊  ┊53┊              content: 'Hello',
+┊  ┊54┊              createdAt: new Date(0),
+┊  ┊55┊            },
+┊  ┊56┊          },
+┊  ┊57┊        ],
+┊  ┊58┊      },
+┊  ┊59┊    }))
+┊  ┊60┊
+┊  ┊61┊    const history = createBrowserHistory()
+┊  ┊62┊
+┊  ┊63┊    {
+┊  ┊64┊      const { container, getByTestId } = render(<ChatsList history={history} />)
+┊  ┊65┊
+┊  ┊66┊      await waitForDomChange({ container })
+┊  ┊67┊
+┊  ┊68┊      fireEvent.click(getByTestId('chat'))
+┊  ┊69┊
+┊  ┊70┊      await wait(() =>
+┊  ┊71┊        expect(history.location.pathname).toEqual('/chats/1')
+┊  ┊72┊      )
+┊  ┊73┊    }
+┊  ┊74┊  })
 ┊38┊75┊})
```

[}]: #

If you'll click on the chat item you'll see that the screen changes very suddenly. We can smooth the transition by animating it with CSS. Luckily we don't need to implemented such mechanism manually because there's a package that can do that for us - [`react-router-transition`](https://www.npmjs.com/package/react-router-transition):

  $ npm install react-router-transition

Using this package, we will create a custom `Switch` component that will play an animation for all its subordinate `Route` components. The animation is defined by the user using a component called `AnimatedSwitch` as specified in the [package's docs page](http://maisano.github.io/react-router-transition/animated-switch/props). So first, let's create our switch component that will play a smooth transition switching routes:

[{]: <helper> (diffStep 6.5 files="AnimatedSwitch" module="client")

#### [Client Step 6.5: Animate route switching](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/b2c0294)

##### Added src&#x2F;components&#x2F;AnimatedSwitch.tsx
```diff
@@ -0,0 +1,37 @@
+┊  ┊ 1┊import { Switch } from 'react-router-dom'
+┊  ┊ 2┊import { AnimatedSwitch, spring } from 'react-router-transition'
+┊  ┊ 3┊import styled from 'styled-components'
+┊  ┊ 4┊
+┊  ┊ 5┊// A workaround to make test pass
+┊  ┊ 6┊const SwitchComponent = process.env.NODE_ENV === 'test' ? Switch : AnimatedSwitch
+┊  ┊ 7┊
+┊  ┊ 8┊const glide = val =>
+┊  ┊ 9┊  spring(val, {
+┊  ┊10┊    stiffness: 174,
+┊  ┊11┊    damping: 24,
+┊  ┊12┊  })
+┊  ┊13┊
+┊  ┊14┊const mapStyles = styles => ({
+┊  ┊15┊  transform: `translateX(${styles.offset}%)`,
+┊  ┊16┊})
+┊  ┊17┊
+┊  ┊18┊const MyAnimatedSwitch =  styled(SwitchComponent).attrs(() => ({
+┊  ┊19┊  atEnter: { offset: 100 },
+┊  ┊20┊  atLeave: { offset: glide(-100) },
+┊  ┊21┊  atActive: { offset: glide(0) },
+┊  ┊22┊  mapStyles,
+┊  ┊23┊}))`
+┊  ┊24┊  position: relative;
+┊  ┊25┊  overflow: hidden;
+┊  ┊26┊  height: 100vh;
+┊  ┊27┊  width: 100vw;
+┊  ┊28┊
+┊  ┊29┊  > div {
+┊  ┊30┊    position: absolute;
+┊  ┊31┊    overflow: hidden;
+┊  ┊32┊    height: 100vh;
+┊  ┊33┊    width: 100vw;
+┊  ┊34┊  }
+┊  ┊35┊`
+┊  ┊36┊
+┊  ┊37┊export default MyAnimatedSwitch
```

[}]: #

And then replace it with the main `Switch` component in our app:

[{]: <helper> (diffStep 6.5 files="App" module="client")

#### [Client Step 6.5: Animate route switching](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/b2c0294)

##### Changed src&#x2F;App.jsx
```diff
@@ -1,14 +1,15 @@
 ┊ 1┊ 1┊import * as React from 'react'
-┊ 2┊  ┊import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom'
+┊  ┊ 2┊import { BrowserRouter, Route, Redirect } from 'react-router-dom'
 ┊ 3┊ 3┊import ChatRoomScreen from './components/ChatRoomScreen'
 ┊ 4┊ 4┊import ChatsListScreen from './components/ChatsListScreen'
+┊  ┊ 5┊import AnimatedSwitch from './components/AnimatedSwitch'
 ┊ 5┊ 6┊
 ┊ 6┊ 7┊const App = () => (
 ┊ 7┊ 8┊  <BrowserRouter>
-┊ 8┊  ┊    <Switch>
+┊  ┊ 9┊    <AnimatedSwitch>
 ┊ 9┊10┊      <Route exact path="/chats" component={ChatsListScreen} />
 ┊10┊11┊      <Route exact path="/chats/:chatId" component={ChatRoomScreen} />
-┊11┊  ┊    </Switch>
+┊  ┊12┊    </AnimatedSwitch>
 ┊12┊13┊    <Route exact path="/" render={redirectToChats} />
 ┊13┊14┊  </BrowserRouter>
 ┊14┊15┊)
```

[}]: #

Both components act identically and thus there shall be no special treatment. Behold the new transition effect:

![transition-demo](https://user-images.githubusercontent.com/7648874/54739398-ebb22400-4bf2-11e9-8d4c-2aeb65deeb92.gif)

The final screen will be composed out of 3 components:



*   A navigation bar.
*   A messages list.
*   A message input.

We will create a new directory under the path `public/assets` and inside we will download and place a couple of assets which are necessary for our view:

*   [chat-background.jpg](https://raw.githubusercontent.com/Urigo/WhatsApp-Clone-Client-Angular/master/src/assets/chat-background.jpg)
*   [message-mine.png](https://raw.githubusercontent.com/Urigo/WhatsApp-Clone-Client-Angular/master/src/assets/message-mine.png)

In the main `index.ts` file of the screen we will simply import all 3 in the right order. We will start with the most simple one - the `ChatRoomNavbar`. The navbar should show the picture of the chat we're currently at and its name, along with a back button that will bring us back to the `ChatsListScreen`:

[{]: <helper> (diffStep 6.6 files="ChatNavbar" module="client")

#### [Client Step 6.6: Implement ChatRoomScreen components](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/4c8f2bc)

##### Added src&#x2F;components&#x2F;ChatRoomScreen&#x2F;ChatNavbar.tsx
```diff
@@ -0,0 +1,52 @@
+┊  ┊ 1┊import Button from '@material-ui/core/Button'
+┊  ┊ 2┊import Toolbar from '@material-ui/core/Toolbar'
+┊  ┊ 3┊import ArrowBackIcon from '@material-ui/icons/ArrowBack'
+┊  ┊ 4┊import * as React from 'react'
+┊  ┊ 5┊import { useCallback, useState } from 'react'
+┊  ┊ 6┊import styled from 'styled-components'
+┊  ┊ 7┊
+┊  ┊ 8┊const Container = styled(Toolbar) `
+┊  ┊ 9┊  padding: 0;
+┊  ┊10┊  display: flex;
+┊  ┊11┊  flex-direction: row;
+┊  ┊12┊  background-color: var(--primary-bg);
+┊  ┊13┊  color: var(--primary-text);
+┊  ┊14┊`
+┊  ┊15┊
+┊  ┊16┊const BackButton = styled(Button) `
+┊  ┊17┊  svg {
+┊  ┊18┊    color: var(--primary-text);
+┊  ┊19┊  }
+┊  ┊20┊`
+┊  ┊21┊
+┊  ┊22┊const Picture = styled.img `
+┊  ┊23┊  height: 40px;
+┊  ┊24┊  width: 40px;
+┊  ┊25┊  margin-top: 3px;
+┊  ┊26┊  margin-left: -22px;
+┊  ┊27┊  object-fit: cover;
+┊  ┊28┊  padding: 5px;
+┊  ┊29┊  border-radius: 50%;
+┊  ┊30┊`
+┊  ┊31┊
+┊  ┊32┊const Title = styled.div `
+┊  ┊33┊  line-height: 56px;
+┊  ┊34┊`
+┊  ┊35┊
+┊  ┊36┊const ChatNavbar = ({ chat, history }) => {
+┊  ┊37┊  const navBack = useCallback(() => {
+┊  ┊38┊    history.replace('/chats')
+┊  ┊39┊  }, [true])
+┊  ┊40┊
+┊  ┊41┊  return (
+┊  ┊42┊    <Container className={name}>
+┊  ┊43┊      <BackButton onClick={navBack}>
+┊  ┊44┊        <ArrowBackIcon />
+┊  ┊45┊      </BackButton>
+┊  ┊46┊      <Picture src={chat.picture} />
+┊  ┊47┊      <Title>{chat.name}</Title>
+┊  ┊48┊    </Container>
+┊  ┊49┊  )
+┊  ┊50┊}
+┊  ┊51┊
+┊  ┊52┊export default ChatNavbar
```

[}]: #

Next, would be the `MesagesList` component, where we will see a scrollable list of all the messages of the active chat:

[{]: <helper> (diffStep 6.6 files="MessagesList" module="client")

#### [Client Step 6.6: Implement ChatRoomScreen components](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/4c8f2bc)

##### Added src&#x2F;components&#x2F;ChatRoomScreen&#x2F;MessagesList.tsx
```diff
@@ -0,0 +1,73 @@
+┊  ┊ 1┊import moment from 'moment'
+┊  ┊ 2┊import * as React from 'react'
+┊  ┊ 3┊import styled from 'styled-components'
+┊  ┊ 4┊
+┊  ┊ 5┊const Container = styled.div`
+┊  ┊ 6┊  display: block;
+┊  ┊ 7┊  flex: 2;
+┊  ┊ 8┊  overflow-y: overlay;
+┊  ┊ 9┊  padding: 0 15px;
+┊  ┊10┊`
+┊  ┊11┊
+┊  ┊12┊const MessageItem = styled.div `
+┊  ┊13┊  float: right;
+┊  ┊14┊  background-color: #dcf8c6;
+┊  ┊15┊  display: inline-block;
+┊  ┊16┊  position: relative;
+┊  ┊17┊  max-width: 100%;
+┊  ┊18┊  border-radius: 7px;
+┊  ┊19┊  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
+┊  ┊20┊  margin-top: 10px;
+┊  ┊21┊  margin-bottom: 10px;
+┊  ┊22┊  clear: both;
+┊  ┊23┊
+┊  ┊24┊  &::after {
+┊  ┊25┊    content: '';
+┊  ┊26┊    display: table;
+┊  ┊27┊    clear: both;
+┊  ┊28┊  }
+┊  ┊29┊
+┊  ┊30┊  &::before {
+┊  ┊31┊    background-image: url(/assets/message-mine.png);
+┊  ┊32┊    content: '';
+┊  ┊33┊    position: absolute;
+┊  ┊34┊    bottom: 3px;
+┊  ┊35┊    width: 12px;
+┊  ┊36┊    height: 19px;
+┊  ┊37┊    right: -11px;
+┊  ┊38┊    background-position: 50% 50%;
+┊  ┊39┊    background-repeat: no-repeat;
+┊  ┊40┊    background-size: contain;
+┊  ┊41┊  }
+┊  ┊42┊`
+┊  ┊43┊
+┊  ┊44┊const Contents = styled.div `
+┊  ┊45┊  padding: 5px 7px;
+┊  ┊46┊  word-wrap: break-word;
+┊  ┊47┊
+┊  ┊48┊  &::after {
+┊  ┊49┊    content: ' \00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0';
+┊  ┊50┊    display: inline;
+┊  ┊51┊  }
+┊  ┊52┊`
+┊  ┊53┊
+┊  ┊54┊const Timestamp = styled.div `
+┊  ┊55┊  position: absolute;
+┊  ┊56┊  bottom: 2px;
+┊  ┊57┊  right: 7px;
+┊  ┊58┊  color: gray;
+┊  ┊59┊  font-size: 12px;
+┊  ┊60┊`
+┊  ┊61┊
+┊  ┊62┊const MessagesList = ({ messages }) => (
+┊  ┊63┊  <Container>
+┊  ┊64┊    {messages.map((message) => (
+┊  ┊65┊      <MessageItem key={message.id}>
+┊  ┊66┊        <Contents>{message.content}</Contents>
+┊  ┊67┊        <Timestamp>{moment(message.createdAt).format('HH:mm')}</Timestamp>
+┊  ┊68┊      </MessageItem>
+┊  ┊69┊    ))}
+┊  ┊70┊  </Container>
+┊  ┊71┊)
+┊  ┊72┊
+┊  ┊73┊export default MessagesList
```

[}]: #

And finally, would be the `MessageInput` component which will trigger an event whenever we type and submit a new message:

[{]: <helper> (diffStep 6.6 files="MessageInput" module="client")

#### [Client Step 6.6: Implement ChatRoomScreen components](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/4c8f2bc)

##### Added src&#x2F;components&#x2F;ChatRoomScreen&#x2F;MessageInput.tsx
```diff
@@ -0,0 +1,86 @@
+┊  ┊ 1┊import Button from '@material-ui/core/Button'
+┊  ┊ 2┊import SendIcon from '@material-ui/icons/Send'
+┊  ┊ 3┊import * as React from 'react'
+┊  ┊ 4┊import { useState } from 'react'
+┊  ┊ 5┊import styled from 'styled-components'
+┊  ┊ 6┊
+┊  ┊ 7┊const Container = styled.div`
+┊  ┊ 8┊  display: flex;
+┊  ┊ 9┊  height: 50px;
+┊  ┊10┊  padding: 5px;
+┊  ┊11┊  width: calc(100% - 10px);
+┊  ┊12┊`
+┊  ┊13┊
+┊  ┊14┊const ActualInput = styled.input `
+┊  ┊15┊  width: calc(100% - 50px);
+┊  ┊16┊  border: none;
+┊  ┊17┊  border-radius: 999px;
+┊  ┊18┊  padding: 10px;
+┊  ┊19┊  padding-left: 20px;
+┊  ┊20┊  padding-right: 20px;
+┊  ┊21┊  font-size: 15px;
+┊  ┊22┊  outline: none;
+┊  ┊23┊  box-shadow: 0 1px silver;
+┊  ┊24┊  font-size: 18px;
+┊  ┊25┊  line-height: 45px;
+┊  ┊26┊`
+┊  ┊27┊
+┊  ┊28┊const SendButton = styled(Button) `
+┊  ┊29┊  min-width: 50px !important;
+┊  ┊30┊  width: 50px !important;
+┊  ┊31┊  border-radius: 999px !important;
+┊  ┊32┊  background-color: var(--primary-bg) !important;
+┊  ┊33┊  margin: 0 5px !important;
+┊  ┊34┊  margin-right: 0 !important;
+┊  ┊35┊  color: white !important;
+┊  ┊36┊  padding-left: 20px !important;
+┊  ┊37┊
+┊  ┊38┊  svg {
+┊  ┊39┊    margin-left: -3px;
+┊  ┊40┊  }
+┊  ┊41┊`
+┊  ┊42┊
+┊  ┊43┊const MessageInput = ({ onSendMessage }) => {
+┊  ┊44┊  const [message, setMessage] = useState('')
+┊  ┊45┊
+┊  ┊46┊  const onKeyPress = e => {
+┊  ┊47┊    if (e.charCode === 13) {
+┊  ┊48┊      submitMessage()
+┊  ┊49┊    }
+┊  ┊50┊  }
+┊  ┊51┊
+┊  ┊52┊  const onChange = ({ target }) => {
+┊  ┊53┊    setMessage(target.value)
+┊  ┊54┊  }
+┊  ┊55┊
+┊  ┊56┊  const submitMessage = () => {
+┊  ┊57┊    if (!message) return
+┊  ┊58┊
+┊  ┊59┊    setMessage('')
+┊  ┊60┊
+┊  ┊61┊    if (typeof onSendMessage === 'function') {
+┊  ┊62┊      onSendMessage(message)
+┊  ┊63┊    }
+┊  ┊64┊  }
+┊  ┊65┊
+┊  ┊66┊  return (
+┊  ┊67┊    <Container>
+┊  ┊68┊      <ActualInput
+┊  ┊69┊        type="text"
+┊  ┊70┊        placeholder="Type a message"
+┊  ┊71┊        value={message}
+┊  ┊72┊        onKeyPress={onKeyPress}
+┊  ┊73┊        onChange={onChange}
+┊  ┊74┊      />
+┊  ┊75┊      <SendButton
+┊  ┊76┊        variant="contained"
+┊  ┊77┊        color="primary"
+┊  ┊78┊        onClick={submitMessage}
+┊  ┊79┊      >
+┊  ┊80┊        <SendIcon />
+┊  ┊81┊      </SendButton>
+┊  ┊82┊    </Container>
+┊  ┊83┊  )
+┊  ┊84┊}
+┊  ┊85┊
+┊  ┊86┊export default MessageInput
```

[}]: #

Now that we have all 3 components, we will put them all together in the main `index.ts` file:

[{]: <helper> (diffStep 6.6 files="index" module="client")

#### [Client Step 6.6: Implement ChatRoomScreen components](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/4c8f2bc)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -1,5 +1,16 @@
 ┊ 1┊ 1┊import * as React from 'react'
 ┊ 2┊ 2┊import { useMemo, useState } from 'react'
+┊  ┊ 3┊import styled from 'styled-components'
+┊  ┊ 4┊import ChatNavbar from './ChatNavbar'
+┊  ┊ 5┊import MessageInput from './MessageInput'
+┊  ┊ 6┊import MessagesList from './MessagesList'
+┊  ┊ 7┊
+┊  ┊ 8┊const Container = styled.div `
+┊  ┊ 9┊  background: url(/assets/chat-background.jpg);
+┊  ┊10┊  display: flex;
+┊  ┊11┊  flex-flow: column;
+┊  ┊12┊  height: 100vh;
+┊  ┊13┊`
 ┊ 3┊14┊
 ┊ 4┊15┊const getChatQuery = `
 ┊ 5┊16┊  query GetChat($chatId: ID!) {
```
```diff
@@ -16,7 +27,7 @@
 ┊16┊27┊  }
 ┊17┊28┊`
 ┊18┊29┊
-┊19┊  ┊const ChatRoomScreen = ({ match }) => {
+┊  ┊30┊const ChatRoomScreen = ({ history, match }) => {
 ┊20┊31┊  const { params: { chatId } } = match
 ┊21┊32┊  const [chat, setChat] = useState(null)
 ┊22┊33┊
```
```diff
@@ -38,17 +49,11 @@
 ┊38┊49┊  if (!chat) return null
 ┊39┊50┊
 ┊40┊51┊  return (
-┊41┊  ┊    <div>
-┊42┊  ┊      <img src={chat.picture} /><div>{chat.name}</div>
-┊43┊  ┊      <ul>
-┊44┊  ┊        {chat.messages.map((message) =>
-┊45┊  ┊          <li key={message.id}>
-┊46┊  ┊            <div>{message.content}</div>
-┊47┊  ┊            <div>{message.createdAt}</div>
-┊48┊  ┊          </li>
-┊49┊  ┊        )}
-┊50┊  ┊      </ul>
-┊51┊  ┊    </div>
+┊  ┊52┊    <Container>
+┊  ┊53┊      <ChatNavbar chat={chat} history={history} />
+┊  ┊54┊      <MessagesList messages={chat.messages} />
+┊  ┊55┊      <MessageInput />
+┊  ┊56┊    </Container>
 ┊52┊57┊  )
 ┊53┊58┊}
```

[}]: #

The view is complete! However the `MessageInput` is not bound to our messages list. We will use the triggered callback to update the chat state, whose changes should appear in the `MessagesList` component in the following render phase:

[{]: <helper> (diffStep 6.7 module="client")

#### [Client Step 6.7: Define onSendMessage callback](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/c72f705)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -1,5 +1,5 @@
 ┊1┊1┊import * as React from 'react'
-┊2┊ ┊import { useMemo, useState } from 'react'
+┊ ┊2┊import { useCallback, useMemo, useState } from 'react'
 ┊3┊3┊import styled from 'styled-components'
 ┊4┊4┊import ChatNavbar from './ChatNavbar'
 ┊5┊5┊import MessageInput from './MessageInput'
```
```diff
@@ -46,13 +46,26 @@
 ┊46┊46┊    setChat(chat)
 ┊47┊47┊  }, [true])
 ┊48┊48┊
+┊  ┊49┊  const onSendMessage = useCallback((content) => {
+┊  ┊50┊    const message = {
+┊  ┊51┊      id: chat.messages.length + 1,
+┊  ┊52┊      createdAt: Date.now(),
+┊  ┊53┊      content,
+┊  ┊54┊    }
+┊  ┊55┊
+┊  ┊56┊    setChat({
+┊  ┊57┊      ...chat,
+┊  ┊58┊      messages: chat.messages.concat(message),
+┊  ┊59┊    })
+┊  ┊60┊  }, [chat])
+┊  ┊61┊
 ┊49┊62┊  if (!chat) return null
 ┊50┊63┊
 ┊51┊64┊  return (
 ┊52┊65┊    <Container>
 ┊53┊66┊      <ChatNavbar chat={chat} history={history} />
 ┊54┊67┊      <MessagesList messages={chat.messages} />
-┊55┊  ┊      <MessageInput />
+┊  ┊68┊      <MessageInput onSendMessage={onSendMessage} />
 ┊56┊69┊    </Container>
 ┊57┊70┊  )
 ┊58┊71┊}
```

[}]: #

This is how the entire flow should look like:

![flow-demo](https://user-images.githubusercontent.com/7648874/54739741-27012280-4bf4-11e9-97cb-c715482e2e70.gif)

An edge case that should be taken care of is when the messages list length in the view exceeds the length of the container, in which case we will have to scroll down to the bottom of the view. This way we can keep track of the most recent message. We will use `ReactDOM` to retrieve the native HTML element of the container and change the position of the scroller whenever a messages was sent:

[{]: <helper> (diffStep 6.8 module="client")

#### [Client Step 6.8: Reset scroller on message sent](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/8554bf7)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;MessagesList.tsx
```diff
@@ -1,5 +1,7 @@
 ┊1┊1┊import moment from 'moment'
 ┊2┊2┊import * as React from 'react'
+┊ ┊3┊import { useEffect, useRef } from 'react'
+┊ ┊4┊import * as ReactDOM from 'react-dom'
 ┊3┊5┊import styled from 'styled-components'
 ┊4┊6┊
 ┊5┊7┊const Container = styled.div`
```
```diff
@@ -59,15 +61,26 @@
 ┊59┊61┊  font-size: 12px;
 ┊60┊62┊`
 ┊61┊63┊
-┊62┊  ┊const MessagesList = ({ messages }) => (
-┊63┊  ┊  <Container>
-┊64┊  ┊    {messages.map((message) => (
-┊65┊  ┊      <MessageItem key={message.id}>
-┊66┊  ┊        <Contents>{message.content}</Contents>
-┊67┊  ┊        <Timestamp>{moment(message.createdAt).format('HH:mm')}</Timestamp>
-┊68┊  ┊      </MessageItem>
-┊69┊  ┊    ))}
-┊70┊  ┊  </Container>
-┊71┊  ┊)
+┊  ┊64┊const MessagesList = ({ messages }) => {
+┊  ┊65┊  const selfRef = useRef(null)
+┊  ┊66┊
+┊  ┊67┊  useEffect(() => {
+┊  ┊68┊    if (!selfRef.current) return
+┊  ┊69┊
+┊  ┊70┊    const selfDOMNode = ReactDOM.findDOMNode(selfRef.current) as HTMLElement
+┊  ┊71┊    selfDOMNode.scrollTop = Number.MAX_SAFE_INTEGER
+┊  ┊72┊  }, [messages.length])
+┊  ┊73┊
+┊  ┊74┊  return (
+┊  ┊75┊    <Container ref={selfRef}>
+┊  ┊76┊      {messages.map((message) => (
+┊  ┊77┊        <MessageItem key={message.id}>
+┊  ┊78┊          <Contents>{message.content}</Contents>
+┊  ┊79┊          <Timestamp>{moment(message.createdAt).format('HH:mm')}</Timestamp>
+┊  ┊80┊        </MessageItem>
+┊  ┊81┊      ))}
+┊  ┊82┊    </Container>
+┊  ┊83┊  )
+┊  ┊84┊}
 ┊72┊85┊
 ┊73┊86┊export default MessagesList
```

[}]: #

Before we wrap things up, we should also test our components. Since the new components have a direct control over the app's history, we should also find a way to simulate it in our tests. The `react-dom-router` uses the [`history`](https://www.npmjs.com/package/history) package under the hood, that means that we can use that package to inject a custom history object directly into the tested components. Let's install this package if so:

  $ npm install history --dev

And then implement our test suites:

[{]: <helper> (diffStep 6.9 files="components" module="client")

#### [Client Step 6.9: Test ChatRoomScreen child components](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/d7a189e)

##### Added src&#x2F;components&#x2F;ChatRoomScreen&#x2F;ChatNavbar.test.tsx
```diff
@@ -0,0 +1,49 @@
+┊  ┊ 1┊import { createMemoryHistory } from 'history'
+┊  ┊ 2┊import React from 'react'
+┊  ┊ 3┊import { cleanup, render, fireEvent, wait } from 'react-testing-library'
+┊  ┊ 4┊import ChatNavbar from './ChatNavbar'
+┊  ┊ 5┊
+┊  ┊ 6┊describe('ChatNavbar', () => {
+┊  ┊ 7┊  afterEach(cleanup)
+┊  ┊ 8┊
+┊  ┊ 9┊  it('renders chat data', () => {
+┊  ┊10┊    const chat = {
+┊  ┊11┊      id: '1',
+┊  ┊12┊      name: 'Foo Bar',
+┊  ┊13┊      picture: 'https://localhost:4000/picture.jpg',
+┊  ┊14┊    }
+┊  ┊15┊
+┊  ┊16┊    {
+┊  ┊17┊      const { container, getByTestId } = render(<ChatNavbar chat={chat} />)
+┊  ┊18┊
+┊  ┊19┊      expect(getByTestId('chat-name')).toHaveTextContent('Foo Bar')
+┊  ┊20┊      expect(getByTestId('chat-picture')).toHaveAttribute('src', 'https://localhost:4000/picture.jpg')
+┊  ┊21┊    }
+┊  ┊22┊  })
+┊  ┊23┊
+┊  ┊24┊  it('goes back on arrow click', async () => {
+┊  ┊25┊    const chat = {
+┊  ┊26┊      id: '1',
+┊  ┊27┊      name: 'Foo Bar',
+┊  ┊28┊      picture: 'https://localhost:4000/picture.jpg',
+┊  ┊29┊    }
+┊  ┊30┊
+┊  ┊31┊    const history = createMemoryHistory()
+┊  ┊32┊
+┊  ┊33┊    history.push('/chats/1')
+┊  ┊34┊
+┊  ┊35┊    await wait(() =>
+┊  ┊36┊      expect(history.location.pathname).toEqual('/chats/1')
+┊  ┊37┊    )
+┊  ┊38┊
+┊  ┊39┊    {
+┊  ┊40┊      const { container, getByTestId } = render(<ChatNavbar chat={chat} history={history} />)
+┊  ┊41┊
+┊  ┊42┊      fireEvent.click(getByTestId('back-button'))
+┊  ┊43┊
+┊  ┊44┊      await wait(() =>
+┊  ┊45┊        expect(history.location.pathname).toEqual('/chats')
+┊  ┊46┊      )
+┊  ┊47┊    }
+┊  ┊48┊  })
+┊  ┊49┊})
```

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;ChatNavbar.tsx
```diff
@@ -29,7 +29,7 @@
 ┊29┊29┊  border-radius: 50%;
 ┊30┊30┊`
 ┊31┊31┊
-┊32┊  ┊const Title = styled.div `
+┊  ┊32┊const Name = styled.div `
 ┊33┊33┊  line-height: 56px;
 ┊34┊34┊`
 ┊35┊35┊
```
```diff
@@ -40,11 +40,11 @@
 ┊40┊40┊
 ┊41┊41┊  return (
 ┊42┊42┊    <Container className={name}>
-┊43┊  ┊      <BackButton onClick={navBack}>
+┊  ┊43┊      <BackButton data-testid="back-button" onClick={navBack}>
 ┊44┊44┊        <ArrowBackIcon />
 ┊45┊45┊      </BackButton>
-┊46┊  ┊      <Picture src={chat.picture} />
-┊47┊  ┊      <Title>{chat.name}</Title>
+┊  ┊46┊      <Picture data-testid="chat-picture" src={chat.picture} />
+┊  ┊47┊      <Name data-testid="chat-name">{chat.name}</Name>
 ┊48┊48┊    </Container>
 ┊49┊49┊  )
 ┊50┊50┊}
```

##### Added src&#x2F;components&#x2F;ChatRoomScreen&#x2F;MessageInput.test.tsx
```diff
@@ -0,0 +1,47 @@
+┊  ┊ 1┊import { createMemoryHistory } from 'history'
+┊  ┊ 2┊import React from 'react'
+┊  ┊ 3┊import { cleanup, render, fireEvent, wait, waitForElement } from 'react-testing-library'
+┊  ┊ 4┊import MessageInput from './MessageInput'
+┊  ┊ 5┊
+┊  ┊ 6┊describe('MessageInput', () => {
+┊  ┊ 7┊  afterEach(cleanup)
+┊  ┊ 8┊
+┊  ┊ 9┊  it('triggers callback on send button click', async () => {
+┊  ┊10┊    const onSendMessage = jest.fn(() => {})
+┊  ┊11┊
+┊  ┊12┊    {
+┊  ┊13┊      const { container, getByTestId } = render(<MessageInput onSendMessage={onSendMessage} />)
+┊  ┊14┊      const messageInput = getByTestId('message-input')
+┊  ┊15┊      const sendButton = getByTestId('send-button')
+┊  ┊16┊
+┊  ┊17┊      fireEvent.change(messageInput, { target: { value: 'foo' } })
+┊  ┊18┊
+┊  ┊19┊      await waitForElement(() => messageInput)
+┊  ┊20┊
+┊  ┊21┊      fireEvent.click(sendButton)
+┊  ┊22┊
+┊  ┊23┊      await wait(() =>
+┊  ┊24┊        expect(onSendMessage.mock.calls.length).toBe(1)
+┊  ┊25┊      )
+┊  ┊26┊    }
+┊  ┊27┊  })
+┊  ┊28┊
+┊  ┊29┊  it('triggers callback on Enter press', async () => {
+┊  ┊30┊    const onSendMessage = jest.fn(() => {})
+┊  ┊31┊
+┊  ┊32┊    {
+┊  ┊33┊      const { container, getByTestId } = render(<MessageInput onSendMessage={onSendMessage} />)
+┊  ┊34┊      const messageInput = getByTestId('message-input')
+┊  ┊35┊
+┊  ┊36┊      fireEvent.change(messageInput, { target: { value: 'foo' } })
+┊  ┊37┊
+┊  ┊38┊      await waitForElement(() => messageInput)
+┊  ┊39┊
+┊  ┊40┊      fireEvent.keyPress(messageInput, { key: 'Enter', code: 13, charCode: 13 })
+┊  ┊41┊
+┊  ┊42┊      await wait(() =>
+┊  ┊43┊        expect(onSendMessage.mock.calls.length).toBe(1)
+┊  ┊44┊      )
+┊  ┊45┊    }
+┊  ┊46┊  })
+┊  ┊47┊})
```

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;MessageInput.tsx
```diff
@@ -66,6 +66,7 @@
 ┊66┊66┊  return (
 ┊67┊67┊    <Container>
 ┊68┊68┊      <ActualInput
+┊  ┊69┊        data-testid="message-input"
 ┊69┊70┊        type="text"
 ┊70┊71┊        placeholder="Type a message"
 ┊71┊72┊        value={message}
```
```diff
@@ -73,6 +74,7 @@
 ┊73┊74┊        onChange={onChange}
 ┊74┊75┊      />
 ┊75┊76┊      <SendButton
+┊  ┊77┊        data-testid="send-button"
 ┊76┊78┊        variant="contained"
 ┊77┊79┊        color="primary"
 ┊78┊80┊        onClick={submitMessage}
```

##### Added src&#x2F;components&#x2F;ChatRoomScreen&#x2F;MessagesList.test.tsx
```diff
@@ -0,0 +1,37 @@
+┊  ┊ 1┊import { createMemoryHistory } from 'history'
+┊  ┊ 2┊import React from 'react'
+┊  ┊ 3┊import { cleanup, render, fireEvent, wait, getByTestId } from 'react-testing-library'
+┊  ┊ 4┊import MessagesList from './MessagesList'
+┊  ┊ 5┊
+┊  ┊ 6┊describe('MessagesList', () => {
+┊  ┊ 7┊  afterEach(cleanup)
+┊  ┊ 8┊
+┊  ┊ 9┊  it('renders messages data', () => {
+┊  ┊10┊    const messages = [
+┊  ┊11┊      {
+┊  ┊12┊        id: '1',
+┊  ┊13┊        content: 'foo',
+┊  ┊14┊        createdAt: new Date(0),
+┊  ┊15┊      },
+┊  ┊16┊      {
+┊  ┊17┊        id: '2',
+┊  ┊18┊        content: 'bar',
+┊  ┊19┊        createdAt: new Date(1000 * 60 * 60),
+┊  ┊20┊      },
+┊  ┊21┊    ]
+┊  ┊22┊
+┊  ┊23┊    let message1, message2
+┊  ┊24┊    {
+┊  ┊25┊      const { container, getAllByTestId, getByTestId } = render(<MessagesList messages={messages} />)
+┊  ┊26┊      const match = getAllByTestId('message-item')
+┊  ┊27┊      message1 = match[0]
+┊  ┊28┊      message2 = match[1]
+┊  ┊29┊    }
+┊  ┊30┊
+┊  ┊31┊    expect(getByTestId(message1, 'message-content')).toHaveTextContent('foo')
+┊  ┊32┊    expect(getByTestId(message1, 'message-date')).toHaveTextContent('08:00')
+┊  ┊33┊
+┊  ┊34┊    expect(getByTestId(message2, 'message-content')).toHaveTextContent('bar')
+┊  ┊35┊    expect(getByTestId(message2, 'message-date')).toHaveTextContent('09:00')
+┊  ┊36┊  })
+┊  ┊37┊})
```

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;MessagesList.tsx
```diff
@@ -74,9 +74,9 @@
 ┊74┊74┊  return (
 ┊75┊75┊    <Container ref={selfRef}>
 ┊76┊76┊      {messages.map((message) => (
-┊77┊  ┊        <MessageItem key={message.id}>
-┊78┊  ┊          <Contents>{message.content}</Contents>
-┊79┊  ┊          <Timestamp>{moment(message.createdAt).format('HH:mm')}</Timestamp>
+┊  ┊77┊        <MessageItem data-testid="message-item" key={message.id}>
+┊  ┊78┊          <Contents data-testid="message-content">{message.content}</Contents>
+┊  ┊79┊          <Timestamp data-testid="message-date">{moment(message.createdAt).format('HH:mm')}</Timestamp>
 ┊80┊80┊        </MessageItem>
 ┊81┊81┊      ))}
 ┊82┊82┊    </Container>
```

[}]: #

There are many things which are incomplete in the current implementation. The functionality exists in the UI, but no messages are really being sent and stored in the database. In the next chapters we will learn how to:



*   Cache query results with Apollo-Client.
*   Send messages with GraphQL mutations


[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/final@next/.tortilla/manuals/views/step5.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/final@next/.tortilla/manuals/views/step7.md) |
|:--------------------------------|--------------------------------:|

[}]: #
