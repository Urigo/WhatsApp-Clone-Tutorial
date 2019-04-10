# Step 12: Adding and removing chats

[//]: # (head-end)


Now that the users system is ready it would be a lot more comfortable to implement a chat creation feature. In the original Whatsapp, you can create a new chat based on your available contacts - a list of your contacts will appear on the screen and by picking one of the items you’ll basically be able to start chatting with the selected contact. However, since in our app we don’t have any real contacts (yet), we will implement the chats creation feature based on all available users in our DB. By picking a user from the users list we will be able to start chatting with it.

![demo](https://user-images.githubusercontent.com/7648874/55896445-e4c67200-5bf0-11e9-9c1c-88318642ef81.gif)

To be able to fetch users in our system we will need to add a new query called `users`. The `users` query will retrieve all users except for current user:

[{]: <helper> (diffStep 9.1 module="server")

#### [Server Step 9.1: Add Query.users](https://github.com/Urigo/WhatsApp-Clone-Server/commit/95127eb)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -80,6 +80,12 @@
 ┊80┊80┊
 ┊81┊81┊      return chat.participants.includes(currentUser.id) ? chat : null
 ┊82┊82┊    },
+┊  ┊83┊
+┊  ┊84┊    users(root, args, { currentUser }) {
+┊  ┊85┊      if (!currentUser) return []
+┊  ┊86┊
+┊  ┊87┊      return users.filter(u => u.id !== currentUser.id)
+┊  ┊88┊    },
 ┊83┊89┊  },
 ┊84┊90┊
 ┊85┊91┊  Mutation: {
```

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -28,6 +28,7 @@
 ┊28┊28┊type Query {
 ┊29┊29┊  chats: [Chat!]!
 ┊30┊30┊  chat(chatId: ID!): Chat
+┊  ┊31┊  users: [User!]!
 ┊31┊32┊}
 ┊32┊33┊
 ┊33┊34┊type Mutation {
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
+┊  ┊ 1┊import { createTestClient } from 'apollo-server-testing'
+┊  ┊ 2┊import { ApolloServer, gql } from 'apollo-server-express'
+┊  ┊ 3┊import schema from '../../schema'
+┊  ┊ 4┊import { users } from '../../db'
+┊  ┊ 5┊
+┊  ┊ 6┊describe('Query.getUsers', () => {
+┊  ┊ 7┊  it('should fetch all users except the one signed-in', async () => {
+┊  ┊ 8┊    let currentUser = users[0]
+┊  ┊ 9┊
+┊  ┊10┊    const server = new ApolloServer({
+┊  ┊11┊      schema,
+┊  ┊12┊      context: () => ({ currentUser }),
+┊  ┊13┊    })
+┊  ┊14┊
+┊  ┊15┊    const { query } = createTestClient(server)
+┊  ┊16┊
+┊  ┊17┊    let res = await query({
+┊  ┊18┊      query: gql `
+┊  ┊19┊        query GetUsers {
+┊  ┊20┊          users {
+┊  ┊21┊            id
+┊  ┊22┊            name
+┊  ┊23┊            picture
+┊  ┊24┊          }
+┊  ┊25┊        }
+┊  ┊26┊      `,
+┊  ┊27┊    })
+┊  ┊28┊
+┊  ┊29┊    expect(res.data).toBeDefined()
+┊  ┊30┊    expect(res.errors).toBeUndefined()
+┊  ┊31┊    expect(res.data).toMatchSnapshot()
+┊  ┊32┊
+┊  ┊33┊    currentUser = users[1]
+┊  ┊34┊
+┊  ┊35┊    res = await query({
+┊  ┊36┊      query: gql `
+┊  ┊37┊        query GetUsers {
+┊  ┊38┊          users {
+┊  ┊39┊            id
+┊  ┊40┊            name
+┊  ┊41┊            picture
+┊  ┊42┊          }
+┊  ┊43┊        }
+┊  ┊44┊      `,
+┊  ┊45┊    })
+┊  ┊46┊
+┊  ┊47┊    expect(res.data).toBeDefined()
+┊  ┊48┊    expect(res.errors).toBeUndefined()
+┊  ┊49┊    expect(res.data).toMatchSnapshot()
+┊  ┊50┊  })
+┊  ┊51┊})
```

[}]: #

This query will be reflected in a component called `UsersList`. First we will define and export a new fragment called `User`:

[{]: <helper> (diffStep 12.1 files="graphql/fragments" module="client")

#### Client Step 12.1: Add basic ChatCreationScreen

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

#### Client Step 12.1: Add basic ChatCreationScreen

##### Added src&#x2F;components&#x2F;UsersList.test.tsx
```diff
@@ -0,0 +1,43 @@
+┊  ┊ 1┊import React from 'react';
+┊  ┊ 2┊import { ApolloProvider } from 'react-apollo-hooks';
+┊  ┊ 3┊import { cleanup, render, waitForDomChange } from 'react-testing-library';
+┊  ┊ 4┊import { mockApolloClient } from '../test-helpers';
+┊  ┊ 5┊import UsersList, { UsersListQuery } from './UsersList';
+┊  ┊ 6┊import * as queries from '../graphql/queries';
+┊  ┊ 7┊
+┊  ┊ 8┊describe('UsersList', () => {
+┊  ┊ 9┊  afterEach(cleanup);
+┊  ┊10┊
+┊  ┊11┊  it('renders fetched users data', async () => {
+┊  ┊12┊    const client = mockApolloClient([
+┊  ┊13┊      {
+┊  ┊14┊        request: { query: UsersListQuery },
+┊  ┊15┊        result: {
+┊  ┊16┊          data: {
+┊  ┊17┊            users: [
+┊  ┊18┊              {
+┊  ┊19┊                __typename: 'User',
+┊  ┊20┊                id: 1,
+┊  ┊21┊                name: 'Charles Dickhead',
+┊  ┊22┊                picture: 'https://localhost:4000/dick.jpg',
+┊  ┊23┊              },
+┊  ┊24┊            ],
+┊  ┊25┊          },
+┊  ┊26┊        },
+┊  ┊27┊      },
+┊  ┊28┊    ]);
+┊  ┊29┊
+┊  ┊30┊    {
+┊  ┊31┊      const { container, getByTestId } = render(
+┊  ┊32┊        <ApolloProvider client={client}>
+┊  ┊33┊          <UsersList />
+┊  ┊34┊        </ApolloProvider>
+┊  ┊35┊      );
+┊  ┊36┊
+┊  ┊37┊      await waitForDomChange({ container });
+┊  ┊38┊
+┊  ┊39┊      expect(getByTestId('name')).toHaveTextContent('Charles Dickhead');
+┊  ┊40┊      expect(getByTestId('picture')).toHaveAttribute('src', 'https://localhost:4000/dick.jpg');
+┊  ┊41┊    }
+┊  ┊42┊  })
+┊  ┊43┊});
```

##### Added src&#x2F;components&#x2F;UsersList.tsx
```diff
@@ -0,0 +1,66 @@
+┊  ┊ 1┊import MaterialList from '@material-ui/core/List';
+┊  ┊ 2┊import MaterialItem from '@material-ui/core/ListItem';
+┊  ┊ 3┊import gql from 'graphql-tag';
+┊  ┊ 4┊import React from 'react';
+┊  ┊ 5┊import styled from 'styled-components';
+┊  ┊ 6┊import * as fragments from '../graphql/fragments';
+┊  ┊ 7┊import { useUsersListQuery } from '../graphql/types';
+┊  ┊ 8┊
+┊  ┊ 9┊const ActualList = styled(MaterialList) `
+┊  ┊10┊  padding: 0;
+┊  ┊11┊` as typeof MaterialList;
+┊  ┊12┊
+┊  ┊13┊const UserItem = styled(MaterialItem) `
+┊  ┊14┊  position: relative;
+┊  ┊15┊  padding: 7.5px 15px;
+┊  ┊16┊  display: flex;
+┊  ┊17┊  cursor: pinter;
+┊  ┊18┊` as typeof MaterialItem;
+┊  ┊19┊
+┊  ┊20┊const ProfilePicture = styled.img `
+┊  ┊21┊  height: 50px;
+┊  ┊22┊  width: 50px;
+┊  ┊23┊  object-fit: cover;
+┊  ┊24┊  border-radius: 50%;
+┊  ┊25┊`;
+┊  ┊26┊
+┊  ┊27┊const Name = styled.div `
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
+┊  ┊49┊      {!loadingUsers && users.map(user => (
+┊  ┊50┊        <UserItem
+┊  ┊51┊          key={user.id}
+┊  ┊52┊          button
+┊  ┊53┊        >
+┊  ┊54┊          {(user !== null && user.picture !== null) &&
+┊  ┊55┊            <React.Fragment>
+┊  ┊56┊              <ProfilePicture data-testid="picture" src={user.picture} />
+┊  ┊57┊              <Name data-testid="name">{user.name}</Name>
+┊  ┊58┊            </React.Fragment>
+┊  ┊59┊          }
+┊  ┊60┊        </UserItem>
+┊  ┊61┊      ))}
+┊  ┊62┊    </ActualList>
+┊  ┊63┊  );
+┊  ┊64┊};
+┊  ┊65┊
+┊  ┊66┊export default UsersList;
```

[}]: #

The list is likely to change when a new user signs-up. We will implement a subscription and live-update the list further this tutorial when we go through authentication. Now we will implement a new screen component called `ChatCreationScreen`. The screen will simply render the `UsersList` along with a navigation bar:

[{]: <helper> (diffStep 12.1 files="ChatCreationScreen" module="client")

#### Client Step 12.1: Add basic ChatCreationScreen

##### Added src&#x2F;components&#x2F;ChatCreationScreen&#x2F;ChatCreationNavbar.test.tsx
```diff
@@ -0,0 +1,28 @@
+┊  ┊ 1┊import { createMemoryHistory } from 'history';
+┊  ┊ 2┊import React from 'react';
+┊  ┊ 3┊import { cleanup, render, fireEvent, wait } from 'react-testing-library';
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
+┊  ┊14┊    await wait(() =>
+┊  ┊15┊      expect(history.location.pathname).toEqual('/new-chat')
+┊  ┊16┊    );
+┊  ┊17┊
+┊  ┊18┊    {
+┊  ┊19┊      const { container, getByTestId } = render(<ChatCreationNavbar history={history} />);
+┊  ┊20┊
+┊  ┊21┊      fireEvent.click(getByTestId('back-button'));
+┊  ┊22┊
+┊  ┊23┊      await wait(() =>
+┊  ┊24┊        expect(history.location.pathname).toEqual('/chats')
+┊  ┊25┊      );
+┊  ┊26┊    }
+┊  ┊27┊  });
+┊  ┊28┊});
```

##### Added src&#x2F;components&#x2F;ChatCreationScreen&#x2F;ChatCreationNavbar.tsx
```diff
@@ -0,0 +1,46 @@
+┊  ┊ 1┊import ArrowBackIcon from '@material-ui/icons/ArrowBack';
+┊  ┊ 2┊import { Toolbar, Button } from '@material-ui/core';
+┊  ┊ 3┊import React from 'react';
+┊  ┊ 4┊import { useCallback } from 'react';
+┊  ┊ 5┊import styled from 'styled-components';
+┊  ┊ 6┊import { History } from 'history';
+┊  ┊ 7┊
+┊  ┊ 8┊const Container = styled(Toolbar) `
+┊  ┊ 9┊  display: flex;
+┊  ┊10┊  background-color: var(--primary-bg);
+┊  ┊11┊  color: var(--primary-text);
+┊  ┊12┊  font-size: 20px;
+┊  ┊13┊  line-height: 40px;
+┊  ┊14┊` as typeof Toolbar;
+┊  ┊15┊
+┊  ┊16┊const BackButton = styled(Button) `
+┊  ┊17┊  svg {
+┊  ┊18┊    color: var(--primary-text);
+┊  ┊19┊  }
+┊  ┊20┊` as typeof Button;
+┊  ┊21┊
+┊  ┊22┊const Title = styled.div `
+┊  ┊23┊  flex: 1;
+┊  ┊24┊`;
+┊  ┊25┊
+┊  ┊26┊interface ChildComponentProps {
+┊  ┊27┊  history: History;
+┊  ┊28┊};
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
+┊  ┊45┊
+┊  ┊46┊export default ChatCreationNavbar;
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
+┊  ┊ 8┊const Container = styled.div `
+┊  ┊ 9┊  height: calc(100% - 56px);
+┊  ┊10┊  overflow-y: overlay;
+┊  ┊11┊`;
+┊  ┊12┊
+┊  ┊13┊// eslint-disable-next-line
+┊  ┊14┊const StyledUsersList = styled(UsersList) `
+┊  ┊15┊  height: calc(100% - 56px);
+┊  ┊16┊`;
+┊  ┊17┊
+┊  ┊18┊interface ChildComponentProps {
+┊  ┊19┊  history: History;
+┊  ┊20┊};
+┊  ┊21┊
+┊  ┊22┊const ChatCreationScreen: React.FC<ChildComponentProps> = ({ history }) => (
+┊  ┊23┊  <div>
+┊  ┊24┊    <ChatCreationNavbar history={history} />
+┊  ┊25┊    <UsersList/>
+┊  ┊26┊  </div>
+┊  ┊27┊);
+┊  ┊28┊
+┊  ┊29┊export default ChatCreationScreen;
```

[}]: #

The screen will be available under the route `/new-chat`. The new route will be restricted, since only authenticated users should be able to access it:

[{]: <helper> (diffStep 12.1 files="App" module="client")

#### Client Step 12.1: Add basic ChatCreationScreen

##### Changed src&#x2F;App.tsx
```diff
@@ -3,6 +3,7 @@
 ┊3┊3┊import AuthScreen from './components/AuthScreen';
 ┊4┊4┊import ChatRoomScreen from './components/ChatRoomScreen';
 ┊5┊5┊import ChatsListScreen from './components/ChatsListScreen';
