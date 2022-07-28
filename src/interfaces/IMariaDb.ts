import mariadb from 'mariadb';
export interface IMariaDB {
  createPool(config: {
    host: string;
    user: string;
    password: string;
    port: number;
    database: string;
    multipleStatements: boolean;
    connectionLimit: number;
  }): IPool;
}

export interface IPool {
  getConnection(): Promise<IConnection>;
}

export interface IConnection {
  query(sql: string, values?: any): Promise<any>;
  end(): Promise<void>;
  escape(value: any): string;
}

export class DefaultMariaDB implements IMariaDB {
  public createPool(config: {
    host: string;
    user: string;
    password: string;
    port: number;
    database: string;
    multipleStatements: boolean;
    connectionLimit: number;
  }): IPool {
    return new DefaultPool(mariadb.createPool(config));
  }
}

export class DefaultPool implements IPool {
  private pool: mariadb.Pool;
  constructor(pool: mariadb.Pool) {
    this.pool = pool;
  }
  public async getConnection(): Promise<IConnection> {
    return new DefaultConnection(await this.pool.getConnection());
  }
}

export class DefaultConnection implements IConnection {
  private connection: mariadb.Connection;
  constructor(connection: mariadb.Connection) {
    this.connection = connection;
  }
  public query(sql: string, values?: any): Promise<any> {
    return this.connection.query(sql, values);
  }
  public end(): Promise<void> {
    return this.connection.end();
  }
  public escape(value: any): string {
    return this.connection.escape(value);
  }
}
