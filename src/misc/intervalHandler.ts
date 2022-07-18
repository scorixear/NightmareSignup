import { MessageActionRow, MessageButton, TextChannel } from "discord.js";
import dateHandler from "./dateHandler";
import messageHandler from "./messageHandler";
import PartyHandler from "./partyHandler";
import SqlHandler from "./sqlHandler";
import { LanguageHandler } from "./languageHandler";

declare const sqlHandler: SqlHandler;

export class IntervalHandlers {
  public static initInterval() {
    setInterval(async () => {
      const now: Date = new Date();
      await this.handleMessageDeletion(now);
      await this.handleButtonRemoval(now);
      await this.handlePartyPost(now);
    }, 1000*60);
  }

  private static async handleMessageDeletion(now: Date) {
    const date = new Date(now.getTime());
    date.setHours(date.getHours() - 1);
    const events: number[] = await sqlHandler.getSqlEvent().findEvents(dateHandler.getUTCTimestampFromDate(date).toString(), false, true, undefined);
    for (const event of events) {
      const msg = await this.getMessageForEvent(event);
      if(msg) {
        try {
          await msg.delete();
          console.log('Deleted message for event ' + event);
        } catch (err) {
          console.error(`Couldn't delete message for event ${event}`, err);
        }
      }
      sqlHandler.getSqlEvent().updateEventFlags(event, true, undefined, undefined);
    }
  }

  private static async handleButtonRemoval(now: Date) {
    const events: number[] = await sqlHandler.getSqlEvent().findEvents(dateHandler.getUTCTimestampFromDate(now).toString(), false, false, undefined);
    for(const event of events) {
      const msg = await this.getMessageForEvent(event);
      if(msg) {
        try {
          if(msg.components.length === 0 || msg.components[0].components.length > 1) {
            const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('Closed')
                    .setLabel('Closed')
                    .setStyle('DANGER')
                    .setDisabled(true));
            await msg.edit({embeds: msg.embeds, components: [row]});
            console.log('Removed Buttons for event ' + event);
          }
        } catch (err) {
          console.error(`Couldn't remove buttons for event ${event}`, err);
          continue;
        }
      }
    }
  }

  private static async handlePartyPost(now: Date) {
    const events: number[] = await sqlHandler.getSqlEvent().findEvents(dateHandler.getUTCTimestampFromDate(now).toString(), false, false, undefined);

    if (events.length > 0) {
      await PartyHandler.updateComposition();
    }
    for(const event of events) {
      const msg = await this.getMessageForEvent(event);
      if(msg) {
        try {
          const partyCategories = await PartyHandler.getCategories(event);
          if(partyCategories) {
            msg.reply(await messageHandler.getRichTextExplicitDefault({
              guild: msg.guild,
              author: msg.author,
              title: LanguageHandler.language.handlers.party.title,
              description: LanguageHandler.language.handlers.party.description,
              categories: partyCategories
            }));
          } else {
            console.log('Couldn\'t create parties for event '+event);
          }
        } catch {
          console.log('Couldn\'t send party message');
        }
      }
      sqlHandler.getSqlEvent().updateEventFlags(event, undefined, true, undefined);
    }
  }

  private static async getMessageForEvent(eventId: number) {
    const message = await sqlHandler.getSqlDiscord().getDiscordMessage(eventId);
    return this.getDiscordMessage(eventId, message.messageId, message.channelId, message.guildId);
  }

  private static async getDiscordMessage(eventId: number, messageId: string, channelId: string, guildId: string) {
    try {
      const guild = await discordHandler.fetchGuild(guildId);
      try {
        const channel: TextChannel = (await guild.channels.fetch(channelId)) as TextChannel;
        try {
          return await channel.messages.fetch(messageId);
        } catch (err) {
          console.log('Couldn\'t find message for event ' + eventId);
        }
      } catch (err) {
        console.log('Couldn\'t find channel for event ' + eventId);
      }
    } catch (err) {
      console.log('Couldn\'t find guild for event '+ eventId);
    }
    return undefined;
  }
}