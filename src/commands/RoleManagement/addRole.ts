import {ChatInputCommandInteraction, SlashCommandStringOption, SlashCommandUserOption} from 'discord.js';
import messageHandler from '../../handlers/messageHandler';
import config from '../../config';
import CommandInteractionHandle from '../../model/commands/CommandInteractionHandle';
import { LanguageHandler } from '../../handlers/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';
import PartyHandler from '../../handlers/partyHandler';
import dateHandler from '../../handlers/dateHandler';
import { Logger, WARNINGLEVEL } from '../../helpers/Logger';

declare const sqlHandler: ISqlHandler;

export default class AddRole extends CommandInteractionHandle {
   constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(new SlashCommandUserOption().setName('user').setDescription(LanguageHandler.language.commands.roles.options.user).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('zvzrole').setDescription(LanguageHandler.language.commands.roles.options.zvzrole).setRequired(true));
    super(
      'addrole',
      ()=>LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.add.description, [config.botPrefix]),
      'addrole @Scorix Camlann\naddrole @Scorix Camlann,Grovekeeper',
      'RoleManagement',
      'addrole <user> <zvzrole[s]>',
      commandOptions,
      true,
    );
  }

  override async handle(interaction: ChatInputCommandInteraction) {
    try {
      await super.handle(interaction);
    } catch(err) {
      return;
    }
    const user = interaction.options.getUser('user');
    const zvzrole = interaction.options.getString('zvzrole');
    let zvzroles = [];
    if(zvzrole.includes(",")) {
      zvzroles = zvzrole.trim().split(",");
    } else {
      zvzroles.push(zvzrole.trim());
    }
    const guild = interaction.guild;
    const channel = interaction.channel;
    const author = interaction.user;
    const roles = await guild.roles.fetch();
    if(!PartyHandler.Roles) {
      await PartyHandler.updateComposition();
    }
    const nonExistent = [];
    for(const zrole of zvzroles) {
      if (zrole.trim() !== "Battlemount" && PartyHandler.Roles.find(r => r.RoleName === zrole.trim() || r.PriorityRole === zrole.trim()) === undefined) {
        nonExistent.push(zrole.trim());
        break;
      }
    }
    if(nonExistent.length > 0) {
      Logger.Log("AddRole: Could not find roles", WARNINGLEVEL.INFO, nonExistent.join("\n- "));
      await messageHandler.replyRichErrorText({
        interaction,
        title: LanguageHandler.language.commands.roles.add.error.role_title,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.add.error.role_desc, ["- "+ nonExistent.join("\n- ")]),
        color: 0xcc0000,
      });
      return;
    }
    const addedRoles = [];
    const ignoredRoles = [];
    if(!(await sqlHandler.getSqlUser().getUser(user.id))) {
      await sqlHandler.getSqlUser().addUser(user.id, dateHandler.getUTCTimestampFromDate(new Date()));
    }
    for (const zrole of zvzroles) {
      if(await sqlHandler.getSqlRole().addRole(user.id, zrole.trim())) {
        addedRoles.push(zrole.trim());
      } else {
        ignoredRoles.push(zrole.trim());
      }
    }
    await messageHandler.replyRichText({
      interaction,
      title: LanguageHandler.language.commands.roles.add.title,
      description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.add.successdesc, ['<@' + user.id + '>']),
      categories: [
        {
          title: LanguageHandler.language.commands.roles.add.success.added,
          text: '- '+addedRoles.join('\n- '),
        },
        {
          title: LanguageHandler.language.commands.roles.add.success.ignored,
          text: '- '+ignoredRoles.join('\n- '),
        },
      ],
    });
    const member = await discordHandler.fetchMember(user.id, guild);
    const role = roles.find(r => r.name === config.armyRole);
    if (member && role) {
      try {
          await member.roles.add(role.id);
          return;
      } catch(err) {
        Logger.Error("AddRole: Could not add discord role", err, WARNINGLEVEL.WARN);
      }
    } else {
      Logger.Log("AddRole: Could not find discord member or role", WARNINGLEVEL.WARN);
    }
    await interaction.followUp(await messageHandler.getRichTextInteraction({
      interaction,
      title: LanguageHandler.language.commands.roles.add.error.discord,
      description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.add.error.discorddesc, ['<@' + user.id + '>']),
      color: 0xcc0000,
    }));
  }
}