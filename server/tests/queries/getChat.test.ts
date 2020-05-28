import { createTestClient } from 'apollo-server-testing';
import { gql } from 'apollo-server-express';
import { server } from '../../server';
import { resetDb } from '../../db';
import { mockAuth } from '../mocks/auth.provider';

describe('Query.chat', () => {
  beforeEach(resetDb);

  it('should fetch specified chat', async () => {
    mockAuth(1);

    const { query } = createTestClient(server);

    const res = await query({
      variables: { chatId: '1' },
      query: gql`
        query GetChat($chatId: ID!) {
          chat(chatId: $chatId) {
            id
            name
            picture
            lastMessage {
              id
              content
              createdAt
            }
          }
        }
      `,
    });

    expect(res.data).toBeDefined();
    expect(res.errors).toBeUndefined();
    expect(res.data).toMatchSnapshot();
  });
});
