import { ChatInputCommandInteraction, SlashCommandStringOption, TextChannel } from 'discord.js';
import { DiscordHandler, CommandInteractionModel, Logger, MessageHandler, WARNINGLEVEL } from 'discord.ts-architecture';

import config from '../../config';
import dateHandler from '../../handlers/dateHandler';

import { LanguageHandler } from '../../handlers/languageHandler';
import SqlHandler from '../../handlers/sqlHandler';

declare const sqlHandler: SqlHandler;
declare const discordHandler: DiscordHandler;

export default class Deletesignup extends CommandInteractionModel {
  constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(
      new SlashCommandStringOption()
        .setName('event_name')
        .setDescription(LanguageHandler.language.commands.signup.options.event_name)
        .setRequired(true)
    );
    commandOptions.push(
      new SlashCommandStringOption()
        .setName('event_date')
        .setDescription(LanguageHandler.language.commands.signup.options.event_date)
        .setRequired(true)
    );
    commandOptions.push(
      new SlashCommandStringOption()
        .setName('event_time')
        .setDescription(LanguageHandler.language.commands.signup.options.event_time)
        .setRequired(true)
    );
    super(
      'deletesignup',
      LanguageHandler.replaceArgs(LanguageHandler.language.commands.deletesignup.description, [config.botPrefix]),
      'deletesignup "Everfall Push" 14.10.2021 12:00',
      'Moderation',
      'deletesignup <eventName> <date> <UTC Time>',
      commandOptions
    );
  }

  override async handle(interaction: ChatInputCommandInteraction) {
    try {
      await super.handle(interaction);
    } catch (err) {
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
        Logger.info('Deletesignup: Deletesignup: Error: Invalid date/time');
        await MessageHandler.replyError({
          interaction,
          title: LanguageHandler.language.commands.deletesignup.error.formatTitle,
          description: LanguageHandler.language.commands.deletesignup.error.formatDesc,
          color: 0xcc0000
        });
        return;
      }
    } catch (err) {
      Logger.exception('Deletesignup: Error while parsing date', err, WARNINGLEVEL.WARN, eventDate, eventTime);
      await MessageHandler.replyError({
        interaction,
        title: LanguageHandler.language.commands.deletesignup.error.formatTitle,
        description: LanguageHandler.language.commands.deletesignup.error.formatDesc,
        color: 0xcc0000
      });
      return;
    }
    const eventId = await sqlHandler.getSqlEvent().getEventId(eventName, eventTimestamp.toString());
    if (eventId) {
      const messageEvent = await sqlHandler.getSqlDiscord().getDiscordMessage(eventId);
      try {
        const guild = await discordHandler.fetchGuild(messageEvent.guildId);
        try {
          const channel = (await guild.channels.fetch(messageEvent.channelId)) as TextChannel;
          try {
            const msg = await channel.messages.fetch(messageEvent.messageId);
            await msg.delete();
            // eslint-disable-next-line no-empty
          } catch (err) {}
          // eslint-disable-next-line no-empty
        } catch (err) {}
        // eslint-disable-next-line no-empty
      } catch (err) {}

      await sqlHandler.getSqlEvent().deleteEvent(eventName, eventTimestamp.toString());
      await MessageHandler.reply({
        interaction,
        title: LanguageHandler.language.commands.deletesignup.success.title,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.deletesignup.success.desc, [
          eventName
        ])
      });
      Logger.info(`Deletesignup: Deleted signup for ${eventName} on ${eventDate} at ${eventTimeRegex}`);
    } else {
      Logger.info(`Deletesignup: Error: No signup found for ${eventName} on ${eventDate} at ${eventTimeRegex}`);
      await MessageHandler.replyError({
        interaction,
        title: LanguageHandler.language.commands.deletesignup.error.sql_title,
        description: LanguageHandler.language.commands.deletesignup.error.sql_desc,
        color: 0xcc0000
      });
    }
  }
}
