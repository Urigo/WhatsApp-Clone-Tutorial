declare module 'apollo-server-testing' {
  import { ApolloServerBase } from 'apollo-server-core';
  import { print, DocumentNode } from 'graphql';
  import { GraphQLResponse } from 'graphql-extensions';

  type StringOrAst = string | DocumentNode;

  // A query must not come with a mutation (and vice versa).
  type Query<TVariables> = {
    query: StringOrAst;
    mutation?: undefined;
    variables?: TVariables;
  };

  type Mutation<TVariables> = {
    mutation: StringOrAst;
    query?: undefined;
    variables?: TVariables;
  };

  export const createTestClient: <TVariables>(
    server: ApolloServerBase
  ) => {
    query: (query: Query<TVariables>) => Promise<GraphQLResponse>;
    mutate: (mutation: Mutation<TVariables>) => Promise<GraphQLResponse>;
  };
}
