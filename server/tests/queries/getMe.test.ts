import { createTestClient } from 'apollo-server-testing';
import { gql } from 'apollo-server-express';
import { server } from '../../server';
import { resetDb } from '../../db';
import { mockAuth } from '../mocks/auth.provider';

describe('Query.me', () => {
  beforeEach(resetDb);

  it('should fetch current user', async () => {
    mockAuth(1);

    const { query } = createTestClient(server);

    const res = await query({
      query: gql`
        query GetMe {
          me {
            id
            name
            picture
          }
        }
      `,
    });

    expect(res.data).toBeDefined();
    expect(res.errors).toBeUndefined();
    expect(res.data).toMatchSnapshot();
  });
});
