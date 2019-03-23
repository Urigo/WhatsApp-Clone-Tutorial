# Step 7: Caching with Apollo-Client

[//]: # (head-end)


In the previous step we've implemented a `ChatRoomScreen` where we were able to view each chat's messages list by clicking on a chat item from the main screen. It all looks functional, however, there's a significant optimization issue - each time we navigate into a `ChatRoomScreen`, we need to re-fetch the data related to the target chat.

The solution for that would be [caching](https://en.wikipedia.org/wiki/Cache_(computing)) the fetch result, so it can be re-used once we re-enter a screen that we've visited before. For now things are fairly simple so the caching mechanism can be implemented manually, but things are gonna get tougher when we add more queries or things like message sending and profile updating to the mix, so it's not gonna be an easy task. Luckily, in the Apollo team they've invented a solution that works right out of the box and integrates perfectly with Apollo-GraphQL server - [Apollo-GraphQL client](https://www.apollographql.com/docs/link/#apollo-client).



![caching](https://user-images.githubusercontent.com/7648874/54871150-f505e100-4dea-11e9-9e2d-439fbf3eaebe.png)



Apollo-Client is a wrap around our GraphQL REST endpoint which essentially uses HTTP requests (and further on [web-sockets](https://en.wikipedia.org/wiki/WebSocket), but we will get there), something that we've implemented manually so far. Not only it can be used to fetch data, but it will also cache the result of the query so it can be seamlessly re-used when we request the same data. This means that we will need to setup an Apollo-Client and replace all our `fetch()` calls with `client.query()` call. More about Apollo-Client's API further in this tutorial, but let's start configuring it. First we will install few essential NPM packages:

  $ npm install apollo-cache-inmemory apollo-client apollo-link apollo-link-http



*   [`apollo-client`](https://www.npmjs.com/package/apollo-client) - Apollo-Client's core package, as we explained earlier.
*   [`apollo-cache-inmemory`](https://www.npmjs.com/package/apollo-cache-inmemory) - The data store that will be used to cache the results.
*   [`apollo-link-http`](https://www.npmjs.com/package/apollo-link-http) - Get GraphQL results over a network using HTTP fetch.

We will create a new file in the `src` directory called `client.ts` and inside we will export the client:

[{]: <helper> (diffStep 7.1 files="client" module="client")

#### [Client Step 7.1: Add Apollo client](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/4669eb8)

##### Added src&#x2F;client.ts
```diff
@@ -0,0 +1,16 @@
+┊  ┊ 1┊import { InMemoryCache } from 'apollo-cache-inmemory'
+┊  ┊ 2┊import { ApolloClient } from 'apollo-client'
+┊  ┊ 3┊import { HttpLink } from 'apollo-link-http'
+┊  ┊ 4┊
+┊  ┊ 5┊const httpUri = process.env.REACT_APP_SERVER_URL + '/graphql'
+┊  ┊ 6┊
+┊  ┊ 7┊const httpLink = new HttpLink({
+┊  ┊ 8┊  uri: httpUri,
+┊  ┊ 9┊})
+┊  ┊10┊
+┊  ┊11┊const inMemoryCache = new InMemoryCache()
+┊  ┊12┊
+┊  ┊13┊export default new ApolloClient({
+┊  ┊14┊  link: httpLink,
+┊  ┊15┊  cache: inMemoryCache,
+┊  ┊16┊})
```

[}]: #

Although the client can be used directly and integrated into any UI framework, it would be the most comfortable to use a wrap around it which is suitable for React. For that we will use a package called [`react-apollo-hooks`](https://www.npmjs.com/package/react-apollo-hooks) which includes a set of [React hooks](https://reactjs.org/docs/hooks-intro.html) that can connect between our Apollo-Client and target React.Component:

    $ npm install react-apollo-hooks graphql-tag

With `react-apollo-hooks` we can use the `useQuery()` hook to fetch data from our GraphQL API. The `graphql-tag` package is used to parse the GraphQL string to an [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree), something which is required when using Apollo Client. Example:


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

#### [Client Step 7.2: Provide Apollo client](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/730babe)

##### Changed src&#x2F;index.jsx
```diff
@@ -1,8 +1,10 @@
 ┊ 1┊ 1┊import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
 ┊ 2┊ 2┊import React from 'react';
 ┊ 3┊ 3┊import ReactDOM from 'react-dom';
+┊  ┊ 4┊import { ApolloProvider } from 'react-apollo-hooks'
 ┊ 4┊ 5┊import './index.css';
 ┊ 5┊ 6┊import App from './App';
+┊  ┊ 7┊import client from './client'
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

The code above uses the [Context/Provider](https://reactjs.org/docs/context.html) API, thus the client is now known globally. Now that we can use the `useQuery()` hook, there's no need to use the native Fetch API anymore. Let's replace all our Fetch API call instances with a React hook:

[{]: <helper> (diffStep 7.3 files="components" module="client")

#### [Client Step 7.3: Replace fetch() calls with useQuery()](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/95d45fd)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -1,5 +1,7 @@
+┊ ┊1┊import gql from 'graphql-tag'
 ┊1┊2┊import * as React from 'react'
-┊2┊ ┊import { useCallback, useMemo, useState } from 'react'
+┊ ┊3┊import { useCallback } from 'react'
+┊ ┊4┊import { useApolloClient, useQuery } from 'react-apollo-hooks'
 ┊3┊5┊import styled from 'styled-components'
 ┊4┊6┊import ChatNavbar from './ChatNavbar'
 ┊5┊7┊import MessageInput from './MessageInput'
```
```diff
@@ -12,7 +14,7 @@
 ┊12┊14┊  height: 100vh;
 ┊13┊15┊`
 ┊14┊16┊
-┊15┊  ┊const getChatQuery = `
+┊  ┊17┊const getChatQuery = gql `
 ┊16┊18┊  query GetChat($chatId: ID!) {
 ┊17┊19┊    chat(chatId: $chatId) {
 ┊18┊20┊      id
```
```diff
@@ -29,22 +31,10 @@
 ┊29┊31┊
 ┊30┊32┊const ChatRoomScreen = ({ history, match }) => {
 ┊31┊33┊  const { params: { chatId } } = match
-┊32┊  ┊  const [chat, setChat] = useState(null)
-┊33┊  ┊
-┊34┊  ┊  useMemo(async () => {
-┊35┊  ┊    const body = await fetch(`${process.env.REACT_APP_SERVER_URL}/graphql`, {
-┊36┊  ┊      method: 'POST',
-┊37┊  ┊      headers: {
-┊38┊  ┊        'Content-Type': 'application/json',
-┊39┊  ┊      },
-┊40┊  ┊      body: JSON.stringify({
-┊41┊  ┊        query: getChatQuery,
-┊42┊  ┊        variables: { chatId },
-┊43┊  ┊      }),
-┊44┊  ┊    })
-┊45┊  ┊    const { data: { chat } } = await body.json()
-┊46┊  ┊    setChat(chat)
-┊47┊  ┊  }, [true])
+┊  ┊34┊  const client = useApolloClient()
+┊  ┊35┊  const { data: { chat } } = useQuery(getChatQuery, {
+┊  ┊36┊    variables: { chatId }
+┊  ┊37┊  })
 ┊48┊38┊
 ┊49┊39┊  const onSendMessage = useCallback((content) => {
 ┊50┊40┊    const message = {
```
```diff
@@ -53,9 +43,15 @@
 ┊53┊43┊      content,
 ┊54┊44┊    }
 ┊55┊45┊
-┊56┊  ┊    setChat({
-┊57┊  ┊      ...chat,
-┊58┊  ┊      messages: chat.messages.concat(message),
+┊  ┊46┊    client.writeQuery({
+┊  ┊47┊      query: getChatQuery,
+┊  ┊48┊      variables: { chatId },
+┊  ┊49┊      data: {
+┊  ┊50┊        chat: {
+┊  ┊51┊          ...chat,
+┊  ┊52┊          messages: chat.messages.concat(message),
+┊  ┊53┊        },
+┊  ┊54┊      },
 ┊59┊55┊    })
 ┊60┊56┊  }, [chat])
 ┊61┊57┊
```

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.tsx
```diff
@@ -1,7 +1,9 @@
 ┊1┊1┊import { List, ListItem } from '@material-ui/core'
+┊ ┊2┊import gql from 'graphql-tag'
 ┊2┊3┊import moment from 'moment'
 ┊3┊4┊import * as React from 'react'
-┊4┊ ┊import { useCallback, useState, useMemo } from 'react'
+┊ ┊5┊import { useCallback } from 'react'
+┊ ┊6┊import { useQuery } from 'react-apollo-hooks'
 ┊5┊7┊import styled from 'styled-components'
 ┊6┊8┊
 ┊7┊9┊const Container = styled.div `
```
```diff
@@ -56,7 +58,7 @@
 ┊56┊58┊  font-size: 13px;
 ┊57┊59┊`
 ┊58┊60┊
-┊59┊  ┊const getChatsQuery = `
+┊  ┊61┊const getChatsQuery = gql `
 ┊60┊62┊  query GetChats {
 ┊61┊63┊    chats {
 ┊62┊64┊      id
```
```diff
@@ -72,19 +74,7 @@
 ┊72┊74┊`
 ┊73┊75┊
 ┊74┊76┊const ChatsList = ({ history }) => {
-┊75┊  ┊  const [chats, setChats] = useState([])
-┊76┊  ┊
-┊77┊  ┊  useMemo(async () => {
-┊78┊  ┊    const body = await fetch(`${process.env.REACT_APP_SERVER_URL}/graphql`, {
-┊79┊  ┊      method: 'POST',
-┊80┊  ┊      headers: {
-┊81┊  ┊        'Content-Type': 'application/json',
-┊82┊  ┊      },
-┊83┊  ┊      body: JSON.stringify({ query: getChatsQuery }),
-┊84┊  ┊    })
-┊85┊  ┊    const { data: { chats } } = await body.json()
-┊86┊  ┊    setChats(chats)
-┊87┊  ┊  }, [true])
+┊  ┊77┊  const { data: { chats = [] } } = useQuery(getChatsQuery)
 ┊88┊78┊
 ┊89┊79┊  const navToChat = useCallback((chat) => {
 ┊90┊80┊    history.push(`chats/${chat.id}`)
```

[}]: #

The replacement is finished. Note that we removed the usage of `useMemo()` - because Apollo has an internal cache mechanism, there's no need to memoize the result anymore. We also used the [`writeQuery()`](https://www.apollographql.com/docs/react/features/caching.html#writequery-and-writefragment) method to edit the stored result in the cache, so in the next render phase we would have an updated chat with the newly added message.

We shouldn't feel any change at all in the view and the response time, since we're running it locally, but if we will take a look at the `network` tab in the browser's dev-tools we should notice the differences:

**before**

![fetch](https://user-images.githubusercontent.com/7648874/54871305-e5879780-4dec-11e9-87bb-3279e9e18342.png)

**after**

![apollo](https://user-images.githubusercontent.com/7648874/54871319-1bc51700-4ded-11e9-9001-d5518bedf9ad.png)

> Above: ChatsListScreen -> ChatRoomScreen -> ChatsListScreen -> ChatRoomScreen

This test is obviously very rough, but the deviation is so big that you don't need any accuracy to emphasize the difference. The blue stripes represents the requests made and the time they took. Before we had about 6 request phases, while after we had only 3 of them.

Since we don't use the Fetch API anymore, we will also need to update our tests. Right now we mock the response from the fetch API, but a more appropriate way would be creating a fake Apollo Client where we will be able to mock the results. For that we will install a package called [`apollo-link-mock`](https://www.npmjs.com/package/apollo-link-mock):

    $ npm install --dev apollo-link-mock

And we will create a `test-helpers.ts` file under the `src` directory that will contain the utility function for creating a fake Apollo Client:

[{]: <helper> (diffStep 7.4 files="test-helpers" module="client")

#### [Client Step 7.4: Mock GraphQL requests in tests](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/fb7fee5)

##### Added src&#x2F;test-helpers.ts
```diff
@@ -0,0 +1,10 @@
+┊  ┊ 1┊import { InMemoryCache } from 'apollo-cache-inmemory'
+┊  ┊ 2┊import { ApolloClient } from 'apollo-client'
+┊  ┊ 3┊import { MockLink } from 'apollo-link-mock'
+┊  ┊ 4┊
+┊  ┊ 5┊export const mockApolloClient = (mocks) => {
+┊  ┊ 6┊  return new ApolloClient({
+┊  ┊ 7┊    cache: new InMemoryCache(),
+┊  ┊ 8┊    link: new MockLink(mocks),
+┊  ┊ 9┊  })
+┊  ┊10┊}
```

[}]: #

The fake client accepts an array of mocks where each mock object will have a `request` key that will contain details about the request and a `result` key which will contain the mocked result. You should get a better understanding of how it works now that we will replace the fake Fetch calls with fake Apollo Clients:

[{]: <helper> (diffStep 7.4 files="src/components" module="client")

#### [Client Step 7.4: Mock GraphQL requests in tests](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/fb7fee5)

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.test.tsx
```diff
@@ -1,8 +1,10 @@
 ┊ 1┊ 1┊import { createBrowserHistory } from 'history'
 ┊ 2┊ 2┊import React from 'react'
+┊  ┊ 3┊import { ApolloProvider } from 'react-apollo-hooks'
 ┊ 3┊ 4┊import ReactDOM from 'react-dom'
 ┊ 4┊ 5┊import { cleanup, render, fireEvent, wait, waitForDomChange } from 'react-testing-library'
-┊ 5┊  ┊import ChatsList from './ChatsList'
+┊  ┊ 6┊import { mockApolloClient } from '../../test-helpers'
+┊  ┊ 7┊import ChatsList, { getChatsQuery } from './ChatsList'
 ┊ 6┊ 8┊
 ┊ 7┊ 9┊describe('ChatsList', () => {
 ┊ 8┊10┊  afterEach(() => {
```
```diff
@@ -11,25 +13,36 @@
 ┊11┊13┊  })
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
-┊24┊  ┊              createdAt: new Date(0),
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
+┊  ┊31┊                  createdAt: new Date(0),
+┊  ┊32┊                },
+┊  ┊33┊              },
+┊  ┊34┊            ],
 ┊26┊35┊          },
-┊27┊  ┊        ],
+┊  ┊36┊        },
 ┊28┊37┊      },
-┊29┊  ┊    }))
+┊  ┊38┊    ])
 ┊30┊39┊
 ┊31┊40┊    {
-┊32┊  ┊      const { container, getByTestId } = render(<ChatsList />)
+┊  ┊41┊      const { container, getByTestId } = render(
+┊  ┊42┊        <ApolloProvider client={client}>
+┊  ┊43┊          <ChatsList />
+┊  ┊44┊        </ApolloProvider>
+┊  ┊45┊      )
 ┊33┊46┊
 ┊34┊47┊      await waitForDomChange({ container })
 ┊35┊48┊
```
```diff
@@ -41,27 +54,38 @@
 ┊41┊54┊  })
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
-┊59┊  ┊    }))
+┊  ┊79┊    ])
 ┊60┊80┊
 ┊61┊81┊    const history = createBrowserHistory()
 ┊62┊82┊
 ┊63┊83┊    {
-┊64┊  ┊      const { container, getByTestId } = render(<ChatsList history={history} />)
+┊  ┊84┊      const { container, getByTestId } = render(
+┊  ┊85┊        <ApolloProvider client={client}>
+┊  ┊86┊          <ChatsList history={history} />
+┊  ┊87┊        </ApolloProvider>
+┊  ┊88┊      )
 ┊65┊89┊
 ┊66┊90┊      await waitForDomChange({ container })
 ┊67┊91┊
```

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.tsx
```diff
@@ -58,7 +58,7 @@
 ┊58┊58┊  font-size: 13px;
 ┊59┊59┊`
 ┊60┊60┊
-┊61┊  ┊const getChatsQuery = gql `
+┊  ┊61┊export const getChatsQuery = gql `
 ┊62┊62┊  query GetChats {
 ┊63┊63┊    chats {
 ┊64┊64┊      id
```

[}]: #

Note how we used the `ApolloProvider` component to provide the target component with the fake Apollo Client. Like so, any other component which uses Apollo Client should be wrapped with an ApolloProvider when rendering it, otherwise it will not function as intended:

[{]: <helper> (diffStep 7.4 files="src/App" module="client")

#### [Client Step 7.4: Mock GraphQL requests in tests](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/fb7fee5)

##### Changed src&#x2F;App.test.js
```diff
@@ -1,9 +1,17 @@
 ┊ 1┊ 1┊import React from 'react';
+┊  ┊ 2┊import { ApolloProvider } from 'react-apollo-hooks'
 ┊ 2┊ 3┊import ReactDOM from 'react-dom';
 ┊ 3┊ 4┊import App from './App';
+┊  ┊ 5┊import { mockApolloClient } from './test-helpers'
 ┊ 4┊ 6┊
 ┊ 5┊ 7┊it('renders without crashing', () => {
+┊  ┊ 8┊  const client = mockApolloClient()
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


[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/final@next/.tortilla/manuals/views/step6.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/final@next/.tortilla/manuals/views/step8.md) |
|:--------------------------------|--------------------------------:|

[}]: #
