import {Client, Guild, GatewayIntentBits, Partials,  Awaitable} from 'discord.js';
import { IDiscordHandler } from '../interfaces/IDiscordHandler';

export default class DiscordHandler  implements IDiscordHandler{
  private client: Client;
  constructor() {
    this.client = new Client({
      partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
      intents: [GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.Guilds]
    });
  }
  public getFirstGuild() {
    return this.client.guilds.cache.first();
  }
  public async getRolesOfGuild(guild: Guild) {
    return await guild.roles.fetch();
  }
  public async fetchGuild(guildId: string) {
    return await this.client.guilds.fetch(guildId);
  }
  public getGuilds() {
    return this.client.guilds.cache;
  }
  public async fetchMember(userId: string, guild: Guild) {
    return await guild.members.fetch(userId);
  }
  public on(event: string, callback: (...args: any[]) => Awaitable<void>) {
    return this.client.on(event, callback);
  }
  public async login(token: string) {
    return await this.client.login(token);
  }

}
