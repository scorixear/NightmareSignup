import { CommandInteractionHandle } from "../../model/CommandInteractionHandle";
import { CommandInteraction, TextChannel } from "discord.js";
import { SlashCommandBooleanOption, SlashCommandStringOption } from "@discordjs/builders";
import dateHandler from "../../misc/dateHandler";
import messageHandler from "../../misc/messageHandler";
import PartyHandler from "../../misc/partyHandler";

export default class OptimalParty extends CommandInteractionHandle {
  constructor() {
    const commandOptions: any[]= [];
    super(
    'optimalparty',
      ()=>languageHandler.language.commands.optimalparty.description,
      'optimalparty',
      'Moderation',
      'optimalparty',
      commandOptions,
      true
    );
  }

  override async handle(interaction: CommandInteraction) {
    try {
      await super.handle(interaction);
    } catch(err) {
      return;
    }

    const sqlusers = await sqlHandler.getSqlUser().getUsers();
    const users: {userId: string, date: number}[] = sqlusers.map(user => {return {userId: user.userid, date: user.register};});
    await interaction.deferReply({
      fetchReply: false
    });
    await PartyHandler.updateComposition();
    const categories = await PartyHandler.formCategories(users, interaction.guild);
    await interaction.followUp(await messageHandler.getRichTextExplicitDefault({
      title: languageHandler.language.commands.optimalparty.title,
      description: languageHandler.replaceArgs(languageHandler.language.commands.optimalparty.desc, [users.length.toString()]),
      categories,
      author: interaction.user,
    }));
  }
}