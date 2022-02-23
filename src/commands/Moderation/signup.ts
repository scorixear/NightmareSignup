import config from '../../config.js';
import messageHandler from '../../misc/messageHandler.js';
import dateHandler from '../../misc/dateHandler.js';
import { CommandInteraction, TextChannel, MessageActionRow, MessageButton, UserFlags } from 'discord.js';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import {  SlashCommandBooleanOption, SlashCommandChannelOption, SlashCommandStringOption } from '@discordjs/builders';
import { ChannelType } from 'discord-api-types/v10';
import signup from '../../interactions/signup';
import { LanguageHandler } from '../../misc/languageHandler.js';
import SqlHandler from '../../misc/sqlHandler.js';
import InteractionHandler from '../../misc/interactionHandler.js';

declare const languageHandler: LanguageHandler;
declare const sqlHandler: SqlHandler;
declare const interactionHandler: InteractionHandler;

/**
 *
 * @param eventId
 */
 export async function updateSignupMessage(eventId: number) {
  const eventMessage = await global.sqlHandler.getDiscordMessage(eventId);
  try {
    const guild = global.discordHandler.client.guilds.cache.get(eventMessage.guildId);
    try {
      const channel = await guild.channels.fetch(eventMessage.channelId) as TextChannel;
      try {
        const msg = await channel.messages.fetch(eventMessage.messageId);
        const embed = msg.embeds[0];
        const signups = await global.sqlHandler.getSignups(eventId);
        
        
        embed.fields[2].value = signups.length.toString();
        
        // TODO: update member names
        
        msg.edit({embeds: [embed], components: msg.components});
      } catch (err) {}
    } catch (err) {}
  } catch (err) {}
}

export async function updateUnavailable(eventId: number, isUnavailable: boolean) {
  const eventMessage = await global.sqlHandler.getDiscordMessage(eventId);
  try {
    const guild = global.discordHandler.client.guilds.cache.get(eventMessage.guildId);
    try {
      const channel = await guild.channels.fetch(eventMessage.channelId) as TextChannel;
      try {
        const msg = await channel.messages.fetch(eventMessage.messageId);
        if (msg) {
          const embed = msg.embeds[0];
          embed.fields[embed.fields.length-1].value = (parseInt(embed.fields[embed.fields.length-1].value, 10)+(isUnavailable?1:-1)).toString();
          msg.edit({embeds: [embed], components: msg.components});
        }
      } catch (err) {}
    } catch (err) {}
  } catch (err) {}
}

export default class SignupCommand extends CommandInteractionHandle {
  constructor() {
    const commandOptions: any[] = [];
    const channelOption: SlashCommandChannelOption = new SlashCommandChannelOption().setName('channel').setDescription(languageHandler.language.commands.signup.options.channel).setRequired(true);
    channelOption.addChannelType(ChannelType.GuildText);
    commandOptions.push(channelOption);
    commandOptions.push(new SlashCommandStringOption().setName('event_name').setDescription(languageHandler.language.commands.signup.options.event_name).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_date').setDescription(languageHandler.language.commands.signup.options.event_date).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_time').setDescription(languageHandler.language.commands.signup.options.event_time).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_description').setDescription(languageHandler.language.commands.signup.options.event_desc).setRequired(true));
    commandOptions.push(new SlashCommandBooleanOption().setName('event_is_cta').setDescription(languageHandler.language.commands.signup.options.event_is_cta).setRequired(false));
    super(
      'signup',
      ()=>global.languageHandler.language.commands.signup.description,
      'signup #announcements "Everfall Push" 14.10.2021 12:00 "Sign up for Everfall Push" true',
      'Moderation',
      'signup <#channel> <eventName> <date> <CET/CEST Time> <Description>',
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
    const channel = interaction.options.getChannel('channel') as TextChannel;
    const eventName = interaction.options.getString('event_name');
    const eventDate = interaction.options.getString('event_date');
    const eventTime = interaction.options.getString('event_time');
    const eventDesc = interaction.options.getString('event_description');
    const eventIsCta = interaction.options.getBoolean('event_is_cta', false);
    let eventTimestamp: number;
    let [dateString, timeString]: string[] = [ undefined, undefined];
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
        title: languageHandler.language.commands.signup.error.formatTitle,
        description: languageHandler.language.commands.signup.error.formatDesc,
        color: 0xcc0000,
      }));
      return;
    }

    const eventId = await sqlHandler.createEvent(eventName, eventTimestamp.toString(), eventIsCta);
    if (eventId === -1) {
      console.error('Failed to load event id with values: ', eventName, eventTimestamp);
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: languageHandler.language.commands.signup.error.eventTitle,
        description: languageHandler.replaceArgs(languageHandler.language.commands.signup.error.eventDesc, [eventName, eventDate + ' ' + eventTime, config.botPrefix]),
        color: 0xcc0000,
      }));
    }

    // Create two Buttons for the signup message
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(interactionHandler.buttonInteractions.typeGet(signup.SignupEvent)+eventId)
                .setLabel('Sign up')
                .setStyle('SUCCESS'),
            new MessageButton()
                .setCustomId(interactionHandler.buttonInteractions.typeGet(signup.SignoutEvent)+eventId)
                .setLabel('Sign out')
                .setStyle('DANGER'),
            new MessageButton()
                .setCustomId(interactionHandler.buttonInteractions.typeGet(signup.UnavailableEvent)+eventId)
                .setLabel('Unavailable')
                .setStyle('SECONDARY'),
        );

    const categories: {title: string, text?: string, inline?: boolean}[]  = [
      {
        title: 'Date',
        text: dateString,
        inline: true,
      },
      {
        title: 'Time',
        text: timeString,
        inline: true,
      },
      {
        title: 'Sign ups',
        text: '0',
        inline: true,
      },
      {
        title: "",
        text:  '',
      },
      {
        title: 'Unavailable',
        text: '0',
      }
    ];

    // send Signup message
    const message = await messageHandler.sendRichTextDefaultExplicit({
      guild: interaction.guild,
      channel,
      author: interaction.user,
      title: eventName,
      description: eventDesc,
      categories,
      components: [row],
    });
    await sqlHandler.createDiscordMessage(eventId, message.id, channel.id, message.guild.id);
    interaction.reply('Message created: '+message.url);
    console.log(`Created Event ${eventName} ${eventTimestamp}`);
  }
}
