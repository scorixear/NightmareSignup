import {CommandInteraction} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import { SlashCommandStringOption, SlashCommandUserOption } from '@discordjs/builders';
import { LanguageHandler } from '../../misc/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';
import { IGoogleSheetsHandler } from '../../interfaces/IGoogleSheetsHandler';
import PartyHandler from '../../misc/partyHandler';
import { Role } from '../../model/Role';

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
      zvzroles = zvzrole.split(",");
    } else {
      zvzroles.push(zvzrole);
    }
    const guild = interaction.guild;
    const channel = interaction.channel;
    const author = interaction.user;
    if(!PartyHandler.Roles) {
      await PartyHandler.updateComposition();
    }
    const nonExistent = [];
    for(const role of zvzroles) {
      if (role !== "Battlemount" && PartyHandler.Roles.find(r => r.RoleName === role || r.PriorityRole === role) === undefined) {
        nonExistent.push(role);
        break;
      }
    }
    if(nonExistent.length > 0) {
      try {
        await interaction.reply(await messageHandler.getRichTextExplicitDefault({
          guild: interaction.guild,
          author: interaction.user,
          title: languageHandler.language.commands.roles.add.error.role_title,
          description: languageHandler.replaceArgs(languageHandler.language.commands.roles.add.error.role_desc, ["- "+ nonExistent.join("\n- ")]),
          color: 0xcc0000,
        }));
      } catch (err) {
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
    for (const role of zvzroles) {
      if(await sqlHandler.addRole(user.id, role)) {
        addedRoles.push(role);
      } else {
        ignoredRoles.push(role);
      }
    }
    try {
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
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
  }
}