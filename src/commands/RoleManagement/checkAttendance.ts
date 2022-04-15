import {CommandInteraction} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import { SlashCommandStringOption, SlashCommandUserOption } from '@discordjs/builders';
import { LanguageHandler } from '../../misc/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';

declare const languageHandler: LanguageHandler;
declare const sqlHandler: ISqlHandler;

export default class CheckAttendance extends CommandInteractionHandle {
   constructor() {
    const commandOptions: any[] = [];
    super(
      'checkattendance',
      ()=>languageHandler.replaceArgs(languageHandler.language.commands.attendance.description, [config.botPrefix]),
      'checkattendance',
      'RoleManagement',
      'checkattendance',
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
    interaction.deferReply();
    const users: string[] = (await sqlHandler.getUsers())
    const events: number[] = (await sqlHandler.findEvents('9999999999',true,true,true));
    const userCounts = new Map<string, number>();
    for(const user of users) {
      userCounts.set(user,0);
    }
    for(const event of events) {
      const signups = await sqlHandler.getSignups(event);
      for (const signup of signups) {
        userCounts.set(signup.userId, userCounts.get(signup.userId) + 1);
      }
      const unavailables = await sqlHandler.getUnavailables(event);
      for(const un of unavailables) {
        userCounts.set(un, userCounts.get(un) + 1);
      }
    }
    const lines = new Array<string>();
    for(const pair of userCounts) {
      if(events.length - pair[1] > 1) {
        const member = await discordHandler.fetchMember(pair[0], interaction.guild);
        lines.push(`${member.nickname?member.nickname:member.user.username}: ${events.length - pair[1]} / ${events.length}`);
      }
    }
    const categories = messageHandler.splitInCategories(lines, languageHandler.language.commands.attendance.success.list);

    await messageHandler.sendRichTextDefaultExplicit({
      guild: interaction.guild,
      author: interaction.user,
      channel: interaction.channel,
      title: languageHandler.language.commands.attendance.success.title,
      description: languageHandler.language.commands.attendance.success.description,
      categories,
    });
  }
}