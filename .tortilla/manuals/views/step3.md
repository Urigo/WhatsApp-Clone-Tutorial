# Step 3: Setup a basic Node.JS server with a basic REST endpoint

[//]: # (head-end)


So we have a running app with a single screen which looks stylish and presents some data to the user. There is something missing though. The data that is presented is just a mock for a server response, and it represents the schema of some real data to come.

Even if we'll create real data on the client, that means that when the client is down, all the data is lost. But this is a social app, many people want to use it together and even the same person wants to use it on multiple devices. For that, we need a central place to store all data and all the clients would connect to that central place in order to retrieve or change the data.

In this step, we will write a Node.JS server and will expose a REST endpoint that will serve the data-mock. We will build the REST application using [Express](https://www.npmjs.com/package/express). Further in this tutorial, we will migrate to using a real data-base with real I/O from the user, so we got you covered.

The plan is to have a server up and running at `localhost:4000` that will expose a `GET /chats` route. Unlike our client application, we're not gonna use any boilerplate and we're gonna set everything up manually. Ofcourse, you should feel free to use a boilerplate if it looks right to you. Right outside the client project, we will create a new directory called `whatsapp-clone-server` in which we will start creating our server:

    $ mkdir whatsapp-clone-server
    $ cd whatsapp-clone-server

Then we will use NPM to initialize a new project:

    $ npm init --yes

> `--yes` will answer yes to all questions and skip the prompt. It's just faster this way.

There's nothing special about this command, it only creates a basic package.json which we can add things on top (see [NPM's official docs](https://docs.npmjs.com/cli/init)). Just to make sure that things work, we will add an `index.js` file which will print "hello world" to the console.

[{]: <helper> (diffStep "1.1" files="index.js" module="server")

#### [Server Step 1.1: Create start script](https://github.com/Urigo/WhatsApp-Clone-Server/commit/6db07e1)

##### Added index.js
```diff
@@ -0,0 +1 @@
+┊ ┊1┊console.log('hello world')
```

[}]: #


And we will add a startup script to the `package.json` file called `start`:

    start: node index.js

NPM-scripts are just a way to defined an alias for commands. Now we only have one simple script, but it can turn out to be something very complex depending on our server, so it can be very useful. More about npm-scripts can be found in the [official NPM docs](https://docs.npmjs.com/misc/scripts).

Now we can run our server by running `$ npm start` and we should see the message "hello world" printed to the console, as expected.

Like in our client's app, we will be using TypeScript. It's comfortable and it enables consistency between both apps. In order to use TypeScript we will install few packages:

    $ npm install --dev typescript ts-node @types/node

> Note how we used the `--dev` flag. This project is not gonna be required as an external dependency anywhere, but It is still common to separate between production dependencies and development dependencies. More about the `--dev` option can be read in the [NPM-install docs](https://docs.npmjs.com/cli/install).

- The [`typescript`](https://www.npmjs.com/package/typescript) package is TypeScript's core transpiler.
- [`ts-node`](https://www.npmjs.com/package/ts-node) is an interpreter that will transpile required `.ts` files into JavaScript at runtime.
- [`@types/node`](https://www.npmjs.com/package/@types/node) will make the appropriate definitions for a Node.JS environment.

> You can read more about the `@types` monorepo in the [official GitHub repository](https://github.com/DefinitelyTyped/DefinitelyTyped).

Our server is gonna use the following `tsconfig.json` file, feel free to make the necessary modifications based on your needs:

[{]: <helper> (diffStep "1.2" files="tsconfig.json" module="server")

#### [Server Step 1.2: Setup TypeScript](https://github.com/Urigo/WhatsApp-Clone-Server/commit/eb61b6b)

##### Added tsconfig.json
```diff
@@ -0,0 +1,16 @@
+┊  ┊ 1┊{
+┊  ┊ 2┊  "compilerOptions": {
+┊  ┊ 3┊    "target": "es2018",
+┊  ┊ 4┊    "module": "commonjs",
+┊  ┊ 5┊    "lib": [
+┊  ┊ 6┊      "es2018",
+┊  ┊ 7┊      "esnext.asynciterable"
+┊  ┊ 8┊    ],
+┊  ┊ 9┊    "strict": true,
+┊  ┊10┊    "strictFunctionTypes": false,
+┊  ┊11┊    "strictPropertyInitialization": false,
+┊  ┊12┊    "esModuleInterop": true,
+┊  ┊13┊    "experimentalDecorators": true,
+┊  ┊14┊    "emitDecoratorMetadata": true
+┊  ┊15┊  }
+┊  ┊16┊}
```

[}]: #

We will rename the `index.js` file to `index.ts`:

    $ mv index.js index.ts

And we will update the npm-script `start` to use `ts-node`, since we wanna use TypeScript, and not JavaScript directly:

    start: ts-node index.ts

We can test the startup of our server again by running `$ npm start` and we should see the message "hello world" printed to the console. The skeleton of the project is set and we can move on to implementing the REST API.

Like we said at the beginning, we will be using Express to setup the API. Express is wrap around the native [Node.JS "http"](https://nodejs.org/api/http.html) library which is responsible for handling HTTP requests. Yes, it can also be used directly, but Express is much more comfortable and has an amazing ecosystem built around it. Let's install Express and its TypeScript definitions:

    $ npm install express
    $ npm install --dev @types/express

Before we implement the `GET /chats` route we will implement a `GET /_ping` route. This route will be used to determine whether the server is up and running or not, and how fast the connection is based on the response time. For every request sent to this route, we should expect a response saying "pong". Some call it "heartbeat", because this route is being tested repeatedly by the hosting machine to check if it's alive, just like a heartbeat in a way. This is how the route should look like:

[{]: <helper> (diffStep "1.3" files="index.ts" module="server")

#### [Server Step 1.3: Setup a Express with a basic health check route](https://github.com/Urigo/WhatsApp-Clone-Server/commit/d04acfb)

##### Changed index.ts
```diff
@@ -1 +1,13 @@
-┊ 1┊  ┊console.log('hello world')
+┊  ┊ 1┊import express from 'express'
+┊  ┊ 2┊
+┊  ┊ 3┊const app = express()
+┊  ┊ 4┊
+┊  ┊ 5┊app.get('/_ping', (req, res) => {
+┊  ┊ 6┊  res.send('pong')
+┊  ┊ 7┊})
+┊  ┊ 8┊
+┊  ┊ 9┊const port = process.env.PORT || 4000
+┊  ┊10┊
+┊  ┊11┊app.listen(port, () => {
+┊  ┊12┊  console.log(`Server is listening on port ${port}`)
+┊  ┊13┊})
```

[}]: #

We can use the `$ curl localhost:4000/_ping` command to send a request to the server and we should get a "pong", assuming that the server available on that URL. The `GET /chats` should be implemented similarly, only the response is different. Instead of returning "pong" we will return the data-mock for our chats:

[{]: <helper> (diffStep "1.4" files="index.ts, db.ts" module="server")

#### [Server Step 1.4: Create GET /chats route](https://github.com/Urigo/WhatsApp-Clone-Server/commit/db8fcca)

##### Added db.ts
```diff
@@ -0,0 +1,49 @@
+┊  ┊ 1┊export const messages = [
+┊  ┊ 2┊  {
+┊  ┊ 3┊    id: '1',
+┊  ┊ 4┊    content: "You on your way?",
+┊  ┊ 5┊    createdAt: new Date(new Date('1-1-2019').getTime() - 60 * 1000 * 1000),
+┊  ┊ 6┊  },
+┊  ┊ 7┊  {
+┊  ┊ 8┊    id: '2',
+┊  ┊ 9┊    content: "Hey, it's me",
+┊  ┊10┊    createdAt: new Date(new Date('1-1-2019').getTime() - 2 * 60 * 1000 * 1000),
+┊  ┊11┊  },
+┊  ┊12┊  {
+┊  ┊13┊    id: '3',
+┊  ┊14┊    content: "I should buy a boat",
+┊  ┊15┊    createdAt: new Date(new Date('1-1-2019').getTime() - 24 * 60 * 1000 * 1000),
+┊  ┊16┊  },
+┊  ┊17┊  {
+┊  ┊18┊    id: '4',
+┊  ┊19┊    content: "This is wicked good ice cream.",
+┊  ┊20┊    createdAt: new Date(new Date('1-1-2019').getTime() - 14 * 24 * 60 * 1000 * 1000),
+┊  ┊21┊  },
+┊  ┊22┊]
+┊  ┊23┊
+┊  ┊24┊export const chats = [
+┊  ┊25┊  {
+┊  ┊26┊    id: '1',
+┊  ┊27┊    name: 'Ethan Gonzalez',
+┊  ┊28┊    picture: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
+┊  ┊29┊    lastMessage: '1',
+┊  ┊30┊  },
+┊  ┊31┊  {
+┊  ┊32┊    id: '2',
+┊  ┊33┊    name: 'Bryan Wallace',
+┊  ┊34┊    picture: 'https://randomuser.me/api/portraits/thumb/men/2.jpg',
+┊  ┊35┊    lastMessage: '2',
+┊  ┊36┊  },
+┊  ┊37┊  {
+┊  ┊38┊    id: '3',
+┊  ┊39┊    name: 'Avery Stewart',
+┊  ┊40┊    picture: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
+┊  ┊41┊    lastMessage: '3',
+┊  ┊42┊  },
+┊  ┊43┊  {
+┊  ┊44┊    id: '4',
+┊  ┊45┊    name: 'Katie Peterson',
+┊  ┊46┊    picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
+┊  ┊47┊    lastMessage: '4',
+┊  ┊48┊  },
+┊  ┊49┊]
```

##### Changed index.ts
```diff
@@ -1,4 +1,5 @@
 ┊1┊1┊import express from 'express'
+┊ ┊2┊import { chats } from './db'
 ┊2┊3┊
 ┊3┊4┊const app = express()
 ┊4┊5┊
```
```diff
@@ -6,6 +7,10 @@
 ┊ 6┊ 7┊  res.send('pong')
 ┊ 7┊ 8┊})
 ┊ 8┊ 9┊
+┊  ┊10┊app.get('/chats', (req, res) => {
+┊  ┊11┊  res.json(chats)
+┊  ┊12┊})
+┊  ┊13┊
 ┊ 9┊14┊const port = process.env.PORT || 4000
 ┊10┊15┊
 ┊11┊16┊app.listen(port, () => {
```

[}]: #

Unlike the previous route, we used the `.json()` method this time around to send a response. This will simply stringify the given JSON and set the right headers. Similarly to the client, we've defined the db mock in a dedicated file, as this is easier to maintain and look at.

It's also recommended to connect a middleware called [`cors`](https://www.npmjs.com/package/cors) which will enable cross-origin requests. Without it we will only be able to make requests in localhost, something which is likely to limit us in the future because we would probably host our server somewhere separate than the client application. Let's install the `cors` library and load it with the Express `middleware()` function:

    $ npm install cors

[{]: <helper> (diffStep "1.4" files="index.ts" module="server")

#### [Server Step 1.4: Create GET /chats route](https://github.com/Urigo/WhatsApp-Clone-Server/commit/db8fcca)

##### Changed index.ts
```diff
@@ -1,4 +1,5 @@
 ┊1┊1┊import express from 'express'
+┊ ┊2┊import { chats } from './db'
 ┊2┊3┊
 ┊3┊4┊const app = express()
 ┊4┊5┊
```
```diff
@@ -6,6 +7,10 @@
 ┊ 6┊ 7┊  res.send('pong')
 ┊ 7┊ 8┊})
 ┊ 8┊ 9┊
+┊  ┊10┊app.get('/chats', (req, res) => {
+┊  ┊11┊  res.json(chats)
+┊  ┊12┊})
+┊  ┊13┊
 ┊ 9┊14┊const port = process.env.PORT || 4000
 ┊10┊15┊
 ┊11┊16┊app.listen(port, () => {
```

[}]: #

The server is now ready to use! So getting back to the client, first we will define our server's URL under the `.env` file:

[{]: <helper> (diffStep "3.1" module="client")

#### [Client Step 3.1: Define server URL](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/30e5400)

##### Added .env
```diff
@@ -0,0 +1 @@
+┊ ┊1┊REACT_APP_SERVER_URL=http://localhost:4000🚫↵
```

[}]: #

This will make our server's URL available under the `process.env.REACT_APP_SERVER_URL` member expression and it will be replaced with a fixed value at build time, just like macros. The `.env` file is a file which will automatically be loaded to `process.env` by the [`dotenv`](https://www.npmjs.com/package/dotenv) NPM package. `react-scripts` then filters environment variables which have a `REACT_APP_` prefix and provides the created JSON to a Webpack plugin called [DefinePlugin](https://webpack.js.org/plugins/define-plugin/), which will result in the macro effect.

Now let's move back into our React app folder. We will now replace the local data-mock usage with a fetch from the server. For that we can use the native [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), however, it needs to be used in the right life-cycle hook of the React.Component.

There are 2 naive approaches for that:

- Calling `fetch()` outside the component, but this way that chats will be fetched even if we're not even intending to create an instance of the component.

```js
fetch().then(() => /* ... */)
const MyComponent = () => {}
```

- Calling `fetch()` inside the component, but then it will be invoked whenever the component is re-rendered.

```js
const MyComponent = () => {
  fetch().then(() => /* ... */)
}
```

These 2 approaches indeed work, but they both fail to deliver what's necessary on the right time. In addition, there's no way to properly coordinate async function calls with the render method of the component.

**Introducing: React hooks**

With React hooks we can invoke the desired logic in the right life-cycle stage of the target component. This way we can avoid potential memory leaks or extra calculations. To implement a proper `fetch()`, we will be using 2 React hooks:

- [`React.useState()`](https://reactjs.org/docs/hooks-reference.html#usestate) - which is used to get and set a state of the component - will be used to store the fetch chats.

```js
const [value, setValue] = useState(initialValue)
```

- [`React.useMemo()`](https://reactjs.org/docs/hooks-reference.html#usememo) - which is used to run a computation only once certain conditions were met - will be used to run the `fetch()` function only once the component has mounted.

```js
const memoizedValue = useMemo(calcFn, [cond1, cond2, ...conds])
```

The result of that approach will look like this, in the context of our ChatsList component:

[{]: <helper> (diffStep "3.2" module="client")

#### [Client Step 3.2: Fetch chats using native fetch API](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/0201332)

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.tsx
```diff
@@ -1,8 +1,8 @@
 ┊1┊1┊import { List, ListItem } from '@material-ui/core'
 ┊2┊2┊import moment from 'moment'
 ┊3┊3┊import * as React from 'react'
+┊ ┊4┊import { useState, useMemo } from 'react'
 ┊4┊5┊import styled from 'styled-components'
-┊5┊ ┊import { chats } from '../../db'
 ┊6┊6┊
 ┊7┊7┊const Container = styled.div `
 ┊8┊8┊  height: calc(100% - 56px);
```
```diff
@@ -56,25 +56,35 @@
 ┊56┊56┊  font-size: 13px;
 ┊57┊57┊`
 ┊58┊58┊
-┊59┊  ┊const ChatsList = () => (
-┊60┊  ┊  <Container>
-┊61┊  ┊    <StyledList>
-┊62┊  ┊      {chats.map((chat) => (
-┊63┊  ┊        <StyledListItem key={chat.id} button>
-┊64┊  ┊          <ChatPicture src={chat.picture} />
-┊65┊  ┊          <ChatInfo>
-┊66┊  ┊            <ChatName>{chat.name}</ChatName>
-┊67┊  ┊            {chat.lastMessage && (
-┊68┊  ┊              <React.Fragment>
-┊69┊  ┊                <MessageContent>{chat.lastMessage.content}</MessageContent>
-┊70┊  ┊                <MessageDate>{moment(chat.lastMessage.createdAt).format('HH:mm')}</MessageDate>
-┊71┊  ┊              </React.Fragment>
-┊72┊  ┊            )}
-┊73┊  ┊          </ChatInfo>
-┊74┊  ┊        </StyledListItem>
-┊75┊  ┊      ))}
-┊76┊  ┊    </StyledList>
-┊77┊  ┊  </Container>
-┊78┊  ┊)
+┊  ┊59┊const ChatsList = () => {
+┊  ┊60┊  const [chats, setChats] = useState([])
+┊  ┊61┊
+┊  ┊62┊  useMemo(async () => {
+┊  ┊63┊    const body = await fetch(`${process.env.REACT_APP_SERVER_URL}/chats`)
+┊  ┊64┊    const chats = await body.json()
+┊  ┊65┊    setChats(chats)
+┊  ┊66┊  }, [true])
+┊  ┊67┊
+┊  ┊68┊  return (
+┊  ┊69┊    <Container>
+┊  ┊70┊      <StyledList>
+┊  ┊71┊        {chats.map((chat) => (
+┊  ┊72┊          <StyledListItem key={chat.id} button>
+┊  ┊73┊            <ChatPicture src={chat.picture} />
+┊  ┊74┊            <ChatInfo>
+┊  ┊75┊              <ChatName>{chat.name}</ChatName>
+┊  ┊76┊              {chat.lastMessage && (
+┊  ┊77┊                <React.Fragment>
+┊  ┊78┊                  <MessageContent>{chat.lastMessage.content}</MessageContent>
+┊  ┊79┊                  <MessageDate>{moment(chat.lastMessage.createdAt).format('HH:mm')}</MessageDate>
+┊  ┊80┊                </React.Fragment>
+┊  ┊81┊              )}
+┊  ┊82┊            </ChatInfo>
+┊  ┊83┊          </StyledListItem>
+┊  ┊84┊        ))}
+┊  ┊85┊      </StyledList>
+┊  ┊86┊    </Container>
+┊  ┊87┊  )
+┊  ┊88┊}
 ┊79┊89┊
 ┊80┊90┊export default ChatsList
```

[}]: #

> It's recommended to read about React hooks and their basic concept at the [official React docs page](https://reactjs.org/docs/hooks-overview.html).

At this point we can get rid of `db.ts` file in the client, since we don't use it anymore:

    $ rm src/db.ts

That's it. Our ChatsListScreen is now connected to a working back-end. In the next step we will upgrade our REST API into a GraphQL API and we will create a basis for a more robust back-end.


[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/final@next/.tortilla/manuals/views/step2.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/final@next/.tortilla/manuals/views/step4.md) |
|:--------------------------------|--------------------------------:|

[}]: #
