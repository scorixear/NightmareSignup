import {ChatInputCommandInteraction, SlashCommandStringOption, TextChannel} from 'discord.js';
import messageHandler from '../../handlers/messageHandler';
import config from '../../config';
import dateHandler from '../../handlers/dateHandler';
import CommandInteractionHandle from '../../model/commands/CommandInteractionHandle';
import { LanguageHandler } from '../../handlers/LanguageHandler';
import SqlHandler from '../../handlers/sqlHandler';
import DiscordHandler from '../../handlers/discordHandler';
import { Logger, WARNINGLEVEL } from '../../helpers/Logger';

declare const sqlHandler: SqlHandler;
declare const discordHandler: DiscordHandler;

export default class Deletesignup extends CommandInteractionHandle {
  constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(new SlashCommandStringOption().setName('event_name').setDescription(LanguageHandler.language.commands.signup.options.event_name).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_date').setDescription(LanguageHandler.language.commands.signup.options.event_date).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_time').setDescription(LanguageHandler.language.commands.signup.options.event_time).setRequired(true));
    super(
      'deletesignup',
      ()=>LanguageHandler.replaceArgs(LanguageHandler.language.commands.deletesignup.description, [config.botPrefix]),
      'deletesignup "Everfall Push" 14.10.2021 12:00',
      'Moderation',
      'deletesignup <eventName> <date> <UTC Time>',
      commandOptions,
      true
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
    const eventTime = interaction.options.getString('event_time');
    const eventTimeRegex = eventTime.match(/\d\d?:\d\d/g)[0];
    let eventTimestamp: number;
    try {
      const date = dateHandler.getDateFromUTCString(eventDate, eventTimeRegex);
      eventTimestamp = dateHandler.getUTCTimestampFromDate(date);
      if (isNaN(eventTimestamp)) {
        Logger.Log("Deletesignup: Deletesignup: Error: Invalid date/time", WARNINGLEVEL.INFO);
        await messageHandler.replyRichErrorText({
          interaction,
          title: LanguageHandler.language.commands.deletesignup.error.formatTitle,
          description: LanguageHandler.language.commands.deletesignup.error.formatDesc,
          color: 0xcc0000,
        });
        return;
      }
    } catch (err) {
      Logger.Error("Deletesignup: Error while parsing date", err, WARNINGLEVEL.WARN, eventDate, eventTime);
      await messageHandler.replyRichErrorText({
        interaction,
        title: LanguageHandler.language.commands.deletesignup.error.formatTitle,
        description: LanguageHandler.language.commands.deletesignup.error.formatDesc,
        color: 0xcc0000,
      });
      return;
    }
    const eventId = await sqlHandler.getSqlEvent().getEventId(eventName, eventTimestamp.toString());
    if (eventId) {
      const messageEvent = await sqlHandler.getSqlDiscord().getDiscordMessage(eventId);
      try {
        const guild = await discordHandler.fetchGuild(messageEvent.guildId);
        try {
          const channel = await guild.channels.fetch(messageEvent.channelId) as TextChannel;
          try {
            const msg = await channel.messages.fetch(messageEvent.messageId);
            await msg.delete();
          } catch (err) {}
        } catch (err) {}
      } catch (err) {}

      await sqlHandler.getSqlEvent().deleteEvent(eventName, eventTimestamp.toString());
      await messageHandler.replyRichText({
        interaction,
        title: LanguageHandler.language.commands.deletesignup.success.title,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.deletesignup.success.desc, [eventName]),
      });
      Logger.Log(`Deletesignup: Deleted signup for ${eventName} on ${eventDate} at ${eventTimeRegex}`, WARNINGLEVEL.INFO);
    } else {
      Logger.Log(`Deletesignup: Error: No signup found for ${eventName} on ${eventDate} at ${eventTimeRegex}`, WARNINGLEVEL.INFO);
      await messageHandler.replyRichErrorText({
        interaction,
        title: LanguageHandler.language.commands.deletesignup.error.sql_title,
        description: LanguageHandler.language.commands.deletesignup.error.sql_desc,
        color: 0xcc0000,
      });
    }
  }
}