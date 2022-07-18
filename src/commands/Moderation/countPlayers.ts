import { CommandInteraction } from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import { LanguageHandler } from '../../misc/LanguageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

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

  override async handle(interaction: CommandInteraction) {
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
    try{
      await interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: LanguageHandler.language.commands.countplayers.success.title,
        categories,
      }));
    } catch {
      await messageHandler.sendRichTextDefaultExplicit({
        guild: interaction.guild,
        author: interaction.user,
        channel: interaction.channel,
        title: LanguageHandler.language.commands.countplayers.success.title,
        categories,
      });
    }


  }
}