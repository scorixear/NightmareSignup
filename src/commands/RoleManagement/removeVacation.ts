import {CommandInteraction} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import { SlashCommandStringOption, SlashCommandUserOption } from '@discordjs/builders';
import { LanguageHandler } from '../../misc/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

declare const languageHandler: LanguageHandler;
declare const sqlHandler: ISqlHandler;

export default class RemoveVacation extends CommandInteractionHandle {
   constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(new SlashCommandUserOption().setName('user').setDescription(languageHandler.language.commands.vacation.options.user).setRequired(true));
    super(
      'removevacation',
      ()=>languageHandler.replaceArgs(languageHandler.language.commands.vacation.remove.description, [config.botPrefix]),
      'removevacation @Scorix',
      'RoleManagement',
      'removevacation <user>',
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
      if(await sqlHandler.getSqlVacation().removeVacation(user.id)) {
        await interaction.reply(await messageHandler.getRichTextExplicitDefault({
          title: languageHandler.language.commands.vacation.remove.success.title,
          description: languageHandler.replaceArgs(languageHandler.language.commands.vacation.remove.success.description, [user.id]),
          author: interaction.user,
          color: 0x00CC00
        }));
      } else {
        await interaction.reply(await messageHandler.getRichTextExplicitDefault({
          title: languageHandler.language.commands.vacation.error.title,
          description: languageHandler.language.commands.vacation.error.description,
          author: interaction.user,
          color: 0xCC0000
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