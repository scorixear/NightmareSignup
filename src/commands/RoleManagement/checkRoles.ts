import {ChatInputCommandInteraction, SlashCommandUserOption} from 'discord.js';
import messageHandler from '../../handlers/messageHandler';
import config from '../../config';
import CommandInteractionHandle from '../../model/commands/CommandInteractionHandle';
import { LanguageHandler } from '../../handlers/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

declare const sqlHandler: ISqlHandler;

export default class CheckRoles extends CommandInteractionHandle {
   constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(new SlashCommandUserOption().setName('user').setDescription(LanguageHandler.language.commands.roles.options.user).setRequired(true));
    super(
      'checkroles',
      ()=>LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.check.description, [config.botPrefix]),
      'checkroles @Scorix',
      'RoleManagement',
      'checkroles <user>',
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
    const roles = await sqlHandler.getSqlRole().getRoles(user.id);
    const rolestring = '- '+ roles.join('\n- ');
    await messageHandler.replyRichText({
      interaction,
      title: LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.check.title, [user.username]),
      description: rolestring,
    });
  }
}