+┊ ┊6┊import ChatCreationScreen from './components/ChatCreationScreen';
 ┊6┊7┊import AnimatedSwitch from './components/AnimatedSwitch';
 ┊7┊8┊import { withAuth } from './services/auth.service';
 ┊8┊9┊
```
```diff
@@ -17,6 +18,7 @@
 ┊17┊18┊        (<ChatRoomScreen chatId={match.params.chatId} history={history} />)
 ┊18┊19┊      )} />
 ┊19┊20┊
+┊  ┊21┊      <Route exact path="/new-chat" component={withAuth(ChatCreationScreen)} />
 ┊20┊22┊    </AnimatedSwitch>
 ┊21┊23┊    <Route exact path="/" render={redirectToChats} />
 ┊22┊24┊  </BrowserRouter>
```

[}]: #

the `/new-chat` route will be accessible directly from the main `ChatsListScreen`. We will implement a navigation button which is gonna have a fixed position at the bottom right corner of the screen:

[{]: <helper> (diffStep 12.1 files="AddChatButton" module="client")

#### Client Step 12.1: Add basic ChatCreationScreen

##### Added src&#x2F;components&#x2F;ChatsListScreen&#x2F;AddChatButton.test.tsx
```diff
@@ -0,0 +1,22 @@
+┊  ┊ 1┊import { createMemoryHistory } from 'history';
+┊  ┊ 2┊import React from 'react';
+┊  ┊ 3┊import { cleanup, render, fireEvent, wait } from 'react-testing-library';
+┊  ┊ 4┊import AddChatButton from './AddChatButton';
+┊  ┊ 5┊
+┊  ┊ 6┊describe('AddChatButton', () => {
+┊  ┊ 7┊  afterEach(cleanup);
+┊  ┊ 8┊
+┊  ┊ 9┊  it('goes back on arrow click', async () => {
+┊  ┊10┊    const history = createMemoryHistory();
+┊  ┊11┊
+┊  ┊12┊    {
+┊  ┊13┊      const { container, getByTestId } = render(<AddChatButton history={history} />);
+┊  ┊14┊
+┊  ┊15┊      fireEvent.click(getByTestId('new-chat-button'));
+┊  ┊16┊
+┊  ┊17┊      await wait(() =>
+┊  ┊18┊        expect(history.location.pathname).toEqual('/new-chat')
+┊  ┊19┊      );
+┊  ┊20┊    }
+┊  ┊21┊  });
+┊  ┊22┊});
```

##### Added src&#x2F;components&#x2F;ChatsListScreen&#x2F;AddChatButton.tsx
```diff
@@ -0,0 +1,44 @@
+┊  ┊ 1┊import Button from '@material-ui/core/Button';
+┊  ┊ 2┊import ChatIcon from '@material-ui/icons/Chat';
+┊  ┊ 3┊import React from 'react';
+┊  ┊ 4┊import styled from 'styled-components';
+┊  ┊ 5┊import { History } from 'history';
+┊  ┊ 6┊
+┊  ┊ 7┊const Container = styled.div `
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
+┊  ┊23┊};
+┊  ┊24┊
+┊  ┊25┊const AddChatButton: React.FC<ChildComponentProps> = ({ history }) => {
+┊  ┊26┊  const onClick = () => {
+┊  ┊27┊    history.push('/new-chat')
+┊  ┊28┊  };
+┊  ┊29┊
+┊  ┊30┊  return (
+┊  ┊31┊    <Container>
+┊  ┊32┊      <Button
+┊  ┊33┊        data-testid="new-chat-button"
+┊  ┊34┊        variant="contained"
+┊  ┊35┊        color="secondary"
+┊  ┊36┊        onClick={onClick}
+┊  ┊37┊      >
+┊  ┊38┊        <ChatIcon />
+┊  ┊39┊      </Button>
+┊  ┊40┊    </Container>
+┊  ┊41┊  );
+┊  ┊42┊};
+┊  ┊43┊
+┊  ┊44┊export default AddChatButton;🚫↵
```

