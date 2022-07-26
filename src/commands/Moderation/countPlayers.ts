import { ChatInputCommandInteraction } from 'discord.js';
import messageHandler from '../../handlers/messageHandler';
import config from '../../config';
import { LanguageHandler } from '../../handlers/LanguageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';
import CommandInteractionHandle from '../../model/commands/CommandInteractionHandle';

declare const sqlHandler: ISqlHandler;

export default class CountPlayers extends CommandInteractionHandle {
  constructor() {
    const commandOptions: any[] = [];
    super(
      'countplayers',
      () => LanguageHandler.replaceArgs(LanguageHandler.language.commands.countplayers.description, [config.botPrefix]),
      'countplayers',
      'Moderation',
      'countplayers',
      commandOptions,
      true,
    );
  }

  override async handle(interaction: ChatInputCommandInteraction) {
    try {
      await super.handle(interaction);
    } catch (err) {
      return;
    }

    const users: string[] = (await sqlHandler.getSqlUser().getUsers()).map(u => '- <@'+u.userid+'>');
    const categories = messageHandler.splitInCategories(users, LanguageHandler.language.commands.countplayers.success.list);
    categories.unshift({
      title: LanguageHandler.language.commands.countplayers.success.count,
      text: users.length.toString(),
      inline: false
    });
    await messageHandler.replyRichText({
      interaction,
      title: LanguageHandler.language.commands.countplayers.success.title,
      categories,
    });
  }
}