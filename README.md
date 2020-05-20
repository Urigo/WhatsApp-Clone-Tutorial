# Whatsapp Clone Tutorial

[//]: # (head-end)


[![whatsapp-clone](https://user-images.githubusercontent.com/25294569/64722192-a4885a00-d4d6-11e9-960d-8a9bae6b26de.gif)](https://github.com/Urigo/WhatsApp-Clone-Tutorial)

!(https://www.youtube.com/watch?v=omsHNP4Vjhc)

Whatsapp Clone is a free and open-source tutorial that will guide you step-by-step on how to create a full-stack,
mobile, hybrid web application from scratch.

- [Skip to just clone the finished application](#cloning-the-finished-app)

The software world is evolving quickly, and oftentimes people find themselves left behind, even the most experienced ones.
The purpose of this tutorial is not only to demonstrate how to create a full application with the latest technologies, but also
to keep up to date with the ever-changing development ecosystem.

This tutorial is for anyone who has ever asked themselves one of the following questions:

- How do people build an app today?
- What are the currently leading technologies in the ecosystem?
- What are the best practices for using technology XXX?
- What is the purpose of technology XXX?
- How does technology XXX work?
- How do I use technology XXX?
- How do I migrate to the new version of technology XXX?
- Why should I use technology XXX over technology YYY?

All of the above and more can be answered in the tutorial. Whether you’re a beginner, intermediate or a professional,
we will have the answers you’re looking for.

**What technologies does Whatsapp Clone uses?**

The version of the Whatsapp Clone you are looking at, uses:

- [React (with Hooks and Suspense)](http://react.com)
- [Styled-Components](https://styled-components.com)
- [Material-UI](https://material-ui.com)
- [TypeScript](https://typescriptlang.org)
- [Apollo GraphQL](https://www.apollographql.com)
- [GraphQL Code Generator](http://graphql-code-generator.com)
- [GraphQL Modules](https://graphql-modules.com)
- [PostgreSQL](https://www.postgresql.org/)
- [GraphQL Inspector](https://graphql-inspector.com/)

The point of this tutorial is not to be bound to a certain technology, but rather keep itself aligned with the ecosystem.
When a new technology comes out, and it’s better and more popular, Whatsapp Clone will upgrade to use it (together with full migration instructions).

**P2P tutorial for the community by the community**

Keeping tutorials up to date is not an easy task.
That's why we've created the Tortilla Tutorial Framework that makes it easy to write and update tutorials.
Also, the WhatsApp clone is completely open source in order for the community to give its feedback, help and fork ideas.
Here are the repositories the tutorial is made of:

- [Whatsapp Clone - Client](https://github.com/Urigo/WhatsApp-Clone-Client-React)
- [Whatsapp Clone - Server](https://github.com/Urigo/WhatsApp-Clone-server)
- [Whatsapp Clone - Script's text](https://github.com/Urigo/WhatsApp-Clone-Tutorial)

We’ve also made sure to publish some important documents so you can get more involved.
You can track our progress and comment your suggestions, since everything is based on Google Docs and is updated live:

- [Road map](https://docs.google.com/document/d/1p2Zio6Js2eoFfHs9CjIMF6jTuNyD4eQEHlgEAKhAqM8/edit?usp=sharing)
- [Chapter manuals] (https://drive.google.com/open?id=1ITxOniS_S3sgZfunLvtJ1L9P6Fj1YOLlFHhoQPjT3S0)

## Cloning the finished app

If you want to simply clone and run the app locally in it's finished,
first clone the [Server repository](https://github.com/Urigo/WhatsApp-Clone-server) and follow the instructions on the README there.

Then clone the [React Client repository](https://github.com/Urigo/WhatsApp-Clone-Client-React) and follow the instructions there carefully.

**Migration instructions included**

There are many great tutorials out there, but almost none of them shows you what changes you should make in your app in order to be aligned with a new version of a certain technology.
As technologies are being updated by the minute, some changes are minor and insignificant,
but often times a breaking change will be made in which case we need to know how we can adapt to that change.
Thanks to the [Tortilla platform](https://tortilla.academy), we can provide you with a git-diff that will show you what changes were made between each and every released version of the Whatsapp Clone tutorial since the beginning of history.
This way you can easily notice the changes in APIs and migrate your app in no time.

![tutorial-versions-diff](https://user-images.githubusercontent.com/7648874/54142148-0f8ea080-4462-11e9-9522-ec9997b76169.png)

**Prerequisites for WhatsApp Clone**

> Even if you don't have experience with the technologies below you might still be able to start the tutorial and pick things along the way.
> If you struggle with anything during the tutorial, contact us on the forum or on Github with your questions.
> It will help us make sure that the tutorial is good for beginners as well

- JavaScript - https://javascript.info/
- TypeScript
- JSX
- HTML
- CSS
- Node.JS
- npm & Yarn
- React
- SQL

OS operations such as navigating to a folder, or creating a folder, are all gonna be written in Bash, but the instructions are OS agnostic and can be applied on any machine that is web-compatible.

Make sure you have the latest global dependencies on your computer before starting the tutorial:

**[Node](https://nodejs.org/)**

Install [nvm](https://github.com/nvm-sh/nvm) by running the following command in your [command line](https://www.wikihow.com/Get-to-the-Command-Line-on-a-Mac):

    $ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash

Then install the latest version of Node by running the following:

    $ nvm install node

**[Yarn](https://yarnpkg.com)**

Follow the instructions [here](https://yarnpkg.com/en/docs/install#mac-stable).


**What’s on the tutorial?**

Whatsapp Clone is built chronologically, from the most basic, to more higher level features, so we recommend you to follow the tutorial in the right order.
Each step is focused on a different subject, so by the end of it you’ll have a new feature and a new set of knowledge that you can start implementing in your everyday scenario immediately.

If you feel like you want to skip or focus on a specific subject, on each step you can download the full app code till that point in time.

That is also useful in case you get stuck.

Currently, Whatsapp Clone includes the following chapters:

- [Step 1: Creating a basic React APP with a basic view.](https://github.com/Urigo/WhatsApp-Clone-Tutorial/blob/master/.tortilla/manuals/views/step1.md)
- [Step 2: Styling with Material-UI and Styled-Components.](https://github.com/Urigo/WhatsApp-Clone-Tutorial/blob/master/.tortilla/manuals/views/step2.md)
- [Step 3: Setting a basic Node.JS server with basic a basic REST endpoint.](https://github.com/Urigo/WhatsApp-Clone-Tutorial/blob/master/.tortilla/manuals/views/step3.md)
- [Step 4: Transition to GraphQL.](https://github.com/Urigo/WhatsApp-Clone-Tutorial/blob/master/.tortilla/manuals/views/step4.md)
- [Step 5: Testing.](https://github.com/Urigo/WhatsApp-Clone-Tutorial/blob/master/.tortilla/manuals/views/step5.md)
- [Step 6: Creating an app router and implementing a chat room.](https://github.com/Urigo/WhatsApp-Clone-Tutorial/blob/master/.tortilla/manuals/views/step6.md)
- [Step 7: Caching with Apollo-Client.](https://github.com/Urigo/WhatsApp-Clone-Tutorial/blob/master/.tortilla/manuals/views/step7.md)
- [Step 8: Sending messages with GraphQL mutations.](https://github.com/Urigo/WhatsApp-Clone-Tutorial/blob/master/.tortilla/manuals/views/step8.md)
- [Step 9: Type safety with GraphQL Code Generator.](https://github.com/Urigo/WhatsApp-Clone-Tutorial/blob/master/.tortilla/manuals/views/step9.md)
- [Step 10: Live updates with GraphQL subscriptions.](https://github.com/Urigo/WhatsApp-Clone-Tutorial/blob/master/.tortilla/manuals/views/step10.md)
- [Step 11: Users.](https://github.com/Urigo/WhatsApp-Clone-Tutorial/blob/master/.tortilla/manuals/views/step11.md)
- [Step 12: Adding and removing chats.](https://github.com/Urigo/WhatsApp-Clone-Tutorial/blob/master/.tortilla/manuals/views/step12.md)
- [Step 13: Authentication.](https://github.com/Urigo/WhatsApp-Clone-Tutorial/blob/master/.tortilla/manuals/views/step13.md)
- [Step 14: Migrating to PostgreSQL.](https://github.com/Urigo/WhatsApp-Clone-Tutorial/blob/master/.tortilla/manuals/views/step14.md)
- [Step 15: Using a REST API.](https://github.com/Urigo/WhatsApp-Clone-Tutorial/blob/master/.tortilla/manuals/views/step15.md)
- [Step 16: Modularity.](https://github.com/Urigo/WhatsApp-Clone-Tutorial/blob/master/.tortilla/manuals/views/step16.md)
- [Step 17: Performance.](https://github.com/Urigo/WhatsApp-Clone-Tutorial/blob/master/.tortilla/manuals/views/step17.md)
- Step 18: Your choice! Submit a request [here](https://github.com/Urigo/WhatsApp-Clone-Client-React/issues)

Whatsapp Clone is updated on a regular basis, so you should expect more steps and extensions with time.
You can keep track of our [road map](https://docs.google.com/document/d/1p2Zio6Js2eoFfHs9CjIMF6jTuNyD4eQEHlgEAKhAqM8/edit?usp=sharing) to see what’s upcoming.

### External contributors

* [jsparvath](https://github.com/jsparvath)
* [Akirtovskis](https://github.com/Akirtovskis)
* [MStokluska](https://github.com/MStokluska)
* [milenazuccarelli](https://github.com/milenazuccarelli)
* [itsmylife](https://github.com/itsmylife)
* [killjoy2013](https://github.com/killjoy2013)
* [remi-bruguier](https://github.com/remi-bruguier)


[//]: # (foot-start)

[{]: <helper> (navStep)

| [Begin Tutorial >](.tortilla/manuals/views/step1.md) |
|----------------------:|

[}]: #
