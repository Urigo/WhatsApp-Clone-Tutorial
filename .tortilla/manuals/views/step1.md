# Step 1: Creating a basic React APP with a basic view

[//]: # (head-end)


In this chapter we will learn how to create a basic React app. The app will contain a basic view that will render a list of conversations within our app. Everything should be done gradually, so for now, instead of using real data, we will use in-memory fake data instead of calling a server.

There are many ways to create an application. Indeed, you can create it from scratch, but the point behind development is that you'll make the least amount of work if possible. The point is to create a working product, and time is what matters, thus we're gonna use a boilerplate to kick-start our application. When it comes to React apps, the most popular is [`create-react-app`](https://github.com/facebook/create-react-app), which is pretty generic and easy to use. In addition, it's officially maintained by Facebook, the creators of React.

`create-react-app` is a CLI that is installable via NPM:

    $ npm install -g create-react-app

Once you do so, you will have it available in your terminal. If the installation failed, try to run the command as `sudo`:

	$ sudo npm install -g create-react-app

Using the `create` command, we can create the basis for our Whatsapp Clone:

    $ create-react-app create whatsapp-clone-client

> Note how we used the `client` prefix. That's because we're planning to create a server as well in further chapters.

It will create a directory called `whatsapp-clone-client` inside the current folder. Inside that directory, it will generate the initial project structure and install the transitive dependencies:

    my-app
    ├── README.md
    ├── node_modules
    ├── package.json
    ├── .gitignore
    ├── public
    │   ├── favicon.ico
    │   ├── index.html
    │   └── manifest.json
    └── src
        ├── App.css
        ├── App.js
        ├── App.test.js
        ├── index.css
        ├── index.js
        ├── logo.svg
        └── serviceWorker.js

No configuration or complicated folder structures, just the files you need to build your app. Once the installation is done, you can open your project folder:

	$ cd whatsapp-clone-client

Inside the newly created project, you can run some built-in commands:

	$ npm start

Runs the app in development mode. Open `http://localhost:3000` to view it in the browser:

![boilerplate-page](https://user-images.githubusercontent.com/7648874/54026782-025f8080-41da-11e9-9a4e-796fe15e8d03.png)

The project that was created for us by `create-react-app` is highly functional and ready to use, but it's implemented in JavaScript. In our project, we're gonna use TypeScript. There's no right or wrong here, it's more of a personal choice. The main advantage of using TypeScript over using plain JavaScript is that we get to tell the compiler what types and data structures we expect in certain places, so that the compiler (which unlike a human never forgets) will remind us when we make a mistake and assume something that is not true.

Luckily enough, `create-react-app` comes with a TypeScript support right out of the box, we only need to make a few adjustments in-order to make it work. First we need to install the TypeScript package, which is essential for TypeScript to function:

	$ yarn add typescript

Every TypeScript project requires a `tsconfig.json` to be defined. This configuration file will dictate the behavior of TypeScript within that project. More about `tsconfig.json` and its available options can be found in the [official TypeScript handbook](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html). This is the config file we're gonna use in our project:

[{]: <helper> (diffStep "1.1" files="tsconfig.json" module="client")

#### [Client Step 1.1: Setup TypeScript](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/c05e16f)

##### Added tsconfig.json
```diff
@@ -0,0 +1,35 @@
+┊  ┊ 1┊{
+┊  ┊ 2┊  "compilerOptions": {
+┊  ┊ 3┊    "outDir": "build/dist",
+┊  ┊ 4┊    "sourceMap": true,
+┊  ┊ 5┊    "declaration": false,
+┊  ┊ 6┊    "moduleResolution": "node",
+┊  ┊ 7┊    "emitDecoratorMetadata": true,
+┊  ┊ 8┊    "experimentalDecorators": true,
+┊  ┊ 9┊    "downlevelIteration": true,
+┊  ┊10┊    "resolveJsonModule": true,
+┊  ┊11┊    "target": "es5",
+┊  ┊12┊    "jsx": "preserve",
+┊  ┊13┊    "typeRoots": [
+┊  ┊14┊      "node_modules/@types"
+┊  ┊15┊    ],
+┊  ┊16┊    "lib": [
+┊  ┊17┊      "es2017",
+┊  ┊18┊      "dom",
+┊  ┊19┊      "esnext.asynciterable"
+┊  ┊20┊    ],
+┊  ┊21┊    "allowJs": true,
+┊  ┊22┊    "skipLibCheck": true,
+┊  ┊23┊    "esModuleInterop": false,
+┊  ┊24┊    "allowSyntheticDefaultImports": true,
+┊  ┊25┊    "forceConsistentCasingInFileNames": true,
+┊  ┊26┊    "isolatedModules": true,
+┊  ┊27┊    "noEmit": true,
+┊  ┊28┊    "noImplicitAny": false,
+┊  ┊29┊    "strict": false,
+┊  ┊30┊    "module": "esnext"
+┊  ┊31┊  },
+┊  ┊32┊  "include": [
+┊  ┊33┊    "src"
+┊  ┊34┊  ]
+┊  ┊35┊}
```

[}]: #

We're also gonna add a `tslint.json` file into the project - a file which will determine the linting preferences for our project. All rules are listed and explained in the [official rules doc page](https://palantir.github.io/tslint/rules/). We will use the following rules:

[{]: <helper> (diffStep "1.1" files="tslint.json" module="client")

#### [Client Step 1.1: Setup TypeScript](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/c05e16f)

##### Added tslint.json
```diff
@@ -0,0 +1,29 @@
+┊  ┊ 1┊{
+┊  ┊ 2┊  "extends": ["tslint:recommended", "tslint-react", "tslint-config-prettier"],
+┊  ┊ 3┊  "rules": {
+┊  ┊ 4┊    "ordered-imports": false,
+┊  ┊ 5┊    "object-literal-sort-keys": false,
+┊  ┊ 6┊    "jsx-boolean-value": false,
+┊  ┊ 7┊    "interface-name" : false,
+┊  ┊ 8┊    "variable-name": false,
+┊  ┊ 9┊    "no-string-literal": false,
+┊  ┊10┊    "no-namespace": false,
+┊  ┊11┊    "interface-over-type-literal": false,
+┊  ┊12┊    "no-shadowed-variable": false,
+┊  ┊13┊    "curly": false,
+┊  ┊14┊    "no-label": false,
+┊  ┊15┊    "no-empty": false,
+┊  ┊16┊    "no-debugger": false,
+┊  ┊17┊    "no-console": false,
+┊  ┊18┊    "array-type": false
+┊  ┊19┊  },
+┊  ┊20┊  "linterOptions": {
+┊  ┊21┊    "exclude": [
+┊  ┊22┊      "config/**/*.js",
+┊  ┊23┊      "node_modules/**/*.ts",
+┊  ┊24┊      "coverage/lcov-report/*.js",
+┊  ┊25┊      "*.json",
+┊  ┊26┊      "**/*.json"
+┊  ┊27┊    ]
+┊  ┊28┊  }
+┊  ┊29┊}
```

[}]: #

Once we will run the app for the first time, `react-scripts` (`create-react-app` utility scripts package) should automatically initialize some additional TypeScript related files:

	$ npm start

Since we're gonna use the new React [Hooks](https://reactjs.org/docs/hooks-intro.html) and [Suspense](https://reactjs.org/docs/react-api.html#reactsuspense) mechanisms, **make sure that your app uses React version 16.8 or above, otherwise it won't work.** The React version can be determined simply by looking at the `package.json` file. If by any chance your React version is lower than the required one, be sure to upgrade the version of `create-react-app` by upgrading it to the latest one and repeat the process of the project creation. Just in case, `create-react-app` can be upgrade by re-running the install command:

	$ npm install -g create-react-app

Assuming that everything is set, we will now create our first screen - ChatsListScreen. The ChatsListScreen component is responsible for showing the active conversations within our app. Everything should be done gradually, so for now, instead of using real data, we will use in-memory fake data. Further in this tutorial, we will also create a server that will serve that data and connect it to our client.

It's best to first schematically plan how our view's gonna look like. This would help us illustrate the intended view and also understand which React.Components / elements take part in it. This is how our screen's gonna look like:

![chatslistscreen](https://user-images.githubusercontent.com/7648874/54027873-01305280-41de-11e9-9df0-5ad9c9c2f226.png)

Let's break down the image above and see what components are we gonna have in the ChatsListScreen:

- Navbar -  Which should contain a simple static title for now.
- ChatsList - Where each item's gonna contain some data regards the user we're chatting with and information about the chat.

React apps tend to store React.Components under a directory located at `src/components`, and so we're gonna follow this pattern. We will create a directory called ChatsListScreen in the `components` dir where we're simply gonna import and put together the Navbar and ChatsList components. This is how the contents of that directory should look like:

    ChatsListScreen
    ├── index.tsx
    ├── ChatsList
    └── ChatsNavbar

We will use the `index.tsx` file to define that component, this way we can import it using the directory name:

[{]: <helper> (diffStep "1.2" files="components/ChatsListScreen/index.jsx" module="client")

#### [Client Step 1.2: Implement ChatsListScreen](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/80da8a2)



[}]: #

Now we can implement the Navbar component, which doesn't have much for now except some text describing the app:

[{]: <helper> (diffStep "1.2" files="components/ChatsListScreen/ChatsNavbar.jsx" module="client")

#### [Client Step 1.2: Implement ChatsListScreen](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/80da8a2)



[}]: #

And the ChatsList component:

[{]: <helper> (diffStep "1.2" files="components/ChatsListScreen/ChatsList.jsx" module="client")

#### [Client Step 1.2: Implement ChatsListScreen](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/80da8a2)



[}]: #

You can see in the code-diff above how we used the [`moment`](https://momentjs.com/) library to wrap `lastMessage.createdAt`. Moment has the ability to wrap date objects nicely and rewrite them in a pretty format. This way we can have an elegant time format at which the message was sent e.g. `11:34`. To install:

	$ yarn add moment

The ChatsList component has no event handlers and it's completely non-interactive as for now, that means that you can't click or tap anything yet, but as we go further in the tutorial we will add the necessary event handlers. Note how we used the `db.ts` module to get the chats data. `db.ts` is a temporary mock for our data-source and should be removed once we have a server up and running. Here's how our DB looks like:

[{]: <helper> (diffStep "1.3" module="client")

#### [Client Step 1.3: Add db mock](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/254ce3f)

##### Added src&#x2F;db.ts
```diff
@@ -0,0 +1,49 @@
+┊  ┊ 1┊export const messages = [
+┊  ┊ 2┊  {
+┊  ┊ 3┊    id: 1,
+┊  ┊ 4┊    content: "You on your way?",
+┊  ┊ 5┊    createdAt: new Date(Date.now() - 60 * 1000 * 1000),
+┊  ┊ 6┊  },
+┊  ┊ 7┊  {
+┊  ┊ 8┊    id: 2,
+┊  ┊ 9┊    content: "Hey, it's me",
+┊  ┊10┊    createdAt: new Date(Date.now() - 2 * 60 * 1000 * 1000),
+┊  ┊11┊  },
+┊  ┊12┊  {
+┊  ┊13┊    id: 3,
+┊  ┊14┊    content: "I should buy a boat",
+┊  ┊15┊    createdAt: new Date(Date.now() - 24 * 60 * 1000 * 1000),
+┊  ┊16┊  },
+┊  ┊17┊  {
+┊  ┊18┊    id: 4,
+┊  ┊19┊    content: "This is wicked good ice cream.",
+┊  ┊20┊    createdAt: new Date(Date.now() - 14 * 24 * 60 * 1000 * 1000),
+┊  ┊21┊  },
+┊  ┊22┊]
+┊  ┊23┊
+┊  ┊24┊export const chats = [
+┊  ┊25┊  {
+┊  ┊26┊    id: 1,
+┊  ┊27┊    name: 'Ethan Gonzalez',
+┊  ┊28┊    picture: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
+┊  ┊29┊    lastMessage: messages.find(m => m.id === 1),
+┊  ┊30┊  },
+┊  ┊31┊  {
+┊  ┊32┊    id: 2,
+┊  ┊33┊    name: 'Bryan Wallace',
+┊  ┊34┊    picture: 'https://randomuser.me/api/portraits/thumb/men/2.jpg',
+┊  ┊35┊    lastMessage: messages.find(m => m.id === 2),
+┊  ┊36┊  },
+┊  ┊37┊  {
+┊  ┊38┊    id: 3,
+┊  ┊39┊    name: 'Avery Stewart',
+┊  ┊40┊    picture: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
+┊  ┊41┊    lastMessage: messages.find(m => m.id === 3),
+┊  ┊42┊  },
+┊  ┊43┊  {
+┊  ┊44┊    id: 4,
+┊  ┊45┊    name: 'Katie Peterson',
+┊  ┊46┊    picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
+┊  ┊47┊    lastMessage: messages.find(m => m.id === 4),
+┊  ┊48┊  },
+┊  ┊49┊]
```

[}]: #

The ChatsListScreen is now ready to use. We will replace the contents of the App component with the ChatsListScreen and we will make it the default screen in our app:

[{]: <helper> (diffStep "1.4" files="App.jsx" module="client")

#### [Client Step 1.4: Import ChatsListScreen](https://github.com/Urigo/WhatsApp-Clone-Client-React/commit/298b0d2)

##### Changed src&#x2F;App.jsx
```diff
@@ -1,28 +1,10 @@
-┊ 1┊  ┊import React, { Component } from 'react';
-┊ 2┊  ┊import logo from './logo.svg';
-┊ 3┊  ┊import './App.css';
+┊  ┊ 1┊import * as React from 'react'
+┊  ┊ 2┊import ChatsListScreen from './components/ChatsListScreen'
 ┊ 4┊ 3┊
-┊ 5┊  ┊class App extends Component {
-┊ 6┊  ┊  render() {
-┊ 7┊  ┊    return (
-┊ 8┊  ┊      <div className="App">
-┊ 9┊  ┊        <header className="App-header">
-┊10┊  ┊          <img src={logo} className="App-logo" alt="logo" />
-┊11┊  ┊          <p>
-┊12┊  ┊            Edit <code>src/App.js</code> and save to reload.
-┊13┊  ┊          </p>
-┊14┊  ┊          <a
-┊15┊  ┊            className="App-link"
-┊16┊  ┊            href="https://reactjs.org"
-┊17┊  ┊            target="_blank"
-┊18┊  ┊            rel="noopener noreferrer"
-┊19┊  ┊          >
-┊20┊  ┊            Learn React
-┊21┊  ┊          </a>
-┊22┊  ┊        </header>
-┊23┊  ┊      </div>
-┊24┊  ┊    );
-┊25┊  ┊  }
-┊26┊  ┊}
+┊  ┊ 4┊const App = () => (
+┊  ┊ 5┊  <div>
+┊  ┊ 6┊    <ChatsListScreen />
+┊  ┊ 7┊  </div>
+┊  ┊ 8┊)
 ┊27┊ 9┊
-┊28┊  ┊export default App;
+┊  ┊10┊export default App
```

[}]: #

If you'll try to run the app you'll see that everything is there, but it's not hard to notice that it's missing some style:

![naked-chats-list](https://user-images.githubusercontent.com/7648874/54028578-73099b80-41e0-11e9-803a-7469300acb06.png)

In the next chapter we will take care of styling our application with [Material-UI](https://material-ui.com/) and [styled-components](https://www.styled-components.com/) - we will give it the desired look and make it more user friendly. For now the ChatsListScreen serves no purpose, because you can't really do anything with it, but it can be used as a great basis to build on top of as we make progress.


[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Intro](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/final@next/README.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/final@next/.tortilla/manuals/views/step2.md) |
|:--------------------------------|--------------------------------:|

[}]: #
