import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-express';
import { GraphQLModule } from '@graphql-modules/core';
import cookie from 'cookie';

import usersModule from './modules/users';
import chatsModule from './modules/chats';

export const rootModule = new GraphQLModule({
  name: 'root',
  imports: [usersModule, chatsModule],
});

export const server = new ApolloServer({
  schema: rootModule.schema,
  context: (session: any) => {
    if (session.connection) {
      const req = session.connection.context.session.request;
      const cookies = req.headers.cookie;

      if (cookies) {
        req.cookies = cookie.parse(cookies);
      }
    }

    return rootModule.context(session);
  },
  subscriptions: rootModule.subscriptions,
});