[}]: #

And then we will render it in the `ChatsListScreen`:

[{]: <helper> (diffStep 12.1 files="ChatsListScreen/index" module="client")

#### Client Step 12.1: Add basic ChatCreationScreen

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;index.tsx
```diff
@@ -3,6 +3,7 @@
 ┊3┊3┊import ChatsList from './ChatsList';
 ┊4┊4┊import styled from 'styled-components';
 ┊5┊5┊import { History } from 'history';
+┊ ┊6┊import AddChatButton from './AddChatButton';
 ┊6┊7┊
 ┊7┊8┊const Container = styled.div `
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

#### [Server Step 9.2: Add Mutation.addChat](https://github.com/Urigo/WhatsApp-Clone-Server/commit/e3509c3)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -1,6 +1,6 @@
 ┊1┊1┊import { withFilter } from 'apollo-server-express'
 ┊2┊2┊import { GraphQLDateTime } from 'graphql-iso-date'
-┊3┊ ┊import { User, Message, chats, messages, users } from '../db'
+┊ ┊3┊import { User, Message, Chat, chats, messages, users } from '../db'
 ┊4┊4┊import { Resolvers } from '../types/graphql'
 ┊5┊5┊
 ┊6┊6┊const resolvers: Resolvers = {
```
```diff
@@ -121,7 +121,31 @@
 ┊121┊121┊      })
 ┊122┊122┊
 ┊123┊123┊      return message
-┊124┊   ┊    }
+┊   ┊124┊    },
+┊   ┊125┊
+┊   ┊126┊    addChat(root, { recipientId }, { currentUser }) {
+┊   ┊127┊      if (!currentUser) return null
+┊   ┊128┊      if (!users.some(u => u.id === recipientId)) return null
+┊   ┊129┊
+┊   ┊130┊      let chat = chats.find(c =>
+┊   ┊131┊        c.participants.includes(currentUser.id) &&
+┊   ┊132┊        c.participants.includes(recipientId)
+┊   ┊133┊      )
+┊   ┊134┊
+┊   ┊135┊      if (chat) return chat
+┊   ┊136┊
+┊   ┊137┊      const chatsIds = chats.map(c => Number(c.id))
+┊   ┊138┊
+┊   ┊139┊      chat = {
+┊   ┊140┊        id: String(Math.max(...chatsIds) + 1),
+┊   ┊141┊        participants: [currentUser.id, recipientId],
+┊   ┊142┊        messages: [],
+┊   ┊143┊      }
+┊   ┊144┊
+┊   ┊145┊      chats.push(chat)
+┊   ┊146┊
+┊   ┊147┊      return chat
+┊   ┊148┊    },
 ┊125┊149┊  },
 ┊126┊150┊
 ┊127┊151┊  Subscription: {
```

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -33,6 +33,7 @@
 ┊33┊33┊
 ┊34┊34┊type Mutation {
 ┊35┊35┊  addMessage(chatId: ID!, content: String!): Message
+┊  ┊36┊  addChat(recipientId: ID!): Chat
 ┊36┊37┊}
 ┊37┊38┊
 ┊38┊39┊type Subscription {
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
+┊  ┊ 1┊import { createTestClient } from 'apollo-server-testing'
+┊  ┊ 2┊import { ApolloServer, PubSub, gql } from 'apollo-server-express'
+┊  ┊ 3┊import schema from '../../schema'
+┊  ┊ 4┊import { resetDb, users } from '../../db'
+┊  ┊ 5┊
+┊  ┊ 6┊describe('Mutation.addChat', () => {
+┊  ┊ 7┊  beforeEach(resetDb)
+┊  ┊ 8┊
+┊  ┊ 9┊  it('creates a new chat between current user and specified recipient', async () => {
+┊  ┊10┊    const server = new ApolloServer({
+┊  ┊11┊      schema,
+┊  ┊12┊      context: () => ({
+┊  ┊13┊        pubsub: new PubSub(),
+┊  ┊14┊        currentUser: users[1],
+┊  ┊15┊      }),
+┊  ┊16┊    })
+┊  ┊17┊
+┊  ┊18┊    const { query, mutate } = createTestClient(server)
+┊  ┊19┊
+┊  ┊20┊    const addChatRes = await mutate({
+┊  ┊21┊      variables: { recipientId: '3' },
+┊  ┊22┊      mutation: gql `
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
+┊  ┊33┊    })
+┊  ┊34┊
+┊  ┊35┊    expect(addChatRes.data).toBeDefined()
+┊  ┊36┊    expect(addChatRes.errors).toBeUndefined()
+┊  ┊37┊    expect(addChatRes.data).toMatchSnapshot()
+┊  ┊38┊
+┊  ┊39┊    const getChatRes = await query({
+┊  ┊40┊      variables: { chatId: '5' },
+┊  ┊41┊      query: gql `
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
+┊  ┊52┊    })
+┊  ┊53┊
+┊  ┊54┊    expect(getChatRes.data).toBeDefined()
+┊  ┊55┊    expect(getChatRes.errors).toBeUndefined()
+┊  ┊56┊    expect(getChatRes.data).toMatchSnapshot()
+┊  ┊57┊  })
+┊  ┊58┊
+┊  ┊59┊  it('returns the existing chat if so', async () => {
+┊  ┊60┊    const server = new ApolloServer({
+┊  ┊61┊      schema,
+┊  ┊62┊      context: () => ({
+┊  ┊63┊        pubsub: new PubSub(),
+┊  ┊64┊        currentUser: users[0],
+┊  ┊65┊      }),
+┊  ┊66┊    })
+┊  ┊67┊
+┊  ┊68┊    const { query, mutate } = createTestClient(server)
+┊  ┊69┊
+┊  ┊70┊    const addChatRes = await mutate({
+┊  ┊71┊      variables: { recipientId: '2' },
+┊  ┊72┊      mutation: gql `
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
+┊  ┊83┊    })
+┊  ┊84┊
+┊  ┊85┊    expect(addChatRes.data).toBeDefined()
+┊  ┊86┊    expect(addChatRes.errors).toBeUndefined()
+┊  ┊87┊    expect(addChatRes.data).toMatchSnapshot()
+┊  ┊88┊  })
+┊  ┊89┊})
```

[}]: #

To use the new mutation, we will define a new callback called `onUserPick` in the `UsersList` so it can be used from the `ChatCreationScreen`:

[{]: <helper> (diffStep 12.2 files="UsersList" module="client")

#### Client Step 12.2: Create chat on user pick

##### Changed src&#x2F;components&#x2F;UsersList.test.tsx
```diff
@@ -1,6 +1,6 @@
 ┊1┊1┊import React from 'react';
 ┊2┊2┊import { ApolloProvider } from 'react-apollo-hooks';
