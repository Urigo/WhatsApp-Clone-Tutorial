import { Injectable, Inject, ProviderScope } from '@graphql-modules/di';
import { QueryResult } from 'pg';
import sql from 'sql-template-strings';
import DataLoader from 'dataloader';
import format from 'date-fns/format';
import { Database } from '../common/database.provider';
import { PubSub } from '../common/pubsub.provider';
import { Chat } from '../../db';

type ChatsByUser = { userId: string };
type ChatByUser = { userId: string; chatId: string };
type ChatById = { chatId: string };
type ChatsKey = ChatById | ChatByUser | ChatsByUser;

function isChatsByUser(query: any): query is ChatsByUser {
  return query.userId && !query.chatId;
}

function isChatByUser(query: any): query is ChatByUser {
  return query.userId && query.chatId;
}

@Injectable({
  scope: ProviderScope.Session,
})
export class Chats {
  @Inject() private db: Database;
  @Inject() private pubsub: PubSub;

  private chatsCache = new Map<string, Chat>();
  private loaders = {
    chats: new DataLoader<ChatsKey, QueryResult['rows']>(keys => {
      return Promise.all(
        keys.map(async query => {
          if (isChatsByUser(query)) {
            return this._findChatsByUser(query.userId);
          }

          if (this.chatsCache.has(query.chatId)) {
            return [this._readChatFromCache(query.chatId)];
          }

          if (isChatByUser(query)) {
            return this._findChatByUser(query);
          }

          return this._findChatById(query.chatId);
        })
      );
    }),
  };

  async findChatsByUser(userId: string) {
    return this.loaders.chats.load({ userId });
  }

  private async _findChatsByUser(userId: string) {
    const { rows } = await this.db.query(sql`
      SELECT chats.* FROM chats, chats_users
      WHERE chats.id = chats_users.chat_id
      AND chats_users.user_id = ${userId}
    `);

    rows.forEach(row => {
      this._writeChatToCache(row);
    });

    return rows;
  }

  async findChatByUser({ chatId, userId }: { chatId: string; userId: string }) {
    const rows = await this.loaders.chats.load({ chatId, userId });

    return rows[0] || null;
  }

  private async _findChatByUser({
    chatId,
    userId,
  }: {
    chatId: string;
    userId: string;
  }) {
    const { rows } = await this.db.query(sql`
      SELECT chats.* FROM chats, chats_users
      WHERE chats_users.chat_id = ${chatId}
      AND chats.id = chats_users.chat_id
      AND chats_users.user_id = ${userId}
    `);

    this._writeChatToCache(rows[0]);

    return rows;
  }

  async findChatById(chatId: string) {
    const rows = await this.loaders.chats.load({ chatId });
    return rows[0] || null;
  }

  private async _findChatById(chatId: string) {
    const { rows } = await this.db.query(sql`
      SELECT * FROM chats WHERE id = ${chatId}
    `);

    this._writeChatToCache(rows[0]);

    return rows;
  }

  async findMessagesByChat({
    chatId,
    limit,
    after,
  }: {
    chatId: string;
    limit: number;
    after?: number | null;
  }): Promise<{
    hasMore: boolean;
    cursor: number | null;
    messages: any[];
  }> {
    const query = sql`SELECT * FROM messages`;
    query.append(` WHERE chat_id = ${chatId}`);

    if (after) {
      // the created_at is the cursor
      query.append(` AND created_at < ${cursorToDate(after)}`);
    }

    query.append(` ORDER BY created_at DESC LIMIT ${limit}`);

    const { rows: messages } = await this.db.query(query);

    if (!messages) {
      return {
        hasMore: false,
        cursor: null,
        messages: [],
      };
    }

    // so we send them as old -> new
    messages.reverse();

    // cursor is a number representation of created_at
    const cursor = messages.length ? new Date(messages[0].created_at).getTime() : 0;
    const { rows: next } = await this.db.query(
      sql`SELECT * FROM messages WHERE chat_id = ${chatId} AND created_at < ${cursorToDate(
        cursor
      )} ORDER BY created_at DESC LIMIT 1`
    );

    return {
      hasMore: next.length === 1, // means there's no more messages
      cursor,
      messages,
    };
  }

