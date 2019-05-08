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

```gql
type Message { chat: Chat }
```

* Message has another One To Many relationship under the name of `sender`` inside our schema; so one message can have one sender while one sender user can have multiple messages.

```gql
type Message { sender: User }
```

* Message has one more One To Many relationship under the name of `recipient`` inside our schema; so one message can have one recipient while one recipient user can have multiple messages.

```gql
type Message { recipient: User }
```

* Chat has a One To Many relationship under the name of `messages`, because one chat can have multiple messages while one message can have only one chat. Notice that this relationship is the reversed version of the first relationship in Message.

```gql
`type Chat { messages: [Message] }
```

* Chat has another Many To Many relationship under the name of `participants`, because one chat can have multiple participants while a participant can have multiple chats as well.

```gql
type Chat { participants: [User] }
```

* User has a Many To Many relationship under the name of `chats`, because one user can have multiple chats, while it has the same situation for chats.

```gql
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

Following above link, after initializing the database using:
```
postgresql-setup initdb
```
Navigate to /var/lib/pgsql/11/data/pg_hba.conf and edit IPv4 local connections to:
```
# IPv4 local connections:
host    all             all             127.0.0.1/32            trust
```
By doing so you are setting PostgreSQL permissions so your WhatsApp server can access the database.

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

#### [__Server__ Step 11.2: Connecting to database](https://github.com/Urigo/WhatsApp-Clone-Server/commit/c16e92ea12fba1446949cb808704a28ec1497471)

##### Changed db.ts
```diff
@@ -1,3 +1,5 @@
+┊ ┊1┊import { Pool } from 'pg';
+┊ ┊2┊
 ┊1┊3┊export type User = {
 ┊2┊4┊  id: string;
 ┊3┊5┊  name: string;
```
```diff
@@ -20,6 +22,16 @@
 ┊20┊22┊  participants: string[];
 ┊21┊23┊};
 ┊22┊24┊
+┊  ┊25┊export const dbConfig = {
+┊  ┊26┊  host: 'localhost',
+┊  ┊27┊  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
+┊  ┊28┊  user: 'testuser',
+┊  ┊29┊  password: 'testpassword',
+┊  ┊30┊  database: 'whatsapp',
+┊  ┊31┊};
+┊  ┊32┊
+┊  ┊33┊export let pool: Pool = new Pool(dbConfig);
+┊  ┊34┊
 ┊23┊35┊export const users: User[] = [];
 ┊24┊36┊export const messages: Message[] = [];
 ┊25┊37┊export const chats: Chat[] = [];
```

[}]: #

**Add Database Client to GraphQL Context**

After that, we will request a client from this pool on each network request in our GraphQL context. So we need to update our context interface and context builder function.

[{]: <helper> (diffStep 11.3 files="context, index" module="server")

#### [__Server__ Step 11.3: Add Database Client to GraphQL Context](https://github.com/Urigo/WhatsApp-Clone-Server/commit/80ea07799942192d09e3e626cc87e3ebffe23223)

##### Changed context.ts
```diff
@@ -1,9 +1,11 @@
 ┊ 1┊ 1┊import { PubSub } from 'apollo-server-express';
 ┊ 2┊ 2┊import { User } from './db';
 ┊ 3┊ 3┊import { Response } from 'express';
+┊  ┊ 4┊import { PoolClient } from 'pg';
 ┊ 4┊ 5┊
 ┊ 5┊ 6┊export type MyContext = {
 ┊ 6┊ 7┊  pubsub: PubSub;
 ┊ 7┊ 8┊  currentUser: User;
 ┊ 8┊ 9┊  res: Response;
+┊  ┊10┊  db: PoolClient;
 ┊ 9┊11┊};
```

##### Changed index.ts
```diff
@@ -3,14 +3,16 @@
 ┊ 3┊ 3┊import http from 'http';
 ┊ 4┊ 4┊import jwt from 'jsonwebtoken';
 ┊ 5┊ 5┊import { app } from './app';
-┊ 6┊  ┊import { users } from './db';
+┊  ┊ 6┊import { pool } from './db';
 ┊ 7┊ 7┊import { origin, port, secret } from './env';
 ┊ 8┊ 8┊import schema from './schema';
+┊  ┊ 9┊import { MyContext } from './context';
+┊  ┊10┊import sql from 'sql-template-strings';
 ┊ 9┊11┊
 ┊10┊12┊const pubsub = new PubSub();
 ┊11┊13┊const server = new ApolloServer({
 ┊12┊14┊  schema,
-┊13┊  ┊  context: (session: any) => {
+┊  ┊15┊  context: async (session: any) => {
 ┊14┊16┊    // Access the request object
 ┊15┊17┊    let req = session.connection
 ┊16┊18┊      ? session.connection.context.request
```
```diff
@@ -24,12 +26,24 @@
 ┊24┊26┊    let currentUser;
 ┊25┊27┊    if (req.cookies.authToken) {
 ┊26┊28┊      const username = jwt.verify(req.cookies.authToken, secret) as string;
-┊27┊  ┊      currentUser = username && users.find(u => u.username === username);
+┊  ┊29┊      if (username) {
+┊  ┊30┊        const { rows } = await pool.query(
+┊  ┊31┊          sql`SELECT * FROM users WHERE username = ${username}`
+┊  ┊32┊        );
+┊  ┊33┊        currentUser = rows[0];
+┊  ┊34┊      }
+┊  ┊35┊    }
+┊  ┊36┊
+┊  ┊37┊    let db;
+┊  ┊38┊
+┊  ┊39┊    if (!session.connection) {
+┊  ┊40┊      db = await pool.connect();
 ┊28┊41┊    }
 ┊29┊42┊
 ┊30┊43┊    return {
 ┊31┊44┊      currentUser,
 ┊32┊45┊      pubsub,
+┊  ┊46┊      db,
 ┊33┊47┊      res: session.res,
 ┊34┊48┊    };
 ┊35┊49┊  },
```
```diff
@@ -41,6 +55,11 @@
 ┊41┊55┊      };
 ┊42┊56┊    },
 ┊43┊57┊  },
+┊  ┊58┊  formatResponse: (res: any, { context }: { context: MyContext }) => {
+┊  ┊59┊    context.db.release();
+┊  ┊60┊
+┊  ┊61┊    return res;
+┊  ┊62┊  },
 ┊44┊63┊});
 ┊45┊64┊
 ┊46┊65┊server.applyMiddleware({
```

[}]: #

> However we need to release that client to the pool after the network connection ends to prevent connection leaks. So, let’s use `formatResponse` to do this operation.
> We don't need connection pooling for subscriptions, because it can cause the connection open in all websocket connection. That's why, we don't request a new client from the pool if it is a subscription.

**Update entity typings**

We should update our entity typings according to our new database tables and columns.

[{]: <helper> (diffStep 11.4 files="db" module="server")

#### [__Server__ Step 11.4: Update Entity Types](https://github.com/Urigo/WhatsApp-Clone-Server/commit/ace031607d746df067ea462abb1be4cb762f937d)

##### Changed db.ts
```diff
@@ -11,15 +11,13 @@
 ┊11┊11┊export type Message = {
 ┊12┊12┊  id: string;
 ┊13┊13┊  content: string;
-┊14┊  ┊  createdAt: Date;
-┊15┊  ┊  sender: string;
-┊16┊  ┊  recipient: string;
+┊  ┊14┊  created_at: Date;
+┊  ┊15┊  chat_id: string;
+┊  ┊16┊  sender_user_id: string;
 ┊17┊17┊};
 ┊18┊18┊
 ┊19┊19┊export type Chat = {
 ┊20┊20┊  id: string;
-┊21┊  ┊  messages: string[];
-┊22┊  ┊  participants: string[];
 ┊23┊21┊};
 ┊24┊22┊
 ┊25┊23┊export const dbConfig = {
```

[}]: #

**Add Sample Data**

We need to update the `resetDb` function to add a sample data to our new relational database instead of in-memory database. But we will call `resetDb` if it is asked by using the environmental variable.

