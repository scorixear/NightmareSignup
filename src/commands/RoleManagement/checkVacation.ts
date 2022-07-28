import { ChatInputCommandInteraction, SlashCommandUserOption } from 'discord.js';
import { CommandInteractionModel, MessageHandler } from 'discord.ts-architecture';

import config from '../../config';

import { LanguageHandler } from '../../handlers/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

declare const sqlHandler: ISqlHandler;

export default class CheckVacation extends CommandInteractionModel {
  constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(
      new SlashCommandUserOption()
        .setName('user')
        .setDescription(LanguageHandler.language.commands.vacation.options.user)
        .setRequired(true)
    );
    super(
      'checkvacation',
      LanguageHandler.replaceArgs(LanguageHandler.language.commands.vacation.check.description, [config.botPrefix]),
      'checkvacation @Scorix',
      'RoleManagement',
      'checkvacation <user>',
      commandOptions
    );
  }

  override async handle(interaction: ChatInputCommandInteraction) {
    try {
      await super.handle(interaction);
    } catch (err) {
      return;
    }

    const user = interaction.options.getUser('user');
    if (await sqlHandler.getSqlUser().getUser(user.id)) {
      if (await sqlHandler.getSqlVacation().isInVacation(user.id, Date.now())) {
        await MessageHandler.reply({
          interaction,
          title: LanguageHandler.language.commands.vacation.check.success.title,
          description: LanguageHandler.replaceArgs(
            LanguageHandler.language.commands.vacation.check.success.description,
            [user.id]
          ),
          color: 0x00cc00
        });
      } else {
        await MessageHandler.reply({
          interaction,
          title: LanguageHandler.language.commands.vacation.check.not.title,
          description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.vacation.check.not.description, [
            user.id
          ]),
          color: 0xcccc00
        });
      }
    } else {
      await MessageHandler.replyError({
        interaction,
        title: LanguageHandler.language.commands.vacation.user_error.title,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.vacation.user_error.description, [
          user.id
        ]),
        color: 0xcc0000
      });
    }
  }
}
