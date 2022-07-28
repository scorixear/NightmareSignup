import { ChatInputCommandInteraction } from 'discord.js';
import { CommandInteractionModel, MessageHandler } from 'discord.ts-architecture';

import config from '../../config';
import { LanguageHandler } from '../../handlers/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

declare const sqlHandler: ISqlHandler;

export default class CountPlayers extends CommandInteractionModel {
  constructor() {
    const commandOptions: any[] = [];
    super(
      'countplayers',
      LanguageHandler.replaceArgs(LanguageHandler.language.commands.countplayers.description, [config.botPrefix]),
      'countplayers',
      'Moderation',
      'countplayers',
      commandOptions
    );
  }

  override async handle(interaction: ChatInputCommandInteraction) {
    try {
      await super.handle(interaction);
    } catch (err) {
      return;
    }

    const users: string[] = (await sqlHandler.getSqlUser().getUsers()).map((u) => '- <@' + u.userid + '>');
    const categories = MessageHandler.splitInCategories(
      users,
      LanguageHandler.language.commands.countplayers.success.list
    );
    categories.unshift({
      title: LanguageHandler.language.commands.countplayers.success.count,
      text: users.length.toString(),
      inline: false
    });
    await MessageHandler.reply({
      interaction,
      title: LanguageHandler.language.commands.countplayers.success.title,
      categories
    });
  }
}
