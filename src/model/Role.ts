import { GlobalRole } from "./GlobalRole";
import { Role as DiscordRole } from 'discord.js';

export class Role {
  RoleName: string;
  DiscordRole: DiscordRole;
  PriorityRole: DiscordRole;
  Required: number;
  Maximum: number;
  GlobalRole: GlobalRole;
}