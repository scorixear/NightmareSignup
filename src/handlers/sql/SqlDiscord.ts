import { Logger, WARNINGLEVEL } from "../../helpers/Logger";
import { IPool } from "../../interfaces/IMariaDb";

export default class SqlDiscord {
  private pool: IPool;
  constructor(pool: IPool) {
    this.pool = pool;
  }

  public async createDiscordMessage(eventId: number, messageId: string, channelId: string, guildId: string) {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`INSERT INTO discordEventMessages (eventId, messageId, channelId, guildId) VALUES (${conn.escape(eventId)}, ${conn.escape(messageId)}, ${conn.escape(channelId)}, ${conn.escape(guildId)})`);
      returnValue = true;
    } catch (err) {
      returnValue = false;
      Logger.Error("SQL: Couldn't create discord message", err, WARNINGLEVEL.WARN);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async getDiscordMessage(eventId: number) {
    let conn;
    let returnValue: {guildId?: string, channelId?: string, messageId?: string} = {};
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT guildId, channelId, messageId FROM discordEventMessages WHERE eventId = ${conn.escape(eventId)}`);
      if (rows && rows[0]) {
        returnValue = {
          guildId: rows[0].guildId,
          channelId: rows[0].channelId,
          messageId: rows[0].messageId,
        };
      }
    } catch (err) {
      returnValue = {};
      Logger.Error("SQL: Couldn't retrieve discord message", err, WARNINGLEVEL.WARN);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async removeDiscordMessage(eventId: number, messageId: string, channelId: string, guildId: string) {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`DELETE FROM discordEventMessages WHERE eventId = ${conn.escape(eventId)} AND messageId = ${conn.escape(messageId)} AND channelId = ${conn.escape(channelId)} AND guildId = ${conn.escape(guildId)}`);
      returnValue = true;
    } catch (err) {
      returnValue = false;
      Logger.Error("SQL: Couldn't remove discord message", err, WARNINGLEVEL.WARN);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }
}