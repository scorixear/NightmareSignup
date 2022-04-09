import { CommandInteraction } from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import { LanguageHandler } from '../../misc/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

declare const languageHandler: LanguageHandler;
declare const sqlHandler: ISqlHandler;

export default class CountPlayers extends CommandInteractionHandle {
  constructor() {
    const commandOptions: any[] = [];
    super(
      'countplayers',
      () => languageHandler.replaceArgs(languageHandler.language.commands.roles.add.description, [config.botPrefix]),
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

    const users: string[] = await sqlHandler.getUsers();
    await interaction.reply(await messageHandler.getRichTextExplicitDefault({
      guild: interaction.guild,
      author: interaction.user,
      title: languageHandler.language.commands.countplayers.success.title,
      categories: [
        {
          title: languageHandler.language.commands.countplayers.success.count,
          text: users.length.toString(),
          inline: false
        },
        {
          title: languageHandler.language.commands.countplayers.success.list,
          text: '- '+ users.map((user) => `<@${user}>`).join('\n-  '),
          inline: false
        }
      ]
    }));

  }
}