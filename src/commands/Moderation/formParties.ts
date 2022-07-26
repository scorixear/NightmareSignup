import CommandInteractionHandle from "../../model/commands/CommandInteractionHandle";
import { ChatInputCommandInteraction, CommandInteraction, SlashCommandBooleanOption, SlashCommandStringOption, TextChannel } from "discord.js";
import dateHandler from "../../handlers/dateHandler";
import messageHandler from "../../handlers/messageHandler";
import PartyHandler from "../../handlers/partyHandler";
import { LanguageHandler } from "../../handlers/languageHandler";
import { Logger, WARNINGLEVEL } from "../../helpers/Logger";

export default class FormParties extends CommandInteractionHandle {
  constructor() {
    const commandOptions: any[]= [];
    commandOptions.push(new SlashCommandStringOption().setName('event_name').setDescription(LanguageHandler.language.commands.signup.options.event_name).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_date').setDescription(LanguageHandler.language.commands.signup.options.event_date).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_time').setDescription(LanguageHandler.language.commands.signup.options.event_time).setRequired(true));
    commandOptions.push(new SlashCommandBooleanOption().setName('post_private').setDescription('Post here privately').setRequired(false));
    super(
    'formparties',
      ()=>"test",
      'formparties...',
      'Moderation',
      'formparties...',
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
    Logger.Log("FormParties: Request received", WARNINGLEVEL.INFO);
    const eventName = interaction.options.getString('event_name');
    const eventDate = interaction.options.getString('event_date');
    const eventTime = interaction.options.getString('event_time');
    let eventTimeRegex = eventTime.match(/\d\d?:\d\d/g)[0];
    const postPrivate = interaction.options.getBoolean('post_private');
    let eventTimestamp: number;
    try {
      const date = dateHandler.getDateFromUTCString(eventDate, eventTimeRegex);
      eventTimestamp = dateHandler.getUTCTimestampFromDate(date);
      if (isNaN(eventTimestamp)) {
        Logger.Log("FormParties: Error: Invalid date/time", WARNINGLEVEL.INFO);
        await messageHandler.replyRichErrorText({
          interaction,
          title: LanguageHandler.language.commands.deletesignup.error.formatTitle,
          description: LanguageHandler.language.commands.deletesignup.error.formatDesc,
          color: 0xcc0000,
        });
        return;
      }
    } catch (err) {
      Logger.Error("FormParties: Error: Crash when parsing date/time", err, WARNINGLEVEL.WARN, eventDate, eventTime);
      await messageHandler.replyRichErrorText({
        interaction,
        title: LanguageHandler.language.commands.deletesignup.error.formatTitle,
        description: LanguageHandler.language.commands.deletesignup.error.formatDesc,
        color: 0xcc0000,
      });
      return;
    }
    const eventId = await sqlHandler.getSqlEvent().getEventId(eventName, eventTimestamp.toString());
    if(eventId) {
      const messageEvent = await sqlHandler.getSqlDiscord().getDiscordMessage(eventId);
      try {
        const guild = await discordHandler.fetchGuild(messageEvent.guildId);
        try {
          const channel = await guild.channels.fetch(messageEvent.channelId) as TextChannel;
          let msg;
          try {
            msg = await channel.messages.fetch(messageEvent.messageId);
          } catch(err){}
          await PartyHandler.updateComposition();
          Logger.Log("FormParties: Beginning to form Parties", WARNINGLEVEL.INFO);
          const partyCategories = await PartyHandler.getCategories(eventId);
          if(partyCategories) {
            if(postPrivate) {
              await messageHandler.replyRichText({
                interaction,
                title: LanguageHandler.language.handlers.party.title,
                description: LanguageHandler.language.handlers.party.description,
                categories: partyCategories
              });
              return;
            }
            try {
              Logger.Log("FormParties: Posting to channel", WARNINGLEVEL.INFO);
              await msg.reply(await messageHandler.getRichTextExplicitDefault({
                guild: msg.guild,
                author: msg.author,
                title: LanguageHandler.language.handlers.party.title,
                description: LanguageHandler.language.handlers.party.description,
                categories: partyCategories
              }));
            } catch {
              Logger.Log("FormParties: Could not reply to message, posting separate", WARNINGLEVEL.WARN);
              await messageHandler.sendRichTextDefaultExplicit({
                guild: interaction.guild,
                author: interaction.user,
                channel: interaction.channel,
                title: LanguageHandler.language.handlers.party.title,
                description: LanguageHandler.language.handlers.party.description,
                categories: partyCategories
              });
            }
            await messageHandler.replyRichText({
              interaction,
              title: LanguageHandler.language.commands.formParties.success.title,
              description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.formParties.success.description,[msg.channel.id]),
            });
            return;
          } else {
            Logger.Log("FormParties: Could not create Parties", WARNINGLEVEL.ERROR, eventId);
          }
        } catch(err){
          Logger.Error("FormParties: Could not fetch channel", err, WARNINGLEVEL.WARN, messageEvent.channelId);
        }
      } catch(err){
        Logger.Error("FormParties: Could not fetch guild", err, WARNINGLEVEL.WARN, messageEvent.guildId);
      }
    } else {
      Logger.Log("FormParties: Could not find event", WARNINGLEVEL.INFO, eventName, eventTimestamp);
      await messageHandler.replyRichErrorText({
        interaction,
        title: LanguageHandler.language.commands.deletesignup.error.sql_title,
        description: LanguageHandler.language.commands.deletesignup.error.sql_desc,
        color: 0xcc0000,
      });
    }

  }
}