import { Test } from "mocha";
import { IMariaDB, IPool, IConnection } from "../src/interfaces/IMariaDb";

export class TestMariaDB implements IMariaDB {
  public Pool: TestPool;
  createPool(config: { host: string; user: string; password: string; port: number; database: string; multipleStatements: boolean; connectionLimit: number; }): IPool {
    this.Pool = new TestPool();
    return this.Pool;
  }
}

export class TestPool implements IPool {
  public Connection : TestConnection;
  constructor() {
    this.Connection = new TestConnection();
  }
  public getConnection(): Promise<IConnection> {
    return new Promise((resolve, reject)=>resolve(this.Connection));
  }
}

export class TestConnection implements IConnection {
  public QueryReturn: any;
  public ThrowError: boolean;
  public query(sql: string, values?: any): Promise<any> {
    if(this.ThrowError) {
      throw new Error("Test Error");
    }
    return new Promise((resolve, reject)=>resolve(this.QueryReturn));
  }
  public end(): Promise<void> {
    return new Promise((resolve, reject)=>resolve());
  }
  public escape(value: any): string {
    return value.toString();
  }
}