-┊3┊ ┊import { cleanup, render, waitForDomChange } from 'react-testing-library';
+┊ ┊3┊import { cleanup, render, fireEvent, wait, waitForDomChange } from 'react-testing-library';
 ┊4┊4┊import { mockApolloClient } from '../test-helpers';
 ┊5┊5┊import UsersList, { UsersListQuery } from './UsersList';
 ┊6┊6┊import * as queries from '../graphql/queries';
```
```diff
@@ -40,4 +40,45 @@
 ┊40┊40┊      expect(getByTestId('picture')).toHaveAttribute('src', 'https://localhost:4000/dick.jpg');
 ┊41┊41┊    }
 ┊42┊42┊  })
+┊  ┊43┊
+┊  ┊44┊  it('triggers onUserPick() callback on user-item click', async () => {
+┊  ┊45┊    const client = mockApolloClient([
+┊  ┊46┊      {
+┊  ┊47┊        request: { query: UsersListQuery },
+┊  ┊48┊        result: {
+┊  ┊49┊          data: {
+┊  ┊50┊            users: [
+┊  ┊51┊              {
+┊  ┊52┊                __typename: 'User',
+┊  ┊53┊                id: 1,
+┊  ┊54┊                name: 'Charles Dickhead',
+┊  ┊55┊                picture: 'https://localhost:4000/dick.jpg',
+┊  ┊56┊              },
+┊  ┊57┊            ],
+┊  ┊58┊          },
+┊  ┊59┊        },
+┊  ┊60┊      },
+┊  ┊61┊    ]);
+┊  ┊62┊
+┊  ┊63┊    const onUserPick = jest.fn(() => {});
+┊  ┊64┊
+┊  ┊65┊    {
+┊  ┊66┊      const { container, getByTestId } = render(
+┊  ┊67┊        <ApolloProvider client={client}>
+┊  ┊68┊          <UsersList onUserPick={onUserPick} />
+┊  ┊69┊        </ApolloProvider>
+┊  ┊70┊      );
+┊  ┊71┊
+┊  ┊72┊      await waitForDomChange({ container });
+┊  ┊73┊
+┊  ┊74┊      fireEvent.click(getByTestId('user'));
+┊  ┊75┊
+┊  ┊76┊      await wait(() =>
+┊  ┊77┊        expect(onUserPick.mock.calls.length).toBe(1)
+┊  ┊78┊      );
+┊  ┊79┊
+┊  ┊80┊      expect(onUserPick.mock.calls[0][0].name).toEqual('Charles Dickhead');
+┊  ┊81┊      expect(onUserPick.mock.calls[0][0].picture).toEqual('https://localhost:4000/dick.jpg');
+┊  ┊82┊    }
+┊  ┊83┊  });
 ┊43┊84┊});
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
 ┊ 9┊ 9┊const ActualList = styled(MaterialList) `
 ┊10┊10┊  padding: 0;
```
```diff
@@ -38,7 +38,11 @@
 ┊38┊38┊  ${fragments.user}
 ┊39┊39┊`;
 ┊40┊40┊
