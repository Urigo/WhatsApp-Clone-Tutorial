import { createTestClient } from 'apollo-server-testing';
import { gql } from 'apollo-server-express';
import { server } from '../../server';
import { resetDb } from '../../db';
import { mockAuth } from '../mocks/auth.provider';

describe('Mutation.addChat', () => {
  beforeEach(resetDb);

  it('creates a new chat between current user and specified recipient', async () => {
    mockAuth(2);

    const { query, mutate } = createTestClient(server);

    const addChatRes = await mutate({
      variables: { recipientId: '3' },
      mutation: gql`
        mutation AddChat($recipientId: ID!) {
          addChat(recipientId: $recipientId) {
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
    expect(addChatRes.errors).toBeUndefined();
    expect(addChatRes.data).toMatchSnapshot();

    const getChatRes = await query({
      variables: { chatId: '5' },
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

    expect(getChatRes.data).toBeDefined();
    expect(getChatRes.errors).toBeUndefined();
    expect(getChatRes.data).toMatchSnapshot();
  });

  it('returns the existing chat if so', async () => {
    mockAuth(1);

    const { query, mutate } = createTestClient(server);

    const addChatRes = await mutate({
      variables: { recipientId: '2' },
      mutation: gql`
        mutation AddChat($recipientId: ID!) {
          addChat(recipientId: $recipientId) {
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
    expect(addChatRes.errors).toBeUndefined();
    expect(addChatRes.data).toMatchSnapshot();
  });
});
