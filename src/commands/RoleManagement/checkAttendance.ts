import {ChatInputCommandInteraction, CommandInteraction, SlashCommandIntegerOption, SlashCommandStringOption} from 'discord.js';
import messageHandler from '../../handlers/messageHandler';
import config from '../../config';
import CommandInteractionHandle from '../../model/commands/CommandInteractionHandle';
import { LanguageHandler } from '../../handlers/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';
import dateHandler from '../../handlers/dateHandler';
import { Logger, WARNINGLEVEL } from '../../helpers/logger';

declare const sqlHandler: ISqlHandler;

export default class CheckAttendance extends CommandInteractionHandle {
   constructor() {
    const commandOptions: any[] = [
      new SlashCommandIntegerOption().setName('event-count').setDescription(LanguageHandler.language.commands.attendance.event_count_desc).setRequired(false),
      new SlashCommandStringOption().setName('event-name').setDescription(LanguageHandler.language.commands.attendance.event_name_desc).setRequired(false),
      new SlashCommandStringOption().setName('event-date').setDescription(LanguageHandler.language.commands.attendance.event_date_desc).setRequired(false),
      new SlashCommandStringOption().setName('event-time').setDescription(LanguageHandler.language.commands.attendance.event_time_desc).setRequired(false),
    ];
    super(
      'checkattendance',
      ()=>LanguageHandler.replaceArgs(LanguageHandler.language.commands.attendance.description, [config.botPrefix]),
      'checkattendance\ncheckattendance event-count: 3\ncheckattendance event-name: Test Event event-date: 24.03.2022 event-time: 12:00',
      'RoleManagement',
      'checkattendance [event-count] | [[event-name] [event-date] [event-time]]',
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
    const eventName = interaction.options.getString('event-name');
    const eventDate = interaction.options.getString('event-date');
    let eventTime = interaction.options.getString('event-time');
    eventTime = eventTime.match(/\d\d?:\d\d/g)[0];
    const eventCount = interaction.options.getInteger('event-count');
    let events;
    let description;
    let limit;
    if(eventName || eventDate || eventTime) {
      if (!eventName || !eventDate || !eventTime) {
        Logger.Log("CheckAttendance: Missing Parameters", WARNINGLEVEL.INFO);
        await interaction.reply({
          content: LanguageHandler.language.commands.attendance.missing_parameter,
          ephemeral: true,
        });
        return;
      } else {
        let eventTimestamp: number;
        try {
          const date = dateHandler.getDateFromUTCString(eventDate, eventTime);
          eventTimestamp = dateHandler.getUTCTimestampFromDate(date);
          if (isNaN(eventTimestamp)) {
            Logger.Log("CheckAttendance: Invalid Date", WARNINGLEVEL.INFO);
            await interaction.reply({
              content: LanguageHandler.language.commands.attendance.error.formatDesc,
              ephemeral: true,
            });
            return;
          }
        } catch (err) {
          Logger.Error("CheckAttendance: Date Parsing crash", err, WARNINGLEVEL.WARN);
          await interaction.reply({
            content: LanguageHandler.language.commands.deletesignup.error.formatDesc,
            ephemeral: true,
          });
          return;
        }
        const eventId = await sqlHandler.getSqlEvent().getEventId(eventName, eventTimestamp.toString());
        if (!eventId) {
          Logger.Log("CheckAttendance: Event not found", WARNINGLEVEL.INFO);
          await interaction.reply({
            content: LanguageHandler.language.commands.attendance.error.event_not_found,
            ephemeral: true,
          });
          return;
        }
        events = [{
          id: eventId,
          date: eventTimestamp,
        }];
        description = LanguageHandler.replaceArgs(LanguageHandler.language.commands.attendance.description_event, [eventName, eventDate, eventTime]);
        limit = 0;
      }
    } else if (eventCount) {
      events = await sqlHandler.getSqlEvent().findEventObjects('9999999999');
      let count = eventCount;
      if(events.length >= eventCount) {
        events.sort((a,b)=> a.date - b.date);
        events = events.slice(events.length-eventCount, events.length);
      } else {
        count = events.length;
      }
      description = LanguageHandler.replaceArgs(LanguageHandler.language.commands.attendance.success.limit_desc, [count.toString()]);
      limit = 1;
    } else {
      events = await sqlHandler.getSqlEvent().findEventObjects('9999999999');
      description = LanguageHandler.language.commands.attendance.success.description;
      limit = 1;
    }
    const users: {userid: string, register: number}[] = (await sqlHandler.getSqlUser().getUsers())
    const userCounts = new Map<string, {reacted: number, max: number}>();

    for(const user of users) {
      userCounts.set(user.userid,{reacted: 0, max: 0});
    }
    for(const event of events) {
      for (const user of users) {
        if (user.register < event.date) {
          if (!await sqlHandler.getSqlVacation().isInVacation(user.userid, event.date))
          {
            userCounts.get(user.userid).max = userCounts.get(user.userid).max + 1;
          }
        }
      }
      const signups = await sqlHandler.getSqlSignup().getSignups(event.id);
      for (const signup of signups) {
        if (userCounts.has(signup.userId)) {
          userCounts.get(signup.userId).reacted = userCounts.get(signup.userId).reacted + 1;
        }
      }
      const unavailables = await sqlHandler.getSqlUnavailable().getUnavailables(event.id);
      for(const id of unavailables) {
        if (userCounts.has(id)) {
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
            await sqlHandler.getSqlRole().clearRoles(pair[0]);
            await sqlHandler.getSqlUser().removeUser(pair[0]);
            await sqlHandler.getSqlVacation().clearVacation(pair[0]);
          }
          continue;
        }
        lines.push(`${member.nickname?member.nickname:member.user.username}: ${pair[1].max - pair[1].reacted} / ${pair[1].max}`);
      }
    }
    const categories = messageHandler.splitInCategories(lines, LanguageHandler.language.commands.attendance.success.list);
    Logger.Log("CheckAttendance: Success", WARNINGLEVEL.INFO);
    await messageHandler.replyRichText({
      interaction,
      title: LanguageHandler.language.commands.attendance.success.title,
      description,
      categories,
    });
  }
}