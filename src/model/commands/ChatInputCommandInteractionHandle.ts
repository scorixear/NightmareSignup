import { ChatInputCommandInteraction } from "discord.js";
import CommandInteractionHandle from "./CommandInteractionHandle";

export default abstract class ChatInputCommandInteractionHandle extends CommandInteractionHandle {
  constructor(command: string, description: ()=>string, example: string, category: string, usage: string, options: any[], requirePermissions: boolean) {
    super(command, description, example, category, usage, options, requirePermissions);
  }

  public override async handle(interaction: ChatInputCommandInteraction) {
    await super.handle(interaction);
  }
}