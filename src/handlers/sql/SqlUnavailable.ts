import { IPool } from "../../interfaces/IMariaDb";
import { Logger, WARNINGLEVEL } from "../../helpers/Logger";

export default class SqlUnavailable {
  private pool: IPool;
  constructor(pool: IPool) {
    this.pool = pool;
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
      Logger.Error("SQL: Couldn't retrieve unavailable", err, WARNINGLEVEL.WARN);
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
      Logger.Error("SQL: Couldn't create unavailable", err, WARNINGLEVEL.WARN);
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
      Logger.Error("SQL: Couldn't delete unavailable", err, WARNINGLEVEL.WARN);
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
      Logger.Error("SQL: Couldn't retrieve unavailables", err, WARNINGLEVEL.WARN);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async countUnavailable(eventId: number): Promise<number> {
    let conn;
    let returnValue;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT COUNT(*) AS count FROM unavailable WHERE eventId = ${conn.escape(eventId)}`);
      if (rows && rows[0]) {
        returnValue = rows[0].count;
      }
    } catch (err) {
      returnValue = undefined;
      Logger.Error("SQL: Couldn't retrieve unavailables", err, WARNINGLEVEL.WARN);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }
}