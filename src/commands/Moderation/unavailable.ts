import {ChatInputCommandInteraction, CommandInteraction, SlashCommandStringOption} from 'discord.js';
import messageHandler from '../../handlers/messageHandler';
import config from '../../config';
import dateHandler from '../../handlers/dateHandler';
import ChatInputCommandInteractionHandle from '../../model/commands/ChatInputCommandInteractionHandle';
import { LanguageHandler } from '../../handlers/LanguageHandler';
import SqlHandler from '../../handlers/sqlHandler';

declare const sqlHandler: SqlHandler;

export default class Unavailable extends ChatInputCommandInteractionHandle {
  constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(new SlashCommandStringOption().setName('event_name').setDescription(LanguageHandler.language.commands.signup.options.event_name).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_date').setDescription(LanguageHandler.language.commands.signup.options.event_date).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_time').setDescription(LanguageHandler.language.commands.signup.options.event_time).setRequired(true));
    super(
      'unavailable',
      ()=>LanguageHandler.replaceArgs(LanguageHandler.language.commands.unavailable.description, [config.botPrefix]),
      'unavailable "Everfall Push" 14.10.2021 12:00',
      'Moderation',
      'unavailable <eventName> <date> <CET/CEST Time>',
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
    const eventName = interaction.options.getString('event_name');
    const eventDate = interaction.options.getString('event_date');
    let eventTime = interaction.options.getString('event_time');
    eventTime = eventTime.match(/\d\d?:\d\d/g)[0];
    let eventTimestamp;
    try {
      const date = dateHandler.getDateFromUTCString(eventDate, eventTime);
      eventTimestamp = dateHandler.getUTCTimestampFromDate(date);
      if (isNaN(eventTimestamp)) {
        await messageHandler.replyRichErrorText({
          interaction,
          title: LanguageHandler.language.commands.deletesignup.error.formatTitle,
          description: LanguageHandler.language.commands.deletesignup.error.formatDesc,
          color: 0xcc0000,
        });
        return;
      }
    } catch (err) {
      await messageHandler.replyRichErrorText({
        interaction,
        title: LanguageHandler.language.commands.unavailable.error.formatTitle,
        description: LanguageHandler.language.commands.unavailable.error.formatDesc,
        color: 0xcc0000,
      });
      return;
    }
    const eventId = await sqlHandler.getSqlEvent().getEventId(eventName, eventTimestamp.toString());
    if (eventId) {
      const result = (await Promise.all((await sqlHandler.getSqlUnavailable().getUnavailables(eventId))
          .map(async (val)=> {
            const guildMember = await interaction.guild.members.fetch(val.toString());
            return guildMember.nickname?guildMember.nickname:guildMember.user.username;
          })))
          .join('\n');
      await messageHandler.replyRichText({
        interaction,
        title: LanguageHandler.language.commands.unavailable.success.title,
        description: result,
      });
    } else {
      await messageHandler.replyRichErrorText({
        interaction,
        title: LanguageHandler.language.commands.unavailable.error.sql_title,
        description: LanguageHandler.language.commands.unavailable.error.sql_desc,
        color: 0xcc0000,
      });
    }
  }
}