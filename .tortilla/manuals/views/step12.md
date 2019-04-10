# Step 12: Adding and removing chats

[//]: # (head-end)


Now that the users system is ready it would be a lot more comfortable to implement a chat creation feature. In the original Whatsapp, you can create a new chat based on your available contacts - a list of your contacts will appear on the screen and by picking one of the items you’ll basically be able to start chatting with the selected contact. However, since in our app we don’t have any real contacts (yet), we will implement the chats creation feature based on all available users in our DB. By picking a user from the users list we will be able to start chatting with it.

![demo](https://user-images.githubusercontent.com/7648874/55896445-e4c67200-5bf0-11e9-9c1c-88318642ef81.gif)

To be able to fetch users in our system we will need to add a new query called `users`. The `users` query will retrieve all users except for current user:

[{]: <helper> (diffStep 9.1 module="server")

#### [__Server__ Step 9.1: Add Query.users](https://github.com/Urigo/WhatsApp-Clone-Server/commit/2b28fe1071cba64e2eb00919af931b06bf068da0)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -85,6 +85,12 @@
 ┊85┊85┊
 ┊86┊86┊      return chat.participants.includes(currentUser.id) ? chat : null;
 ┊87┊87┊    },
+┊  ┊88┊
+┊  ┊89┊    users(root, args, { currentUser }) {
+┊  ┊90┊      if (!currentUser) return [];
+┊  ┊91┊
+┊  ┊92┊      return users.filter(u => u.id !== currentUser.id);
+┊  ┊93┊    },
 ┊88┊94┊  },
 ┊89┊95┊
 ┊90┊96┊  Mutation: {
```

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -29,6 +29,7 @@
 ┊29┊29┊type Query {
 ┊30┊30┊  chats: [Chat!]!
 ┊31┊31┊  chat(chatId: ID!): Chat
+┊  ┊32┊  users: [User!]!
 ┊32┊33┊}
 ┊33┊34┊
 ┊34┊35┊type Mutation {
```

##### Added tests&#x2F;queries&#x2F;\__snapshots__&#x2F;getUsers.test.ts.snap
```diff
@@ -0,0 +1,55 @@
+┊  ┊ 1┊// Jest Snapshot v1, https://goo.gl/fbAQLP
+┊  ┊ 2┊
+┊  ┊ 3┊exports[`Query.getUsers should fetch all users except the one signed-in 1`] = `
+┊  ┊ 4┊Object {
+┊  ┊ 5┊  "users": Array [
+┊  ┊ 6┊    Object {
+┊  ┊ 7┊      "id": "2",
+┊  ┊ 8┊      "name": "Ethan Gonzalez",
+┊  ┊ 9┊      "picture": "https://randomuser.me/api/portraits/thumb/men/1.jpg",
+┊  ┊10┊    },
+┊  ┊11┊    Object {
+┊  ┊12┊      "id": "3",
+┊  ┊13┊      "name": "Bryan Wallace",
+┊  ┊14┊      "picture": "https://randomuser.me/api/portraits/thumb/men/2.jpg",
+┊  ┊15┊    },
+┊  ┊16┊    Object {
+┊  ┊17┊      "id": "4",
+┊  ┊18┊      "name": "Avery Stewart",
+┊  ┊19┊      "picture": "https://randomuser.me/api/portraits/thumb/women/1.jpg",
+┊  ┊20┊    },
+┊  ┊21┊    Object {
+┊  ┊22┊      "id": "5",
+┊  ┊23┊      "name": "Katie Peterson",
+┊  ┊24┊      "picture": "https://randomuser.me/api/portraits/thumb/women/2.jpg",
+┊  ┊25┊    },
+┊  ┊26┊  ],
+┊  ┊27┊}
+┊  ┊28┊`;
+┊  ┊29┊
+┊  ┊30┊exports[`Query.getUsers should fetch all users except the one signed-in 2`] = `
+┊  ┊31┊Object {
+┊  ┊32┊  "users": Array [
+┊  ┊33┊    Object {
+┊  ┊34┊      "id": "1",
+┊  ┊35┊      "name": "Ray Edwards",
+┊  ┊36┊      "picture": "https://randomuser.me/api/portraits/thumb/lego/1.jpg",
+┊  ┊37┊    },
+┊  ┊38┊    Object {
+┊  ┊39┊      "id": "3",
+┊  ┊40┊      "name": "Bryan Wallace",
+┊  ┊41┊      "picture": "https://randomuser.me/api/portraits/thumb/men/2.jpg",
+┊  ┊42┊    },
+┊  ┊43┊    Object {
+┊  ┊44┊      "id": "4",
+┊  ┊45┊      "name": "Avery Stewart",
+┊  ┊46┊      "picture": "https://randomuser.me/api/portraits/thumb/women/1.jpg",
+┊  ┊47┊    },
+┊  ┊48┊    Object {
+┊  ┊49┊      "id": "5",
+┊  ┊50┊      "name": "Katie Peterson",
+┊  ┊51┊      "picture": "https://randomuser.me/api/portraits/thumb/women/2.jpg",
+┊  ┊52┊    },
+┊  ┊53┊  ],
+┊  ┊54┊}
+┊  ┊55┊`;
```

##### Added tests&#x2F;queries&#x2F;getUsers.test.ts
```diff
@@ -0,0 +1,51 @@
+┊  ┊ 1┊import { createTestClient } from 'apollo-server-testing';
+┊  ┊ 2┊import { ApolloServer, gql } from 'apollo-server-express';
+┊  ┊ 3┊import schema from '../../schema';
+┊  ┊ 4┊import { users } from '../../db';
+┊  ┊ 5┊
+┊  ┊ 6┊describe('Query.getUsers', () => {
+┊  ┊ 7┊  it('should fetch all users except the one signed-in', async () => {
+┊  ┊ 8┊    let currentUser = users[0];
+┊  ┊ 9┊
+┊  ┊10┊    const server = new ApolloServer({
+┊  ┊11┊      schema,
+┊  ┊12┊      context: () => ({ currentUser }),
+┊  ┊13┊    });
+┊  ┊14┊
+┊  ┊15┊    const { query } = createTestClient(server);
+┊  ┊16┊
+┊  ┊17┊    let res = await query({
+┊  ┊18┊      query: gql`
+┊  ┊19┊        query GetUsers {
+┊  ┊20┊          users {
+┊  ┊21┊            id
+┊  ┊22┊            name
+┊  ┊23┊            picture
+┊  ┊24┊          }
+┊  ┊25┊        }
+┊  ┊26┊      `,
+┊  ┊27┊    });
+┊  ┊28┊
+┊  ┊29┊    expect(res.data).toBeDefined();
+┊  ┊30┊    expect(res.errors).toBeUndefined();
+┊  ┊31┊    expect(res.data).toMatchSnapshot();
+┊  ┊32┊
+┊  ┊33┊    currentUser = users[1];
+┊  ┊34┊
+┊  ┊35┊    res = await query({
+┊  ┊36┊      query: gql`
+┊  ┊37┊        query GetUsers {
+┊  ┊38┊          users {
+┊  ┊39┊            id
+┊  ┊40┊            name
+┊  ┊41┊            picture
+┊  ┊42┊          }
+┊  ┊43┊        }
+┊  ┊44┊      `,
+┊  ┊45┊    });
+┊  ┊46┊
+┊  ┊47┊    expect(res.data).toBeDefined();
+┊  ┊48┊    expect(res.errors).toBeUndefined();
+┊  ┊49┊    expect(res.data).toMatchSnapshot();
+┊  ┊50┊  });
+┊  ┊51┊});
```

[}]: #

This query will be reflected in a component called `UsersList`. First we will define and export a new fragment called `User`:

[{]: <helper> (diffStep 12.1 files="graphql/fragments" module="client")

#### [__Client__ Step 12.1: Add basic ChatCreationScreen](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/ad2c1a5033da535215e6dbce3113223e1a674d1b)

##### Changed src&#x2F;graphql&#x2F;fragments&#x2F;index.ts
```diff
@@ -1,3 +1,4 @@
 ┊1┊1┊export { default as chat } from './chat.fragment';
 ┊2┊2┊export { default as fullChat } from './fullChat.fragment';
 ┊3┊3┊export { default as message } from './message.fragment';
+┊ ┊4┊export { default as user } from './user.fragment';
```

##### Added src&#x2F;graphql&#x2F;fragments&#x2F;user.fragment.ts
```diff
@@ -0,0 +1,9 @@
+┊ ┊1┊import gql from 'graphql-tag';
+┊ ┊2┊
+┊ ┊3┊export default gql`
+┊ ┊4┊  fragment User on User {
+┊ ┊5┊    id
+┊ ┊6┊    name
+┊ ┊7┊    picture
+┊ ┊8┊  }
+┊ ┊9┊`;
```

[}]: #

And then we will implement the `UsersList` component which is going to use the `users` query with the `User` fragment:

[{]: <helper> (diffStep 12.1 files="UsersList" module="client")

#### [__Client__ Step 12.1: Add basic ChatCreationScreen](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/ad2c1a5033da535215e6dbce3113223e1a674d1b)

##### Added src&#x2F;components&#x2F;UsersList.test.tsx
```diff
@@ -0,0 +1,45 @@
+┊  ┊ 1┊import React from 'react';
+┊  ┊ 2┊import { ApolloProvider } from '@apollo/react-hooks';
+┊  ┊ 3┊import { cleanup, render, waitFor, screen } from '@testing-library/react';
+┊  ┊ 4┊import { mockApolloClient } from '../test-helpers';
+┊  ┊ 5┊import UsersList, { UsersListQuery } from './UsersList';
+┊  ┊ 6┊
+┊  ┊ 7┊describe('UsersList', () => {
+┊  ┊ 8┊  afterEach(cleanup);
+┊  ┊ 9┊
+┊  ┊10┊  it('renders fetched users data', async () => {
+┊  ┊11┊    const client = mockApolloClient([
+┊  ┊12┊      {
+┊  ┊13┊        request: { query: UsersListQuery },
+┊  ┊14┊        result: {
+┊  ┊15┊          data: {
+┊  ┊16┊            users: [
+┊  ┊17┊              {
+┊  ┊18┊                __typename: 'User',
+┊  ┊19┊                id: 1,
+┊  ┊20┊                name: 'Charles Dickhead',
+┊  ┊21┊                picture: 'https://localhost:4000/dick.jpg',
+┊  ┊22┊              },
+┊  ┊23┊            ],
+┊  ┊24┊          },
+┊  ┊25┊        },
+┊  ┊26┊      },
+┊  ┊27┊    ]);
+┊  ┊28┊
+┊  ┊29┊    {
+┊  ┊30┊      const { container, getByTestId } = render(
+┊  ┊31┊        <ApolloProvider client={client}>
+┊  ┊32┊          <UsersList />
+┊  ┊33┊        </ApolloProvider>
+┊  ┊34┊      );
+┊  ┊35┊
+┊  ┊36┊      await waitFor(() => screen.getByTestId('name'));
+┊  ┊37┊
+┊  ┊38┊      expect(getByTestId('name')).toHaveTextContent('Charles Dickhead');
+┊  ┊39┊      expect(getByTestId('picture')).toHaveAttribute(
+┊  ┊40┊        'src',
+┊  ┊41┊        'https://localhost:4000/dick.jpg'
+┊  ┊42┊      );
+┊  ┊43┊    }
+┊  ┊44┊  });
+┊  ┊45┊});
```

##### Added src&#x2F;components&#x2F;UsersList.tsx
```diff
@@ -0,0 +1,64 @@
+┊  ┊ 1┊import MaterialList from '@material-ui/core/List';
+┊  ┊ 2┊import MaterialItem from '@material-ui/core/ListItem';
+┊  ┊ 3┊import gql from 'graphql-tag';
+┊  ┊ 4┊import React from 'react';
+┊  ┊ 5┊import styled from 'styled-components';
+┊  ┊ 6┊import * as fragments from '../graphql/fragments';
+┊  ┊ 7┊import { useUsersListQuery } from '../graphql/types';
+┊  ┊ 8┊
+┊  ┊ 9┊const ActualList = styled(MaterialList)`
+┊  ┊10┊  padding: 0;
+┊  ┊11┊`;
+┊  ┊12┊
+┊  ┊13┊const UserItem = styled(MaterialItem)`
+┊  ┊14┊  position: relative;
+┊  ┊15┊  padding: 7.5px 15px;
+┊  ┊16┊  display: flex;
+┊  ┊17┊  cursor: pinter;
+┊  ┊18┊`;
+┊  ┊19┊
+┊  ┊20┊const ProfilePicture = styled.img`
+┊  ┊21┊  height: 50px;
+┊  ┊22┊  width: 50px;
+┊  ┊23┊  object-fit: cover;
+┊  ┊24┊  border-radius: 50%;
+┊  ┊25┊`;
+┊  ┊26┊
+┊  ┊27┊const Name = styled.div`
+┊  ┊28┊  padding-left: 15px;
+┊  ┊29┊  font-weight: bold;
+┊  ┊30┊`;
+┊  ┊31┊
+┊  ┊32┊export const UsersListQuery = gql`
+┊  ┊33┊  query UsersList {
+┊  ┊34┊    users {
+┊  ┊35┊      ...User
+┊  ┊36┊    }
+┊  ┊37┊  }
+┊  ┊38┊  ${fragments.user}
+┊  ┊39┊`;
+┊  ┊40┊
+┊  ┊41┊const UsersList: React.FC = () => {
+┊  ┊42┊  const { data, loading: loadingUsers } = useUsersListQuery();
+┊  ┊43┊
+┊  ┊44┊  if (data === undefined) return null;
+┊  ┊45┊  const users = data.users;
+┊  ┊46┊
+┊  ┊47┊  return (
+┊  ┊48┊    <ActualList>
+┊  ┊49┊      {!loadingUsers &&
+┊  ┊50┊        users.map((user) => (
+┊  ┊51┊          <UserItem key={user.id} button>
+┊  ┊52┊            {user !== null && user.picture !== null && (
+┊  ┊53┊              <React.Fragment>
+┊  ┊54┊                <ProfilePicture data-testid="picture" src={user.picture} />
+┊  ┊55┊                <Name data-testid="name">{user.name}</Name>
+┊  ┊56┊              </React.Fragment>
+┊  ┊57┊            )}
+┊  ┊58┊          </UserItem>
+┊  ┊59┊        ))}
+┊  ┊60┊    </ActualList>
+┊  ┊61┊  );
+┊  ┊62┊};
+┊  ┊63┊
+┊  ┊64┊export default UsersList;
```

[}]: #

The list is likely to change when a new user signs-up. We will implement a subscription and live-update the list further this tutorial when we go through authentication. Now we will implement a new screen component called `ChatCreationScreen`. The screen will simply render the `UsersList` along with a navigation bar:

[{]: <helper> (diffStep 12.1 files="ChatCreationScreen" module="client")

#### [__Client__ Step 12.1: Add basic ChatCreationScreen](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/ad2c1a5033da535215e6dbce3113223e1a674d1b)

##### Added src&#x2F;components&#x2F;ChatCreationScreen&#x2F;ChatCreationNavbar.test.tsx
```diff
@@ -0,0 +1,26 @@
+┊  ┊ 1┊import { createMemoryHistory } from 'history';
+┊  ┊ 2┊import React from 'react';
+┊  ┊ 3┊import { cleanup, render, fireEvent, waitFor } from '@testing-library/react';
+┊  ┊ 4┊import ChatCreationNavbar from './ChatCreationNavbar';
+┊  ┊ 5┊
+┊  ┊ 6┊describe('ChatCreationNavbar', () => {
+┊  ┊ 7┊  afterEach(cleanup);
+┊  ┊ 8┊
+┊  ┊ 9┊  it('goes back on arrow click', async () => {
+┊  ┊10┊    const history = createMemoryHistory();
+┊  ┊11┊
+┊  ┊12┊    history.push('/new-chat');
+┊  ┊13┊
+┊  ┊14┊    await waitFor(() => expect(history.location.pathname).toEqual('/new-chat'));
+┊  ┊15┊
+┊  ┊16┊    {
+┊  ┊17┊      const { container, getByTestId } = render(
+┊  ┊18┊        <ChatCreationNavbar history={history} />
+┊  ┊19┊      );
+┊  ┊20┊
+┊  ┊21┊      fireEvent.click(getByTestId('back-button'));
+┊  ┊22┊
+┊  ┊23┊      await waitFor(() => expect(history.location.pathname).toEqual('/chats'));
+┊  ┊24┊    }
+┊  ┊25┊  });
+┊  ┊26┊});
```

##### Added src&#x2F;components&#x2F;ChatCreationScreen&#x2F;ChatCreationNavbar.tsx
```diff
@@ -0,0 +1,45 @@
+┊  ┊ 1┊import ArrowBackIcon from '@material-ui/icons/ArrowBack';
+┊  ┊ 2┊import { Toolbar, Button } from '@material-ui/core';
+┊  ┊ 3┊import React from 'react';
+┊  ┊ 4┊import { useCallback } from 'react';
+┊  ┊ 5┊import styled from 'styled-components';
+┊  ┊ 6┊import { History } from 'history';
+┊  ┊ 7┊
+┊  ┊ 8┊const Container = styled(Toolbar)`
+┊  ┊ 9┊  display: flex;
+┊  ┊10┊  background-color: var(--primary-bg);
+┊  ┊11┊  color: var(--primary-text);
+┊  ┊12┊  font-size: 20px;
+┊  ┊13┊  line-height: 40px;
+┊  ┊14┊`;
+┊  ┊15┊
+┊  ┊16┊const BackButton = styled(Button)`
+┊  ┊17┊  svg {
+┊  ┊18┊    color: var(--primary-text);
+┊  ┊19┊  }
+┊  ┊20┊`;
+┊  ┊21┊
+┊  ┊22┊const Title = styled.div`
+┊  ┊23┊  flex: 1;
+┊  ┊24┊`;
+┊  ┊25┊
+┊  ┊26┊interface ChildComponentProps {
+┊  ┊27┊  history: History;
+┊  ┊28┊}
+┊  ┊29┊
+┊  ┊30┊const ChatCreationNavbar: React.FC<ChildComponentProps> = ({ history }) => {
+┊  ┊31┊  const navBack = useCallback(() => {
+┊  ┊32┊    history.replace('/chats');
+┊  ┊33┊  }, [history]);
+┊  ┊34┊
+┊  ┊35┊  return (
+┊  ┊36┊    <Container>
+┊  ┊37┊      <BackButton data-testid="back-button" onClick={navBack}>
+┊  ┊38┊        <ArrowBackIcon />
+┊  ┊39┊      </BackButton>
+┊  ┊40┊      <Title>Create Chat</Title>
+┊  ┊41┊    </Container>
+┊  ┊42┊  );
+┊  ┊43┊};
+┊  ┊44┊
+┊  ┊45┊export default ChatCreationNavbar;
```

##### Added src&#x2F;components&#x2F;ChatCreationScreen&#x2F;index.tsx
```diff
@@ -0,0 +1,29 @@
+┊  ┊ 1┊import React from 'react';
+┊  ┊ 2┊import styled from 'styled-components';
+┊  ┊ 3┊import UsersList from '../UsersList';
+┊  ┊ 4┊import ChatCreationNavbar from './ChatCreationNavbar';
+┊  ┊ 5┊import { History } from 'history';
+┊  ┊ 6┊
+┊  ┊ 7┊// eslint-disable-next-line
+┊  ┊ 8┊const Container = styled.div`
+┊  ┊ 9┊  height: calc(100% - 56px);
+┊  ┊10┊  overflow-y: overlay;
+┊  ┊11┊`;
+┊  ┊12┊
+┊  ┊13┊// eslint-disable-next-line
+┊  ┊14┊const StyledUsersList = styled(UsersList)`
+┊  ┊15┊  height: calc(100% - 56px);
+┊  ┊16┊`;
+┊  ┊17┊
+┊  ┊18┊interface ChildComponentProps {
+┊  ┊19┊  history: History;
+┊  ┊20┊}
+┊  ┊21┊
+┊  ┊22┊const ChatCreationScreen: React.FC<ChildComponentProps> = ({ history }) => (
+┊  ┊23┊  <div>
+┊  ┊24┊    <ChatCreationNavbar history={history} />
+┊  ┊25┊    <UsersList />
+┊  ┊26┊  </div>
+┊  ┊27┊);
+┊  ┊28┊
+┊  ┊29┊export default ChatCreationScreen;
```

[}]: #

The screen will be available under the route `/new-chat`. The new route will be restricted, since only authenticated users should be able to access it:

[{]: <helper> (diffStep 12.1 files="App" module="client")

#### [__Client__ Step 12.1: Add basic ChatCreationScreen](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/ad2c1a5033da535215e6dbce3113223e1a674d1b)

##### Changed src&#x2F;App.tsx
```diff
@@ -8,6 +8,7 @@
 ┊ 8┊ 8┊import AuthScreen from './components/AuthScreen';
 ┊ 9┊ 9┊import ChatRoomScreen from './components/ChatRoomScreen';
 ┊10┊10┊import ChatsListScreen from './components/ChatsListScreen';
+┊  ┊11┊import ChatCreationScreen from './components/ChatCreationScreen';
 ┊11┊12┊import AnimatedSwitch from './components/AnimatedSwitch';
 ┊12┊13┊import { withAuth } from './services/auth.service';
 ┊13┊14┊
```
```diff
@@ -26,6 +27,8 @@
 ┊26┊27┊          )
 ┊27┊28┊        )}
 ┊28┊29┊      />
+┊  ┊30┊
+┊  ┊31┊      <Route exact path="/new-chat" component={withAuth(ChatCreationScreen)} />
 ┊29┊32┊    </AnimatedSwitch>
 ┊30┊33┊    <Route exact path="/" render={redirectToChats} />
 ┊31┊34┊  </BrowserRouter>
```

[}]: #

the `/new-chat` route will be accessible directly from the main `ChatsListScreen`. We will implement a navigation button which is gonna have a fixed position at the bottom right corner of the screen:

[{]: <helper> (diffStep 12.1 files="AddChatButton" module="client")

#### [__Client__ Step 12.1: Add basic ChatCreationScreen](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/ad2c1a5033da535215e6dbce3113223e1a674d1b)

##### Added src&#x2F;components&#x2F;ChatsListScreen&#x2F;AddChatButton.test.tsx
```diff
@@ -0,0 +1,29 @@
+┊  ┊ 1┊import { createMemoryHistory } from 'history';
+┊  ┊ 2┊import { ApolloProvider } from '@apollo/react-hooks';
+┊  ┊ 3┊import React from 'react';
+┊  ┊ 4┊import { cleanup, render, fireEvent, waitFor } from '@testing-library/react';
+┊  ┊ 5┊import AddChatButton from './AddChatButton';
+┊  ┊ 6┊import { mockApolloClient } from '../../test-helpers';
+┊  ┊ 7┊
+┊  ┊ 8┊describe('AddChatButton', () => {
+┊  ┊ 9┊  afterEach(cleanup);
+┊  ┊10┊
+┊  ┊11┊  it('goes back on arrow click', async () => {
+┊  ┊12┊    const history = createMemoryHistory();
+┊  ┊13┊    const client = mockApolloClient();
+┊  ┊14┊
+┊  ┊15┊    {
+┊  ┊16┊      const { container, getByTestId } = render(
+┊  ┊17┊        <ApolloProvider client={client}>
+┊  ┊18┊          <AddChatButton history={history} />
+┊  ┊19┊        </ApolloProvider>
+┊  ┊20┊      );
+┊  ┊21┊
+┊  ┊22┊      fireEvent.click(getByTestId('new-chat-button'));
+┊  ┊23┊
+┊  ┊24┊      await waitFor(() =>
+┊  ┊25┊        expect(history.location.pathname).toEqual('/new-chat')
+┊  ┊26┊      );
+┊  ┊27┊    }
+┊  ┊28┊  });
+┊  ┊29┊});
```

##### Added src&#x2F;components&#x2F;ChatsListScreen&#x2F;AddChatButton.tsx
```diff
@@ -0,0 +1,43 @@
+┊  ┊ 1┊import Button from '@material-ui/core/Button';
+┊  ┊ 2┊import ChatIcon from '@material-ui/icons/Chat';
+┊  ┊ 3┊import React from 'react';
+┊  ┊ 4┊import styled from 'styled-components';
+┊  ┊ 5┊import { History } from 'history';
+┊  ┊ 6┊
+┊  ┊ 7┊const Container = styled.div`
+┊  ┊ 8┊  position: fixed;
+┊  ┊ 9┊  right: 10px;
+┊  ┊10┊  bottom: 10px;
+┊  ┊11┊
+┊  ┊12┊  button {
+┊  ┊13┊    min-width: 50px;
+┊  ┊14┊    width: 50px;
+┊  ┊15┊    height: 50px;
+┊  ┊16┊    border-radius: 999px;
+┊  ┊17┊    background-color: var(--secondary-bg);
+┊  ┊18┊    color: white;
+┊  ┊19┊  }
+┊  ┊20┊`;
+┊  ┊21┊interface ChildComponentProps {
+┊  ┊22┊  history: History;
+┊  ┊23┊}
+┊  ┊24┊
+┊  ┊25┊const AddChatButton: React.FC<ChildComponentProps> = ({ history }) => {
+┊  ┊26┊  const onClick = () => {
+┊  ┊27┊    history.push('/new-chat');
+┊  ┊28┊  };
+┊  ┊29┊
+┊  ┊30┊  return (
+┊  ┊31┊    <Container>
+┊  ┊32┊      <Button
+┊  ┊33┊        data-testid="new-chat-button"
+┊  ┊34┊        variant="contained"
+┊  ┊35┊        color="secondary"
+┊  ┊36┊        onClick={onClick}>
+┊  ┊37┊        <ChatIcon />
+┊  ┊38┊      </Button>
+┊  ┊39┊    </Container>
+┊  ┊40┊  );
+┊  ┊41┊};
+┊  ┊42┊
+┊  ┊43┊export default AddChatButton;
```

[}]: #

And then we will render it in the `ChatsListScreen`:

[{]: <helper> (diffStep 12.1 files="ChatsListScreen/index" module="client")

#### [__Client__ Step 12.1: Add basic ChatCreationScreen](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/ad2c1a5033da535215e6dbce3113223e1a674d1b)

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;index.tsx
```diff
@@ -3,6 +3,7 @@
 ┊3┊3┊import ChatsList from './ChatsList';
 ┊4┊4┊import styled from 'styled-components';
 ┊5┊5┊import { History } from 'history';
+┊ ┊6┊import AddChatButton from './AddChatButton';
 ┊6┊7┊
 ┊7┊8┊const Container = styled.div`
 ┊8┊9┊  height: 100vh;
```
```diff
@@ -16,6 +17,7 @@
 ┊16┊17┊  <Container>
 ┊17┊18┊    <ChatsNavbar history={history} />
 ┊18┊19┊    <ChatsList history={history} />
+┊  ┊20┊    <AddChatButton history={history} />
 ┊19┊21┊  </Container>
 ┊20┊22┊);
 ┊21┊23┊
```

[}]: #

For now we can only observe the users list. Our goal now is to be able to start chatting with a user once it has been clicked. First we will need to add a new mutation called `addChat` which will create a new chat document and add it to the chats collection. If the chat already exists we will return the existing instance. This behavior will help us navigate to the desired `ChatRoomScreen`, whether it exists or not:

[{]: <helper> (diffStep 9.2 module="server")

#### [__Server__ Step 9.2: Add Mutation.addChat](https://github.com/Urigo/WhatsApp-Clone-Server/commit/c2b32320de655767273803fa9cbe977d4532fb52)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -1,6 +1,6 @@
 ┊1┊1┊import { withFilter } from 'apollo-server-express';
 ┊2┊2┊import { DateTimeResolver, URLResolver } from 'graphql-scalars';
-┊3┊ ┊import { User, Message, chats, messages, users } from '../db';
+┊ ┊3┊import { User, Message, Chat, chats, messages, users } from '../db';
 ┊4┊4┊import { Resolvers } from '../types/graphql';
 ┊5┊5┊
 ┊6┊6┊const resolvers: Resolvers = {
```
```diff
@@ -130,6 +130,31 @@
 ┊130┊130┊
 ┊131┊131┊      return message;
 ┊132┊132┊    },
+┊   ┊133┊
+┊   ┊134┊    addChat(root, { recipientId }, { currentUser }) {
+┊   ┊135┊      if (!currentUser) return null;
+┊   ┊136┊      if (!users.some(u => u.id === recipientId)) return null;
+┊   ┊137┊
+┊   ┊138┊      let chat = chats.find(
+┊   ┊139┊        c =>
+┊   ┊140┊          c.participants.includes(currentUser.id) &&
+┊   ┊141┊          c.participants.includes(recipientId)
+┊   ┊142┊      );
+┊   ┊143┊
+┊   ┊144┊      if (chat) return chat;
+┊   ┊145┊
+┊   ┊146┊      const chatsIds = chats.map(c => Number(c.id));
+┊   ┊147┊
+┊   ┊148┊      chat = {
+┊   ┊149┊        id: String(Math.max(...chatsIds) + 1),
+┊   ┊150┊        participants: [currentUser.id, recipientId],
+┊   ┊151┊        messages: [],
+┊   ┊152┊      };
+┊   ┊153┊
+┊   ┊154┊      chats.push(chat);
+┊   ┊155┊
+┊   ┊156┊      return chat;
+┊   ┊157┊    },
 ┊133┊158┊  },
 ┊134┊159┊
 ┊135┊160┊  Subscription: {
```

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -34,6 +34,7 @@
 ┊34┊34┊
 ┊35┊35┊type Mutation {
 ┊36┊36┊  addMessage(chatId: ID!, content: String!): Message
+┊  ┊37┊  addChat(recipientId: ID!): Chat
 ┊37┊38┊}
 ┊38┊39┊
 ┊39┊40┊type Subscription {
```

##### Added tests&#x2F;mutations&#x2F;\__snapshots__&#x2F;addChat.test.ts.snap
```diff
@@ -0,0 +1,52 @@
+┊  ┊ 1┊// Jest Snapshot v1, https://goo.gl/fbAQLP
+┊  ┊ 2┊
+┊  ┊ 3┊exports[`Mutation.addChat creates a new chat between current user and specified recipient 1`] = `
+┊  ┊ 4┊Object {
+┊  ┊ 5┊  "addChat": Object {
+┊  ┊ 6┊    "id": "5",
+┊  ┊ 7┊    "name": "Bryan Wallace",
+┊  ┊ 8┊    "participants": Array [
+┊  ┊ 9┊      Object {
+┊  ┊10┊        "id": "2",
+┊  ┊11┊      },
+┊  ┊12┊      Object {
+┊  ┊13┊        "id": "3",
+┊  ┊14┊      },
+┊  ┊15┊    ],
+┊  ┊16┊  },
+┊  ┊17┊}
+┊  ┊18┊`;
+┊  ┊19┊
+┊  ┊20┊exports[`Mutation.addChat creates a new chat between current user and specified recipient 2`] = `
+┊  ┊21┊Object {
+┊  ┊22┊  "chat": Object {
+┊  ┊23┊    "id": "5",
+┊  ┊24┊    "name": "Bryan Wallace",
+┊  ┊25┊    "participants": Array [
+┊  ┊26┊      Object {
+┊  ┊27┊        "id": "2",
+┊  ┊28┊      },
+┊  ┊29┊      Object {
+┊  ┊30┊        "id": "3",
+┊  ┊31┊      },
+┊  ┊32┊    ],
+┊  ┊33┊  },
+┊  ┊34┊}
+┊  ┊35┊`;
+┊  ┊36┊
+┊  ┊37┊exports[`Mutation.addChat returns the existing chat if so 1`] = `
+┊  ┊38┊Object {
+┊  ┊39┊  "addChat": Object {
+┊  ┊40┊    "id": "1",
+┊  ┊41┊    "name": "Ethan Gonzalez",
+┊  ┊42┊    "participants": Array [
+┊  ┊43┊      Object {
+┊  ┊44┊        "id": "1",
+┊  ┊45┊      },
+┊  ┊46┊      Object {
+┊  ┊47┊        "id": "2",
+┊  ┊48┊      },
+┊  ┊49┊    ],
+┊  ┊50┊  },
+┊  ┊51┊}
+┊  ┊52┊`;
```

##### Added tests&#x2F;mutations&#x2F;addChat.test.ts
```diff
@@ -0,0 +1,89 @@
+┊  ┊ 1┊import { createTestClient } from 'apollo-server-testing';
+┊  ┊ 2┊import { ApolloServer, PubSub, gql } from 'apollo-server-express';
+┊  ┊ 3┊import schema from '../../schema';
+┊  ┊ 4┊import { resetDb, users } from '../../db';
+┊  ┊ 5┊
+┊  ┊ 6┊describe('Mutation.addChat', () => {
+┊  ┊ 7┊  beforeEach(resetDb);
+┊  ┊ 8┊
+┊  ┊ 9┊  it('creates a new chat between current user and specified recipient', async () => {
+┊  ┊10┊    const server = new ApolloServer({
+┊  ┊11┊      schema,
+┊  ┊12┊      context: () => ({
+┊  ┊13┊        pubsub: new PubSub(),
+┊  ┊14┊        currentUser: users[1],
+┊  ┊15┊      }),
+┊  ┊16┊    });
+┊  ┊17┊
+┊  ┊18┊    const { query, mutate } = createTestClient(server);
+┊  ┊19┊
+┊  ┊20┊    const addChatRes = await mutate({
+┊  ┊21┊      variables: { recipientId: '3' },
+┊  ┊22┊      mutation: gql`
+┊  ┊23┊        mutation AddChat($recipientId: ID!) {
+┊  ┊24┊          addChat(recipientId: $recipientId) {
+┊  ┊25┊            id
+┊  ┊26┊            name
+┊  ┊27┊            participants {
+┊  ┊28┊              id
+┊  ┊29┊            }
+┊  ┊30┊          }
+┊  ┊31┊        }
+┊  ┊32┊      `,
+┊  ┊33┊    });
+┊  ┊34┊
+┊  ┊35┊    expect(addChatRes.data).toBeDefined();
+┊  ┊36┊    expect(addChatRes.errors).toBeUndefined();
+┊  ┊37┊    expect(addChatRes.data).toMatchSnapshot();
+┊  ┊38┊
+┊  ┊39┊    const getChatRes = await query({
+┊  ┊40┊      variables: { chatId: '5' },
+┊  ┊41┊      query: gql`
+┊  ┊42┊        query GetChat($chatId: ID!) {
+┊  ┊43┊          chat(chatId: $chatId) {
+┊  ┊44┊            id
+┊  ┊45┊            name
+┊  ┊46┊            participants {
+┊  ┊47┊              id
+┊  ┊48┊            }
+┊  ┊49┊          }
+┊  ┊50┊        }
+┊  ┊51┊      `,
+┊  ┊52┊    });
+┊  ┊53┊
+┊  ┊54┊    expect(getChatRes.data).toBeDefined();
+┊  ┊55┊    expect(getChatRes.errors).toBeUndefined();
+┊  ┊56┊    expect(getChatRes.data).toMatchSnapshot();
+┊  ┊57┊  });
+┊  ┊58┊
+┊  ┊59┊  it('returns the existing chat if so', async () => {
+┊  ┊60┊    const server = new ApolloServer({
+┊  ┊61┊      schema,
+┊  ┊62┊      context: () => ({
+┊  ┊63┊        pubsub: new PubSub(),
+┊  ┊64┊        currentUser: users[0],
+┊  ┊65┊      }),
+┊  ┊66┊    });
+┊  ┊67┊
+┊  ┊68┊    const { query, mutate } = createTestClient(server);
+┊  ┊69┊
+┊  ┊70┊    const addChatRes = await mutate({
+┊  ┊71┊      variables: { recipientId: '2' },
+┊  ┊72┊      mutation: gql`
+┊  ┊73┊        mutation AddChat($recipientId: ID!) {
+┊  ┊74┊          addChat(recipientId: $recipientId) {
+┊  ┊75┊            id
+┊  ┊76┊            name
+┊  ┊77┊            participants {
+┊  ┊78┊              id
+┊  ┊79┊            }
+┊  ┊80┊          }
+┊  ┊81┊        }
+┊  ┊82┊      `,
+┊  ┊83┊    });
+┊  ┊84┊
+┊  ┊85┊    expect(addChatRes.data).toBeDefined();
+┊  ┊86┊    expect(addChatRes.errors).toBeUndefined();
+┊  ┊87┊    expect(addChatRes.data).toMatchSnapshot();
+┊  ┊88┊  });
+┊  ┊89┊});
```

[}]: #

To use the new mutation, we will define a new callback called `onUserPick` in the `UsersList` so it can be used from the `ChatCreationScreen`:

[{]: <helper> (diffStep 12.2 files="UsersList" module="client")

#### [__Client__ Step 12.2: Create chat on user pick](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/9a1a653766c53e237cdf65f147767ad0f4cedff0)

##### Changed src&#x2F;components&#x2F;UsersList.test.tsx
```diff
@@ -1,6 +1,12 @@
 ┊ 1┊ 1┊import React from 'react';
 ┊ 2┊ 2┊import { ApolloProvider } from '@apollo/react-hooks';
-┊ 3┊  ┊import { cleanup, render, waitFor, screen } from '@testing-library/react';
+┊  ┊ 3┊import {
+┊  ┊ 4┊  cleanup,
+┊  ┊ 5┊  render,
+┊  ┊ 6┊  fireEvent,
+┊  ┊ 7┊  waitFor,
+┊  ┊ 8┊  screen,
+┊  ┊ 9┊} from '@testing-library/react';
 ┊ 4┊10┊import { mockApolloClient } from '../test-helpers';
 ┊ 5┊11┊import UsersList, { UsersListQuery } from './UsersList';
 ┊ 6┊12┊
```
```diff
@@ -42,4 +48,45 @@
 ┊42┊48┊      );
 ┊43┊49┊    }
 ┊44┊50┊  });
