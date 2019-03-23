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

#### [__Client__ Step 7.1: Add Apollo client](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/d8d690a)

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

#### [__Client__ Step 7.2: Provide Apollo client](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/78ffcef)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -81,8 +81,6 @@
 ┊81┊81┊        content,
 ┊82┊82┊      };
 ┊83┊83┊
-┊84┊  ┊      console.log(chat.messages);
-┊85┊  ┊
 ┊86┊84┊      setChat({
 ┊87┊85┊        ...chat,
 ┊88┊86┊        messages: chat.messages.concat(message),
```

##### Changed src&#x2F;index.tsx
```diff
@@ -1,8 +1,10 @@
 ┊ 1┊ 1┊import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
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
@@ -14,7 +16,9 @@
 ┊14┊16┊
 ┊15┊17┊ReactDOM.render(
 ┊16┊18┊  <MuiThemeProvider theme={theme}>
-┊17┊  ┊    <App />
+┊  ┊19┊    <ApolloProvider client={client}>
+┊  ┊20┊      <App />
+┊  ┊21┊    </ApolloProvider>
 ┊18┊22┊  </MuiThemeProvider>,
 ┊19┊23┊  document.getElementById('root')
 ┊20┊24┊);
```

[}]: #

The code above uses the [Context/Provider](https://reactjs.org/docs/context.html) API, thus the client is now known globally.
Now that we can use the `useQuery()` hook, there's no need to use the native Fetch API anymore.
Let's replace all our Fetch API call instances with a React hook:

[{]: <helper> (diffStep 7.3 files="components" module="client")

#### [__Client__ Step 7.3: Replace fetch() calls with Apollo useQuery()](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/6616370)

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
@@ -52,24 +54,12 @@
 ┊52┊54┊  history,
 ┊53┊55┊  chatId,
 ┊54┊56┊}) => {
-┊55┊  ┊  const [chat, setChat] = useState<OptionalChatQueryResult>(null);
-┊56┊  ┊
-┊57┊  ┊  useMemo(async () => {
-┊58┊  ┊    const body = await fetch(`${process.env.REACT_APP_SERVER_URL}/graphql`, {
-┊59┊  ┊      method: 'POST',
-┊60┊  ┊      headers: {
-┊61┊  ┊        'Content-Type': 'application/json',
-┊62┊  ┊      },
-┊63┊  ┊      body: JSON.stringify({
-┊64┊  ┊        query: getChatQuery,
-┊65┊  ┊        variables: { chatId },
-┊66┊  ┊      }),
-┊67┊  ┊    });
-┊68┊  ┊    const {
-┊69┊  ┊      data: { chat },
-┊70┊  ┊    } = await body.json();
-┊71┊  ┊    setChat(chat);
-┊72┊  ┊  }, [chatId]);
+┊  ┊57┊  const client = useApolloClient();
+┊  ┊58┊  const {
+┊  ┊59┊    data: { chat },
+┊  ┊60┊  } = useQuery<any>(getChatQuery, {
+┊  ┊61┊    variables: { chatId },
+┊  ┊62┊  });
 ┊73┊63┊
 ┊74┊64┊  const onSendMessage = useCallback(
 ┊75┊65┊    (content: string) => {
```
```diff
@@ -79,14 +69,21 @@
 ┊79┊69┊        id: (chat.messages.length + 10).toString(),
 ┊80┊70┊        createdAt: Date.now(),
 ┊81┊71┊        content,
+┊  ┊72┊        __typename: 'Chat',
 ┊82┊73┊      };
 ┊83┊74┊
-┊84┊  ┊      setChat({
-┊85┊  ┊        ...chat,
-┊86┊  ┊        messages: chat.messages.concat(message),
+┊  ┊75┊      client.writeQuery({
+┊  ┊76┊        query: getChatQuery,
+┊  ┊77┊        variables: { chatId },
+┊  ┊78┊        data: {
+┊  ┊79┊          chat: {
+┊  ┊80┊            ...chat,
+┊  ┊81┊            messages: chat.messages.concat(message),
+┊  ┊82┊          },
+┊  ┊83┊        },
 ┊87┊84┊      });
 ┊88┊85┊    },
-┊89┊  ┊    [chat]
+┊  ┊86┊    [chat, chatId, client]
 ┊90┊87┊  );
 ┊91┊88┊
 ┊92┊89┊  if (!chat) return null;
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
 ┊ 8┊10┊const Container = styled.div`
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
@@ -77,21 +79,9 @@
 ┊77┊79┊}
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
-┊90┊  ┊    const {
-┊91┊  ┊      data: { chats },
-┊92┊  ┊    } = await body.json();
-┊93┊  ┊    setChats(chats);
-┊94┊  ┊  }, []);
+┊  ┊82┊  const {
+┊  ┊83┊    data: { chats = [] },
+┊  ┊84┊  } = useQuery<any>(getChatsQuery);
 ┊95┊85┊
 ┊96┊86┊  const navToChat = useCallback(
 ┊97┊87┊    chat => {
```
```diff
@@ -103,7 +93,7 @@
 ┊103┊ 93┊  return (
 ┊104┊ 94┊    <Container>
 ┊105┊ 95┊      <StyledList>
-┊106┊   ┊        {chats.map(chat => (
+┊   ┊ 96┊        {chats.map((chat: any) => (
 ┊107┊ 97┊          <StyledListItem
 ┊108┊ 98┊            key={chat.id}
 ┊109┊ 99┊            data-testid="chat"
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

#### [__Client__ Step 7.4: Mock Apollo requests in tests](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/9eba6d5)

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

#### [__Client__ Step 7.4: Mock Apollo requests in tests](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/9eba6d5)

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.test.tsx
```diff
@@ -1,4 +1,5 @@
 ┊1┊1┊import React from 'react';
+┊ ┊2┊import { ApolloProvider } from 'react-apollo-hooks';
 ┊2┊3┊import ReactDOM from 'react-dom';
 ┊3┊4┊import {
 ┊4┊5┊  cleanup,
```
```diff
@@ -7,8 +8,9 @@
 ┊ 7┊ 8┊  wait,
 ┊ 8┊ 9┊  waitForDomChange,
 ┊ 9┊10┊} from '@testing-library/react';
-┊10┊  ┊import ChatsList from './ChatsList';
 ┊11┊11┊import { createBrowserHistory } from 'history';
+┊  ┊12┊import { mockApolloClient } from '../../test-helpers';
+┊  ┊13┊import ChatsList, { getChatsQuery } from './ChatsList';
 ┊12┊14┊
 ┊13┊15┊describe('ChatsList', () => {
 ┊14┊16┊  afterEach(() => {
```
```diff
@@ -17,27 +19,36 @@
 ┊17┊19┊  });
 ┊18┊20┊
 ┊19┊21┊  it('renders fetched chats data', async () => {
-┊20┊  ┊    fetch.mockResponseOnce(
-┊21┊  ┊      JSON.stringify({
-┊22┊  ┊        data: {
-┊23┊  ┊          chats: [
-┊24┊  ┊            {
-┊25┊  ┊              id: 1,
-┊26┊  ┊              name: 'Foo Bar',
-┊27┊  ┊              picture: 'https://localhost:4000/picture.jpg',
-┊28┊  ┊              lastMessage: {
+┊  ┊22┊    const client = mockApolloClient([
+┊  ┊23┊      {
+┊  ┊24┊        request: { query: getChatsQuery },
+┊  ┊25┊        result: {
+┊  ┊26┊          data: {
+┊  ┊27┊            chats: [
+┊  ┊28┊              {
+┊  ┊29┊                __typename: 'Chat',
 ┊29┊30┊                id: 1,
-┊30┊  ┊                content: 'Hello',
-┊31┊  ┊                createdAt: new Date('1 Jan 2019 GMT'),
+┊  ┊31┊                name: 'Foo Bar',
+┊  ┊32┊                picture: 'https://localhost:4000/picture.jpg',
+┊  ┊33┊                lastMessage: {
+┊  ┊34┊                  __typename: 'Message',
+┊  ┊35┊                  id: 1,
+┊  ┊36┊                  content: 'Hello',
+┊  ┊37┊                  createdAt: new Date('1 Jan 2019 GMT'),
+┊  ┊38┊                },
 ┊32┊39┊              },
-┊33┊  ┊            },
-┊34┊  ┊          ],
+┊  ┊40┊            ],
+┊  ┊41┊          },
 ┊35┊42┊        },
-┊36┊  ┊      })
-┊37┊  ┊    );
+┊  ┊43┊      },
+┊  ┊44┊    ]);
 ┊38┊45┊
 ┊39┊46┊    {
-┊40┊  ┊      const { container, getByTestId } = render(<ChatsList />);
+┊  ┊47┊      const { container, getByTestId } = render(
+┊  ┊48┊        <ApolloProvider client={client}>
+┊  ┊49┊          <ChatsList />
+┊  ┊50┊        </ApolloProvider>
+┊  ┊51┊      );
 ┊41┊52┊
 ┊42┊53┊      await waitForDomChange({ container });
 ┊43┊54┊
```
```diff
@@ -52,30 +63,37 @@
 ┊52┊63┊  });
 ┊53┊64┊
 ┊54┊65┊  it('should navigate to the target chat room on chat item click', async () => {
-┊55┊  ┊    fetch.mockResponseOnce(
-┊56┊  ┊      JSON.stringify({
-┊57┊  ┊        data: {
-┊58┊  ┊          chats: [
-┊59┊  ┊            {
-┊60┊  ┊              id: 1,
-┊61┊  ┊              name: 'Foo Bar',
-┊62┊  ┊              picture: 'https://localhost:4000/picture.jpg',
-┊63┊  ┊              lastMessage: {
+┊  ┊66┊    const client = mockApolloClient([
+┊  ┊67┊      {
+┊  ┊68┊        request: { query: getChatsQuery },
+┊  ┊69┊        result: {
+┊  ┊70┊          data: {
+┊  ┊71┊            chats: [
+┊  ┊72┊              {
+┊  ┊73┊                __typename: 'Chat',
 ┊64┊74┊                id: 1,
-┊65┊  ┊                content: 'Hello',
-┊66┊  ┊                createdAt: new Date('1 Jan 2019 GMT'),
+┊  ┊75┊                name: 'Foo Bar',
+┊  ┊76┊                picture: 'https://localhost:4000/picture.jpg',
+┊  ┊77┊                lastMessage: {
+┊  ┊78┊                  __typename: 'Message',
+┊  ┊79┊                  id: 1,
+┊  ┊80┊                  content: 'Hello',
+┊  ┊81┊                  createdAt: new Date('1 Jan 2019 GMT'),
+┊  ┊82┊                },
 ┊67┊83┊              },
-┊68┊  ┊            },
-┊69┊  ┊          ],
+┊  ┊84┊            ],
+┊  ┊85┊          },
 ┊70┊86┊        },
-┊71┊  ┊      })
-┊72┊  ┊    );
+┊  ┊87┊      },
+┊  ┊88┊    ]);
 ┊73┊89┊
 ┊74┊90┊    const history = createBrowserHistory();
 ┊75┊91┊
 ┊76┊92┊    {
 ┊77┊93┊      const { container, getByTestId } = render(
-┊78┊  ┊        <ChatsList history={history} />
+┊  ┊94┊        <ApolloProvider client={client}>
+┊  ┊95┊          <ChatsList history={history} />
+┊  ┊96┊        </ApolloProvider>
 ┊79┊97┊      );
 ┊80┊98┊
 ┊81┊99┊      await waitForDomChange({ container });
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

#### [__Client__ Step 7.4: Mock Apollo requests in tests](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/9eba6d5)

##### Changed src&#x2F;App.test.tsx
```diff
@@ -1,9 +1,18 @@
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
+┊  ┊14┊    </ApolloProvider>,
+┊  ┊15┊    div
+┊  ┊16┊  );
 ┊ 8┊17┊  ReactDOM.unmountComponentAtNode(div);
 ┊ 9┊18┊});
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

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step6.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step8.md) |
|:--------------------------------|--------------------------------:|

[}]: #
