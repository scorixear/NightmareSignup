import config from '../../config';
import messageHandler from '../../handlers/messageHandler';
import dateHandler from '../../handlers/dateHandler';
import { ActionRowBuilder, ButtonBuilder, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBooleanOption, SlashCommandChannelOption, SlashCommandStringOption, TextChannel } from 'discord.js';
import CommandInteractionHandle from '../../model/commands/CommandInteractionHandle';
import { ButtonStyle, ChannelType } from 'discord-api-types/v10';
import signup from '../../interactions/signup';
import { LanguageHandler } from '../../handlers/LanguageHandler';
import SqlHandler from '../../handlers/sqlHandler';
import InteractionHandler from '../../handlers/interactionHandler';
import { Logger, WARNINGLEVEL } from '../../helpers/Logger';

declare const sqlHandler: SqlHandler;
declare const interactionHandler: InteractionHandler;

/**
 *
 * @param eventId
 */
 export async function updateSignupMessage(eventId: number) {
  const eventMessage = await global.sqlHandler.getSqlDiscord().getDiscordMessage(eventId);
  try {
    const guild = await global.discordHandler.fetchGuild(eventMessage.guildId);
    try {
      const channel = await guild.channels.fetch(eventMessage.channelId) as TextChannel;
      try {
        const msg = await channel.messages.fetch(eventMessage.messageId);
        const embed = msg.embeds[0];
        const signups = await global.sqlHandler.getSqlSignup().getSignups(eventId);
        const newEmbed = new EmbedBuilder();
        newEmbed.setTitle(embed.title);
        newEmbed.setDescription(embed.description);
        newEmbed.setColor(embed.color);
        newEmbed.setFooter(embed.footer);
        newEmbed.setAuthor(embed.author);
        let newFields: {name: string, value: string, inline?: boolean}[] = [];
        newFields = [embed.fields[0], embed.fields[1], embed.fields[2], embed.fields[embed.fields.length-1]];

        newFields[2].value = signups.length.toString();

        let fieldIndex = 3;
        let currentCount = 0;

        for(const player of signups) {
          const member = await guild.members.fetch(player.userId);
          let name = member.nickname;
          if (name === undefined || name === null) {
            name = member.user.username;
          }
          if (currentCount < 20) {
            if (currentCount === 0) {
              newFields.splice(fieldIndex, 0, {
                name: 'Members',
                value: name,
                inline: true,
              });
            } else {
              newFields[fieldIndex].value += "\n" + name;
            }
            currentCount++;
          } else {
            currentCount = 1;
            fieldIndex++;
            newFields.splice(fieldIndex, 0, {
              name: '\u200b',
              value: name,
              inline: true,
            });
          }
        }
        newEmbed.addFields(newFields);
        await msg.edit({embeds: [newEmbed], components: msg.components});
      } catch (err) {
        Logger.Error("Could not update signup message", err, WARNINGLEVEL.ERROR);
      }
    } catch (err) {}
  } catch (err) {}
}

export async function updateUnavailable(eventId: number) {
  const eventMessage = await global.sqlHandler.getSqlDiscord().getDiscordMessage(eventId);
  try {
    const guild = await global.discordHandler.fetchGuild(eventMessage.guildId);
    try {
      const channel = await guild.channels.fetch(eventMessage.channelId) as TextChannel;
      try {
        const msg = await channel.messages.fetch(eventMessage.messageId);
        if (msg) {
          const embed = msg.embeds[0];
          const unavailable = await sqlHandler.getSqlUnavailable().countUnavailable(eventId);
          if (unavailable !== undefined) {
            embed.fields[embed.fields.length-1].value = unavailable.toString();
            msg.edit({embeds: [embed], components: msg.components});
          }
        }
      } catch (err) {}
    } catch (err) {}
  } catch (err) {}
}