-┊41┊  ┊const UsersList: React.FC = () => {
+┊  ┊41┊interface ChildComponentProps {
+┊  ┊42┊  onUserPick: any;
+┊  ┊43┊};
+┊  ┊44┊
+┊  ┊45┊const UsersList: React.FC<ChildComponentProps> = ({ onUserPick = (user: User) => {} }) => {
 ┊42┊46┊  const { data, loading: loadingUsers } = useUsersListQuery();
 ┊43┊47┊
 ┊44┊48┊  if (data === undefined) return null;
```
```diff
@@ -49,6 +53,8 @@
 ┊49┊53┊      {!loadingUsers && users.map(user => (
 ┊50┊54┊        <UserItem
 ┊51┊55┊          key={user.id}
+┊  ┊56┊          data-testid="user"
+┊  ┊57┊          onClick={onUserPick.bind(null, user)}
 ┊52┊58┊          button
 ┊53┊59┊        >
 ┊54┊60┊          {(user !== null && user.picture !== null) &&
```

[}]: #

In the `ChatCreationScreen/index.tsx` module, we will define an `AddChat` document with `graphql-tag`. Using the `$ yarn codegen` command we can generate the correlated React mutation hook and use it as the `onUserPick` callback:

[{]: <helper> (diffStep 12.2 files="ChatCreationScreen/index" module="client")

#### Client Step 12.2: Create chat on user pick

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
 ┊ 8┊12┊const Container = styled.div `
```
```diff
@@ -15,15 +19,50 @@
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
 ┊20┊33┊};
 ┊21┊34┊
-┊22┊  ┊const ChatCreationScreen: React.FC<ChildComponentProps> = ({ history }) => (
-┊23┊  ┊  <div>
-┊24┊  ┊    <ChatCreationNavbar history={history} />
-┊25┊  ┊    <UsersList/>
-┊26┊  ┊  </div>
-┊27┊  ┊);
+┊  ┊35┊const ChatCreationScreen: React.FC<ChildComponentProps> = ({ history }) => {
+┊  ┊36┊  const addChat = useAddChatMutation();
+┊  ┊37┊
+┊  ┊38┊  const onUserPick = useCallback((user) => {
+┊  ┊39┊    addChat({
+┊  ┊40┊      optimisticResponse: {
+┊  ┊41┊        __typename: 'Mutation',
+┊  ┊42┊        addChat: {
+┊  ┊43┊          __typename: 'Chat',
+┊  ┊44┊          id: Math.random().toString(36).substr(2, 9),
+┊  ┊45┊          name: user.name,
+┊  ┊46┊          picture: user.picture,
+┊  ┊47┊          lastMessage: null,
+┊  ┊48┊        },
+┊  ┊49┊      },
+┊  ┊50┊      variables: {
+┊  ┊51┊        recipientId: user.id,
+┊  ┊52┊      },
+┊  ┊53┊    }).then(({ data }) => {
+┊  ┊54┊      if (data !== null) {
+┊  ┊55┊        history.push(`/chats/${data.addChat.id}`);
+┊  ┊56┊      }
+┊  ┊57┊    })
+┊  ┊58┊  }, [addChat, history]);
+┊  ┊59┊
+┊  ┊60┊  return (
+┊  ┊61┊    <div>
+┊  ┊62┊      <ChatCreationNavbar history={history} />
+┊  ┊63┊      <UsersList onUserPick={onUserPick} />
+┊  ┊64┊    </div>
+┊  ┊65┊  );
+┊  ┊66┊};
 ┊28┊67┊
 ┊29┊68┊export default ChatCreationScreen;
```

[}]: #

Chats can now be created, you can test out the function by signing in with different users. However, the chats list in the `ChatsListScreen` will not be updated unless we refresh the page manually. In the server project, we will define a new subscription called `chatAdded`. The subscription should be broadcasted to the current user only if he is a participant of the published chat:

[{]: <helper> (diffStep 9.3 module="server")

#### [Server Step 9.3: Add Subscription.chatAdded](https://github.com/Urigo/WhatsApp-Clone-Server/commit/693b6bd)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -123,7 +123,7 @@
 ┊123┊123┊      return message
 ┊124┊124┊    },
 ┊125┊125┊
-┊126┊   ┊    addChat(root, { recipientId }, { currentUser }) {
+┊   ┊126┊    addChat(root, { recipientId }, { currentUser, pubsub }) {
 ┊127┊127┊      if (!currentUser) return null
 ┊128┊128┊      if (!users.some(u => u.id === recipientId)) return null
 ┊129┊129┊
```
```diff
@@ -144,6 +144,10 @@
 ┊144┊144┊
 ┊145┊145┊      chats.push(chat)
 ┊146┊146┊
+┊   ┊147┊      pubsub.publish('chatAdded', {
+┊   ┊148┊        chatAdded: chat
+┊   ┊149┊      })
+┊   ┊150┊
 ┊147┊151┊      return chat
 ┊148┊152┊    },
 ┊149┊153┊  },
```
```diff
@@ -161,6 +165,17 @@
 ┊161┊165┊          ].includes(currentUser.id)
 ┊162┊166┊        },
 ┊163┊167┊      )
+┊   ┊168┊    },
+┊   ┊169┊
+┊   ┊170┊    chatAdded: {
+┊   ┊171┊      subscribe: withFilter(
+┊   ┊172┊        (root, args, { pubsub }) => pubsub.asyncIterator('chatAdded'),
+┊   ┊173┊        ({ chatAdded }: { chatAdded: Chat }, args, { currentUser }) => {
+┊   ┊174┊          if (!currentUser) return false
+┊   ┊175┊
+┊   ┊176┊          return chatAdded.participants.some(p => p === currentUser.id)
+┊   ┊177┊        },
+┊   ┊178┊      )
 ┊164┊179┊    }
 ┊165┊180┊  }
 ┊166┊181┊}
```

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -38,4 +38,5 @@
 ┊38┊38┊
 ┊39┊39┊type Subscription {
 ┊40┊40┊  messageAdded: Message!
+┊  ┊41┊  chatAdded: Chat!
 ┊41┊42┊}
```

[}]: #

Now we will listen to the new subscription in the client and update the cache. First we will define the subscription document:

[{]: <helper> (diffStep 12.3 files="graphql/subscriptions" module="client")

#### Client Step 12.3: Write chat on chatAdded

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

#### Client Step 12.3: Write chat on chatAdded

##### Changed src&#x2F;components&#x2F;ChatCreationScreen&#x2F;index.tsx
```diff
@@ -7,6 +7,7 @@
 ┊ 7┊ 7┊import ChatCreationNavbar from './ChatCreationNavbar';
 ┊ 8┊ 8┊import { History } from 'history';
 ┊ 9┊ 9┊import { useAddChatMutation } from '../../graphql/types';
+┊  ┊10┊import { writeChat } from '../../services/cache.service';
 ┊10┊11┊
 ┊11┊12┊// eslint-disable-next-line
 ┊12┊13┊const Container = styled.div `
```
```diff
@@ -33,7 +34,11 @@
 ┊33┊34┊};
 ┊34┊35┊
 ┊35┊36┊const ChatCreationScreen: React.FC<ChildComponentProps> = ({ history }) => {
-┊36┊  ┊  const addChat = useAddChatMutation();
+┊  ┊37┊  const addChat = useAddChatMutation({
+┊  ┊38┊    update: (client, { data: { addChat } }) => {
+┊  ┊39┊      writeChat(client, addChat);
+┊  ┊40┊    }
+┊  ┊41┊  });
 ┊37┊42┊
 ┊38┊43┊  const onUserPick = useCallback((user) => {
 ┊39┊44┊    addChat({
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
@@ -5,7 +5,9 @@
 ┊ 5┊ 5┊import * as queries from '../graphql/queries';
 ┊ 6┊ 6┊import {
 ┊ 7┊ 7┊  MessageFragment,
+┊  ┊ 8┊  ChatFragment,
 ┊ 8┊ 9┊  useMessageAddedSubscription,
+┊  ┊10┊  useChatAddedSubscription,
 ┊ 9┊11┊} from '../graphql/types';
 ┊10┊12┊
 ┊11┊13┊type Client = ApolloClient<any> | DataProxy;
```
```diff
@@ -18,6 +20,14 @@
 ┊18┊20┊      }
 ┊19┊21┊    }
 ┊20┊22┊  });
+┊  ┊23┊
+┊  ┊24┊  useChatAddedSubscription({
+┊  ┊25┊    onSubscriptionData: ({ client, subscriptionData: { data } }) => {
+┊  ┊26┊      if (data) {
+┊  ┊27┊        writeChat(client, data.chatAdded);
+┊  ┊28┊      }
+┊  ┊29┊    }
+┊  ┊30┊  });
 ┊21┊31┊};
 ┊22┊32┊
 ┊23┊33┊export const writeMessage = (client: Client, message: MessageFragment) => {
```
```diff
@@ -83,3 +93,41 @@
 ┊ 83┊ 93┊    data: { chats: chats },
 ┊ 84┊ 94┊  });
 ┊ 85┊ 95┊}
+┊   ┊ 96┊
+┊   ┊ 97┊export const writeChat = (client: Client, chat: ChatFragment) => {
+┊   ┊ 98┊
+┊   ┊ 99┊  const chatId = defaultDataIdFromObject(chat);
+┊   ┊100┊  if (chatId === null) {
+┊   ┊101┊    return;
+┊   ┊102┊  }
+┊   ┊103┊
+┊   ┊104┊  client.writeFragment({
+┊   ┊105┊    id: chatId,
+┊   ┊106┊    fragment: fragments.chat,
+┊   ┊107┊    fragmentName: 'Chat',
+┊   ┊108┊    data: chat,
+┊   ┊109┊  })
+┊   ┊110┊
+┊   ┊111┊  let data;
+┊   ┊112┊  try {
+┊   ┊113┊    data = client.readQuery({
+┊   ┊114┊      query: queries.chats,
+┊   ┊115┊    })
+┊   ┊116┊  } catch (e) {
+┊   ┊117┊    return;
+┊   ┊118┊  }
+┊   ┊119┊
+┊   ┊120┊  if (!data) return;
+┊   ┊121┊
+┊   ┊122┊  const chats = data.chats;
+┊   ┊123┊
+┊   ┊124┊  if (!chats) return;
+┊   ┊125┊  if (chats.some((c: any) => c.id === chat.id)) return;
+┊   ┊126┊
+┊   ┊127┊  chats.unshift(chat)
+┊   ┊128┊
+┊   ┊129┊  client.writeQuery({
+┊   ┊130┊    query: queries.chats,
+┊   ┊131┊    data: { chats },
+┊   ┊132┊  });
+┊   ┊133┊}
```

[}]: #

Now we can create new chats, and the chats list would be updated, without refreshing the page. You can also test it with 2 separate sessions in the browser and see how each tab/window affects the other. Lastly, we will implement a chat removal function. This is important as we don’t want to garbage our chats collection, sometimes we would like to clean up some of them.

In the back-end, let’s implement the `removeChat` mutation. The chat can only be removed only if the current user is one of the chat’s participants. The mutation will also remove all the messages which are related to the target chat, since we’re not gonna use them anymore. The chat will be removed for all participants. This is not exactly the behavior of the original Whatsapp, but to keep things simple we will go with that solution:

[{]: <helper> (diffStep 9.4 module="server")

#### [Server Step 9.4: Add Mutation.removeChat](https://github.com/Urigo/WhatsApp-Clone-Server/commit/19f69d9)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -150,6 +150,30 @@
 ┊150┊150┊
 ┊151┊151┊      return chat
 ┊152┊152┊    },
+┊   ┊153┊
+┊   ┊154┊    removeChat(root, { chatId }, { currentUser }) {
+┊   ┊155┊      if (!currentUser) return null
+┊   ┊156┊
+┊   ┊157┊      const chatIndex = chats.findIndex(c => c.id === chatId)
+┊   ┊158┊
+┊   ┊159┊      if (chatIndex === -1) return null
+┊   ┊160┊
+┊   ┊161┊      const chat = chats[chatIndex]
+┊   ┊162┊
+┊   ┊163┊      if (!chat.participants.some(p => p === currentUser.id)) return null
+┊   ┊164┊
+┊   ┊165┊      chat.messages.forEach((chatMessage) => {
+┊   ┊166┊        const chatMessageIndex = messages.findIndex(m => m.id === chatMessage)
+┊   ┊167┊
+┊   ┊168┊        if (chatMessageIndex !== -1) {
+┊   ┊169┊          messages.splice(chatMessageIndex, 1)
+┊   ┊170┊        }
+┊   ┊171┊      })
+┊   ┊172┊
+┊   ┊173┊      chats.splice(chatIndex, 1)
+┊   ┊174┊
+┊   ┊175┊      return chatId
+┊   ┊176┊    }
 ┊153┊177┊  },
 ┊154┊178┊
 ┊155┊179┊  Subscription: {
```

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -34,6 +34,7 @@
 ┊34┊34┊type Mutation {
 ┊35┊35┊  addMessage(chatId: ID!, content: String!): Message
 ┊36┊36┊  addChat(recipientId: ID!): Chat
+┊  ┊37┊  removeChat(chatId: ID!): ID
 ┊37┊38┊}
 ┊38┊39┊
 ┊39┊40┊type Subscription {
```

##### Added tests&#x2F;mutations&#x2F;removeChat.test.ts
```diff
@@ -0,0 +1,52 @@
+┊  ┊ 1┊import { createTestClient } from 'apollo-server-testing'
+┊  ┊ 2┊import { ApolloServer, PubSub, gql } from 'apollo-server-express'
+┊  ┊ 3┊import schema from '../../schema'
+┊  ┊ 4┊import { resetDb, users } from '../../db'
+┊  ┊ 5┊
+┊  ┊ 6┊describe('Mutation.removeChat', () => {
+┊  ┊ 7┊  beforeEach(resetDb)
+┊  ┊ 8┊
+┊  ┊ 9┊  it('removes chat by id', async () => {
+┊  ┊10┊    const server = new ApolloServer({
+┊  ┊11┊      schema,
+┊  ┊12┊      context: () => ({
+┊  ┊13┊        pubsub: new PubSub(),
+┊  ┊14┊        currentUser: users[0],
+┊  ┊15┊      }),
+┊  ┊16┊    })
+┊  ┊17┊
+┊  ┊18┊    const { query, mutate } = createTestClient(server)
+┊  ┊19┊
+┊  ┊20┊    const addChatRes = await mutate({
+┊  ┊21┊      variables: { chatId: '1' },
+┊  ┊22┊      mutation: gql `
+┊  ┊23┊        mutation RemoveChat($chatId: ID!) {
+┊  ┊24┊          removeChat(chatId: $chatId)
+┊  ┊25┊        }
+┊  ┊26┊      `,
+┊  ┊27┊    })
+┊  ┊28┊
+┊  ┊29┊    expect(addChatRes.data).toBeDefined()
+┊  ┊30┊    expect(addChatRes.errors).toBeUndefined()
+┊  ┊31┊    expect(addChatRes.data!.removeChat).toEqual('1')
+┊  ┊32┊
+┊  ┊33┊    const getChatRes = await query({
+┊  ┊34┊      variables: { chatId: '1' },
+┊  ┊35┊      query: gql `
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
+┊  ┊46┊    })
+┊  ┊47┊
+┊  ┊48┊    expect(addChatRes.data).toBeDefined()
+┊  ┊49┊    expect(getChatRes.errors).toBeUndefined()
+┊  ┊50┊    expect(addChatRes.data!.chat).toBeUndefined()
+┊  ┊51┊  })
+┊  ┊52┊})
```

[}]: #

In the client app, a chat could be removed directly from the `ChatRoomScreen`. On the top right corner, right on the navbar, we will add a dispose button that will call the `removeChat` mutation. Just like we did before, we will define the mutation document with `graphql-tag` and generate the correlated hook with CodeGen:

[{]: <helper> (diffStep 12.4 module="client")

#### Client Step 12.4: Add chat removal function

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;ChatNavbar.test.tsx
```diff
@@ -1,12 +1,17 @@
 ┊ 1┊ 1┊import { createMemoryHistory } from 'history';
 ┊ 2┊ 2┊import React from 'react';
