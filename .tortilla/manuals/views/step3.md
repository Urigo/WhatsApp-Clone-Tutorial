# Step 3: Setup a basic Node.JS server with a basic REST endpoint

[//]: # (head-end)


Currently we have a running app with a single screen which looks stylish and presents some data to the user.

There is something missing though - The data that we are displaying can't be changed in any way.

But even if we change the data there is still a more fundamental issue - all of the data lives on the client.

That means that each client has its own copy of the data and the data is not shared between them,
if a client creates a new message, only that client will have the new message and not the client the message was sent to.

Also if the client shuts down, all the data will be lost.

So how can we have a place to put the data that is being shared between all clients?

We should find a central machine that all clients will connect to and get the data from.
If some client wants to create a new message, it will create it on that central machine so that the next time another clients will ask for the available messages,
all those messages will be available on the central machine.

That central machine that stores data is called a database and the machine that communicates between the database and the client is called a server.

In this step, we will write a NodeJS server (server that runs using the Javascript language) and will expose a REST endpoint that will serve the data-mock.
We will build the REST application using [Express](https://www.npmjs.com/package/express).
Later in this tutorial we will migrate to using a real data-base with real I/O from the user, because at this point, if the server shuts down all data will be lost.

The plan is to have a server up and running at `localhost:4000` that will expose a `GET /chats` route.
Unlike our client application, we're not gonna use any boilerplate and we're gonna set everything up manually.

Right outside the client project, we will create a new directory called `whatsapp-clone-server` in which we will start creating our server:

    $ mkdir whatsapp-clone-server
    $ cd whatsapp-clone-server

Then we will use `Yarn` to initialize a new project:

    $ yarn init -yp

There's nothing special about this command, it only creates a basic `package.json` file.
Just to make sure that things work, we will add an `index.js` file which will print `"hello world"` to the console.

[{]: <helper> (diffStep "1.1" files="index.js" module="server")

#### [__Server__ Step 1.1: Create start script](https://github.com/Urigo/WhatsApp-Clone-Server/commit/d403cd8817a32d36b80ede879382b358a487c632)

##### Added index.js
```diff
@@ -0,0 +1 @@
+┊ ┊1┊console.log('hello world')
```

[}]: #

And we will add a startup script to the `package.json` file called `start`:

    "scripts": {
      "start": "node index.js"
    }


TODO: Format on save


NPM-scripts are just a way to define an alias for commands. Now we only have one simple script,
but it can turn out to be something very complex depending on our server, so it can be very useful.
More about npm-scripts can be found in the [official NPM docs](https://docs.npmjs.com/misc/scripts).

Now we can run our server by running `$ yarn start` and we should see the message "hello world" printed to the console, as expected.

Like in our client's app, we will be using TypeScript.
In order to use TypeScript we will install a few packages:

    $ yarn add --dev typescript ts-node @types/node

> Note how we used the `--dev` flag. It is a good practice to separate between production dependencies and development dependencies.
That way when you deploy your server to the real environment, you won't install the unnecessary development dependencies there.
More about the `--dev` option can be read in the [NPM-install docs](https://docs.npmjs.com/cli/install).

- The [`typescript`](https://www.npmjs.com/package/typescript) package is TypeScript's core transpiler.
- [`ts-node`](https://www.npmjs.com/package/ts-node) is an interpreter that will transpile required `.ts` files into JavaScript at runtime.
- [`@types/node`](https://www.npmjs.com/package/@types/node) will make the appropriate definitions for a Node.JS environment.

> You can read more about the `@types` monorepo in the [official GitHub repository](https://github.com/DefinitelyTyped/DefinitelyTyped).

We will rename the `index.js` file to `index.ts`:

    $ mv index.js index.ts

Now we need to compile the `ts` file to turn it into a Javascript file the Node can run.

For that we will use Typescript and its `tsc` command.
The command has many options, but instead of writing them in the command line, we can specify them in a `tsconfig.json` file at the root of the project.

Our server is gonna use the following `tsconfig.json` file, feel free to make the necessary modifications based on your needs:

[{]: <helper> (diffStep "1.2" files="tsconfig.json" module="server")

#### [__Server__ Step 1.2: Setup TypeScript](https://github.com/Urigo/WhatsApp-Clone-Server/commit/15fed28bb19d67009ec2e0c3ffb3f2dbaf5c7d66)

##### Added tsconfig.json
```diff
@@ -0,0 +1,13 @@
+┊  ┊ 1┊{
+┊  ┊ 2┊  "compilerOptions": {
+┊  ┊ 3┊    "target": "es2020",
+┊  ┊ 4┊    "module": "commonjs",
+┊  ┊ 5┊    "skipLibCheck": true,
+┊  ┊ 6┊    "strict": true,
+┊  ┊ 7┊    "strictFunctionTypes": false,
+┊  ┊ 8┊    "strictPropertyInitialization": false,
+┊  ┊ 9┊    "esModuleInterop": true,
+┊  ┊10┊    "experimentalDecorators": true,
+┊  ┊11┊    "emitDecoratorMetadata": true
+┊  ┊12┊  }
+┊  ┊13┊}
```

[}]: #

Now let's run `tsc` and see what happens.

We've got a new `index.js` file!  Now let's run it by running `node index.js`.

That's great, but doing this work each time we change a file can be annoying,
so let's use tools to track when files change and make them run the code automatically after.

Let's update the npm-script `start` to use `ts-node`, since we wanna use TypeScript,
and not JavaScript directly:

    "start": "ts-node index.ts"

We can test the startup of our server again by running `$ yarn start` and we should see the message "hello world" printed to the console.

The skeleton of the project is set and we can move on to implementing the REST API.

Like we said at the beginning, we will be using Express to setup the API. Express is a wrapper around the native [Node.JS "http"](https://nodejs.org/api/http.html) library which is responsible for handling HTTP requests.
Yes, it can also be used directly, but Express is much more comfortable and has an amazing ecosystem built around it.
Let's install Express and its TypeScript definitions:

    $ yarn add express
    $ yarn add --dev @types/express

Before we implement the `GET /chats` route we will implement a `GET /_ping` route. This route will be used to determine whether the server is up and running,
and how fast the connection is based on the response time.
For every request sent to this route, we should expect a response saying "pong".
Some call it "heartbeat", because this route is being tested repeatedly by the hosting machine to check if it's alive, just like a heartbeat in a way.
This is how the route should look like:

[{]: <helper> (diffStep "1.3" files="index.ts" module="server")

#### [__Server__ Step 1.3: Setup a Express with a basic health check route](https://github.com/Urigo/WhatsApp-Clone-Server/commit/597194121326d2d8d59d46220dd1d74dba2e6375)

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

We can use the

        $ curl localhost:4000/_ping

command to send a request to the server and we should get a "pong", assuming that the server available on that URL.

**Code formatting**

Just like we talked in the first chapter, some developers write code in a different style than others and since we want to make it consistent, we're going to use **Prettier**.

    $ yarn add --dev prettier

We're going to define a npm script called `format`, few styling rules and we're also going to ignore *node_modules*:

[{]: <helper> (diffStep "1.4" files="package.json, .prettierrc.yml, .prettierignore" module="server")

#### [__Server__ Step 1.4: Use Prettier](https://github.com/Urigo/WhatsApp-Clone-Server/commit/5d65b6cbb7da1a481c566c1b95fdf7d267f58ad0)

##### Added .prettierignore
```diff
@@ -0,0 +1,2 @@
+┊ ┊1┊node_modules
+┊ ┊2┊.prettierrc.yml🚫↵
```

##### Added .prettierrc.yml
```diff
@@ -0,0 +1,2 @@
+┊ ┊1┊singleQuote: true
+┊ ┊2┊parser: 'typescript'
```

##### Changed package.json
```diff
@@ -7,11 +7,13 @@
 ┊ 7┊ 7┊  },
 ┊ 8┊ 8┊  "private": true,
 ┊ 9┊ 9┊  "scripts": {
-┊10┊  ┊    "start": "ts-node index.ts"
+┊  ┊10┊    "start": "ts-node index.ts",
+┊  ┊11┊    "format": "prettier \"**/*.ts\" --write"
 ┊11┊12┊  },
 ┊12┊13┊  "devDependencies": {
 ┊13┊14┊    "@types/express": "4.17.3",
 ┊14┊15┊    "@types/node": "13.9.5",
+┊  ┊16┊    "prettier": "2.0.2",
 ┊15┊17┊    "ts-node": "8.8.1",
 ┊16┊18┊    "typescript": "3.8.3"
 ┊17┊19┊  },
```

[}]: #

Now let's run:

    $ yarn format

Prettier should format your code:

[{]: <helper> (diffStep "1.4" files="index.ts" module="server")

#### [__Server__ Step 1.4: Use Prettier](https://github.com/Urigo/WhatsApp-Clone-Server/commit/5d65b6cbb7da1a481c566c1b95fdf7d267f58ad0)

##### Changed index.ts
```diff
@@ -1,13 +1,13 @@
-┊ 1┊  ┊import express from 'express'
+┊  ┊ 1┊import express from 'express';
 ┊ 2┊ 2┊
-┊ 3┊  ┊const app = express()
+┊  ┊ 3┊const app = express();
 ┊ 4┊ 4┊
 ┊ 5┊ 5┊app.get('/_ping', (req, res) => {
-┊ 6┊  ┊  res.send('pong')
-┊ 7┊  ┊})
+┊  ┊ 6┊  res.send('pong');
+┊  ┊ 7┊});
 ┊ 8┊ 8┊
-┊ 9┊  ┊const port = process.env.PORT || 4000
+┊  ┊ 9┊const port = process.env.PORT || 4000;
 ┊10┊10┊
 ┊11┊11┊app.listen(port, () => {
-┊12┊  ┊  console.log(`Server is listening on port ${port}`)
-┊13┊  ┊})
+┊  ┊12┊  console.log(`Server is listening on port ${port}`);
+┊  ┊13┊});
```

[}]: #

> Remember to run `yarn prettier` before you comit your changes!

The `GET /chats` should be implemented similarly, only the response is different. Instead of returning "pong" we will return the data-mock for our chats:

[{]: <helper> (diffStep "1.5" files="index.ts, db.ts" module="server")

#### [__Server__ Step 1.5: Create GET /chats route](https://github.com/Urigo/WhatsApp-Clone-Server/commit/f3e0731feb62920209659396398065654bc95dd6)

##### Added db.ts
```diff
@@ -0,0 +1,51 @@
+┊  ┊ 1┊export const messages = [
+┊  ┊ 2┊  {
+┊  ┊ 3┊    id: '1',
+┊  ┊ 4┊    content: 'You on your way?',
+┊  ┊ 5┊    createdAt: new Date(new Date('1-1-2019').getTime() - 60 * 1000 * 1000),
+┊  ┊ 6┊  },
+┊  ┊ 7┊  {
+┊  ┊ 8┊    id: '2',
+┊  ┊ 9┊    content: "Hey, it's me",
+┊  ┊10┊    createdAt: new Date(new Date('1-1-2019').getTime() - 2 * 60 * 1000 * 1000),
+┊  ┊11┊  },
+┊  ┊12┊  {
+┊  ┊13┊    id: '3',
+┊  ┊14┊    content: 'I should buy a boat',
+┊  ┊15┊    createdAt: new Date(new Date('1-1-2019').getTime() - 24 * 60 * 1000 * 1000),
+┊  ┊16┊  },
+┊  ┊17┊  {
+┊  ┊18┊    id: '4',
+┊  ┊19┊    content: 'This is wicked good ice cream.',
+┊  ┊20┊    createdAt: new Date(
+┊  ┊21┊      new Date('1-1-2019').getTime() - 14 * 24 * 60 * 1000 * 1000
+┊  ┊22┊    ),
+┊  ┊23┊  },
+┊  ┊24┊];
+┊  ┊25┊
+┊  ┊26┊export const chats = [
+┊  ┊27┊  {
+┊  ┊28┊    id: '1',
+┊  ┊29┊    name: 'Ethan Gonzalez',
+┊  ┊30┊    picture: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
+┊  ┊31┊    lastMessage: '1',
+┊  ┊32┊  },
+┊  ┊33┊  {
+┊  ┊34┊    id: '2',
+┊  ┊35┊    name: 'Bryan Wallace',
+┊  ┊36┊    picture: 'https://randomuser.me/api/portraits/thumb/men/2.jpg',
+┊  ┊37┊    lastMessage: '2',
+┊  ┊38┊  },
+┊  ┊39┊  {
+┊  ┊40┊    id: '3',
+┊  ┊41┊    name: 'Avery Stewart',
+┊  ┊42┊    picture: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
+┊  ┊43┊    lastMessage: '3',
+┊  ┊44┊  },
+┊  ┊45┊  {
+┊  ┊46┊    id: '4',
+┊  ┊47┊    name: 'Katie Peterson',
+┊  ┊48┊    picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
+┊  ┊49┊    lastMessage: '4',
+┊  ┊50┊  },
+┊  ┊51┊];
```

##### Changed index.ts
```diff
@@ -1,4 +1,5 @@
 ┊1┊1┊import express from 'express';
+┊ ┊2┊import { chats } from './db';
 ┊2┊3┊
 ┊3┊4┊const app = express();
 ┊4┊5┊
```
```diff
@@ -6,6 +7,10 @@
 ┊ 6┊ 7┊  res.send('pong');
 ┊ 7┊ 8┊});
 ┊ 8┊ 9┊
+┊  ┊10┊app.get('/chats', (req, res) => {
+┊  ┊11┊  res.json(chats);
+┊  ┊12┊});
+┊  ┊13┊
 ┊ 9┊14┊const port = process.env.PORT || 4000;
 ┊10┊15┊
 ┊11┊16┊app.listen(port, () => {
```

[}]: #

TODO: Mention `_req`

Check that we can get the chats by running:

        $ curl localhost:4000/chats

Unlike the previous route, we used the `.json()` method this time around to send a response. This will simply stringify the given JSON and set the right headers.
Similarly to the client, we've defined the db mock in a dedicated file, as this is easier to maintain and look at.

It's also recommended to connect a middleware called [`cors`](https://www.npmjs.com/package/cors) which will enable cross-origin requests.
Without it we will only be able to make requests in localhost, something which is likely to limit us in the future because we would probably host our server somewhere separate than the client application.
Without it it will also be impossible to call the server from our client app.
Let's install the `cors` library and load it with the Express `middleware()` function:

    $ yarn add cors

and its Typescript types:


    $ yarn add --dev @types/cors

[{]: <helper> (diffStep "1.6" files="index.ts" module="server")

#### [__Server__ Step 1.6: Use CORS](https://github.com/Urigo/WhatsApp-Clone-Server/commit/3ed00e0be478b889c119bc5d5b42a29228b41269)

##### Changed index.ts
```diff
@@ -1,8 +1,11 @@
+┊  ┊ 1┊import cors from 'cors';
 ┊ 1┊ 2┊import express from 'express';
 ┊ 2┊ 3┊import { chats } from './db';
 ┊ 3┊ 4┊
 ┊ 4┊ 5┊const app = express();
 ┊ 5┊ 6┊
+┊  ┊ 7┊app.use(cors());
+┊  ┊ 8┊
 ┊ 6┊ 9┊app.get('/_ping', (req, res) => {
 ┊ 7┊10┊  res.send('pong');
 ┊ 8┊11┊});
```

[}]: #

The server is now ready to use!

So getting back to the client, first we will define our server's URL under the `.env` file:

[{]: <helper> (diffStep "3.1" module="client")

#### [__Client__ Step 3.1: Define server URL](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/6f42ef8f42ba1c16e05ca45fea026f1731aa8b69)

##### Added .env
```diff
@@ -0,0 +1 @@
+┊ ┊1┊REACT_APP_SERVER_URL=http://localhost:4000🚫↵
```

[}]: #

This will make our server's URL available under the `process.env.REACT_APP_SERVER_URL` member expression and it will be replaced with a fixed value at build time, just like macros.
The `.env` file is a file which will automatically be loaded to `process.env` by the [`dotenv`](https://www.npmjs.com/package/dotenv) NPM package.
`react-scripts` then filters environment variables which have a `REACT_APP_` prefix and provides the created JSON to a Webpack plugin called [DefinePlugin](https://webpack.js.org/plugins/define-plugin/), which will result in the macro effect.

Now let's move back into our React app folder.
We will now replace the local data-mock usage with a fetch from the server.
For that we can use the native [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API),
however, it needs to be used in the right life-cycle hook of the React.Component.

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

These 2 approaches indeed work, but they both fail to deliver what's necessary on the right time.
In addition, there's no way to properly coordinate async function calls with the render method of the component.

**Introducing: React hooks**

With React hooks we can invoke the desired logic in the right life-cycle stage of the target component.
This way we can avoid potential memory leaks or extra calculations.
To implement a proper `fetch()`, we will be using 2 React hooks:

- [`React.useState()`](https://reactjs.org/docs/hooks-reference.html#usestate) - which is used to get and set a state of the component - will be used to store the chats fetched from the server.

```js
const [value, setValue] = useState(initialValue);
```

- [`React.useMemo()`](https://reactjs.org/docs/hooks-reference.html#usememo) - which is used to run a computation only once certain conditions were met - will be used to run the `fetch()` function only once the component has mounted.

```js
const memoizedValue = useMemo(calcFn, [cond1, cond2, ...conds]);
```

The result of that approach will look like this, in the context of our ChatsList component:

[{]: <helper> (diffStep "3.2" module="client")

#### [__Client__ Step 3.2: Fetch chats using native fetch API instead of mock DB](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/364e7d336c66e52322f8092674f01637992610db)

##### Changed src&#x2F;components&#x2F;ChatsListScreen&#x2F;ChatsList.tsx
```diff
@@ -1,8 +1,8 @@
 ┊1┊1┊import React from 'react';
-┊2┊ ┊import { chats } from '../../db';
 ┊3┊2┊import moment from 'moment';
 ┊4┊3┊import { List, ListItem } from '@material-ui/core';
 ┊5┊4┊import styled from 'styled-components';
+┊ ┊5┊import { useState, useMemo } from 'react';
 ┊6┊6┊
 ┊7┊7┊const Container = styled.div`
 ┊8┊8┊  height: calc(100% - 56px);
```
```diff
@@ -56,27 +56,37 @@
 ┊56┊56┊  font-size: 13px;
 ┊57┊57┊`;
 ┊58┊58┊
-┊59┊  ┊const ChatsList = () => (
-┊60┊  ┊  <Container>
-┊61┊  ┊    <StyledList>
-┊62┊  ┊      {chats.map((chat) => (
-┊63┊  ┊        <StyledListItem key={chat.id} button>
-┊64┊  ┊          <ChatPicture src={chat.picture} alt="Profile" />
-┊65┊  ┊          <ChatInfo>
-┊66┊  ┊            <ChatName>{chat.name}</ChatName>
-┊67┊  ┊            {chat.lastMessage && (
-┊68┊  ┊              <React.Fragment>
-┊69┊  ┊                <MessageContent>{chat.lastMessage.content}</MessageContent>
-┊70┊  ┊                <MessageDate>
-┊71┊  ┊                  {moment(chat.lastMessage.createdAt).format('HH:mm')}
-┊72┊  ┊                </MessageDate>
-┊73┊  ┊              </React.Fragment>
-┊74┊  ┊            )}
-┊75┊  ┊          </ChatInfo>
-┊76┊  ┊        </StyledListItem>
-┊77┊  ┊      ))}
-┊78┊  ┊    </StyledList>
-┊79┊  ┊  </Container>
-┊80┊  ┊);
+┊  ┊59┊const ChatsList = () => {
+┊  ┊60┊  const [chats, setChats] = useState<any[]>([]);
+┊  ┊61┊
+┊  ┊62┊  useMemo(async () => {
+┊  ┊63┊    const body = await fetch(`${process.env.REACT_APP_SERVER_URL}/chats`);
+┊  ┊64┊    const chats = await body.json();
+┊  ┊65┊    setChats(chats);
+┊  ┊66┊  }, []);
+┊  ┊67┊
+┊  ┊68┊  return (
+┊  ┊69┊    <Container>
+┊  ┊70┊      <StyledList>
+┊  ┊71┊        {chats.map((chat) => (
+┊  ┊72┊          <StyledListItem key={chat!.id} button>
+┊  ┊73┊            <ChatPicture src={chat.picture} alt="Profile" />
+┊  ┊74┊            <ChatInfo>
+┊  ┊75┊              <ChatName>{chat.name}</ChatName>
+┊  ┊76┊              {chat.lastMessage && (
+┊  ┊77┊                <React.Fragment>
+┊  ┊78┊                  <MessageContent>{chat.lastMessage.content}</MessageContent>
+┊  ┊79┊                  <MessageDate>
+┊  ┊80┊                    {moment(chat.lastMessage.createdAt).format('HH:mm')}
+┊  ┊81┊                  </MessageDate>
+┊  ┊82┊                </React.Fragment>
+┊  ┊83┊              )}
+┊  ┊84┊            </ChatInfo>
+┊  ┊85┊          </StyledListItem>
+┊  ┊86┊        ))}
+┊  ┊87┊      </StyledList>
+┊  ┊88┊    </Container>
+┊  ┊89┊  );
+┊  ┊90┊};
 ┊81┊91┊
 ┊82┊92┊export default ChatsList;
```

##### Deleted src&#x2F;db.ts
```diff
@@ -1,49 +0,0 @@
-┊ 1┊  ┊export const messages = [
-┊ 2┊  ┊  {
-┊ 3┊  ┊    id: '1',
-┊ 4┊  ┊    content: 'You on your way?',
-┊ 5┊  ┊    createdAt: new Date(Date.now() - 60 * 1000 * 1000),
-┊ 6┊  ┊  },
-┊ 7┊  ┊  {
-┊ 8┊  ┊    id: '2',
-┊ 9┊  ┊    content: "Hey, it's me",
-┊10┊  ┊    createdAt: new Date(Date.now() - 2 * 60 * 1000 * 1000),
-┊11┊  ┊  },
-┊12┊  ┊  {
-┊13┊  ┊    id: '3',
-┊14┊  ┊    content: 'I should buy a boat',
-┊15┊  ┊    createdAt: new Date(Date.now() - 24 * 60 * 1000 * 1000),
-┊16┊  ┊  },
-┊17┊  ┊  {
-┊18┊  ┊    id: '4',
-┊19┊  ┊    content: 'This is wicked good ice cream.',
-┊20┊  ┊    createdAt: new Date(Date.now() - 14 * 24 * 60 * 1000 * 1000),
-┊21┊  ┊  },
-┊22┊  ┊];
-┊23┊  ┊
-┊24┊  ┊export const chats = [
-┊25┊  ┊  {
-┊26┊  ┊    id: '1',
-┊27┊  ┊    name: 'Ethan Gonzalez',
-┊28┊  ┊    picture: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
-┊29┊  ┊    lastMessage: messages.find((m) => m.id === '1'),
-┊30┊  ┊  },
-┊31┊  ┊  {
-┊32┊  ┊    id: '2',
-┊33┊  ┊    name: 'Bryan Wallace',
-┊34┊  ┊    picture: 'https://randomuser.me/api/portraits/thumb/men/2.jpg',
-┊35┊  ┊    lastMessage: messages.find((m) => m.id === '2'),
-┊36┊  ┊  },
-┊37┊  ┊  {
-┊38┊  ┊    id: '3',
-┊39┊  ┊    name: 'Avery Stewart',
-┊40┊  ┊    picture: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
-┊41┊  ┊    lastMessage: messages.find((m) => m.id === '3'),
-┊42┊  ┊  },
-┊43┊  ┊  {
-┊44┊  ┊    id: '4',
-┊45┊  ┊    name: 'Katie Peterson',
-┊46┊  ┊    picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
-┊47┊  ┊    lastMessage: messages.find((m) => m.id === '4'),
-┊48┊  ┊  },
-┊49┊  ┊];
```

[}]: #

> It's recommended to read about React hooks and their basic concept at the [official React docs page](https://reactjs.org/docs/hooks-overview.html).

At this point we can get rid of `db.ts` file in the client, since we don't use it anymore:

    $ rm src/db.ts

That's it. Our ChatsListScreen is now connected to a working back-end.
In the next step we will upgrade our REST API into a GraphQL API and we will create a basis for a more robust back-end.

-------------
TODO:

First, `tsc` has a `--watch` option so that if the Typescript files changed it will compile them again and spit new Javascript files.

Then we need to rerun the Node server everytime the output Javascript files has changed.
[nodemon](https://github.com/remy/nodemon) is a tool that tracks file and if the files changed it will re-run our node server.

Let's create a new npm script called "watch" and make it run both tools:

TODO: New diff

TODO: https://stackoverflow.com/a/39172660/1426570

TODO: Better watch, also watch and copy schema files (maybe in a later chapter)?

TODO: concurrently - because it works on all environments

TODO: Explain what -r register command does in Node and in Jest

TODO: Talk about the difference between graphql-import and graphql-import-node

TODO: Show debugging


It's a bit annoying that we get the compiled file right next to our Typescript file, so let's move it into a separate folder:

TODO: New diff for the `lib` folder update

TODO: why `useMemo(fn, [true])` instead of `useEffect(fn, [])` ?

TODO: Move to hooks in a separate commit and later change to call the server

[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step2.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step4.md) |
|:--------------------------------|--------------------------------:|

[}]: #
