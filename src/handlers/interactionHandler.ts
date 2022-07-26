import { ButtonInteraction, ChatInputCommandInteraction, Interaction } from 'discord.js';

import { ButtonInteractionHandle } from '../model/ButtonInteractionHandle';
import CommandInteractionHandle from '../model/commands/CommandInteractionHandle';
import ChatInputCommandInteractionHandle from '../model/commands/ChatInputCommandInteractionHandle';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import Deletesignup from '../commands/Moderation/deletesignup';
import Unavailable from '../commands/Moderation/unavailable';
import SignupCommand from '../commands/Moderation/signup';
import Help from '../commands/Misc/help';
import signup from '../interactions/signup';
import TwoWayMap from '../model/TwoWayMap';
import FormParties from '../commands/Moderation/formParties';
import AddRole from '../commands/RoleManagement/addRole';
import CheckRoles from '../commands/RoleManagement/checkRoles';
import ClearRoles from '../commands/RoleManagement/clearRoles';
import RemoveRole from '../commands/RoleManagement/removeRole';
import { IGoogleSheetsHandler } from '../interfaces/IGoogleSheetsHandler';
import CountPlayers from '../commands/Moderation/countPlayers';
import CountRoles from '../commands/Moderation/countRoles';
import CheckAttendance from '../commands/RoleManagement/checkAttendance';
import StartVacation from '../commands/RoleManagement/startVacation';
import EndVacation from '../commands/RoleManagement/endVacation';
import RemoveVacation from '../commands/RoleManagement/removeVacation';
import CheckVacation from '../commands/RoleManagement/checkVacation';
import OptimalParty from '../commands/Moderation/optimalParty';
import { Logger, WARNINGLEVEL } from '../helpers/Logger';


export default class InteractionHandler {
  public buttonInteractions: TwoWayMap<string, ButtonInteractionHandle>;
  private commandInteractions: CommandInteractionHandle[];
  constructor(googleSheetsHandler: IGoogleSheetsHandler) {
    this.buttonInteractions = new TwoWayMap(new Map([
      ['signup-1', new signup.SignupEvent('signup-1')],
      ['signout-1', new signup.SignoutEvent('signout-1')],
      ['unavailable', new signup.UnavailableEvent('unavailable')]
    ]));

    const help = new Help();
    this.commandInteractions = [
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
      help,
    ];
    help.init(this.commandInteractions);
  }

  public async Init() {
    for(const interaction of this.commandInteractions) {
      if (interaction.Ready) {
        await interaction.Ready;
      }
    }
    const commands = this.commandInteractions.map(command => command.slashCommandBuilder.toJSON());
    const rest = new REST( {version: '10'}).setToken(process.env.DISCORD_TOKEN);

    global.discordHandler.getGuilds().forEach(async guild=> {
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENTID, guild.id), {body: commands})
      Logger.Log("Successfully registered application commands for guild", WARNINGLEVEL.INFO, guild.name);
      /*const guildRoles = await global.discordHandler.getRolesOfGuild(guild);
      const guildCommands = await guild.commands.fetch();
      const signupRoles = guildRoles.filter(role => config.signupRoles.includes(role.name));
      const permissionsObject: ApplicationCommandPermissionData[] = [];
      signupRoles.forEach(role => permissionsObject.push({
        id: role.id,
        type: 'ROLE',
        permission: true,
      }));
      this.commandInteractions.forEach(interaction => {
        if(interaction.requirePermissions) {
          discordHandler.client
          const applicationCommand = guildCommands.find(appCommand => appCommand.name === interaction.command);
          applicationCommand.permissions.set({

            permissions: permissionsObject,
          });
        }
      })*/
    });


  }

  public async handle(interaction: Interaction) {
    try {
      if (interaction.isButton()) {
        const buttonInteraction: ButtonInteraction = interaction as ButtonInteraction;
        const interactionHandle: ButtonInteractionHandle = this.buttonInteractions.find(id => buttonInteraction.customId.startsWith(id));
        if(interactionHandle) {
          await interactionHandle.handle(buttonInteraction);
        }
      } else if (interaction.isChatInputCommand()) {
        const commandInteraction: ChatInputCommandInteraction = interaction as ChatInputCommandInteraction;
        const handler = this.commandInteractions.find(interactionHandle => interactionHandle instanceof ChatInputCommandInteractionHandle && interactionHandle.command === commandInteraction.commandName);
        if (handler) {
          await (handler as ChatInputCommandInteractionHandle).handle(commandInteraction);
        }
      } else {
        return;
      }
    } catch (err) {
      Logger.Error("Error while handling interaction", err, WARNINGLEVEL.ERROR);
    }

  }
}
