import {ChatInputCommandInteraction, CommandInteraction, SlashCommandStringOption, SlashCommandUserOption} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import ChatInputCommandInteractionHandle from '../../model/commands/ChatInputCommandInteractionHandle';
import { LanguageHandler } from '../../misc/LanguageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';
import { IGoogleSheetsHandler } from '../../interfaces/IGoogleSheetsHandler';
import PartyHandler from '../../misc/partyHandler';
import dateHandler from '../../misc/dateHandler';

declare const sqlHandler: ISqlHandler;

export default class AddRole extends ChatInputCommandInteractionHandle {
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
      } catch {
        console.error("Couldn't add role to user");
      }
    } else {
      console.error("Couldn't find member or role");
    }
    await interaction.followUp(await messageHandler.getRichTextInteraction({
      interaction,
      title: LanguageHandler.language.commands.roles.add.error.discord,
      description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.add.error.discorddesc, ['<@' + user.id + '>']),
      color: 0xcc0000,
    }));
  }
}