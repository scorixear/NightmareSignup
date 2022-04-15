import { CommandInteractionHandle } from "../../model/CommandInteractionHandle";
import { CommandInteraction, TextChannel } from "discord.js";
import { SlashCommandBooleanOption, SlashCommandStringOption } from "@discordjs/builders";
import dateHandler from "../../misc/dateHandler";
import messageHandler from "../../misc/messageHandler";
import PartyHandler from "../../misc/partyHandler";

export default class FormParties extends CommandInteractionHandle {
  constructor() {
    const commandOptions: any[]= [];
    commandOptions.push(new SlashCommandStringOption().setName('event_name').setDescription(languageHandler.language.commands.signup.options.event_name).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_date').setDescription(languageHandler.language.commands.signup.options.event_date).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_time').setDescription(languageHandler.language.commands.signup.options.event_time).setRequired(true));
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

  override async handle(interaction: CommandInteraction) {
    try {
      await super.handle(interaction);
    } catch(err) {
      return;
    }
    console.log("starting party form");
    const eventName = interaction.options.getString('event_name');
    const eventDate = interaction.options.getString('event_date');
    const eventTime = interaction.options.getString('event_time');
    const postPrivate = interaction.options.getBoolean('post_private');
    let eventTimestamp: number;
    try {
      const date = dateHandler.getDateFromUTCString(eventDate, eventTime);
      eventTimestamp = dateHandler.getUTCTimestampFromDate(date);
      if (isNaN(eventTimestamp)) {
        interaction.reply(await messageHandler.getRichTextExplicitDefault({
          guild: interaction.guild,
          author: interaction.user,
          title: languageHandler.language.commands.deletesignup.error.formatTitle,
          description: languageHandler.language.commands.deletesignup.error.formatDesc,
          color: 0xcc0000,
        }));
        return;
      }
    } catch (err) {
      console.error(err);
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: languageHandler.language.commands.deletesignup.error.formatTitle,
        description: languageHandler.language.commands.deletesignup.error.formatDesc,
        color: 0xcc0000,
      }));
      return;
    }
    const eventId = await sqlHandler.getEventId(eventName, eventTimestamp.toString());
    if(eventId) {
      const messageEvent = await sqlHandler.getDiscordMessage(eventId);
      try {
        const guild = await discordHandler.fetchGuild(messageEvent.guildId);
        try {
          const channel = await guild.channels.fetch(messageEvent.channelId) as TextChannel;
          let msg;
          try {
            msg = await channel.messages.fetch(messageEvent.messageId);
          } catch(err){}
          await PartyHandler.updateComposition();
          console.log("forming parties now");
          const partyCategories = await PartyHandler.getCategories(eventId);
          if(partyCategories) {
            if(postPrivate) {
              await messageHandler.sendRichTextDefaultExplicit({
                guild: interaction.guild,
                author: interaction.user,
                channel: interaction.channel,
                title: languageHandler.language.handler.party.title,
                description: languageHandler.language.handler.party.description,
                categories: partyCategories
              });
              return;
            }
            try {
              console.log("Replying to message");
              await msg.reply(await messageHandler.getRichTextExplicitDefault({
                guild: msg.guild,
                author: msg.author,
                title: languageHandler.language.handlers.party.title,
                description: languageHandler.language.handlers.party.description,
                categories: partyCategories
              }));
            } catch {
              await messageHandler.sendRichTextDefaultExplicit({
                guild: interaction.guild,
                author: interaction.user,
                channel: interaction.channel,
                title: languageHandler.language.handler.party.title,
                description: languageHandler.language.handler.party.description,
                categories: partyCategories
              });
            }
            return;
          } else {
            console.log('Couldn\'t create parties for event '+event);
          }
        } catch(err){
          console.error(err);
        }
      } catch(err){
        console.error(err);
      }
    } else {
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: languageHandler.language.commands.deletesignup.error.sql_title,
        description: languageHandler.language.commands.deletesignup.error.sql_desc,
        color: 0xcc0000,
      }));
    }

  }
}