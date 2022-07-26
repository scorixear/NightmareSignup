import { IPool } from "../../interfaces/IMariaDb";
import { Logger, WARNINGLEVEL } from "../../helpers/Logger";

export default class SqlUser {
  private pool: IPool;
  constructor(pool: IPool) {
    this.pool = pool;
  }

  public async getUsers() {
    let conn;
    let returnValue: {userid: string, register: number}[] = [];
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT userId,date FROM users`);
      if (rows) {
        for (const row of rows) {
          returnValue.push({userid: row.userId, register: row.date});
        }
      }
    } catch (err) {
      returnValue = [];
      Logger.Error("SQL: Couldn't retrieve users", err, WARNINGLEVEL.WARN);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async addUser(userId: string, date: number) {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`INSERT INTO users (userId, date) VALUES (${conn.escape(userId)}, ${conn.escape(date)})`);
      returnValue = true;
    } catch (err) {
      returnValue = false;
      Logger.Error("SQL: Couldn't add user", err, WARNINGLEVEL.WARN);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async getUser(userId: string) {
    let conn;
    let returnValue: number;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT date FROM users WHERE userId = ${conn.escape(userId)}`);
      if (rows && rows[0]) {
        returnValue = rows[0].date;
      }
    } catch (err) {
      returnValue = undefined;
      Logger.Error("SQL: Couldn't retrieve user", err, WARNINGLEVEL.WARN);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async removeUser(userId: string) {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`DELETE FROM users WHERE userId = ${conn.escape(userId)}`);
      returnValue = true;
    } catch (err) {
      returnValue = false;
      Logger.Error("SQL: Couldn't delete user", err, WARNINGLEVEL.WARN);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }


}