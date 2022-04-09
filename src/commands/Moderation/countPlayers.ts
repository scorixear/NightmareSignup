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
      () => languageHandler.replaceArgs(languageHandler.language.commands.countplayers.description, [config.botPrefix]),
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
    const userstrings = ['- '];
    const usercount = users.length;
    while (users.length > 0) {
      const currentString = userstrings[userstrings.length - 1];
      if (currentString.length + 2 + users[users.length - 1].length + 1 + 3 < 1024) {
        userstrings[userstrings.length - 1] = currentString + '<@' + users.pop() + '>\n- ';
      } else {
        userstrings[userstrings.length - 1] = userstrings[userstrings.length - 1].substring(0, userstrings[userstrings.length - 1].length - 3);
        userstrings.push(`- <@${users.pop()}>\n- `);
      }
    }
    userstrings[userstrings.length - 1] = userstrings[userstrings.length - 1].substring(0, userstrings[userstrings.length - 1].length - 3);
    const categories = [{
        title: languageHandler.language.commands.countplayers.success.count,
        text: usercount.toString(),
        inline: false
      },
      {
        title: languageHandler.language.commands.countplayers.success.list,
        text: userstrings[0],
        inline: true,
      }
    ];
    for (let i = 1; i < userstrings.length; i++) {
      categories.push({
        title: '\u200b',
        text: userstrings[i],
        inline: true,
      });
    }

    await interaction.reply(await messageHandler.getRichTextExplicitDefault({
      guild: interaction.guild,
      author: interaction.user,
      title: languageHandler.language.commands.countplayers.success.title,
      categories,
    }));

  }
}