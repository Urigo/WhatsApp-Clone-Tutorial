# Step 14: Migrating to PostgreSQL

[//]: # (head-end)


**Which Relational Database? And Why?**

We’ve used to have an in-memory database so far that keeps our entities on memory inside business logic so far. But in a real application we will need a real database system that keeps our data which is seperated from our business logic. In this part we will design our database according to the relational database principles with the benefits of SQL.

We prefer to use PostgreSQL from now on; because PostgreSQL is a Relational Database implementation that has tables, constraints, triggers, roles, stored procedures and views together with foreign tables from external data sources and many features from NoSQL.

**Database Design**

While we are defining our entity types and schema inside our array-based in-memory database, we have already designed the basic parts of them. In this part, we will design our relational database with base and relation tables regarding to them.

Initially we can decide the base fields without relations;
* User;
    * `id`
    * `name`
    * `username`
    * `password`
    * `picture`
* Message;
    * `id`
    * `content`
    * `created_at`
* Chat;
    * `id`

Before creating tables, we should design our database structure according to [Database Normalization principles](https://www.essentialsql.com/get-ready-to-learn-sql-database-normalization-explained-in-simple-english/) to prevent duplicated data and modification anomalies.

Initially we will have 3 base tables in our database; `user`, `chat`, `message`; and there are some relations between those 3 tables. These relations will be defined in other relation tables together with different primary key and foreign key definitions.

There are four types of relations in relational databases;

* One to one
    * This relationship means A entity type can have a relationship with only one instance of B entity type while B entity type can have a relationship with only one instance of A entity type. For example, one user can have only one profile while a profile belongs to only one user.
* Many to one
    * This relationship means A entity type can have a relationship with multiple instances of B entity type while B entity type can have a relationship with only one instance of A entity type. For example, a chat can have multiple messages while a message belongs to only one chat. But `many to one` as a word means multiple photos belong to the same chat.
* One to many
    * This relationship has the same logic with Many to one. However, `One to many` as a word means a chat can have multiple messages while those messages cannot have multiple chats but only one.
* Many to many
    * This relationship means A entity type can have a relationship with multiple instances of B entity type while B entity type can have a relationship with multiple instances of A entity type dependently or independently. For example; a chat can have multiple users, and a user can have multiple chats.

You can read more about those relations in [here](https://www.techrepublic.com/article/relational-databases-defining-relationships-between-database-tables/).

In existing entity declarations and schema, we have 6 relationships;

* Message has a One To Many relationship under the name of `chat` inside our schema; so one message can have one chat while one chat can have multiple messages.
    gql```
    type Message { chat: Chat }
    ```
* Message has another One To Many relationship under the name of `sender`` inside our schema; so one message can have one sender while one sender user can have multiple messages.
    gql```
    type Message { sender: User }
    ```
* Message has one more One To Many relationship under the name of `recipient`` inside our schema; so one message can have one recipient while one recipient user can have multiple messages.
    gql```
    type Message { recipient: User }
    ```
* Chat has a One To Many relationship under the name of `messages`, because one chat can have multiple messages while one message can have only one chat. Notice that this relationship is the reversed version of the first relationship in Message.
    gql```
    `type Chat { messages: [Message] }
    ```
* Chat has another Many To Many relationship under the name of `participants`, because one chat can have multiple participants while a participant can have multiple chats as well.
    gql```
    type Chat { participants: [User] }
    ```
* User has a Many To Many relationship under the name of `chats`, because one user can have multiple chats, while it has the same situation for chats.
    gql```
    type User { chats: [Chat] }
    ```

So we should decide the dependencies between each other to add columns and tables to our database.

* User is independent in all relationships, so we will keep its columns as it is
* Message is dependent to User in two cases so we can define this relationship as two different new foreign keys pointing to User’s id under the columns `sender_user_id`. But we don’t need `recipient_user_id` because `recipient` can be found under Chat’s participants.
* Chat is also independent because it will be better to keep those relations inside Message.
* Message is dependent to Chat so we can define this relationship as a new foreign key that points to Chat’s id under the column named `chat_id`.
* We need to have another table that defines the relationship between multiple chats and users.

> We don’t need to duplicate relations in each entities, because SQL has the power to reverse each relations even if they are defined only in one entity. This is one of the rule of Database Normalization.

Finally we can decide on our tables;

* `chats` table;
    * `id` ->
        * `PRIMARY KEY` - `SERIAL`
        * `SERIAL` will automatically increase the number of the new chat row. Check SQL docs about primary key and auto increment
* `users` table;
    * `id` ->
        * `PRIMARY KEY` - `SERIAL`
    * `name` ->
        * `VARCHAR`
    * `username` ->
        * `VARCHAR` - `UNIQUE`
        * `UNIQUE` means this value can exist in this table only once. We use this feature because `username` must be unique in users for each user
    * `password` ->
        * `VARCHAR`
    * `picture` ->
        * `VARCHAR`
* `chats_users` table;
    * `chat_id` ->
        * `FOREIGN KEY` points to `chat.id` ->
            * `ON DELETE` -> `CASCADE`.
            * This means that if chat that has this id is deleted, this row will be deleted automatically as well.
    * `user_id` ->
        * FOREIGN KEY points to `user.id` ->
            * `ON DELETE` -> `CASCADE`.
* `messages` table;
    * `id` ->
        * `PRIMARY KEY` - `SERIAL`
    * `content` ->
        * `VARCHAR`
    * `created_at` ->
        * `TIMESTAMP` ->
            * `DEFAULT_VALUE = now()`
            * This means it will automatically set this to the current timestamp in the new row.
    * `chat_id` ->
        * `FOREIGN KEY` points to `chat.id` ->
            * `ON DELETE` -> `CASCADE`
            * This means that if chat that has this id is deleted, this row will be deleted automatically as well. So the message will be deleted immediately after the chat is deleted.
    * `sender_user_id` ->
        * `FOREIGN_KEY` points to `user.id`
            * `ON DELETE` -> `CASCADE`
            * This means that if user that has this id is deleted, this message will be deleted.

> Notice that having a good dependency gives us an opportunity to benefit from `ON_DELETE` feature of SQL. Otherwise, we need to delete each dependent row manually by hand.

**Installing PostgreSQL on your machine**

***Windows / Mac OS X***

You can download one-click installer for Windows and Mac OS X. During the installation, you must define a password and keep it somewhere safe.

[https://www.enterprisedb.com/downloads/postgres-postgresql-downloads](Download Installer)

***Ubuntu / Debian***

If you have Debian package manager on your machine, you can install PostgreSQL in a single line in your Bash terminal;

    $ sudo apt-get install postgresql postgresql-contrib

***Other environments***

Check [https://www.postgresql.org/download/](PostgreSQL website) for installation instructions on other environments.

**Creating Database, Database User and Tables**

> Make sure you have installed PostgreSQL on your environment first!

We will use Bash terminal in order to access PostgreSQL using superuser;

    $ su - postgres

You don't need to execute the previous command if you're using Windows. But you have to open the terminal with Administrator privileges.

    $ psql template1

Then we will see the following PostgreSQL console;

bash```
Welcome to psql 7.4.16, the PostgreSQL interactive terminal.

Type:  \\copyright for distribution terms
       \\h for help with SQL commands
       \\? for help on internal slash commands
       \\g or terminate with semicolon to execute query
       \\q to quit

template1
```

So we can do the following SQL operations in order to create our new user, database and tables;

* Create user for our database

```sql
    CREATE DATABASE whatsapp;
```

* Create database

```sql
    CREATE USER testuser WITH PASSWORD 'testpassword';
```

* Give permissions to that user

```sql
    GRANT ALL PRIVILEGES ON DATABASE whatsapp to testuser;
```

* Connect database

```sql
    \connect whatsapp
```

* Create `chats` table

```sql
    CREATE TABLE chats(
        id SERIAL PRIMARY KEY
    );
```

* Create `users` table

```sql
    CREATE TABLE users(
        id SERIAL PRIMARY KEY,
        username VARCHAR (50) UNIQUE NOT NULL,
        name VARCHAR (50) NOT NULL,
        password VARCHAR (255) NOT NULL,
        picture VARCHAR (255) NOT NULL
    );
```

* Create `chats_users` table

```sql
    CREATE TABLE chats_users(
        chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    );
```

* Create messages table;

```sql
    CREATE TABLE messages(
        id SERIAL PRIMARY KEY,
        content VARCHAR (355) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        sender_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    );
```

* Give access for those tables

```sql
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO testuser;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO testuser;
```

**Installing PostgreSQL on our backend project**

As we are using PostgreSQL, we will use `node-postgres` as our database client in the backend.

First install necessary npm packages using yarn;

	$ yarn add pg

And we will also need TypeScript definitions for better development experience;

	$ yarn add @types/pg --dev

We will use `sql` template literals (which is way easier and safer than native API) with [this package](https://github.com/felixfbecker/node-sql-template-strings) which allows you to have SQL highlighting in VSCode with (this extension)[https://marketplace.visualstudio.com/items?itemName=forbeslindesay.vscode-sql-template-literal].

	$ yarn add sql-template-strings

**Connecting to our database**

We will use connection pooling to prevent connection leaks and benefit from transactions in our complicated SQL queries. [You can read more about the benefits of connection pooling.](https://node-postgres.com/features/pooling)

First we need to create a connection pool using our connection credentials;

[{]: <helper> (diffStep 11.2 files="db" module="server")

#### [Server Step 11.2: Connecting to database](https://github.com/Urigo/WhatsApp-Clone-Server/commit/64472e4)

##### Changed db.ts
```diff
@@ -1,3 +1,5 @@
+┊ ┊1┊import { Pool } from "pg";
+┊ ┊2┊
 ┊1┊3┊export type User = {
 ┊2┊4┊  id: string
 ┊3┊5┊  name: string
```
```diff
@@ -20,6 +22,14 @@
 ┊20┊22┊  participants: string[]
 ┊21┊23┊}
 ┊22┊24┊
+┊  ┊25┊export const pool = new Pool({
+┊  ┊26┊  host: 'localhost',
+┊  ┊27┊  port: 5432,
+┊  ┊28┊  user: 'testuser',
+┊  ┊29┊  password: 'testpassword',
+┊  ┊30┊  database: 'whatsapp'
+┊  ┊31┊})
+┊  ┊32┊
 ┊23┊33┊export const users: User[] = []
 ┊24┊34┊export const messages: Message[] = []
 ┊25┊35┊export const chats: Chat[] = []
```

[}]: #

**Add Database Client to GraphQL Context**

After that, we will request a client from this pool on each network request in our GraphQL context. So we need to update our context interface and context builder function.

[{]: <helper> (diffStep 11.3 files="context, index" module="server")

#### [Server Step 11.3: Add Database Client to GraphQL Context](https://github.com/Urigo/WhatsApp-Clone-Server/commit/2f25c16)

##### Changed context.ts
```diff
@@ -1,9 +1,11 @@
 ┊ 1┊ 1┊import { PubSub } from 'apollo-server-express'
 ┊ 2┊ 2┊import { User } from './db'
 ┊ 3┊ 3┊import { Response } from 'express'
+┊  ┊ 4┊import { PoolClient } from 'pg';
 ┊ 4┊ 5┊
 ┊ 5┊ 6┊export type MyContext = {
 ┊ 6┊ 7┊  pubsub: PubSub,
 ┊ 7┊ 8┊  currentUser: User,
 ┊ 8┊ 9┊  res: Response,
+┊  ┊10┊  db: PoolClient,
 ┊ 9┊11┊}
```

##### Changed index.ts
```diff
@@ -2,26 +2,42 @@
 ┊ 2┊ 2┊import http from 'http'
 ┊ 3┊ 3┊import jwt from 'jsonwebtoken'
 ┊ 4┊ 4┊import { app } from './app'
-┊ 5┊  ┊import { users } from './db'
+┊  ┊ 5┊import { pool } from './db'
 ┊ 6┊ 6┊import { origin, port, secret } from './env'
 ┊ 7┊ 7┊import schema from './schema'
+┊  ┊ 8┊import { MyContext } from './context';
+┊  ┊ 9┊import sql from 'sql-template-strings'
 ┊ 8┊10┊
 ┊ 9┊11┊const pubsub = new PubSub()
 ┊10┊12┊const server = new ApolloServer({
 ┊11┊13┊  schema,
-┊12┊  ┊  context: ({ req, res }) => {
-┊13┊  ┊    let currentUser;
+┊  ┊14┊  context: async ({ req, res, connection }: any) => {
+┊  ┊15┊    let db;
+┊  ┊16┊
+┊  ┊17┊    if(!connection) {
+┊  ┊18┊      db = await pool.connect();
+┊  ┊19┊    }
+┊  ┊20┊
+┊  ┊21┊    let currentUser
 ┊14┊22┊    if (req.cookies.authToken) {
 ┊15┊23┊      const username = jwt.verify(req.cookies.authToken, secret) as string
-┊16┊  ┊      currentUser = username && users.find(u => u.username === username)
+┊  ┊24┊      if (username) {
+┊  ┊25┊        const { rows } =  await pool.query(sql`SELECT * FROM users WHERE username = ${username}`)
+┊  ┊26┊        currentUser = rows[0]
+┊  ┊27┊      }
 ┊17┊28┊    }
-┊18┊  ┊
 ┊19┊29┊    return {
 ┊20┊30┊      currentUser,
 ┊21┊31┊      pubsub,
 ┊22┊32┊      res,
+┊  ┊33┊      db,
 ┊23┊34┊    }
 ┊24┊35┊  },
+┊  ┊36┊  formatResponse: (res: any, { context }: { context: MyContext }) => {
+┊  ┊37┊    context.db.release()
+┊  ┊38┊
+┊  ┊39┊    return res
+┊  ┊40┊  }
 ┊25┊41┊})
 ┊26┊42┊
 ┊27┊43┊server.applyMiddleware({
```

[}]: #

> However we need to release that client to the pool after the network connection ends to prevent connection leaks. So, let’s use `formatResponse` to do this operation.
> We don't need connection pooling for subscriptions, because it can cause the connection open in all websocket connection. That's why, we don't request a new client from the pool if it is a subscription.

**Update entity typings**

We should update our entity typings according to our new database tables and columns.

[{]: <helper> (diffStep 11.4 files="db" module="server")

#### [Server Step 11.4: Update Entity Types](https://github.com/Urigo/WhatsApp-Clone-Server/commit/fbe125b)

##### Changed db.ts
```diff
@@ -11,15 +11,13 @@
 ┊11┊11┊export type Message = {
 ┊12┊12┊  id: string
 ┊13┊13┊  content: string
-┊14┊  ┊  createdAt: Date
-┊15┊  ┊  sender: string
-┊16┊  ┊  recipient: string
+┊  ┊14┊  created_at: Date
+┊  ┊15┊  chat_id: string
+┊  ┊16┊  sender_user_id: string
 ┊17┊17┊}
 ┊18┊18┊
 ┊19┊19┊export type Chat = {
 ┊20┊20┊  id: string
-┊21┊  ┊  messages: string[]
-┊22┊  ┊  participants: string[]
 ┊23┊21┊}
 ┊24┊22┊
 ┊25┊23┊export const pool = new Pool({
```

[}]: #

**Add Sample Data**

We need to update the `resetDb` function to add a sample data to our new relational database instead of in-memory database. But we will call `resetDb` if it is asked by using the environmental variable.

[{]: <helper> (diffStep 11.5 files="db" module="server")

#### [Server Step 11.5: Add Sample Data](https://github.com/Urigo/WhatsApp-Clone-Server/commit/4efd051)

##### Changed db.ts
```diff
@@ -1,4 +1,6 @@
 ┊1┊1┊import { Pool } from "pg";
+┊ ┊2┊import sql from 'sql-template-strings'
+┊ ┊3┊import { resetDb as envResetDb } from './env'
 ┊2┊4┊
 ┊3┊5┊export type User = {
 ┊4┊6┊  id: string
```
```diff
@@ -32,8 +34,11 @@
 ┊32┊34┊export const messages: Message[] = []
 ┊33┊35┊export const chats: Chat[] = []
 ┊34┊36┊
-┊35┊  ┊export const resetDb = () => {
-┊36┊  ┊  users.splice(0, Infinity, ...[
+┊  ┊37┊export const resetDb = async () => {
+┊  ┊38┊
+┊  ┊39┊  await pool.query(sql`DELETE FROM users`)
+┊  ┊40┊
+┊  ┊41┊  const sampleUsers = [
 ┊37┊42┊    {
 ┊38┊43┊      id: '1',
 ┊39┊44┊      name: 'Ray Edwards',
```
```diff
@@ -69,61 +74,131 @@
 ┊ 69┊ 74┊      password: '$2a$08$6.mbXqsDX82ZZ7q5d8Osb..JrGSsNp4R3IKj7mxgF6YGT0OmMw242', // 555
 ┊ 70┊ 75┊      picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
 ┊ 71┊ 76┊    },
-┊ 72┊   ┊  ])
+┊   ┊ 77┊  ]
+┊   ┊ 78┊
+┊   ┊ 79┊  for (const sampleUser of sampleUsers) {
+┊   ┊ 80┊    await pool.query(sql`
+┊   ┊ 81┊      INSERT INTO users(id, name, username, password, picture)
+┊   ┊ 82┊      VALUES(${sampleUser.id}, ${sampleUser.name}, ${sampleUser.username}, ${sampleUser.password}, ${sampleUser.picture})
+┊   ┊ 83┊    `)
+┊   ┊ 84┊  }
+┊   ┊ 85┊
+┊   ┊ 86┊  await pool.query(sql`SELECT setval('users_id_seq', (SELECT max(id) FROM users))`)
+┊   ┊ 87┊
+┊   ┊ 88┊  await pool.query(sql`DELETE FROM chats`)
 ┊ 73┊ 89┊
-┊ 74┊   ┊  messages.splice(0, Infinity, ...[
+┊   ┊ 90┊  const sampleChats = [
 ┊ 75┊ 91┊    {
 ┊ 76┊ 92┊      id: '1',
-┊ 77┊   ┊      content: "You on your way?",
-┊ 78┊   ┊      createdAt: new Date(new Date('1-1-2019').getTime() - 60 * 1000 * 1000),
-┊ 79┊   ┊      sender: '1',
-┊ 80┊   ┊      recipient: '2',
 ┊ 81┊ 93┊    },
 ┊ 82┊ 94┊    {
 ┊ 83┊ 95┊      id: '2',
-┊ 84┊   ┊      content: "Hey, it's me",
-┊ 85┊   ┊      createdAt: new Date(new Date('1-1-2019').getTime() - 2 * 60 * 1000 * 1000),
-┊ 86┊   ┊      sender: '1',
-┊ 87┊   ┊      recipient: '3',
 ┊ 88┊ 96┊    },
 ┊ 89┊ 97┊    {
 ┊ 90┊ 98┊      id: '3',
-┊ 91┊   ┊      content: "I should buy a boat",
-┊ 92┊   ┊      createdAt: new Date(new Date('1-1-2019').getTime() - 24 * 60 * 1000 * 1000),
-┊ 93┊   ┊      sender: '1',
-┊ 94┊   ┊      recipient: '4',
 ┊ 95┊ 99┊    },
 ┊ 96┊100┊    {
 ┊ 97┊101┊      id: '4',
-┊ 98┊   ┊      content: "This is wicked good ice cream.",
-┊ 99┊   ┊      createdAt: new Date(new Date('1-1-2019').getTime() - 14 * 24 * 60 * 1000 * 1000),
-┊100┊   ┊      sender: '1',
-┊101┊   ┊      recipient: '5',
 ┊102┊102┊    },
-┊103┊   ┊  ])
+┊   ┊103┊  ]
+┊   ┊104┊
+┊   ┊105┊  for (const sampleChat of sampleChats) {
+┊   ┊106┊    await pool.query(sql`
+┊   ┊107┊      INSERT INTO chats(id)
+┊   ┊108┊      VALUES(${sampleChat.id})
+┊   ┊109┊    `)
+┊   ┊110┊  }
+┊   ┊111┊
+┊   ┊112┊  await pool.query(sql`SELECT setval('chats_id_seq', (SELECT max(id) FROM chats))`)
+┊   ┊113┊
+┊   ┊114┊  await pool.query(sql`DELETE FROM chats_users`)
 ┊104┊115┊
-┊105┊   ┊  chats.splice(0, Infinity, ...[
+┊   ┊116┊  const sampleChatsUsers = [
+┊   ┊117┊    {
+┊   ┊118┊      chat_id: '1',
+┊   ┊119┊      user_id: '1',
+┊   ┊120┊    },
+┊   ┊121┊    {
+┊   ┊122┊      chat_id: '1',
+┊   ┊123┊      user_id: '2',
+┊   ┊124┊    },
+┊   ┊125┊    {
+┊   ┊126┊      chat_id: '2',
+┊   ┊127┊      user_id: '1',
+┊   ┊128┊    },
+┊   ┊129┊    {
+┊   ┊130┊      chat_id: '2',
+┊   ┊131┊      user_id: '3',
+┊   ┊132┊    },
+┊   ┊133┊    {
+┊   ┊134┊      chat_id: '3',
+┊   ┊135┊      user_id: '1',
+┊   ┊136┊    },
+┊   ┊137┊    {
+┊   ┊138┊      chat_id: '3',
+┊   ┊139┊      user_id: '4',
+┊   ┊140┊    },
+┊   ┊141┊    {
+┊   ┊142┊      chat_id: '4',
+┊   ┊143┊      user_id: '1',
+┊   ┊144┊    },
+┊   ┊145┊    {
+┊   ┊146┊      chat_id: '4',
+┊   ┊147┊      user_id: '5',
+┊   ┊148┊    },
+┊   ┊149┊  ]
+┊   ┊150┊
+┊   ┊151┊  for (const sampleChatUser of sampleChatsUsers) {
+┊   ┊152┊    await pool.query(sql`
+┊   ┊153┊      INSERT INTO chats_users(chat_id, user_id)
+┊   ┊154┊      VALUES(${sampleChatUser.chat_id}, ${sampleChatUser.user_id})
+┊   ┊155┊    `)
+┊   ┊156┊  }
+┊   ┊157┊
+┊   ┊158┊  await pool.query(sql`DELETE FROM messages`)
+┊   ┊159┊
+┊   ┊160┊  const sampleMessages = [
 ┊106┊161┊    {
 ┊107┊162┊      id: '1',
-┊108┊   ┊      participants: ['1', '2'],
-┊109┊   ┊      messages: ['1'],
+┊   ┊163┊      content: "You on your way?",
+┊   ┊164┊      created_at: new Date(new Date('1-1-2019').getTime() - 60 * 1000 * 1000),
+┊   ┊165┊      chat_id: '1',
+┊   ┊166┊      sender_user_id: '1',
 ┊110┊167┊    },
 ┊111┊168┊    {
 ┊112┊169┊      id: '2',
-┊113┊   ┊      participants: ['1', '3'],
-┊114┊   ┊      messages: ['2'],
+┊   ┊170┊      content: "Hey, it's me",
+┊   ┊171┊      created_at: new Date(new Date('1-1-2019').getTime() - 2 * 60 * 1000 * 1000),
+┊   ┊172┊      chat_id: '2',
+┊   ┊173┊      sender_user_id: '1',
 ┊115┊174┊    },
 ┊116┊175┊    {
 ┊117┊176┊      id: '3',
-┊118┊   ┊      participants: ['1', '4'],
-┊119┊   ┊      messages: ['3'],
+┊   ┊177┊      content: "I should buy a boat",
+┊   ┊178┊      created_at: new Date(new Date('1-1-2019').getTime() - 24 * 60 * 1000 * 1000),
+┊   ┊179┊      chat_id: '3',
+┊   ┊180┊      sender_user_id: '1',
 ┊120┊181┊    },
 ┊121┊182┊    {
 ┊122┊183┊      id: '4',
-┊123┊   ┊      participants: ['1', '5'],
-┊124┊   ┊      messages: ['4'],
+┊   ┊184┊      content: "This is wicked good ice cream.",
+┊   ┊185┊      created_at: new Date(new Date('1-1-2019').getTime() - 14 * 24 * 60 * 1000 * 1000),
+┊   ┊186┊      chat_id: '4',
+┊   ┊187┊      sender_user_id: '1',
 ┊125┊188┊    },
-┊126┊   ┊  ])
+┊   ┊189┊  ]
+┊   ┊190┊
+┊   ┊191┊  for (const sampleMessage of sampleMessages) {
+┊   ┊192┊    await pool.query(sql`
+┊   ┊193┊      INSERT INTO messages(id, content, created_at, chat_id, sender_user_id)
+┊   ┊194┊      VALUES(${sampleMessage.id}, ${sampleMessage.content}, ${sampleMessage.created_at}, ${sampleMessage.chat_id}, ${sampleMessage.sender_user_id})
+┊   ┊195┊    `)
+┊   ┊196┊  }
+┊   ┊197┊
+┊   ┊198┊  await pool.query(sql`SELECT setval('messages_id_seq', (SELECT max(id) FROM messages))`)
+┊   ┊199┊
 ┊127┊200┊}
 ┊128┊201┊
-┊129┊   ┊resetDb()🚫↵
+┊   ┊202┊if (envResetDb) {
+┊   ┊203┊  resetDb()
+┊   ┊204┊}
```

[}]: #

> When you update tables with your own ID values, you have to update `SEQUENCE`; because PostgreSQL calculates the next ID value using `SEQUENCE`s.

**Updating Resolvers**

We will benefit from transactions for complicated SQL queries in mutation. Transactions will help us to rollback our changes if there is an exception in the middle of our operations.

[{]: <helper> (diffStep 11.6 files="resolvers" module="server")

#### [Server Step 11.6: Updating Resolvers with SQL](https://github.com/Urigo/WhatsApp-Clone-Server/commit/20219bd)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -1,70 +1,102 @@
 ┊  1┊  1┊import { withFilter } from 'apollo-server-express'
 ┊  2┊  2┊import { GraphQLDateTime } from 'graphql-iso-date'
-┊  3┊   ┊import { User, Message, Chat, chats, messages, users } from '../db'
+┊   ┊  3┊import { Message, Chat, pool } from '../db'
 ┊  4┊  4┊import { Resolvers } from '../types/graphql'
 ┊  5┊  5┊import { secret, expiration } from '../env'
 ┊  6┊  6┊import bcrypt from 'bcrypt'
 ┊  7┊  7┊import jwt from 'jsonwebtoken'
 ┊  8┊  8┊import { validateLength, validatePassword } from '../validators';
+┊   ┊  9┊import sql from 'sql-template-strings'
 ┊  9┊ 10┊
 ┊ 10┊ 11┊const resolvers: Resolvers = {
 ┊ 11┊ 12┊  Date: GraphQLDateTime,
 ┊ 12┊ 13┊
 ┊ 13┊ 14┊  Message: {
-┊ 14┊   ┊    chat(message) {
-┊ 15┊   ┊      return chats.find(c => c.messages.some(m => m === message.id)) || null
+┊   ┊ 15┊    createdAt(message) {
+┊   ┊ 16┊      return new Date(message.created_at)
 ┊ 16┊ 17┊    },
 ┊ 17┊ 18┊
-┊ 18┊   ┊    sender(message) {
-┊ 19┊   ┊      return users.find(u => u.id === message.sender) || null
+┊   ┊ 19┊    async chat(message, args, { db }) {
+┊   ┊ 20┊      const { rows } = await db.query(sql`
+┊   ┊ 21┊        SELECT * FROM chats WHERE id = ${message.chat_id}
+┊   ┊ 22┊      `)
+┊   ┊ 23┊      return rows[0] || null
 ┊ 20┊ 24┊    },
 ┊ 21┊ 25┊
-┊ 22┊   ┊    recipient(message) {
-┊ 23┊   ┊      return users.find(u => u.id === message.recipient) || null
+┊   ┊ 26┊    async sender(message, args, { db }) {
+┊   ┊ 27┊      const { rows } = await db.query(sql`
+┊   ┊ 28┊        SELECT * FROM users WHERE id = ${message.sender_user_id}
+┊   ┊ 29┊      `)
+┊   ┊ 30┊      return rows[0] || null
+┊   ┊ 31┊    },
+┊   ┊ 32┊
+┊   ┊ 33┊    async recipient(message, args, { db }) {
+┊   ┊ 34┊      const { rows } = await db.query(sql`
+┊   ┊ 35┊        SELECT users.* FROM users, chats_users
+┊   ┊ 36┊        WHERE chats_users.user_id != ${message.sender_user_id}
+┊   ┊ 37┊        AND chats_users.chat_id = ${message.chat_id}
+┊   ┊ 38┊      `)
+┊   ┊ 39┊      return rows[0] || null
 ┊ 24┊ 40┊    },
 ┊ 25┊ 41┊
 ┊ 26┊ 42┊    isMine(message, args, { currentUser }) {
-┊ 27┊   ┊      return message.sender === currentUser.id
+┊   ┊ 43┊      return message.sender_user_id === currentUser.id
 ┊ 28┊ 44┊    },
 ┊ 29┊ 45┊  },
 ┊ 30┊ 46┊
 ┊ 31┊ 47┊  Chat: {
-┊ 32┊   ┊    name(chat, args, { currentUser }) {
+┊   ┊ 48┊    async name(chat, args, { currentUser, db }) {
 ┊ 33┊ 49┊      if (!currentUser) return null
 ┊ 34┊ 50┊
-┊ 35┊   ┊      const participantId = chat.participants.find(p => p !== currentUser.id)
-┊ 36┊   ┊
-┊ 37┊   ┊      if (!participantId) return null
+┊   ┊ 51┊      const { rows } = await db.query(sql`
+┊   ┊ 52┊        SELECT users.* FROM users, chats_users
+┊   ┊ 53┊        WHERE users.id != ${currentUser.id}
+┊   ┊ 54┊        AND users.id = chats_users.user_id
+┊   ┊ 55┊        AND chats_users.chat_id = ${chat.id}`)
 ┊ 38┊ 56┊
-┊ 39┊   ┊      const participant = users.find(u => u.id === participantId)
+┊   ┊ 57┊      const participant = rows[0]
 ┊ 40┊ 58┊
 ┊ 41┊ 59┊      return participant ? participant.name : null
 ┊ 42┊ 60┊    },
 ┊ 43┊ 61┊
-┊ 44┊   ┊    picture(chat, args, { currentUser }) {
+┊   ┊ 62┊    async picture(chat, args, { currentUser, db }) {
 ┊ 45┊ 63┊      if (!currentUser) return null
 ┊ 46┊ 64┊
-┊ 47┊   ┊      const participantId = chat.participants.find(p => p !== currentUser.id)
+┊   ┊ 65┊      const { rows } = await db.query(sql`
+┊   ┊ 66┊        SELECT users.* FROM users, chats_users
+┊   ┊ 67┊        WHERE users.id != ${currentUser.id}
+┊   ┊ 68┊        AND users.id = chats_users.user_id
+┊   ┊ 69┊        AND chats_users.chat_id = ${chat.id}`)
 ┊ 48┊ 70┊
-┊ 49┊   ┊      if (!participantId) return null
-┊ 50┊   ┊
-┊ 51┊   ┊      const participant = users.find(u => u.id === participantId)
+┊   ┊ 71┊      const participant = rows[0]
 ┊ 52┊ 72┊
 ┊ 53┊ 73┊      return participant ? participant.picture : null
 ┊ 54┊ 74┊    },
 ┊ 55┊ 75┊
-┊ 56┊   ┊    messages(chat) {
-┊ 57┊   ┊      return messages.filter(m => chat.messages.includes(m.id))
+┊   ┊ 76┊    async messages(chat, args, { db }) {
+┊   ┊ 77┊      const { rows } = await db.query(sql`SELECT * FROM messages WHERE chat_id = ${chat.id}`)
+┊   ┊ 78┊
+┊   ┊ 79┊      return rows
 ┊ 58┊ 80┊    },
 ┊ 59┊ 81┊
-┊ 60┊   ┊    lastMessage(chat) {
-┊ 61┊   ┊      const lastMessage = chat.messages[chat.messages.length - 1]
+┊   ┊ 82┊    async lastMessage(chat, args, { db }) {
+┊   ┊ 83┊      const { rows } = await db.query(sql`
+┊   ┊ 84┊        SELECT * FROM messages
+┊   ┊ 85┊        WHERE chat_id = ${chat.id}
+┊   ┊ 86┊        ORDER BY created_at DESC
+┊   ┊ 87┊        LIMIT 1`)
 ┊ 62┊ 88┊
-┊ 63┊   ┊      return messages.find(m => m.id === lastMessage) || null
+┊   ┊ 89┊      return rows[0]
 ┊ 64┊ 90┊    },
 ┊ 65┊ 91┊
-┊ 66┊   ┊    participants(chat) {
-┊ 67┊   ┊      return chat.participants.map(p => users.find(u => u.id === p)).filter(Boolean) as User[]
+┊   ┊ 92┊    async participants(chat, args, { db }) {
+┊   ┊ 93┊      const { rows } = await db.query(sql`
+┊   ┊ 94┊        SELECT users.* FROM users, chats_users
+┊   ┊ 95┊        WHERE chats_users.chat_id = ${chat.id}
+┊   ┊ 96┊        AND chats_users.user_id = users.id
+┊   ┊ 97┊      `)
+┊   ┊ 98┊
+┊   ┊ 99┊      return rows
 ┊ 68┊100┊    },
 ┊ 69┊101┊  },
 ┊ 70┊102┊
```
```diff
@@ -73,36 +105,50 @@
 ┊ 73┊105┊      return currentUser || null
 ┊ 74┊106┊    },
 ┊ 75┊107┊
-┊ 76┊   ┊    chats(root, args, { currentUser }) {
+┊   ┊108┊    async chats(root, args, { currentUser, db }) {
 ┊ 77┊109┊      if (!currentUser) return []
 ┊ 78┊110┊
-┊ 79┊   ┊      return chats.filter(c => c.participants.includes(currentUser.id))
+┊   ┊111┊      const { rows } = await db.query(sql`
+┊   ┊112┊        SELECT chats.* FROM chats, chats_users
+┊   ┊113┊        WHERE chats.id = chats_users.chat_id
+┊   ┊114┊        AND chats_users.user_id = ${currentUser.id}
+┊   ┊115┊      `)
+┊   ┊116┊
+┊   ┊117┊      return rows
 ┊ 80┊118┊    },
 ┊ 81┊119┊
-┊ 82┊   ┊    chat(root, { chatId }, { currentUser }) {
+┊   ┊120┊    async chat(root, { chatId }, { currentUser, db }) {
 ┊ 83┊121┊      if (!currentUser) return null
 ┊ 84┊122┊
-┊ 85┊   ┊      const chat = chats.find(c => c.id === chatId)
-┊ 86┊   ┊
-┊ 87┊   ┊      if (!chat) return null
-┊ 88┊   ┊
-┊ 89┊   ┊      return chat.participants.includes(currentUser.id) ? chat : null
+┊   ┊123┊      const { rows } = await db.query(sql`
+┊   ┊124┊        SELECT chats.* FROM chats, chats_users
+┊   ┊125┊        WHERE chats_users.chat_id = ${chatId}
+┊   ┊126┊        AND chats.id = chats_users.chat_id
+┊   ┊127┊        AND chats_users.user_id = ${currentUser.id}
+┊   ┊128┊      `)
+┊   ┊129┊
+┊   ┊130┊      return rows[0] ? rows[0] : null
 ┊ 90┊131┊    },
 ┊ 91┊132┊
-┊ 92┊   ┊    users(root, args, { currentUser }) {
+┊   ┊133┊    async users(root, args, { currentUser, db }) {
 ┊ 93┊134┊      if (!currentUser) return []
 ┊ 94┊135┊
-┊ 95┊   ┊      return users.filter(u => u.id !== currentUser.id)
+┊   ┊136┊      const { rows } = await db.query(sql`
+┊   ┊137┊        SELECT * FROM users WHERE users.id != ${currentUser.id}
+┊   ┊138┊      `)
+┊   ┊139┊
+┊   ┊140┊      return rows
 ┊ 96┊141┊    },
 ┊ 97┊142┊  },
 ┊ 98┊143┊
 ┊ 99┊144┊  Mutation: {
-┊100┊   ┊    signIn(root, { username, password }, { res }) {
 ┊101┊145┊
-┊102┊   ┊      const user = users.find(u => u.username === username)
+┊   ┊146┊    async signIn(root, { username, password }, { db, res }) {
+┊   ┊147┊      const { rows } = await db.query(sql`SELECT * FROM users WHERE username = ${username}`)
+┊   ┊148┊      const user = rows[0]
 ┊103┊149┊
 ┊104┊150┊      if (!user) {
-┊105┊   ┊        throw new Error('user not found')
+┊   ┊151┊        throw new Error('user not found');
 ┊106┊152┊      }
 ┊107┊153┊
 ┊108┊154┊      const passwordsMatch = bcrypt.compareSync(password, user.password)
```
```diff
@@ -112,130 +158,143 @@
 ┊112┊158┊      }
 ┊113┊159┊
 ┊114┊160┊      const authToken = jwt.sign(username, secret)
-┊115┊   ┊
+┊   ┊161┊
 ┊116┊162┊      res.cookie('authToken', authToken, { maxAge: expiration })
 ┊117┊163┊
 ┊118┊164┊      return user;
 ┊119┊165┊    },
-┊120┊   ┊
-┊121┊   ┊    signUp(root, { name, username, password, passwordConfirm }) {
-┊122┊   ┊
+┊   ┊166┊
+┊   ┊167┊    async signUp(root, { name, username, password, passwordConfirm }, { db }) {
 ┊123┊168┊      validateLength('req.name', name, 3, 50)
 ┊124┊169┊      validateLength('req.username', name, 3, 18)
 ┊125┊170┊      validatePassword('req.password', password)
-┊126┊   ┊
+┊   ┊171┊
 ┊127┊172┊      if (password !== passwordConfirm) {
 ┊128┊173┊        throw Error("req.password and req.passwordConfirm don't match")
 ┊129┊174┊      }
-┊130┊   ┊
-┊131┊   ┊      if (users.some(u => u.username === username)) {
+┊   ┊175┊
+┊   ┊176┊      const existingUserQuery = await db.query(sql`SELECT * FROM users WHERE username = ${username}`)
+┊   ┊177┊      if (existingUserQuery.rows[0]) {
 ┊132┊178┊        throw Error("username already exists")
 ┊133┊179┊      }
-┊134┊   ┊
+┊   ┊180┊
 ┊135┊181┊      const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(8))
+┊   ┊182┊
+┊   ┊183┊      const createdUserQuery = await db.query(sql`
+┊   ┊184┊        INSERT INTO users(password, picture, username, name)
+┊   ┊185┊        VALUES(${passwordHash}, '', ${username}, ${name})
+┊   ┊186┊        RETURNING *
+┊   ┊187┊      `)
+┊   ┊188┊
+┊   ┊189┊      const user = createdUserQuery.rows[0]
+┊   ┊190┊
+┊   ┊191┊      return user;
 ┊136┊192┊
-┊137┊   ┊      const user: User = {
-┊138┊   ┊        id: String(users.length + 1),
-┊139┊   ┊        password: passwordHash,
-┊140┊   ┊        picture: '',
-┊141┊   ┊        username,
-┊142┊   ┊        name,
-┊143┊   ┊      }
-┊144┊   ┊
-┊145┊   ┊      users.push(user)
-┊146┊   ┊
-┊147┊   ┊      return user
 ┊148┊193┊    },
 ┊149┊194┊
-┊150┊   ┊    addMessage(root, { chatId, content }, { currentUser, pubsub }) {
+┊   ┊195┊    async addMessage(root, { chatId, content }, { currentUser, pubsub, db }) {
 ┊151┊196┊      if (!currentUser) return null
 ┊152┊197┊
-┊153┊   ┊      const chatIndex = chats.findIndex(c => c.id === chatId)
-┊154┊   ┊
-┊155┊   ┊      if (chatIndex === -1) return null
-┊156┊   ┊
-┊157┊   ┊      const chat = chats[chatIndex]
-┊158┊   ┊
-┊159┊   ┊      if (!chat.participants.includes(currentUser.id)) return null
-┊160┊   ┊
-┊161┊   ┊      const recentMessage = messages[messages.length - 1]
-┊162┊   ┊      const messageId = String(Number(recentMessage.id) + 1)
-┊163┊   ┊      const message: Message = {
-┊164┊   ┊        id: messageId,
-┊165┊   ┊        createdAt: new Date(),
-┊166┊   ┊        sender: currentUser.id,
-┊167┊   ┊        recipient: chat.participants.find(p => p !== currentUser.id) as string,
-┊168┊   ┊        content,
-┊169┊   ┊      }
+┊   ┊198┊      const { rows } = await db.query(sql`
+┊   ┊199┊        INSERT INTO messages(chat_id, sender_user_id, content)
+┊   ┊200┊        VALUES(${chatId}, ${currentUser.id}, ${content})
+┊   ┊201┊        RETURNING *
+┊   ┊202┊      `)
 ┊170┊203┊
-┊171┊   ┊      messages.push(message)
-┊172┊   ┊      chat.messages.push(messageId)
-┊173┊   ┊      // The chat will appear at the top of the ChatsList component
-┊174┊   ┊      chats.splice(chatIndex, 1)
-┊175┊   ┊      chats.unshift(chat)
+┊   ┊204┊      const messageAdded = rows[0]
 ┊176┊205┊
 ┊177┊206┊      pubsub.publish('messageAdded', {
-┊178┊   ┊        messageAdded: message,
+┊   ┊207┊        messageAdded,
 ┊179┊208┊      })
 ┊180┊209┊
-┊181┊   ┊      return message
+┊   ┊210┊      return messageAdded
 ┊182┊211┊    },
 ┊183┊212┊
-┊184┊   ┊    addChat(root, { recipientId }, { currentUser, pubsub }) {
+┊   ┊213┊    async addChat(root, { recipientId }, { currentUser, pubsub, db }) {
 ┊185┊214┊      if (!currentUser) return null
-┊186┊   ┊      if (!users.some(u => u.id === recipientId)) return null
 ┊187┊215┊
-┊188┊   ┊      let chat = chats.find(c =>
-┊189┊   ┊        c.participants.includes(currentUser.id) &&
-┊190┊   ┊        c.participants.includes(recipientId)
-┊191┊   ┊      )
+┊   ┊216┊      const { rows } = await db.query(sql`
+┊   ┊217┊        SELECT chats.* FROM chats, (SELECT * FROM chats_users WHERE user_id = ${currentUser.id}) AS chats_of_current_user, chats_users
+┊   ┊218┊        WHERE chats_users.chat_id = chats_of_current_user.chat_id
+┊   ┊219┊        AND chats.id = chats_users.chat_id
+┊   ┊220┊        AND chats_users.user_id = ${recipientId}
+┊   ┊221┊      `)
 ┊192┊222┊
-┊193┊   ┊      if (chat) return chat
+┊   ┊223┊      // If there is already a chat between these two users, return it
+┊   ┊224┊      if (rows[0]) {
+┊   ┊225┊        return rows[0]
+┊   ┊226┊      }
 ┊194┊227┊
-┊195┊   ┊      const chatsIds = chats.map(c => Number(c.id))
+┊   ┊228┊      try {
+┊   ┊229┊        await db.query('BEGIN')
 ┊196┊230┊
-┊197┊   ┊      chat = {
-┊198┊   ┊        id: String(Math.max(...chatsIds) + 1),
-┊199┊   ┊        participants: [currentUser.id, recipientId],
-┊200┊   ┊        messages: [],
-┊201┊   ┊      }
+┊   ┊231┊        const { rows } = await db.query(sql`
+┊   ┊232┊          INSERT INTO chats
+┊   ┊233┊          DEFAULT VALUES
+┊   ┊234┊          RETURNING *
+┊   ┊235┊        `)
 ┊202┊236┊
-┊203┊   ┊      chats.push(chat)
+┊   ┊237┊        const chatAdded = rows[0]
 ┊204┊238┊
-┊205┊   ┊      pubsub.publish('chatAdded', {
-┊206┊   ┊        chatAdded: chat
-┊207┊   ┊      })
+┊   ┊239┊        await db.query(sql`
+┊   ┊240┊          INSERT INTO chats_users(chat_id, user_id)
+┊   ┊241┊          VALUES(${chatAdded.id}, ${currentUser.id})
+┊   ┊242┊        `)
 ┊208┊243┊
-┊209┊   ┊      return chat
-┊210┊   ┊    },
+┊   ┊244┊        await db.query(sql`
+┊   ┊245┊          INSERT INTO chats_users(chat_id, user_id)
+┊   ┊246┊          VALUES(${chatAdded.id}, ${recipientId})
+┊   ┊247┊        `)
 ┊211┊248┊
-┊212┊   ┊    removeChat(root, { chatId }, { currentUser, pubsub }) {
-┊213┊   ┊      if (!currentUser) return null
+┊   ┊249┊        await db.query('COMMIT')
 ┊214┊250┊
-┊215┊   ┊      const chatIndex = chats.findIndex(c => c.id === chatId)
+┊   ┊251┊        pubsub.publish('chatAdded', {
+┊   ┊252┊          chatAdded
+┊   ┊253┊        })
 ┊216┊254┊
-┊217┊   ┊      if (chatIndex === -1) return null
+┊   ┊255┊        return chatAdded
+┊   ┊256┊      } catch(e) {
+┊   ┊257┊        await db.query('ROLLBACK')
+┊   ┊258┊        throw e
+┊   ┊259┊      }
+┊   ┊260┊    },
+┊   ┊261┊
+┊   ┊262┊    async removeChat(root, { chatId }, { currentUser, pubsub, db }) {
+┊   ┊263┊      if (!currentUser) return null
 ┊218┊264┊
-┊219┊   ┊      const chat = chats[chatIndex]
+┊   ┊265┊      try {
+┊   ┊266┊        await db.query('BEGIN')
 ┊220┊267┊
-┊221┊   ┊      if (!chat.participants.some(p => p === currentUser.id)) return null
+┊   ┊268┊        const { rows } = await db.query(sql`
+┊   ┊269┊          SELECT chats.* FROM chats, chats_users
+┊   ┊270┊          WHERE id = ${chatId}
+┊   ┊271┊          AND chats.id = chats_users.chat_id
+┊   ┊272┊          AND chats_users.user_id = ${currentUser.id}
+┊   ┊273┊        `)
 ┊222┊274┊
-┊223┊   ┊      chat.messages.forEach((chatMessage) => {
-┊224┊   ┊        const chatMessageIndex = messages.findIndex(m => m.id === chatMessage)
+┊   ┊275┊        const chat = rows[0]
 ┊225┊276┊
-┊226┊   ┊        if (chatMessageIndex !== -1) {
-┊227┊   ┊          messages.splice(chatMessageIndex, 1)
+┊   ┊277┊        if (!chat) {
+┊   ┊278┊          await db.query('ROLLBACK')
+┊   ┊279┊          return null
 ┊228┊280┊        }
-┊229┊   ┊      })
 ┊230┊281┊
-┊231┊   ┊      chats.splice(chatIndex, 1)
+┊   ┊282┊        await db.query(sql`
+┊   ┊283┊          DELETE FROM chats WHERE chats.id = ${chatId}
+┊   ┊284┊        `)
 ┊232┊285┊
-┊233┊   ┊      pubsub.publish('chatRemoved', {
-┊234┊   ┊        chatRemoved: chat.id,
-┊235┊   ┊        targetChat: chat,
-┊236┊   ┊      })
+┊   ┊286┊        pubsub.publish('chatRemoved', {
+┊   ┊287┊          chatRemoved: chat.id,
+┊   ┊288┊          targetChat: chat,
+┊   ┊289┊        })
 ┊237┊290┊
-┊238┊   ┊      return chatId
+┊   ┊291┊        await db.query('COMMIT')
+┊   ┊292┊
+┊   ┊293┊        return chatId
+┊   ┊294┊      } catch(e) {
+┊   ┊295┊        await db.query('ROLLBACK')
+┊   ┊296┊        throw e
+┊   ┊297┊      }
 ┊239┊298┊    }
 ┊240┊299┊  },
 ┊241┊300┊
```
```diff
@@ -243,13 +302,15 @@
 ┊243┊302┊    messageAdded: {
 ┊244┊303┊      subscribe: withFilter(
 ┊245┊304┊        (root, args, { pubsub }) => pubsub.asyncIterator('messageAdded'),
-┊246┊   ┊        ({ messageAdded }, args, { currentUser }) => {
+┊   ┊305┊        async ({ messageAdded }: { messageAdded: Message }, args, { currentUser }) => {
 ┊247┊306┊          if (!currentUser) return false
 ┊248┊307┊
-┊249┊   ┊          return [
-┊250┊   ┊            messageAdded.sender,
-┊251┊   ┊            messageAdded.recipient,
-┊252┊   ┊          ].includes(currentUser.id)
+┊   ┊308┊          const { rows } = await pool.query(sql`
+┊   ┊309┊            SELECT * FROM chats_users
+┊   ┊310┊            WHERE chat_id = ${messageAdded.chat_id}
+┊   ┊311┊            AND user_id = ${currentUser.id}`)
+┊   ┊312┊
+┊   ┊313┊          return !!rows.length
 ┊253┊314┊        },
 ┊254┊315┊      )
 ┊255┊316┊    },
```
```diff
@@ -257,10 +318,15 @@
 ┊257┊318┊    chatAdded: {
 ┊258┊319┊      subscribe: withFilter(
 ┊259┊320┊        (root, args, { pubsub }) => pubsub.asyncIterator('chatAdded'),
-┊260┊   ┊        ({ chatAdded }: { chatAdded: Chat }, args, { currentUser }) => {
+┊   ┊321┊        async ({ chatAdded }: { chatAdded: Chat }, args, { currentUser }) => {
 ┊261┊322┊          if (!currentUser) return false
 ┊262┊323┊
-┊263┊   ┊          return chatAdded.participants.some(p => p === currentUser.id)
+┊   ┊324┊          const { rows } = await pool.query(sql`
+┊   ┊325┊            SELECT * FROM chats_users
+┊   ┊326┊            WHERE chat_id = ${chatAdded.id}
+┊   ┊327┊            AND user_id = ${currentUser.id}`)
+┊   ┊328┊
+┊   ┊329┊          return !!rows.length
 ┊264┊330┊        },
 ┊265┊331┊      )
 ┊266┊332┊    },
```
```diff
@@ -268,10 +334,15 @@
 ┊268┊334┊    chatRemoved: {
 ┊269┊335┊      subscribe: withFilter(
 ┊270┊336┊        (root, args, { pubsub }) => pubsub.asyncIterator('chatRemoved'),
-┊271┊   ┊        ({ targetChat }: { targetChat: Chat }, args, { currentUser }) => {
+┊   ┊337┊        async ({ targetChat }: { targetChat: Chat }, args, { currentUser }) => {
 ┊272┊338┊          if (!currentUser) return false
 ┊273┊339┊
-┊274┊   ┊          return targetChat.participants.some(p => p === currentUser.id)
+┊   ┊340┊          const { rows } = await pool.query(sql`
+┊   ┊341┊            SELECT * FROM chats_users
+┊   ┊342┊            WHERE chat_id = ${targetChat.id}
+┊   ┊343┊            AND user_id = ${currentUser.id}`)
+┊   ┊344┊
+┊   ┊345┊          return !!rows.length
 ┊275┊346┊        },
 ┊276┊347┊      )
 ┊277┊348┊    }
```

[}]: #

> We use `pool` itself instead of `db` from the context in the subscriptions. Remember we don't request for a new client from the pool in subscriptions.
> If you use `pool.query`, it just opens a connection, does that operation and set the client free. In that case, you wouldn't be able to work with transactions which is not need in GraphQL Subscriptions.

**Updating Subscriptions w/ PostgreSQL PubSub mechanism**

Apollo’s default PubSub mechanism is not for production usage. So, we will use PostgreSQL’s notify/listen for our PubSub mechanism in GraphQL Subscriptions.

Install the necessary packages;

	$ yarn add graphql-postgres-subscriptions

[{]: <helper> (diffStep 11.7 files="index" module="server")

#### [Server Step 11.7: Updating Subscriptions w/ PostgreSQL PubSub mechanism](https://github.com/Urigo/WhatsApp-Clone-Server/commit/4ff6ebd)

##### Changed index.ts
```diff
@@ -1,4 +1,4 @@
-┊1┊ ┊import { ApolloServer, gql, PubSub } from 'apollo-server-express'
+┊ ┊1┊import { ApolloServer } from 'apollo-server-express'
 ┊2┊2┊import http from 'http'
 ┊3┊3┊import jwt from 'jsonwebtoken'
 ┊4┊4┊import { app } from './app'
```
```diff
@@ -7,8 +7,15 @@
 ┊ 7┊ 7┊import schema from './schema'
 ┊ 8┊ 8┊import { MyContext } from './context';
 ┊ 9┊ 9┊import sql from 'sql-template-strings'
+┊  ┊10┊const { PostgresPubSub } = require('graphql-postgres-subscriptions')
 ┊10┊11┊
-┊11┊  ┊const pubsub = new PubSub()
+┊  ┊12┊const pubsub = new PostgresPubSub({
+┊  ┊13┊  host: 'localhost',
+┊  ┊14┊  port: 5432,
+┊  ┊15┊  user: 'testuser',
+┊  ┊16┊  password: 'testpassword',
+┊  ┊17┊  database: 'whatsapp'
+┊  ┊18┊})
 ┊12┊19┊const server = new ApolloServer({
 ┊13┊20┊  schema,
 ┊14┊21┊  context: async ({ req, res, connection }: any) => {
```

[}]: #

> Unfortunately `graphql-postgres-subscription` doesn't have TypeScript typings, so we have to import it using `require`.

**Updating Tests**

We should update tests to use SQL instead of in-memory database.

[{]: <helper> (diffStep 11.8 files="test" module="server")

#### [Server Step 11.8: Updating Tests with SQL](https://github.com/Urigo/WhatsApp-Clone-Server/commit/0ee7e92)

##### Changed tests&#x2F;mutations&#x2F;addChat.test.ts
```diff
@@ -1,18 +1,27 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing'
 ┊ 2┊ 2┊import { ApolloServer, PubSub, gql } from 'apollo-server-express'
 ┊ 3┊ 3┊import schema from '../../schema'
-┊ 4┊  ┊import { resetDb, users } from '../../db'
+┊  ┊ 4┊import { resetDb, pool } from '../../db'
+┊  ┊ 5┊import sql from 'sql-template-strings'
+┊  ┊ 6┊import { MyContext } from '../../context';
 ┊ 5┊ 7┊
 ┊ 6┊ 8┊describe('Mutation.addChat', () => {
 ┊ 7┊ 9┊  beforeEach(resetDb)
 ┊ 8┊10┊
 ┊ 9┊11┊  it('creates a new chat between current user and specified recipient', async () => {
+┊  ┊12┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 2`)
+┊  ┊13┊    const currentUser = rows[0];
 ┊10┊14┊    const server = new ApolloServer({
 ┊11┊15┊      schema,
-┊12┊  ┊      context: () => ({
+┊  ┊16┊      context: async () => ({
 ┊13┊17┊        pubsub: new PubSub(),
-┊14┊  ┊        currentUser: users[1],
+┊  ┊18┊        currentUser,
+┊  ┊19┊        db: await pool.connect(),
 ┊15┊20┊      }),
+┊  ┊21┊      formatResponse: (res: any, { context }: { context: MyContext }) => {
+┊  ┊22┊        context.db.release();
+┊  ┊23┊        return res;
+┊  ┊24┊      }
 ┊16┊25┊    })
 ┊17┊26┊
 ┊18┊27┊    const { query, mutate } = createTestClient(server)
```
```diff
@@ -57,12 +66,19 @@
 ┊57┊66┊  })
 ┊58┊67┊
 ┊59┊68┊  it('returns the existing chat if so', async () => {
+┊  ┊69┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`)
+┊  ┊70┊    const currentUser = rows[0]
 ┊60┊71┊    const server = new ApolloServer({
 ┊61┊72┊      schema,
-┊62┊  ┊      context: () => ({
+┊  ┊73┊      context: async () => ({
 ┊63┊74┊        pubsub: new PubSub(),
-┊64┊  ┊        currentUser: users[0],
+┊  ┊75┊        currentUser,
+┊  ┊76┊        db: await pool.connect(),
 ┊65┊77┊      }),
+┊  ┊78┊      formatResponse: (res: any, { context }: { context: MyContext }) => {
+┊  ┊79┊        context.db.release();
+┊  ┊80┊        return res;
+┊  ┊81┊      }
 ┊66┊82┊    })
 ┊67┊83┊
 ┊68┊84┊    const { query, mutate } = createTestClient(server)
```

##### Changed tests&#x2F;mutations&#x2F;addMessage.test.ts
```diff
@@ -1,18 +1,27 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing'
 ┊ 2┊ 2┊import { ApolloServer, PubSub, gql } from 'apollo-server-express'
 ┊ 3┊ 3┊import schema from '../../schema'
-┊ 4┊  ┊import { resetDb, users } from '../../db'
+┊  ┊ 4┊import { resetDb, pool } from '../../db'
+┊  ┊ 5┊import sql from 'sql-template-strings'
+┊  ┊ 6┊import { MyContext } from '../../context';
 ┊ 5┊ 7┊
 ┊ 6┊ 8┊describe('Mutation.addMessage', () => {
 ┊ 7┊ 9┊  beforeEach(resetDb)
 ┊ 8┊10┊
 ┊ 9┊11┊  it('should add message to specified chat', async () => {
+┊  ┊12┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`)
+┊  ┊13┊    const currentUser = rows[0]
 ┊10┊14┊    const server = new ApolloServer({
 ┊11┊15┊      schema,
-┊12┊  ┊      context: () => ({
+┊  ┊16┊      context: async () => ({
 ┊13┊17┊        pubsub: new PubSub(),
-┊14┊  ┊        currentUser: users[0],
+┊  ┊18┊        currentUser,
+┊  ┊19┊        db: await pool.connect(),
 ┊15┊20┊      }),
+┊  ┊21┊      formatResponse: (res: any, { context }: { context: MyContext }) => {
+┊  ┊22┊        context.db.release();
+┊  ┊23┊        return res;
+┊  ┊24┊      }
 ┊16┊25┊    })
 ┊17┊26┊
 ┊18┊27┊    const { query, mutate } = createTestClient(server)
```

##### Changed tests&#x2F;mutations&#x2F;removeChat.test.ts
```diff
@@ -1,18 +1,27 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing'
 ┊ 2┊ 2┊import { ApolloServer, PubSub, gql } from 'apollo-server-express'
 ┊ 3┊ 3┊import schema from '../../schema'
-┊ 4┊  ┊import { resetDb, users } from '../../db'
+┊  ┊ 4┊import { resetDb, pool } from '../../db'
+┊  ┊ 5┊import sql from 'sql-template-strings'
+┊  ┊ 6┊import { MyContext } from '../../context';
 ┊ 5┊ 7┊
 ┊ 6┊ 8┊describe('Mutation.removeChat', () => {
 ┊ 7┊ 9┊  beforeEach(resetDb)
 ┊ 8┊10┊
 ┊ 9┊11┊  it('removes chat by id', async () => {
+┊  ┊12┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`)
+┊  ┊13┊    const currentUser = rows[0]
 ┊10┊14┊    const server = new ApolloServer({
 ┊11┊15┊      schema,
-┊12┊  ┊      context: () => ({
+┊  ┊16┊      context: async () => ({
 ┊13┊17┊        pubsub: new PubSub(),
-┊14┊  ┊        currentUser: users[0],
+┊  ┊18┊        currentUser,
+┊  ┊19┊        db: await pool.connect(),
 ┊15┊20┊      }),
+┊  ┊21┊      formatResponse: (res: any, { context }: { context: MyContext }) => {
+┊  ┊22┊        context.db.release();
+┊  ┊23┊        return res;
+┊  ┊24┊      }
 ┊16┊25┊    })
 ┊17┊26┊
 ┊18┊27┊    const { query, mutate } = createTestClient(server)
```

##### Added tests&#x2F;queries&#x2F;\__snapshots__&#x2F;getMe.test.ts.snap
```diff
@@ -0,0 +1,11 @@
+┊  ┊ 1┊// Jest Snapshot v1, https://goo.gl/fbAQLP
+┊  ┊ 2┊
+┊  ┊ 3┊exports[`Query.me should fetch current user 1`] = `
+┊  ┊ 4┊Object {
+┊  ┊ 5┊  "me": Object {
+┊  ┊ 6┊    "id": "1",
+┊  ┊ 7┊    "name": "Ray Edwards",
+┊  ┊ 8┊    "picture": "https://randomuser.me/api/portraits/thumb/lego/1.jpg",
+┊  ┊ 9┊  },
+┊  ┊10┊}
+┊  ┊11┊`;
```

##### Changed tests&#x2F;queries&#x2F;getChat.test.ts
```diff
@@ -1,15 +1,24 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing'
 ┊ 2┊ 2┊import { ApolloServer, gql } from 'apollo-server-express'
 ┊ 3┊ 3┊import schema from '../../schema'
-┊ 4┊  ┊import { users } from '../../db'
+┊  ┊ 4┊import { pool } from '../../db'
+┊  ┊ 5┊import sql from 'sql-template-strings'
+┊  ┊ 6┊import { MyContext } from '../../context';
 ┊ 5┊ 7┊
 ┊ 6┊ 8┊describe('Query.chat', () => {
 ┊ 7┊ 9┊  it('should fetch specified chat', async () => {
+┊  ┊10┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`)
+┊  ┊11┊    const currentUser = rows[0]
 ┊ 8┊12┊    const server = new ApolloServer({
 ┊ 9┊13┊      schema,
-┊10┊  ┊      context: () => ({
-┊11┊  ┊        currentUser: users[0],
+┊  ┊14┊      context: async () => ({
+┊  ┊15┊        currentUser,
+┊  ┊16┊        db: await pool.connect(),
 ┊12┊17┊      }),
+┊  ┊18┊      formatResponse: (res: any, { context }: { context: MyContext }) => {
+┊  ┊19┊        context.db.release();
+┊  ┊20┊        return res;
+┊  ┊21┊      }
 ┊13┊22┊    })
 ┊14┊23┊
 ┊15┊24┊    const { query } = createTestClient(server)
```

##### Changed tests&#x2F;queries&#x2F;getChats.test.ts
```diff
@@ -1,15 +1,24 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing'
 ┊ 2┊ 2┊import { ApolloServer, gql } from 'apollo-server-express'
 ┊ 3┊ 3┊import schema from '../../schema'
-┊ 4┊  ┊import { users } from '../../db'
+┊  ┊ 4┊import { pool } from '../../db'
+┊  ┊ 5┊import sql from 'sql-template-strings'
+┊  ┊ 6┊import { MyContext } from '../../context';
 ┊ 5┊ 7┊
 ┊ 6┊ 8┊describe('Query.chats', () => {
 ┊ 7┊ 9┊  it('should fetch all chats', async () => {
+┊  ┊10┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`)
+┊  ┊11┊    const currentUser = rows[0]
 ┊ 8┊12┊    const server = new ApolloServer({
 ┊ 9┊13┊      schema,
-┊10┊  ┊      context: () => ({
-┊11┊  ┊        currentUser: users[0],
+┊  ┊14┊      context: async () => ({
+┊  ┊15┊        currentUser,
+┊  ┊16┊        db: await pool.connect(),
 ┊12┊17┊      }),
+┊  ┊18┊      formatResponse: (res: any, { context }: { context: MyContext }) => {
+┊  ┊19┊        context.db.release();
+┊  ┊20┊        return res;
+┊  ┊21┊      }
 ┊13┊22┊    })
 ┊14┊23┊
 ┊15┊24┊    const { query } = createTestClient(server)
```

##### Changed tests&#x2F;queries&#x2F;getMe.test.ts
```diff
@@ -1,15 +1,24 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing'
 ┊ 2┊ 2┊import { ApolloServer, gql } from 'apollo-server-express'
 ┊ 3┊ 3┊import schema from '../../schema'
-┊ 4┊  ┊import { users } from '../../db'
+┊  ┊ 4┊import { pool } from '../../db'
+┊  ┊ 5┊import sql from 'sql-template-strings'
+┊  ┊ 6┊import { MyContext } from '../../context';
 ┊ 5┊ 7┊
 ┊ 6┊ 8┊describe('Query.me', () => {
 ┊ 7┊ 9┊  it('should fetch current user', async () => {
+┊  ┊10┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`)
+┊  ┊11┊    const currentUser = rows[0]
 ┊ 8┊12┊    const server = new ApolloServer({
 ┊ 9┊13┊      schema,
-┊10┊  ┊      context: () => ({
-┊11┊  ┊        currentUser: users[0],
+┊  ┊14┊      context: async () => ({
+┊  ┊15┊        currentUser,
+┊  ┊16┊        db: await pool.connect(),
 ┊12┊17┊      }),
+┊  ┊18┊      formatResponse: (res: any, { context }: { context: MyContext }) => {
+┊  ┊19┊        context.db.release();
+┊  ┊20┊        return res;
+┊  ┊21┊      }
 ┊13┊22┊    })
 ┊14┊23┊
 ┊15┊24┊    const { query } = createTestClient(server)
```

##### Changed tests&#x2F;queries&#x2F;getUsers.test.ts
```diff
@@ -1,15 +1,25 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing'
 ┊ 2┊ 2┊import { ApolloServer, gql } from 'apollo-server-express'
 ┊ 3┊ 3┊import schema from '../../schema'
-┊ 4┊  ┊import { users } from '../../db'
+┊  ┊ 4┊import { pool } from '../../db'
+┊  ┊ 5┊import sql from 'sql-template-strings'
+┊  ┊ 6┊import { MyContext } from '../../context';
 ┊ 5┊ 7┊
 ┊ 6┊ 8┊describe('Query.getUsers', () => {
 ┊ 7┊ 9┊  it('should fetch all users except the one signed-in', async () => {
-┊ 8┊  ┊    let currentUser = users[0]
-┊ 9┊  ┊
+┊  ┊10┊    const firstUserQuery = await pool.query(sql`SELECT * FROM users WHERE id = 1`)
+┊  ┊11┊    let currentUser = firstUserQuery.rows[0]
+┊  ┊12┊    const db = await pool.connect()
 ┊10┊13┊    const server = new ApolloServer({
 ┊11┊14┊      schema,
-┊12┊  ┊      context: () => ({ currentUser }),
+┊  ┊15┊      context: async () => ({
+┊  ┊16┊        currentUser,
+┊  ┊17┊        db: await pool.connect(),
+┊  ┊18┊      }),
+┊  ┊19┊      formatResponse: (res: any, { context }: { context: MyContext }) => {
+┊  ┊20┊        context.db.release();
+┊  ┊21┊        return res;
+┊  ┊22┊      }
 ┊13┊23┊    })
 ┊14┊24┊
 ┊15┊25┊    const { query } = createTestClient(server)
```
```diff
@@ -30,7 +40,8 @@
 ┊30┊40┊    expect(res.errors).toBeUndefined()
 ┊31┊41┊    expect(res.data).toMatchSnapshot()
 ┊32┊42┊
-┊33┊  ┊    currentUser = users[1]
+┊  ┊43┊    const secondUserQuery = await pool.query(sql`SELECT * FROM users WHERE id = '2'`)
+┊  ┊44┊    currentUser = secondUserQuery.rows[0]
 ┊34┊45┊
 ┊35┊46┊    res = await query({
 ┊36┊47┊      query: gql `
```

[}]: #

**Remove in-memory database**

We can remove all the stuff related to in-memory database now.

[{]: <helper> (diffStep 11.9 files="db" module="server")

#### [Server Step 11.9: Removing in-memory database](https://github.com/Urigo/WhatsApp-Clone-Server/commit/f93c43b)

##### Changed db.ts
```diff
@@ -30,10 +30,6 @@
 ┊30┊30┊  database: 'whatsapp'
 ┊31┊31┊})
 ┊32┊32┊
-┊33┊  ┊export const users: User[] = []
-┊34┊  ┊export const messages: Message[] = []
-┊35┊  ┊export const chats: Chat[] = []
-┊36┊  ┊
 ┊37┊33┊export const resetDb = async () => {
 ┊38┊34┊
 ┊39┊35┊  await pool.query(sql`DELETE FROM users`)
```

[}]: #


[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/final@next/.tortilla/manuals/views/step13.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/final@next/.tortilla/manuals/views/step15.md) |
|:--------------------------------|--------------------------------:|

[}]: #
