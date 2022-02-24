import DiscordHandler from './misc/discordHandler';
import InteractionHandler from './misc/interactionHandler';
import SqlHandler from './misc/sqlHandler';
import dotenv from 'dotenv';
import { LanguageHandler } from './misc/languageHandler';
import { IntervalHandlers } from './misc/intervalHandler';
import GoogleSheetsHandler from './misc/googleSheetsHandler';

// initialize configuration
dotenv.config();

declare global {
  var discordHandler: DiscordHandler;
  var sqlHandler: SqlHandler;
  var languageHandler: LanguageHandler;
  var interactionHandler: InteractionHandler;
  var googleSheetsHandler: GoogleSheetsHandler;
}
global.languageHandler = new LanguageHandler();
global.interactionHandler = new InteractionHandler();
global.discordHandler = new DiscordHandler();
global.sqlHandler = new SqlHandler();
global.googleSheetsHandler = new GoogleSheetsHandler();


discordHandler.client.on('interactionCreate', (interaction)=> global.interactionHandler.handle(interaction));



process.on('uncaughtException', (err: Error) => {
  console.error('Unhandled exception', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection', reason);
});

sqlHandler.initDB().then(async () => {
  await discordHandler.client.login(process.env.DISCORD_TOKEN);
  await interactionHandler.Init();
  console.log('N1ghtmare Signup Bot live!')

  IntervalHandlers.initInterval();
});

