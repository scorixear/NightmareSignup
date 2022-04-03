import {CommandInteraction} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import { SlashCommandStringOption, SlashCommandUserOption } from '@discordjs/builders';
import { LanguageHandler } from '../../misc/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';
import { IGoogleSheetsHandler } from '../../interfaces/IGoogleSheetsHandler';
import PartyHandler from '../../misc/partyHandler';

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
      'addrole @Scorix camlann',
      'RoleManagement',
      'addrole <user> <zvzrole>',
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
    const guild = interaction.guild;
    const channel = interaction.channel;
    const author = interaction.user;
    if(!PartyHandler.Roles) {
      await PartyHandler.updateComposition();
    }
    const found = PartyHandler.Roles.find(role => role.RoleName === zvzrole || role.PriorityRole === zvzrole);
    if(!found) {
      try {
        await interaction.reply(await messageHandler.getRichTextExplicitDefault({
          guild: interaction.guild,
          author: interaction.user,
          title: languageHandler.language.commands.roles.add.error.role_title,
          description: languageHandler.replaceArgs(languageHandler.language.commands.roles.add.error.role_desc, [zvzrole]),
          color: 0xcc0000,
        }));
      } catch (err) {
        await messageHandler.sendRichTextDefaultExplicit({
          guild,
          channel,
          author,
          title: languageHandler.language.commands.roles.add.error.role_title,
          description: languageHandler.replaceArgs(languageHandler.language.commands.roles.add.error.role_desc, [zvzrole]),
          color: 0xcc0000,
        });
      }
      return;
    }
    const added = await sqlHandler.addRole(user.id, zvzrole);
    if (added) {
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: languageHandler.language.commands.roles.add.title,
        description: languageHandler.replaceArgs(languageHandler.language.commands.roles.add.successdesc, ['<@' + user.id + '>', zvzrole]),
      }));
    } else {
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: languageHandler.language.commands.roles.add.error.title,
        description: languageHandler.replaceArgs(languageHandler.language.commands.roles.add.error.description, ['<@' + user.id + '>', zvzrole]),
        color: 0xcc0000,
      }));
    }
  }
}