+┊  ┊ 3┊import { ApolloProvider } from 'react-apollo-hooks';
 ┊ 3┊ 4┊import { cleanup, render, fireEvent, wait } from 'react-testing-library';
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
 ┊10┊15┊    const chat = {
 ┊11┊16┊      id: '1',
 ┊12┊17┊      name: 'Foo Bar',
```
```diff
@@ -14,7 +19,11 @@
 ┊14┊19┊    };
 ┊15┊20┊
 ┊16┊21┊    {
-┊17┊  ┊      const { container, getByTestId } = render(<ChatNavbar chat={chat} />);
+┊  ┊22┊      const { container, getByTestId } = render(
+┊  ┊23┊        <ApolloProvider client={client}>
+┊  ┊24┊          <ChatNavbar chat={chat} />
+┊  ┊25┊        </ApolloProvider>
+┊  ┊26┊      );
 ┊18┊27┊
 ┊19┊28┊      expect(getByTestId('chat-name')).toHaveTextContent('Foo Bar');
 ┊20┊29┊      expect(getByTestId('chat-picture')).toHaveAttribute('src', 'https://localhost:4000/picture.jpg');
```
```diff
@@ -22,6 +31,8 @@
 ┊22┊31┊  })
 ┊23┊32┊
 ┊24┊33┊  it('goes back on arrow click', async () => {
+┊  ┊34┊    const client = mockApolloClient();
+┊  ┊35┊
 ┊25┊36┊    const chat = {
 ┊26┊37┊      id: '1',
 ┊27┊38┊      name: 'Foo Bar',
```
```diff
@@ -37,7 +48,11 @@
 ┊37┊48┊    )
 ┊38┊49┊
 ┊39┊50┊    {
-┊40┊  ┊      const { container, getByTestId } = render(<ChatNavbar chat={chat} history={history} />);
+┊  ┊51┊      const { container, getByTestId } = render(
+┊  ┊52┊        <ApolloProvider client={client}>
+┊  ┊53┊          <ChatNavbar chat={chat} history={history} />
+┊  ┊54┊        </ApolloProvider>
+┊  ┊55┊      );
 ┊41┊56┊
 ┊42┊57┊      fireEvent.click(getByTestId('back-button'));
 ┊43┊58┊
```
```diff
@@ -46,4 +61,48 @@
 ┊ 46┊ 61┊      );
 ┊ 47┊ 62┊    }
 ┊ 48┊ 63┊  });
