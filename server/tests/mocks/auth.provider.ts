import sql from 'sql-template-strings';
import { Auth } from './../../modules/users/auth.provider';
import usersModule from './../../modules/users';
import { pool } from '../../db';

export function mockAuth(userId: number) {
  class AuthMock extends Auth {
    async currentUser() {
      const { rows } = await pool.query(
        sql`SELECT * FROM users WHERE id = ${userId}`
      );
      return rows[0];
    }
  }

  usersModule.injector.provide({
    provide: Auth,
    useClass: AuthMock,
    overwrite: true,
  });
}
