import { CommandInteraction } from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import { CommandInteractionHandle } from '../../model/CommandInteractionHandle';
import { LanguageHandler } from '../../misc/languageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';
import PartyHandler from '../../misc/partyHandler';

declare const languageHandler: LanguageHandler;
declare const sqlHandler: ISqlHandler;

export default class CountRoles extends CommandInteractionHandle {
  constructor() {
    const commandOptions: any[] = [];
    super(
      'countroles',
      () => languageHandler.replaceArgs(languageHandler.language.commands.countroles.description, [config.botPrefix]),
      'countroles',
      'Moderation',
      'countroles',
      commandOptions,
      true,
    );
  }

  override async handle(interaction: CommandInteraction) {
    try {
      await super.handle(interaction);
    } catch (err) {
      return;
    }

    const roles= await sqlHandler.getUsersWithRoles();
    let react = true;
    if(!PartyHandler.Roles) {
      react = false;
      interaction.deferReply();
      await PartyHandler.updateComposition();
    }
    for(const role of PartyHandler.Roles) {
      if (roles.find(r => r.role === role.RoleName) === undefined) {
        roles.push({role: role.RoleName, count: 0});
      }
    }
    const categories = messageHandler.splitInCategories(roles.map(r=>r.role+": "+r.count), languageHandler.language.commands.countroles.success.list);

    if(react) {
      await interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: languageHandler.language.commands.countroles.success.title,
        categories,
      }));
    } else {
      await messageHandler.sendRichTextDefaultExplicit({
        guild: interaction.guild,
        channel: interaction.channel,
        author: interaction.user,
        title: languageHandler.language.commands.countroles.success.title,
        categories,
      });
    }


  }
}