+┊  ┊51┊
+┊  ┊52┊  it('triggers onUserPick() callback on user-item click', async () => {
+┊  ┊53┊    const client = mockApolloClient([
+┊  ┊54┊      {
+┊  ┊55┊        request: { query: UsersListQuery },
+┊  ┊56┊        result: {
+┊  ┊57┊          data: {
+┊  ┊58┊            users: [
+┊  ┊59┊              {
+┊  ┊60┊                __typename: 'User',
+┊  ┊61┊                id: 1,
+┊  ┊62┊                name: 'Charles Dickhead',
+┊  ┊63┊                picture: 'https://localhost:4000/dick.jpg',
+┊  ┊64┊              },
+┊  ┊65┊            ],
+┊  ┊66┊          },
+┊  ┊67┊        },
+┊  ┊68┊      },
+┊  ┊69┊    ]);
+┊  ┊70┊
+┊  ┊71┊    const onUserPick = jest.fn(() => {});
+┊  ┊72┊
+┊  ┊73┊    {
+┊  ┊74┊      const { container, getByTestId } = render(
+┊  ┊75┊        <ApolloProvider client={client}>
+┊  ┊76┊          <UsersList onUserPick={onUserPick} />
+┊  ┊77┊        </ApolloProvider>
+┊  ┊78┊      );
+┊  ┊79┊
+┊  ┊80┊      await waitFor(() => screen.getByTestId('user'));
+┊  ┊81┊
+┊  ┊82┊      fireEvent.click(getByTestId('user'));
+┊  ┊83┊
+┊  ┊84┊      await waitFor(() => expect(onUserPick.mock.calls.length).toBe(1));
+┊  ┊85┊
+┊  ┊86┊      expect(onUserPick.mock.calls[0][0].name).toEqual('Charles Dickhead');
+┊  ┊87┊      expect(onUserPick.mock.calls[0][0].picture).toEqual(
+┊  ┊88┊        'https://localhost:4000/dick.jpg'
+┊  ┊89┊      );
+┊  ┊90┊    }
+┊  ┊91┊  });
 ┊45┊92┊});
