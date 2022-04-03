import {CommandInteraction} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import { SlashCommandStringOption, SlashCommandUserOption } from '@discordjs/builders';
import { LanguageHandler } from '../../misc/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

declare const languageHandler: LanguageHandler;
declare const sqlHandler: ISqlHandler;

export default class ClearRoles extends CommandInteractionHandle {
   constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(new SlashCommandUserOption().setName('user').setDescription(languageHandler.language.commands.roles.options.user).setRequired(true));
    super(
      'clearroles',
      ()=>languageHandler.replaceArgs(languageHandler.language.commands.roles.clear.description, [config.botPrefix]),
      'clearroles @Scorix',
      'RoleManagement',
      'clearroles <user>',
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
    const cleared = await sqlHandler.clearRoles(user.id);
    if (cleared) {
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: languageHandler.language.commands.roles.clear.title,
        description: languageHandler.replaceArgs(languageHandler.language.commands.roles.clear.successdesc, ['<@'+user.id+'>']),
      }));
    } else {
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: languageHandler.language.commands.roles.error.sql_title,
        description: languageHandler.language.commands.roles.error.sql_desc,
        color: 0xcc0000,
      }));
    }
  }
}