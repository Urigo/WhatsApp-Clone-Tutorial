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

Everything looks nice in theory, but the main issue that arises from having type definitions is that we need to maintain and sync 2 similar code bases: A GraphQL schema and TypeScript type definitions. Both are essentially the same, and if so, why do we even need to maintain 2 code bases? Isn't there a tool which does that for us? A question which brings us straight to the point of the chapter.

**Introducing: GraphQL Code Generator**

With [GraphQL Code Generator](https://graphql-code-generator.com/) we can generate TypeScript definitions given a GraphQL schema, and a set of GraphQL documents if they are presented to us.



![graphql-codegen](https://user-images.githubusercontent.com/7648874/54940897-9f564380-4f66-11e9-9891-3b994a1daef1.png)


GraphQL Code Generator is a simple CLI tool that operates based on a configuration file and can generate TypeScript types for both Client and Server. We will start with generating types for the server, as the client types are dependent on them.

In the server project, install GraphQL Code Generator via NPM (or Yarn)

    $ npm install @graphql-codegen/cli --dev

Now GraphQL Code Generator can be used directly from the `scripts` section in the `package.json` file using the `gql-gen` binary. We're gonna call the code generation script "codegen":

```json
{
  "codegen": "gql-gen"
}
```

This command will automatically be referenced to a configuration file in the root of our project called `codegen.yml`. The essence of this file is to provide the code generator with the GraphQL schema, GraphQL documents, the output path of the type definition file/s and a set of plug-ins. More about the configuration file can be found in the [official website](https://graphql-code-generator.com/docs/getting-started/codegen-config).

In the server project, we will generate the `types/graphql.d.ts` file and we will use a couple of plug-ins to do that:



*   `@graphql-codegen/typescript` - Will generate the core TypeScript types from our GraphQL schema.
*   `@graphql-codegen/typescript-resolvers` - Will generate resolvers signatures with the generated TypeScript types.

> A full list of available plugins is available [here](https://graphql-code-generator.com/docs/plugins/). In addition, you can write your own [custom plugin](https://graphql-code-generator.com/docs/custom-codegen/write-your-plugin).

Let's install these 2 plugins:

    $ npm install @graphql-codegen/typescript @graphql-codegen/typescript-resolvers --dev

And write the `codegen.yml` file:

[{]: <helper> (diffStep 6.1 files="codegen.yml" module="server")

#### [Server Step 6.1: Setup GraphQL Code Generator](https://github.com/Urigo/WhatsApp-Clone-Server/commit/d56b979)

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

#### [Server Step 6.1: Setup GraphQL Code Generator](https://github.com/Urigo/WhatsApp-Clone-Server/commit/d56b979)

##### Changed .gitignore
```diff
@@ -1,2 +1,3 @@
 ┊1┊1┊node_modules
-┊2┊ ┊npm-debug.log🚫↵
+┊ ┊2┊npm-debug.log
+┊ ┊3┊types/graphql.d.ts🚫↵
```

[}]: #

Now we can import the `IResolvers` type from the file we've just created and use it in the `resolvers.ts` file to ensure our resolvers handlers have the right signature:

[{]: <helper> (diffStep 6.2 module="server")

#### [Server Step 6.2: Type resolvers](https://github.com/Urigo/WhatsApp-Clone-Server/commit/4e19e90)

##### Changed schema&#x2F;index.ts
```diff
@@ -1,7 +1,10 @@
 ┊ 1┊ 1┊import { importSchema } from 'graphql-import'
-┊ 2┊  ┊import { makeExecutableSchema } from 'graphql-tools'
+┊  ┊ 2┊import { makeExecutableSchema, IResolvers } from 'graphql-tools'
 ┊ 3┊ 3┊import resolvers from './resolvers'
 ┊ 4┊ 4┊
 ┊ 5┊ 5┊const typeDefs = importSchema('schema/typeDefs.graphql')
 ┊ 6┊ 6┊
-┊ 7┊  ┊export default makeExecutableSchema({ resolvers, typeDefs })
+┊  ┊ 7┊export default makeExecutableSchema({
+┊  ┊ 8┊  resolvers: resolvers as IResolvers,
+┊  ┊ 9┊  typeDefs,
+┊  ┊10┊})
```

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -1,18 +1,19 @@
 ┊ 1┊ 1┊import { GraphQLDateTime } from 'graphql-iso-date'
-┊ 2┊  ┊import { chats, messages } from '../db'
+┊  ┊ 2┊import { Message, chats, messages } from '../db'
+┊  ┊ 3┊import { Resolvers } from '../types/graphql'
 ┊ 3┊ 4┊
-┊ 4┊  ┊const resolvers = {
+┊  ┊ 5┊const resolvers: Resolvers = {
 ┊ 5┊ 6┊  Date: GraphQLDateTime,
 ┊ 6┊ 7┊
 ┊ 7┊ 8┊  Chat: {
-┊ 8┊  ┊    messages(chat: any) {
+┊  ┊ 9┊    messages(chat) {
 ┊ 9┊10┊      return messages.filter(m => chat.messages.includes(m.id))
 ┊10┊11┊    },
 ┊11┊12┊
-┊12┊  ┊    lastMessage(chat: any) {
+┊  ┊13┊    lastMessage(chat) {
 ┊13┊14┊      const lastMessage = chat.messages[chat.messages.length - 1]
 ┊14┊15┊
-┊15┊  ┊      return messages.find(m => m.id === lastMessage)
+┊  ┊16┊      return messages.find(m => m.id === lastMessage) || null
 ┊16┊17┊    },
 ┊17┊18┊  },
 ┊18┊19┊
```
```diff
@@ -21,13 +22,13 @@
 ┊21┊22┊      return chats
 ┊22┊23┊    },
 ┊23┊24┊
-┊24┊  ┊    chat(root: any, { chatId }: any) {
-┊25┊  ┊      return chats.find(c => c.id === chatId)
+┊  ┊25┊    chat(root, { chatId }) {
+┊  ┊26┊      return chats.find(c => c.id === chatId) || null
 ┊26┊27┊    },
 ┊27┊28┊  },
 ┊28┊29┊
 ┊29┊30┊  Mutation: {
-┊30┊  ┊    addMessage(root: any, { chatId, content }: any) {
+┊  ┊31┊    addMessage(root, { chatId, content }) {
 ┊31┊32┊      const chatIndex = chats.findIndex(c => c.id === chatId)
 ┊32┊33┊
 ┊33┊34┊      if (chatIndex === -1) return null
```
```diff
@@ -35,7 +36,7 @@
 ┊35┊36┊      const chat = chats[chatIndex]
 ┊36┊37┊      const recentMessage = messages[messages.length - 1]
 ┊37┊38┊      const messageId = String(Number(recentMessage.id) + 1)
-┊38┊  ┊      const message = {
+┊  ┊39┊      const message: Message = {
 ┊39┊40┊        id: messageId,
 ┊40┊41┊        createdAt: new Date(),
 ┊41┊42┊        content,
```

[}]: #

We will now repeat the same process in the client with few tweaks. Again, we will install GraphQL Code Generator:

    $ npm install @graphql-codegen/cli --dev

And we will define a script:

```json
{
  "codegen": "gql-gen"
}
```

This time around, because we're in the client, we will define a set of glob paths that will specify which files contain GraphQL documents. GraphQL Code Generator is smart enough to automatically recognize the documents within these files by looking at the `gql` template literal calls using the `typescript-operations` package. We will be using a plugin called `typescript-react-apollo` to generate React/Apollo-GraphQL hooks that can be used in our function components. Let's install the necessary plugins:

    $ npm install @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo --dev

And we will write the `codegen.yml` file:

[{]: <helper> (diffStep 9.1 files="codegen.yml" module="client")

#### [Client Step 9.1: Setup GraphQL Code Generator](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/1adba2d)

##### Added codegen.yml
```diff
@@ -0,0 +1,19 @@
+┊  ┊ 1┊schema: ../Whatsapp-Clone-Server/schema/typeDefs.graphql
+┊  ┊ 2┊documents:
+┊  ┊ 3┊  - ./src/components/**/*.tsx
+┊  ┊ 4┊  - ./src/graphql/fragments/**/*.ts
+┊  ┊ 5┊  - ./src/graphql/queries/**/*.ts
+┊  ┊ 6┊overwrite: true
+┊  ┊ 7┊generates:
+┊  ┊ 8┊  ./src/graphql/types.tsx:
+┊  ┊ 9┊    plugins:
+┊  ┊10┊      - typescript
+┊  ┊11┊      - typescript-operations
+┊  ┊12┊      - typescript-react-apollo
+┊  ┊13┊    # The combined options of all provided plug-ins
+┊  ┊14┊    # More information about the options below:
+┊  ┊15┊    # graphql-code-generator.com/docs/plugins/typescript-react-apollo#configuration
+┊  ┊16┊    config:
+┊  ┊17┊      withHOC: false
+┊  ┊18┊      withHooks: true
+┊  ┊19┊      withComponent: false
```

[}]: #

For the schema path we could have also provided a REST GraphQL endpoint that exposes a GraphQL schema. This way if there's an existing running GraphQL API, we can generate TypeScript types out of it, such as GitHub's GraphQL API. The advantages of providing a local path is that the server doesn't have to be running in order to generate types, which is more comfortable in development, and we can bypass authentication if the REST endpoint is guarded with such mechanism. This will be useful in further chapters when we're introduced to the concept of authentication.

Be sure to add a .gitignore rule:

[{]: <helper> (diffStep 9.1 files=".gitignore" module="client")

#### [Client Step 9.1: Setup GraphQL Code Generator](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/1adba2d)

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

Now we have TypeScript types available to us and we can replace `useQuery()` and `useMutation()` calls with the generated React hooks:

[{]: <helper> (diffStep 9.2 module="client")

#### [Client Step 9.2: Use GraphQL Codegen hooks](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/33e181d)

##### Changed src&#x2F;components&#x2F;ChatRoomScreen&#x2F;index.tsx
```diff
@@ -7,6 +7,7 @@
 ┊ 7┊ 7┊import ChatNavbar from './ChatNavbar'
 ┊ 8┊ 8┊import MessageInput from './MessageInput'
 ┊ 9┊ 9┊import MessagesList from './MessagesList'
+┊  ┊10┊import { useGetChatQuery, useAddMessageMutation } from '../../graphql/types'
 ┊10┊11┊import * as queries from '../../graphql/queries'
 ┊11┊12┊import * as fragments from '../../graphql/fragments'
 ┊12┊13┊
```
```diff
@@ -38,10 +39,10 @@
 ┊38┊39┊const ChatRoomScreen = ({ history, match }) => {
 ┊39┊40┊  const { params: { chatId } } = match
 ┊40┊41┊  const client = useApolloClient()
-┊41┊  ┊  const { data: { chat } } = useQuery(getChatQuery, {
+┊  ┊42┊  const { data: { chat }, loading: loadingChat } = useGetChatQuery({
 ┊42┊43┊    variables: { chatId }
 ┊43┊44┊  })
-┊44┊  ┊  const addMessage = useMutation(addMessageMutation)
+┊  ┊45┊  const addMessage = useAddMessageMutation()
 ┊45┊46┊
 ┊46┊47┊  const onSendMessage = useCallback((content) => {
 ┊47┊48┊    addMessage({
```
```diff
@@ -115,7 +116,7 @@
 ┊115┊116┊    })
 ┊116┊117┊  }, [chat])
 ┊117┊118┊
-┊118┊   ┊  if (!chat) return null
+┊   ┊119┊  if (loadingChat) return null
 ┊119┊120┊
 ┊120┊121┊  return (
 ┊121┊122┊    <Container>
```

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.tsx
```diff
@@ -3,9 +3,8 @@
 ┊ 3┊ 3┊import moment from 'moment'
 ┊ 4┊ 4┊import * as React from 'react'
 ┊ 5┊ 5┊import { useCallback } from 'react'
-┊ 6┊  ┊import { useQuery } from 'react-apollo-hooks'
 ┊ 7┊ 6┊import styled from 'styled-components'
-┊ 8┊  ┊import * as queries from '../../graphql/queries'
+┊  ┊ 7┊import { useChatsQuery } from '../../graphql/types'
 ┊ 9┊ 8┊
 ┊10┊ 9┊const Container = styled.div `
 ┊11┊10┊  height: calc(100% - 56px);
```
```diff
@@ -60,7 +59,7 @@
 ┊60┊59┊`
 ┊61┊60┊
 ┊62┊61┊const ChatsList = ({ history }) => {
-┊63┊  ┊  const { data: { chats = [] } } = useQuery(queries.chats)
+┊  ┊62┊  const { data: { chats = [] } } = useChatsQuery()
 ┊64┊63┊
 ┊65┊64┊  const navToChat = useCallback((chat) => {
 ┊66┊65┊    history.push(`chats/${chat.id}`)
```

[}]: #

To test if things are working properly, we can address a non existing field in one of the retrieved query results, for example `chat.foo` in `useGetChatQuery()`. We should receive the following typing error when trying to run the project:

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


[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/final@next/.tortilla/manuals/views/step8.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/final@next/.tortilla/manuals/views/step10.md) |
|:--------------------------------|--------------------------------:|

[}]: #
