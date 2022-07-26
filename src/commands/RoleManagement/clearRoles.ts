import {ChatInputCommandInteraction, CommandInteraction, SlashCommandUserOption} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import ChatInputCommandInteractionHandle from '../../model/commands/ChatInputCommandInteractionHandle';
import { LanguageHandler } from '../../misc/LanguageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

declare const sqlHandler: ISqlHandler;

export default class ClearRoles extends ChatInputCommandInteractionHandle {
   constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(new SlashCommandUserOption().setName('user').setDescription(LanguageHandler.language.commands.roles.options.user).setRequired(true));
    super(
      'clearroles',
      ()=>LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.clear.description, [config.botPrefix]),
      'clearroles @Scorix',
      'RoleManagement',
      'clearroles <user>',
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
    const cleared = (await sqlHandler.getSqlRole().clearRoles(user.id))
      &&(await sqlHandler.getSqlUser().removeUser(user.id))
      &&(await sqlHandler.getSqlVacation().clearVacation(user.id));
    if (cleared) {
      await messageHandler.replyRichText({
        interaction,
        title: LanguageHandler.language.commands.roles.clear.title,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.clear.successdesc, ['<@'+user.id+'>']),
      });
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

      await interaction.followUp(await messageHandler.getRichTextInteraction({
        interaction,
        title: LanguageHandler.language.commands.roles.clear.error.discord,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.roles.clear.error.discorddesc, ['<@' + user.id + '>']),
        color: 0xcc0000,
      }));
    } else {
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: LanguageHandler.language.commands.roles.error.sql_title,
        description: LanguageHandler.language.commands.roles.error.sql_desc,
        color: 0xcc0000,
      }));
    }
  }
}