# Step 14: Migrating to PostgreSQL

[//]: # (head-end)


**Which Relational Database? And Why?**

We’ve used to have an in-memory database so far that keeps our entities on memory.
But in a real application, we need to save the data to disk, so that in case the process will stop, we won't loose all the data.

Advanced systems to store data are called databases and they include a lot of utilities that makes it easier for us to store and retrieve data.

There are many types of databases out there. In this part we will design our database according to the relational database principles with the benefits of SQL.

We prefer to use PostgreSQL as our database system from now on; because PostgreSQL is a Relational Database implementation that has tables, constraints, triggers, roles, stored procedures and views together with foreign tables from external data sources and many features from NoSQL.

**Database Design**

While we were defining our entity types and schema inside our array-based in-memory database, we have already designed the basic parts of them.
In this part, we will design our relational database with base and relation tables.

Initially we can decide the base fields without relations:

```
* User
    * id
    * name
    * username
    * password
    * picture
* Message
    * id
    * content
    * created_at
* Chat
    * id
```

Before creating tables, we should design our database structure according to [Database Normalization principles](https://www.essentialsql.com/get-ready-to-learn-sql-database-normalization-explained-in-simple-english/) to prevent duplicated data and modification anomalies.

Initially we will have 3 base tables in our database; `user`, `chat`, `message`; and there are some relations between those 3 tables.
These relations will be defined in other relation tables together with different primary key and foreign key definitions.

There are four types of relations in relational databases:

* One to one
    * This relationship means A entity type can have a relationship with only one instance of B entity type while B entity type can have a relationship with only one instance of A entity type. For example, one user can have only one profile while a profile belongs to only one user.
* Many to one
    * This relationship means A entity type can have a relationship with multiple instances of B entity type while B entity type can have a relationship with only one instance of A entity type. For example, a chat can have multiple messages while a message belongs to only one chat. But `many to one` as a word means multiple photos belong to the same chat.
* One to many
    * This relationship has the same logic with Many to one. However, `One to many` as a word means a chat can have multiple messages while those messages cannot have multiple chats but only one.
* Many to many
    * This relationship means A entity type can have a relationship with multiple instances of B entity type while B entity type can have a relationship with multiple instances of A entity type dependently or independently. For example; a chat can have multiple users, and a user can have multiple chats.

You can read more about those relations in [here](https://www.techrepublic.com/article/relational-databases-defining-relationships-between-database-tables/).

In our existing entity declarations and schema, we have 6 relationships:

* Message has a One To Many relationship under the name of `chat` inside our schema; so one message can have one chat while one chat can have multiple messages.

```gql
type Message {
  chat: Chat
}
```

* Message has another One To Many relationship under the name of `sender` inside our schema; so one message can have one sender while one sender user can have multiple messages.

```gql
type Message {
  sender: User
}
```

* Message has one more One To Many relationship under the name of `recipient` inside our schema; so one message can have one recipient while one recipient user can have multiple messages.

```gql
type Message {
  recipient: User
}
```

* Chat has a One To Many relationship under the name of `messages`, because one chat can have multiple messages while one message can have only one chat. Notice that this relationship is the reversed version of the first relationship in Message.

```gql
`type Chat {
  messages: [Message]
}
```

* Chat has another Many To Many relationship under the name of `participants`, because one chat can have multiple participants while a participant can have multiple chats as well.

```gql
type Chat {
  participants: [User]
}
```

* User has a Many To Many relationship under the name of `chats`, because one user can have multiple chats, while it has the same situation for chats.

```gql
type User {
  chats: [Chat]
}
```


So we should decide the dependencies between each other to add columns and tables to our database.

* User is independent in all relationships, so we will keep its columns as it is
* Message is dependent on User in two cases so we can define this relationship as two different new foreign keys pointing to User’s id under the columns `sender_user_id`. But we don’t need `recipient_user_id` because `recipient` can be found under Chat’s participants.
* Chat is also independent because it will be better to keep those relations inside Message.
* Message is dependent to Chat so we can define this relationship as a new foreign key that points to Chat’s id under the column named `chat_id`.
* We need to have another table that defines the relationship between multiple chats and users.

> We don’t need to duplicate relations in each entities, because SQL has the power to reverse each relations even if they are defined only in one entity. This is one of the rule of Database Normalization.

Finally we can decide on our tables;

```
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
        * `UNIQUE` means this value can exist in this table only once. We use this feature because `username` must be unique in users for each user (Unique can also be a combination of a number of columns)
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
```

> Notice that having a good dependency gives us an opportunity to benefit from `ON_DELETE` feature of SQL. Otherwise, we need to delete each dependent row manually by hand.

## Installing PostgreSQL on your machine

### Windows / Mac OS X

You can download one-click installer for Windows and Mac OS X. During the installation, you must define a password and keep it somewhere safe.

[https://www.enterprisedb.com/downloads/postgres-postgresql-downloads](Download Installer)

### Ubuntu / Debian

If you have Debian package manager on your machine, you can install PostgreSQL in a single line in your Bash terminal;

    $ sudo apt-get install postgresql postgresql-contrib

### Docker

You can use docker and `docker-compose` to install and run your PostgreSQL database.

In order to do that, you'll need to define a docker-compose.yaml configuration file like so:

[{]: <helper> (diffStep 11.1 files="docker-compose.yaml" module="server")

#### [__Server__ Step 11.1: Installing PostgreSQL Client](https://github.com/Urigo/WhatsApp-Clone-Server/commit/6912f37567cb2fbf33250a1479f310a161eea149)

##### Added docker-compose.yaml
```diff
@@ -0,0 +1,17 @@
+┊  ┊ 1┊version: "3.8"
+┊  ┊ 2┊networks:
+┊  ┊ 3┊  tortilla:
+┊  ┊ 4┊services:
+┊  ┊ 5┊  postgresql:
+┊  ┊ 6┊    restart: always
+┊  ┊ 7┊    image: postgres:12.2-alpine
+┊  ┊ 8┊    ports:
+┊  ┊ 9┊      - "5432:5432"
+┊  ┊10┊    environment:
+┊  ┊11┊      - POSTGRES_USER=testuser
+┊  ┊12┊      - POSTGRES_PASSWORD=testpassword
+┊  ┊13┊      - POSTGRES_DB=whatsapp
+┊  ┊14┊    volumes:
+┊  ┊15┊      - /var/lib/postgresql/data
+┊  ┊16┊    networks:
+┊  ┊17┊      - tortilla🚫↵
```

[}]: #

Then make sure you have Docker installed and then run on the command line:

```bash
docker-compose up -d
```

### Other environments

Check [PostgreSQL website](https://www.postgresql.org/download/) for installation instructions on other environments.

After following the above link, initialize the database using:
```bash
postgresql-setup initdb
```
Navigate to /var/lib/pgsql/11/data/pg_hba.conf and edit IPv4 local connections to:
```bash
# IPv4 local connections:
host    all             all             127.0.0.1/32            trust
```
By doing so you are setting PostgreSQL permissions so your WhatsApp server can access the database.

## Creating Database, Database User and Tables

> Make sure you have installed PostgreSQL on your environment first!

We will use Bash terminal in order to access PostgreSQL using superuser:

    $ su - postgres

You don't need to execute the previous command if you're using Windows. But you have to open the terminal with Administrator privileges.

    $ psql template1

Then we will see the following PostgreSQL console:

```bash
Welcome to psql 7.4.16, the PostgreSQL interactive terminal.

Type:  \\copyright for distribution terms
       \\h for help with SQL commands
       \\? for help on internal slash commands
       \\g or terminate with semicolon to execute query
       \\q to quit

template1
```

So we can do the following SQL operations in order to create our new user, database and tables:

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

* Create messages table

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

## Installing PostgreSQL on our backend project

As we are using PostgreSQL, we will use `node-postgres` as our database client in the backend.

First install necessary npm packages using yarn;

	$ yarn add pg

And we will also need TypeScript definitions for better development experience;

	$ yarn add @types/pg --dev

We will use `sql` template literals (which is way easier and safer than native API) with [this package](https://github.com/felixfbecker/node-sql-template-strings)
which allows you to have SQL highlighting in VSCode with [this extension](https://marketplace.visualstudio.com/items?itemName=forbeslindesay.vscode-sql-template-literal)

	$ yarn add sql-template-strings

### Connecting to our database

We will use connection pooling to prevent connection leaks and benefit from transactions in our complicated SQL queries. [You can read more about the benefits of connection pooling.](https://node-postgres.com/features/pooling)

First we need to create a connection pool using our connection credentials;

[{]: <helper> (diffStep 11.2 files="db" module="server")

#### [__Server__ Step 11.2: Connecting to database](https://github.com/Urigo/WhatsApp-Clone-Server/commit/38d2acb8e801e45f2862bf5ba9b5d988390f3c31)

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

### Add Database Client to GraphQL Context

After that, we will request a client from this pool on each network request in our GraphQL context. So we need to update our context interface and context builder function.

[{]: <helper> (diffStep 11.3 files="context, index" module="server")

#### [__Server__ Step 11.3: Add Database Client to GraphQL Context](https://github.com/Urigo/WhatsApp-Clone-Server/commit/df7717f8fd6ad724d4f5400b51c043686620a7f1)

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
-┊27┊  ┊      currentUser = username && users.find((u) => u.username === username);
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

### Update entity typings

We should update our entity typings according to our new database tables and columns.

[{]: <helper> (diffStep 11.4 files="db" module="server")

#### [__Server__ Step 11.4: Update Entity Types](https://github.com/Urigo/WhatsApp-Clone-Server/commit/c831a4dedaaad08729280685c3bacd8032ae54fe)

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

### Add Sample Data

We need to update the `resetDb` function to add a sample data to our new relational database instead of in-memory database. But we will call `resetDb` if it is asked by using the environmental variable.

[{]: <helper> (diffStep 11.5 module="server")

#### [__Server__ Step 11.5: Add Sample Data](https://github.com/Urigo/WhatsApp-Clone-Server/commit/5e7ccae20da00fb92eb01584cc1ee543d3a2fd8e)

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

### Updating Resolvers

We will benefit from transactions for complicated SQL queries in mutation. Transactions will help us to rollback our changes if there is an exception in the middle of our operations.

[{]: <helper> (diffStep 11.6 files="resolvers" module="server")

#### [__Server__ Step 11.6: Updating Resolvers with SQL](https://github.com/Urigo/WhatsApp-Clone-Server/commit/4eee41455e4f785eb94813d1b2f3b100a9251097)

##### Changed schema&#x2F;resolvers.ts
```diff
@@ -1,75 +1,105 @@
 ┊  1┊  1┊import { withFilter } from 'apollo-server-express';
 ┊  2┊  2┊import { DateTimeResolver, URLResolver } from 'graphql-scalars';
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
 ┊ 11┊ 12┊  Date: DateTimeResolver,
 ┊ 12┊ 13┊  URL: URLResolver,
 ┊ 13┊ 14┊
 ┊ 14┊ 15┊  Message: {
-┊ 15┊   ┊    chat(message) {
-┊ 16┊   ┊      return (
-┊ 17┊   ┊        chats.find((c) => c.messages.some((m) => m === message.id)) || null
-┊ 18┊   ┊      );
+┊   ┊ 16┊    createdAt(message) {
+┊   ┊ 17┊      return new Date(message.created_at);
+┊   ┊ 18┊    },
+┊   ┊ 19┊
+┊   ┊ 20┊    async chat(message, args, { db }) {
+┊   ┊ 21┊      const { rows } = await db.query(sql`
+┊   ┊ 22┊        SELECT * FROM chats WHERE id = ${message.chat_id}
+┊   ┊ 23┊      `);
+┊   ┊ 24┊      return rows[0] || null;
 ┊ 19┊ 25┊    },
 ┊ 20┊ 26┊
-┊ 21┊   ┊    sender(message) {
-┊ 22┊   ┊      return users.find((u) => u.id === message.sender) || null;
+┊   ┊ 27┊    async sender(message, args, { db }) {
+┊   ┊ 28┊      const { rows } = await db.query(sql`
+┊   ┊ 29┊        SELECT * FROM users WHERE id = ${message.sender_user_id}
+┊   ┊ 30┊      `);
+┊   ┊ 31┊      return rows[0] || null;
 ┊ 23┊ 32┊    },
 ┊ 24┊ 33┊
-┊ 25┊   ┊    recipient(message) {
-┊ 26┊   ┊      return users.find((u) => u.id === message.recipient) || null;
+┊   ┊ 34┊    async recipient(message, args, { db }) {
+┊   ┊ 35┊      const { rows } = await db.query(sql`
+┊   ┊ 36┊        SELECT users.* FROM users, chats_users
+┊   ┊ 37┊        WHERE chats_users.user_id != ${message.sender_user_id}
+┊   ┊ 38┊        AND chats_users.chat_id = ${message.chat_id}
+┊   ┊ 39┊      `);
+┊   ┊ 40┊      return rows[0] || null;
 ┊ 27┊ 41┊    },
 ┊ 28┊ 42┊
 ┊ 29┊ 43┊    isMine(message, args, { currentUser }) {
-┊ 30┊   ┊      return message.sender === currentUser.id;
+┊   ┊ 44┊      return message.sender_user_id === currentUser.id;
 ┊ 31┊ 45┊    },
 ┊ 32┊ 46┊  },
 ┊ 33┊ 47┊
 ┊ 34┊ 48┊  Chat: {
-┊ 35┊   ┊    name(chat, args, { currentUser }) {
+┊   ┊ 49┊    async name(chat, args, { currentUser, db }) {
 ┊ 36┊ 50┊      if (!currentUser) return null;
 ┊ 37┊ 51┊
-┊ 38┊   ┊      const participantId = chat.participants.find((p) => p !== currentUser.id);
-┊ 39┊   ┊
-┊ 40┊   ┊      if (!participantId) return null;
+┊   ┊ 52┊      const { rows } = await db.query(sql`
+┊   ┊ 53┊        SELECT users.* FROM users, chats_users
+┊   ┊ 54┊        WHERE users.id != ${currentUser.id}
+┊   ┊ 55┊        AND users.id = chats_users.user_id
+┊   ┊ 56┊        AND chats_users.chat_id = ${chat.id}`);
 ┊ 41┊ 57┊
-┊ 42┊   ┊      const participant = users.find((u) => u.id === participantId);
+┊   ┊ 58┊      const participant = rows[0];
 ┊ 43┊ 59┊
 ┊ 44┊ 60┊      return participant ? participant.name : null;
 ┊ 45┊ 61┊    },
 ┊ 46┊ 62┊
-┊ 47┊   ┊    picture(chat, args, { currentUser }) {
+┊   ┊ 63┊    async picture(chat, args, { currentUser, db }) {
 ┊ 48┊ 64┊      if (!currentUser) return null;
 ┊ 49┊ 65┊
-┊ 50┊   ┊      const participantId = chat.participants.find((p) => p !== currentUser.id);
+┊   ┊ 66┊      const { rows } = await db.query(sql`
+┊   ┊ 67┊        SELECT users.* FROM users, chats_users
+┊   ┊ 68┊        WHERE users.id != ${currentUser.id}
+┊   ┊ 69┊        AND users.id = chats_users.user_id
+┊   ┊ 70┊        AND chats_users.chat_id = ${chat.id}`);
 ┊ 51┊ 71┊
-┊ 52┊   ┊      if (!participantId) return null;
-┊ 53┊   ┊
-┊ 54┊   ┊      const participant = users.find((u) => u.id === participantId);
+┊   ┊ 72┊      const participant = rows[0];
 ┊ 55┊ 73┊
 ┊ 56┊ 74┊      return participant ? participant.picture : null;
 ┊ 57┊ 75┊    },
 ┊ 58┊ 76┊
-┊ 59┊   ┊    messages(chat) {
-┊ 60┊   ┊      return messages.filter((m) => chat.messages.includes(m.id));
+┊   ┊ 77┊    async messages(chat, args, { db }) {
+┊   ┊ 78┊      const { rows } = await db.query(
+┊   ┊ 79┊        sql`SELECT * FROM messages WHERE chat_id = ${chat.id}`
+┊   ┊ 80┊      );
+┊   ┊ 81┊
+┊   ┊ 82┊      return rows;
 ┊ 61┊ 83┊    },
 ┊ 62┊ 84┊
-┊ 63┊   ┊    lastMessage(chat) {
-┊ 64┊   ┊      const lastMessage = chat.messages[chat.messages.length - 1];
+┊   ┊ 85┊    async lastMessage(chat, args, { db }) {
+┊   ┊ 86┊      const { rows } = await db.query(sql`
+┊   ┊ 87┊        SELECT * FROM messages
+┊   ┊ 88┊        WHERE chat_id = ${chat.id}
+┊   ┊ 89┊        ORDER BY created_at DESC
+┊   ┊ 90┊        LIMIT 1`);
 ┊ 65┊ 91┊
-┊ 66┊   ┊      return messages.find((m) => m.id === lastMessage) || null;
+┊   ┊ 92┊      return rows[0];
 ┊ 67┊ 93┊    },
 ┊ 68┊ 94┊
-┊ 69┊   ┊    participants(chat) {
-┊ 70┊   ┊      return chat.participants
-┊ 71┊   ┊        .map((p) => users.find((u) => u.id === p))
-┊ 72┊   ┊        .filter(Boolean) as User[];
+┊   ┊ 95┊    async participants(chat, args, { db }) {
+┊   ┊ 96┊      const { rows } = await db.query(sql`
+┊   ┊ 97┊        SELECT users.* FROM users, chats_users
+┊   ┊ 98┊        WHERE chats_users.chat_id = ${chat.id}
+┊   ┊ 99┊        AND chats_users.user_id = users.id
+┊   ┊100┊      `);
+┊   ┊101┊
+┊   ┊102┊      return rows;
 ┊ 73┊103┊    },
 ┊ 74┊104┊  },
 ┊ 75┊105┊
```
```diff
@@ -78,32 +108,48 @@
 ┊ 78┊108┊      return currentUser || null;
 ┊ 79┊109┊    },
 ┊ 80┊110┊
-┊ 81┊   ┊    chats(root, args, { currentUser }) {
+┊   ┊111┊    async chats(root, args, { currentUser, db }) {
 ┊ 82┊112┊      if (!currentUser) return [];
 ┊ 83┊113┊
-┊ 84┊   ┊      return chats.filter((c) => c.participants.includes(currentUser.id));
+┊   ┊114┊      const { rows } = await db.query(sql`
+┊   ┊115┊        SELECT chats.* FROM chats, chats_users
+┊   ┊116┊        WHERE chats.id = chats_users.chat_id
+┊   ┊117┊        AND chats_users.user_id = ${currentUser.id}
+┊   ┊118┊      `);
+┊   ┊119┊
+┊   ┊120┊      return rows;
 ┊ 85┊121┊    },
 ┊ 86┊122┊
-┊ 87┊   ┊    chat(root, { chatId }, { currentUser }) {
+┊   ┊123┊    async chat(root, { chatId }, { currentUser, db }) {
 ┊ 88┊124┊      if (!currentUser) return null;
 ┊ 89┊125┊
-┊ 90┊   ┊      const chat = chats.find((c) => c.id === chatId);
-┊ 91┊   ┊
-┊ 92┊   ┊      if (!chat) return null;
+┊   ┊126┊      const { rows } = await db.query(sql`
+┊   ┊127┊        SELECT chats.* FROM chats, chats_users
+┊   ┊128┊        WHERE chats_users.chat_id = ${chatId}
+┊   ┊129┊        AND chats.id = chats_users.chat_id
+┊   ┊130┊        AND chats_users.user_id = ${currentUser.id}
+┊   ┊131┊      `);
 ┊ 93┊132┊
-┊ 94┊   ┊      return chat.participants.includes(currentUser.id) ? chat : null;
+┊   ┊133┊      return rows[0] ? rows[0] : null;
 ┊ 95┊134┊    },
 ┊ 96┊135┊
-┊ 97┊   ┊    users(root, args, { currentUser }) {
+┊   ┊136┊    async users(root, args, { currentUser, db }) {
 ┊ 98┊137┊      if (!currentUser) return [];
 ┊ 99┊138┊
-┊100┊   ┊      return users.filter((u) => u.id !== currentUser.id);
+┊   ┊139┊      const { rows } = await db.query(sql`
+┊   ┊140┊        SELECT * FROM users WHERE users.id != ${currentUser.id}
+┊   ┊141┊      `);
+┊   ┊142┊
+┊   ┊143┊      return rows;
 ┊101┊144┊    },
 ┊102┊145┊  },
 ┊103┊146┊
 ┊104┊147┊  Mutation: {
-┊105┊   ┊    signIn(root, { username, password }, { res }) {
-┊106┊   ┊      const user = users.find((u) => u.username === username);
+┊   ┊148┊    async signIn(root, { username, password }, { db, res }) {
+┊   ┊149┊      const { rows } = await db.query(
+┊   ┊150┊        sql`SELECT * FROM users WHERE username = ${username}`
+┊   ┊151┊      );
+┊   ┊152┊      const user = rows[0];
 ┊107┊153┊
 ┊108┊154┊      if (!user) {
 ┊109┊155┊        throw new Error('user not found');
```
```diff
@@ -122,7 +168,7 @@
 ┊122┊168┊      return user;
 ┊123┊169┊    },
 ┊124┊170┊
-┊125┊   ┊    signUp(root, { name, username, password, passwordConfirm }) {
+┊   ┊171┊    async signUp(root, { name, username, password, passwordConfirm }, { db }) {
 ┊126┊172┊      validateLength('req.name', name, 3, 50);
 ┊127┊173┊      validateLength('req.username', username, 3, 18);
 ┊128┊174┊      validatePassword('req.password', password);
```
```diff
@@ -131,120 +177,129 @@
 ┊131┊177┊        throw Error("req.password and req.passwordConfirm don't match");
 ┊132┊178┊      }
 ┊133┊179┊
-┊134┊   ┊      if (users.some((u) => u.username === username)) {
+┊   ┊180┊      const existingUserQuery = await db.query(
+┊   ┊181┊        sql`SELECT * FROM users WHERE username = ${username}`
+┊   ┊182┊      );
+┊   ┊183┊      if (existingUserQuery.rows[0]) {
 ┊135┊184┊        throw Error('username already exists');
 ┊136┊185┊      }
 ┊137┊186┊
 ┊138┊187┊      const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(8));
 ┊139┊188┊
-┊140┊   ┊      const user: User = {
-┊141┊   ┊        id: String(users.length + 1),
-┊142┊   ┊        password: passwordHash,
-┊143┊   ┊        picture: '',
-┊144┊   ┊        username,
-┊145┊   ┊        name,
-┊146┊   ┊      };
+┊   ┊189┊      const createdUserQuery = await db.query(sql`
+┊   ┊190┊        INSERT INTO users(password, picture, username, name)
+┊   ┊191┊        VALUES(${passwordHash}, '', ${username}, ${name})
+┊   ┊192┊        RETURNING *
+┊   ┊193┊      `);
 ┊147┊194┊
-┊148┊   ┊      users.push(user);
+┊   ┊195┊      const user = createdUserQuery.rows[0];
 ┊149┊196┊
 ┊150┊197┊      return user;
 ┊151┊198┊    },
 ┊152┊199┊
-┊153┊   ┊    addMessage(root, { chatId, content }, { currentUser, pubsub }) {
+┊   ┊200┊    async addMessage(root, { chatId, content }, { currentUser, pubsub, db }) {
 ┊154┊201┊      if (!currentUser) return null;
 ┊155┊202┊
-┊156┊   ┊      const chatIndex = chats.findIndex((c) => c.id === chatId);
-┊157┊   ┊
-┊158┊   ┊      if (chatIndex === -1) return null;
+┊   ┊203┊      const { rows } = await db.query(sql`
+┊   ┊204┊        INSERT INTO messages(chat_id, sender_user_id, content)
+┊   ┊205┊        VALUES(${chatId}, ${currentUser.id}, ${content})
+┊   ┊206┊        RETURNING *
+┊   ┊207┊      `);
 ┊159┊208┊
-┊160┊   ┊      const chat = chats[chatIndex];
-┊161┊   ┊      if (!chat.participants.includes(currentUser.id)) return null;
-┊162┊   ┊
-┊163┊   ┊      const messagesIds = messages.map((currentMessage) =>
-┊164┊   ┊        Number(currentMessage.id)
-┊165┊   ┊      );
-┊166┊   ┊      const messageId = String(Math.max(...messagesIds) + 1);
-┊167┊   ┊      const message: Message = {
-┊168┊   ┊        id: messageId,
-┊169┊   ┊        createdAt: new Date(),
-┊170┊   ┊        sender: currentUser.id,
-┊171┊   ┊        recipient: chat.participants.find(
-┊172┊   ┊          (p) => p !== currentUser.id
-┊173┊   ┊        ) as string,
-┊174┊   ┊        content,
-┊175┊   ┊      };
-┊176┊   ┊
-┊177┊   ┊      messages.push(message);
-┊178┊   ┊      chat.messages.push(messageId);
-┊179┊   ┊      // The chat will appear at the top of the ChatsList component
-┊180┊   ┊      chats.splice(chatIndex, 1);
-┊181┊   ┊      chats.unshift(chat);
+┊   ┊209┊      const messageAdded = rows[0];
 ┊182┊210┊
 ┊183┊211┊      pubsub.publish('messageAdded', {
-┊184┊   ┊        messageAdded: message,
+┊   ┊212┊        messageAdded,
 ┊185┊213┊      });
 ┊186┊214┊
-┊187┊   ┊      return message;
+┊   ┊215┊      return messageAdded;
 ┊188┊216┊    },
 ┊189┊217┊
-┊190┊   ┊    addChat(root, { recipientId }, { currentUser, pubsub }) {
+┊   ┊218┊    async addChat(root, { recipientId }, { currentUser, pubsub, db }) {
 ┊191┊219┊      if (!currentUser) return null;
-┊192┊   ┊      if (!users.some((u) => u.id === recipientId)) return null;
 ┊193┊220┊
-┊194┊   ┊      let chat = chats.find(
-┊195┊   ┊        (c) =>
-┊196┊   ┊          c.participants.includes(currentUser.id) &&
-┊197┊   ┊          c.participants.includes(recipientId)
-┊198┊   ┊      );
+┊   ┊221┊      const { rows } = await db.query(sql`
+┊   ┊222┊        SELECT chats.* FROM chats, (SELECT * FROM chats_users WHERE user_id = ${currentUser.id}) AS chats_of_current_user, chats_users
+┊   ┊223┊        WHERE chats_users.chat_id = chats_of_current_user.chat_id
+┊   ┊224┊        AND chats.id = chats_users.chat_id
+┊   ┊225┊        AND chats_users.user_id = ${recipientId}
+┊   ┊226┊      `);
 ┊199┊227┊
-┊200┊   ┊      if (chat) return chat;
+┊   ┊228┊      // If there is already a chat between these two users, return it
+┊   ┊229┊      if (rows[0]) {
+┊   ┊230┊        return rows[0];
+┊   ┊231┊      }
 ┊201┊232┊
-┊202┊   ┊      const chatsIds = chats.map((c) => Number(c.id));
+┊   ┊233┊      try {
+┊   ┊234┊        await db.query('BEGIN');
 ┊203┊235┊
-┊204┊   ┊      chat = {
-┊205┊   ┊        id: String(Math.max(...chatsIds) + 1),
-┊206┊   ┊        participants: [currentUser.id, recipientId],
-┊207┊   ┊        messages: [],
-┊208┊   ┊      };
+┊   ┊236┊        const { rows } = await db.query(sql`
+┊   ┊237┊          INSERT INTO chats
+┊   ┊238┊          DEFAULT VALUES
+┊   ┊239┊          RETURNING *
+┊   ┊240┊        `);
 ┊209┊241┊
-┊210┊   ┊      chats.push(chat);
+┊   ┊242┊        const chatAdded = rows[0];
 ┊211┊243┊
-┊212┊   ┊      pubsub.publish('chatAdded', {
-┊213┊   ┊        chatAdded: chat,
-┊214┊   ┊      });
+┊   ┊244┊        await db.query(sql`
+┊   ┊245┊          INSERT INTO chats_users(chat_id, user_id)
+┊   ┊246┊          VALUES(${chatAdded.id}, ${currentUser.id})
+┊   ┊247┊        `);
 ┊215┊248┊
-┊216┊   ┊      return chat;
-┊217┊   ┊    },
+┊   ┊249┊        await db.query(sql`
+┊   ┊250┊          INSERT INTO chats_users(chat_id, user_id)
+┊   ┊251┊          VALUES(${chatAdded.id}, ${recipientId})
+┊   ┊252┊        `);
 ┊218┊253┊
-┊219┊   ┊    removeChat(root, { chatId }, { currentUser, pubsub }) {
-┊220┊   ┊      if (!currentUser) return null;
+┊   ┊254┊        await db.query('COMMIT');
+┊   ┊255┊
+┊   ┊256┊        pubsub.publish('chatAdded', {
+┊   ┊257┊          chatAdded,
+┊   ┊258┊        });
 ┊221┊259┊
-┊222┊   ┊      const chatIndex = chats.findIndex((c) => c.id === chatId);
+┊   ┊260┊        return chatAdded;
+┊   ┊261┊      } catch (e) {
+┊   ┊262┊        await db.query('ROLLBACK');
+┊   ┊263┊        throw e;
+┊   ┊264┊      }
+┊   ┊265┊    },
 ┊223┊266┊
-┊224┊   ┊      if (chatIndex === -1) return null;
+┊   ┊267┊    async removeChat(root, { chatId }, { currentUser, pubsub, db }) {
+┊   ┊268┊      if (!currentUser) return null;
 ┊225┊269┊
-┊226┊   ┊      const chat = chats[chatIndex];
+┊   ┊270┊      try {
+┊   ┊271┊        await db.query('BEGIN');
 ┊227┊272┊
-┊228┊   ┊      if (!chat.participants.some((p) => p === currentUser.id)) return null;
+┊   ┊273┊        const { rows } = await db.query(sql`
+┊   ┊274┊          SELECT chats.* FROM chats, chats_users
+┊   ┊275┊          WHERE id = ${chatId}
+┊   ┊276┊          AND chats.id = chats_users.chat_id
+┊   ┊277┊          AND chats_users.user_id = ${currentUser.id}
+┊   ┊278┊        `);
 ┊229┊279┊
-┊230┊   ┊      chat.messages.forEach((chatMessage) => {
-┊231┊   ┊        const chatMessageIndex = messages.findIndex(
-┊232┊   ┊          (m) => m.id === chatMessage
-┊233┊   ┊        );
+┊   ┊280┊        const chat = rows[0];
 ┊234┊281┊
-┊235┊   ┊        if (chatMessageIndex !== -1) {
-┊236┊   ┊          messages.splice(chatMessageIndex, 1);
+┊   ┊282┊        if (!chat) {
+┊   ┊283┊          await db.query('ROLLBACK');
+┊   ┊284┊          return null;
 ┊237┊285┊        }
-┊238┊   ┊      });
 ┊239┊286┊
-┊240┊   ┊      chats.splice(chatIndex, 1);
+┊   ┊287┊        await db.query(sql`
+┊   ┊288┊          DELETE FROM chats WHERE chats.id = ${chatId}
+┊   ┊289┊        `);
 ┊241┊290┊
-┊242┊   ┊      pubsub.publish('chatRemoved', {
-┊243┊   ┊        chatRemoved: chat.id,
-┊244┊   ┊        targetChat: chat,
-┊245┊   ┊      });
+┊   ┊291┊        pubsub.publish('chatRemoved', {
+┊   ┊292┊          chatRemoved: chat.id,
+┊   ┊293┊          targetChat: chat,
+┊   ┊294┊        });
+┊   ┊295┊
+┊   ┊296┊        await db.query('COMMIT');
 ┊246┊297┊
-┊247┊   ┊      return chatId;
+┊   ┊298┊        return chatId;
+┊   ┊299┊      } catch (e) {
+┊   ┊300┊        await db.query('ROLLBACK');
+┊   ┊301┊        throw e;
+┊   ┊302┊      }
 ┊248┊303┊    },
 ┊249┊304┊  },
 ┊250┊305┊
```
```diff
@@ -252,12 +307,19 @@
 ┊252┊307┊    messageAdded: {
 ┊253┊308┊      subscribe: withFilter(
 ┊254┊309┊        (root, args, { pubsub }) => pubsub.asyncIterator('messageAdded'),
-┊255┊   ┊        ({ messageAdded }, args, { currentUser }) => {
+┊   ┊310┊        async (
+┊   ┊311┊          { messageAdded }: { messageAdded: Message },
+┊   ┊312┊          args,
+┊   ┊313┊          { currentUser }
+┊   ┊314┊        ) => {
 ┊256┊315┊          if (!currentUser) return false;
 ┊257┊316┊
-┊258┊   ┊          return [messageAdded.sender, messageAdded.recipient].includes(
-┊259┊   ┊            currentUser.id
-┊260┊   ┊          );
+┊   ┊317┊          const { rows } = await pool.query(sql`
+┊   ┊318┊            SELECT * FROM chats_users
+┊   ┊319┊            WHERE chat_id = ${messageAdded.chat_id}
+┊   ┊320┊            AND user_id = ${currentUser.id}`);
+┊   ┊321┊
+┊   ┊322┊          return !!rows.length;
 ┊261┊323┊        }
 ┊262┊324┊      ),
 ┊263┊325┊    },
```
```diff
@@ -265,10 +327,15 @@
 ┊265┊327┊    chatAdded: {
 ┊266┊328┊      subscribe: withFilter(
 ┊267┊329┊        (root, args, { pubsub }) => pubsub.asyncIterator('chatAdded'),
-┊268┊   ┊        ({ chatAdded }: { chatAdded: Chat }, args, { currentUser }) => {
+┊   ┊330┊        async ({ chatAdded }: { chatAdded: Chat }, args, { currentUser }) => {
 ┊269┊331┊          if (!currentUser) return false;
 ┊270┊332┊
-┊271┊   ┊          return chatAdded.participants.some((p) => p === currentUser.id);
+┊   ┊333┊          const { rows } = await pool.query(sql`
+┊   ┊334┊            SELECT * FROM chats_users
+┊   ┊335┊            WHERE chat_id = ${chatAdded.id}
+┊   ┊336┊            AND user_id = ${currentUser.id}`);
+┊   ┊337┊
+┊   ┊338┊          return !!rows.length;
 ┊272┊339┊        }
 ┊273┊340┊      ),
 ┊274┊341┊    },
```
```diff
@@ -276,10 +343,15 @@
 ┊276┊343┊    chatRemoved: {
 ┊277┊344┊      subscribe: withFilter(
 ┊278┊345┊        (root, args, { pubsub }) => pubsub.asyncIterator('chatRemoved'),
-┊279┊   ┊        ({ targetChat }: { targetChat: Chat }, args, { currentUser }) => {
+┊   ┊346┊        async ({ targetChat }: { targetChat: Chat }, args, { currentUser }) => {
 ┊280┊347┊          if (!currentUser) return false;
 ┊281┊348┊
-┊282┊   ┊          return targetChat.participants.some((p) => p === currentUser.id);
+┊   ┊349┊          const { rows } = await pool.query(sql`
+┊   ┊350┊            SELECT * FROM chats_users
+┊   ┊351┊            WHERE chat_id = ${targetChat.id}
+┊   ┊352┊            AND user_id = ${currentUser.id}`);
+┊   ┊353┊
+┊   ┊354┊          return !!rows.length;
 ┊283┊355┊        }
 ┊284┊356┊      ),
 ┊285┊357┊    },
```

[}]: #

> We use `pool` itself instead of `db` from the context in the subscriptions. Remember we don't request for a new client from the pool in subscriptions.
> If you use `pool.query`, it just opens a connection, does that operation and set the client free. In that case, you wouldn't be able to work with transactions which is not need in GraphQL Subscriptions.

### Updating Subscriptions w/ PostgreSQL PubSub mechanism

Apollo’s default PubSub mechanism is not for production usage. So, we will use PostgreSQL’s notify/listen for our PubSub mechanism in GraphQL Subscriptions.

Install the necessary packages;

	$ yarn add graphql-postgres-subscriptions

[{]: <helper> (diffStep 11.7 files="index" module="server")

#### [__Server__ Step 11.7: Updating Subscriptions w/ PostgreSQL PubSub mechanism](https://github.com/Urigo/WhatsApp-Clone-Server/commit/a4e0bb70e7ee03bcedbac4198e467699faf35d81)

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
```diff
@@ -44,28 +51,28 @@
 ┊44┊51┊      currentUser,
 ┊45┊52┊      pubsub,
 ┊46┊53┊      db,
-┊47┊  ┊      res: session.res
+┊  ┊54┊      res: session.res,
 ┊48┊55┊    };
 ┊49┊56┊  },
 ┊50┊57┊  subscriptions: {
 ┊51┊58┊    onConnect(params, ws, ctx) {
 ┊52┊59┊      // pass the request object to context
 ┊53┊60┊      return {
-┊54┊  ┊        request: ctx.request
+┊  ┊61┊        request: ctx.request,
 ┊55┊62┊      };
-┊56┊  ┊    }
+┊  ┊63┊    },
 ┊57┊64┊  },
 ┊58┊65┊  formatResponse: (res: any, { context }: any) => {
 ┊59┊66┊    context.db.release();
 ┊60┊67┊
 ┊61┊68┊    return res;
-┊62┊  ┊  }
+┊  ┊69┊  },
 ┊63┊70┊});
 ┊64┊71┊
 ┊65┊72┊server.applyMiddleware({
 ┊66┊73┊  app,
 ┊67┊74┊  path: '/graphql',
-┊68┊  ┊  cors: { credentials: true, origin }
+┊  ┊75┊  cors: { credentials: true, origin },
 ┊69┊76┊});
 ┊70┊77┊
 ┊71┊78┊const httpServer = http.createServer(app);
```

[}]: #

> Unfortunately `graphql-postgres-subscription` doesn't have TypeScript typings, so we have to import it using `require`.

### Updating Tests

We should update tests to use SQL instead of in-memory database.

[{]: <helper> (diffStep 11.8 files="test" module="server")

#### [__Server__ Step 11.8: Updating Tests with SQL](https://github.com/Urigo/WhatsApp-Clone-Server/commit/ea0fa2ad6bdcbf38aa3b1aada197b53cf8b5aa3f)

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

We also added an `initDb()` function to `resetDb` in order to clear and create the tables,
and also grant privileges to `testuser` before each test is executed.

[{]: <helper> (diffStep 11.8 files="db" module="server")

#### [__Server__ Step 11.8: Updating Tests with SQL](https://github.com/Urigo/WhatsApp-Clone-Server/commit/ea0fa2ad6bdcbf38aa3b1aada197b53cf8b5aa3f)

##### Changed db.ts
```diff
@@ -36,8 +36,45 @@
 ┊36┊36┊export const messages: Message[] = [];
 ┊37┊37┊export const chats: Chat[] = [];
 ┊38┊38┊
+┊  ┊39┊export async function initDb(): Promise<void> {
+┊  ┊40┊  // Clear tables
+┊  ┊41┊  await pool.query(sql`DROP TABLE IF EXISTS messages;`);
+┊  ┊42┊  await pool.query(sql`DROP TABLE IF EXISTS chats_users;`);
+┊  ┊43┊  await pool.query(sql`DROP TABLE IF EXISTS users;`);
+┊  ┊44┊  await pool.query(sql`DROP TABLE IF EXISTS chats;`);
+┊  ┊45┊
+┊  ┊46┊  // Create tables
+┊  ┊47┊  await pool.query(sql`CREATE TABLE chats(
+┊  ┊48┊    id SERIAL PRIMARY KEY
+┊  ┊49┊  );`);
+┊  ┊50┊  await pool.query(sql`CREATE TABLE users(
+┊  ┊51┊    id SERIAL PRIMARY KEY,
+┊  ┊52┊    username VARCHAR (50) UNIQUE NOT NULL,
+┊  ┊53┊    name VARCHAR (50) NOT NULL,
+┊  ┊54┊    password VARCHAR (255) NOT NULL,
+┊  ┊55┊    picture VARCHAR (255) NOT NULL
+┊  ┊56┊  );`);
+┊  ┊57┊  await pool.query(sql`CREATE TABLE chats_users(
+┊  ┊58┊    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
+┊  ┊59┊    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
+┊  ┊60┊  );`);
+┊  ┊61┊
+┊  ┊62┊  await pool.query(sql`CREATE TABLE messages(
+┊  ┊63┊    id SERIAL PRIMARY KEY,
+┊  ┊64┊    content VARCHAR (355) NOT NULL,
+┊  ┊65┊    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
+┊  ┊66┊    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
+┊  ┊67┊    sender_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
+┊  ┊68┊  );`);
+┊  ┊69┊
+┊  ┊70┊  // Privileges
+┊  ┊71┊  await pool.query(
+┊  ┊72┊    sql`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO testuser;`
+┊  ┊73┊  );
+┊  ┊74┊}
+┊  ┊75┊
 ┊39┊76┊export const resetDb = async () => {
-┊40┊  ┊  await pool.query(sql`DELETE FROM users`);
+┊  ┊77┊  await initDb();
 ┊41┊78┊
 ┊42┊79┊  const sampleUsers = [
 ┊43┊80┊    {
```

[}]: #

> Because we are running tests against a database, we need to first make sure they run serially, one after the other,
> using Jest's `runInBand` option.
> Also, because during the test we will access a resource (DB) that will keep living, we need to tell Jest to close itself
> after the test is done, using the `forceExit` option

[{]: <helper> (diffStep 11.8 files="package.json" module="server")

#### [__Server__ Step 11.8: Updating Tests with SQL](https://github.com/Urigo/WhatsApp-Clone-Server/commit/ea0fa2ad6bdcbf38aa3b1aada197b53cf8b5aa3f)

##### Changed package.json
```diff
@@ -9,7 +9,7 @@
 ┊ 9┊ 9┊  "scripts": {
 ┊10┊10┊    "prestart": "yarn codegen",
 ┊11┊11┊    "start": "ts-node index.ts",
-┊12┊  ┊    "test": "jest",
+┊  ┊12┊    "test": "jest --runInBand --forceExit",
 ┊13┊13┊    "codegen": "graphql-codegen",
 ┊14┊14┊    "format": "prettier \"**/*.ts\" --write"
 ┊15┊15┊  },
```

[}]: #

### Remove in-memory database

We can remove all the stuff related to in-memory database now.

[{]: <helper> (diffStep 11.9 files="db" module="server")

#### [__Server__ Step 11.9: Removing in-memory database](https://github.com/Urigo/WhatsApp-Clone-Server/commit/3a461de6ee3f40dcf29b05727326efbfc5bb82e0)

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


TODO:

* SELECT DISTINCT ON (unique for the expression inside, and you can combine a few - as expression)
not with , between them

* Window functions to do accumulative sum


[//]: # (foot-start)

[{]: <helper> (navStep)

| [< Previous Step](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step13.md) | [Next Step >](https://github.com/Urigo/WhatsApp-Clone-Tutorial/tree/master@next/.tortilla/manuals/views/step15.md) |
|:--------------------------------|--------------------------------:|

[}]: #
