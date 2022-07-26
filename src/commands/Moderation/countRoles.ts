import { ChatInputCommandInteraction, CommandInteraction } from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import ChatInputCommandInteractionHandle from '../../model/commands/ChatInputCommandInteractionHandle';
import { LanguageHandler } from '../../misc/LanguageHandler';
import { ISqlHandler } from '../../interfaces/ISqlHandler';
import PartyHandler from '../../misc/partyHandler';

declare const sqlHandler: ISqlHandler;

export default class CountRoles extends ChatInputCommandInteractionHandle {
  constructor() {
    const commandOptions: any[] = [];
    super(
      'countroles',
      () => LanguageHandler.replaceArgs(LanguageHandler.language.commands.countroles.description, [config.botPrefix]),
      'countroles',
      'Moderation',
      'countroles',
      commandOptions,
      true,
    );
  }

  override async handle(interaction: ChatInputCommandInteraction) {
    try {
      await super.handle(interaction);
    } catch (err) {
      return;
    }

    const roles= await sqlHandler.getSqlRole().getUsersWithRoles();
    if(!PartyHandler.Roles) {
      await PartyHandler.updateComposition();
    }
    for(const role of PartyHandler.Roles) {
      if (roles.find(r => r.role === role.RoleName) === undefined) {
        roles.push({role: role.RoleName, count: 0});
      }
    }
    const categories = messageHandler.splitInCategories(roles.map(r=>r.role+": "+r.count), LanguageHandler.language.commands.countroles.success.list);
    await messageHandler.replyRichText({
      interaction,
      title: LanguageHandler.language.commands.countroles.success.title,
      categories,
    });
  }
}