```

##### Changed src&#x2F;components&#x2F;UsersList.tsx
```diff
@@ -4,7 +4,7 @@
 ┊ 4┊ 4┊import React from 'react';
 ┊ 5┊ 5┊import styled from 'styled-components';
 ┊ 6┊ 6┊import * as fragments from '../graphql/fragments';
-┊ 7┊  ┊import { useUsersListQuery } from '../graphql/types';
+┊  ┊ 7┊import { useUsersListQuery, User } from '../graphql/types';
 ┊ 8┊ 8┊
 ┊ 9┊ 9┊const ActualList = styled(MaterialList)`
 ┊10┊10┊  padding: 0;
```
```diff
@@ -38,7 +38,13 @@
 ┊38┊38┊  ${fragments.user}
 ┊39┊39┊`;
 ┊40┊40┊
-┊41┊  ┊const UsersList: React.FC = () => {
+┊  ┊41┊interface ChildComponentProps {
+┊  ┊42┊  onUserPick: any;
+┊  ┊43┊}
+┊  ┊44┊
+┊  ┊45┊const UsersList: React.FC<ChildComponentProps> = ({
+┊  ┊46┊  onUserPick = (user: User) => {},
+┊  ┊47┊}) => {
 ┊42┊48┊  const { data, loading: loadingUsers } = useUsersListQuery();
 ┊43┊49┊
 ┊44┊50┊  if (data === undefined) return null;
```
```diff
@@ -48,7 +54,11 @@
 ┊48┊54┊    <ActualList>
 ┊49┊55┊      {!loadingUsers &&
 ┊50┊56┊        users.map((user) => (
-┊51┊  ┊          <UserItem key={user.id} button>
+┊  ┊57┊          <UserItem
+┊  ┊58┊            key={user.id}
+┊  ┊59┊            data-testid="user"
+┊  ┊60┊            onClick={onUserPick.bind(null, user)}
+┊  ┊61┊            button>
 ┊52┊62┊            {user !== null && user.picture !== null && (
 ┊53┊63┊              <React.Fragment>
 ┊54┊64┊                <ProfilePicture data-testid="picture" src={user.picture} />
```

[}]: #

In the `ChatCreationScreen/index.tsx` module, we will define an `AddChat` document with `graphql-tag`. Using the `$ yarn codegen` command we can generate the correlated React mutation hook and use it as the `onUserPick` callback:

[{]: <helper> (diffStep 12.2 files="ChatCreationScreen/index" module="client")

#### [__Client__ Step 12.2: Create chat on user pick](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/9a1a653766c53e237cdf65f147767ad0f4cedff0)

##### Changed src&#x2F;components&#x2F;ChatCreationScreen&#x2F;index.tsx
```diff
@@ -1,8 +1,12 @@
+┊  ┊ 1┊import gql from 'graphql-tag';
 ┊ 1┊ 2┊import React from 'react';
+┊  ┊ 3┊import { useCallback } from 'react';
 ┊ 2┊ 4┊import styled from 'styled-components';
+┊  ┊ 5┊import * as fragments from '../../graphql/fragments';
 ┊ 3┊ 6┊import UsersList from '../UsersList';
 ┊ 4┊ 7┊import ChatCreationNavbar from './ChatCreationNavbar';
 ┊ 5┊ 8┊import { History } from 'history';
+┊  ┊ 9┊import { useAddChatMutation } from '../../graphql/types';
 ┊ 6┊10┊
 ┊ 7┊11┊// eslint-disable-next-line
 ┊ 8┊12┊const Container = styled.div`
```
```diff
@@ -15,15 +19,52 @@
 ┊15┊19┊  height: calc(100% - 56px);
 ┊16┊20┊`;
 ┊17┊21┊
+┊  ┊22┊gql`
+┊  ┊23┊  mutation AddChat($recipientId: ID!) {
+┊  ┊24┊    addChat(recipientId: $recipientId) {
+┊  ┊25┊      ...Chat
+┊  ┊26┊    }
+┊  ┊27┊  }
+┊  ┊28┊  ${fragments.chat}
+┊  ┊29┊`;
+┊  ┊30┊
 ┊18┊31┊interface ChildComponentProps {
 ┊19┊32┊  history: History;
 ┊20┊33┊}
 ┊21┊34┊
-┊22┊  ┊const ChatCreationScreen: React.FC<ChildComponentProps> = ({ history }) => (
-┊23┊  ┊  <div>
-┊24┊  ┊    <ChatCreationNavbar history={history} />
-┊25┊  ┊    <UsersList />
-┊26┊  ┊  </div>
-┊27┊  ┊);
+┊  ┊35┊const ChatCreationScreen: React.FC<ChildComponentProps> = ({ history }) => {
+┊  ┊36┊  const [addChat] = useAddChatMutation();
+┊  ┊37┊
+┊  ┊38┊  const onUserPick = useCallback(
+┊  ┊39┊    (user) =>
+┊  ┊40┊      addChat({
+┊  ┊41┊        optimisticResponse: {
+┊  ┊42┊          __typename: 'Mutation',
+┊  ┊43┊          addChat: {
+┊  ┊44┊            __typename: 'Chat',
+┊  ┊45┊            id: Math.random().toString(36).substr(2, 9),
+┊  ┊46┊            name: user.name,
+┊  ┊47┊            picture: user.picture,
+┊  ┊48┊            lastMessage: null,
+┊  ┊49┊          },
+┊  ┊50┊        },
+┊  ┊51┊        variables: {
+┊  ┊52┊          recipientId: user.id,
+┊  ┊53┊        },
+┊  ┊54┊      }).then((result) => {
+┊  ┊55┊        if (result && result.data !== null) {
+┊  ┊56┊          history.push(`/chats/${result.data!.addChat!.id}`);
+┊  ┊57┊        }
+┊  ┊58┊      }),
+┊  ┊59┊    [addChat, history]
+┊  ┊60┊  );
+┊  ┊61┊
+┊  ┊62┊  return (
+┊  ┊63┊    <div>
+┊  ┊64┊      <ChatCreationNavbar history={history} />
+┊  ┊65┊      <UsersList onUserPick={onUserPick} />
+┊  ┊66┊    </div>
+┊  ┊67┊  );
+┊  ┊68┊};
 ┊28┊69┊
 ┊29┊70┊export default ChatCreationScreen;
```

[}]: #

Chats can now be created, you can test out the function by signing in with different users. However, the chats list in the `ChatsListScreen` will not be updated unless we refresh the page manually. In the server project, we will define a new subscription called `chatAdded`. The subscription should be broadcasted to the current user only if he is a participant of the published chat:

[{]: <helper> (diffStep 9.3 module="server")

#### [__Server__ Step 9.3: Add Subscription.chatAdded](https://github.com/Urigo/WhatsApp-Clone-Server/commit/ae2b6d31a6d71b433c079db7ca1de40e23a61e9e)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -131,7 +131,7 @@
 ┊131┊131┊      return message;
 ┊132┊132┊    },
 ┊133┊133┊
-┊134┊   ┊    addChat(root, { recipientId }, { currentUser }) {
+┊   ┊134┊    addChat(root, { recipientId }, { currentUser, pubsub }) {
 ┊135┊135┊      if (!currentUser) return null;
 ┊136┊136┊      if (!users.some(u => u.id === recipientId)) return null;
 ┊137┊137┊
```
```diff
@@ -153,6 +153,10 @@
 ┊153┊153┊
 ┊154┊154┊      chats.push(chat);
 ┊155┊155┊
+┊   ┊156┊      pubsub.publish('chatAdded', {
+┊   ┊157┊        chatAdded: chat,
+┊   ┊158┊      });
+┊   ┊159┊
 ┊156┊160┊      return chat;
 ┊157┊161┊    },
 ┊158┊162┊  },
```
```diff
@@ -170,6 +174,17 @@
 ┊170┊174┊        }
 ┊171┊175┊      ),
 ┊172┊176┊    },
+┊   ┊177┊
+┊   ┊178┊    chatAdded: {
+┊   ┊179┊      subscribe: withFilter(
+┊   ┊180┊        (root, args, { pubsub }) => pubsub.asyncIterator('chatAdded'),
+┊   ┊181┊        ({ chatAdded }: { chatAdded: Chat }, args, { currentUser }) => {
+┊   ┊182┊          if (!currentUser) return false;
+┊   ┊183┊
+┊   ┊184┊          return chatAdded.participants.some(p => p === currentUser.id);
+┊   ┊185┊        }
+┊   ┊186┊      ),
+┊   ┊187┊    },
 ┊173┊188┊  },
 ┊174┊189┊};
 ┊175┊190┊
```

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -39,4 +39,5 @@
 ┊39┊39┊
 ┊40┊40┊type Subscription {
 ┊41┊41┊  messageAdded: Message!
+┊  ┊42┊  chatAdded: Chat!
 ┊42┊43┊}
```

[}]: #

Now we will listen to the new subscription in the client and update the cache. First we will define the subscription document:

[{]: <helper> (diffStep 12.3 files="graphql/subscriptions" module="client")

#### [__Client__ Step 12.3: Write chat on chatAdded](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/978055ea2ebbf72aabe14cc3ab66548a9813cfab)

##### Added src&#x2F;graphql&#x2F;subscriptions&#x2F;chatAdded.subscription.ts
```diff
@@ -0,0 +1,11 @@
+┊  ┊ 1┊import gql from 'graphql-tag';
+┊  ┊ 2┊import * as fragments from '../fragments';
+┊  ┊ 3┊
+┊  ┊ 4┊export default gql`
+┊  ┊ 5┊  subscription ChatAdded {
+┊  ┊ 6┊    chatAdded {
+┊  ┊ 7┊      ...Chat
+┊  ┊ 8┊    }
+┊  ┊ 9┊  }
+┊  ┊10┊  ${fragments.chat}
+┊  ┊11┊`;
```

##### Changed src&#x2F;graphql&#x2F;subscriptions&#x2F;index.ts
```diff
@@ -1 +1,2 @@
 ┊1┊1┊export { default as messageAdded } from './messageAdded.subscription';
+┊ ┊2┊export { default as chatAdded } from './chatAdded.subscription';
```

[}]: #

And then we will update the `cache.service` to write the broadcasted chat to the store. We will write the fragment, and we will also update the `chats` query to contain the new chat. We will also check if the chat already exists before we update the query, because remember, the `addChat` mutation will return the chat even if it already exists, not if it was created only:

[{]: <helper> (diffStep 12.3 module="client")

#### [__Client__ Step 12.3: Write chat on chatAdded](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/978055ea2ebbf72aabe14cc3ab66548a9813cfab)

##### Changed src&#x2F;components&#x2F;ChatCreationScreen&#x2F;index.tsx
```diff
@@ -7,6 +7,7 @@
 ┊ 7┊ 7┊import ChatCreationNavbar from './ChatCreationNavbar';
 ┊ 8┊ 8┊import { History } from 'history';
 ┊ 9┊ 9┊import { useAddChatMutation } from '../../graphql/types';
+┊  ┊10┊import { writeChat } from '../../services/cache.service';
 ┊10┊11┊
 ┊11┊12┊// eslint-disable-next-line
 ┊12┊13┊const Container = styled.div`
```
```diff
@@ -51,6 +52,11 @@
 ┊51┊52┊        variables: {
 ┊52┊53┊          recipientId: user.id,
 ┊53┊54┊        },
+┊  ┊55┊        update: (client, { data }) => {
+┊  ┊56┊          if (data && data.addChat) {
+┊  ┊57┊            writeChat(client, data.addChat);
+┊  ┊58┊          }
+┊  ┊59┊        },
 ┊54┊60┊      }).then((result) => {
 ┊55┊61┊        if (result && result.data !== null) {
 ┊56┊62┊          history.push(`/chats/${result.data!.addChat!.id}`);
```

##### Added src&#x2F;graphql&#x2F;subscriptions&#x2F;chatAdded.subscription.ts
```diff
@@ -0,0 +1,11 @@
+┊  ┊ 1┊import gql from 'graphql-tag';
+┊  ┊ 2┊import * as fragments from '../fragments';
+┊  ┊ 3┊
+┊  ┊ 4┊export default gql`
+┊  ┊ 5┊  subscription ChatAdded {
+┊  ┊ 6┊    chatAdded {
+┊  ┊ 7┊      ...Chat
+┊  ┊ 8┊    }
+┊  ┊ 9┊  }
+┊  ┊10┊  ${fragments.chat}
+┊  ┊11┊`;
```

##### Changed src&#x2F;graphql&#x2F;subscriptions&#x2F;index.ts
```diff
@@ -1 +1,2 @@
 ┊1┊1┊export { default as messageAdded } from './messageAdded.subscription';
+┊ ┊2┊export { default as chatAdded } from './chatAdded.subscription';
```

##### Changed src&#x2F;services&#x2F;cache.service.ts
```diff
@@ -6,6 +6,9 @@
 ┊ 6┊ 6┊  MessageFragment,
 ┊ 7┊ 7┊  useMessageAddedSubscription,
 ┊ 8┊ 8┊  ChatsQuery,
+┊  ┊ 9┊  ChatFragment,
+┊  ┊10┊  useMessageAddedSubscription,
+┊  ┊11┊  useChatAddedSubscription,
 ┊ 9┊12┊} from '../graphql/types';
 ┊10┊13┊
 ┊11┊14┊type Client = Pick<
```
```diff
@@ -21,6 +24,14 @@
 ┊21┊24┊      }
 ┊22┊25┊    },
 ┊23┊26┊  });
+┊  ┊27┊
+┊  ┊28┊  useChatAddedSubscription({
+┊  ┊29┊    onSubscriptionData: ({ client, subscriptionData: { data } }) => {
+┊  ┊30┊      if (data) {
+┊  ┊31┊        writeChat(client, data.chatAdded);
+┊  ┊32┊      }
+┊  ┊33┊    },
+┊  ┊34┊  });
 ┊24┊35┊};
 ┊25┊36┊
 ┊26┊37┊export const writeMessage = (client: Client, message: MessageFragment) => {
```
```diff
@@ -90,3 +101,40 @@
 ┊ 90┊101┊    data: { chats: chats },
 ┊ 91┊102┊  });
 ┊ 92┊103┊};
+┊   ┊104┊
+┊   ┊105┊export const writeChat = (client: Client, chat: ChatFragment) => {
+┊   ┊106┊  const chatId = defaultDataIdFromObject(chat);
+┊   ┊107┊  if (chatId === null) {
+┊   ┊108┊    return;
+┊   ┊109┊  }
+┊   ┊110┊
+┊   ┊111┊  client.writeFragment({
+┊   ┊112┊    id: chatId,
+┊   ┊113┊    fragment: fragments.chat,
+┊   ┊114┊    fragmentName: 'Chat',
+┊   ┊115┊    data: chat,
+┊   ┊116┊  });
+┊   ┊117┊
+┊   ┊118┊  let data;
+┊   ┊119┊  try {
+┊   ┊120┊    data = client.readQuery<ChatsQuery>({
+┊   ┊121┊      query: queries.chats,
+┊   ┊122┊    });
+┊   ┊123┊  } catch (e) {
+┊   ┊124┊    return;
+┊   ┊125┊  }
+┊   ┊126┊
+┊   ┊127┊  if (!data) return;
+┊   ┊128┊
+┊   ┊129┊  const chats = data.chats;
+┊   ┊130┊
+┊   ┊131┊  if (!chats) return;
+┊   ┊132┊  if (chats.some((c: any) => c.id === chat.id)) return;
+┊   ┊133┊
+┊   ┊134┊  chats.unshift(chat);
+┊   ┊135┊
+┊   ┊136┊  client.writeQuery({
+┊   ┊137┊    query: queries.chats,
+┊   ┊138┊    data: { chats },
+┊   ┊139┊  });
+┊   ┊140┊};
```

[}]: #

Now we can create new chats, and the chats list would be updated, without refreshing the page. You can also test it with 2 separate sessions in the browser and see how each tab/window affects the other. Lastly, we will implement a chat removal function. This is important as we don’t want to garbage our chats collection, sometimes we would like to clean up some of them.

In the back-end, let’s implement the `removeChat` mutation. The chat can only be removed only if the current user is one of the chat’s participants. The mutation will also remove all the messages which are related to the target chat, since we’re not gonna use them anymore. The chat will be removed for all participants. This is not exactly the behavior of the original Whatsapp, but to keep things simple we will go with that solution:

[{]: <helper> (diffStep 9.4 module="server")

#### [__Server__ Step 9.4: Add Mutation.removeChat](https://github.com/Urigo/WhatsApp-Clone-Server/commit/586d131f94defb46ffc89952b7d64d97a11c3ac7)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -159,6 +159,30 @@
 ┊159┊159┊
 ┊160┊160┊      return chat;
 ┊161┊161┊    },
+┊   ┊162┊
+┊   ┊163┊    removeChat(root, { chatId }, { currentUser }) {
+┊   ┊164┊      if (!currentUser) return null;
+┊   ┊165┊
+┊   ┊166┊      const chatIndex = chats.findIndex(c => c.id === chatId);
+┊   ┊167┊
+┊   ┊168┊      if (chatIndex === -1) return null;
+┊   ┊169┊
+┊   ┊170┊      const chat = chats[chatIndex];
+┊   ┊171┊
+┊   ┊172┊      if (!chat.participants.some(p => p === currentUser.id)) return null;
+┊   ┊173┊
+┊   ┊174┊      chat.messages.forEach(chatMessage => {
+┊   ┊175┊        const chatMessageIndex = messages.findIndex(m => m.id === chatMessage);
+┊   ┊176┊
+┊   ┊177┊        if (chatMessageIndex !== -1) {
+┊   ┊178┊          messages.splice(chatMessageIndex, 1);
+┊   ┊179┊        }
+┊   ┊180┊      });
+┊   ┊181┊
+┊   ┊182┊      chats.splice(chatIndex, 1);
+┊   ┊183┊
+┊   ┊184┊      return chatId;
+┊   ┊185┊    },
 ┊162┊186┊  },
 ┊163┊187┊
 ┊164┊188┊  Subscription: {
```

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -35,6 +35,7 @@
 ┊35┊35┊type Mutation {
 ┊36┊36┊  addMessage(chatId: ID!, content: String!): Message
 ┊37┊37┊  addChat(recipientId: ID!): Chat
+┊  ┊38┊  removeChat(chatId: ID!): ID
 ┊38┊39┊}
 ┊39┊40┊
 ┊40┊41┊type Subscription {
```

##### Added tests&#x2F;mutations&#x2F;removeChat.test.ts
```diff
@@ -0,0 +1,52 @@
+┊  ┊ 1┊import { createTestClient } from 'apollo-server-testing';
+┊  ┊ 2┊import { ApolloServer, PubSub, gql } from 'apollo-server-express';
+┊  ┊ 3┊import schema from '../../schema';
+┊  ┊ 4┊import { resetDb, users } from '../../db';
+┊  ┊ 5┊
+┊  ┊ 6┊describe('Mutation.removeChat', () => {
+┊  ┊ 7┊  beforeEach(resetDb);
+┊  ┊ 8┊
+┊  ┊ 9┊  it('removes chat by id', async () => {
+┊  ┊10┊    const server = new ApolloServer({
+┊  ┊11┊      schema,
+┊  ┊12┊      context: () => ({
+┊  ┊13┊        pubsub: new PubSub(),
+┊  ┊14┊        currentUser: users[0],
+┊  ┊15┊      }),
+┊  ┊16┊    });
+┊  ┊17┊
+┊  ┊18┊    const { query, mutate } = createTestClient(server);
+┊  ┊19┊
+┊  ┊20┊    const addChatRes = await mutate({
+┊  ┊21┊      variables: { chatId: '1' },
+┊  ┊22┊      mutation: gql`
+┊  ┊23┊        mutation RemoveChat($chatId: ID!) {
+┊  ┊24┊          removeChat(chatId: $chatId)
+┊  ┊25┊        }
+┊  ┊26┊      `,
+┊  ┊27┊    });
+┊  ┊28┊
+┊  ┊29┊    expect(addChatRes.data).toBeDefined();
+┊  ┊30┊    expect(addChatRes.errors).toBeUndefined();
+┊  ┊31┊    expect(addChatRes.data!.removeChat).toEqual('1');
+┊  ┊32┊
+┊  ┊33┊    const getChatRes = await query({
+┊  ┊34┊      variables: { chatId: '1' },
+┊  ┊35┊      query: gql`
+┊  ┊36┊        query GetChat($chatId: ID!) {
+┊  ┊37┊          chat(chatId: $chatId) {
+┊  ┊38┊            id
+┊  ┊39┊            name
+┊  ┊40┊            participants {
+┊  ┊41┊              id
+┊  ┊42┊            }
+┊  ┊43┊          }
+┊  ┊44┊        }
+┊  ┊45┊      `,
+┊  ┊46┊    });
+┊  ┊47┊
+┊  ┊48┊    expect(addChatRes.data).toBeDefined();
+┊  ┊49┊    expect(getChatRes.errors).toBeUndefined();
+┊  ┊50┊    expect(addChatRes.data!.chat).toBeUndefined();
+┊  ┊51┊  });
+┊  ┊52┊});
```

[}]: #

In the client app, a chat could be removed directly from the `ChatRoomScreen`. On the top right corner, right on the navbar, we will add a dispose button that will call the `removeChat` mutation. Just like we did before, we will define the mutation document with `graphql-tag` and generate the correlated hook with CodeGen:

[{]: <helper> (diffStep 12.4 module="client")

#### [__Client__ Step 12.4: Add chat removal function](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/facf5c0fc167dbe0ecccdb69667873ffcea7e765)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;ChatNavbar.test.tsx
```diff
@@ -1,12 +1,17 @@
 ┊ 1┊ 1┊import { createMemoryHistory } from 'history';
 ┊ 2┊ 2┊import React from 'react';
+┊  ┊ 3┊import { ApolloProvider } from '@apollo/react-hooks';
 ┊ 3┊ 4┊import { cleanup, render, waitFor, fireEvent } from '@testing-library/react';
+┊  ┊ 5┊import { mockApolloClient } from '../../test-helpers';
 ┊ 4┊ 6┊import ChatNavbar from './ChatNavbar';
+┊  ┊ 7┊import { RemoveChatDocument } from '../../graphql/types';
 ┊ 5┊ 8┊
 ┊ 6┊ 9┊describe('ChatNavbar', () => {
 ┊ 7┊10┊  afterEach(cleanup);
 ┊ 8┊11┊
 ┊ 9┊12┊  it('renders chat data', () => {
+┊  ┊13┊    const client = mockApolloClient();
+┊  ┊14┊
 ┊10┊15┊    const time = new Date('1 Jan 2019 GMT');
 ┊11┊16┊    const chat = {
 ┊12┊17┊      id: '1',
```
```diff
@@ -30,7 +35,9 @@
 ┊30┊35┊
 ┊31┊36┊    {
 ┊32┊37┊      const { container, getByTestId } = render(
-┊33┊  ┊        <ChatNavbar chat={chat} history={history} />
+┊  ┊38┊        <ApolloProvider client={client}>
+┊  ┊39┊          <ChatNavbar chat={chat} history={history} />
+┊  ┊40┊        </ApolloProvider>
 ┊34┊41┊      );
 ┊35┊42┊
 ┊36┊43┊      expect(getByTestId('chat-name')).toHaveTextContent('Foo Bar');
```
```diff
@@ -42,6 +49,8 @@
 ┊42┊49┊  });
 ┊43┊50┊
 ┊44┊51┊  it('goes back on arrow click', async () => {
+┊  ┊52┊    const client = mockApolloClient();
+┊  ┊53┊
 ┊45┊54┊    const time = new Date('1 Jan 2019 GMT');
 ┊46┊55┊    const chat = {
 ┊47┊56┊      id: '1',
```
```diff
@@ -69,7 +78,9 @@
 ┊69┊78┊
 ┊70┊79┊    {
 ┊71┊80┊      const { container, getByTestId } = render(
-┊72┊  ┊        <ChatNavbar chat={chat} history={history} />
+┊  ┊81┊        <ApolloProvider client={client}>
+┊  ┊82┊          <ChatNavbar chat={chat} history={history} />
+┊  ┊83┊        </ApolloProvider>
 ┊73┊84┊      );
 ┊74┊85┊
 ┊75┊86┊      fireEvent.click(getByTestId('back-button'));
```
```diff
@@ -77,4 +88,57 @@
 ┊ 77┊ 88┊      await waitFor(() => expect(history.location.pathname).toEqual('/chats'));
 ┊ 78┊ 89┊    }
 ┊ 79┊ 90┊  });
+┊   ┊ 91┊
+┊   ┊ 92┊  it('goes back on chat removal', async () => {
+┊   ┊ 93┊    const client = mockApolloClient([
+┊   ┊ 94┊      {
+┊   ┊ 95┊        request: {
+┊   ┊ 96┊          query: RemoveChatDocument,
+┊   ┊ 97┊          variables: { chatId: '1' },
+┊   ┊ 98┊        },
+┊   ┊ 99┊        result: {
+┊   ┊100┊          data: {
+┊   ┊101┊            removeChat: '1',
+┊   ┊102┊          },
+┊   ┊103┊        },
+┊   ┊104┊      },
+┊   ┊105┊    ]);
+┊   ┊106┊
+┊   ┊107┊    const time = new Date('1 Jan 2019 GMT');
+┊   ┊108┊    const chat = {
+┊   ┊109┊      id: '1',
+┊   ┊110┊      name: 'Foo Bar',
+┊   ┊111┊      picture: 'https://localhost:4000/picture.jpg',
+┊   ┊112┊      messages: [
+┊   ┊113┊        {
+┊   ┊114┊          id: '1',
+┊   ┊115┊          content: 'foo',
+┊   ┊116┊          createdAt: time,
+┊   ┊117┊        },
+┊   ┊118┊        {
+┊   ┊119┊          id: '2',
+┊   ┊120┊          content: 'bar',
+┊   ┊121┊          createdAt: time,
+┊   ┊122┊        },
+┊   ┊123┊      ],
+┊   ┊124┊    };
+┊   ┊125┊
+┊   ┊126┊    const history = createMemoryHistory();
+┊   ┊127┊
+┊   ┊128┊    history.push('/chats/1');
+┊   ┊129┊
+┊   ┊130┊    await waitFor(() => expect(history.location.pathname).toEqual('/chats/1'));
+┊   ┊131┊
+┊   ┊132┊    {
+┊   ┊133┊      const { container, getByTestId } = render(
+┊   ┊134┊        <ApolloProvider client={client}>
+┊   ┊135┊          <ChatNavbar chat={chat} history={history} />
+┊   ┊136┊        </ApolloProvider>
+┊   ┊137┊      );
+┊   ┊138┊
+┊   ┊139┊      fireEvent.click(getByTestId('delete-button'));
+┊   ┊140┊
+┊   ┊141┊      await waitFor(() => expect(history.location.pathname).toEqual('/chats'));
+┊   ┊142┊    }
+┊   ┊143┊  });
 ┊ 80┊144┊});
```

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;ChatNavbar.tsx
```diff
@@ -1,10 +1,13 @@
 ┊ 1┊ 1┊import Button from '@material-ui/core/Button';
 ┊ 2┊ 2┊import Toolbar from '@material-ui/core/Toolbar';
 ┊ 3┊ 3┊import ArrowBackIcon from '@material-ui/icons/ArrowBack';
+┊  ┊ 4┊import DeleteIcon from '@material-ui/icons/Delete';
+┊  ┊ 5┊import gql from 'graphql-tag';
 ┊ 4┊ 6┊import React from 'react';
 ┊ 5┊ 7┊import { useCallback } from 'react';
 ┊ 6┊ 8┊import styled from 'styled-components';
 ┊ 7┊ 9┊import { History } from 'history';
+┊  ┊10┊import { useRemoveChatMutation } from '../../graphql/types';
 ┊ 8┊11┊
 ┊ 9┊12┊const Container = styled(Toolbar)`
 ┊10┊13┊  padding: 0;
```
```diff
@@ -20,6 +23,12 @@
 ┊20┊23┊  }
 ┊21┊24┊`;
 ┊22┊25┊
+┊  ┊26┊const Rest = styled.div`
+┊  ┊27┊  flex: 1;
+┊  ┊28┊  display: flex;
+┊  ┊29┊  justify-content: flex-end;
+┊  ┊30┊`;
+┊  ┊31┊
 ┊23┊32┊const Picture = styled.img`
 ┊24┊33┊  height: 40px;
 ┊25┊34┊  width: 40px;
```
```diff
@@ -34,15 +43,38 @@
 ┊34┊43┊  line-height: 56px;
 ┊35┊44┊`;
 ┊36┊45┊
+┊  ┊46┊const DeleteButton = styled(Button)`
+┊  ┊47┊  color: var(--primary-text) !important;
+┊  ┊48┊`;
+┊  ┊49┊
+┊  ┊50┊export const removeChatMutation = gql`
+┊  ┊51┊  mutation RemoveChat($chatId: ID!) {
+┊  ┊52┊    removeChat(chatId: $chatId)
+┊  ┊53┊  }
+┊  ┊54┊`;
+┊  ┊55┊
 ┊37┊56┊interface ChatNavbarProps {
 ┊38┊57┊  history: History;
-┊39┊  ┊  chat?: {
+┊  ┊58┊  chat: {
 ┊40┊59┊    picture?: string | null;
 ┊41┊60┊    name?: string | null;
+┊  ┊61┊    id: string;
 ┊42┊62┊  };
 ┊43┊63┊}
 ┊44┊64┊
 ┊45┊65┊const ChatNavbar: React.FC<ChatNavbarProps> = ({ chat, history }) => {
+┊  ┊66┊  const [removeChat] = useRemoveChatMutation({
+┊  ┊67┊    variables: {
+┊  ┊68┊      chatId: chat.id,
+┊  ┊69┊    },
+┊  ┊70┊  });
+┊  ┊71┊
+┊  ┊72┊  const handleRemoveChat = useCallback(() => {
+┊  ┊73┊    removeChat().then(() => {
+┊  ┊74┊      history.replace('/chats');
+┊  ┊75┊    });
+┊  ┊76┊  }, [removeChat, history]);
+┊  ┊77┊
 ┊46┊78┊  const navBack = useCallback(() => {
 ┊47┊79┊    history.replace('/chats');
 ┊48┊80┊  }, [history]);
```
```diff
@@ -58,6 +90,11 @@
 ┊ 58┊ 90┊          <Name data-testid="chat-name">{chat.name}</Name>
 ┊ 59┊ 91┊        </React.Fragment>
 ┊ 60┊ 92┊      )}
+┊   ┊ 93┊      <Rest>
+┊   ┊ 94┊        <DeleteButton data-testid="delete-button" onClick={handleRemoveChat}>
+┊   ┊ 95┊          <DeleteIcon />
+┊   ┊ 96┊        </DeleteButton>
+┊   ┊ 97┊      </Rest>
 ┊ 61┊ 98┊    </Container>
 ┊ 62┊ 99┊  );
 ┊ 63┊100┊};
```

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -97,7 +97,7 @@
 ┊ 97┊ 97┊
 ┊ 98┊ 98┊  return (
 ┊ 99┊ 99┊    <Container>
-┊100┊   ┊      <ChatNavbar chat={chat} history={history} />
+┊   ┊100┊      {chat?.id && <ChatNavbar chat={chat} history={history} />}
 ┊101┊101┊      {chat?.messages && <MessagesList messages={chat.messages} />}
 ┊102┊102┊      <MessageInput onSendMessage={onSendMessage} />
 ┊103┊103┊    </Container>
```

[}]: #

Normally this is a dangerous behavior because we wipe out the entire history without any warnings, which is not recommended. For tutoring purposes only we will keep it the way it is, because it makes things simple and easier to understand.

To be able to update the chats list cache, we will implement a `chatRemoved` subscription. The subscription will be broadcasted only to those who’re participants of the published chat:

[{]: <helper> (diffStep 9.5 module="server")

#### [__Server__ Step 9.5: Add Subscription.chatRemoved](https://github.com/Urigo/WhatsApp-Clone-Server/commit/24ecfe88c6fb3e25de18aa62c4aaa01e244801f1)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -160,7 +160,7 @@
 ┊160┊160┊      return chat;
 ┊161┊161┊    },
 ┊162┊162┊
-┊163┊   ┊    removeChat(root, { chatId }, { currentUser }) {
+┊   ┊163┊    removeChat(root, { chatId }, { currentUser, pubsub }) {
 ┊164┊164┊      if (!currentUser) return null;
 ┊165┊165┊
 ┊166┊166┊      const chatIndex = chats.findIndex(c => c.id === chatId);
```
```diff
@@ -181,6 +181,11 @@
 ┊181┊181┊
 ┊182┊182┊      chats.splice(chatIndex, 1);
 ┊183┊183┊
+┊   ┊184┊      pubsub.publish('chatRemoved', {
+┊   ┊185┊        chatRemoved: chat.id,
+┊   ┊186┊        targetChat: chat,
+┊   ┊187┊      });
+┊   ┊188┊
 ┊184┊189┊      return chatId;
 ┊185┊190┊    },
 ┊186┊191┊  },
```
```diff
@@ -209,6 +214,17 @@
 ┊209┊214┊        }
 ┊210┊215┊      ),
 ┊211┊216┊    },
+┊   ┊217┊
+┊   ┊218┊    chatRemoved: {
+┊   ┊219┊      subscribe: withFilter(
+┊   ┊220┊        (root, args, { pubsub }) => pubsub.asyncIterator('chatRemoved'),
+┊   ┊221┊        ({ targetChat }: { targetChat: Chat }, args, { currentUser }) => {
+┊   ┊222┊          if (!currentUser) return false;
+┊   ┊223┊
+┊   ┊224┊          return targetChat.participants.some(p => p === currentUser.id);
+┊   ┊225┊        }
+┊   ┊226┊      ),
+┊   ┊227┊    },
 ┊212┊228┊  },
 ┊213┊229┊};
 ┊214┊230┊
```

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -41,4 +41,5 @@
 ┊41┊41┊type Subscription {
 ┊42┊42┊  messageAdded: Message!
 ┊43┊43┊  chatAdded: Chat!
+┊  ┊44┊  chatRemoved: ID!
 ┊44┊45┊}
```

[}]: #

In the client, we will define the right subscription document:

[{]: <helper> (diffStep 12.5 files="graphql/subscriptions" module="client")

#### [__Client__ Step 12.5: Update cache on chat removal](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/8b52fbb0bb6762cb080d9f8f6bf276fbcdfc835c)

##### Added src&#x2F;graphql&#x2F;subscriptions&#x2F;chatRemoved.subscription.ts
```diff
@@ -0,0 +1,7 @@
+┊ ┊1┊import gql from 'graphql-tag';
+┊ ┊2┊
+┊ ┊3┊export default gql`
+┊ ┊4┊  subscription ChatRemoved {
+┊ ┊5┊    chatRemoved
+┊ ┊6┊  }
+┊ ┊7┊`;
```

##### Changed src&#x2F;graphql&#x2F;subscriptions&#x2F;index.ts
```diff
@@ -1,2 +1,3 @@
 ┊1┊1┊export { default as messageAdded } from './messageAdded.subscription';
 ┊2┊2┊export { default as chatAdded } from './chatAdded.subscription';
+┊ ┊3┊export { default as chatRemoved } from './chatRemoved.subscription';
```

[}]: #

And we will update the `cache.service` to listen to the new subscription and update the `chats` query accordingly. When we deal with the fragment, we remove the `FullChat` fragment because it consists of the `Chat` fragment. If it was the other way around, we would still have some data leftovers from the `FullChat` on the fragment, because of how Apollo-Cache manages the store:

[{]: <helper> (diffStep 12.5 files="cache.service" module="client")

#### [__Client__ Step 12.5: Update cache on chat removal](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/8b52fbb0bb6762cb080d9f8f6bf276fbcdfc835c)

##### Changed src&#x2F;services&#x2F;cache.service.ts
```diff
@@ -9,6 +9,7 @@
 ┊ 9┊ 9┊  ChatFragment,
 ┊10┊10┊  useMessageAddedSubscription,
 ┊11┊11┊  useChatAddedSubscription,
+┊  ┊12┊  useChatRemovedSubscription,
 ┊12┊13┊} from '../graphql/types';
 ┊13┊14┊
 ┊14┊15┊type Client = Pick<
```
```diff
@@ -32,6 +33,14 @@
 ┊32┊33┊      }
 ┊33┊34┊    },
 ┊34┊35┊  });
+┊  ┊36┊
+┊  ┊37┊  useChatRemovedSubscription({
+┊  ┊38┊    onSubscriptionData: ({ client, subscriptionData: { data } }) => {
+┊  ┊39┊      if (data) {
+┊  ┊40┊        eraseChat(client, data.chatRemoved);
+┊  ┊41┊      }
+┊  ┊42┊    },
+┊  ┊43┊  });
 ┊35┊44┊};
 ┊36┊45┊
 ┊37┊46┊export const writeMessage = (client: Client, message: MessageFragment) => {
```
```diff
@@ -138,3 +147,49 @@
 ┊138┊147┊    data: { chats },
 ┊139┊148┊  });
 ┊140┊149┊};
