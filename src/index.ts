/* eslint-disable no-var */
import SqlHandler from './handlers/sqlHandler';
import dotenv from 'dotenv';
import { IntervalHandlers } from './handlers/intervalHandler';
import GoogleSheetsHandler from './handlers/googleSheetsHandler';
import { DefaultMariaDB } from './interfaces/IMariaDb';
import { IGoogleSheetsHandler } from './interfaces/IGoogleSheetsHandler';
import { ISqlHandler } from './interfaces/ISqlHandler';
import {
  ButtonInteractionModel,
  DiscordHandler,
  InteractionHandler,
  Logger,
  TwoWayMap,
  WARNINGLEVEL
} from 'discord.ts-architecture';
import { GatewayIntentBits, Partials } from 'discord.js';
import Help from './commands/Misc/help';
import SignupCommand from './commands/Moderation/signup';
import Deletesignup from './commands/Moderation/deletesignup';
import CountPlayers from './commands/Moderation/countPlayers';
import CountRoles from './commands/Moderation/countRoles';
import FormParties from './commands/Moderation/formParties';
import OptimalParty from './commands/Moderation/optimalParty';
import Unavailable from './commands/Moderation/unavailable';
import AddRole from './commands/RoleManagement/addRole';
import CheckAttendance from './commands/RoleManagement/checkAttendance';
import CheckRoles from './commands/RoleManagement/checkRoles';
import CheckVacation from './commands/RoleManagement/checkVacation';
import ClearRoles from './commands/RoleManagement/clearRoles';
import EndVacation from './commands/RoleManagement/endVacation';
import RemoveRole from './commands/RoleManagement/removeRole';
import RemoveVacation from './commands/RoleManagement/removeVacation';
import StartVacation from './commands/RoleManagement/startVacation';
import signup from './interactions/signup';

// initialize configuration
dotenv.config();

declare global {
  var discordHandler: DiscordHandler;
  var sqlHandler: ISqlHandler;
  var interactionHandler: InteractionHandler;
  var googleSheetsHandler: IGoogleSheetsHandler;
}
global.googleSheetsHandler = new GoogleSheetsHandler();
const help = new Help();
const commandInteractions = [
  new SignupCommand(),
  new Deletesignup(),
  new Unavailable(),
  new FormParties(),
  new AddRole(),
  new CheckRoles(),
  new ClearRoles(),
  new RemoveRole(),
  new CountPlayers(),
  new CountRoles(),
  new CheckAttendance(),
  new StartVacation(),
  new EndVacation(),
  new RemoveVacation(),
  new CheckVacation(),
  new OptimalParty(),
  help
];
global.interactionHandler = new InteractionHandler(
  new TwoWayMap(
    new Map<string, ButtonInteractionModel>([
      ['signup-1', new signup.SignupEvent('signup-1')],
      ['signout-1', new signup.SignoutEvent('signout-1')],
      ['unavailable', new signup.UnavailableEvent('unavailable')]
    ])
  ),
  commandInteractions,
  () => {
    help.init(commandInteractions);
  }
);
global.discordHandler = new DiscordHandler(
  [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
  [
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.Guilds
  ]
);
global.sqlHandler = new SqlHandler(new DefaultMariaDB());

discordHandler.on('interactionCreate', (interaction) => global.interactionHandler.handle(interaction));

process.on('uncaughtException', (err: Error) => {
  Logger.exception('Uncaught Exception', err, WARNINGLEVEL.ERROR);
});
process.on('unhandledRejection', (reason) => {
  Logger.exception('Unhandled Rejection', reason, WARNINGLEVEL.ERROR);
});

sqlHandler.initDB().then(async () => {
  await discordHandler.login(process.env.DISCORD_TOKEN);
  await interactionHandler.init(process.env.DISCORD_TOKEN, process.env.CLIENTID, discordHandler);
  Logger.info('Bot is ready');

  IntervalHandlers.initInterval();
});