[{]: <helper> (diffStep 11.5 module="server")

#### [__Server__ Step 11.5: Add Sample Data](https://github.com/Urigo/WhatsApp-Clone-Server/commit/fc22b66534102cef213207a216182106673bd4ce)

##### Changed db.ts
```diff
@@ -1,4 +1,6 @@
 ┊1┊1┊import { Pool } from 'pg';
+┊ ┊2┊import sql from 'sql-template-strings';
+┊ ┊3┊import { resetDb as envResetDb } from './env';
 ┊2┊4┊
 ┊3┊5┊export type User = {
 ┊4┊6┊  id: string;
```
```diff
@@ -34,121 +36,181 @@
 ┊ 34┊ 36┊export const messages: Message[] = [];
 ┊ 35┊ 37┊export const chats: Chat[] = [];
 ┊ 36┊ 38┊
-┊ 37┊   ┊export const resetDb = () => {
-┊ 38┊   ┊  users.splice(
-┊ 39┊   ┊    0,
-┊ 40┊   ┊    Infinity,
-┊ 41┊   ┊    ...[
-┊ 42┊   ┊      {
-┊ 43┊   ┊        id: '1',
-┊ 44┊   ┊        name: 'Ray Edwards',
-┊ 45┊   ┊        username: 'ray',
-┊ 46┊   ┊        password:
-┊ 47┊   ┊          '$2a$08$NO9tkFLCoSqX1c5wk3s7z.JfxaVMKA.m7zUDdDwEquo4rvzimQeJm', // 111
-┊ 48┊   ┊        picture: 'https://randomuser.me/api/portraits/thumb/lego/1.jpg',
-┊ 49┊   ┊      },
-┊ 50┊   ┊      {
-┊ 51┊   ┊        id: '2',
-┊ 52┊   ┊        name: 'Ethan Gonzalez',
-┊ 53┊   ┊        username: 'ethan',
-┊ 54┊   ┊        password:
-┊ 55┊   ┊          '$2a$08$xE4FuCi/ifxjL2S8CzKAmuKLwv18ktksSN.F3XYEnpmcKtpbpeZgO', // 222
-┊ 56┊   ┊        picture: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
-┊ 57┊   ┊      },
-┊ 58┊   ┊      {
-┊ 59┊   ┊        id: '3',
-┊ 60┊   ┊        name: 'Bryan Wallace',
-┊ 61┊   ┊        username: 'bryan',
-┊ 62┊   ┊        password:
-┊ 63┊   ┊          '$2a$08$UHgH7J8G6z1mGQn2qx2kdeWv0jvgHItyAsL9hpEUI3KJmhVW5Q1d.', // 333
-┊ 64┊   ┊        picture: 'https://randomuser.me/api/portraits/thumb/men/2.jpg',
-┊ 65┊   ┊      },
-┊ 66┊   ┊      {
-┊ 67┊   ┊        id: '4',
-┊ 68┊   ┊        name: 'Avery Stewart',
-┊ 69┊   ┊        username: 'avery',
-┊ 70┊   ┊        password:
-┊ 71┊   ┊          '$2a$08$wR1k5Q3T9FC7fUgB7Gdb9Os/GV7dGBBf4PLlWT7HERMFhmFDt47xi', // 444
-┊ 72┊   ┊        picture: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
-┊ 73┊   ┊      },
-┊ 74┊   ┊      {
-┊ 75┊   ┊        id: '5',
-┊ 76┊   ┊        name: 'Katie Peterson',
-┊ 77┊   ┊        username: 'katie',
-┊ 78┊   ┊        password:
-┊ 79┊   ┊          '$2a$08$6.mbXqsDX82ZZ7q5d8Osb..JrGSsNp4R3IKj7mxgF6YGT0OmMw242', // 555
-┊ 80┊   ┊        picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
-┊ 81┊   ┊      },
-┊ 82┊   ┊    ]
+┊   ┊ 39┊export const resetDb = async () => {
+┊   ┊ 40┊  await pool.query(sql`DELETE FROM users`);
+┊   ┊ 41┊
+┊   ┊ 42┊  const sampleUsers = [
+┊   ┊ 43┊    {
+┊   ┊ 44┊      id: '1',
+┊   ┊ 45┊      name: 'Ray Edwards',
+┊   ┊ 46┊      username: 'ray',
+┊   ┊ 47┊      password: '$2a$08$NO9tkFLCoSqX1c5wk3s7z.JfxaVMKA.m7zUDdDwEquo4rvzimQeJm', // 111
+┊   ┊ 48┊      picture: 'https://randomuser.me/api/portraits/thumb/lego/1.jpg',
+┊   ┊ 49┊    },
+┊   ┊ 50┊    {
+┊   ┊ 51┊      id: '2',
+┊   ┊ 52┊      name: 'Ethan Gonzalez',
+┊   ┊ 53┊      username: 'ethan',
+┊   ┊ 54┊      password: '$2a$08$xE4FuCi/ifxjL2S8CzKAmuKLwv18ktksSN.F3XYEnpmcKtpbpeZgO', // 222
+┊   ┊ 55┊      picture: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
+┊   ┊ 56┊    },
+┊   ┊ 57┊    {
+┊   ┊ 58┊      id: '3',
+┊   ┊ 59┊      name: 'Bryan Wallace',
+┊   ┊ 60┊      username: 'bryan',
+┊   ┊ 61┊      password: '$2a$08$UHgH7J8G6z1mGQn2qx2kdeWv0jvgHItyAsL9hpEUI3KJmhVW5Q1d.', // 333
+┊   ┊ 62┊      picture: 'https://randomuser.me/api/portraits/thumb/men/2.jpg',
+┊   ┊ 63┊    },
+┊   ┊ 64┊    {
+┊   ┊ 65┊      id: '4',
+┊   ┊ 66┊      name: 'Avery Stewart',
+┊   ┊ 67┊      username: 'avery',
+┊   ┊ 68┊      password: '$2a$08$wR1k5Q3T9FC7fUgB7Gdb9Os/GV7dGBBf4PLlWT7HERMFhmFDt47xi', // 444
+┊   ┊ 69┊      picture: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
+┊   ┊ 70┊    },
+┊   ┊ 71┊    {
+┊   ┊ 72┊      id: '5',
+┊   ┊ 73┊      name: 'Katie Peterson',
+┊   ┊ 74┊      username: 'katie',
+┊   ┊ 75┊      password: '$2a$08$6.mbXqsDX82ZZ7q5d8Osb..JrGSsNp4R3IKj7mxgF6YGT0OmMw242', // 555
+┊   ┊ 76┊      picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
+┊   ┊ 77┊    },
+┊   ┊ 78┊  ];
+┊   ┊ 79┊
+┊   ┊ 80┊  for (const sampleUser of sampleUsers) {
+┊   ┊ 81┊    await pool.query(sql`
+┊   ┊ 82┊      INSERT INTO users(id, name, username, password, picture)
+┊   ┊ 83┊      VALUES(${sampleUser.id}, ${sampleUser.name}, ${sampleUser.username}, ${
+┊   ┊ 84┊      sampleUser.password
+┊   ┊ 85┊    }, ${sampleUser.picture})
+┊   ┊ 86┊    `);
+┊   ┊ 87┊  }
+┊   ┊ 88┊
+┊   ┊ 89┊  await pool.query(
+┊   ┊ 90┊    sql`SELECT setval('users_id_seq', (SELECT max(id) FROM users))`
 ┊ 83┊ 91┊  );
 ┊ 84┊ 92┊
-┊ 85┊   ┊  messages.splice(
-┊ 86┊   ┊    0,
-┊ 87┊   ┊    Infinity,
-┊ 88┊   ┊    ...[
-┊ 89┊   ┊      {
-┊ 90┊   ┊        id: '1',
-┊ 91┊   ┊        content: 'You on your way?',
-┊ 92┊   ┊        createdAt: new Date(new Date('1-1-2019').getTime() - 60 * 1000 * 1000),
-┊ 93┊   ┊        sender: '1',
-┊ 94┊   ┊        recipient: '2',
-┊ 95┊   ┊      },
-┊ 96┊   ┊      {
-┊ 97┊   ┊        id: '2',
-┊ 98┊   ┊        content: "Hey, it's me",
-┊ 99┊   ┊        createdAt: new Date(
-┊100┊   ┊          new Date('1-1-2019').getTime() - 2 * 60 * 1000 * 1000
-┊101┊   ┊        ),
-┊102┊   ┊        sender: '1',
-┊103┊   ┊        recipient: '3',
-┊104┊   ┊      },
-┊105┊   ┊      {
-┊106┊   ┊        id: '3',
-┊107┊   ┊        content: 'I should buy a boat',
-┊108┊   ┊        createdAt: new Date(
-┊109┊   ┊          new Date('1-1-2019').getTime() - 24 * 60 * 1000 * 1000
-┊110┊   ┊        ),
-┊111┊   ┊        sender: '1',
-┊112┊   ┊        recipient: '4',
-┊113┊   ┊      },
-┊114┊   ┊      {
-┊115┊   ┊        id: '4',
-┊116┊   ┊        content: 'This is wicked good ice cream.',
-┊117┊   ┊        createdAt: new Date(
-┊118┊   ┊          new Date('1-1-2019').getTime() - 14 * 24 * 60 * 1000 * 1000
-┊119┊   ┊        ),
-┊120┊   ┊        sender: '1',
-┊121┊   ┊        recipient: '5',
-┊122┊   ┊      },
-┊123┊   ┊    ]
+┊   ┊ 93┊  await pool.query(sql`DELETE FROM chats`);
+┊   ┊ 94┊
+┊   ┊ 95┊  const sampleChats = [
+┊   ┊ 96┊    {
+┊   ┊ 97┊      id: '1',
+┊   ┊ 98┊    },
+┊   ┊ 99┊    {
+┊   ┊100┊      id: '2',
+┊   ┊101┊    },
+┊   ┊102┊    {
+┊   ┊103┊      id: '3',
+┊   ┊104┊    },
+┊   ┊105┊    {
+┊   ┊106┊      id: '4',
+┊   ┊107┊    },
+┊   ┊108┊  ];
+┊   ┊109┊
+┊   ┊110┊  for (const sampleChat of sampleChats) {
+┊   ┊111┊    await pool.query(sql`
+┊   ┊112┊      INSERT INTO chats(id)
+┊   ┊113┊      VALUES(${sampleChat.id})
+┊   ┊114┊    `);
+┊   ┊115┊  }
+┊   ┊116┊
+┊   ┊117┊  await pool.query(
+┊   ┊118┊    sql`SELECT setval('chats_id_seq', (SELECT max(id) FROM chats))`
 ┊124┊119┊  );
 ┊125┊120┊
-┊126┊   ┊  chats.splice(
-┊127┊   ┊    0,
-┊128┊   ┊    Infinity,
-┊129┊   ┊    ...[
-┊130┊   ┊      {
-┊131┊   ┊        id: '1',
-┊132┊   ┊        participants: ['1', '2'],
-┊133┊   ┊        messages: ['1'],
-┊134┊   ┊      },
-┊135┊   ┊      {
-┊136┊   ┊        id: '2',
-┊137┊   ┊        participants: ['1', '3'],
-┊138┊   ┊        messages: ['2'],
-┊139┊   ┊      },
-┊140┊   ┊      {
-┊141┊   ┊        id: '3',
-┊142┊   ┊        participants: ['1', '4'],
-┊143┊   ┊        messages: ['3'],
-┊144┊   ┊      },
-┊145┊   ┊      {
-┊146┊   ┊        id: '4',
-┊147┊   ┊        participants: ['1', '5'],
-┊148┊   ┊        messages: ['4'],
-┊149┊   ┊      },
-┊150┊   ┊    ]
+┊   ┊121┊  await pool.query(sql`DELETE FROM chats_users`);
+┊   ┊122┊
+┊   ┊123┊  const sampleChatsUsers = [
+┊   ┊124┊    {
+┊   ┊125┊      chat_id: '1',
+┊   ┊126┊      user_id: '1',
+┊   ┊127┊    },
+┊   ┊128┊    {
+┊   ┊129┊      chat_id: '1',
+┊   ┊130┊      user_id: '2',
+┊   ┊131┊    },
+┊   ┊132┊    {
+┊   ┊133┊      chat_id: '2',
+┊   ┊134┊      user_id: '1',
+┊   ┊135┊    },
+┊   ┊136┊    {
+┊   ┊137┊      chat_id: '2',
+┊   ┊138┊      user_id: '3',
+┊   ┊139┊    },
+┊   ┊140┊    {
+┊   ┊141┊      chat_id: '3',
+┊   ┊142┊      user_id: '1',
+┊   ┊143┊    },
+┊   ┊144┊    {
+┊   ┊145┊      chat_id: '3',
+┊   ┊146┊      user_id: '4',
+┊   ┊147┊    },
+┊   ┊148┊    {
+┊   ┊149┊      chat_id: '4',
+┊   ┊150┊      user_id: '1',
+┊   ┊151┊    },
+┊   ┊152┊    {
+┊   ┊153┊      chat_id: '4',
+┊   ┊154┊      user_id: '5',
+┊   ┊155┊    },
+┊   ┊156┊  ];
+┊   ┊157┊
+┊   ┊158┊  for (const sampleChatUser of sampleChatsUsers) {
+┊   ┊159┊    await pool.query(sql`
+┊   ┊160┊      INSERT INTO chats_users(chat_id, user_id)
+┊   ┊161┊      VALUES(${sampleChatUser.chat_id}, ${sampleChatUser.user_id})
+┊   ┊162┊    `);
+┊   ┊163┊  }
+┊   ┊164┊
+┊   ┊165┊  await pool.query(sql`DELETE FROM messages`);
+┊   ┊166┊
+┊   ┊167┊  const baseTime = new Date('1 Jan 2019 GMT').getTime();
+┊   ┊168┊
+┊   ┊169┊  const sampleMessages = [
+┊   ┊170┊    {
+┊   ┊171┊      id: '1',
+┊   ┊172┊      content: 'You on your way?',
+┊   ┊173┊      created_at: new Date(baseTime - 60 * 1000 * 1000),
+┊   ┊174┊      chat_id: '1',
+┊   ┊175┊      sender_user_id: '1',
+┊   ┊176┊    },
+┊   ┊177┊    {
+┊   ┊178┊      id: '2',
+┊   ┊179┊      content: "Hey, it's me",
+┊   ┊180┊      created_at: new Date(baseTime - 2 * 60 * 1000 * 1000),
+┊   ┊181┊      chat_id: '2',
+┊   ┊182┊      sender_user_id: '1',
+┊   ┊183┊    },
+┊   ┊184┊    {
+┊   ┊185┊      id: '3',
+┊   ┊186┊      content: 'I should buy a boat',
+┊   ┊187┊      created_at: new Date(baseTime - 24 * 60 * 1000 * 1000),
+┊   ┊188┊      chat_id: '3',
+┊   ┊189┊      sender_user_id: '1',
+┊   ┊190┊    },
+┊   ┊191┊    {
+┊   ┊192┊      id: '4',
+┊   ┊193┊      content: 'This is wicked good ice cream.',
+┊   ┊194┊      created_at: new Date(baseTime - 14 * 24 * 60 * 1000 * 1000),
+┊   ┊195┊      chat_id: '4',
+┊   ┊196┊      sender_user_id: '1',
+┊   ┊197┊    },
+┊   ┊198┊  ];
+┊   ┊199┊
+┊   ┊200┊  for (const sampleMessage of sampleMessages) {
+┊   ┊201┊    await pool.query(sql`
+┊   ┊202┊      INSERT INTO messages(id, content, created_at, chat_id, sender_user_id)
+┊   ┊203┊      VALUES(${sampleMessage.id}, ${sampleMessage.content}, ${
+┊   ┊204┊      sampleMessage.created_at
+┊   ┊205┊    }, ${sampleMessage.chat_id}, ${sampleMessage.sender_user_id})
+┊   ┊206┊    `);
+┊   ┊207┊  }
+┊   ┊208┊
+┊   ┊209┊  await pool.query(
+┊   ┊210┊    sql`SELECT setval('messages_id_seq', (SELECT max(id) FROM messages))`
 ┊151┊211┊  );
 ┊152┊212┊};
 ┊153┊213┊
-┊154┊   ┊resetDb();
+┊   ┊214┊if (envResetDb) {
+┊   ┊215┊  resetDb();
+┊   ┊216┊}
```

##### Changed env.ts
```diff
@@ -4,3 +4,4 @@
 ┊4┊4┊export const secret = process.env.JWT_SECRET || '70p53cr37';
 ┊5┊5┊export const origin = process.env.ORIGIN || 'http://localhost:3000';
 ┊6┊6┊export const port = process.env.PORT || 4000;
+┊ ┊7┊export const resetDb = process.env.RESET_DB || false;
```

[}]: #

