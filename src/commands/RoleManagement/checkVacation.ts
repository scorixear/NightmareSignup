import {CommandInteraction} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import { SlashCommandStringOption, SlashCommandUserOption } from '@discordjs/builders';
import { LanguageHandler } from '../../misc/LanguageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

declare const sqlHandler: ISqlHandler;

export default class CheckVacation extends CommandInteractionHandle {
   constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(new SlashCommandUserOption().setName('user').setDescription(LanguageHandler.language.commands.vacation.options.user).setRequired(true));
    super(
      'checkvacation',
      ()=>LanguageHandler.replaceArgs(LanguageHandler.language.commands.vacation.check.description, [config.botPrefix]),
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
          title: LanguageHandler.language.commands.vacation.check.success.title,
          description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.vacation.check.success.description, [user.id]),
          author: interaction.user,
          color: 0x00CC00
        }));
      } else {
        await interaction.reply(await messageHandler.getRichTextExplicitDefault({
          title: LanguageHandler.language.commands.vacation.check.not.title,
          description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.vacation.check.not.description, [user.id]),
          author: interaction.user,
          color: 0xCCCC00,
        }));
      }
    } else {
      await interaction.reply(await messageHandler.getRichTextExplicitDefault({
        title: LanguageHandler.language.commands.vacation.user_error.title,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.vacation.user_error.description, [user.id]),
        author: interaction.user,
        color: 0xCC0000
      }));
    }
  }
}