import {CommandInteraction} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import { SlashCommandStringOption, SlashCommandUserOption } from '@discordjs/builders';
import { LanguageHandler } from '../../misc/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';
import { IGoogleSheetsHandler } from '../../interfaces/IGoogleSheetsHandler';
import PartyHandler from '../../misc/partyHandler';
import dateHandler from '../../misc/dateHandler';

declare const languageHandler: LanguageHandler;
declare const sqlHandler: ISqlHandler;

export default class AddRole extends CommandInteractionHandle {
   constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(new SlashCommandUserOption().setName('user').setDescription(languageHandler.language.commands.roles.options.user).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('zvzrole').setDescription(languageHandler.language.commands.roles.options.zvzrole).setRequired(true));
    super(
      'addrole',
      ()=>languageHandler.replaceArgs(languageHandler.language.commands.roles.add.description, [config.botPrefix]),
      'addrole @Scorix Camlann\naddrole @Scorix Camlann,Grovekeeper',
      'RoleManagement',
      'addrole <user> <zvzrole[s]>',
      commandOptions,
      true,
    );
  }

  override async handle(interaction: CommandInteraction) {
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
    let react = true;
    if(!PartyHandler.Roles) {
      react = false;
      interaction.deferReply();
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
      if (react) {
        await interaction.reply(await messageHandler.getRichTextExplicitDefault({
          guild: interaction.guild,
          author: interaction.user,
          title: languageHandler.language.commands.roles.add.error.role_title,
          description: languageHandler.replaceArgs(languageHandler.language.commands.roles.add.error.role_desc, ["- "+ nonExistent.join("\n- ")]),
          color: 0xcc0000,
        }));
      } else {
        await messageHandler.sendRichTextDefaultExplicit({
          guild,
          channel,
          author,
          title: languageHandler.language.commands.roles.add.error.role_title,
          description: languageHandler.replaceArgs(languageHandler.language.commands.roles.add.error.role_desc, ["- " + nonExistent.join("\n- ")]),
          color: 0xcc0000,
        });
      }
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
    try {
      await interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild,
        author,
        title: languageHandler.language.commands.roles.add.title,
        description: languageHandler.replaceArgs(languageHandler.language.commands.roles.add.successdesc, ['<@' + user.id + '>']),
        categories: [
          {
            title: languageHandler.language.commands.roles.add.success.added,
            text: '- '+addedRoles.join('\n- '),
          },
          {
            title: languageHandler.language.commands.roles.add.success.ignored,
            text: '- '+ignoredRoles.join('\n- '),
          },
        ],
      }));
    } catch {
      await messageHandler.sendRichTextDefaultExplicit({
        guild: interaction.guild,
        channel: interaction.channel,
        author: interaction.user,
        title: languageHandler.language.commands.roles.add.title,
        description: languageHandler.replaceArgs(languageHandler.language.commands.roles.add.successdesc, ['<@' + user.id + '>']),
        categories: [
          {
            title: languageHandler.language.commands.roles.add.success.added,
            text: '- '+addedRoles.join('\n- '),
          },
          {
            title: languageHandler.language.commands.roles.add.success.ignored,
            text: '- '+ignoredRoles.join('\n- '),
          },
        ],
      });
    }
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
    await messageHandler.sendRichTextDefaultExplicit({
      guild,
      channel,
      author,
      title: languageHandler.language.commands.roles.add.error.discord,
      description: languageHandler.replaceArgs(languageHandler.language.commands.roles.add.error.discorddesc, ['<@' + user.id + '>']),
      color: 0xcc0000,
    });
  }
}