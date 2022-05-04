import {CommandInteraction} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import { SlashCommandStringOption, SlashCommandUserOption } from '@discordjs/builders';
import { LanguageHandler } from '../../misc/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

declare const languageHandler: LanguageHandler;
declare const sqlHandler: ISqlHandler;

export default class CheckVacation extends CommandInteractionHandle {
   constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(new SlashCommandUserOption().setName('user').setDescription(languageHandler.language.commands.vacation.options.user).setRequired(true));
    super(
      'checkvacation',
      ()=>languageHandler.replaceArgs(languageHandler.language.commands.vacation.check.description, [config.botPrefix]),
      'checkvacation @Scorix',
      'RoleManagement',
      'checkvacation <user>',
      commandOptions,
      true,
    );
  }

  override async handle(interaction: CommandInteraction) {
    try {
      await super.handle(interaction);
    } catch(err) {
      return;
    }

    const user = interaction.options.getUser('user');
    if(await sqlHandler.getSqlUser().getUser(user.id)) {
      if(await sqlHandler.getSqlVacation().isInVacation(user.id, Date.now())) {
        await interaction.reply(await messageHandler.getRichTextExplicitDefault({
          title: languageHandler.language.commands.vacation.check.success.title,
          description: languageHandler.replaceArgs(languageHandler.language.commands.vacation.check.success.description, [user.id]),
          author: interaction.user,
          color: 0x00CC00
        }));
      } else {
        await interaction.reply(await messageHandler.getRichTextExplicitDefault({
          title: languageHandler.language.commands.vacation.check.not.title,
          description: languageHandler.replaceArgs(languageHandler.language.commands.vacation.check.not.description, [user.id]),
          author: interaction.user,
          color: 0xCCCC00,
        }));
      }
    } else {
      await interaction.reply(await messageHandler.getRichTextExplicitDefault({
        title: languageHandler.language.commands.vacation.user_error.title,
        description: languageHandler.replaceArgs(languageHandler.language.commands.vacation.user_error.description, [user.id]),
        author: interaction.user,
        color: 0xCC0000
      }));
    }
  }
}