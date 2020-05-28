import { Injectable, Inject, ProviderScope } from '@graphql-modules/di';
import sql from 'sql-template-strings';
import bcrypt from 'bcrypt';
import { Database } from '../common/database.provider';

const DEFAULT_PROFILE_PIC = 'https://raw.githubusercontent.com/Urigo/WhatsApp-Clone-Client-React/legacy/public/assets/default-profile-pic.jpg'

@Injectable({
  scope: ProviderScope.Session,
})
export class Users {
  @Inject() private db: Database;

  async findById(userId: string) {
    const { rows } = await this.db.query(
      sql`SELECT * FROM users WHERE id = ${userId}`
    );

    return rows[0] || null;
  }

  async findAllExcept(userId: string) {
    const { rows } = await this.db.query(
      sql`SELECT * FROM users WHERE id != ${userId}`
    );

    return rows;
  }

  async findByUsername(username: string) {
    const { rows } = await this.db.query(
      sql`SELECT * FROM users WHERE username = ${username}`
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
    const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(8));
    const createdUserQuery = await this.db.query(sql`
        INSERT INTO users(password, picture, username, name)
        VALUES(${passwordHash}, ${DEFAULT_PROFILE_PIC}, ${username}, ${name})
        RETURNING *
      `);
    const user = createdUserQuery.rows[0];

    return user;
  }
}
