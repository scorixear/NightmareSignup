import {CommandInteraction} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import { SlashCommandStringOption, SlashCommandUserOption } from '@discordjs/builders';
import { LanguageHandler } from '../../misc/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

declare const languageHandler: LanguageHandler;
declare const sqlHandler: ISqlHandler;

export default class CheckRoles extends CommandInteractionHandle {
   constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(new SlashCommandUserOption().setName('user').setDescription(languageHandler.language.commands.roles.options.user).setRequired(true));
    super(
      'checkroles',
      ()=>languageHandler.replaceArgs(languageHandler.language.commands.roles.check.description, [config.botPrefix]),
      'checkroles @Scorix',
      'RoleManagement',
      'checkroles <user>',
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
    const roles = await sqlHandler.getRoles(user.id);
    const rolestring = '- '+ roles.join('\n- ');
    interaction.reply(await messageHandler.getRichTextExplicitDefault({
      guild: interaction.guild,
      author: interaction.user,
      title: languageHandler.replaceArgs(languageHandler.language.commands.roles.check.title, [user.username]),
      description: rolestring,
    }));
  }
}