# Step 7: Caching with Apollo-Client

[//]: # (head-end)


In the previous step we've implemented a `ChatRoomScreen` where we were able to view each chat's messages list by clicking on a chat item from the main screen.
It all looks functional, however, there's a significant optimization issue - each time we navigate into a `ChatRoomScreen`,
we need to re-fetch the data related to the target chat.

The solution for that would be [caching](https://en.wikipedia.org/wiki/Cache_(computing)) the fetch result,
so it can be re-used once we re-enter a screen that we've visited before.
For now things are fairly simple so the caching mechanism can be implemented manually,
but things are gonna get tougher when we add more queries or things like message sending and profile updating to the mix,
so it's not gonna be an easy task.

Luckily, in the Apollo team they've invented a solution that works right out of the box and integrates perfectly with Apollo-GraphQL server - [Apollo-GraphQL client](https://www.apollographql.com/docs/link/#apollo-client).


![caching](https://user-images.githubusercontent.com/7648874/54871150-f505e100-4dea-11e9-9e2d-439fbf3eaebe.png)



Apollo-Client is a wrap around our GraphQL endpoint which essentially uses HTTP requests (and further on [web-sockets](https://en.wikipedia.org/wiki/WebSocket), but we will get there), something that we've implemented manually so far.
Not only it can be used to fetch data, but it will also cache the result of the query so it can be seamlessly re-used when we request the same data.
This means that we will need to setup an Apollo-Client and replace all our `fetch()` calls with `client.query()` call.
More about Apollo-Client's API further in this tutorial, but let's start configuring it.
First we will install few essential NPM packages:

    $ yarn add apollo-client apollo-cache-inmemory apollo-link apollo-link-http



*   [`apollo-client`](https://www.npmjs.com/package/apollo-client) - Apollo-Client's core package, as we explained earlier.
*   [`apollo-cache-inmemory`](https://www.npmjs.com/package/apollo-cache-inmemory) - The data store that will be used to cache the results.
*   [`apollo-link-http`](https://www.npmjs.com/package/apollo-link-http) - Get GraphQL results over a network using HTTP fetch.

We will create a new file in the `src` directory called `client.ts` and inside we will export the client:

[{]: <helper> (diffStep 7.1 files="client" module="client")

#### Client Step 7.1: Add Apollo client

##### Added src&#x2F;client.ts
```diff
@@ -0,0 +1,16 @@
+┊  ┊ 1┊import { InMemoryCache } from 'apollo-cache-inmemory';
+┊  ┊ 2┊import { ApolloClient } from 'apollo-client';
+┊  ┊ 3┊import { HttpLink } from 'apollo-link-http';
+┊  ┊ 4┊
+┊  ┊ 5┊const httpUri = process.env.REACT_APP_SERVER_URL + '/graphql';
+┊  ┊ 6┊
+┊  ┊ 7┊const httpLink = new HttpLink({
+┊  ┊ 8┊  uri: httpUri,
+┊  ┊ 9┊});
+┊  ┊10┊
+┊  ┊11┊const inMemoryCache = new InMemoryCache();
+┊  ┊12┊
+┊  ┊13┊export default new ApolloClient({
+┊  ┊14┊  link: httpLink,
+┊  ┊15┊  cache: inMemoryCache,
+┊  ┊16┊});
```

[}]: #

Although the client can be used directly and integrated into any UI framework, it would be the most comfortable to use a wrap around it which is suitable for React.
For that we will use a package called [`react-apollo-hooks`](https://www.npmjs.com/package/react-apollo-hooks) which includes a set of [React hooks](https://reactjs.org/docs/hooks-intro.html) that can connect between our Apollo-Client and target React.Component:

    $ yarn add react-apollo-hooks graphql-tag graphql

With `react-apollo-hooks` we can use the `useQuery()` hook to fetch data from our GraphQL API.
The `graphql-tag` package is used to parse the GraphQL string to an [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree), something which is required when using Apollo Client. Example:


```
import gql from 'graphql-tag';
import { useQuery } from 'react-apollo-hooks';

const GET_DOGS = gql`
  {
    dogs {
      id
      breed
    }
  }
`;

const Dogs = () => {
  const { data, error, loading } = useQuery(GET_DOGS);
  if (loading) {
    return <div>Loading...</div>;
  };
  if (error) {
    return <div>Error! {error.message}</div>;
  };

  return (
    <ul>
      {data.dogs.map(dog => (
        <li key={dog.id}>{dog.breed}</li>
      ))}
    </ul>
  );
};
```


The package requires a small setup so that imported hooks can use our Apollo-Client:

[{]: <helper> (diffStep 7.2 files="index" module="client")

#### Client Step 7.2: Provide Apollo client

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -75,9 +75,7 @@
 ┊75┊75┊      content,
 ┊76┊76┊    };
 ┊77┊77┊
-┊78┊  ┊    console.log(chat.messages);
-┊79┊  ┊
-┊80┊  ┊     setChat({
+┊  ┊78┊    setChat({
 ┊81┊79┊      ...chat,
 ┊82┊80┊      messages: chat.messages.concat(message),
 ┊83┊81┊    });
```

##### Changed src&#x2F;index.tsx
```diff
@@ -1,8 +1,10 @@
 ┊ 1┊ 1┊import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
 ┊ 2┊ 2┊import React from 'react';
 ┊ 3┊ 3┊import ReactDOM from 'react-dom';
+┊  ┊ 4┊import { ApolloProvider } from 'react-apollo-hooks';
 ┊ 4┊ 5┊import './index.css';
 ┊ 5┊ 6┊import App from './App';
+┊  ┊ 7┊import client from './client';
 ┊ 6┊ 8┊import * as serviceWorker from './serviceWorker';
 ┊ 7┊ 9┊
 ┊ 8┊10┊const theme = createMuiTheme({
```
```diff
@@ -17,7 +19,9 @@
 ┊17┊19┊
 ┊18┊20┊ReactDOM.render(
 ┊19┊21┊  <MuiThemeProvider theme={theme}>
-┊20┊  ┊    <App />
+┊  ┊22┊    <ApolloProvider client={client}>
+┊  ┊23┊      <App />
+┊  ┊24┊    </ApolloProvider>
 ┊21┊25┊  </MuiThemeProvider>
 ┊22┊26┊, document.getElementById('root'));
```

[}]: #

The code above uses the [Context/Provider](https://reactjs.org/docs/context.html) API, thus the client is now known globally.
Now that we can use the `useQuery()` hook, there's no need to use the native Fetch API anymore.
Let's replace all our Fetch API call instances with a React hook:

[{]: <helper> (diffStep 7.3 files="components" module="client")

#### Client Step 7.3: Replace fetch() calls with Apollo useQuery()

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -1,5 +1,7 @@
+┊ ┊1┊import gql from 'graphql-tag';
 ┊1┊2┊import React from 'react';
-┊2┊ ┊import { useCallback, useMemo, useState } from 'react';
+┊ ┊3┊import { useCallback } from 'react';
+┊ ┊4┊import { useApolloClient, useQuery } from 'react-apollo-hooks';
 ┊3┊5┊import styled from 'styled-components';
 ┊4┊6┊import ChatNavbar from './ChatNavbar';
 ┊5┊7┊import MessageInput from './MessageInput';
```
```diff
@@ -13,7 +15,7 @@
 ┊13┊15┊  height: 100vh;
 ┊14┊16┊`;
 ┊15┊17┊
-┊16┊  ┊const getChatQuery = `
+┊  ┊18┊const getChatQuery = gql`
 ┊17┊19┊  query GetChat($chatId: ID!) {
 ┊18┊20┊    chat(chatId: $chatId) {
 ┊19┊21┊      id
```
```diff
@@ -47,24 +49,12 @@
 ┊47┊49┊};
 ┊48┊50┊
 ┊49┊51┊type OptionalChatQueryResult = ChatQueryResult | null;
-┊50┊  ┊
+┊  ┊52┊
 ┊51┊53┊const ChatRoomScreen: React.FC<ChatRoomScreenParams> = ({ history, chatId }) => {
-┊52┊  ┊  const [chat, setChat] = useState<OptionalChatQueryResult>(null);
-┊53┊  ┊
-┊54┊  ┊  useMemo(async () => {
-┊55┊  ┊    const body = await fetch(`${process.env.REACT_APP_SERVER_URL}/graphql`, {
-┊56┊  ┊      method: 'POST',
-┊57┊  ┊      headers: {
-┊58┊  ┊        'Content-Type': 'application/json',
-┊59┊  ┊      },
-┊60┊  ┊      body: JSON.stringify({
-┊61┊  ┊        query: getChatQuery,
-┊62┊  ┊        variables: { chatId },
-┊63┊  ┊      }),
-┊64┊  ┊    });
-┊65┊  ┊    const { data: { chat } } = await body.json();
-┊66┊  ┊    setChat(chat);
-┊67┊  ┊  }, [chatId]);
+┊  ┊54┊  const client = useApolloClient();
+┊  ┊55┊  const { data: { chat } } = useQuery<any>(getChatQuery, {
+┊  ┊56┊    variables: { chatId }
+┊  ┊57┊  });
 ┊68┊58┊
 ┊69┊59┊  const onSendMessage = useCallback((content: string) => {
 ┊70┊60┊    if (!chat) return null;
```
```diff
@@ -73,13 +63,20 @@
 ┊73┊63┊      id: (chat.messages.length + 10).toString(),
 ┊74┊64┊      createdAt: Date.now(),
 ┊75┊65┊      content,
+┊  ┊66┊      __typename: "Chat",
 ┊76┊67┊    };
 ┊77┊68┊
-┊78┊  ┊    setChat({
-┊79┊  ┊      ...chat,
-┊80┊  ┊      messages: chat.messages.concat(message),
-┊81┊  ┊    });
-┊82┊  ┊  }, [chat]);
+┊  ┊69┊    client.writeQuery({
+┊  ┊70┊      query: getChatQuery,
+┊  ┊71┊      variables: { chatId },
+┊  ┊72┊      data: {
+┊  ┊73┊        chat: {
+┊  ┊74┊          ...chat,
+┊  ┊75┊          messages: chat.messages.concat(message),
+┊  ┊76┊        },
+┊  ┊77┊      },
+┊  ┊78┊    })
+┊  ┊79┊  }, [chat, chatId, client]);
 ┊83┊80┊
 ┊84┊81┊  if (!chat) return null;
 ┊85┊82┊
```

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.tsx
```diff
@@ -2,8 +2,10 @@
 ┊ 2┊ 2┊import moment from 'moment';
 ┊ 3┊ 3┊import { List, ListItem } from '@material-ui/core';
 ┊ 4┊ 4┊import styled from 'styled-components';
-┊ 5┊  ┊import { useCallback, useState, useMemo } from 'react';
+┊  ┊ 5┊import { useCallback } from 'react';
 ┊ 6┊ 6┊import { History } from 'history';
+┊  ┊ 7┊import gql from 'graphql-tag';
+┊  ┊ 8┊import { useQuery } from 'react-apollo-hooks';
 ┊ 7┊ 9┊
 ┊ 8┊10┊const Container = styled.div `
 ┊ 9┊11┊  height: calc(100% - 56px);
```
```diff
@@ -57,7 +59,7 @@
 ┊57┊59┊  font-size: 13px;
 ┊58┊60┊`;
 ┊59┊61┊
-┊60┊  ┊const getChatsQuery = `
+┊  ┊62┊const getChatsQuery = gql`
 ┊61┊63┊  query GetChats {
 ┊62┊64┊    chats {
 ┊63┊65┊      id
```
```diff
@@ -77,19 +79,7 @@
 ┊77┊79┊};
 ┊78┊80┊
 ┊79┊81┊const ChatsList: React.FC<ChatsListProps> = ({ history }) => {
-┊80┊  ┊  const [chats, setChats] = useState<any[]>([]);
-┊81┊  ┊
-┊82┊  ┊  useMemo(async () => {
-┊83┊  ┊    const body = await fetch(`${process.env.REACT_APP_SERVER_URL}/graphql`, {
-┊84┊  ┊      method: 'POST',
-┊85┊  ┊      headers: {
-┊86┊  ┊        'Content-Type': 'application/json',
-┊87┊  ┊      },
-┊88┊  ┊      body: JSON.stringify({ query: getChatsQuery }),
-┊89┊  ┊    });
-┊90┊  ┊    const { data: { chats } } = await body.json();
-┊91┊  ┊    setChats(chats);
-┊92┊  ┊  }, []);
+┊  ┊82┊  const { data: { chats = [] } } = useQuery<any>(getChatsQuery);
 ┊93┊83┊
 ┊94┊84┊  const navToChat = useCallback((chat) => {
 ┊95┊85┊    history.push(`chats/${chat.id}`)
```
```diff
@@ -98,7 +88,7 @@
 ┊ 98┊ 88┊  return (
 ┊ 99┊ 89┊    <Container>
 ┊100┊ 90┊      <StyledList>
-┊101┊   ┊        {chats.map((chat) => (
+┊   ┊ 91┊        {chats.map((chat: any) => (
 ┊102┊ 92┊          <StyledListItem key={chat.id} data-testid="chat" button onClick={navToChat.bind(null, chat)}>
 ┊103┊ 93┊            <ChatPicture data-testid="picture" src={chat.picture} alt="Profile"/>
 ┊104┊ 94┊            <ChatInfo>
```

[}]: #

You can see that we've fetched the query using Apollo client, and we removed the `setChat` call because Apollo will know automatically to place the results in the cache.

And you can see we can also work directly with the cache.

On the `OnSendMessage` function we take the new message and push it to Apollo Client's cache.

Now if we'll scroll to another screen and come back, the messages will still be displayed there.

You can see that we've added the `__typename` when we push a new chat to the cache.
That's how Apollo Client knows where to place the results.

The replacement is finished. Note that we removed the usage of `useMemo()` - because Apollo has an internal cache mechanism, there's no need to memoize the result anymore.
We also used the [`writeQuery()`](https://www.apollographql.com/docs/react/features/caching.html#writequery-and-writefragment) method to edit the stored result in the cache, so in the next render phase we would have an updated chat with the newly added message.

We shouldn't see any change at all in the view and the response time, since we're running it locally, but if we will take a look at the `network` tab in the browser's dev-tools we should notice the differences:

**before**

![fetch](https://user-images.githubusercontent.com/7648874/54871305-e5879780-4dec-11e9-87bb-3279e9e18342.png)

**after**

![apollo](https://user-images.githubusercontent.com/7648874/54871319-1bc51700-4ded-11e9-9001-d5518bedf9ad.png)

> Above: ChatsListScreen -> ChatRoomScreen -> ChatsListScreen -> ChatRoomScreen

This test is obviously very rough, but the deviation is so big that you don't need any accuracy to emphasize the difference.
The blue stripes represents the requests made and the time they took. Before we had about 6 request phases, while after we had only 3 of them.

Since we don't use the Fetch API anymore, we will also need to update our tests.
Right now we mock the response from the fetch API, but a more appropriate way would be creating a fake Apollo Client where we will be able to mock the results.
For that we will install a package called [`apollo-link-mock`](https://www.npmjs.com/package/apollo-link-mock):

    $ yarn add --dev apollo-link-mock

And we will create a `test-helpers.ts` file under the `src` directory that will contain the utility function for creating a fake Apollo Client:

[{]: <helper> (diffStep 7.4 files="test-helpers" module="client")

#### Client Step 7.4: Mock Apollo requests in tests

##### Added src&#x2F;test-helpers.ts
```diff
@@ -0,0 +1,10 @@
+┊  ┊ 1┊import { InMemoryCache } from 'apollo-cache-inmemory';
+┊  ┊ 2┊import { ApolloClient } from 'apollo-client';
+┊  ┊ 3┊import { MockLink } from 'apollo-link-mock';
+┊  ┊ 4┊
+┊  ┊ 5┊export const mockApolloClient = (mocks: any) => {
+┊  ┊ 6┊  return new ApolloClient({
+┊  ┊ 7┊    cache: new InMemoryCache(),
+┊  ┊ 8┊    link: new MockLink(mocks),
+┊  ┊ 9┊  });
+┊  ┊10┊};
```

[}]: #

The fake client accepts an array of mocks where each mock object will have a `request` key that will contain details about the request and a `result` key which will contain the mocked result.
You should get a better understanding of how it works now that we will replace the fake Fetch calls with fake Apollo Clients:

[{]: <helper> (diffStep 7.4 files="src/components" module="client")

#### Client Step 7.4: Mock Apollo requests in tests

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.test.tsx
```diff
@@ -1,8 +1,10 @@
 ┊ 1┊ 1┊import React from 'react';
+┊  ┊ 2┊import { ApolloProvider } from 'react-apollo-hooks';
 ┊ 2┊ 3┊import ReactDOM from 'react-dom';
 ┊ 3┊ 4┊import { cleanup, render, fireEvent, wait, waitForDomChange } from 'react-testing-library';
-┊ 4┊  ┊import ChatsList from './ChatsList';
 ┊ 5┊ 5┊import { createBrowserHistory } from 'history';
+┊  ┊ 6┊import { mockApolloClient } from '../../test-helpers';
+┊  ┊ 7┊import ChatsList, { getChatsQuery } from './ChatsList';
 ┊ 6┊ 8┊
 ┊ 7┊ 9┊describe('ChatsList', () => {
 ┊ 8┊10┊  afterEach(() => {
```
```diff
@@ -11,25 +13,36 @@
 ┊11┊13┊  });
 ┊12┊14┊
 ┊13┊15┊  it('renders fetched chats data', async () => {
-┊14┊  ┊    fetch.mockResponseOnce(JSON.stringify({
-┊15┊  ┊      data: {
-┊16┊  ┊        chats: [
-┊17┊  ┊          {
-┊18┊  ┊            id: 1,
-┊19┊  ┊            name: 'Foo Bar',
-┊20┊  ┊            picture: 'https://localhost:4000/picture.jpg',
-┊21┊  ┊            lastMessage: {
-┊22┊  ┊              id: 1,
-┊23┊  ┊              content: 'Hello',
-┊24┊  ┊              createdAt: new Date('14 Jun 2017 00:00:00 PDT').toUTCString(),
-┊25┊  ┊            },
+┊  ┊16┊    const client = mockApolloClient([
+┊  ┊17┊      {
+┊  ┊18┊        request: { query: getChatsQuery },
+┊  ┊19┊        result: {
+┊  ┊20┊          data: {
+┊  ┊21┊            chats: [
+┊  ┊22┊              {
+┊  ┊23┊                __typename: 'Chat',
+┊  ┊24┊                id: 1,
+┊  ┊25┊                name: 'Foo Bar',
+┊  ┊26┊                picture: 'https://localhost:4000/picture.jpg',
+┊  ┊27┊                lastMessage: {
+┊  ┊28┊                  __typename: 'Message',
+┊  ┊29┊                  id: 1,
+┊  ┊30┊                  content: 'Hello',
+┊  ┊31┊                  createdAt: new Date('14 Jun 2017 00:00:00 PDT').toUTCString(),
+┊  ┊32┊                },
+┊  ┊33┊              },
+┊  ┊34┊            ],
 ┊26┊35┊          },
-┊27┊  ┊        ],
+┊  ┊36┊        },
 ┊28┊37┊      },
-┊29┊  ┊    }));
+┊  ┊38┊    ]);
 ┊30┊39┊
 ┊31┊40┊    {
-┊32┊  ┊      const { container, getByTestId } = render(<ChatsList />);
+┊  ┊41┊      const { container, getByTestId } = render(
+┊  ┊42┊        <ApolloProvider client={client}>
+┊  ┊43┊          <ChatsList />
+┊  ┊44┊        </ApolloProvider>
+┊  ┊45┊      );
 ┊33┊46┊
 ┊34┊47┊      await waitForDomChange({ container });
 ┊35┊48┊
```
```diff
@@ -41,27 +54,38 @@
 ┊41┊54┊  });
 ┊42┊55┊
 ┊43┊56┊  it('should navigate to the target chat room on chat item click', async () => {
-┊44┊  ┊    fetch.mockResponseOnce(JSON.stringify({
-┊45┊  ┊      data: {
-┊46┊  ┊        chats: [
-┊47┊  ┊          {
-┊48┊  ┊            id: 1,
-┊49┊  ┊            name: 'Foo Bar',
-┊50┊  ┊            picture: 'https://localhost:4000/picture.jpg',
-┊51┊  ┊            lastMessage: {
-┊52┊  ┊              id: 1,
-┊53┊  ┊              content: 'Hello',
-┊54┊  ┊              createdAt: new Date(0),
-┊55┊  ┊            },
+┊  ┊57┊    const client = mockApolloClient([
+┊  ┊58┊      {
+┊  ┊59┊        request: { query: getChatsQuery },
+┊  ┊60┊        result: {
+┊  ┊61┊          data: {
+┊  ┊62┊            chats: [
+┊  ┊63┊              {
+┊  ┊64┊                __typename: 'Chat',
+┊  ┊65┊                id: 1,
+┊  ┊66┊                name: 'Foo Bar',
+┊  ┊67┊                picture: 'https://localhost:4000/picture.jpg',
+┊  ┊68┊                lastMessage: {
+┊  ┊69┊                  __typename: 'Message',
+┊  ┊70┊                  id: 1,
+┊  ┊71┊                  content: 'Hello',
+┊  ┊72┊                  createdAt: new Date(0),
+┊  ┊73┊                },
+┊  ┊74┊              },
+┊  ┊75┊            ],
 ┊56┊76┊          },
-┊57┊  ┊        ],
+┊  ┊77┊        },
 ┊58┊78┊      },
-┊59┊  ┊    }));
+┊  ┊79┊    ]);
 ┊60┊80┊
 ┊61┊81┊     const history = createBrowserHistory();
 ┊62┊82┊
-┊63┊  ┊     {
-┊64┊  ┊      const { container, getByTestId } = render(<ChatsList history={history} />);
+┊  ┊83┊    {
+┊  ┊84┊      const { container, getByTestId } = render(
+┊  ┊85┊        <ApolloProvider client={client}>
+┊  ┊86┊          <ChatsList history={history} />
+┊  ┊87┊        </ApolloProvider>
+┊  ┊88┊      );
 ┊65┊89┊
 ┊66┊90┊       await waitForDomChange({ container });
 ┊67┊91┊
```

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.tsx
```diff
@@ -59,7 +59,7 @@
 ┊59┊59┊  font-size: 13px;
 ┊60┊60┊`;
 ┊61┊61┊
-┊62┊  ┊const getChatsQuery = gql`
+┊  ┊62┊export const getChatsQuery = gql`
 ┊63┊63┊  query GetChats {
 ┊64┊64┊    chats {
 ┊65┊65┊      id
```

[}]: #

We are telling Apollo mock to give a certain result each time it gets a specific query.

Note how we used the `ApolloProvider` component to provide the target component with the fake Apollo Client.
Like so, any other component which uses Apollo Client should be wrapped with an ApolloProvider when rendering it, otherwise it will not function as intended:

[{]: <helper> (diffStep 7.4 files="src/App" module="client")

#### Client Step 7.4: Mock Apollo requests in tests

##### Changed src&#x2F;App.test.tsx
```diff
@@ -1,9 +1,17 @@
 ┊ 1┊ 1┊import React from 'react';
+┊  ┊ 2┊import { ApolloProvider } from 'react-apollo-hooks';
 ┊ 2┊ 3┊import ReactDOM from 'react-dom';
 ┊ 3┊ 4┊import App from './App';
+┊  ┊ 5┊import { mockApolloClient } from './test-helpers';
 ┊ 4┊ 6┊
 ┊ 5┊ 7┊it('renders without crashing', () => {
+┊  ┊ 8┊  const client = mockApolloClient();
 ┊ 6┊ 9┊  const div = document.createElement('div');
-┊ 7┊  ┊  ReactDOM.render(<App />, div);
+┊  ┊10┊
+┊  ┊11┊  ReactDOM.render(
+┊  ┊12┊    <ApolloProvider client={client}>
+┊  ┊13┊      <App />
+┊  ┊14┊    </ApolloProvider>
+┊  ┊15┊  , div);
 ┊ 8┊16┊  ReactDOM.unmountComponentAtNode(div);
 ┊ 9┊17┊});
```

[}]: #

That's it for this chapter. There's one thing missing to make our `ChatRoomScreen` functional and that would be actually sending a message to the backend and updating the DB. In the next chapter we will learn how to do exactly that with our new Apollo-Client.


--------------------

TODO: Change the whole intro.

TODO: I think we might want to explain the cache in more details
how it’s normalized
how some parts update automatically and some do not
what’s the smallest unit stored in the cache
and other stuff
this might help later on with optimistic responses and mutations in general

TODO: Remove all label code

TODO: Create a drawing of the cache.
TODO: Change typename from Chat to Message

TODO: Explain a bit about Apollo links.

[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@0.1.0/.tortilla/manuals/views/step6.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@0.1.0/.tortilla/manuals/views/step8.md) |
|:--------------------------------|--------------------------------:|

[}]: #
