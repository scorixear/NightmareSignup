import { GlobalRole } from "./GlobalRole";
import { Role as DiscordRole } from 'discord.js';

export class Role {
  RoleName: string;
  PriorityRole: string;
  Required: number;
  Maximum: number;
  GlobalRole: GlobalRole;
}