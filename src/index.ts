import DiscordHandler from './misc/discordHandler';
import InteractionHandler from './misc/interactionHandler';
import SqlHandler from './misc/sqlHandler';
import dotenv from 'dotenv';
import { IntervalHandlers } from './misc/intervalHandler';
import GoogleSheetsHandler from './misc/googleSheetsHandler';
import { DefaultMariaDB } from './interfaces/IMariaDb';
import { IGoogleSheetsHandler } from './interfaces/IGoogleSheetsHandler';
import { ISqlHandler} from './interfaces/ISqlHandler';
import { IDiscordHandler } from './interfaces/IDiscordHandler';

// initialize configuration
dotenv.config();

declare global {
  var discordHandler: IDiscordHandler;
  var sqlHandler: ISqlHandler;
  var interactionHandler: InteractionHandler;
  var googleSheetsHandler: IGoogleSheetsHandler;
}
global.googleSheetsHandler = new GoogleSheetsHandler();
global.interactionHandler = new InteractionHandler(global.googleSheetsHandler);
global.discordHandler = new DiscordHandler();
global.sqlHandler = new SqlHandler(new DefaultMariaDB());



discordHandler.on('interactionCreate', (interaction)=> global.interactionHandler.handle(interaction));



process.on('uncaughtException', (err: Error) => {
  console.error('Unhandled exception', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection', reason);
});

sqlHandler.initDB().then(async () => {
  await discordHandler.login(process.env.DISCORD_TOKEN);
  await interactionHandler.Init();
  console.log('N1ghtmare Signup Bot live!')

  IntervalHandlers.initInterval();
});