+┊   ┊ 64┊
+┊   ┊ 65┊  it('goes back on chat removal', async () => {
+┊   ┊ 66┊    const client = mockApolloClient([
+┊   ┊ 67┊      {
+┊   ┊ 68┊        request: {
+┊   ┊ 69┊          query: RemoveChatDocument,
+┊   ┊ 70┊          variables: { chatId: '1' },
+┊   ┊ 71┊        },
+┊   ┊ 72┊        result: {
+┊   ┊ 73┊          data: {
+┊   ┊ 74┊            removeChat: '1'
+┊   ┊ 75┊          }
+┊   ┊ 76┊        }
+┊   ┊ 77┊      },
+┊   ┊ 78┊    ]);
+┊   ┊ 79┊
+┊   ┊ 80┊    const chat = {
+┊   ┊ 81┊      id: '1',
+┊   ┊ 82┊      name: 'Foo Bar',
+┊   ┊ 83┊      picture: 'https://localhost:4000/picture.jpg',
+┊   ┊ 84┊    };
+┊   ┊ 85┊
+┊   ┊ 86┊    const history = createMemoryHistory();
+┊   ┊ 87┊
+┊   ┊ 88┊    history.push('/chats/1');
+┊   ┊ 89┊
+┊   ┊ 90┊    await wait(() =>
+┊   ┊ 91┊      expect(history.location.pathname).toEqual('/chats/1')
+┊   ┊ 92┊    );
+┊   ┊ 93┊
+┊   ┊ 94┊    {
+┊   ┊ 95┊      const { container, getByTestId } = render(
+┊   ┊ 96┊        <ApolloProvider client={client}>
+┊   ┊ 97┊          <ChatNavbar chat={chat} history={history} />
+┊   ┊ 98┊        </ApolloProvider>
+┊   ┊ 99┊      );
+┊   ┊100┊
+┊   ┊101┊      fireEvent.click(getByTestId('delete-button'));
+┊   ┊102┊
+┊   ┊103┊      await wait(() =>
+┊   ┊104┊        expect(history.location.pathname).toEqual('/chats')
+┊   ┊105┊      );
+┊   ┊106┊    }
+┊   ┊107┊  })
 ┊ 49┊108┊});🚫↵
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
 ┊ 9┊12┊const Container = styled(Toolbar) `
 ┊10┊13┊  padding: 0;
```
```diff
@@ -20,6 +23,12 @@
 ┊20┊23┊  }
 ┊21┊24┊` as typeof Button;
 ┊22┊25┊
+┊  ┊26┊const Rest = styled.div `
+┊  ┊27┊  flex: 1;
+┊  ┊28┊  display: flex;
+┊  ┊29┊  justify-content: flex-end;
+┊  ┊30┊`
+┊  ┊31┊
 ┊23┊32┊const Picture = styled.img `
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
+┊  ┊48┊` as typeof Button;
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
 ┊43┊63┊};
 ┊44┊64┊
 ┊45┊65┊const ChatNavbar: React.FC<ChatNavbarProps> = ({ chat, history }) => {
+┊  ┊66┊  const removeChat = useRemoveChatMutation({
+┊  ┊67┊    variables: {
+┊  ┊68┊      chatId: chat.id
+┊  ┊69┊    }
+┊  ┊70┊  });
+┊  ┊71┊
+┊  ┊72┊  const handleRemoveChat = useCallback(() => {
+┊  ┊73┊    removeChat().then(() => {
+┊  ┊74┊      history.replace('/chats')
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

[}]: #

Normally this is a dangerous behavior because we wipe out the entire history without any warnings, which is not recommended. For tutoring purposes only we will keep it the way it is, because it makes things simple and easier to understand.

To be able to update the chats list cache, we will implement a `chatRemoved` subscription. The subscription will be broadcasted only to those who’re participants of the published chat:

[{]: <helper> (diffStep 9.5 module="server")

#### [Server Step 9.5: Add Subscription.chatRemoved](https://github.com/Urigo/WhatsApp-Clone-Server/commit/7f6b7a4)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -151,7 +151,7 @@
 ┊151┊151┊      return chat
 ┊152┊152┊    },
 ┊153┊153┊
-┊154┊   ┊    removeChat(root, { chatId }, { currentUser }) {
+┊   ┊154┊    removeChat(root, { chatId }, { currentUser, pubsub }) {
 ┊155┊155┊      if (!currentUser) return null
 ┊156┊156┊
 ┊157┊157┊      const chatIndex = chats.findIndex(c => c.id === chatId)
```
```diff
@@ -172,6 +172,11 @@
 ┊172┊172┊
 ┊173┊173┊      chats.splice(chatIndex, 1)
 ┊174┊174┊
+┊   ┊175┊      pubsub.publish('chatRemoved', {
+┊   ┊176┊        chatRemoved: chat.id,
+┊   ┊177┊        targetChat: chat,
+┊   ┊178┊      })
+┊   ┊179┊
 ┊175┊180┊      return chatId
 ┊176┊181┊    }
 ┊177┊182┊  },
```
```diff
@@ -200,6 +205,17 @@
 ┊200┊205┊          return chatAdded.participants.some(p => p === currentUser.id)
 ┊201┊206┊        },
 ┊202┊207┊      )
+┊   ┊208┊    },
+┊   ┊209┊
+┊   ┊210┊    chatRemoved: {
+┊   ┊211┊      subscribe: withFilter(
+┊   ┊212┊        (root, args, { pubsub }) => pubsub.asyncIterator('chatRemoved'),
+┊   ┊213┊        ({ targetChat }: { targetChat: Chat }, args, { currentUser }) => {
+┊   ┊214┊          if (!currentUser) return false
+┊   ┊215┊
+┊   ┊216┊          return targetChat.participants.some(p => p === currentUser.id)
+┊   ┊217┊        },
+┊   ┊218┊      )
 ┊203┊219┊    }
 ┊204┊220┊  }
 ┊205┊221┊}