> When you update tables with your own ID values, you have to update `SEQUENCE`; because PostgreSQL calculates the next ID value using `SEQUENCE`s.

**Updating Resolvers**

We will benefit from transactions for complicated SQL queries in mutation. Transactions will help us to rollback our changes if there is an exception in the middle of our operations.

[{]: <helper> (diffStep 11.6 files="resolvers" module="server")

#### [__Server__ Step 11.6: Updating Resolvers with SQL](https://github.com/Urigo/WhatsApp-Clone-Server/commit/78a807cfb9cc5e0a9348be9ab24008089a98401b)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -1,72 +1,104 @@
 ┊  1┊  1┊import { withFilter } from 'apollo-server-express';
 ┊  2┊  2┊import { GraphQLDateTime } from 'graphql-iso-date';
-┊  3┊   ┊import { User, Message, Chat, chats, messages, users } from '../db';
+┊   ┊  3┊import { Message, Chat, pool } from '../db';
 ┊  4┊  4┊import { Resolvers } from '../types/graphql';
 ┊  5┊  5┊import { secret, expiration } from '../env';
 ┊  6┊  6┊import bcrypt from 'bcrypt';
 ┊  7┊  7┊import jwt from 'jsonwebtoken';
 ┊  8┊  8┊import { validateLength, validatePassword } from '../validators';
+┊   ┊  9┊import sql from 'sql-template-strings';
 ┊  9┊ 10┊
 ┊ 10┊ 11┊const resolvers: Resolvers = {
 ┊ 11┊ 12┊  Date: GraphQLDateTime,
 ┊ 12┊ 13┊
 ┊ 13┊ 14┊  Message: {
-┊ 14┊   ┊    chat(message) {
-┊ 15┊   ┊      return chats.find(c => c.messages.some(m => m === message.id)) || null;
+┊   ┊ 15┊    createdAt(message) {
+┊   ┊ 16┊      return new Date(message.created_at);
 ┊ 16┊ 17┊    },
 ┊ 17┊ 18┊
-┊ 18┊   ┊    sender(message) {
-┊ 19┊   ┊      return users.find(u => u.id === message.sender) || null;
+┊   ┊ 19┊    async chat(message, args, { db }) {
+┊   ┊ 20┊      const { rows } = await db.query(sql`
+┊   ┊ 21┊        SELECT * FROM chats WHERE id = ${message.chat_id}
+┊   ┊ 22┊      `);
+┊   ┊ 23┊      return rows[0] || null;
 ┊ 20┊ 24┊    },
 ┊ 21┊ 25┊
-┊ 22┊   ┊    recipient(message) {
-┊ 23┊   ┊      return users.find(u => u.id === message.recipient) || null;
+┊   ┊ 26┊    async sender(message, args, { db }) {
+┊   ┊ 27┊      const { rows } = await db.query(sql`
+┊   ┊ 28┊        SELECT * FROM users WHERE id = ${message.sender_user_id}
+┊   ┊ 29┊      `);
+┊   ┊ 30┊      return rows[0] || null;
+┊   ┊ 31┊    },
+┊   ┊ 32┊
+┊   ┊ 33┊    async recipient(message, args, { db }) {
+┊   ┊ 34┊      const { rows } = await db.query(sql`
+┊   ┊ 35┊        SELECT users.* FROM users, chats_users
+┊   ┊ 36┊        WHERE chats_users.user_id != ${message.sender_user_id}
+┊   ┊ 37┊        AND chats_users.chat_id = ${message.chat_id}
+┊   ┊ 38┊      `);
+┊   ┊ 39┊      return rows[0] || null;
 ┊ 24┊ 40┊    },
 ┊ 25┊ 41┊
 ┊ 26┊ 42┊    isMine(message, args, { currentUser }) {
-┊ 27┊   ┊      return message.sender === currentUser.id;
+┊   ┊ 43┊      return message.sender_user_id === currentUser.id;
 ┊ 28┊ 44┊    },
 ┊ 29┊ 45┊  },
 ┊ 30┊ 46┊
 ┊ 31┊ 47┊  Chat: {
-┊ 32┊   ┊    name(chat, args, { currentUser }) {
+┊   ┊ 48┊    async name(chat, args, { currentUser, db }) {
 ┊ 33┊ 49┊      if (!currentUser) return null;
 ┊ 34┊ 50┊
-┊ 35┊   ┊      const participantId = chat.participants.find(p => p !== currentUser.id);
+┊   ┊ 51┊      const { rows } = await db.query(sql`
+┊   ┊ 52┊        SELECT users.* FROM users, chats_users
+┊   ┊ 53┊        WHERE users.id != ${currentUser.id}
+┊   ┊ 54┊        AND users.id = chats_users.user_id
+┊   ┊ 55┊        AND chats_users.chat_id = ${chat.id}`);
 ┊ 36┊ 56┊
-┊ 37┊   ┊      if (!participantId) return null;
-┊ 38┊   ┊
-┊ 39┊   ┊      const participant = users.find(u => u.id === participantId);
+┊   ┊ 57┊      const participant = rows[0];
 ┊ 40┊ 58┊
 ┊ 41┊ 59┊      return participant ? participant.name : null;
 ┊ 42┊ 60┊    },
 ┊ 43┊ 61┊
-┊ 44┊   ┊    picture(chat, args, { currentUser }) {
+┊   ┊ 62┊    async picture(chat, args, { currentUser, db }) {
 ┊ 45┊ 63┊      if (!currentUser) return null;
 ┊ 46┊ 64┊
-┊ 47┊   ┊      const participantId = chat.participants.find(p => p !== currentUser.id);
-┊ 48┊   ┊
-┊ 49┊   ┊      if (!participantId) return null;
+┊   ┊ 65┊      const { rows } = await db.query(sql`
+┊   ┊ 66┊        SELECT users.* FROM users, chats_users
+┊   ┊ 67┊        WHERE users.id != ${currentUser.id}
+┊   ┊ 68┊        AND users.id = chats_users.user_id
+┊   ┊ 69┊        AND chats_users.chat_id = ${chat.id}`);
 ┊ 50┊ 70┊
-┊ 51┊   ┊      const participant = users.find(u => u.id === participantId);
+┊   ┊ 71┊      const participant = rows[0];
 ┊ 52┊ 72┊
 ┊ 53┊ 73┊      return participant ? participant.picture : null;
 ┊ 54┊ 74┊    },
 ┊ 55┊ 75┊
-┊ 56┊   ┊    messages(chat) {
-┊ 57┊   ┊      return messages.filter(m => chat.messages.includes(m.id));
+┊   ┊ 76┊    async messages(chat, args, { db }) {
+┊   ┊ 77┊      const { rows } = await db.query(
+┊   ┊ 78┊        sql`SELECT * FROM messages WHERE chat_id = ${chat.id}`
+┊   ┊ 79┊      );
+┊   ┊ 80┊
+┊   ┊ 81┊      return rows;
 ┊ 58┊ 82┊    },
 ┊ 59┊ 83┊
-┊ 60┊   ┊    lastMessage(chat) {
-┊ 61┊   ┊      const lastMessage = chat.messages[chat.messages.length - 1];
+┊   ┊ 84┊    async lastMessage(chat, args, { db }) {
+┊   ┊ 85┊      const { rows } = await db.query(sql`
+┊   ┊ 86┊        SELECT * FROM messages
+┊   ┊ 87┊        WHERE chat_id = ${chat.id}
+┊   ┊ 88┊        ORDER BY created_at DESC
+┊   ┊ 89┊        LIMIT 1`);
 ┊ 62┊ 90┊
-┊ 63┊   ┊      return messages.find(m => m.id === lastMessage) || null;
+┊   ┊ 91┊      return rows[0];
 ┊ 64┊ 92┊    },
 ┊ 65┊ 93┊
-┊ 66┊   ┊    participants(chat) {
-┊ 67┊   ┊      return chat.participants
-┊ 68┊   ┊        .map(p => users.find(u => u.id === p))
-┊ 69┊   ┊        .filter(Boolean) as User[];
+┊   ┊ 94┊    async participants(chat, args, { db }) {
+┊   ┊ 95┊      const { rows } = await db.query(sql`
+┊   ┊ 96┊        SELECT users.* FROM users, chats_users
+┊   ┊ 97┊        WHERE chats_users.chat_id = ${chat.id}
+┊   ┊ 98┊        AND chats_users.user_id = users.id
+┊   ┊ 99┊      `);
+┊   ┊100┊
+┊   ┊101┊      return rows;
 ┊ 70┊102┊    },
 ┊ 71┊103┊  },
 ┊ 72┊104┊
```
```diff
@@ -75,32 +107,48 @@
 ┊ 75┊107┊      return currentUser || null;
 ┊ 76┊108┊    },
 ┊ 77┊109┊
-┊ 78┊   ┊    chats(root, args, { currentUser }) {
+┊   ┊110┊    async chats(root, args, { currentUser, db }) {
 ┊ 79┊111┊      if (!currentUser) return [];
 ┊ 80┊112┊
-┊ 81┊   ┊      return chats.filter(c => c.participants.includes(currentUser.id));
+┊   ┊113┊      const { rows } = await db.query(sql`
+┊   ┊114┊        SELECT chats.* FROM chats, chats_users
+┊   ┊115┊        WHERE chats.id = chats_users.chat_id
+┊   ┊116┊        AND chats_users.user_id = ${currentUser.id}
+┊   ┊117┊      `);
+┊   ┊118┊
+┊   ┊119┊      return rows;
 ┊ 82┊120┊    },
 ┊ 83┊121┊
-┊ 84┊   ┊    chat(root, { chatId }, { currentUser }) {
+┊   ┊122┊    async chat(root, { chatId }, { currentUser, db }) {
 ┊ 85┊123┊      if (!currentUser) return null;
 ┊ 86┊124┊
-┊ 87┊   ┊      const chat = chats.find(c => c.id === chatId);
+┊   ┊125┊      const { rows } = await db.query(sql`
+┊   ┊126┊        SELECT chats.* FROM chats, chats_users
+┊   ┊127┊        WHERE chats_users.chat_id = ${chatId}
+┊   ┊128┊        AND chats.id = chats_users.chat_id
+┊   ┊129┊        AND chats_users.user_id = ${currentUser.id}
+┊   ┊130┊      `);
 ┊ 88┊131┊
-┊ 89┊   ┊      if (!chat) return null;
-┊ 90┊   ┊
-┊ 91┊   ┊      return chat.participants.includes(currentUser.id) ? chat : null;
+┊   ┊132┊      return rows[0] ? rows[0] : null;
 ┊ 92┊133┊    },
 ┊ 93┊134┊
-┊ 94┊   ┊    users(root, args, { currentUser }) {
+┊   ┊135┊    async users(root, args, { currentUser, db }) {
 ┊ 95┊136┊      if (!currentUser) return [];
 ┊ 96┊137┊
-┊ 97┊   ┊      return users.filter(u => u.id !== currentUser.id);
+┊   ┊138┊      const { rows } = await db.query(sql`
+┊   ┊139┊        SELECT * FROM users WHERE users.id != ${currentUser.id}
+┊   ┊140┊      `);
+┊   ┊141┊
+┊   ┊142┊      return rows;
 ┊ 98┊143┊    },
 ┊ 99┊144┊  },
 ┊100┊145┊
 ┊101┊146┊  Mutation: {
-┊102┊   ┊    signIn(root, { username, password }, { res }) {
-┊103┊   ┊      const user = users.find(u => u.username === username);
+┊   ┊147┊    async signIn(root, { username, password }, { db, res }) {
+┊   ┊148┊      const { rows } = await db.query(
+┊   ┊149┊        sql`SELECT * FROM users WHERE username = ${username}`
+┊   ┊150┊      );
+┊   ┊151┊      const user = rows[0];
 ┊104┊152┊
 ┊105┊153┊      if (!user) {
 ┊106┊154┊        throw new Error('user not found');
```
```diff
@@ -119,7 +167,7 @@
 ┊119┊167┊      return user;
 ┊120┊168┊    },
 ┊121┊169┊
-┊122┊   ┊    signUp(root, { name, username, password, passwordConfirm }) {
+┊   ┊170┊    async signUp(root, { name, username, password, passwordConfirm }, { db }) {
 ┊123┊171┊      validateLength('req.name', name, 3, 50);
 ┊124┊172┊      validateLength('req.username', username, 3, 18);
 ┊125┊173┊      validatePassword('req.password', password);
```
```diff
@@ -128,114 +176,131 @@
 ┊128┊176┊        throw Error("req.password and req.passwordConfirm don't match");
 ┊129┊177┊      }
 ┊130┊178┊
-┊131┊   ┊      if (users.some(u => u.username === username)) {
+┊   ┊179┊      const existingUserQuery = await db.query(
+┊   ┊180┊        sql`SELECT * FROM users WHERE username = ${username}`
+┊   ┊181┊      );
+┊   ┊182┊      if (existingUserQuery.rows[0]) {
 ┊132┊183┊        throw Error('username already exists');
 ┊133┊184┊      }
 ┊134┊185┊
 ┊135┊186┊      const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(8));
 ┊136┊187┊
-┊137┊   ┊      const user: User = {
-┊138┊   ┊        id: String(users.length + 1),
-┊139┊   ┊        password: passwordHash,
-┊140┊   ┊        picture: '',
-┊141┊   ┊        username,
-┊142┊   ┊        name,
-┊143┊   ┊      };
+┊   ┊188┊      const createdUserQuery = await db.query(sql`
+┊   ┊189┊        INSERT INTO users(password, picture, username, name)
+┊   ┊190┊        VALUES(${passwordHash}, '', ${username}, ${name})
+┊   ┊191┊        RETURNING *
+┊   ┊192┊      `);
 ┊144┊193┊
-┊145┊   ┊      users.push(user);
+┊   ┊194┊      const user = createdUserQuery.rows[0];
 ┊146┊195┊
 ┊147┊196┊      return user;
 ┊148┊197┊    },
 ┊149┊198┊
-┊150┊   ┊    addMessage(root, { chatId, content }, { currentUser, pubsub }) {
+┊   ┊199┊    async addMessage(root, { chatId, content }, { currentUser, pubsub, db }) {
 ┊151┊200┊      if (!currentUser) return null;
 ┊152┊201┊
-┊153┊   ┊      const chatIndex = chats.findIndex(c => c.id === chatId);
-┊154┊   ┊
-┊155┊   ┊      if (chatIndex === -1) return null;
-┊156┊   ┊
-┊157┊   ┊      const chat = chats[chatIndex];
-┊158┊   ┊      if (!chat.participants.includes(currentUser.id)) return null;
-┊159┊   ┊
-┊160┊   ┊      const messagesIds = messages.map(currentMessage => Number(currentMessage.id));
-┊161┊   ┊      const messageId = String(Math.max(...messagesIds) + 1);
-┊162┊   ┊      const message: Message = {
-┊163┊   ┊        id: messageId,
-┊164┊   ┊        createdAt: new Date(),
-┊165┊   ┊        sender: currentUser.id,
-┊166┊   ┊        recipient: chat.participants.find(p => p !== currentUser.id) as string,
-┊167┊   ┊        content,
-┊168┊   ┊      };
+┊   ┊202┊      const { rows } = await db.query(sql`
+┊   ┊203┊        INSERT INTO messages(chat_id, sender_user_id, content)
+┊   ┊204┊        VALUES(${chatId}, ${currentUser.id}, ${content})
+┊   ┊205┊        RETURNING *
+┊   ┊206┊      `);
 ┊169┊207┊
-┊170┊   ┊      messages.push(message);
-┊171┊   ┊      chat.messages.push(messageId);
-┊172┊   ┊      // The chat will appear at the top of the ChatsList component
-┊173┊   ┊      chats.splice(chatIndex, 1);
-┊174┊   ┊      chats.unshift(chat);
+┊   ┊208┊      const messageAdded = rows[0];
 ┊175┊209┊
 ┊176┊210┊      pubsub.publish('messageAdded', {
-┊177┊   ┊        messageAdded: message,
+┊   ┊211┊        messageAdded,
 ┊178┊212┊      });
 ┊179┊213┊
-┊180┊   ┊      return message;
+┊   ┊214┊      return messageAdded;
 ┊181┊215┊    },
 ┊182┊216┊
-┊183┊   ┊    addChat(root, { recipientId }, { currentUser, pubsub }) {
+┊   ┊217┊    async addChat(root, { recipientId }, { currentUser, pubsub, db }) {
 ┊184┊218┊      if (!currentUser) return null;
-┊185┊   ┊      if (!users.some(u => u.id === recipientId)) return null;
 ┊186┊219┊
-┊187┊   ┊      let chat = chats.find(
-┊188┊   ┊        c =>
-┊189┊   ┊          c.participants.includes(currentUser.id) &&
-┊190┊   ┊          c.participants.includes(recipientId)
-┊191┊   ┊      );
+┊   ┊220┊      const { rows } = await db.query(sql`
+┊   ┊221┊        SELECT chats.* FROM chats, (SELECT * FROM chats_users WHERE user_id = ${
+┊   ┊222┊          currentUser.id
+┊   ┊223┊        }) AS chats_of_current_user, chats_users
+┊   ┊224┊        WHERE chats_users.chat_id = chats_of_current_user.chat_id
+┊   ┊225┊        AND chats.id = chats_users.chat_id
+┊   ┊226┊        AND chats_users.user_id = ${recipientId}
+┊   ┊227┊      `);
+┊   ┊228┊
+┊   ┊229┊      // If there is already a chat between these two users, return it
+┊   ┊230┊      if (rows[0]) {
+┊   ┊231┊        return rows[0];
+┊   ┊232┊      }
 ┊192┊233┊
-┊193┊   ┊      if (chat) return chat;
+┊   ┊234┊      try {
+┊   ┊235┊        await db.query('BEGIN');
 ┊194┊236┊
-┊195┊   ┊      const chatsIds = chats.map(c => Number(c.id));
+┊   ┊237┊        const { rows } = await db.query(sql`
+┊   ┊238┊          INSERT INTO chats
+┊   ┊239┊          DEFAULT VALUES
+┊   ┊240┊          RETURNING *
+┊   ┊241┊        `);
 ┊196┊242┊
-┊197┊   ┊      chat = {
-┊198┊   ┊        id: String(Math.max(...chatsIds) + 1),
-┊199┊   ┊        participants: [currentUser.id, recipientId],
-┊200┊   ┊        messages: [],
-┊201┊   ┊      };
+┊   ┊243┊        const chatAdded = rows[0];
 ┊202┊244┊
-┊203┊   ┊      chats.push(chat);
+┊   ┊245┊        await db.query(sql`
+┊   ┊246┊          INSERT INTO chats_users(chat_id, user_id)
+┊   ┊247┊          VALUES(${chatAdded.id}, ${currentUser.id})
+┊   ┊248┊        `);
 ┊204┊249┊
-┊205┊   ┊      pubsub.publish('chatAdded', {
-┊206┊   ┊        chatAdded: chat,
-┊207┊   ┊      });
+┊   ┊250┊        await db.query(sql`
+┊   ┊251┊          INSERT INTO chats_users(chat_id, user_id)
+┊   ┊252┊          VALUES(${chatAdded.id}, ${recipientId})
+┊   ┊253┊        `);
 ┊208┊254┊
-┊209┊   ┊      return chat;
-┊210┊   ┊    },
+┊   ┊255┊        await db.query('COMMIT');
 ┊211┊256┊
-┊212┊   ┊    removeChat(root, { chatId }, { currentUser, pubsub }) {
-┊213┊   ┊      if (!currentUser) return null;
+┊   ┊257┊        pubsub.publish('chatAdded', {
+┊   ┊258┊          chatAdded,
+┊   ┊259┊        });
 ┊214┊260┊
-┊215┊   ┊      const chatIndex = chats.findIndex(c => c.id === chatId);
+┊   ┊261┊        return chatAdded;
+┊   ┊262┊      } catch (e) {
+┊   ┊263┊        await db.query('ROLLBACK');
+┊   ┊264┊        throw e;
+┊   ┊265┊      }
+┊   ┊266┊    },
 ┊216┊267┊
-┊217┊   ┊      if (chatIndex === -1) return null;
+┊   ┊268┊    async removeChat(root, { chatId }, { currentUser, pubsub, db }) {
+┊   ┊269┊      if (!currentUser) return null;
 ┊218┊270┊
-┊219┊   ┊      const chat = chats[chatIndex];
+┊   ┊271┊      try {
+┊   ┊272┊        await db.query('BEGIN');
 ┊220┊273┊
-┊221┊   ┊      if (!chat.participants.some(p => p === currentUser.id)) return null;
+┊   ┊274┊        const { rows } = await db.query(sql`
+┊   ┊275┊          SELECT chats.* FROM chats, chats_users
+┊   ┊276┊          WHERE id = ${chatId}
+┊   ┊277┊          AND chats.id = chats_users.chat_id
+┊   ┊278┊          AND chats_users.user_id = ${currentUser.id}
+┊   ┊279┊        `);
 ┊222┊280┊
-┊223┊   ┊      chat.messages.forEach(chatMessage => {
-┊224┊   ┊        const chatMessageIndex = messages.findIndex(m => m.id === chatMessage);
+┊   ┊281┊        const chat = rows[0];
 ┊225┊282┊
-┊226┊   ┊        if (chatMessageIndex !== -1) {
-┊227┊   ┊          messages.splice(chatMessageIndex, 1);
+┊   ┊283┊        if (!chat) {
+┊   ┊284┊          await db.query('ROLLBACK');
+┊   ┊285┊          return null;
 ┊228┊286┊        }
-┊229┊   ┊      });
 ┊230┊287┊
-┊231┊   ┊      chats.splice(chatIndex, 1);
+┊   ┊288┊        await db.query(sql`
+┊   ┊289┊          DELETE FROM chats WHERE chats.id = ${chatId}
+┊   ┊290┊        `);
 ┊232┊291┊
-┊233┊   ┊      pubsub.publish('chatRemoved', {
-┊234┊   ┊        chatRemoved: chat.id,
-┊235┊   ┊        targetChat: chat,
-┊236┊   ┊      });
+┊   ┊292┊        pubsub.publish('chatRemoved', {
+┊   ┊293┊          chatRemoved: chat.id,
+┊   ┊294┊          targetChat: chat,
+┊   ┊295┊        });
 ┊237┊296┊
-┊238┊   ┊      return chatId;
+┊   ┊297┊        await db.query('COMMIT');
+┊   ┊298┊
+┊   ┊299┊        return chatId;
+┊   ┊300┊      } catch (e) {
+┊   ┊301┊        await db.query('ROLLBACK');
+┊   ┊302┊        throw e;
+┊   ┊303┊      }
 ┊239┊304┊    },
 ┊240┊305┊  },
 ┊241┊306┊
```
```diff
@@ -243,12 +308,19 @@
 ┊243┊308┊    messageAdded: {
 ┊244┊309┊      subscribe: withFilter(
 ┊245┊310┊        (root, args, { pubsub }) => pubsub.asyncIterator('messageAdded'),
-┊246┊   ┊        ({ messageAdded }, args, { currentUser }) => {
+┊   ┊311┊        async (
+┊   ┊312┊          { messageAdded }: { messageAdded: Message },
+┊   ┊313┊          args,
+┊   ┊314┊          { currentUser }
+┊   ┊315┊        ) => {
 ┊247┊316┊          if (!currentUser) return false;
 ┊248┊317┊
-┊249┊   ┊          return [messageAdded.sender, messageAdded.recipient].includes(
-┊250┊   ┊            currentUser.id
-┊251┊   ┊          );
+┊   ┊318┊          const { rows } = await pool.query(sql`
+┊   ┊319┊            SELECT * FROM chats_users
+┊   ┊320┊            WHERE chat_id = ${messageAdded.chat_id}
+┊   ┊321┊            AND user_id = ${currentUser.id}`);
+┊   ┊322┊
+┊   ┊323┊          return !!rows.length;
 ┊252┊324┊        }
 ┊253┊325┊      ),
 ┊254┊326┊    },
```
```diff
@@ -256,10 +328,15 @@
 ┊256┊328┊    chatAdded: {
 ┊257┊329┊      subscribe: withFilter(
 ┊258┊330┊        (root, args, { pubsub }) => pubsub.asyncIterator('chatAdded'),
-┊259┊   ┊        ({ chatAdded }: { chatAdded: Chat }, args, { currentUser }) => {
+┊   ┊331┊        async ({ chatAdded }: { chatAdded: Chat }, args, { currentUser }) => {
 ┊260┊332┊          if (!currentUser) return false;
 ┊261┊333┊
-┊262┊   ┊          return chatAdded.participants.some(p => p === currentUser.id);
+┊   ┊334┊          const { rows } = await pool.query(sql`
+┊   ┊335┊            SELECT * FROM chats_users
+┊   ┊336┊            WHERE chat_id = ${chatAdded.id}
+┊   ┊337┊            AND user_id = ${currentUser.id}`);
+┊   ┊338┊
+┊   ┊339┊          return !!rows.length;
 ┊263┊340┊        }
 ┊264┊341┊      ),
 ┊265┊342┊    },
```
```diff
@@ -267,10 +344,15 @@
 ┊267┊344┊    chatRemoved: {
 ┊268┊345┊      subscribe: withFilter(
 ┊269┊346┊        (root, args, { pubsub }) => pubsub.asyncIterator('chatRemoved'),
-┊270┊   ┊        ({ targetChat }: { targetChat: Chat }, args, { currentUser }) => {
+┊   ┊347┊        async ({ targetChat }: { targetChat: Chat }, args, { currentUser }) => {
 ┊271┊348┊          if (!currentUser) return false;
 ┊272┊349┊
-┊273┊   ┊          return targetChat.participants.some(p => p === currentUser.id);
+┊   ┊350┊          const { rows } = await pool.query(sql`
+┊   ┊351┊            SELECT * FROM chats_users
+┊   ┊352┊            WHERE chat_id = ${targetChat.id}
+┊   ┊353┊            AND user_id = ${currentUser.id}`);
+┊   ┊354┊
+┊   ┊355┊          return !!rows.length;
 ┊274┊356┊        }
 ┊275┊357┊      ),
 ┊276┊358┊    },
```

[}]: #

> We use `pool` itself instead of `db` from the context in the subscriptions. Remember we don't request for a new client from the pool in subscriptions.
> If you use `pool.query`, it just opens a connection, does that operation and set the client free. In that case, you wouldn't be able to work with transactions which is not need in GraphQL Subscriptions.

**Updating Subscriptions w/ PostgreSQL PubSub mechanism**

Apollo’s default PubSub mechanism is not for production usage. So, we will use PostgreSQL’s notify/listen for our PubSub mechanism in GraphQL Subscriptions.

Install the necessary packages;

	$ yarn add graphql-postgres-subscriptions

[{]: <helper> (diffStep 11.7 files="index" module="server")

#### [__Server__ Step 11.7: Updating Subscriptions w/ PostgreSQL PubSub mechanism](https://github.com/Urigo/WhatsApp-Clone-Server/commit/224f99782c6471babe6a11740ee2def805e9dfae)

##### Changed index.ts
```diff
@@ -1,4 +1,4 @@
-┊1┊ ┊import { ApolloServer, gql, PubSub } from 'apollo-server-express';
+┊ ┊1┊import { ApolloServer } from 'apollo-server-express';
 ┊2┊2┊import cookie from 'cookie';
 ┊3┊3┊import http from 'http';
 ┊4┊4┊import jwt from 'jsonwebtoken';
```
```diff
@@ -8,8 +8,15 @@
 ┊ 8┊ 8┊import schema from './schema';
 ┊ 9┊ 9┊import { MyContext } from './context';
 ┊10┊10┊import sql from 'sql-template-strings';
+┊  ┊11┊const { PostgresPubSub } = require('graphql-postgres-subscriptions');
 ┊11┊12┊
-┊12┊  ┊const pubsub = new PubSub();
+┊  ┊13┊const pubsub = new PostgresPubSub({
+┊  ┊14┊  host: 'localhost',
+┊  ┊15┊  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
+┊  ┊16┊  user: 'testuser',
+┊  ┊17┊  password: 'testpassword',
+┊  ┊18┊  database: 'whatsapp',
+┊  ┊19┊});
 ┊13┊20┊const server = new ApolloServer({
 ┊14┊21┊  schema,
 ┊15┊22┊  context: async (session: any) => {
```

[}]: #

> Unfortunately `graphql-postgres-subscription` doesn't have TypeScript typings, so we have to import it using `require`.

**Updating Tests**

We should update tests to use SQL instead of in-memory database.

[{]: <helper> (diffStep 11.8 files="test" module="server")

#### [__Server__ Step 11.8: Updating Tests with SQL](https://github.com/Urigo/WhatsApp-Clone-Server/commit/ae9c7cceaa817ba9af2ca3de8ce96762192891a5)

##### Changed tests&#x2F;mutations&#x2F;addChat.test.ts
```diff
@@ -1,18 +1,27 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing';
 ┊ 2┊ 2┊import { ApolloServer, PubSub, gql } from 'apollo-server-express';
 ┊ 3┊ 3┊import schema from '../../schema';
-┊ 4┊  ┊import { resetDb, users } from '../../db';
+┊  ┊ 4┊import { resetDb, pool } from '../../db';
+┊  ┊ 5┊import sql from 'sql-template-strings';
+┊  ┊ 6┊import { MyContext } from '../../context';
 ┊ 5┊ 7┊
 ┊ 6┊ 8┊describe('Mutation.addChat', () => {
 ┊ 7┊ 9┊  beforeEach(resetDb);
 ┊ 8┊10┊
 ┊ 9┊11┊  it('creates a new chat between current user and specified recipient', async () => {
+┊  ┊12┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 2`);
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
+┊  ┊24┊      },
 ┊16┊25┊    });
 ┊17┊26┊
 ┊18┊27┊    const { query, mutate } = createTestClient(server);
```
```diff
@@ -57,12 +66,19 @@
 ┊57┊66┊  });
 ┊58┊67┊
 ┊59┊68┊  it('returns the existing chat if so', async () => {
+┊  ┊69┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`);
+┊  ┊70┊    const currentUser = rows[0];
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
+┊  ┊81┊      },
 ┊66┊82┊    });
 ┊67┊83┊
 ┊68┊84┊    const { query, mutate } = createTestClient(server);
```

##### Changed tests&#x2F;mutations&#x2F;addMessage.test.ts
```diff
@@ -1,18 +1,27 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing';
 ┊ 2┊ 2┊import { ApolloServer, PubSub, gql } from 'apollo-server-express';
 ┊ 3┊ 3┊import schema from '../../schema';
-┊ 4┊  ┊import { resetDb, users } from '../../db';
+┊  ┊ 4┊import { resetDb, pool } from '../../db';
+┊  ┊ 5┊import sql from 'sql-template-strings';
+┊  ┊ 6┊import { MyContext } from '../../context';
 ┊ 5┊ 7┊
 ┊ 6┊ 8┊describe('Mutation.addMessage', () => {
 ┊ 7┊ 9┊  beforeEach(resetDb);
 ┊ 8┊10┊
 ┊ 9┊11┊  it('should add message to specified chat', async () => {
+┊  ┊12┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`);
+┊  ┊13┊    const currentUser = rows[0];
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
+┊  ┊24┊      },
 ┊16┊25┊    });
 ┊17┊26┊
 ┊18┊27┊    const { query, mutate } = createTestClient(server);
```

##### Changed tests&#x2F;mutations&#x2F;removeChat.test.ts
```diff
@@ -1,18 +1,27 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing';
 ┊ 2┊ 2┊import { ApolloServer, PubSub, gql } from 'apollo-server-express';
 ┊ 3┊ 3┊import schema from '../../schema';
-┊ 4┊  ┊import { resetDb, users } from '../../db';
+┊  ┊ 4┊import { resetDb, pool } from '../../db';
+┊  ┊ 5┊import sql from 'sql-template-strings';
+┊  ┊ 6┊import { MyContext } from '../../context';
 ┊ 5┊ 7┊
 ┊ 6┊ 8┊describe('Mutation.removeChat', () => {
 ┊ 7┊ 9┊  beforeEach(resetDb);
 ┊ 8┊10┊
 ┊ 9┊11┊  it('removes chat by id', async () => {
+┊  ┊12┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`);
+┊  ┊13┊    const currentUser = rows[0];
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
+┊  ┊24┊      },
 ┊16┊25┊    });
 ┊17┊26┊
 ┊18┊27┊    const { query, mutate } = createTestClient(server);
```

##### Changed tests&#x2F;queries&#x2F;getChat.test.ts
```diff
@@ -1,15 +1,26 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing';
 ┊ 2┊ 2┊import { ApolloServer, gql } from 'apollo-server-express';
 ┊ 3┊ 3┊import schema from '../../schema';
-┊ 4┊  ┊import { users } from '../../db';
+┊  ┊ 4┊import { pool, resetDb } from '../../db';
+┊  ┊ 5┊import sql from 'sql-template-strings';
+┊  ┊ 6┊import { MyContext } from '../../context';
 ┊ 5┊ 7┊
 ┊ 6┊ 8┊describe('Query.chat', () => {
+┊  ┊ 9┊  beforeEach(resetDb);
+┊  ┊10┊
 ┊ 7┊11┊  it('should fetch specified chat', async () => {
+┊  ┊12┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`);
+┊  ┊13┊    const currentUser = rows[0];
 ┊ 8┊14┊    const server = new ApolloServer({
 ┊ 9┊15┊      schema,
-┊10┊  ┊      context: () => ({
-┊11┊  ┊        currentUser: users[0],
+┊  ┊16┊      context: async () => ({
+┊  ┊17┊        currentUser,
+┊  ┊18┊        db: await pool.connect(),
 ┊12┊19┊      }),
+┊  ┊20┊      formatResponse: (res: any, { context }: { context: MyContext }) => {
+┊  ┊21┊        context.db.release();
+┊  ┊22┊        return res;
+┊  ┊23┊      },
 ┊13┊24┊    });
 ┊14┊25┊
 ┊15┊26┊    const { query } = createTestClient(server);
```

##### Changed tests&#x2F;queries&#x2F;getChats.test.ts
```diff
@@ -1,15 +1,26 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing';
 ┊ 2┊ 2┊import { ApolloServer, gql } from 'apollo-server-express';
 ┊ 3┊ 3┊import schema from '../../schema';
-┊ 4┊  ┊import { users } from '../../db';
+┊  ┊ 4┊import { pool, resetDb } from '../../db';
+┊  ┊ 5┊import sql from 'sql-template-strings';
+┊  ┊ 6┊import { MyContext } from '../../context';
 ┊ 5┊ 7┊
 ┊ 6┊ 8┊describe('Query.chats', () => {
+┊  ┊ 9┊  beforeEach(resetDb);
+┊  ┊10┊
 ┊ 7┊11┊  it('should fetch all chats', async () => {
+┊  ┊12┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`);
+┊  ┊13┊    const currentUser = rows[0];
 ┊ 8┊14┊    const server = new ApolloServer({
 ┊ 9┊15┊      schema,
-┊10┊  ┊      context: () => ({
-┊11┊  ┊        currentUser: users[0],
+┊  ┊16┊      context: async () => ({
+┊  ┊17┊        currentUser,
+┊  ┊18┊        db: await pool.connect(),
 ┊12┊19┊      }),
+┊  ┊20┊      formatResponse: (res: any, { context }: { context: MyContext }) => {
+┊  ┊21┊        context.db.release();
+┊  ┊22┊        return res;
+┊  ┊23┊      },
 ┊13┊24┊    });
 ┊14┊25┊
 ┊15┊26┊    const { query } = createTestClient(server);
```

##### Changed tests&#x2F;queries&#x2F;getMe.test.ts
```diff
@@ -1,15 +1,24 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing';
 ┊ 2┊ 2┊import { ApolloServer, gql } from 'apollo-server-express';
 ┊ 3┊ 3┊import schema from '../../schema';
-┊ 4┊  ┊import { users } from '../../db';
+┊  ┊ 4┊import { pool } from '../../db';
+┊  ┊ 5┊import sql from 'sql-template-strings';
+┊  ┊ 6┊import { MyContext } from '../../context';
 ┊ 5┊ 7┊
 ┊ 6┊ 8┊describe('Query.me', () => {
 ┊ 7┊ 9┊  it('should fetch current user', async () => {
+┊  ┊10┊    const { rows } = await pool.query(sql`SELECT * FROM users WHERE id = 1`);
+┊  ┊11┊    const currentUser = rows[0];
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
+┊  ┊21┊      },
 ┊13┊22┊    });
 ┊14┊23┊
 ┊15┊24┊    const { query } = createTestClient(server);
```

##### Changed tests&#x2F;queries&#x2F;getUsers.test.ts
```diff
@@ -1,15 +1,27 @@
 ┊ 1┊ 1┊import { createTestClient } from 'apollo-server-testing';
 ┊ 2┊ 2┊import { ApolloServer, gql } from 'apollo-server-express';
 ┊ 3┊ 3┊import schema from '../../schema';
-┊ 4┊  ┊import { users } from '../../db';
+┊  ┊ 4┊import { pool } from '../../db';
+┊  ┊ 5┊import sql from 'sql-template-strings';
+┊  ┊ 6┊import { MyContext } from '../../context';
 ┊ 5┊ 7┊
 ┊ 6┊ 8┊describe('Query.getUsers', () => {
 ┊ 7┊ 9┊  it('should fetch all users except the one signed-in', async () => {
-┊ 8┊  ┊    let currentUser = users[0];
-┊ 9┊  ┊
+┊  ┊10┊    const firstUserQuery = await pool.query(
+┊  ┊11┊      sql`SELECT * FROM users WHERE id = 1`
+┊  ┊12┊    );
+┊  ┊13┊    let currentUser = firstUserQuery.rows[0];
+┊  ┊14┊    const db = await pool.connect();
 ┊10┊15┊    const server = new ApolloServer({
 ┊11┊16┊      schema,
-┊12┊  ┊      context: () => ({ currentUser }),
+┊  ┊17┊      context: async () => ({
+┊  ┊18┊        currentUser,
+┊  ┊19┊        db: await pool.connect(),
+┊  ┊20┊      }),
+┊  ┊21┊      formatResponse: (res: any, { context }: { context: MyContext }) => {
+┊  ┊22┊        context.db.release();
+┊  ┊23┊        return res;
+┊  ┊24┊      },
 ┊13┊25┊    });
 ┊14┊26┊
 ┊15┊27┊    const { query } = createTestClient(server);
```
```diff
@@ -30,7 +42,10 @@
 ┊30┊42┊    expect(res.errors).toBeUndefined();
 ┊31┊43┊    expect(res.data).toMatchSnapshot();
 ┊32┊44┊
-┊33┊  ┊    currentUser = users[1];
+┊  ┊45┊    const secondUserQuery = await pool.query(
+┊  ┊46┊      sql`SELECT * FROM users WHERE id = '2'`
+┊  ┊47┊    );
+┊  ┊48┊    currentUser = secondUserQuery.rows[0];
 ┊34┊49┊
 ┊35┊50┊    res = await query({
 ┊36┊51┊      query: gql`
```

[}]: #

> Because we are running tests against a database, we need to first make sure they run serially, one after the other,
> using Jest's `runInBand` option.
> Also, because during the test we will access a resource (DB) that will keep living, we need to tell Jest to close itself
> after the test is done, using the `forceExit` option

[{]: <helper> (diffStep 11.8 files="package.json" module="server")

#### [__Server__ Step 11.8: Updating Tests with SQL](https://github.com/Urigo/WhatsApp-Clone-Server/commit/ae9c7cceaa817ba9af2ca3de8ce96762192891a5)

##### Changed package.json
```diff
@@ -9,7 +9,7 @@
 ┊ 9┊ 9┊  "scripts": {
 ┊10┊10┊    "prestart": "yarn codegen",
 ┊11┊11┊    "start": "ts-node index.ts",
-┊12┊  ┊    "test": "TZ=\"Asia/Jerusalem\" jest",
+┊  ┊12┊    "test": "TZ=\"Asia/Jerusalem\" jest --runInBand --forceExit",
 ┊13┊13┊    "codegen": "gql-gen",
 ┊14┊14┊    "format": "prettier \"**/*.ts\" --write"
 ┊15┊15┊  },
```

[}]: #

**Remove in-memory database**

We can remove all the stuff related to in-memory database now.

[{]: <helper> (diffStep 11.9 files="db" module="server")

#### [__Server__ Step 11.9: Removing in-memory database](https://github.com/Urigo/WhatsApp-Clone-Server/commit/6f5932a61f2924c60d291475ce4660d1fa6d6d46)

##### Changed db.ts
```diff
@@ -32,10 +32,6 @@
 ┊32┊32┊
 ┊33┊33┊export let pool: Pool = new Pool(dbConfig);
 ┊34┊34┊
-┊35┊  ┊export const users: User[] = [];
-┊36┊  ┊export const messages: Message[] = [];
-┊37┊  ┊export const chats: Chat[] = [];
-┊38┊  ┊
 ┊39┊35┊export async function initDb(): Promise<void> {
 ┊40┊36┊  // Clear tables
 ┊41┊37┊  await pool.query(sql`DROP TABLE IF EXISTS messages;`);
```

[}]: #


[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step13.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step15.md) |
|:--------------------------------|--------------------------------:|

[}]: #
