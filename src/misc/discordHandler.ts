import {Client, Guild, Intents, Awaitable} from 'discord.js';
import { IDiscordHandler } from '../interfaces/IDiscordHandler';

export default class DiscordHandler  implements IDiscordHandler{
  private client: Client;
  constructor() {
    this.client = new Client({
      partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER'],
      intents: [Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS]});
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
