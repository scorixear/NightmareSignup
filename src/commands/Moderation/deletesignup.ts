import {CommandInteraction, TextChannel} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import dateHandler from '../../misc/dateHandler';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import { SlashCommandBooleanOption, SlashCommandStringOption } from '@discordjs/builders';
import { LanguageHandler } from '../../misc/LanguageHandler';
import SqlHandler from '../../misc/sqlHandler';
import DiscordHandler from '../../misc/discordHandler';

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

  override async handle(interaction: CommandInteraction) {
    try {
      await super.handle(interaction);
    } catch(err) {
      return;
    }
    const eventName = interaction.options.getString('event_name');
    const eventDate = interaction.options.getString('event_date');
    let eventTime = interaction.options.getString('event_time');
    eventTime = eventTime.match(/\d\d?:\d\d/g)[0];
    let eventTimestamp: number;
    try {
      const date = dateHandler.getDateFromUTCString(eventDate, eventTime);
      eventTimestamp = dateHandler.getUTCTimestampFromDate(date);
      if (isNaN(eventTimestamp)) {
        interaction.reply(await messageHandler.getRichTextExplicitDefault({
          guild: interaction.guild,
          author: interaction.user,
          title: LanguageHandler.language.commands.deletesignup.error.formatTitle,
          description: LanguageHandler.language.commands.deletesignup.error.formatDesc,
          color: 0xcc0000,
        }));
        return;
      }
    } catch (err) {
      console.error(err);
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: LanguageHandler.language.commands.deletesignup.error.formatTitle,
        description: LanguageHandler.language.commands.deletesignup.error.formatDesc,
        color: 0xcc0000,
      }));
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
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: LanguageHandler.language.commands.deletesignup.success.title,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.deletesignup.success.desc, [eventName]),
      }));
      console.log(`Deleted event ${eventName} ${eventTimestamp}`);
    } else {
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: LanguageHandler.language.commands.deletesignup.error.sql_title,
        description: LanguageHandler.language.commands.deletesignup.error.sql_desc,
        color: 0xcc0000,
      }));
    }
  }
}