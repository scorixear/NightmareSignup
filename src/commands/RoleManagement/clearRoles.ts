import {CommandInteraction} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import { SlashCommandStringOption, SlashCommandUserOption } from '@discordjs/builders';
import { LanguageHandler } from '../../misc/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

declare const languageHandler: LanguageHandler;
declare const sqlHandler: ISqlHandler;

export default class ClearRoles extends CommandInteractionHandle {
   constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(new SlashCommandUserOption().setName('user').setDescription(languageHandler.language.commands.roles.options.user).setRequired(true));
    super(
      'clearroles',
      ()=>languageHandler.replaceArgs(languageHandler.language.commands.roles.clear.description, [config.botPrefix]),
      'clearroles @Scorix',
      'RoleManagement',
      'clearroles <user>',
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
    const cleared = (await sqlHandler.clearRoles(user.id))&&(await sqlHandler.removeUser(user.id));
    if (cleared) {
      await interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: languageHandler.language.commands.roles.clear.title,
        description: languageHandler.replaceArgs(languageHandler.language.commands.roles.clear.successdesc, ['<@'+user.id+'>']),
      }));
      const member = await discordHandler.fetchMember(user.id, interaction.guild);
      const roles = await interaction.guild.roles.fetch();
      const role = roles.find(r => r.name === config.armyRole);
      if (member && role) {
        try {
          if(member.roles.cache.has(role.id))
          {
            await member.roles.remove(role.id);
          }
          return;
        } catch {
          console.error("Couldn't remove role from user");
        }
      } else {
        console.error("Couldn't find member or role");
      }
      await messageHandler.sendRichTextDefaultExplicit({
        guild: interaction.guild,
        channel: interaction.channel,
        author: interaction.user,
        title: languageHandler.language.commands.roles.clear.error.discord,
        description: languageHandler.replaceArgs(languageHandler.language.commands.roles.clear.error.discorddesc, ['<@' + user.id + '>']),
        color: 0xcc0000,
      });
    } else {
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: languageHandler.language.commands.roles.error.sql_title,
        description: languageHandler.language.commands.roles.error.sql_desc,
        color: 0xcc0000,
      }));
    }
  }
}