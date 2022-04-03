import { Guild, Collection, Role, GuildMember, Awaitable, Client } from "discord.js";
export interface IDiscordHandler {
  getFirstGuild(): Guild;
  getRolesOfGuild(guild: Guild): Promise<Collection<string, Role>>;
  fetchGuild(guildId: string): Promise<Guild>;
  getGuilds(): Collection<string, Guild>;
  fetchMember(userId: string, guild: Guild): Promise<GuildMember>;
  on(event: string, callback: (...args: any[]) => Awaitable<void>): Client<boolean>;
  login(token: string): Promise<string>;
}