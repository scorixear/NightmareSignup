import { IPool } from "../../interfaces/IMariaDb";
import { Logger, WARNINGLEVEL } from "../../helpers/logger";

export default class SqlEvent {
  private pool: IPool;
  constructor(pool: IPool) {
    this.pool = pool;
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
      Logger.Error("SQL: Couldn't create event", err, WARNINGLEVEL.WARN);
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
      Logger.Error("SQL: Couldn't delete event", err, WARNINGLEVEL.WARN);
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
      Logger.Error("SQL: Couldn't retrieve event", err, WARNINGLEVEL.WARN);
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
      Logger.Error("SQL: Couldn't find events", err, WARNINGLEVEL.WARN);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }

  public async findEventObjects(timestamp: string): Promise<{ id: number; date: number; }[]> {
    let conn;
    let returnValue: { id: number; date: number; }[] = [];
    try {
      conn = await this.pool.getConnection();

      const rows = await conn.query(`SELECT id, date FROM events WHERE date < ${conn.escape(timestamp)} AND is_closed = 1 AND is_formed = 1 AND is_cta = 1`);
      if (rows) {
        for (const row of rows) {
          returnValue.push({id: row.id, date: row.date});
        }
      }
    } catch (err) {
      returnValue = [];
      Logger.Error("SQL: Couldn't find events (objects)", err, WARNINGLEVEL.WARN);
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
      Logger.Error("SQL: Couldn't update event", err, WARNINGLEVEL.WARN);
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
      Logger.Error("SQL: Couldn't retrieve events", err, WARNINGLEVEL.WARN);
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
      Logger.Error("SQL: Couldn't retrieve event (CTA-check)", err, WARNINGLEVEL.WARN);
    } finally {
      if (conn) await conn.end();
    }
    return returnValue;
  }
}