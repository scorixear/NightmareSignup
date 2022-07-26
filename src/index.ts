import DiscordHandler from './handlers/discordHandler';
import InteractionHandler from './handlers/interactionHandler';
import SqlHandler from './handlers/sqlHandler';
import dotenv from 'dotenv';
import { IntervalHandlers } from './handlers/intervalHandler';
import GoogleSheetsHandler from './handlers/googleSheetsHandler';
import { DefaultMariaDB } from './interfaces/IMariaDb';
import { IGoogleSheetsHandler } from './interfaces/IGoogleSheetsHandler';
import { ISqlHandler} from './interfaces/ISqlHandler';
import { IDiscordHandler } from './interfaces/IDiscordHandler';
import { Logger, WARNINGLEVEL } from './helpers/Logger';

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
  Logger.Error('Uncaught Exception', err, WARNINGLEVEL.ERROR);
});
process.on('unhandledRejection', (reason) => {
  Logger.Error('Unhandled Rejection', reason, WARNINGLEVEL.ERROR);
});

sqlHandler.initDB().then(async () => {
  await discordHandler.login(process.env.DISCORD_TOKEN);
  await interactionHandler.Init();
  Logger.Log('Bot is ready', WARNINGLEVEL.INFO);

  IntervalHandlers.initInterval();
});

