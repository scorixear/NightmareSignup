import {ChatInputCommandInteraction, CommandInteraction, SlashCommandUserOption} from 'discord.js';
import messageHandler from '../../handlers/messageHandler';
import config from '../../config';
import CommandInteractionHandle from '../../model/commands/CommandInteractionHandle';
import { LanguageHandler } from '../../handlers/languageHandler';
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

  override async handle(interaction: ChatInputCommandInteraction) {
    try {
      await super.handle(interaction);
    } catch(err) {
      return;
    }
    const user = interaction.options.getUser('user');
    if(await sqlHandler.getSqlUser().getUser(user.id)) {
      if(await sqlHandler.getSqlVacation().setVacation(user.id, Date.now(), 999999999999999)) {
        await messageHandler.replyRichText({
          interaction,
          title: LanguageHandler.language.commands.vacation.start.success.title,
          description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.vacation.start.success.description, [user.id]),
          color: 0x00CC00
        });
      } else {
        await messageHandler.replyRichErrorText({
          interaction,
          title: LanguageHandler.language.commands.vacation.error.title,
          description: LanguageHandler.language.commands.vacation.error.description,
          color: 0xCC0000
        });
      }
    } else {
      await messageHandler.replyRichErrorText({
        interaction,
        title: LanguageHandler.language.commands.vacation.user_error.title,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.vacation.user_error.description, [user.id]),
        color: 0xCC0000
      });
    }
  }

}