  async lastMessage(chatId: string) {
    const { rows } = await this.db.query(sql`
      SELECT * FROM messages 
      WHERE chat_id = ${chatId} 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    return rows[0];
  }

  async firstRecipient({ chatId, userId }: { chatId: string; userId: string }) {
    const { rows } = await this.db.query(sql`
      SELECT users.* FROM users, chats_users
      WHERE users.id != ${userId}
      AND users.id = chats_users.user_id
      AND chats_users.chat_id = ${chatId}
    `);

    return rows[0] || null;
  }

  async participants(chatId: string) {
    const { rows } = await this.db.query(sql`
      SELECT users.* FROM users, chats_users
      WHERE chats_users.chat_id = ${chatId}
      AND chats_users.user_id = users.id
    `);

    return rows;
  }

  async isParticipant({ chatId, userId }: { chatId: string; userId: string }) {
    const { rows } = await this.db.query(sql`
      SELECT * FROM chats_users 
      WHERE chat_id = ${chatId} 
      AND user_id = ${userId}
    `);

    return !!rows.length;
  }

  async addMessage({
    chatId,
    userId,
    content,
  }: {
    chatId: string;
    userId: string;
    content: string;
  }) {
    const { rows } = await this.db.query(sql`
      INSERT INTO messages(chat_id, sender_user_id, content)
      VALUES(${chatId}, ${userId}, ${content})
      RETURNING *
    `);

    const messageAdded = rows[0];

    this.pubsub.publish('messageAdded', {
      messageAdded,
    });

    return messageAdded;
  }

  async addChat({
    userId,
    recipientId,
  }: {
    userId: string;
    recipientId: string;
  }) {
    const { rows } = await this.db.query(sql`
      SELECT chats.* FROM chats, (SELECT * FROM chats_users WHERE user_id = ${userId}) AS chats_of_current_user, chats_users
      WHERE chats_users.chat_id = chats_of_current_user.chat_id
      AND chats.id = chats_users.chat_id
      AND chats_users.user_id = ${recipientId}
    `);

    // If there is already a chat between these two users, return it
    if (rows[0]) {
      return rows[0];
    }

    try {
      await this.db.query('BEGIN');

      const { rows } = await this.db.query(sql`
        INSERT INTO chats
        DEFAULT VALUES
        RETURNING *
      `);

      const chatAdded = rows[0];

      await this.db.query(sql`
        INSERT INTO chats_users(chat_id, user_id)
        VALUES(${chatAdded.id}, ${userId})
      `);

      await this.db.query(sql`
        INSERT INTO chats_users(chat_id, user_id)
        VALUES(${chatAdded.id}, ${recipientId})
      `);

      await this.db.query('COMMIT');

      this.pubsub.publish('chatAdded', {
        chatAdded,
      });

      return chatAdded;
    } catch (e) {
      await this.db.query('ROLLBACK');
      throw e;
    }
  }

  async removeChat({ chatId, userId }: { chatId: string; userId: string }) {
    try {
      await this.db.query('BEGIN');

      const { rows } = await this.db.query(sql`
        SELECT chats.* FROM chats, chats_users
        WHERE id = ${chatId}
        AND chats.id = chats_users.chat_id
        AND chats_users.user_id = ${userId}
      `);

      const chat = rows[0];

      if (!chat) {
        await this.db.query('ROLLBACK');
        return null;
      }

      await this.db.query(sql`
        DELETE FROM chats WHERE chats.id = ${chatId}
      `);

      this.pubsub.publish('chatRemoved', {
        chatRemoved: chat.id,
        targetChat: chat,
      });

      await this.db.query('COMMIT');

      return chatId;
    } catch (e) {
      await this.db.query('ROLLBACK');
      throw e;
    }
  }

  private _readChatFromCache(chatId: string) {
    return this.chatsCache.get(chatId);
  }

  private _writeChatToCache(chat?: Chat) {
    if (chat) {
      this.chatsCache.set(chat.id, chat);
    }
  }
}

function cursorToDate(cursor: number) {
  return `'${format(cursor, 'YYYY-MM-DD HH:mm:ss')}'`;
}
