# Step 6: Creating an app router and implementing a chat room

[//]: # (head-end)


In this chapter we will learn how to build a chat room screen.
In order to navigate between different screens, we will setup a router.

Since we're gonna have to screens in our app now - `ChatsListScreen` and `ChatRoomScreen`, we will need a router that will be able to alternate between them.
We will be using the [`react-router-dom`](https://www.npmjs.com/package/react-router-dom) package to manage the routes of the application:

    $ yarn add react-router-dom

And we will implement a router directly in the `<App />` component:

[{]: <helper> (diffStep 6.1 files="App" module="client")

#### Client Step 6.1: Add router

##### Changed src&#x2F;App.tsx
```diff
@@ -1,10 +1,20 @@
 ┊ 1┊ 1┊import React from 'react';
+┊  ┊ 2┊import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';
+┊  ┊ 3┊import ChatRoomScreen from './components/ChatRoomScreen';
 ┊ 2┊ 4┊import ChatsListScreen from './components/ChatsListScreen';
 ┊ 3┊ 5┊
 ┊ 4┊ 6┊const App: React.FC = () => (
-┊ 5┊  ┊  <div>
-┊ 6┊  ┊    <ChatsListScreen/>
-┊ 7┊  ┊  </div>
+┊  ┊ 7┊  <BrowserRouter>
+┊  ┊ 8┊    <Switch>
+┊  ┊ 9┊      <Route exact path="/chats" component={ChatsListScreen} />
+┊  ┊10┊      <Route exact path="/chats/:chatId" component={ChatRoomScreen} />
+┊  ┊11┊    </Switch>
+┊  ┊12┊    <Route exact path="/" render={redirectToChats} />
+┊  ┊13┊  </BrowserRouter>
+┊  ┊14┊);
+┊  ┊15┊
+┊  ┊16┊const redirectToChats = () => (
+┊  ┊17┊  <Redirect to="/chats" />
 ┊ 8┊18┊);
 ┊ 9┊19┊
 ┊10┊20┊export default App;
```

[}]: #

The purpose of a router is to make route managing easy and declarative.
It will take care of managing the history within our app and parameterizing certain screens according to our need.
Essentially it's a wrap around the `window.history` object which is also compatible with React.
I recommend you to go through the [official MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/History) if you're not yet familiar with the concept.

The `<Route />` component represents a path for a route in our application. Using the colon syntax (`:chatId`) we basically tell the router that the `/chat` route should be followed by a string whose value can later on be addressed via a parameter called `chatId` when navigating to the route. So here's a sum-up of the routes manifest:



*   `/chats` - will navigate to the `ChatsListScreen`.
*   `/chat/:chatId` - e.g. `/chat/1`, will navigate to the `ChatRoomScreen` and will parameterize it to show data which is related to chat ID 1.
*   Any other route will fallback to the `/chats` route which will redirect us to the `ChatsListScreen`.

Now we will implement the `ChatRoomScreen` so the router can function properly.
For now we will make it a plain screen which simply prints out the information of the chat that was clicked so we can have a complete flow,
and then we will take care of the rest.

To do so, we will first implement the `chat` query in our backend.
This would be a parameterized query that will provide us with a specific chat according to the received ID,
and it will be used by the new screen as soon as it is initialized.
First we would update the `Chat` type to contain a `messages` field:

[{]: <helper> (diffStep 4.1 files="typeDefs.graphql" module="server")

#### [Server Step 4.1: Add messages field to Chat type](https://github.com/Urigo/WhatsApp-Clone-Server/commit/9f01cf6)

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

Then we will create the appropriate resolver:

[{]: <helper> (diffStep 4.1 files="resolvers.ts" module="server")

#### [Server Step 4.1: Add messages field to Chat type](https://github.com/Urigo/WhatsApp-Clone-Server/commit/9f01cf6)

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

[}]: #

And then we will update our DB mock to be aligned with these changes:

[{]: <helper> (diffStep 4.1 files="db" module="server")

#### [Server Step 4.1: Add messages field to Chat type](https://github.com/Urigo/WhatsApp-Clone-Server/commit/9f01cf6)

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

#### [Server Step 4.2: Resolve last message based on messages array](https://github.com/Urigo/WhatsApp-Clone-Server/commit/eacae7b)

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

#### [Server Step 4.3: Add chat field to Query type](https://github.com/Urigo/WhatsApp-Clone-Server/commit/93160df)

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

#### [Server Step 4.3: Add chat field to Query type](https://github.com/Urigo/WhatsApp-Clone-Server/commit/93160df)

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

#### [Server Step 4.3: Add chat field to Query type](https://github.com/Urigo/WhatsApp-Clone-Server/commit/93160df)

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

#### [Server Step 4.3: Add chat field to Query type](https://github.com/Urigo/WhatsApp-Clone-Server/commit/93160df)



[}]: #

If you experience any TypeScript related issues with the following error:

```
Object literal may only specify known properties, and 'variables' does not exist in type 'Query'.
```

Add the following declaration file to your project:

[{]: <helper> (diffStep 4.3 files="types" module="server")

#### [Server Step 4.3: Add chat field to Query type](https://github.com/Urigo/WhatsApp-Clone-Server/commit/93160df)

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

This is a [known issue](https://github.com/apollographql/apollo-server/issues/2172) in the `apollo-server-testing` package and has a pending [fix PR](https://github.com/apollographql/apollo-server/pull/2307).
Now getting back to the client, let's implement a basic version of the `ChatRoomScreen` where we will fetch the new query and print it to the screen:

[{]: <helper> (diffStep 6.2 module="client")

#### Client Step 6.2: Add basic ChatRoomScreen

##### Changed src&#x2F;App.tsx
```diff
@@ -1,5 +1,5 @@
 ┊1┊1┊import React from 'react';
-┊2┊ ┊import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';
+┊ ┊2┊import { BrowserRouter, Route, Redirect, Switch, RouteComponentProps } from 'react-router-dom';
 ┊3┊3┊import ChatRoomScreen from './components/ChatRoomScreen';
 ┊4┊4┊import ChatsListScreen from './components/ChatsListScreen';
 ┊5┊5┊
```
```diff
@@ -7,7 +7,12 @@
 ┊ 7┊ 7┊  <BrowserRouter>
 ┊ 8┊ 8┊    <Switch>
 ┊ 9┊ 9┊      <Route exact path="/chats" component={ChatsListScreen} />
-┊10┊  ┊      <Route exact path="/chats/:chatId" component={ChatRoomScreen} />
+┊  ┊10┊
+┊  ┊11┊      <Route exact path="/chats/:chatId" component={
+┊  ┊12┊        ({ match }: RouteComponentProps<{ chatId: string }>) =>
+┊  ┊13┊        (<ChatRoomScreen chatId={match.params.chatId} />)
+┊  ┊14┊      } />
+┊  ┊15┊
 ┊11┊16┊    </Switch>
 ┊12┊17┊    <Route exact path="/" render={redirectToChats} />
 ┊13┊18┊  </BrowserRouter>
```
```diff
@@ -17,4 +22,4 @@
 ┊17┊22┊  <Redirect to="/chats" />
 ┊18┊23┊);
 ┊19┊24┊
-┊20┊  ┊export default App;
+┊  ┊25┊export default App;🚫↵
```

##### Added src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -0,0 +1,74 @@
+┊  ┊ 1┊import React from 'react';
+┊  ┊ 2┊import { useMemo, useState } from 'react';
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
+┊  ┊17┊`;
+┊  ┊18┊
+┊  ┊19┊interface ChatRoomScreenParams {
+┊  ┊20┊  chatId: string
+┊  ┊21┊};
+┊  ┊22┊
+┊  ┊23┊interface ChatQueryMessage {
+┊  ┊24┊  id: string;
+┊  ┊25┊  content: string;
+┊  ┊26┊  createdAt: string;
+┊  ┊27┊};
+┊  ┊28┊
+┊  ┊29┊interface ChatQueryResult {
+┊  ┊30┊  id: string;
+┊  ┊31┊  name: string;
+┊  ┊32┊  picture: string;
+┊  ┊33┊  messages: Array<ChatQueryMessage>;
+┊  ┊34┊};
+┊  ┊35┊
+┊  ┊36┊type OptionalChatQueryResult = ChatQueryResult | null;
+┊  ┊37┊
+┊  ┊38┊const ChatRoomScreen: React.FC<ChatRoomScreenParams> = ({ chatId }) => {
+┊  ┊39┊  const [chat, setChat] = useState<OptionalChatQueryResult>(null);
+┊  ┊40┊
+┊  ┊41┊  useMemo(async () => {
+┊  ┊42┊    const body = await fetch(`${process.env.REACT_APP_SERVER_URL}/graphql`, {
+┊  ┊43┊      method: 'POST',
+┊  ┊44┊      headers: {
+┊  ┊45┊        'Content-Type': 'application/json',
+┊  ┊46┊      },
+┊  ┊47┊      body: JSON.stringify({
+┊  ┊48┊        query: getChatQuery,
+┊  ┊49┊        variables: { chatId },
+┊  ┊50┊      }),
+┊  ┊51┊    });
+┊  ┊52┊    const { data: { chat } } = await body.json();
+┊  ┊53┊    setChat(chat);
+┊  ┊54┊  }, [chatId]);
+┊  ┊55┊
+┊  ┊56┊  if (!chat) return null;
+┊  ┊57┊
+┊  ┊58┊  return (
+┊  ┊59┊    <div>
+┊  ┊60┊      <img src={chat.picture} alt="Profile"/>
+┊  ┊61┊      <div>{chat.name}</div>
+┊  ┊62┊      <ul>
+┊  ┊63┊        {chat.messages.map((message) =>
+┊  ┊64┊          <li key={message.id}>
+┊  ┊65┊            <div>{message.content}</div>
+┊  ┊66┊            <div>{message.createdAt}</div>
+┊  ┊67┊          </li>
+┊  ┊68┊        )}
+┊  ┊69┊      </ul>
+┊  ┊70┊    </div>
+┊  ┊71┊  );
+┊  ┊72┊};
+┊  ┊73┊
+┊  ┊74┊export default ChatRoomScreen;🚫↵
```

[}]: #

Note how we used the `match.params.chatId` variable to get the selected chat ID.
The `match` prop is defined and provided to us by the `<Route />` component, since it interfaces directly with the `ChatRoomScreen`.
More about that can be read in the [official docs page](https://reacttraining.com/react-router/core/api/match).

In many examples online, you can see people pass the `match` prop directly to the component.
The main issue with that is that this makes the component being usable only by a router, but the truth is that the component
doesn't care if it's consumed by a router or another parents component as long as they will pass the `chatId` prop.

So we need to make sure the interface of the ChatRoom component defines those requierements right.

Next we will call our server from the component with the right query and store the result on a `useState` hook.

Now, because we are using GraphQL, we know the types of the result that we are going to get, so let's create Typescript interfaces that
describe the data we're going to get from the server.

If you'll run the application and type `/chats/1` in the URL bar, this is what you should see on the screen:

![naked-chat](https://user-images.githubusercontent.com/7648874/54664314-d4096b80-4b1e-11e9-9e06-1323cf7b0abe.png)

The view has no styling at all but it should be fixed in a moment.
To make navigation more convenient we will add an `onClick` listener for each chat item in the `ChatsList`.
Using the [history](https://reacttraining.com/react-router/core/api/history) object, provided to us by the `<Route />` component,
we will navigate to the correlated `ChatRoomScreen`:

First let's install the `history` package:

    $ yarn add history @types/history

[{]: <helper> (diffStep 6.3 module="client")

#### Client Step 6.3: Navigate to chat on click

##### Changed package.json
```diff
@@ -5,6 +5,7 @@
 ┊ 5┊ 5┊  "dependencies": {
 ┊ 6┊ 6┊    "@material-ui/core": "3.9.3",
 ┊ 7┊ 7┊    "@material-ui/icons": "3.0.2",
+┊  ┊ 8┊    "@types/history": "4.7.2",
 ┊ 8┊ 9┊    "@types/jest": "24.0.13",
 ┊ 9┊10┊    "@types/material-ui": "0.21.6",
 ┊10┊11┊    "@types/node": "12.0.1",
```
```diff
@@ -12,6 +13,7 @@
 ┊12┊13┊    "@types/react-dom": "16.8.4",
 ┊13┊14┊    "@types/react-router-dom": "4.3.3",
 ┊14┊15┊    "@types/styled-components": "4.1.14",
+┊  ┊16┊    "history": "4.9.0",
 ┊15┊17┊    "moment": "2.24.0",
 ┊16┊18┊    "react": "16.8.6",
 ┊17┊19┊    "react-dom": "16.8.6",
```

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.tsx
```diff
@@ -2,7 +2,8 @@
 ┊2┊2┊import moment from 'moment';
 ┊3┊3┊import { List, ListItem } from '@material-ui/core';
 ┊4┊4┊import styled from 'styled-components';
-┊5┊ ┊import { useState, useMemo } from 'react';
+┊ ┊5┊import { useCallback, useState, useMemo } from 'react';
+┊ ┊6┊import { History } from 'history';
 ┊6┊7┊
 ┊7┊8┊const Container = styled.div `
 ┊8┊9┊  height: calc(100% - 56px);
```
```diff
@@ -69,9 +70,13 @@
 ┊69┊70┊      }
 ┊70┊71┊    }
 ┊71┊72┊  }
-┊72┊  ┊`
+┊  ┊73┊`;
+┊  ┊74┊
+┊  ┊75┊interface ChatsListProps {
+┊  ┊76┊  history : History;
+┊  ┊77┊};
 ┊73┊78┊
-┊74┊  ┊const ChatsList = () => {
+┊  ┊79┊const ChatsList: React.FC<ChatsListProps> = ({ history }) => {
 ┊75┊80┊  const [chats, setChats] = useState<any[]>([]);
 ┊76┊81┊
 ┊77┊82┊  useMemo(async () => {
```
```diff
@@ -86,11 +91,15 @@
 ┊ 86┊ 91┊    setChats(chats);
 ┊ 87┊ 92┊  }, []);
 ┊ 88┊ 93┊
+┊   ┊ 94┊  const navToChat = useCallback((chat) => {
+┊   ┊ 95┊    history.push(`chats/${chat.id}`)
+┊   ┊ 96┊  }, [history]);
+┊   ┊ 97┊
 ┊ 89┊ 98┊  return (
 ┊ 90┊ 99┊    <Container>
 ┊ 91┊100┊      <StyledList>
 ┊ 92┊101┊        {chats.map((chat) => (
-┊ 93┊   ┊          <StyledListItem key={chat.id} button>
+┊   ┊102┊          <StyledListItem key={chat.id} data-testid="chat" button onClick={navToChat.bind(null, chat)}>
 ┊ 94┊103┊            <ChatPicture data-testid="picture" src={chat.picture} alt="Profile"/>
 ┊ 95┊104┊            <ChatInfo>
 ┊ 96┊105┊              <ChatName data-testid="name">{chat.name}</ChatName>
```

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;index.tsx
```diff
@@ -2,15 +2,20 @@
 ┊ 2┊ 2┊import ChatsNavbar from './ChatsNavbar';
 ┊ 3┊ 3┊import ChatsList from './ChatsList';
 ┊ 4┊ 4┊import styled from 'styled-components';
+┊  ┊ 5┊import { History } from 'history';
 ┊ 5┊ 6┊
 ┊ 6┊ 7┊const Container = styled.div `
 ┊ 7┊ 8┊  height: 100vh;
 ┊ 8┊ 9┊`;
 ┊ 9┊10┊
-┊10┊  ┊const ChatsListScreen: React.FC = () => (
+┊  ┊11┊interface ChatsListScreenProps {
+┊  ┊12┊  history : History;
+┊  ┊13┊};
+┊  ┊14┊
+┊  ┊15┊const ChatsListScreen: React.FC<ChatsListScreenProps> = ({ history }) => (
 ┊11┊16┊  <Container>
 ┊12┊17┊    <ChatsNavbar />
-┊13┊  ┊    <ChatsList />
+┊  ┊18┊    <ChatsList history={history} />
 ┊14┊19┊  </Container>
 ┊15┊20┊);
```

[}]: #

And add test the new logic:

[{]: <helper> (diffStep 6.4 module="client")

#### Client Step 6.4: Test new navigation logic

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.test.tsx
```diff
@@ -1,10 +1,14 @@
 ┊ 1┊ 1┊import React from 'react';
 ┊ 2┊ 2┊import ReactDOM from 'react-dom';
-┊ 3┊  ┊import { cleanup, render, waitForDomChange } from 'react-testing-library';
+┊  ┊ 3┊import { cleanup, render, fireEvent, wait, waitForDomChange } from 'react-testing-library';
 ┊ 4┊ 4┊import ChatsList from './ChatsList';
+┊  ┊ 5┊import { createBrowserHistory } from 'history';
 ┊ 5┊ 6┊
 ┊ 6┊ 7┊describe('ChatsList', () => {
-┊ 7┊  ┊  afterEach(cleanup);
+┊  ┊ 8┊  afterEach(() => {
+┊  ┊ 9┊    cleanup();
+┊  ┊10┊    window.location.pathname = '/';
+┊  ┊11┊  });
 ┊ 8┊12┊
 ┊ 9┊13┊  it('renders fetched chats data', async () => {
 ┊10┊14┊    fetch.mockResponseOnce(JSON.stringify({
```
```diff
@@ -17,7 +21,7 @@
 ┊17┊21┊            lastMessage: {
 ┊18┊22┊              id: 1,
 ┊19┊23┊              content: 'Hello',
-┊20┊  ┊              createdAt: new Date(0),
+┊  ┊24┊              createdAt: new Date('14 Jun 2017 00:00:00 PDT').toUTCString(),
 ┊21┊25┊            },
 ┊22┊26┊          },
 ┊23┊27┊        ],
```
```diff
@@ -32,7 +36,40 @@
 ┊32┊36┊      expect(getByTestId('name')).toHaveTextContent('Foo Bar');
 ┊33┊37┊      expect(getByTestId('picture')).toHaveAttribute('src', 'https://localhost:4000/picture.jpg');
 ┊34┊38┊      expect(getByTestId('content')).toHaveTextContent('Hello');
-┊35┊  ┊      expect(getByTestId('date')).toHaveTextContent('01:00');
+┊  ┊39┊      expect(getByTestId('date')).toHaveTextContent('10:00');
+┊  ┊40┊    }
+┊  ┊41┊  });
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
+┊  ┊59┊    }));
+┊  ┊60┊
+┊  ┊61┊     const history = createBrowserHistory();
+┊  ┊62┊
+┊  ┊63┊     {
+┊  ┊64┊      const { container, getByTestId } = render(<ChatsList history={history} />);
+┊  ┊65┊
+┊  ┊66┊       await waitForDomChange({ container });
+┊  ┊67┊
+┊  ┊68┊       fireEvent.click(getByTestId('chat'));
+┊  ┊69┊
+┊  ┊70┊       await wait(() =>
+┊  ┊71┊        expect(history.location.pathname).toEqual('/chats/1')
+┊  ┊72┊      );
 ┊36┊73┊    }
 ┊37┊74┊  });
 ┊38┊75┊});
```

[}]: #

If you'll click on the chat item you'll see that the screen changes very suddenly.
We can smooth the transition by animating it with CSS.
Luckily we don't need to implemented such mechanism manually because there's a package that can do that for us - [`react-router-transition`](https://www.npmjs.com/package/react-router-transition):

    $ yarn add react-router-transition

And let's add the mising types for the library:

[{]: <helper> (diffStep 6.5 files="react-app-env.d.ts" module="client")

#### Client Step 6.5: Animate route switching

##### Changed src&#x2F;react-app-env.d.ts
```diff
@@ -1 +1,3 @@
 ┊1┊1┊/// <reference types="react-scripts" />
+┊ ┊2┊
+┊ ┊3┊declare module "react-router-transition";🚫↵
```

[}]: #

Using this package, we will create a custom `Switch` component that will play an animation for all its subordinate `Route` components.
The animation is defined by the user using a component called `AnimatedSwitch` as specified in the [package's docs page](http://maisano.github.io/react-router-transition/animated-switch/props).
So first, let's create our switch component that will play a smooth transition switching routes:

[{]: <helper> (diffStep 6.5 files="AnimatedSwitch" module="client")

#### Client Step 6.5: Animate route switching

##### Added src&#x2F;components&#x2F;AnimatedSwitch.tsx
```diff
@@ -0,0 +1,37 @@
+┊  ┊ 1┊import { Switch } from 'react-router-dom';
+┊  ┊ 2┊import { AnimatedSwitch, spring } from 'react-router-transition';
+┊  ┊ 3┊import styled from 'styled-components';
+┊  ┊ 4┊
+┊  ┊ 5┊// A workaround to make test pass
+┊  ┊ 6┊const SwitchComponent = process.env.NODE_ENV === 'test' ? Switch : AnimatedSwitch;
+┊  ┊ 7┊
+┊  ┊ 8┊const glide = (val: number) =>
+┊  ┊ 9┊  spring(val, {
+┊  ┊10┊    stiffness: 174,
+┊  ┊11┊    damping: 24,
+┊  ┊12┊  });
+┊  ┊13┊
+┊  ┊14┊const mapStyles = (styles :any) => ({
+┊  ┊15┊  transform: `translateX(${styles.offset}%)`,
+┊  ┊16┊});
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
+┊  ┊37┊export default MyAnimatedSwitch;
```

[}]: #

And then replace it with the main `Switch` component in our app:

[{]: <helper> (diffStep 6.5 files="App" module="client")

#### Client Step 6.5: Animate route switching

##### Changed src&#x2F;App.tsx
```diff
@@ -1,11 +1,12 @@
 ┊ 1┊ 1┊import React from 'react';
-┊ 2┊  ┊import { BrowserRouter, Route, Redirect, Switch, RouteComponentProps } from 'react-router-dom';
+┊  ┊ 2┊import { BrowserRouter, Route, Redirect, RouteComponentProps } from 'react-router-dom';
 ┊ 3┊ 3┊import ChatRoomScreen from './components/ChatRoomScreen';
 ┊ 4┊ 4┊import ChatsListScreen from './components/ChatsListScreen';
+┊  ┊ 5┊import AnimatedSwitch from './components/AnimatedSwitch';
 ┊ 5┊ 6┊
 ┊ 6┊ 7┊const App: React.FC = () => (
 ┊ 7┊ 8┊  <BrowserRouter>
-┊ 8┊  ┊    <Switch>
+┊  ┊ 9┊    <AnimatedSwitch>
 ┊ 9┊10┊      <Route exact path="/chats" component={ChatsListScreen} />
 ┊10┊11┊
 ┊11┊12┊      <Route exact path="/chats/:chatId" component={
```
```diff
@@ -13,7 +14,7 @@
 ┊13┊14┊        (<ChatRoomScreen chatId={match.params.chatId} />)
 ┊14┊15┊      } />
 ┊15┊16┊
-┊16┊  ┊    </Switch>
+┊  ┊17┊    </AnimatedSwitch>
 ┊17┊18┊    <Route exact path="/" render={redirectToChats} />
 ┊18┊19┊  </BrowserRouter>
 ┊19┊20┊);
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

In the main `index.ts` file of the screen we will simply import all 3 in the right order.
We will start with the most simple one - the `ChatRoomNavbar`.
The navbar should show the picture of the chat we're currently at and its name,
along with a back button that will bring us back to the `ChatsListScreen`:

[{]: <helper> (diffStep 6.6 files="ChatNavbar" module="client")

#### Client Step 6.6: Implement ChatRoomScreen components

##### Added src&#x2F;components&#x2F;ChatRoomScreen&#x2F;ChatNavbar.tsx
```diff
@@ -0,0 +1,59 @@
+┊  ┊ 1┊import Button from '@material-ui/core/Button';
+┊  ┊ 2┊import Toolbar from '@material-ui/core/Toolbar';
+┊  ┊ 3┊import ArrowBackIcon from '@material-ui/icons/ArrowBack';
+┊  ┊ 4┊import React from 'react';
+┊  ┊ 5┊import { useCallback } from 'react';
+┊  ┊ 6┊import styled from 'styled-components';
+┊  ┊ 7┊import { History } from 'history';
+┊  ┊ 8┊import { ChatQueryResult } from './index';
+┊  ┊ 9┊
+┊  ┊10┊const Container = styled(Toolbar) `
+┊  ┊11┊  padding: 0;
+┊  ┊12┊  display: flex;
+┊  ┊13┊  flex-direction: row;
+┊  ┊14┊  background-color: var(--primary-bg);
+┊  ┊15┊  color: var(--primary-text);
+┊  ┊16┊` as typeof Toolbar;
+┊  ┊17┊
+┊  ┊18┊const BackButton = styled(Button) `
+┊  ┊19┊  svg {
+┊  ┊20┊    color: var(--primary-text);
+┊  ┊21┊  }
+┊  ┊22┊` as typeof Button;
+┊  ┊23┊
+┊  ┊24┊const Picture = styled.img `
+┊  ┊25┊  height: 40px;
+┊  ┊26┊  width: 40px;
+┊  ┊27┊  margin-top: 3px;
+┊  ┊28┊  margin-left: -22px;
+┊  ┊29┊  object-fit: cover;
+┊  ┊30┊  padding: 5px;
+┊  ┊31┊  border-radius: 50%;
+┊  ┊32┊`;
+┊  ┊33┊
+┊  ┊34┊const Name = styled.div `
+┊  ┊35┊  line-height: 56px;
+┊  ┊36┊`;
+┊  ┊37┊
+┊  ┊38┊interface ChatNavbarProps {
+┊  ┊39┊  history: History;
+┊  ┊40┊  chat: ChatQueryResult;
+┊  ┊41┊};
+┊  ┊42┊
+┊  ┊43┊const ChatNavbar: React.FC<ChatNavbarProps> = ({ chat, history }) => {
+┊  ┊44┊  const navBack = useCallback(() => {
+┊  ┊45┊    history.replace('/chats');
+┊  ┊46┊  }, [history]);
+┊  ┊47┊
+┊  ┊48┊  return (
+┊  ┊49┊    <Container>
+┊  ┊50┊      <BackButton onClick={navBack}>
+┊  ┊51┊        <ArrowBackIcon />
+┊  ┊52┊      </BackButton>
+┊  ┊53┊      <Picture src={chat.picture} />
+┊  ┊54┊      <Name>{chat.name}</Name>
+┊  ┊55┊    </Container>
+┊  ┊56┊  );
+┊  ┊57┊};
+┊  ┊58┊
+┊  ┊59┊export default ChatNavbar;🚫↵
```

[}]: #

Next, would be the `MesagesList` component, where we will see a scrollable list of all the messages of the active chat:

[{]: <helper> (diffStep 6.6 files="MessagesList" module="client")

#### Client Step 6.6: Implement ChatRoomScreen components

##### Added src&#x2F;components&#x2F;ChatRoomScreen&#x2F;MessagesList.tsx
```diff
@@ -0,0 +1,78 @@
+┊  ┊ 1┊import moment from 'moment';
+┊  ┊ 2┊import React from 'react';
+┊  ┊ 3┊import styled from 'styled-components';
+┊  ┊ 4┊import { ChatQueryMessage } from './index';
+┊  ┊ 5┊
+┊  ┊ 6┊const Container = styled.div`
+┊  ┊ 7┊  display: block;
+┊  ┊ 8┊  flex: 2;
+┊  ┊ 9┊  overflow-y: overlay;
+┊  ┊10┊  padding: 0 15px;
+┊  ┊11┊`;
+┊  ┊12┊
+┊  ┊13┊const MessageItem = styled.div `
+┊  ┊14┊  float: right;
+┊  ┊15┊  background-color: #dcf8c6;
+┊  ┊16┊  display: inline-block;
+┊  ┊17┊  position: relative;
+┊  ┊18┊  max-width: 100%;
+┊  ┊19┊  border-radius: 7px;
+┊  ┊20┊  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
+┊  ┊21┊  margin-top: 10px;
+┊  ┊22┊  margin-bottom: 10px;
+┊  ┊23┊  clear: both;
+┊  ┊24┊
+┊  ┊25┊  &::after {
+┊  ┊26┊    content: '';
+┊  ┊27┊    display: table;
+┊  ┊28┊    clear: both;
+┊  ┊29┊  }
+┊  ┊30┊
+┊  ┊31┊  &::before {
+┊  ┊32┊    background-image: url(/assets/message-mine.png);
+┊  ┊33┊    content: '';
+┊  ┊34┊    position: absolute;
+┊  ┊35┊    bottom: 3px;
+┊  ┊36┊    width: 12px;
+┊  ┊37┊    height: 19px;
+┊  ┊38┊    right: -11px;
+┊  ┊39┊    background-position: 50% 50%;
+┊  ┊40┊    background-repeat: no-repeat;
+┊  ┊41┊    background-size: contain;
+┊  ┊42┊  }
+┊  ┊43┊`;
+┊  ┊44┊
+┊  ┊45┊const Contents = styled.div `
+┊  ┊46┊  padding: 5px 7px;
+┊  ┊47┊  word-wrap: break-word;
+┊  ┊48┊
+┊  ┊49┊  &::after {
+┊  ┊50┊    content: ' \00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0\00a0';
+┊  ┊51┊    display: inline;
+┊  ┊52┊  }
+┊  ┊53┊`;
+┊  ┊54┊
+┊  ┊55┊const Timestamp = styled.div `
+┊  ┊56┊  position: absolute;
+┊  ┊57┊  bottom: 2px;
+┊  ┊58┊  right: 7px;
+┊  ┊59┊  color: gray;
+┊  ┊60┊  font-size: 12px;
+┊  ┊61┊`;
+┊  ┊62┊
+┊  ┊63┊interface MessagesListProps {
+┊  ┊64┊  messages: Array<ChatQueryMessage>;
+┊  ┊65┊}
+┊  ┊66┊
+┊  ┊67┊const MessagesList: React.FC<MessagesListProps> = ({ messages }) => (
+┊  ┊68┊  <Container>
+┊  ┊69┊    {messages.map((message: any) => (
+┊  ┊70┊      <MessageItem key={message.id}>
+┊  ┊71┊        <Contents>{message.content}</Contents>
+┊  ┊72┊        <Timestamp>{moment(message.createdAt).format('HH:mm')}</Timestamp>
+┊  ┊73┊      </MessageItem>
+┊  ┊74┊    ))}
+┊  ┊75┊  </Container>
+┊  ┊76┊);
+┊  ┊77┊
+┊  ┊78┊export default MessagesList;🚫↵
```

[}]: #

And finally, would be the `MessageInput` component which will trigger an event whenever we type and submit a new message:

[{]: <helper> (diffStep 6.6 files="MessageInput" module="client")

#### Client Step 6.6: Implement ChatRoomScreen components

##### Added src&#x2F;components&#x2F;ChatRoomScreen&#x2F;MessageInput.tsx
```diff
@@ -0,0 +1,60 @@
+┊  ┊ 1┊import Button from '@material-ui/core/Button';
+┊  ┊ 2┊import SendIcon from '@material-ui/icons/Send';
+┊  ┊ 3┊import React from 'react';
+┊  ┊ 4┊import styled from 'styled-components';
+┊  ┊ 5┊
+┊  ┊ 6┊const Container = styled.div`
+┊  ┊ 7┊  display: flex;
+┊  ┊ 8┊  height: 50px;
+┊  ┊ 9┊  padding: 5px;
+┊  ┊10┊  width: calc(100% - 10px);
+┊  ┊11┊`;
+┊  ┊12┊
+┊  ┊13┊const ActualInput = styled.input `
+┊  ┊14┊  width: calc(100% - 50px);
+┊  ┊15┊  border: none;
+┊  ┊16┊  border-radius: 999px;
+┊  ┊17┊  padding: 10px;
+┊  ┊18┊  padding-left: 20px;
+┊  ┊19┊  padding-right: 20px;
+┊  ┊20┊  font-size: 15px;
+┊  ┊21┊  outline: none;
+┊  ┊22┊  box-shadow: 0 1px silver;
+┊  ┊23┊  font-size: 18px;
+┊  ┊24┊  line-height: 45px;
+┊  ┊25┊`;
+┊  ┊26┊
+┊  ┊27┊const SendButton = styled(Button) `
+┊  ┊28┊  min-width: 50px !important;
+┊  ┊29┊  width: 50px !important;
+┊  ┊30┊  border-radius: 999px !important;
+┊  ┊31┊  background-color: var(--primary-bg) !important;
+┊  ┊32┊  margin: 0 5px !important;
+┊  ┊33┊  margin-right: 0 !important;
+┊  ┊34┊  color: white !important;
+┊  ┊35┊  padding-left: 20px !important;
+┊  ┊36┊
+┊  ┊37┊  svg {
+┊  ┊38┊    margin-left: -3px;
+┊  ┊39┊  }
+┊  ┊40┊` as typeof Button;
+┊  ┊41┊
+┊  ┊42┊const MessageInput: React.FC = () => {
+┊  ┊43┊
+┊  ┊44┊  return (
+┊  ┊45┊    <Container>
+┊  ┊46┊      <ActualInput
+┊  ┊47┊        type="text"
+┊  ┊48┊        placeholder="Type a message"
+┊  ┊49┊      />
+┊  ┊50┊      <SendButton
+┊  ┊51┊        variant="contained"
+┊  ┊52┊        color="primary"
+┊  ┊53┊      >
+┊  ┊54┊        <SendIcon />
+┊  ┊55┊      </SendButton>
+┊  ┊56┊    </Container>
+┊  ┊57┊  );
+┊  ┊58┊};
+┊  ┊59┊
+┊  ┊60┊export default MessageInput;🚫↵
```

[}]: #

Now that we have all 3 components, we will put them all together in the main `index.ts` file:

[{]: <helper> (diffStep 6.6 files="index" module="client")

#### Client Step 6.6: Implement ChatRoomScreen components

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -1,5 +1,17 @@
 ┊ 1┊ 1┊import React from 'react';
 ┊ 2┊ 2┊import { useMemo, useState } from 'react';
+┊  ┊ 3┊import styled from 'styled-components';
+┊  ┊ 4┊import ChatNavbar from './ChatNavbar';
+┊  ┊ 5┊import MessageInput from './MessageInput';
+┊  ┊ 6┊import MessagesList from './MessagesList';
+┊  ┊ 7┊import { History } from 'history';
+┊  ┊ 8┊
+┊  ┊ 9┊ const Container = styled.div `
+┊  ┊10┊  background: url(/assets/chat-background.jpg);
+┊  ┊11┊  display: flex;
+┊  ┊12┊  flex-flow: column;
+┊  ┊13┊  height: 100vh;
+┊  ┊14┊`;
 ┊ 3┊15┊
 ┊ 4┊16┊const getChatQuery = `
 ┊ 5┊17┊  query GetChat($chatId: ID!) {
```
```diff
@@ -18,15 +30,16 @@
 ┊18┊30┊
 ┊19┊31┊interface ChatRoomScreenParams {
 ┊20┊32┊  chatId: string
+┊  ┊33┊  history: History;
 ┊21┊34┊};
 ┊22┊35┊
-┊23┊  ┊interface ChatQueryMessage {
+┊  ┊36┊export interface ChatQueryMessage {
 ┊24┊37┊  id: string;
 ┊25┊38┊  content: string;
 ┊26┊39┊  createdAt: string;
 ┊27┊40┊};
 ┊28┊41┊
-┊29┊  ┊interface ChatQueryResult {
+┊  ┊42┊export interface ChatQueryResult {
 ┊30┊43┊  id: string;
 ┊31┊44┊  name: string;
 ┊32┊45┊  picture: string;
```
```diff
@@ -35,7 +48,7 @@
 ┊35┊48┊
 ┊36┊49┊type OptionalChatQueryResult = ChatQueryResult | null;
 ┊37┊50┊
-┊38┊  ┊const ChatRoomScreen: React.FC<ChatRoomScreenParams> = ({ chatId }) => {
+┊  ┊51┊const ChatRoomScreen: React.FC<ChatRoomScreenParams> = ({ history, chatId }) => {
 ┊39┊52┊  const [chat, setChat] = useState<OptionalChatQueryResult>(null);
 ┊40┊53┊
 ┊41┊54┊  useMemo(async () => {
```
```diff
@@ -56,18 +69,13 @@
 ┊56┊69┊  if (!chat) return null;
 ┊57┊70┊
 ┊58┊71┊  return (
-┊59┊  ┊    <div>
-┊60┊  ┊      <img src={chat.picture} alt="Profile"/>
-┊61┊  ┊      <div>{chat.name}</div>
-┊62┊  ┊      <ul>
-┊63┊  ┊        {chat.messages.map((message) =>
-┊64┊  ┊          <li key={message.id}>
-┊65┊  ┊            <div>{message.content}</div>
-┊66┊  ┊            <div>{message.createdAt}</div>
-┊67┊  ┊          </li>
-┊68┊  ┊        )}
-┊69┊  ┊      </ul>
-┊70┊  ┊    </div>
+┊  ┊72┊    <Container>
+┊  ┊73┊      <ChatNavbar chat={chat} history={history} />
+┊  ┊74┊      {chat.messages && (
+┊  ┊75┊        <MessagesList messages={chat.messages} />
+┊  ┊76┊      )}
+┊  ┊77┊      <MessageInput />
+┊  ┊78┊    </Container>
 ┊71┊79┊  );
 ┊72┊80┊};
```

[}]: #

The view is complete! However the `MessageInput` is not bound to our messages list.
We will use the triggered callback to update the chat state, whose changes should appear in the `MessagesList` component in the following render phase:

[{]: <helper> (diffStep 6.7 module="client")

#### Client Step 6.7: Define onSendMessage callback

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;MessageInput.tsx
```diff
@@ -2,6 +2,7 @@
 ┊2┊2┊import SendIcon from '@material-ui/icons/Send';
 ┊3┊3┊import React from 'react';
 ┊4┊4┊import styled from 'styled-components';
+┊ ┊5┊import { useState } from 'react';
 ┊5┊6┊
 ┊6┊7┊const Container = styled.div`
 ┊7┊8┊  display: flex;
```
```diff
@@ -39,17 +40,46 @@
 ┊39┊40┊  }
 ┊40┊41┊` as typeof Button;
 ┊41┊42┊
-┊42┊  ┊const MessageInput: React.FC = () => {
+┊  ┊43┊interface MessageInputProps {
+┊  ┊44┊  onSendMessage(content: string): any;
+┊  ┊45┊}
+┊  ┊46┊
+┊  ┊47┊const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
+┊  ┊48┊  const [message, setMessage] = useState("");
+┊  ┊49┊
+┊  ┊50┊  const onKeyPress = (e: any) => {
+┊  ┊51┊    if (e.charCode === 13) {
+┊  ┊52┊      submitMessage();
+┊  ┊53┊    }
+┊  ┊54┊  };
+┊  ┊55┊
+┊  ┊56┊  const onChange = ({ target }: any) => {
+┊  ┊57┊    setMessage(target.value);
+┊  ┊58┊  };
+┊  ┊59┊
+┊  ┊60┊  const submitMessage = () => {
+┊  ┊61┊    if (!message) return;
+┊  ┊62┊
+┊  ┊63┊    setMessage("");
+┊  ┊64┊
+┊  ┊65┊    if (typeof onSendMessage === "function") {
+┊  ┊66┊      onSendMessage(message);
+┊  ┊67┊    }
+┊  ┊68┊  };
 ┊43┊69┊
 ┊44┊70┊  return (
 ┊45┊71┊    <Container>
 ┊46┊72┊      <ActualInput
 ┊47┊73┊        type="text"
 ┊48┊74┊        placeholder="Type a message"
+┊  ┊75┊        value={message}
+┊  ┊76┊        onKeyPress={onKeyPress}
+┊  ┊77┊        onChange={onChange}
 ┊49┊78┊      />
 ┊50┊79┊      <SendButton
 ┊51┊80┊        variant="contained"
 ┊52┊81┊        color="primary"
+┊  ┊82┊        onClick={submitMessage}
 ┊53┊83┊      >
 ┊54┊84┊        <SendIcon />
 ┊55┊85┊      </SendButton>
```

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -1,5 +1,5 @@
 ┊1┊1┊import React from 'react';
-┊2┊ ┊import { useMemo, useState } from 'react';
+┊ ┊2┊import { useCallback, useMemo, useState } from 'react';
 ┊3┊3┊import styled from 'styled-components';
 ┊4┊4┊import ChatNavbar from './ChatNavbar';
 ┊5┊5┊import MessageInput from './MessageInput';
```
```diff
@@ -36,7 +36,7 @@
 ┊36┊36┊export interface ChatQueryMessage {
 ┊37┊37┊  id: string;
 ┊38┊38┊  content: string;
-┊39┊  ┊  createdAt: string;
+┊  ┊39┊  createdAt: number;
 ┊40┊40┊};
 ┊41┊41┊
 ┊42┊42┊export interface ChatQueryResult {
```
```diff
@@ -66,6 +66,23 @@
 ┊66┊66┊    setChat(chat);
 ┊67┊67┊  }, [chatId]);
 ┊68┊68┊
+┊  ┊69┊  const onSendMessage = useCallback((content: string) => {
+┊  ┊70┊    if (!chat) return null;
+┊  ┊71┊
+┊  ┊72┊    const message = {
+┊  ┊73┊      id: (chat.messages.length + 10).toString(),
+┊  ┊74┊      createdAt: Date.now(),
+┊  ┊75┊      content,
+┊  ┊76┊    };
+┊  ┊77┊
+┊  ┊78┊    console.log(chat.messages);
+┊  ┊79┊
+┊  ┊80┊     setChat({
+┊  ┊81┊      ...chat,
+┊  ┊82┊      messages: chat.messages.concat(message),
+┊  ┊83┊    });
+┊  ┊84┊  }, [chat]);
+┊  ┊85┊
 ┊69┊86┊  if (!chat) return null;
 ┊70┊87┊
 ┊71┊88┊  return (
```
```diff
@@ -74,7 +91,7 @@
 ┊74┊91┊      {chat.messages && (
 ┊75┊92┊        <MessagesList messages={chat.messages} />
 ┊76┊93┊      )}
-┊77┊  ┊      <MessageInput />
+┊  ┊94┊      <MessageInput onSendMessage={onSendMessage}/>
 ┊78┊95┊    </Container>
 ┊79┊96┊  );
 ┊80┊97┊};
```

[}]: #

This is how the entire flow should look like:

![flow-demo](https://user-images.githubusercontent.com/7648874/54739741-27012280-4bf4-11e9-97cb-c715482e2e70.gif)

An edge case that should be taken care of is when the messages list length in the view exceeds the length of the container,
in which case we will have to scroll down to the bottom of the view.
This way we can keep track of the most recent message.
We will use `ReactDOM` to retrieve the native HTML element of the container and change the position of the scroller whenever a messages was sent:

[{]: <helper> (diffStep 6.8 module="client")

#### Client Step 6.8: Reset scroller on message sent

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;MessagesList.tsx
```diff
@@ -1,5 +1,7 @@
 ┊1┊1┊import moment from 'moment';
 ┊2┊2┊import React from 'react';
+┊ ┊3┊import { useEffect, useRef } from 'react';
+┊ ┊4┊import ReactDOM from 'react-dom';
 ┊3┊5┊import styled from 'styled-components';
 ┊4┊6┊import { ChatQueryMessage } from './index';
 ┊5┊7┊
```
```diff
@@ -64,15 +66,26 @@
 ┊64┊66┊  messages: Array<ChatQueryMessage>;
 ┊65┊67┊}
 ┊66┊68┊
-┊67┊  ┊const MessagesList: React.FC<MessagesListProps> = ({ messages }) => (
-┊68┊  ┊  <Container>
-┊69┊  ┊    {messages.map((message: any) => (
-┊70┊  ┊      <MessageItem key={message.id}>
-┊71┊  ┊        <Contents>{message.content}</Contents>
-┊72┊  ┊        <Timestamp>{moment(message.createdAt).format('HH:mm')}</Timestamp>
-┊73┊  ┊      </MessageItem>
-┊74┊  ┊    ))}
-┊75┊  ┊  </Container>
-┊76┊  ┊);
+┊  ┊69┊const MessagesList: React.FC<MessagesListProps> = ({ messages }) => {
+┊  ┊70┊  const selfRef = useRef(null);
+┊  ┊71┊
+┊  ┊72┊  useEffect(() => {
+┊  ┊73┊    if (!selfRef.current) return;
+┊  ┊74┊
+┊  ┊75┊     const selfDOMNode = ReactDOM.findDOMNode(selfRef.current) as HTMLElement;
+┊  ┊76┊    selfDOMNode.scrollTop = Number.MAX_SAFE_INTEGER;
+┊  ┊77┊  }, [messages.length]);
+┊  ┊78┊
+┊  ┊79┊  return (
+┊  ┊80┊    <Container ref={selfRef}>
+┊  ┊81┊      {messages.map((message: any) => (
+┊  ┊82┊        <MessageItem key={message.id}>
+┊  ┊83┊          <Contents>{message.content}</Contents>
+┊  ┊84┊          <Timestamp>{moment(message.createdAt).format('HH:mm')}</Timestamp>
+┊  ┊85┊        </MessageItem>
+┊  ┊86┊      ))}
+┊  ┊87┊    </Container>
+┊  ┊88┊  )
+┊  ┊89┊};
 ┊77┊90┊
 ┊78┊91┊export default MessagesList;🚫↵
```

[}]: #

Before we wrap things up, we should also test our components.
Since the new components have a direct control over the app's history,
we should also find a way to simulate it in our tests.
Because `react-dom-router` uses the [`history`](https://www.npmjs.com/package/history) package under the hood,
that means that we can use that package to inject a custom history object directly into the tested components:

[{]: <helper> (diffStep 6.9 files="components" module="client")

#### Client Step 6.9: Test ChatRoomScreen child components

##### Added src&#x2F;components&#x2F;ChatRoomScreen&#x2F;ChatNavbar.test.tsx
```diff
@@ -0,0 +1,49 @@
+┊  ┊ 1┊import { createMemoryHistory } from 'history';
+┊  ┊ 2┊import React from 'react';
+┊  ┊ 3┊import { cleanup, render, fireEvent, wait } from 'react-testing-library';
+┊  ┊ 4┊import ChatNavbar from './ChatNavbar';
+┊  ┊ 5┊
+┊  ┊ 6┊describe('ChatNavbar', () => {
+┊  ┊ 7┊  afterEach(cleanup);
+┊  ┊ 8┊
+┊  ┊ 9┊  it('renders chat data', () => {
+┊  ┊10┊    const chat = {
+┊  ┊11┊      id: '1',
+┊  ┊12┊      name: 'Foo Bar',
+┊  ┊13┊      picture: 'https://localhost:4000/picture.jpg',
+┊  ┊14┊    };
+┊  ┊15┊
+┊  ┊16┊    {
+┊  ┊17┊      const { container, getByTestId } = render(<ChatNavbar chat={chat} />);
+┊  ┊18┊
+┊  ┊19┊      expect(getByTestId('chat-name')).toHaveTextContent('Foo Bar');
+┊  ┊20┊      expect(getByTestId('chat-picture')).toHaveAttribute('src', 'https://localhost:4000/picture.jpg');
+┊  ┊21┊    }
+┊  ┊22┊  })
+┊  ┊23┊
+┊  ┊24┊  it('goes back on arrow click', async () => {
+┊  ┊25┊    const chat = {
+┊  ┊26┊      id: '1',
+┊  ┊27┊      name: 'Foo Bar',
+┊  ┊28┊      picture: 'https://localhost:4000/picture.jpg',
+┊  ┊29┊    };
+┊  ┊30┊
+┊  ┊31┊    const history = createMemoryHistory();
+┊  ┊32┊
+┊  ┊33┊    history.push('/chats/1');
+┊  ┊34┊
+┊  ┊35┊    await wait(() =>
+┊  ┊36┊      expect(history.location.pathname).toEqual('/chats/1')
+┊  ┊37┊    )
+┊  ┊38┊
+┊  ┊39┊    {
+┊  ┊40┊      const { container, getByTestId } = render(<ChatNavbar chat={chat} history={history} />);
+┊  ┊41┊
+┊  ┊42┊      fireEvent.click(getByTestId('back-button'));
+┊  ┊43┊
+┊  ┊44┊      await wait(() =>
+┊  ┊45┊        expect(history.location.pathname).toEqual('/chats')
+┊  ┊46┊      );
+┊  ┊47┊    }
+┊  ┊48┊  });
+┊  ┊49┊});🚫↵
```

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;ChatNavbar.tsx
```diff
@@ -47,11 +47,11 @@
 ┊47┊47┊
 ┊48┊48┊  return (
 ┊49┊49┊    <Container>
-┊50┊  ┊      <BackButton onClick={navBack}>
+┊  ┊50┊      <BackButton data-testid="back-button" onClick={navBack}>
 ┊51┊51┊        <ArrowBackIcon />
 ┊52┊52┊      </BackButton>
-┊53┊  ┊      <Picture src={chat.picture} />
-┊54┊  ┊      <Name>{chat.name}</Name>
+┊  ┊53┊      <Picture data-testid="chat-picture" src={chat.picture} />
+┊  ┊54┊      <Name data-testid="chat-name">{chat.name}</Name>
 ┊55┊55┊    </Container>
 ┊56┊56┊  );
 ┊57┊57┊};
```

##### Added src&#x2F;components&#x2F;ChatRoomScreen&#x2F;MessageInput.test.tsx
```diff
@@ -0,0 +1,47 @@
+┊  ┊ 1┊import { createMemoryHistory } from 'history';
+┊  ┊ 2┊import React from 'react';
+┊  ┊ 3┊import { cleanup, render, fireEvent, wait, waitForElement } from 'react-testing-library';
+┊  ┊ 4┊import MessageInput from './MessageInput';
+┊  ┊ 5┊
+┊  ┊ 6┊describe('MessageInput;', () => {
+┊  ┊ 7┊  afterEach(cleanup);
+┊  ┊ 8┊
+┊  ┊ 9┊  it('triggers callback on send button click', async () => {
+┊  ┊10┊    const onSendMessage = jest.fn(() => {});
+┊  ┊11┊
+┊  ┊12┊    {
+┊  ┊13┊      const { container, getByTestId } = render(<MessageInput onSendMessage={onSendMessage} />);
+┊  ┊14┊      const messageInput = getByTestId('message-input');
+┊  ┊15┊      const sendButton = getByTestId('send-button');
+┊  ┊16┊
+┊  ┊17┊      fireEvent.change(messageInput, { target: { value: 'foo' } });
+┊  ┊18┊
+┊  ┊19┊      await waitForElement(() => messageInput);
+┊  ┊20┊
+┊  ┊21┊      fireEvent.click(sendButton);
+┊  ┊22┊
+┊  ┊23┊      await wait(() =>
+┊  ┊24┊        expect(onSendMessage.mock.calls.length).toBe(1)
+┊  ┊25┊      );
+┊  ┊26┊    }
+┊  ┊27┊  });
+┊  ┊28┊
+┊  ┊29┊  it('triggers callback on Enter press', async () => {
+┊  ┊30┊    const onSendMessage = jest.fn(() => {});
+┊  ┊31┊
+┊  ┊32┊    {
+┊  ┊33┊      const { container, getByTestId } = render(<MessageInput onSendMessage={onSendMessage} />);
+┊  ┊34┊      const messageInput = getByTestId('message-input');
+┊  ┊35┊
+┊  ┊36┊      fireEvent.change(messageInput, { target: { value: 'foo' } });
+┊  ┊37┊
+┊  ┊38┊      await waitForElement(() => messageInput);
+┊  ┊39┊
+┊  ┊40┊      fireEvent.keyPress(messageInput, { key: 'Enter', code: 13, charCode: 13 });
+┊  ┊41┊
+┊  ┊42┊      await wait(() =>
+┊  ┊43┊        expect(onSendMessage.mock.calls.length).toBe(1)
+┊  ┊44┊      );
+┊  ┊45┊    }
+┊  ┊46┊  });
+┊  ┊47┊});🚫↵
```

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;MessageInput.tsx
```diff
@@ -70,6 +70,7 @@
 ┊70┊70┊  return (
 ┊71┊71┊    <Container>
 ┊72┊72┊      <ActualInput
+┊  ┊73┊        data-testid="message-input"
 ┊73┊74┊        type="text"
 ┊74┊75┊        placeholder="Type a message"
 ┊75┊76┊        value={message}
```
```diff
@@ -77,6 +78,7 @@
 ┊77┊78┊        onChange={onChange}
 ┊78┊79┊      />
 ┊79┊80┊      <SendButton
+┊  ┊81┊        data-testid="send-button"
 ┊80┊82┊        variant="contained"
 ┊81┊83┊        color="primary"
 ┊82┊84┊        onClick={submitMessage}
```

##### Added src&#x2F;components&#x2F;ChatRoomScreen&#x2F;MessagesList.test.tsx
```diff
@@ -0,0 +1,37 @@
+┊  ┊ 1┊import { createMemoryHistory } from 'history';
+┊  ┊ 2┊import React from 'react';
+┊  ┊ 3┊import { cleanup, render, fireEvent, wait, getByTestId } from 'react-testing-library';
+┊  ┊ 4┊import MessagesList from './MessagesList';
+┊  ┊ 5┊
+┊  ┊ 6┊describe('MessagesList', () => {
+┊  ┊ 7┊  afterEach(cleanup);
+┊  ┊ 8┊
+┊  ┊ 9┊  it('renders messages data', () => {
+┊  ┊10┊    const messages = [
+┊  ┊11┊      {
+┊  ┊12┊        id: '1',
+┊  ┊13┊        content: 'foo',
+┊  ┊14┊        createdAt: new Date('14 Jun 2017 00:00:00 PDT').toUTCString(),
+┊  ┊15┊      },
+┊  ┊16┊      {
+┊  ┊17┊        id: '2',
+┊  ┊18┊        content: 'bar',
+┊  ┊19┊        createdAt: new Date('17 Jun 2017 00:01:00 PDT').toUTCString(),
+┊  ┊20┊      },
+┊  ┊21┊    ];
+┊  ┊22┊
+┊  ┊23┊    let message1, message2;
+┊  ┊24┊    {
+┊  ┊25┊      const { container, getAllByTestId, getByTestId } = render(<MessagesList messages={messages} />);
+┊  ┊26┊      const match = getAllByTestId('message-item');
+┊  ┊27┊      message1 = match[0];
+┊  ┊28┊      message2 = match[1];
+┊  ┊29┊    }
+┊  ┊30┊
+┊  ┊31┊    expect(getByTestId(message1, 'message-content')).toHaveTextContent('foo');
+┊  ┊32┊    expect(getByTestId(message1, 'message-date')).toHaveTextContent('10:00');
+┊  ┊33┊
+┊  ┊34┊    expect(getByTestId(message2, 'message-content')).toHaveTextContent('bar');
+┊  ┊35┊    expect(getByTestId(message2, 'message-date')).toHaveTextContent('10:01');
+┊  ┊36┊  });
+┊  ┊37┊});🚫↵
```

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;MessagesList.tsx
```diff
@@ -79,9 +79,9 @@
 ┊79┊79┊  return (
 ┊80┊80┊    <Container ref={selfRef}>
 ┊81┊81┊      {messages.map((message: any) => (
-┊82┊  ┊        <MessageItem key={message.id}>
-┊83┊  ┊          <Contents>{message.content}</Contents>
-┊84┊  ┊          <Timestamp>{moment(message.createdAt).format('HH:mm')}</Timestamp>
+┊  ┊82┊        <MessageItem data-testid="message-item" key={message.id}>
+┊  ┊83┊          <Contents data-testid="message-content">{message.content}</Contents>
+┊  ┊84┊          <Timestamp data-testid="message-date">{moment(message.createdAt).format('HH:mm')}</Timestamp>
 ┊85┊85┊        </MessageItem>
 ┊86┊86┊      ))}
 ┊87┊87┊    </Container>
```

[}]: #

There are many things which are incomplete in the current implementation. The functionality exists in the UI, but no messages are really being sent and stored in the database. In the next chapters we will learn how to:



*   Cache query results with Apollo-Client.
*   Send messages with GraphQL mutations

--------
TODO: Add this to router chapter - https://www.pluralsight.com/guides/react-router-typescript
And this - https://stackoverflow.com/questions/49342390/typescript-how-to-add-type-check-for-history-object-in-react

TODO: https://medium.com/@jrwebdev/react-higher-order-component-patterns-in-typescript-42278f7590fb

TODO: https://www.cypress.io/blog/2019/05/13/code-create-react-app-v3-and-its-cypress-tests-using-typescript/#

TODO: Schema says there’s always an array with messages, is it really true? Is newly created chat resolves an empty array, null will throw an error?

TODO: Same thing with `chats: [Chat!]!`, do we always return an array here?

TODO: _root and type all resolvers

TODO: How to import schema together with jest, should I changed from ts-jest?

TODO: remove all that part including the file in the commit

TODO: Add all the new files and changes on 6.6

TODO: Add all the new files and changes on 6.7

[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@0.1.0/.tortilla/manuals/views/step5.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@0.1.0/.tortilla/manuals/views/step7.md) |
|:--------------------------------|--------------------------------:|

[}]: #
