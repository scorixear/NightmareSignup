import { Logger, WARNINGLEVEL } from 'discord.ts-architecture';
import { IPool } from '../../interfaces/IMariaDb';

export default class SqlRole {
  private pool: IPool;
  constructor(pool: IPool) {
    this.pool = pool;
  }

  public async addRole(userId: string, role: string): Promise<boolean> {
    let conn;
    let returnValue = false;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`INSERT INTO roles (userId, role) VALUES (${conn.escape(userId)}, ${conn.escape(role)})`);
      returnValue = true;
    } catch (err) {
      returnValue = false;
      Logger.exception("SQL: Couldn't create role", err, WARNINGLEVEL.WARN);
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
      await conn.query(`DELETE FROM roles WHERE userId = ${conn.escape(userId)} AND role = ${conn.escape(role)}`);
      returnValue = true;
    } catch (err) {
      returnValue = false;
      Logger.exception("SQL: Couldn't remove role", err, WARNINGLEVEL.WARN);
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
      const rows = await conn.query(`SELECT role FROM roles WHERE userId = ${conn.escape(userId)}`);
      if (rows) {
        for (const row of rows) {
          returnValue.push(row.role);
        }
      }
    } catch (err) {
      returnValue = [];
      Logger.exception("SQL: Couldn't retrieve roles", err, WARNINGLEVEL.WARN);
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
      await conn.query(`DELETE FROM roles WHERE userId = ${conn.escape(userId)}`);
      returnValue = true;
    } catch (err) {
      returnValue = false;
      Logger.exception("SQL: Couldn't remove roles", err, WARNINGLEVEL.WARN);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async getUsersWithRoles() {
    let conn;
    let returnValue: { role: string; count: number }[] = [];
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT role,COUNT(*) as count FROM roles GROUP BY role ORDER BY count DESC`);
      for (const row of rows) {
        returnValue.push({ role: row.role, count: row.count });
      }
    } catch (err) {
      returnValue = [];
      Logger.exception("SQL: Couldn't retrieve role (users)", err, WARNINGLEVEL.WARN);
    }
    return returnValue;
  }
}
