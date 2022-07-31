import {
  AutocompleteInteraction,
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandStringOption,
  SlashCommandUserOption
} from 'discord.js';

import config from '../../config';

import { LanguageHandler } from '../../handlers/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';
import PartyHandler from '../../handlers/partyHandler';
import dateHandler from '../../handlers/dateHandler';
import { AutocompleteInteractionModel, Logger, MessageHandler, WARNINGLEVEL } from 'discord.ts-architecture';

declare const sqlHandler: ISqlHandler;

export default class AddRole extends AutocompleteInteractionModel {
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
      'addrole',
      LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.add.description, [config.botPrefix]),
      'addrole @Scorix Camlann\naddrole @Scorix Camlann,Grovekeeper',
      'RoleManagement',
      'addrole <user> <zvzrole[s]>',
      commandOptions
    );
  }

  override async handleAutocomplete(interaction: AutocompleteInteraction<CacheType>): Promise<void> {
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
    const user = interaction.options.getUser('user');
    const zvzrole = interaction.options.getString('zvzrole');
    let zvzroles = [];
    if (zvzrole.includes(',')) {
      zvzroles = zvzrole.trim().split(',');
    } else {
      zvzroles.push(zvzrole.trim());
    }
    const guild = interaction.guild;
    const roles = await guild.roles.fetch();
    if (!PartyHandler.Roles) {
      await PartyHandler.updateComposition();
    }
    const nonExistent = [];
    for (const zrole of zvzroles) {
      if (
        zrole.trim() !== 'Battlemount' &&
        PartyHandler.Roles.find((r) => r.RoleName === zrole.trim() || r.PriorityRole === zrole.trim()) === undefined
      ) {
        nonExistent.push(zrole.trim());
        break;
      }
    }
    if (nonExistent.length > 0) {
      Logger.info('AddRole: Could not find roles', nonExistent.join('\n- '));
      await MessageHandler.replyError({
        interaction,
        title: LanguageHandler.language.commands.roles.add.error.role_title,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.add.error.role_desc, [
          '- ' + nonExistent.join('\n- ')
        ]),
        color: 0xcc0000
      });
      return;
    }
    const addedRoles = [];
    const ignoredRoles = [];
    if (!(await sqlHandler.getSqlUser().getUser(user.id))) {
      await sqlHandler.getSqlUser().addUser(user.id, dateHandler.getUTCTimestampFromDate(new Date()));
    }
    for (const zrole of zvzroles) {
      if (await sqlHandler.getSqlRole().addRole(user.id, zrole.trim())) {
        addedRoles.push(zrole.trim());
      } else {
        ignoredRoles.push(zrole.trim());
      }
    }
    await MessageHandler.reply({
      interaction,
      title: LanguageHandler.language.commands.roles.add.title,
      description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.add.successdesc, [
        '<@' + user.id + '>'
      ]),
      categories: [
        {
          title: LanguageHandler.language.commands.roles.add.success.added,
          text: '- ' + addedRoles.join('\n- ')
        },
        {
          title: LanguageHandler.language.commands.roles.add.success.ignored,
          text: '- ' + ignoredRoles.join('\n- ')
        }
      ]
    });
    const member = await discordHandler.fetchMember(user.id, guild);
    const role = roles.find((r) => r.name === config.armyRole);
    if (member && role) {
      try {
        await member.roles.add(role.id);
        return;
      } catch (err) {
        Logger.exception('AddRole: Could not add discord role', err, WARNINGLEVEL.WARN);
      }
    } else {
      Logger.warn('AddRole: Could not find discord member or role');
    }
    await MessageHandler.followUp({
      interaction,
      title: LanguageHandler.language.commands.roles.add.error.discord,
      description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.add.error.discorddesc, [
        '<@' + user.id + '>'
      ]),
      color: 0xcc0000
    });
  }
}
