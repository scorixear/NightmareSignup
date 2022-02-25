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
        embed.fields = [embed.fields[0], embed.fields[1], embed.fields[2], embed.fields[embed.fields.length-1]];

        embed.fields[2].value = signups.length.toString();

        let fieldIndex = 3;
        let currentCount = 0;

        for(const player of signups) {
          const member = guild.members.cache.find(m => m.id === player.userId);
          let name = member.nickname;
          if (name === undefined || name === null) {
            name = member.user.username;
          }
          if (currentCount < 20) {
            if (currentCount === 0) {
              embed.fields.splice(fieldIndex, 0, {
                name: 'Members',
                value: name,
                inline: false,
              });
            } else {
              embed.fields[fieldIndex].value += "\n" + name;
            }
            currentCount++;
          } else {
            currentCount = 0;
            fieldIndex++;
            embed.fields.splice(fieldIndex, 0, {
              name: '\u200b',
              value: name,
              inline: true,
            });
          }
        }
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
    commandOptions.push(new SlashCommandBooleanOption().setName('event_is_cta').setDescription(languageHandler.language.commands.signup.options.event_is_cta).setRequired(true));
    super(
      'signup',
      ()=>global.languageHandler.language.commands.signup.description,
      'signup #announcements "CTA" 14.10.2021 12:00 "Sign Up for the upcoming CTA" true',
      'Moderation',
      'signup <#channel> <eventName> <date> <UTC Time> <Description>',
      commandOptions,
      true
    );
  }

  override async handle(interaction: CommandInteraction) {
    try {
      await super.handle(interaction);
    } catch(err) {
      console.error(err);
      return;
    }

    const channel = interaction.options.getChannel('channel') as TextChannel;
    const eventName = interaction.options.getString('event_name');
    const eventDate = interaction.options.getString('event_date');
    const eventTime = interaction.options.getString('event_time');
    const eventDesc = interaction.options.getString('event_description');
    const eventIsCta = interaction.options.getBoolean('event_is_cta', false);
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
      return;
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
        text: eventDate,
        inline: true,
      },
      {
        title: 'Time',
        text: eventTime+ " UTC",
        inline: true,
      },
      {
        title: 'Sign ups',
        text: '0',
        inline: true,
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
