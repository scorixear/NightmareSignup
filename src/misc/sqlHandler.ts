import { IMariaDB, IPool} from '../interfaces/IMariaDb';
import { ISqlHandler } from '../interfaces/ISqlHandler';

export default class SqlHandler implements ISqlHandler {
  private pool: IPool;
  constructor(mariadb: IMariaDB) {
    this.pool = mariadb.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT, 10),
      database: process.env.DB_DATABASE,
      multipleStatements: true,
      connectionLimit: 5,
    });
  }

  /**
   * Initializes the DataBase
   */
  public async initDB() {
    let conn;
    try {
      conn = await this.pool.getConnection();
      console.log('DB Connection established');
      await conn.query('CREATE TABLE IF NOT EXISTS `signup` (`event` INT, `userid` VARCHAR(255), `date` BIGINT, PRIMARY KEY (`event`,`userid`))');
      await conn.query('CREATE TABLE IF NOT EXISTS `events` (`id` INT NOT NULL AUTO_INCREMENT, `name` VARCHAR(255), `date` BIGINT, `is_closed` BIT DEFAULT 0, `is_formed` BIT DEFAULT 0, `is_cta` BIT DEFAULT 1, PRIMARY KEY(`id`), CONSTRAINT UC_CTA UNIQUE (name,date))');
      await conn.query('CREATE TABLE IF NOT EXISTS `discordEventMessages` (`eventId` INT, `messageId` VARCHAR(255), `channelId` VARCHAR(255), `guildId` VARCHAR(255), PRIMARY KEY(`eventId`))');
      await conn.query('CREATE TABLE IF NOT EXISTS `unavailable` (`eventId` INT, `userId` VARCHAR(255), PRIMARY KEY (`eventId`,`userId`))');
      await conn.query('CREATE TABLE IF NOT EXISTS `users` (`userId` VARCHAR(255), `role` VARCHAR(255), PRIMARY KEY(`userId`,`role`))');
    } catch (error) {
      throw error;
    } finally {
      if (conn) conn.end();
    }
  }

  public async isSignedIn(event: number, userid: string) {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT event FROM signup WHERE \`event\` = ${conn.escape(event)} AND \`userid\` = ${conn.escape(userid)}`);
      if (rows && rows[0]) {
        returnValue = true;
      }
    } catch (err) {
      returnValue = false;
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async signIn(event: number, userid: string, date: number) {
    let conn;
    let returnValue = true;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT event FROM signup WHERE \`event\` = ${conn.escape(event)} AND \`userid\` = ${conn.escape(userid)}`);
      if (!rows || !rows[0]) {
        await conn.query(`INSERT INTO signup (event, userid, date) VALUES (${conn.escape(event)}, ${conn.escape(userid)}, ${conn.escape(date)})`);
      } else {
        throw new Error('already signed in');
      }
    } catch (err) {
      returnValue=false;
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async signOut(event: number, userid: string) {
    let conn;
    let returnValue = true;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT event FROM signup WHERE \`event\` = ${conn.escape(event)} AND \`userid\` = ${conn.escape(userid)}`);
      if (rows && rows[0]) {
        await conn.query(`DELETE FROM signup WHERE \`event\` = ${conn.escape(event)} AND \`userid\` = ${conn.escape(userid)}`);
      } else {
        throw new Error('already signed out');
      }
    } catch (err) {
      returnValue=false;
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async getSignups(eventId: number) {
    let conn;
    let returnValue: {userId: string, date: number}[] = [];
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT userid, date FROM signup WHERE event = ${conn.escape(eventId)}`);
      if (rows) {
        for (const row of rows) {
          returnValue.push({userId: row.userid, date: row.date});
        }
      }
    } catch (err) {
      returnValue = [];
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async createEvent(eventName: string, eventDate: string, isCta: boolean) {
    let conn;
    let returnValue = -1;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`INSERT INTO events (name, date, is_cta) VALUES (${conn.escape(eventName)}, ${conn.escape(eventDate)}, ${isCta?"1":"0"})`);
      const rows = await conn.query(`SELECT id FROM events WHERE name = ${conn.escape(eventName)} AND date = ${conn.escape(eventDate)}`);
      if (rows && rows[0]) {
        returnValue = rows[0].id;
      }
    } catch (err) {
      returnValue = -1;
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async deleteEvent(eventName: string, eventDate: string) {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT id FROM events WHERE name = ${conn.escape(eventName)} AND date = ${conn.escape(eventDate)}`);
      if (rows && rows[0]) {
        await conn.query(`DELETE FROM events WHERE id = ${conn.escape(rows[0].id)}`);
        await conn.query(`DELETE FROM signup WHERE event = ${conn.escape(rows[0].id)}`);
        await conn.query(`DELETE FROM discordEventMessages WHERE eventId = ${conn.escape(rows[0].id)}`);
        await conn.query(`DELETE FROM unavailable WHERE eventId = ${conn.escape(rows[0].id)}`);
        returnValue = true;
      }
    } catch (err) {
      returnValue = false;
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async getEventId(eventName: string, eventDate: string) {
    let conn;
    let returnValue: number;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT id FROM events WHERE name = ${conn.escape(eventName)} AND date = ${conn.escape(eventDate)}`);
      if (rows && rows[0]) {
        returnValue = rows[0].id;
      }
    } catch (err) {
      returnValue = undefined;
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async findEvents(timestamp: string, isClosed: boolean, isFormed: boolean, isCta: boolean) {
    let conn;
    let returnValue: number[] = [];
    try {
      conn = await this.pool.getConnection();

      const rows = await conn.query(`SELECT id FROM events WHERE date < ${conn.escape(timestamp)}${isClosed !== undefined?` AND is_closed = ${isClosed?"1":"0"}`:""}${isFormed !== undefined?` AND is_formed = ${isFormed?"1":"0"}`:""}${isCta!==undefined?` AND is_cta = ${isCta?"1":"0"}`:""}`);
      if (rows) {
        for (const row of rows) {
          returnValue.push(row.id);
        }
      }
    } catch (err) {
      returnValue = [];
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async updateEventFlags(eventId: number, isClosed: boolean, isFormed: boolean, isCta: boolean) {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      if(isClosed !== undefined) {
        await conn.query(`UPDATE events SET is_closed = ${isClosed?"1":"0"} WHERE id = ${conn.escape(eventId)}`);
      }
      if(isFormed !== undefined) {
        await conn.query(`UPDATE events SET is_formed = ${isFormed?"1":"0"} WHERE id = ${conn.escape(eventId)}`);
      }
      if(isCta !== undefined) {
        await conn.query(`UPDATE events SET is_cta = ${isCta?"1":"0"} WHERE id = ${conn.escape(eventId)}`);
      }
      returnValue = true;
    } catch (err) {
      returnValue = false;
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async getEvents(includeClosed: boolean) {
    let conn;
    let returnValue: {name: string, date: string}[] = [];
    try {
      conn = await this.pool.getConnection();
      let rows;
      if (includeClosed) {
        rows = await conn.query(`SELECT name, date FROM events`);
      } else {
        rows = await conn.query(`SELECT name, date FROM events WHERE is_closed = 0`);
      }
      if (rows) {
        for (const row of rows) {
          returnValue.push({name: row.name, date: row.date});
        }
      }
    } catch (err) {
      returnValue = [];
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async isCtaEvent(eventId: number) {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT is_cta FROM events WHERE id = ${conn.escape(eventId)}`);
      if(rows && rows[0]) {
        returnValue = rows[0].is_cta[0] === 1;
      }
    } catch (err) {
      returnValue = false;
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
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
      // console.error(err);
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
      // console.error(err);
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
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async isUnavailable(eventId: number, userId: string) {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT eventId FROM unavailable WHERE eventId = ${conn.escape(eventId)} AND userId = ${conn.escape(userId)}`);
      if (rows && rows[0]) {
        returnValue = true;
      }
    } catch (err) {
      returnValue = false;
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async setUnavailable(eventId: number, userId: string) {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`INSERT INTO unavailable (eventId, userId) VALUES(${conn.escape(eventId)}, ${conn.escape(userId)})`);
      returnValue = true;
    } catch (err) {
      returnValue = false;
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async removeUnavailable(eventId: number, userId: string) {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`DELETE FROM unavailable WHERE eventId = ${conn.escape(eventId)} AND userId = ${conn.escape(userId)}`);
      returnValue = true;
    } catch (err) {
      returnValue = false;
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async getUnavailables(eventId: number) {
    let conn;
    let returnValue: string[] = [];
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT userId FROM unavailable WHERE eventId = ${conn.escape(eventId)}`);
      if (rows) {
        for (const row of rows) {
          returnValue.push(row.userId);
        }
      }
    } catch (err) {
      returnValue = [];
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async addRole(userId: string, role: string): Promise<boolean> {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`INSERT INTO users (userId, role) VALUES (${conn.escape(userId)}, ${conn.escape(role)})`);
      returnValue = true;
    } catch (err) {
      returnValue = false;
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async removeRole(userId: string, role: string): Promise<boolean> {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`DELETE FROM users WHERE userId = ${conn.escape(userId)} AND role = ${conn.escape(role)}`);
      returnValue = true;
    } catch (err) {
      returnValue = false;
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }
  public async getRoles(userId: string): Promise<string[]> {
    let conn;
    let returnValue: string[] = [];
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT role FROM users WHERE userId = ${conn.escape(userId)}`);
      if (rows) {
        for (const row of rows) {
          returnValue.push(row.role);
        }
      }
    } catch (err) {
      returnValue = [];
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }
  public async clearRoles(userId: string) {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`DELETE FROM users WHERE userId = ${conn.escape(userId)}`);
      returnValue = true;
    } catch (err) {
      returnValue = false;
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }
  public async getUsers() {
    let conn;
    let returnValue: string[] = [];
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT userId FROM users`);
      if (rows) {
        for (const row of rows) {
          returnValue.push(row.userId);
        }
      }
    } catch (err) {
      returnValue = [];
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }
}