export default class SignupCommand extends CommandInteractionHandle {
  constructor() {
    const commandOptions: any[] = [];
    const channelOption: SlashCommandChannelOption = new SlashCommandChannelOption().setName('channel').setDescription(LanguageHandler.language.commands.signup.options.channel).setRequired(true);
    channelOption.addChannelTypes(ChannelType.GuildText);
    commandOptions.push(channelOption);
    commandOptions.push(new SlashCommandStringOption().setName('event_name').setDescription(LanguageHandler.language.commands.signup.options.event_name).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_date').setDescription(LanguageHandler.language.commands.signup.options.event_date).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_time').setDescription(LanguageHandler.language.commands.signup.options.event_time).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_description').setDescription(LanguageHandler.language.commands.signup.options.event_desc).setRequired(true));
    commandOptions.push(new SlashCommandBooleanOption().setName('event_is_cta').setDescription(LanguageHandler.language.commands.signup.options.event_is_cta).setRequired(true));
    super(
      'signup',
      ()=>LanguageHandler.language.commands.signup.description,
      'signup #announcements "CTA" 14.10.2021 12:00 "Sign Up for the upcoming CTA" true',
      'Moderation',
      'signup <#channel> <eventName> <date> <UTC Time> <Description> <isCta>',
      commandOptions,
      true
    );
  }

  override async handle(interaction: ChatInputCommandInteraction) {
    try {
      await super.handle(interaction);
    } catch(err) {
      Logger.Error("SignupCommand: Super crashed", err, WARNINGLEVEL.ERROR);
      return;
    }

    const channel = interaction.options.getChannel('channel') as TextChannel;
    const eventName = interaction.options.getString('event_name');
    const eventDate = interaction.options.getString('event_date');
    let eventTime = interaction.options.getString('event_time');
    eventTime = eventTime.match(/\d\d?:\d\d/g)[0];
    const eventDesc = interaction.options.getString('event_description');
    const eventIsCta = interaction.options.getBoolean('event_is_cta');
    let eventTimestamp: number;
    try {
      const date = dateHandler.getDateFromUTCString(eventDate, eventTime);
      eventTimestamp = dateHandler.getUTCTimestampFromDate(date);
      if (isNaN(eventTimestamp)) {
        Logger.Log("SignupCommand: Invalid date", WARNINGLEVEL.INFO);
        await messageHandler.replyRichErrorText({
          interaction,
          title: LanguageHandler.language.commands.deletesignup.error.formatTitle,
          description: LanguageHandler.language.commands.deletesignup.error.formatDesc,
          color: 0xcc0000,
        });
        return;
      }
    } catch (err) {
      Logger.Error("SignupCommand: Date parsing crashed", err, WARNINGLEVEL.ERROR);
      await messageHandler.replyRichErrorText({
        interaction,
        title: LanguageHandler.language.commands.signup.error.formatTitle,
        description: LanguageHandler.language.commands.signup.error.formatDesc,
        color: 0xcc0000,
      });
      return;
    }

    const eventId = await sqlHandler.getSqlEvent().createEvent(eventName, eventTimestamp.toString(), eventIsCta);
    if (eventId === -1) {
      Logger.Log("SignupCommand: Event creation failed", WARNINGLEVEL.ERROR, eventName, eventTimestamp);
      await messageHandler.replyRichErrorText({
        interaction,
        title: LanguageHandler.language.commands.signup.error.eventTitle,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.signup.error.eventDesc, [eventName, eventDate + ' ' + eventTime, config.botPrefix]),
        color: 0xcc0000,
      });
      return;
    }

    // Create two Buttons for the signup message
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(interactionHandler.buttonInteractions.typeGet(signup.SignupEvent)+eventId)
                .setLabel('Sign up')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(interactionHandler.buttonInteractions.typeGet(signup.SignoutEvent)+eventId)
                .setLabel('Sign out')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(interactionHandler.buttonInteractions.typeGet(signup.UnavailableEvent)+eventId)
                .setLabel('Unavailable')
                .setStyle(ButtonStyle.Secondary),
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
    await sqlHandler.getSqlDiscord().createDiscordMessage(eventId, message.id, channel.id, message.guild.id);
    await messageHandler.replyRichText({
      interaction,
      title: LanguageHandler.language.commands.signup.success.title,
      description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.signup.success.description, [eventName, eventDate + ' ' + eventTime, config.botPrefix, message.url]),
      color: 0x00cc00,
    });
    Logger.Log("SignupCommand: Created Event", WARNINGLEVEL.INFO, eventName, eventTimestamp);
  }
}
