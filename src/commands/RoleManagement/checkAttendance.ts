import {CommandInteraction} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import { SlashCommandStringOption, SlashCommandUserOption } from '@discordjs/builders';
import { LanguageHandler } from '../../misc/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';
import dateHandler from '../../misc/dateHandler';

declare const languageHandler: LanguageHandler;
declare const sqlHandler: ISqlHandler;

export default class CheckAttendance extends CommandInteractionHandle {
   constructor() {
    const commandOptions: any[] = [
      new SlashCommandStringOption().setName('event-name').setDescription(languageHandler.language.commands.attendance.event_name_desc).setRequired(false),
      new SlashCommandStringOption().setName('event-date').setDescription(languageHandler.language.commands.attendance.event_date_desc).setRequired(false),
      new SlashCommandStringOption().setName('event-time').setDescription(languageHandler.language.commands.attendance.event_time_desc).setRequired(false),
    ];
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

    const eventName = interaction.options.getString('event-name');
    const eventDate = interaction.options.getString('event-date');
    const eventTime = interaction.options.getString('event-time');
    let events;
    let description;
    let limit;
    if(eventName || eventDate || eventTime) {
      if (!eventName || !eventDate || !eventTime) {
        await interaction.reply({
          content: languageHandler.language.commands.attendance.missing_parameter,
          ephemeral: true,
        });
        return;
      } else {
        let eventTimestamp: number;
        try {
          const date = dateHandler.getDateFromUTCString(eventDate, eventTime);
          eventTimestamp = dateHandler.getUTCTimestampFromDate(date);
          if (isNaN(eventTimestamp)) {
            await interaction.reply({
              content: languageHandler.language.commands.attendance.error.formatDesc,
              ephemeral: true,
            });
            return;
          }
        } catch (err) {
          console.error(err);
          await interaction.reply({
            content: languageHandler.language.commands.deletesignup.error.formatDesc,
            ephemeral: true,
          });
          return;
        }
        const eventId = await sqlHandler.getEventId(eventName, eventTimestamp.toString());
        if (!eventId) {
          await interaction.reply({
            content: languageHandler.language.commands.attendance.error.event_not_found,
            ephemeral: true,
          });
          return;
        }
        events = [{
          id: eventId,
          date: eventTimestamp,
        }];
        description = languageHandler.replaceArgs(languageHandler.language.commands.attendance.description_event, [eventName, eventDate, eventTime]);
        limit = 0;
      }
    } else {
      events = await sqlHandler.findEventObjects('9999999999');
      description = languageHandler.language.commands.attendance.success.description;
      limit = 1;
    }

    const users: {userid: string, register: number}[] = (await sqlHandler.getUsers())
    const distinctUsers = new Map<string, number>();
    for(const user of users) {
      if (distinctUsers.has(user.userid) && distinctUsers.get(user.userid) > user.register) {
        distinctUsers.set(user.userid, user.register);
      } else if(!distinctUsers.has(user.userid)) {
        distinctUsers.set(user.userid, user.register);
      }
    }
    const userCounts = new Map<string, {reacted: number, max: number}>();

    for(const user of distinctUsers.keys()) {
      userCounts.set(user,{reacted: 0, max: 0});
    }
    for(const event of events) {
      for (const user of distinctUsers.keys()) {
        if (distinctUsers.get(user) < event.date) {
          userCounts.get(user).max = userCounts.get(user).max + 1;
        }
      }
      const signups = await sqlHandler.getSignups(event.id);
      for (const signup of signups) {
        if(!userCounts.has(signup.userId)) {
          userCounts.set(signup.userId, {reacted: 1, max: 1});
        } else {
          userCounts.get(signup.userId).reacted = userCounts.get(signup.userId).reacted + 1;
        }
      }
      const unavailables = await sqlHandler.getUnavailables(event.id);
      for(const id of unavailables) {
        if(!userCounts.has(id)) {
          userCounts.set(id, {reacted: 1, max: 1});
        }
        else {
          userCounts.get(id).reacted = userCounts.get(id).reacted + 1;
        }
      }
    }
    const lines = new Array<string>();
    for(const pair of userCounts) {
      if(pair[1].max - pair[1].reacted > limit) {
        let member;
        try {
          member = await discordHandler.fetchMember(pair[0], interaction.guild);
        } catch (err) {
          if(err.message === "Unknown Member") {
            await sqlHandler.clearRoles(pair[0]);
          }
          continue;
        }
        lines.push(`${member.nickname?member.nickname:member.user.username}: ${pair[1].max - pair[1].reacted} / ${pair[1].max}`);
      }
    }
    const categories = messageHandler.splitInCategories(lines, languageHandler.language.commands.attendance.success.list);

    await messageHandler.sendRichTextDefaultExplicit({
      guild: interaction.guild,
      author: interaction.user,
      channel: interaction.channel,
      title: languageHandler.language.commands.attendance.success.title,
      description,
      categories,
    });
  }
}