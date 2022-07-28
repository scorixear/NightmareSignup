import {
  ChatInputCommandInteraction,
  SlashCommandBooleanOption,
  SlashCommandStringOption,
  TextChannel
} from 'discord.js';
import dateHandler from '../../handlers/dateHandler';

import PartyHandler from '../../handlers/partyHandler';
import { LanguageHandler } from '../../handlers/languageHandler';
import { CommandInteractionModel, Logger, MessageHandler, WARNINGLEVEL } from 'discord.ts-architecture';

export default class FormParties extends CommandInteractionModel {
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
    commandOptions.push(
      new SlashCommandBooleanOption().setName('post_private').setDescription('Post here privately').setRequired(false)
    );
    super('formparties', 'test', 'formparties...', 'Moderation', 'formparties...', commandOptions);
  }

  override async handle(interaction: ChatInputCommandInteraction) {
    try {
      await super.handle(interaction);
    } catch (err) {
      return;
    }
    Logger.info('FormParties: Request received');
    const eventName = interaction.options.getString('event_name');
    const eventDate = interaction.options.getString('event_date');
    const eventTime = interaction.options.getString('event_time');
    const eventTimeRegex = eventTime.match(/\d\d?:\d\d/g)[0];
    const postPrivate = interaction.options.getBoolean('post_private');
    let eventTimestamp: number;
    try {
      const date = dateHandler.getDateFromUTCString(eventDate, eventTimeRegex);
      eventTimestamp = dateHandler.getUTCTimestampFromDate(date);
      if (isNaN(eventTimestamp)) {
        Logger.info('FormParties: Error: Invalid date/time');
        await MessageHandler.replyError({
          interaction,
          title: LanguageHandler.language.commands.deletesignup.error.formatTitle,
          description: LanguageHandler.language.commands.deletesignup.error.formatDesc,
          color: 0xcc0000
        });
        return;
      }
    } catch (err) {
      Logger.exception(
        'FormParties: Error: Crash when parsing date/time',
        err,
        WARNINGLEVEL.WARN,
        eventDate,
        eventTime
      );
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
          let msg;
          try {
            msg = await channel.messages.fetch(messageEvent.messageId);
            // eslint-disable-next-line no-empty
          } catch (err) {}
          await PartyHandler.updateComposition();
          Logger.info('FormParties: Beginning to form Parties');
          const partyCategories = await PartyHandler.getCategories(eventId);
          if (partyCategories) {
            if (postPrivate) {
              await MessageHandler.reply({
                interaction,
                title: LanguageHandler.language.handlers.party.title,
                description: LanguageHandler.language.handlers.party.description,
                categories: partyCategories
              });
              return;
            }
            try {
              Logger.info('FormParties: Posting to channel');
              await msg.reply(
                await MessageHandler.getEmbed({
                  guild: msg.guild,
                  author: msg.author,
                  title: LanguageHandler.language.handlers.party.title,
                  description: LanguageHandler.language.handlers.party.description,
                  categories: partyCategories
                })
              );
            } catch {
              Logger.warn('FormParties: Could not reply to message, posting separate');
              await MessageHandler.sendEmbed({
                guild: interaction.guild,
                author: interaction.user,
                channel: interaction.channel,
                title: LanguageHandler.language.handlers.party.title,
                description: LanguageHandler.language.handlers.party.description,
                categories: partyCategories
              });
            }
            await MessageHandler.reply({
              interaction,
              title: LanguageHandler.language.commands.formParties.success.title,
              description: LanguageHandler.replaceArgs(
                LanguageHandler.language.commands.formParties.success.description,
                [msg.channel.id]
              )
            });
            return;
          } else {
            Logger.error('FormParties: Could not create Parties', eventId);
          }
        } catch (err) {
          Logger.exception('FormParties: Could not fetch channel', err, WARNINGLEVEL.WARN, messageEvent.channelId);
        }
      } catch (err) {
        Logger.exception('FormParties: Could not fetch guild', err, WARNINGLEVEL.WARN, messageEvent.guildId);
      }
    } else {
      Logger.info('FormParties: Could not find event', eventName, eventTimestamp);
      await MessageHandler.replyError({
        interaction,
        title: LanguageHandler.language.commands.deletesignup.error.sql_title,
        description: LanguageHandler.language.commands.deletesignup.error.sql_desc,
        color: 0xcc0000
      });
    }
  }
}
