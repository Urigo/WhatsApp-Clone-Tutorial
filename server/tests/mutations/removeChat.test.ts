import { createTestClient } from 'apollo-server-testing';
import { gql } from 'apollo-server-express';
import { server } from '../../server';
import { resetDb } from '../../db';
import { mockAuth } from '../mocks/auth.provider';

describe('Mutation.removeChat', () => {
  beforeEach(resetDb);

  it('removes chat by id', async () => {
    mockAuth(1);

    const { query, mutate } = createTestClient(server);

    const addChatRes = await mutate({
      variables: { chatId: '1' },
      mutation: gql`
        mutation RemoveChat($chatId: ID!) {
          removeChat(chatId: $chatId)
        }
      `,
    });

    expect(addChatRes.data).toBeDefined();
    expect(addChatRes.errors).toBeUndefined();
    expect(addChatRes.data!.removeChat).toEqual('1');

    const getChatRes = await query({
      variables: { chatId: '1' },
      query: gql`
        query GetChat($chatId: ID!) {
          chat(chatId: $chatId) {
            id
            name
            participants {
              id
            }
          }
        }
      `,
    });

    expect(addChatRes.data).toBeDefined();
    expect(getChatRes.errors).toBeUndefined();
    expect(addChatRes.data!.chat).toBeUndefined();
  });
});
