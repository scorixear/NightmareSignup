import CommandInteractionHandle from "../../model/commands/CommandInteractionHandle";
import { ChatInputCommandInteraction, CommandInteraction } from "discord.js";
import messageHandler from "../../handlers/messageHandler";
import PartyHandler from "../../handlers/partyHandler";
import { LanguageHandler } from "../../handlers/languageHandler";

export default class OptimalParty extends CommandInteractionHandle {
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