import { ChatInputCommandInteraction, SlashCommandUserOption } from 'discord.js';
import { CommandInteractionModel, Logger, MessageHandler, WARNINGLEVEL } from 'discord.ts-architecture';

import config from '../../config';

import { LanguageHandler } from '../../handlers/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

declare const sqlHandler: ISqlHandler;

export default class ClearRoles extends CommandInteractionModel {
  constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(
      new SlashCommandUserOption()
        .setName('user')
        .setDescription(LanguageHandler.language.commands.roles.options.user)
        .setRequired(true)
    );
    super(
      'clearroles',
      LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.clear.description, [config.botPrefix]),
      'clearroles @Scorix',
      'RoleManagement',
      'clearroles <user>',
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
    const cleared =
      (await sqlHandler.getSqlRole().clearRoles(user.id)) &&
      (await sqlHandler.getSqlUser().removeUser(user.id)) &&
      (await sqlHandler.getSqlVacation().clearVacation(user.id));
    if (cleared) {
      Logger.info('ClearRoles: Cleared roles and Vacation for user', user.tag);
      await MessageHandler.reply({
        interaction,
        title: LanguageHandler.language.commands.roles.clear.title,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.clear.successdesc, [
          '<@' + user.id + '>'
        ])
      });
      const member = await discordHandler.fetchMember(user.id, interaction.guild);
      const roles = await interaction.guild.roles.fetch();
      const role = roles.find((r) => r.name === config.armyRole);
      if (member && role) {
        try {
          if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role.id);
          }
          return;
        } catch (err) {
          Logger.exception('ClearRoles: Error removing discord role', err, WARNINGLEVEL.ERROR);
        }
      } else {
        Logger.warn('ClearRoles: Error finding discord member or role');
      }

      await MessageHandler.followUp({
        interaction,
        title: LanguageHandler.language.commands.roles.clear.error.discord,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.clear.error.discorddesc, [
          '<@' + user.id + '>'
        ]),
        color: 0xcc0000
      });
    } else {
      Logger.error('ClearRoles: Error clearing roles and Vacation for user', user.tag);
      await MessageHandler.replyError({
        interaction,
        title: LanguageHandler.language.commands.roles.error.sql_title,
        description: LanguageHandler.language.commands.roles.error.sql_desc,
        color: 0xcc0000
      });
    }
  }
}
