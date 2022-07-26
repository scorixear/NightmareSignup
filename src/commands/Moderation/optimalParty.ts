import ChatInputCommandInteractionHandle from "../../model/commands/ChatInputCommandInteractionHandle";
import { ChatInputCommandInteraction, CommandInteraction } from "discord.js";
import messageHandler from "../../misc/messageHandler";
import PartyHandler from "../../misc/partyHandler";
import { LanguageHandler } from "../../misc/languageHandler";

export default class OptimalParty extends ChatInputCommandInteractionHandle {
  constructor() {
    const commandOptions: any[]= [];
    super(
    'optimalparty',
      ()=>LanguageHandler.language.commands.optimalparty.description,
      'optimalparty',
      'Moderation',
      'optimalparty',
      commandOptions,
      true
    );
  }

  override async handle(interaction: ChatInputCommandInteraction) {
    try {
      await super.handle(interaction);
    } catch(err) {
      return;
    }

    const sqlusers = await sqlHandler.getSqlUser().getUsers();
    const users: {userId: string, date: number}[] = sqlusers.map(user => {return {userId: user.userid, date: user.register};});
    await PartyHandler.updateComposition();
    const categories = await PartyHandler.formCategories(users, interaction.guild);
    await messageHandler.replyRichText({
      interaction,
      title: LanguageHandler.language.commands.optimalparty.title,
      description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.optimalparty.desc, [users.length.toString()]),
      categories,
    });
  }
}