```

##### Changed schema&#x2F;typeDefs.graphql
```diff
@@ -40,4 +40,5 @@
 ┊40┊40┊type Subscription {
 ┊41┊41┊  messageAdded: Message!
 ┊42┊42┊  chatAdded: Chat!
+┊  ┊43┊  chatRemoved: ID!
 ┊43┊44┊}
```

[}]: #

In the client, we will define the right subscription document:

[{]: <helper> (diffStep 12.5 files="graphql/subscriptions" module="client")

#### Client Step 12.5: Update cache on chat removal

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

#### Client Step 12.5: Update cache on chat removal

##### Changed src&#x2F;services&#x2F;cache.service.ts
```diff
@@ -8,6 +8,7 @@
 ┊ 8┊ 8┊  ChatFragment,
 ┊ 9┊ 9┊  useMessageAddedSubscription,
 ┊10┊10┊  useChatAddedSubscription,
+┊  ┊11┊  useChatRemovedSubscription,
 ┊11┊12┊} from '../graphql/types';
 ┊12┊13┊
 ┊13┊14┊type Client = ApolloClient<any> | DataProxy;
```
```diff
@@ -28,6 +29,14 @@
 ┊28┊29┊      }
 ┊29┊30┊    }
 ┊30┊31┊  });
+┊  ┊32┊
+┊  ┊33┊  useChatRemovedSubscription({
+┊  ┊34┊    onSubscriptionData: ({ client, subscriptionData: { data } }) => {
+┊  ┊35┊      if (data) {
+┊  ┊36┊        eraseChat(client, data.chatRemoved);
+┊  ┊37┊      }
+┊  ┊38┊    }
+┊  ┊39┊  });
 ┊31┊40┊};
 ┊32┊41┊
 ┊33┊42┊export const writeMessage = (client: Client, message: MessageFragment) => {
```
```diff
@@ -131,3 +140,49 @@
 ┊131┊140┊    data: { chats },
 ┊132┊141┊  });
 ┊133┊142┊}
+┊   ┊143┊
+┊   ┊144┊export const eraseChat = (client: Client, chatId: string) => {
+┊   ┊145┊  const chatType = {
+┊   ┊146┊    __typename: 'Chat',
+┊   ┊147┊    id: chatId
+┊   ┊148┊  };
+┊   ┊149┊
+┊   ┊150┊  const chatIdFromObject = defaultDataIdFromObject(chatType);
+┊   ┊151┊  if (chatIdFromObject === null) {
+┊   ┊152┊    return;
+┊   ┊153┊  }
+┊   ┊154┊
+┊   ┊155┊  client.writeFragment({
+┊   ┊156┊    id: chatIdFromObject,
+┊   ┊157┊    fragment: fragments.fullChat,
+┊   ┊158┊    fragmentName: 'FullChat',
+┊   ┊159┊    data: null,
+┊   ┊160┊  })
+┊   ┊161┊
+┊   ┊162┊  let data;
+┊   ┊163┊  try {
+┊   ┊164┊    data = client.readQuery({
+┊   ┊165┊      query: queries.chats,
+┊   ┊166┊    });
+┊   ┊167┊  } catch (e) {
+┊   ┊168┊    return;
+┊   ┊169┊  }
+┊   ┊170┊
+┊   ┊171┊  if (!data || !data.chats) return;
+┊   ┊172┊
+┊   ┊173┊  const chats = data.chats;
+┊   ┊174┊
+┊   ┊175┊  if (!chats) return;
+┊   ┊176┊
+┊   ┊177┊  const chatIndex = chats.findIndex((c: any) => c.id === chatId);
+┊   ┊178┊
+┊   ┊179┊  if (chatIndex === -1) return;
+┊   ┊180┊
+┊   ┊181┊  // The chat will appear at the top of the ChatsList component
+┊   ┊182┊  chats.splice(chatIndex, 1);
+┊   ┊183┊
+┊   ┊184┊  client.writeQuery({
+┊   ┊185┊    query: queries.chats,
+┊   ┊186┊    data: { chats: chats },
+┊   ┊187┊  });
+┊   ┊188┊}
```

[}]: #

We will also update the `ChatRoomScreen` to redirect us to the `/chats` route if the chat was not found. The render method of the component will be re-triggered automatically by `react-apollo-hooks` if the cached result of `useGetChat()` hook has changed, which means that even if you didn’t actively remove the chat, you will still be redirected as a result:

[{]: <helper> (diffStep 12.5 files="ChatRoom" module="client")

#### Client Step 12.5: Update cache on chat removal

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;ChatNavbar.tsx
```diff
@@ -8,6 +8,7 @@
 ┊ 8┊ 8┊import styled from 'styled-components';
 ┊ 9┊ 9┊import { History } from 'history';
 ┊10┊10┊import { useRemoveChatMutation } from '../../graphql/types';
+┊  ┊11┊import { eraseChat } from '../../services/cache.service';
 ┊11┊12┊
 ┊12┊13┊const Container = styled(Toolbar) `
 ┊13┊14┊  padding: 0;
```
```diff
@@ -66,6 +67,9 @@
 ┊66┊67┊  const removeChat = useRemoveChatMutation({
 ┊67┊68┊    variables: {
 ┊68┊69┊      chatId: chat.id
+┊  ┊70┊    },
+┊  ┊71┊    update: (client, { data: { removeChat } }) => {
+┊  ┊72┊      eraseChat(client, removeChat);
 ┊69┊73┊    }
 ┊70┊74┊  });
 ┊71┊75┊
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
@@ -86,6 +87,13 @@
 ┊86┊87┊  if (loadingChat) return null;
 ┊87┊88┊  if (chat === null) return null;
 ┊88┊89┊
+┊  ┊90┊  // Chat was probably removed from cache by the subscription handler
+┊  ┊91┊  if (!chat) {
+┊  ┊92┊    return (
+┊  ┊93┊      <Redirect to="/chats" />
+┊  ┊94┊    );
+┊  ┊95┊  }
+┊  ┊96┊
 ┊89┊97┊  return (
 ┊90┊98┊    <Container>
 ┊91┊99┊      <ChatNavbar chat={chat} history={history} />
```

[}]: #

TODO: maybe mention that ApolloCache doesn’t have Garbage Collector so even though the object is removed, everything else related to it says in cache.


[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@0.1.0/.tortilla/manuals/views/step11.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@0.1.0/.tortilla/manuals/views/step13.md) |
|:--------------------------------|--------------------------------:|

[}]: #
