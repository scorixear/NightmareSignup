import { SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandChannelOption, SlashCommandStringOption, SlashCommandUserOption } from "@discordjs/builders";
import { CommandInteraction, GuildMember, GuildMemberRoleManager, Role } from "discord.js";

abstract class CommandInteractionHandle {
  public command: string;
  public description: ()=>string;
  public example: string;
  public category: string;
  public usage: string;
  public id: Record<string, string>;
  public requirePermissions: boolean;
  public Ready: Promise<any>;

  public slashCommandBuilder: SlashCommandBuilder;

  constructor(command: string, description: ()=>string, example: string, category: string, usage: string, options: any[], requirePermissions: boolean) {
    this.command = command;
    this.description = description;
    this.example = example;
    this.category = category;
    this.usage = usage;
    this.slashCommandBuilder = new SlashCommandBuilder().setName(this.command).setDescription(this.description());
    this.requirePermissions = requirePermissions;
    for(const option of options) {
      if(option instanceof SlashCommandChannelOption) {
        this.slashCommandBuilder.addChannelOption(option);
      } else if(option instanceof SlashCommandStringOption) {
        this.slashCommandBuilder.addStringOption(option);
      } else if(option instanceof SlashCommandBooleanOption) {
        this.slashCommandBuilder.addBooleanOption(option);
      } else if(option instanceof SlashCommandUserOption) {
        this.slashCommandBuilder.addUserOption(option);
      } else {
        throw new Error("Not supported SlashCommand Option");
      }
    }
  }

  public async handle(interaction: CommandInteraction) {
    if(this.requirePermissions) {
      const applicationCommand = (await interaction.guild.commands.fetch()).find(command => command.name === this.command);

      if(applicationCommand) {
        const member = await (interaction.member as GuildMember).fetch();
        if(member.user.id === process.env.OWNER_ID) {
          return;
        }
        const memberRoles = (member.roles as GuildMemberRoleManager).cache;
        let found: boolean = false;
        for(const memberRole of memberRoles.values()) {
          if(await applicationCommand.permissions.has({permissionId: memberRole})) {
            found = true;
            break;
          }
        }
        if(!found) {
          throw Error('No permission');
        }
      }
    }
  }
}

export {CommandInteractionHandle};