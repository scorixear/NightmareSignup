import { expect } from "chai";
import PartyHandler from '../src/misc/PartyHandler';
import { TestGoogleSheetsHandler } from './TestGoogleSheetsHandler';
import { TestSqlHandler } from './TestSqlHandler';
import DiscordHandler from '../src/misc/DiscordHandler';
describe('PartyHandler Tests', () => {
  before(()=> {
    global.sqlHandler = new TestSqlHandler();
    global.discordHandler = new DiscordHandler();
    global.googleSheetsHandler = new TestGoogleSheetsHandler();
  });
});