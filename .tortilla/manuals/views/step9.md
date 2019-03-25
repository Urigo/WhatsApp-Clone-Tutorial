# Step 9: Type safety with GraphQL Code Generator

[//]: # (head-end)


So far we've been just writing code. If there was an error we would most likely discover it during runtime. As a reminder, we've created a project which is based on TypeScript, but we haven't really took any advantage of TypeScript's type safety mechanism. Currently, the TypeScript compiler is configured to work on loose mode, so any object which is not bound to any type will be converted to `any` - a type which is compatible with any type of casting and will ignore type errors.

So far it's been very convenient because we've only started to learn about building an app and the ecosystem around it, but for a long term project it's would be very handy to take a full advantage of TypeScript and not let it go under the radar. So where exactly are we missing type checkings? In the core of our project - when dealing with GraphQL documents.

When we run a query, or a mutation, we wanna make sure that we use the received data correctly, based on its intended shape and form. For example, given the following GraphQL query:

```graphql
query Chats {
  chats {
    id
    name
    picture
  }
}
```

We want to have the following TypeScript type:

```ts
export type Chat = {
  __typename?: "Chat"
  id: string
  name: string
  picture: string
}

export type ChatQuery = {
  __typename?: "Query"
  chats: Chats[]
}

```

So later on we can use it with `react-apollo-hooks` like so:

```ts
useQuery<ChatsQuery>(getChatsQuery)
```

Everything looks nice in theory, but the main issue that arises from having type definitions is that we need to maintain and sync 2 similar code bases:
A GraphQL schema and TypeScript type definitions.
Both are essentially the same, and if so, why do we even need to maintain 2 code bases?
Isn't there a tool which does that for us? A question which brings us straight to the point of the chapter.

**Introducing: GraphQL Code Generator**

With [GraphQL Code Generator](https://graphql-code-generator.com/) we can generate TypeScript definitions given a GraphQL schema, and a set of GraphQL documents if they are presented to us.



![graphql-codegen](https://user-images.githubusercontent.com/7648874/54940897-9f564380-4f66-11e9-9891-3b994a1daef1.png)


GraphQL Code Generator is a simple CLI tool that operates based on a configuration file and can generate TypeScript types for both Client and Server.
We will start with generating types for the server.

In the server project, install GraphQL Code Generator via Yarn

    $ yarn add @graphql-codegen/cli --dev

Now GraphQL Code Generator can be used directly from the `scripts` section in the `package.json` file using the `gql-gen` binary.
We're gonna call the code generation script "codegen":

```json
{
  "codegen": "gql-gen"
}
```

This command will automatically be referenced to a configuration file in the root of our project called `codegen.yml`.
The essence of this file is to provide the code generator with the GraphQL schema, GraphQL documents, the output path of the type definition file/s and a set of plug-ins.
More about the configuration file can be found in the [official website](https://graphql-code-generator.com/docs/getting-started/codegen-config).

In the server project, we will generate the `types/graphql.d.ts` file and we will use a couple of plug-ins to do that:



*   `@graphql-codegen/typescript` - Will generate the core TypeScript types from our GraphQL schema.
*   `@graphql-codegen/typescript-resolvers` - Will generate resolvers signatures with the generated TypeScript types.

> A full list of available plugins is available [here](https://graphql-code-generator.com/docs/plugins/). In addition, you can write your own [custom plugin](https://graphql-code-generator.com/docs/custom-codegen/write-your-plugin).

Let's install these 2 plugins:

    $ yarn add @graphql-codegen/typescript @graphql-codegen/typescript-resolvers --dev

And write the `codegen.yml` file:

[{]: <helper> (diffStep 6.1 files="codegen.yml" module="server")

#### [__Server__ Step 6.1: Setup GraphQL Code Generator](https://github.com/Urigo/WhatsApp-Clone-Server/commit/14af5f487960d30194befea37924aff4d563842b)

##### Added codegen.yml
```diff
@@ -0,0 +1,16 @@
+┊  ┊ 1┊schema: ./schema/typeDefs.graphql
+┊  ┊ 2┊overwrite: true
+┊  ┊ 3┊generates:
+┊  ┊ 4┊  ./types/graphql.d.ts:
+┊  ┊ 5┊    plugins:
+┊  ┊ 6┊      - typescript
+┊  ┊ 7┊      - typescript-resolvers
+┊  ┊ 8┊    config:
+┊  ┊ 9┊      mappers:
+┊  ┊10┊        # import { Message } from '../db'
+┊  ┊11┊        # The root types of Message resolvers
+┊  ┊12┊        Message: ../db#Message
+┊  ┊13┊        Chat: ../db#Chat
+┊  ┊14┊      scalars:
+┊  ┊15┊        # e.g. Message.createdAt will be of type Date
+┊  ┊16┊        Date: Date
```

[}]: #

> See inline comments to learn more about our configuration setup.

Now if you'll run `$ npm run codegen` you should see that a new file `types/graphql.d.ts` has been generated with all the necessary TypeScript types. Since these types are very likely to change as we extend our schema, there's no need to include them in our project, thus it's recommended to add the appropriate .gitignore rule:

[{]: <helper> (diffStep 6.1 files=".gitignore" module="server")

#### [__Server__ Step 6.1: Setup GraphQL Code Generator](https://github.com/Urigo/WhatsApp-Clone-Server/commit/14af5f487960d30194befea37924aff4d563842b)

##### Changed .gitignore
```diff
@@ -1,3 +1,4 @@
 ┊1┊1┊node_modules
 ┊2┊2┊npm-debug.log
-┊3┊ ┊test-results/🚫↵
+┊ ┊3┊test-results/
+┊ ┊4┊types/graphql.d.ts🚫↵
```

[}]: #

Now to make sure we always get the updated types, let's add a task that would run automatically before we start the server.
`prestart` is a saved word that means that when we run `yarn start` it will run that task automatically before running the script in `start`:

[{]: <helper> (diffStep 6.1 files="package.json" module="server")

#### [__Server__ Step 6.1: Setup GraphQL Code Generator](https://github.com/Urigo/WhatsApp-Clone-Server/commit/14af5f487960d30194befea37924aff4d563842b)

##### Changed package.json
```diff
@@ -7,14 +7,19 @@
 ┊ 7┊ 7┊  },
 ┊ 8┊ 8┊  "private": true,
 ┊ 9┊ 9┊  "scripts": {
+┊  ┊10┊    "prestart": "yarn codegen",
 ┊10┊11┊    "start": "ts-node index.ts",
 ┊11┊12┊    "test": "TZ=\"Asia/Jerusalem\" jest",
+┊  ┊13┊    "codegen": "gql-gen",
 ┊12┊14┊    "format": "prettier \"**/*.ts\" --write"
 ┊13┊15┊  },
 ┊14┊16┊  "jest-junit": {
 ┊15┊17┊    "outputDirectory": "./test-results"
 ┊16┊18┊  },
 ┊17┊19┊  "devDependencies": {
+┊  ┊20┊    "@graphql-codegen/cli": "1.4.0",
+┊  ┊21┊    "@graphql-codegen/typescript": "1.4.0",
+┊  ┊22┊    "@graphql-codegen/typescript-resolvers": "1.4.0",
 ┊18┊23┊    "@types/body-parser": "1.17.0",
 ┊19┊24┊    "@types/cors": "2.8.5",
 ┊20┊25┊    "@types/express": "4.17.0",
```

[}]: #

Now we can import the `IResolvers` type from the file we've just created and use it in the `resolvers.ts` file to ensure our resolvers handlers have the right signature:

[{]: <helper> (diffStep 6.2 module="server")

#### [__Server__ Step 6.2: Type resolvers](https://github.com/Urigo/WhatsApp-Clone-Server/commit/6bb889e1f3091716d665771dbb9ff0878b8dad38)

##### Changed schema&#x2F;index.ts
```diff
@@ -1,7 +1,10 @@
 ┊ 1┊ 1┊import { importSchema } from 'graphql-import';
-┊ 2┊  ┊import { makeExecutableSchema } from 'graphql-tools';
+┊  ┊ 2┊import { makeExecutableSchema, IResolvers } from 'graphql-tools';
 ┊ 3┊ 3┊import resolvers from './resolvers';
 ┊ 4┊ 4┊
 ┊ 5┊ 5┊const typeDefs = importSchema('schema/typeDefs.graphql');
 ┊ 6┊ 6┊
-┊ 7┊  ┊export default makeExecutableSchema({ resolvers, typeDefs });
+┊  ┊ 7┊export default makeExecutableSchema({
+┊  ┊ 8┊  resolvers: resolvers as IResolvers,
+┊  ┊ 9┊  typeDefs,
+┊  ┊10┊});
```

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -1,18 +1,19 @@
 ┊ 1┊ 1┊import { GraphQLDateTime } from 'graphql-iso-date';
-┊ 2┊  ┊import { chats, messages } from '../db';
+┊  ┊ 2┊import { Message, chats, messages } from '../db';
+┊  ┊ 3┊import { Resolvers } from '../types/graphql';
 ┊ 3┊ 4┊
-┊ 4┊  ┊const resolvers = {
+┊  ┊ 5┊const resolvers: Resolvers = {
 ┊ 5┊ 6┊  Date: GraphQLDateTime,
 ┊ 6┊ 7┊
 ┊ 7┊ 8┊  Chat: {
-┊ 8┊  ┊    messages(chat: any) {
+┊  ┊ 9┊    messages(chat) {
 ┊ 9┊10┊      return messages.filter(m => chat.messages.includes(m.id));
 ┊10┊11┊    },
 ┊11┊12┊
-┊12┊  ┊    lastMessage(chat: any) {
+┊  ┊13┊    lastMessage(chat) {
 ┊13┊14┊      const lastMessage = chat.messages[chat.messages.length - 1];
 ┊14┊15┊
-┊15┊  ┊      return messages.find(m => m.id === lastMessage);
+┊  ┊16┊      return messages.find(m => m.id === lastMessage) || null;
 ┊16┊17┊    },
 ┊17┊18┊  },
 ┊18┊19┊
```
```diff
@@ -21,13 +22,13 @@
 ┊21┊22┊      return chats;
 ┊22┊23┊    },
 ┊23┊24┊
-┊24┊  ┊    chat(root: any, { chatId }: any) {
-┊25┊  ┊      return chats.find(c => c.id === chatId);
+┊  ┊25┊    chat(root, { chatId }) {
+┊  ┊26┊      return chats.find(c => c.id === chatId) || null;
 ┊26┊27┊    },
 ┊27┊28┊  },
 ┊28┊29┊
 ┊29┊30┊  Mutation: {
-┊30┊  ┊    addMessage(root: any, { chatId, content }: any) {
+┊  ┊31┊    addMessage(root, { chatId, content }) {
 ┊31┊32┊      const chatIndex = chats.findIndex(c => c.id === chatId);
 ┊32┊33┊
 ┊33┊34┊      if (chatIndex === -1) return null;
```
```diff
@@ -36,7 +37,7 @@
 ┊36┊37┊
 ┊37┊38┊      const messagesIds = messages.map(currentMessage => Number(currentMessage.id));
 ┊38┊39┊      const messageId = String(Math.max(...messagesIds) + 1);
-┊39┊  ┊      const message = {
+┊  ┊40┊      const message: Message = {
 ┊40┊41┊        id: messageId,
 ┊41┊42┊        createdAt: new Date(),
 ┊42┊43┊        content,
```

[}]: #

We will now repeat the same process in the client with few tweaks. Again, we will install GraphQL Code Generator:

    $ yarn add @graphql-codegen/cli --dev

And we will define a script:

```json
{
  "codegen": "gql-gen"
}
```

This time around, because we're in the client, we will define a set of glob paths that will specify which files contain GraphQL documents.
GraphQL Code Generator is smart enough to automatically recognize the documents within these files by looking at the `gql` template literal calls using the `typescript-operations` package.
We will be using a plugin called `typescript-react-apollo` to generate React/Apollo-GraphQL hooks that can be used in our function components.
Let's install the necessary plugins:

    $ yarn add @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo @graphql-codegen/add


And we will write the `codegen.yml` file:

[{]: <helper> (diffStep 9.1 files="codegen.yml" module="client")

#### [__Client__ Step 9.1: Setup GraphQL Code Generator](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/6404df0581b923945f1876a9201b13a4a1ca2e7c)

##### Added codegen.yml
```diff
@@ -0,0 +1,20 @@
+┊  ┊ 1┊schema: ../WhatsApp-Clone-Server/schema/typeDefs.graphql
+┊  ┊ 2┊documents:
+┊  ┊ 3┊  - ./src/components/**/*.tsx
+┊  ┊ 4┊  - ./src/graphql/fragments/**/*.ts
+┊  ┊ 5┊  - ./src/graphql/queries/**/*.ts
+┊  ┊ 6┊overwrite: true
+┊  ┊ 7┊generates:
+┊  ┊ 8┊  ./src/graphql/types.tsx:
+┊  ┊ 9┊    plugins:
+┊  ┊10┊      - add: '/* eslint-disable */'
+┊  ┊11┊      - typescript
+┊  ┊12┊      - typescript-operations
+┊  ┊13┊      - typescript-react-apollo
+┊  ┊14┊    # The combined options of all provided plug-ins
+┊  ┊15┊    # More information about the options below:
+┊  ┊16┊    # graphql-code-generator.com/docs/plugins/typescript-react-apollo#configuration
+┊  ┊17┊    config:
+┊  ┊18┊      withHOC: false
+┊  ┊19┊      withHooks: true
+┊  ┊20┊      withComponent: false
```

[}]: #

Notice that we sent the schema as a local path.
We could have also provided a GraphQL endpoint that exposes a GraphQL schema.
This way if there's an existing running GraphQL API, we can generate TypeScript types out of it, such as GitHub's GraphQL API.
The advantages of providing a local path is that the server doesn't have to be running in order to generate types, which is more comfortable in development, and we can bypass authentication if the endpoint is guarded with such mechanism.
This will be useful in further chapters when we're introduced to the concept of authentication.

Be sure to add a .gitignore rule because we want to run the generator every time there is a change and don't want to rely on old generated types:

[{]: <helper> (diffStep 9.1 files=".gitignore" module="client")

#### [__Client__ Step 9.1: Setup GraphQL Code Generator](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/6404df0581b923945f1876a9201b13a4a1ca2e7c)

##### Changed .gitignore
```diff
@@ -21,3 +21,5 @@
 ┊21┊21┊npm-debug.log*
 ┊22┊22┊yarn-debug.log*
 ┊23┊23┊yarn-error.log*
+┊  ┊24┊
+┊  ┊25┊src/graphql/types.tsx
```

[}]: #

Now we have TypeScript types available to us and we can replace `useQuery()` and `useMutation()` calls with the generated React hooks.
Let's use those and also remove all the old manual typings:

[{]: <helper> (diffStep 9.2 module="client")

#### [__Client__ Step 9.2: Use GraphQL Codegen hooks](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/a1b7aa35a32f696d773b0e2e95d077059b1632c3)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;ChatNavbar.tsx
```diff
@@ -5,7 +5,6 @@
 ┊ 5┊ 5┊import { useCallback } from 'react';
 ┊ 6┊ 6┊import styled from 'styled-components';
 ┊ 7┊ 7┊import { History } from 'history';
-┊ 8┊  ┊import { ChatQueryResult } from './index';
 ┊ 9┊ 8┊
 ┊10┊ 9┊const Container = styled(Toolbar)`
 ┊11┊10┊  padding: 0;
```
```diff
@@ -37,7 +36,10 @@
 ┊37┊36┊
 ┊38┊37┊interface ChatNavbarProps {
 ┊39┊38┊  history: History;
-┊40┊  ┊  chat: ChatQueryResult;
+┊  ┊39┊  chat?: {
+┊  ┊40┊    picture?: string | null;
+┊  ┊41┊    name?: string | null;
+┊  ┊42┊  };
 ┊41┊43┊}
 ┊42┊44┊
 ┊43┊45┊const ChatNavbar: React.FC<ChatNavbarProps> = ({ chat, history }) => {
```
```diff
@@ -50,8 +52,12 @@
 ┊50┊52┊      <BackButton data-testid="back-button" onClick={navBack}>
 ┊51┊53┊        <ArrowBackIcon />
 ┊52┊54┊      </BackButton>
-┊53┊  ┊      <Picture data-testid="chat-picture" src={chat.picture} />
-┊54┊  ┊      <Name data-testid="chat-name">{chat.name}</Name>
+┊  ┊55┊      {chat && chat.picture && chat.name && (
+┊  ┊56┊        <React.Fragment>
+┊  ┊57┊          <Picture data-testid="chat-picture" src={chat.picture} />
+┊  ┊58┊          <Name data-testid="chat-name">{chat.name}</Name>
+┊  ┊59┊        </React.Fragment>
+┊  ┊60┊      )}
 ┊55┊61┊    </Container>
 ┊56┊62┊  );
 ┊57┊63┊};
```

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;MessagesList.tsx
```diff
@@ -3,7 +3,6 @@
 ┊3┊3┊import { useEffect, useRef } from 'react';
 ┊4┊4┊import ReactDOM from 'react-dom';
 ┊5┊5┊import styled from 'styled-components';
-┊6┊ ┊import { ChatQueryMessage } from './index';
 ┊7┊6┊
 ┊8┊7┊const Container = styled.div`
 ┊9┊8┊  display: block;
```
```diff
@@ -62,8 +61,13 @@
 ┊62┊61┊  font-size: 12px;
 ┊63┊62┊`;
 ┊64┊63┊
+┊  ┊64┊interface Message {
+┊  ┊65┊  id: string | null;
+┊  ┊66┊  content: string | null;
+┊  ┊67┊  createdAt: string | null;
+┊  ┊68┊}
 ┊65┊69┊interface MessagesListProps {
-┊66┊  ┊  messages: Array<ChatQueryMessage>;
+┊  ┊70┊  messages: Array<Message>;
 ┊67┊71┊}
 ┊68┊72┊
 ┊69┊73┊const MessagesList: React.FC<MessagesListProps> = ({ messages }) => {
```

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -2,12 +2,12 @@
 ┊ 2┊ 2┊import gql from 'graphql-tag';
 ┊ 3┊ 3┊import React from 'react';
 ┊ 4┊ 4┊import { useCallback } from 'react';
-┊ 5┊  ┊import { useQuery, useMutation } from 'react-apollo-hooks';
 ┊ 6┊ 5┊import styled from 'styled-components';
 ┊ 7┊ 6┊import ChatNavbar from './ChatNavbar';
 ┊ 8┊ 7┊import MessageInput from './MessageInput';
 ┊ 9┊ 8┊import MessagesList from './MessagesList';
 ┊10┊ 9┊import { History } from 'history';
+┊  ┊10┊import { ChatsQuery, useGetChatQuery, useAddMessageMutation } from '../../graphql/types';
 ┊11┊11┊import * as queries from '../../graphql/queries';
 ┊12┊12┊import * as fragments from '../../graphql/fragments';
 ┊13┊13┊
```
```diff
@@ -18,6 +18,7 @@
 ┊18┊18┊  height: 100vh;
 ┊19┊19┊`;
 ┊20┊20┊
+┊  ┊21┊// eslint-disable-next-line
 ┊21┊22┊const getChatQuery = gql`
 ┊22┊23┊  query GetChat($chatId: ID!) {
 ┊23┊24┊    chat(chatId: $chatId) {
```
```diff
@@ -27,6 +28,7 @@
 ┊27┊28┊  ${fragments.fullChat}
 ┊28┊29┊`;
 ┊29┊30┊
+┊  ┊31┊// eslint-disable-next-line
 ┊30┊32┊const addMessageMutation = gql`
 ┊31┊33┊  mutation AddMessage($chatId: ID!, $content: String!) {
 ┊32┊34┊    addMessage(chatId: $chatId, content: $content) {
```
```diff
@@ -41,21 +43,6 @@
 ┊41┊43┊  history: History;
 ┊42┊44┊}
 ┊43┊45┊
-┊44┊  ┊export interface ChatQueryMessage {
-┊45┊  ┊  id: string;
-┊46┊  ┊  content: string;
-┊47┊  ┊  createdAt: Date;
-┊48┊  ┊}
-┊49┊  ┊
-┊50┊  ┊export interface ChatQueryResult {
-┊51┊  ┊  id: string;
-┊52┊  ┊  name: string;
-┊53┊  ┊  picture: string;
-┊54┊  ┊  messages: Array<ChatQueryMessage>;
-┊55┊  ┊}
-┊56┊  ┊
-┊57┊  ┊type OptionalChatQueryResult = ChatQueryResult | null;
-┊58┊  ┊
 ┊59┊46┊interface ChatsResult {
 ┊60┊47┊  chats: any[];
 ┊61┊48┊}
```
```diff
@@ -64,15 +51,20 @@
 ┊64┊51┊  history,
 ┊65┊52┊  chatId,
 ┊66┊53┊}) => {
-┊67┊  ┊  const {
-┊68┊  ┊    data: { chat },
-┊69┊  ┊  } = useQuery<any>(getChatQuery, {
+┊  ┊54┊  const { data, loading } = useGetChatQuery({
 ┊70┊55┊    variables: { chatId },
 ┊71┊56┊  });
-┊72┊  ┊  const [addMessage] = useMutation(addMessageMutation);
+┊  ┊57┊
+┊  ┊58┊const [addMessage] = useAddMessageMutation();
 ┊73┊59┊
 ┊74┊60┊  const onSendMessage = useCallback(
 ┊75┊61┊    (content: string) => {
+┊  ┊62┊      if (data === undefined) {
+┊  ┊63┊        return null;
+┊  ┊64┊      }
+┊  ┊65┊      const chat = data.chat;
+┊  ┊66┊      if (chat === null) return null;
+┊  ┊67┊
 ┊76┊68┊      addMessage({
 ┊77┊69┊        variables: { chatId, content },
 ┊78┊70┊        optimisticResponse: {
```
```diff
@@ -89,12 +81,12 @@
 ┊ 89┊ 81┊        update: (client, { data: { addMessage } }) => {
 ┊ 90┊ 82┊          type FullChat = { [key: string]: any };
 ┊ 91┊ 83┊          let fullChat;
+┊   ┊ 84┊
 ┊ 92┊ 85┊          const chatIdFromStore = defaultDataIdFromObject(chat);
 ┊ 93┊ 86┊
 ┊ 94┊ 87┊          if (chatIdFromStore === null) {
 ┊ 95┊ 88┊            return;
 ┊ 96┊ 89┊          }
-┊ 97┊   ┊
 ┊ 98┊ 90┊          try {
 ┊ 99┊ 91┊            fullChat = client.readFragment<FullChat>({
 ┊100┊ 92┊              id: chatIdFromStore,
```
```diff
@@ -105,11 +97,10 @@
 ┊105┊ 97┊            return;
 ┊106┊ 98┊          }
 ┊107┊ 99┊
-┊108┊   ┊          if (fullChat === null) {
+┊   ┊100┊          if (fullChat === null || fullChat.messages === null) {
 ┊109┊101┊            return;
 ┊110┊102┊          }
-┊111┊   ┊          if (fullChat.messages.some((m: any) => m.id === addMessage.id))
-┊112┊   ┊            return;
+┊   ┊103┊          if (fullChat.messages.some((currentMessage: any) => currentMessage.id === addMessage.id)) return;
 ┊113┊104┊
 ┊114┊105┊          fullChat.messages.push(addMessage);
 ┊115┊106┊          fullChat.lastMessage = addMessage;
```
```diff
@@ -121,24 +112,24 @@
 ┊121┊112┊            data: fullChat,
 ┊122┊113┊          });
 ┊123┊114┊
-┊124┊   ┊          let data;
+┊   ┊115┊          let data: ChatsQuery | null;
 ┊125┊116┊          try {
-┊126┊   ┊            data = client.readQuery<ChatsResult>({
+┊   ┊117┊            data = client.readQuery({
 ┊127┊118┊              query: queries.chats,
 ┊128┊119┊            });
 ┊129┊120┊          } catch (e) {
 ┊130┊121┊            return;
 ┊131┊122┊          }
 ┊132┊123┊
-┊133┊   ┊          if (!data || data === null) {
-┊134┊   ┊            return null;
-┊135┊   ┊          }
-┊136┊   ┊          if (!data.chats || data.chats === undefined) {
+┊   ┊124┊          if (!data || !data.chats) {
 ┊137┊125┊            return null;
 ┊138┊126┊          }
 ┊139┊127┊          const chats = data.chats;
 ┊140┊128┊
-┊141┊   ┊          const chatIndex = chats.findIndex((c: any) => c.id === chatId);
+┊   ┊129┊          const chatIndex = chats.findIndex((c: any) => {
+┊   ┊130┊            if (addMessage === null || addMessage.chat === null) return -1;
+┊   ┊131┊            return c.id === addMessage.chat.id;
+┊   ┊132┊          });
 ┊142┊133┊          if (chatIndex === -1) return;
 ┊143┊134┊          const chatWhereAdded = chats[chatIndex];
 ┊144┊135┊
```
```diff
@@ -153,10 +144,17 @@
 ┊153┊144┊        },
 ┊154┊145┊      });
 ┊155┊146┊    },
-┊156┊   ┊    [chat, chatId, addMessage]
+┊   ┊147┊    [data, chatId, addMessage]
 ┊157┊148┊  );
 ┊158┊149┊
-┊159┊   ┊  if (!chat) return null;
+┊   ┊150┊  if (data === undefined) {
+┊   ┊151┊    return null;
+┊   ┊152┊  }
+┊   ┊153┊  const chat = data.chat;
+┊   ┊154┊  const loadingChat = loading;
+┊   ┊155┊
+┊   ┊156┊  if (loadingChat) return null;
+┊   ┊157┊  if (chat === null) return null;
 ┊160┊158┊
 ┊161┊159┊  return (
 ┊162┊160┊    <Container>
```

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.tsx
```diff
@@ -4,8 +4,7 @@
 ┊ 4┊ 4┊import styled from 'styled-components';
 ┊ 5┊ 5┊import { useCallback } from 'react';
 ┊ 6┊ 6┊import { History } from 'history';
-┊ 7┊  ┊import { useQuery } from 'react-apollo-hooks';
-┊ 8┊  ┊import * as queries from '../../graphql/queries';
+┊  ┊ 7┊import { useChatsQuery } from '../../graphql/types';
 ┊ 9┊ 8┊
 ┊10┊ 9┊const Container = styled.div`
 ┊11┊10┊  height: calc(100% - 56px);
```
```diff
@@ -64,8 +63,6 @@
 ┊64┊63┊}
 ┊65┊64┊
 ┊66┊65┊const ChatsList: React.FC<ChatsListProps> = ({ history }) => {
-┊67┊  ┊  const { data } = useQuery<any>(queries.chats);
-┊68┊  ┊
 ┊69┊66┊  const navToChat = useCallback(
 ┊70┊67┊    chat => {
 ┊71┊68┊      history.push(`chats/${chat.id}`);
```
```diff
@@ -73,6 +70,8 @@
 ┊73┊70┊    [history]
 ┊74┊71┊  );
 ┊75┊72┊
+┊  ┊73┊  const { data } = useChatsQuery();
+┊  ┊74┊
 ┊76┊75┊  if (data === undefined || data.chats === undefined) {
 ┊77┊76┊    return null;
 ┊78┊77┊  }
```

[}]: #

To test if things are working properly, we can address a non existing field in one of the retrieved query results, for example `chat.foo` in `useGetChatQuery()`.
We should receive the following typing error when trying to run the project:

```
TypeScript error: Property 'foo' does not exist on type '{ __typename?: "Chat"; } & { __typename?: "Chat"; } & { messages: ({ __typename?: "Message"; } & { __typename?: "Message"; } & Pick<Message, "id" | "createdAt" | "content">)[]; } & { __typename?: "Chat"; } & Pick<...> & { ...; }'.  TS2339

    44 |   const addMessage = useAddMessageMutation()
    45 |
  > 46 |   console.log(chat.foo)
       |                    ^
    47 |
    48 |   const onSendMessage = useCallback((content) => {
    49 |     addMessage({
```

TODO: Mappers are not explained - The root types of Message resolvers - doesn’t say much
we don’t need to use `resolvers as IResolvers`, there’s a flag for it, in codegen

TODO: Change `gql-gen` to `graphql-codegen`

[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step8.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step10.md) |
|:--------------------------------|--------------------------------:|

[}]: #
