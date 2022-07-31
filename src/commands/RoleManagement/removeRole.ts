import {
  SlashCommandStringOption,
  SlashCommandUserOption,
  ChatInputCommandInteraction,
  AutocompleteInteraction
} from 'discord.js';
import { AutocompleteInteractionModel, MessageHandler } from 'discord.ts-architecture';
import PartyHandler from '../../handlers/partyHandler';

import config from '../../config';

import { LanguageHandler } from '../../handlers/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

declare const sqlHandler: ISqlHandler;
export default class RemoveRole extends AutocompleteInteractionModel {
  constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(
      new SlashCommandUserOption()
        .setName('user')
        .setDescription(LanguageHandler.language.commands.roles.options.user)
        .setRequired(true)
    );
    commandOptions.push(
      new SlashCommandStringOption()
        .setName('zvzrole')
        .setDescription(LanguageHandler.language.commands.roles.options.zvzrole)
        .setRequired(true)
        .setAutocomplete(true)
    );
    super(
      'removerole',
      LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.remove.description, [config.botPrefix]),
      'removerole @Scorix camlann',
      'RoleManagement',
      'removerole <user> <zvzrole>',
      commandOptions
    );
  }

  override async handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
    if (!PartyHandler.Roles) {
      return await interaction.respond([]);
    }
    const focused = interaction.options.getFocused();
    let roles = PartyHandler.Roles.filter((role) => role.RoleName.startsWith(focused)).sort();
    if (roles.length > 25) {
      roles = roles.slice(0, 25);
    }
    return await interaction.respond(roles.map((role) => ({ name: role.RoleName, value: role.RoleName })));
  }

  override async handle(interaction: ChatInputCommandInteraction) {
    try {
      await super.handle(interaction);
    } catch (err) {
      return;
    }
    const user = interaction.options.getUser('user', true);
    const zvzrole = interaction.options.getString('zvzrole', true).trim();
    const removed = await sqlHandler.getSqlRole().removeRole(user.id, zvzrole);
    if (removed) {
      await MessageHandler.reply({
        interaction,
        title: LanguageHandler.language.commands.roles.remove.title,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.remove.successdesc, [
          '<@' + user.id + '>',
          zvzrole
        ])
      });
    } else {
      await MessageHandler.replyError({
        interaction,
        title: LanguageHandler.language.commands.roles.error.sql_title,
        description: LanguageHandler.language.commands.roles.error.sql_desc,
        color: 0xcc0000
      });
    }
  }
}
