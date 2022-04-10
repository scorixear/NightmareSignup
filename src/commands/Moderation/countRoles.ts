import { CommandInteraction } from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import { LanguageHandler } from '../../misc/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

declare const languageHandler: LanguageHandler;
declare const sqlHandler: ISqlHandler;

export default class CountRoles extends CommandInteractionHandle {
  constructor() {
    const commandOptions: any[] = [];
    super(
      'countroles',
      () => languageHandler.replaceArgs(languageHandler.language.commands.countroles.description, [config.botPrefix]),
      'countroles',
      'Moderation',
      'countroles',
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

    const roles= (await sqlHandler.getUsersWithRoles()).map(r=> r.role+": "+r.count);
    const categories = messageHandler.splitInCategories(roles, languageHandler.language.commands.countroles.success.list);

    await interaction.reply(await messageHandler.getRichTextExplicitDefault({
      guild: interaction.guild,
      author: interaction.user,
      title: languageHandler.language.commands.countroles.success.title,
      categories,
    }));

  }
}