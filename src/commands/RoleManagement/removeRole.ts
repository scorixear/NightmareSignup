import {SlashCommandStringOption, SlashCommandUserOption, ChatInputCommandInteraction} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import ChatInputCommandInteractionHandle from '../../model/commands/ChatInputCommandInteractionHandle';
import { LanguageHandler } from '../../misc/LanguageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

declare const sqlHandler: ISqlHandler;
export default class RemoveRole extends ChatInputCommandInteractionHandle {
   constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(new SlashCommandUserOption().setName('user').setDescription(LanguageHandler.language.commands.roles.options.user).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('zvzrole').setDescription(LanguageHandler.language.commands.roles.options.zvzrole).setRequired(true));
    super(
      'removerole',
      ()=>LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.remove.description, [config.botPrefix]),
      'removerole @Scorix camlann',
      'RoleManagement',
      'removerole <user> <zvzrole>',
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
    const user = interaction.options.getUser('user', true);
    const zvzrole = interaction.options.getString('zvzrole', true).trim();
    const removed = await sqlHandler.getSqlRole().removeRole(user.id, zvzrole);
    if (removed) {
      await messageHandler.replyRichText({
        interaction,
        title: LanguageHandler.language.commands.roles.remove.title,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.remove.successdesc, ['<@' + user.id + '>', zvzrole]),
      });
    } else {
      await messageHandler.replyRichErrorText({
        interaction,
        title: LanguageHandler.language.commands.roles.error.sql_title,
        description: LanguageHandler.language.commands.roles.error.sql_desc,
        color: 0xcc0000,
      });
    }
  }
}