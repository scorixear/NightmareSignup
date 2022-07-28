import { Logger } from 'discord.ts-architecture';
import { IMariaDB, IPool } from '../interfaces/IMariaDb';
import { ISqlHandler } from '../interfaces/ISqlHandler';
import SqlDiscord from './sql/SqlDiscord';
import SqlEvent from './sql/SqlEvent';
import SqlRole from './sql/SqlRole';
import SqlSignup from './sql/SqlSignup';
import SqlUnavailable from './sql/SqlUnavailable';
import SqlUser from './sql/SqlUser';
import SqlVacation from './sql/SqlVacation';
export default class SqlHandler implements ISqlHandler {
  private pool: IPool;
  private sqlDiscord: SqlDiscord;
  private sqlEvent: SqlEvent;
  private sqlRole: SqlRole;
  private sqlSignup: SqlSignup;
  private sqlUnavailable: SqlUnavailable;
  private sqlUser: SqlUser;
  private sqlVacation: SqlVacation;
  constructor(mariadb: IMariaDB) {
    this.pool = mariadb.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT, 10),
      database: process.env.DB_DATABASE,
      multipleStatements: true,
      connectionLimit: 5
    });
  }

  /**
   * Initializes the DataBase
   */
  public async initDB() {
    let conn;
    try {
      conn = await this.pool.getConnection();
      Logger.info('Database connected');
      await conn.query(
        'CREATE TABLE IF NOT EXISTS `signup` (`event` INT, `userid` VARCHAR(255), `date` BIGINT, PRIMARY KEY (`event`,`userid`))'
      );
      await conn.query(
        'CREATE TABLE IF NOT EXISTS `events` (`id` INT NOT NULL AUTO_INCREMENT, `name` VARCHAR(255), `date` BIGINT, `is_closed` BIT DEFAULT 0, `is_formed` BIT DEFAULT 0, `is_cta` BIT DEFAULT 1, PRIMARY KEY(`id`), CONSTRAINT UC_CTA UNIQUE (name,date))'
      );
      await conn.query(
        'CREATE TABLE IF NOT EXISTS `discordEventMessages` (`eventId` INT, `messageId` VARCHAR(255), `channelId` VARCHAR(255), `guildId` VARCHAR(255), PRIMARY KEY(`eventId`))'
      );
      await conn.query(
        'CREATE TABLE IF NOT EXISTS `unavailable` (`eventId` INT, `userId` VARCHAR(255), PRIMARY KEY (`eventId`,`userId`))'
      );
      await conn.query(
        'CREATE TABLE IF NOT EXISTS `roles` (`userId` VARCHAR(255), `role` VARCHAR(255), PRIMARY KEY (`userId`, `role`))'
      );
      await conn.query(
        'CREATE TABLE IF NOT EXISTS `users` (`userId` VARCHAR(255), `date` BIGINT, PRIMARY KEY(`userId`))'
      );
      await conn.query(
        'CREATE TABLE IF NOT EXISTS `vacation` (`userId` VARCHAR(255), `begin` BIGINT, `end` BIGINT, PRIMARY KEY(`userId`, `begin`, `end`))'
      );
    } finally {
      if (conn) conn.end();
    }
    this.sqlDiscord = new SqlDiscord(this.pool);
    this.sqlEvent = new SqlEvent(this.pool);
    this.sqlRole = new SqlRole(this.pool);
    this.sqlSignup = new SqlSignup(this.pool);
    this.sqlUnavailable = new SqlUnavailable(this.pool);
    this.sqlUser = new SqlUser(this.pool);
    this.sqlVacation = new SqlVacation(this.pool);
  }

  public getSqlDiscord() {
    return this.sqlDiscord;
  }

  public getSqlEvent() {
    return this.sqlEvent;
  }

  public getSqlRole() {
    return this.sqlRole;
  }

  public getSqlSignup() {
    return this.sqlSignup;
  }

  public getSqlUnavailable() {
    return this.sqlUnavailable;
  }

  public getSqlUser() {
    return this.sqlUser;
  }

  public getSqlVacation() {
    return this.sqlVacation;
  }
}
