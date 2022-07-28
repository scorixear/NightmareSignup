import { ChatInputCommandInteraction } from 'discord.js';

import PartyHandler from '../../handlers/partyHandler';
import { LanguageHandler } from '../../handlers/languageHandler';
import { CommandInteractionModel, MessageHandler } from 'discord.ts-architecture';

export default class OptimalParty extends CommandInteractionModel {
  constructor() {
    const commandOptions: any[] = [];
    super(
      'optimalparty',
      LanguageHandler.language.commands.optimalparty.description,
      'optimalparty',
      'Moderation',
      'optimalparty',
      commandOptions
    );
  }

  override async handle(interaction: ChatInputCommandInteraction) {
    try {
      await super.handle(interaction);
    } catch (err) {
      return;
    }

    const sqlusers = await sqlHandler.getSqlUser().getUsers();
    const users: { userId: string; date: number }[] = sqlusers.map((user) => {
      return { userId: user.userid, date: user.register };
    });
    await PartyHandler.updateComposition();
    const categories = await PartyHandler.formCategories(users, interaction.guild);
    await MessageHandler.reply({
      interaction,
      title: LanguageHandler.language.commands.optimalparty.title,
      description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.optimalparty.desc, [
        users.length.toString()
      ]),
      categories
    });
  }
}
