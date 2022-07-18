import {CommandInteraction} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import { SlashCommandStringOption, SlashCommandUserOption } from '@discordjs/builders';
import { LanguageHandler } from '../../misc/LanguageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

declare const sqlHandler: ISqlHandler;

export default class StartVacation extends CommandInteractionHandle {
   constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(new SlashCommandUserOption().setName('user').setDescription(LanguageHandler.language.commands.vacation.options.user).setRequired(true));
    super(
      'startvacation',
      ()=>LanguageHandler.replaceArgs(LanguageHandler.language.commands.vacation.start.description, [config.botPrefix]),
      'startvacation @Scorix',
      'RoleManagement',
      'startvacation <user>',
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
      if(await sqlHandler.getSqlVacation().setVacation(user.id, Date.now(), 999999999999999)) {
        await interaction.reply(await messageHandler.getRichTextExplicitDefault({
          title: LanguageHandler.language.commands.vacation.start.success.title,
          description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.vacation.start.success.description, [user.id]),
          author: interaction.user,
          color: 0x00CC00
        }));
      } else {
        await interaction.reply(await messageHandler.getRichTextExplicitDefault({
          title: LanguageHandler.language.commands.vacation.error.title,
          description: LanguageHandler.language.commands.vacation.error.description,
          author: interaction.user,
          color: 0xCC0000
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