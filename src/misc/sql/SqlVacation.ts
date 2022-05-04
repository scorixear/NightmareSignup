import { IPool } from "../../interfaces/IMariaDb";

export default class SqlVacation {
  private pool: IPool;
  constructor(pool: IPool) {
    this.pool = pool;
  }

  public async getVacation(userId: string): Promise<[begin: number, end: number][]> {
    let conn;
    let returnValue: [number, number][] = [];
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT begin, end FROM vacation WHERE userId = ${conn.escape(userId)}`);
      if (rows) {
        for (const row of rows) {
          returnValue.push([row.begin, row.end]);
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

  public async setVacation(userId: string, begin: number, end: number): Promise<boolean> {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`INSERT INTO vacation (userId, begin, end) VALUES (${conn.escape(userId)}, ${conn.escape(begin)}, ${conn.escape(end)})`);
      returnValue = true;
    } catch (err) {
      returnValue = false;
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async updateVacation(userId: string, end: number): Promise<boolean> {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`UPDATE vacation SET end = ${conn.escape(end)} WHERE userId = ${conn.escape(userId)} AND begin = (SELECT Max(begin) FROM vacation WHERE userId = ${conn.escape(userId)})`);
      returnValue = true;
    } catch (err) {
      returnValue = false;
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async removeVacation(userId: string, restriction?: [begin: number, end: number]): Promise<boolean> {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      if (restriction) {
        await conn.query(`DELETE FROM vacation WHERE userId = ${conn.escape(userId)} AND begin = ${conn.escape(restriction[0])} AND end = ${conn.escape(restriction[1])}`);
      } else {
        await conn.query(`DELETE FROM vacation WHERE userId = ${conn.escape(userId)} AND begin = (SELECT Max(begin) FROM vacation WHERE userId = ${conn.escape(userId)})`);
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

  public async clearVacation(userId: string): Promise<boolean> {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`DELETE FROM vacation WHERE userId = ${conn.escape(userId)}`);
      returnValue = true;
    } catch (err) {
      returnValue = false;
      // console.error(err);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }
}