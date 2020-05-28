import { GraphQLModule } from '@graphql-modules/core';
import { ProviderScope } from '@graphql-modules/di';
import { gql } from 'apollo-server-express';
import { DateTimeResolver, URLResolver } from 'graphql-scalars';
import { Pool } from 'pg';
import { pool } from '../../db';
import { Resolvers } from '../../types/graphql';
import { Database } from './database.provider';
import { PubSub } from './pubsub.provider';

const { PostgresPubSub } = require('graphql-postgres-subscriptions');

const typeDefs = gql`
  scalar DateTime
  scalar URL

  type Query {
    _dummy: Boolean
  }

  type Mutation {
    _dummy: Boolean
  }

  type Subscription {
    _dummy: Boolean
  }
`;

const resolvers: Resolvers = {
  DateTime: DateTimeResolver,
  URL: URLResolver,
};

const pubsub = new PostgresPubSub({
  host: 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  user: 'testuser',
  password: 'testpassword',
  database: 'whatsapp',
});

export default new GraphQLModule({
  name: 'common',
  typeDefs,
  resolvers,
  providers: () => [
    {
      provide: Pool,
      useValue: pool,
    },
    {
      provide: PubSub,
      scope: ProviderScope.Application,
      useValue: pubsub,
    },
    Database,
  ],
});
