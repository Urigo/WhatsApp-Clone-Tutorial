# Step 4: Transition to GraphQL

[//]: # (head-end)


**What is GraphQL?**

[GraphQL](https://graphql.org/) is a query language invented by Facebook, and it's used to query data within our API. It allows clients to define the structure of the data required, and the exact same structure of data will be returned from the server, therefore preventing excessively large amounts of data from being returned. Unlike REST, GraphQL APIs are organized in terms of types and fields, not endpoints.

Currently in our app, if we'd like to get its chats we would send a GET request to `/chats`. With GraphQL it would be done differently with a string that describes the data that we would like to get:

```graphql
chats {
  id
  name
  picture
  lastMessage {
    id
    content
    createdAt
  }
}
```

> Above: An illustration of a potential GraphQL query sent to our Whatsapp API

**Why GraphQL and not REST?**

In terms of experience REST got the upper hand. It has been used for many more years and has proven itself to work well, and it's completely agnostic to the implementation of the back-end. However, when it comes to data projection and aggregation, it fails to deliver.

When using REST, often times you'll find yourself performing multiple requests to execute a single query of data. Not only that, you might even end up with additional data that is not necessary. Either way, the process would result in slower and heavier response.

With GraphQL we don't have that kind of problem. Queries may take many shapes and forms, and since GraphQL is schema based - it can handle it. You'll get exactly what you asked for with a single request. **GraphQL provides a dynamic API while REST doesn't.**

```graphql
# request
query {
  chat(id: 1) {
    id
    name
    lastMessage {
      id
      content
    }
  }
}
```

![graphql-request](https://user-images.githubusercontent.com/7648874/54133620-5aec8300-4451-11e9-9bda-a459dc48f57c.png)

```js
// response
{
  "data": {
    "chat": {
      "id": 1,
      "name": "Ethan Gonzalez",
      "lastMessage": {
        "id": 1,
        "content": "You on your way?"
      }
    }
  }
}
```

**GraphQL schema, in a nutshell**

Like said earlier,  GraphQL APIs are organized in terms of types and fields. That means that our app data should be described with a schema, where each field's gonna have a resolver - the handler that will return the corresponding data. Things will be much clearer as we move further.

Let's try to describe our app's data with a GraphQL schema and then dive into it:

```graphql
scalar Date

type Message {
  id: ID!
  content: String!
  createdAt: Date!
}

type Chat {
  id: ID!
  name: String!
  picture: String
  lastMessage: Message
}

type Query {
  chats: [Chat!]!
}
```

The schema is self explanatory in terms of what data it's compatible with. Supported built-in scalar types in GraphQL are:

- Int: Signed 32‐bit integer
- Float: Signed double-precision floating-point value
- String: UTF‐8 character sequence
- Boolean: true or false
- ID (serialized as String): A unique identifier, often used to refetch an object or as the key for a cache. While serialized as a String, ID signifies that it is not intended to be human‐readable

Any custom scalar can be declared with the `scalar` keyword, and custom types can be declared with the `type` keyword. However, you should know that some types are reserved by GraphQL itself; `Query` is one of them. The `Query` type will be used as the root for received queries by the clients, which means that we can send queries which start with the `chats` field. Other reserved types are:

- `type Query` - reserved for [GraphQL queries](https://graphql.org/learn/queries/#mutations).
- `type Mutation` - reserved for [GraphQL mutations.](https://graphql.github.io/learn/queries/)
- `type Subscription` - reserved for [GraphQL subscriptions.](https://www.apollographql.com/docs/react/advanced/subscriptions.html)

> As we're not gonna go through the entire GraphQL API, it's recommended to go through the [official learn section of the GraphQL website](https://graphql.org/learn/), but the information so far will definitely help you kick-start, plus the upcoming implementation.

**Getting started**

We will be implementing a GraphQL mechanism for the client and for the server. We will start with the server as things will make more sense, and we will be able to test it before we proceed into the client. Essentially GraphQL is connected into a HTTP endpoint, usually under `POST /graphql`, and so this is exactly what we're gonna do, connect the endpoint handler. Luckily, we don't have to implement that. A team called [Apollo](https://www.apollographql.com/) already did it for us, so we can use their implementation. We will install the required packages:

    $ npm install apollo-server-express body-parser graphql
    $ npm install --dev @types/body-parser @types/graphql

- [`graphql`](https://www.npmjs.com/package/graphql) - The core package of GraphQL that includes the resolvers for basic data-types.
- [`apollo-server-express`](https://www.npmjs.com/package/apollo-server-express) - Apollo's implementation for the GraphQL Express REST endpoint.
- [`body-parser`](https://www.npmjs.com/package/body-parser) - Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
- `@types/…` - TypeScript definitions

We can now connect Apollo's middleware under the `/graphql` route:

[{]: <helper> (diffStep "2.1" files="index.ts" module="server")

#### [Server Step 2.1: Setup Apollo GraphQL](https://github.com/Urigo/WhatsApp-Clone-Server/commit/61346cd)

##### Changed index.ts
```diff
@@ -1,10 +1,14 @@
+┊  ┊ 1┊import { ApolloServer, gql } from 'apollo-server-express'
+┊  ┊ 2┊import bodyParser from 'body-parser'
 ┊ 1┊ 3┊import cors from 'cors'
 ┊ 2┊ 4┊import express from 'express'
 ┊ 3┊ 5┊import { chats } from './db'
+┊  ┊ 6┊import schema from './schema'
 ┊ 4┊ 7┊
 ┊ 5┊ 8┊const app = express()
 ┊ 6┊ 9┊
 ┊ 7┊10┊app.use(cors())
+┊  ┊11┊app.use(bodyParser.json())
 ┊ 8┊12┊
 ┊ 9┊13┊app.get('/_ping', (req, res) => {
 ┊10┊14┊  res.send('pong')
```
```diff
@@ -14,6 +18,13 @@
 ┊14┊18┊  res.json(chats)
 ┊15┊19┊})
 ┊16┊20┊
+┊  ┊21┊const server = new ApolloServer({ schema })
+┊  ┊22┊
+┊  ┊23┊server.applyMiddleware({
+┊  ┊24┊  app,
+┊  ┊25┊  path: '/graphql',
+┊  ┊26┊})
+┊  ┊27┊
 ┊17┊28┊const port = process.env.PORT || 4000
 ┊18┊29┊
 ┊19┊30┊app.listen(port, () => {
```

[}]: #

As you can see, the middleware requires a schema. A schema is composed mainly out of 2 fields:

- `typeDefs` (type definitions) - the schema types we wrote earlier this chapter for chats.
- `resolvers` - The handlers that will provide the data for each field in `typeDefs`.

We will start first by defining the types. All we have to do is to copy-paste the contents of the schema that was shown earlier into a new file called `typeDefs.graphql`:

[{]: <helper> (diffStep "2.2" files="schema/typeDefs.graphql" module="server")

#### [Server Step 2.2: Create a basic GraphQL schema](https://github.com/Urigo/WhatsApp-Clone-Server/commit/43886fc)

##### Added schema&#x2F;typeDefs.graphql
```diff
@@ -0,0 +1,18 @@
+┊  ┊ 1┊scalar Date
+┊  ┊ 2┊
+┊  ┊ 3┊type Message {
+┊  ┊ 4┊  id: ID!
+┊  ┊ 5┊  content: String!
+┊  ┊ 6┊  createdAt: Date!
+┊  ┊ 7┊}
+┊  ┊ 8┊
+┊  ┊ 9┊type Chat {
+┊  ┊10┊  id: ID!
+┊  ┊11┊  name: String!
+┊  ┊12┊  picture: String
+┊  ┊13┊  lastMessage: Message
+┊  ┊14┊}
+┊  ┊15┊
+┊  ┊16┊type Query {
+┊  ┊17┊  chats: [Chat!]!
+┊  ┊18┊}
```

[}]: #

The `.graphql` file extension is just a more convenient way to work with a GraphQL schema. The exported result should be a simple string that we can use to compose our GraphQL schema. The clear advantage of working with a dedicated file is that we get to have syntax highlight.

Now we will implement the resolvers. Resolvers are presented in a JSON object where each resolver name should match the field name it represents. You can read more about resolvers in [Apollo's official docs for resolvers](https://www.apollographql.com/docs/tutorial/resolvers.html). This is how our resolvers should look like:

[{]: <helper> (diffStep "2.2" files="schema/resolvers.ts" module="server")

#### [Server Step 2.2: Create a basic GraphQL schema](https://github.com/Urigo/WhatsApp-Clone-Server/commit/43886fc)

##### Added schema&#x2F;resolvers.ts
```diff
@@ -0,0 +1,14 @@
+┊  ┊ 1┊import { GraphQLDateTime } from 'graphql-iso-date'
+┊  ┊ 2┊import { chats } from '../db'
+┊  ┊ 3┊
+┊  ┊ 4┊const resolvers = {
+┊  ┊ 5┊  Date: GraphQLDateTime,
+┊  ┊ 6┊
+┊  ┊ 7┊  Query: {
+┊  ┊ 8┊    chats() {
+┊  ┊ 9┊      return chats
+┊  ┊10┊    },
+┊  ┊11┊  },
+┊  ┊12┊}
+┊  ┊13┊
+┊  ┊14┊export default resolvers
```

[}]: #

For now it's extremely simple, we map the chats query directly into the database collection. Each field in the resolvers object should match the GraphQL type it represents in the schema. Since we don't have any logic now, we should not implement any resolvers for the rest of the types, the data will simply be forwarded as is.

Note that we've implemented a custom scalar named `Date` and we resolved it with an NPM package. Let's install it:

    $ npm install graphql-iso-date
    $ npm install --dev @types/graphql-iso-date

Final thing that we have to do would be combining the resolvers and the type-defs under a single GraphQL schema.

[{]: <helper> (diffStep "2.2" files="index.ts" module="server")

#### [Server Step 2.2: Create a basic GraphQL schema](https://github.com/Urigo/WhatsApp-Clone-Server/commit/43886fc)

##### Added schema&#x2F;index.ts
```diff
@@ -0,0 +1,7 @@
+┊ ┊1┊import { importSchema } from 'graphql-import'
+┊ ┊2┊import { makeExecutableSchema } from 'graphql-tools'
+┊ ┊3┊import resolvers from './resolvers'
+┊ ┊4┊
+┊ ┊5┊const typeDefs = importSchema('schema/typeDefs.graphql')
+┊ ┊6┊
+┊ ┊7┊export default makeExecutableSchema({ resolvers, typeDefs })
```

[}]: #

[`graphql-import`](https://www.npmjs.com/package/graphql-import) and [`graphql-tools`](https://www.npmjs.com/package/graphql-tools) are utility packages that will help us create a schema that will be compatible with Apollo's API. Let's install them:

    $ npm install graphql-import graphql-tools

There's one optimization however that we should make in the our DB. Right now, the each chat document has a direct reference to a message via the `lastMessage` field. Practically speaking, this is NOT how the data sits in the DB. The `lastMessage` should only hold the ID for the correlated message, and then in the Node.JS app we should **resolve** it according to our needs. Let's make the appropriate changes in the DB then:

[{]: <helper> (diffStep "2.3" files="db.ts" module="server")

#### [Server Step 2.3: Resolve Chat.lastMessage](https://github.com/Urigo/WhatsApp-Clone-Server/commit/f3aa258)



[}]: #

And a resolver to the `lastMessage` field:

[{]: <helper> (diffStep "2.3" files="schema/typeDefs.graphql" module="server")

#### [Server Step 2.3: Resolve Chat.lastMessage](https://github.com/Urigo/WhatsApp-Clone-Server/commit/f3aa258)



[}]: #

The first argument of the resolver is the raw chat data received by the DB, and the returned result should be the mapped value which we would like to return to the client.

As we get further in this tutorial we should get a better grasp regards resolvers and their API, since we will have to deal with more logic and complexity within our Node.JS app.

Assuming that the server is running, we can already test our GraphQL endpoint. Because it's exposed to us via a REST endpoint, we can use a `$ curl` command to send a request to `GET localhost:4000/graphql` and get a response with all the data. Again, the query that we're gonna use to fetch the chats is:

```graphql
chats {
  id
  name
  picture
  lastMessage {
    id
    content
    createdAt
  }
}
```

The one-liner version of it with a `$ curl` command looks like so:

    curl \
      -X POST \
      -H "Content-Type: application/json" \
      --data '{ "query": "{ chats { id name picture lastMessage { id content createdAt } } }" }' \
      localhost:4000/graphql

As a response we should get the data-mock for our chats stored in the server. Since we have that in place, we can go ahead and delete our implementation for the `GET /chats` route.

Another way to test and inspect our GraphQL schema would be by using an IDE for the browser called [GraphQL Playground](https://github.com/prisma/graphql-playground). Apollo-Server ships with it right out of the box and can be used right away by navigating to the `localhost:4000/graphql` URL from the browser.

[![](https://i.imgur.com/AE5W6OW.png)](https://graphqlbin.com/v2/6RQ6TM)

So getting back to the client, all we have to do is to change the fetching URL in the ChatsList component to use our newly implemented GraphQL REST endpoint:

[{]: <helper> (diffStep "4.1" module="client")

#### [Client Step 4.1: Replace REST call with GraphQL call](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/88f7abd)

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.tsx
```diff
@@ -56,12 +56,33 @@
 ┊56┊56┊  font-size: 13px;
 ┊57┊57┊`
 ┊58┊58┊
+┊  ┊59┊const getChatsQuery = `
+┊  ┊60┊  query GetChats {
+┊  ┊61┊    chats {
+┊  ┊62┊      id
+┊  ┊63┊      name
+┊  ┊64┊      picture
+┊  ┊65┊      lastMessage {
+┊  ┊66┊        id
+┊  ┊67┊        content
+┊  ┊68┊        createdAt
+┊  ┊69┊      }
+┊  ┊70┊    }
+┊  ┊71┊  }
+┊  ┊72┊`
+┊  ┊73┊
 ┊59┊74┊const ChatsList = () => {
 ┊60┊75┊  const [chats, setChats] = useState([])
 ┊61┊76┊
 ┊62┊77┊  useMemo(async () => {
-┊63┊  ┊    const body = await fetch(`${process.env.REACT_APP_SERVER_URL}/chats`)
-┊64┊  ┊    const chats = await body.json()
+┊  ┊78┊    const body = await fetch(`${process.env.REACT_APP_SERVER_URL}/graphql`, {
+┊  ┊79┊      method: 'POST',
+┊  ┊80┊      headers: {
+┊  ┊81┊        'Content-Type': 'application/json',
+┊  ┊82┊      },
+┊  ┊83┊      body: JSON.stringify({ query: getChatsQuery }),
+┊  ┊84┊    })
+┊  ┊85┊    const { data: { chats } } = await body.json()
 ┊65┊86┊    setChats(chats)
 ┊66┊87┊  }, [true])
```

[}]: #

The received data should be similar to the previous one. No further changes are required. In the next chapter, we will continue working on the UI of our front-end application and we will add a new screen to the flow - the `ChatRoomScreen`.


[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/final@next/.tortilla/manuals/views/step3.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/final@next/.tortilla/manuals/views/step5.md) |
|:--------------------------------|--------------------------------:|

[}]: #