+┊   ┊150┊
+┊   ┊151┊export const eraseChat = (client: Client, chatId: string) => {
+┊   ┊152┊  const chatType = {
+┊   ┊153┊    __typename: 'Chat',
+┊   ┊154┊    id: chatId,
+┊   ┊155┊  };
+┊   ┊156┊
+┊   ┊157┊  const chatIdFromObject = defaultDataIdFromObject(chatType);
+┊   ┊158┊  if (chatIdFromObject === null) {
+┊   ┊159┊    return;
+┊   ┊160┊  }
+┊   ┊161┊
+┊   ┊162┊  client.writeFragment({
+┊   ┊163┊    id: chatIdFromObject,
+┊   ┊164┊    fragment: fragments.fullChat,
+┊   ┊165┊    fragmentName: 'FullChat',
+┊   ┊166┊    data: null,
+┊   ┊167┊  });
+┊   ┊168┊
+┊   ┊169┊  let data: ChatsQuery | null;
+┊   ┊170┊  try {
+┊   ┊171┊    data = client.readQuery<ChatsQuery>({
+┊   ┊172┊      query: queries.chats,
+┊   ┊173┊    });
+┊   ┊174┊  } catch (e) {
+┊   ┊175┊    return;
+┊   ┊176┊  }
+┊   ┊177┊
+┊   ┊178┊  if (!data || !data.chats) return;
+┊   ┊179┊
+┊   ┊180┊  const chats = data.chats;
+┊   ┊181┊
+┊   ┊182┊  if (!chats) return;
+┊   ┊183┊
+┊   ┊184┊  const chatIndex = chats.findIndex((c: any) => c.id === chatId);
+┊   ┊185┊
+┊   ┊186┊  if (chatIndex === -1) return;
+┊   ┊187┊
+┊   ┊188┊  // The chat will appear at the top of the ChatsList component
+┊   ┊189┊  chats.splice(chatIndex, 1);
+┊   ┊190┊
+┊   ┊191┊  client.writeQuery({
+┊   ┊192┊    query: queries.chats,
+┊   ┊193┊    data: { chats: chats },
+┊   ┊194┊  });
+┊   ┊195┊};
```

[}]: #

We will also update the `ChatRoomScreen` to redirect us to the `/chats` route if the chat was not found.

The render method of the component will be re-triggered automatically by `@apollo/react-hooks` if the cached result of `useGetChat()` hook has changed,
which means that even if you didn’t actively remove the chat, you will still be redirected as a result:

[{]: <helper> (diffStep 12.5 files="ChatRoom" module="client")

#### [__Client__ Step 12.5: Update cache on chat removal](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/8b52fbb0bb6762cb080d9f8f6bf276fbcdfc835c)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;ChatNavbar.tsx
```diff
@@ -8,6 +8,7 @@
 ┊ 8┊ 8┊import styled from 'styled-components';
 ┊ 9┊ 9┊import { History } from 'history';
 ┊10┊10┊import { useRemoveChatMutation } from '../../graphql/types';
