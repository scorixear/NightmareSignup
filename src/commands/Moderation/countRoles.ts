import { ChatInputCommandInteraction } from 'discord.js';
import { CommandInteractionModel, MessageHandler } from 'discord.ts-architecture';
import config from '../../config';

import { LanguageHandler } from '../../handlers/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';
import PartyHandler from '../../handlers/partyHandler';

declare const sqlHandler: ISqlHandler;

export default class CountRoles extends CommandInteractionModel {
  constructor() {
    const commandOptions: any[] = [];
    super(
      'countroles',
      LanguageHandler.replaceArgs(LanguageHandler.language.commands.countroles.description, [config.botPrefix]),
      'countroles',
      'Moderation',
      'countroles',
      commandOptions
    );
  }

  override async handle(interaction: ChatInputCommandInteraction) {
    try {
      await super.handle(interaction);
    } catch (err) {
      return;
    }

    const roles = await sqlHandler.getSqlRole().getUsersWithRoles();
    if (!PartyHandler.Roles) {
      await PartyHandler.updateComposition();
    }
    for (const role of PartyHandler.Roles) {
      if (roles.find((r) => r.role === role.RoleName) === undefined) {
        roles.push({ role: role.RoleName, count: 0 });
      }
    }
    const categories = MessageHandler.splitInCategories(
      roles.map((r) => r.role + ': ' + r.count),
      LanguageHandler.language.commands.countroles.success.list
    );
    await MessageHandler.reply({
      interaction,
      title: LanguageHandler.language.commands.countroles.success.title,
      categories
    });
  }
}
