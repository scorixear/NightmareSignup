import { IPool } from "../../interfaces/IMariaDb";
import { Logger, WARNINGLEVEL } from "../../helpers/logger";

export default class SqlSignup {
  private pool: IPool;
  constructor(pool: IPool) {
    this.pool = pool;
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
      Logger.Error("SQL: Couldn't retrieve signup", err, WARNINGLEVEL.WARN);
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
      Logger.Error("SQL: Couldn't create signup", err, WARNINGLEVEL.WARN);
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
      Logger.Error("SQL: Couldn't delete signup", err, WARNINGLEVEL.WARN);
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
      Logger.Error("SQL: Couldn't retrieve signups", err, WARNINGLEVEL.WARN);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }
}