+┊  ┊11┊import { eraseChat } from '../../services/cache.service';
 ┊11┊12┊
 ┊12┊13┊const Container = styled(Toolbar)`
 ┊13┊14┊  padding: 0;
```
```diff
@@ -67,6 +68,11 @@
 ┊67┊68┊    variables: {
 ┊68┊69┊      chatId: chat.id,
 ┊69┊70┊    },
+┊  ┊71┊    update: (client, { data }) => {
+┊  ┊72┊      if (data && data.removeChat) {
+┊  ┊73┊        eraseChat(client, data.removeChat);
+┊  ┊74┊      }
+┊  ┊75┊    },
 ┊70┊76┊  });
 ┊71┊77┊
 ┊72┊78┊  const handleRemoveChat = useCallback(() => {
```

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -1,6 +1,7 @@
 ┊1┊1┊import gql from 'graphql-tag';
 ┊2┊2┊import React from 'react';
 ┊3┊3┊import { useCallback } from 'react';
+┊ ┊4┊import { Redirect } from 'react-router-dom';
 ┊4┊5┊import styled from 'styled-components';
 ┊5┊6┊import ChatNavbar from './ChatNavbar';
 ┊6┊7┊import MessageInput from './MessageInput';
```
```diff
@@ -95,6 +96,11 @@
 ┊ 95┊ 96┊  if (loadingChat) return null;
 ┊ 96┊ 97┊  if (chat === null) return null;
 ┊ 97┊ 98┊
+┊   ┊ 99┊  // Chat was probably removed from cache by the subscription handler
+┊   ┊100┊  if (!chat) {
+┊   ┊101┊    return <Redirect to="/chats" />;
+┊   ┊102┊  }
+┊   ┊103┊
 ┊ 98┊104┊  return (
 ┊ 99┊105┊    <Container>
 ┊100┊106┊      {chat?.id && <ChatNavbar chat={chat} history={history} />}
```

[}]: #

TODO: maybe mention that ApolloCache doesn’t have Garbage Collector so even though the object is removed, everything else related to it says in cache.


[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step11.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step13.md) |
|:--------------------------------|--------------------------------:|

[}]: #
