import { Injectable, Inject, ProviderScope } from '@graphql-modules/di';
import sql from 'sql-template-strings';
import bcrypt from 'bcrypt';
import { Database } from '../common/database.provider';

@Injectable({
  scope: ProviderScope.Session,
})
export class Users {
  @Inject() private db: Database;

  async findById(userId: string) {
    const db = await this.db.getClient();
    const { rows } = await db.query(
      sql`SELECT * FROM users WHERE id = ${userId}`,
    );

    return rows[0] || null;
  }

  async findAllExcept(userId: string) {
    const db = await this.db.getClient();
    const { rows } = await db.query(
      sql`SELECT * FROM users WHERE id != ${userId}`,
    );

    return rows;
  }

  async findByUsername(username: string) {
    const db = await this.db.getClient();
    const { rows } = await db.query(
      sql`SELECT * FROM users WHERE username = ${username}`,
    );

    return rows[0] || null;
  }

  async newUser({
    username,
    name,
    password,
  }: {
    username: string;
    name: string;
    password: string;
  }) {
    const db = await this.db.getClient();
    const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(8));
    const createdUserQuery = await db.query(sql`
        INSERT INTO users(password, picture, username, name)
        VALUES(${passwordHash}, '', ${username}, ${name})
        RETURNING *
      `);
    const user = createdUserQuery.rows[0];

    return user;
  }
}