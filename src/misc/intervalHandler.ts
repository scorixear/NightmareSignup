import { MessageActionRow, MessageButton, TextChannel } from "discord.js";
import dateHandler from "./dateHandler";
import SqlHandler from "./sqlHandler";

declare const sqlHandler: SqlHandler;

export class IntervalHandlers {
  public static initInterval() {
    setInterval(async () => {
      const now: Date = new Date();
      await this.handleMessageDeletion(now);
      await this.handleButtonRemoval(now);
    }, 1000*60);
  }

  private static async handleMessageDeletion(now: Date) {
    const date = new Date(now.getTime());
    date.setHours(date.getHours() - 1);
    const events: number[] = await sqlHandler.findDeleteEvents(dateHandler.getUTCTimestampFromDate(date).toString());
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
      sqlHandler.closeEvent(event);
    }
  }

  private static async handleButtonRemoval(now: Date) {
    const events: number[] = await sqlHandler.findDeleteEvents(dateHandler.getUTCTimestampFromDate(now).toString());
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

  private static async getMessageForEvent(eventId: number) {
    const message = await sqlHandler.getDiscordMessage(eventId);
    return this.getDiscordMessage(eventId, message.messageId, message.channelId, message.guildId);
  }

  private static async getDiscordMessage(eventId: number, messageId: string, channelId: string, guildId: string) {
    try {
      const guild = discordHandler.client.guilds.cache.get(guildId);
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