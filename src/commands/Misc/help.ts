import messageHandler from '../../misc/messageHandler.js';
import config from '../../config.js';
import ChatInputCommandInteractionHandle from '../../model/commands/ChatInputCommandInteractionHandle';
import { ChatInputCommandInteraction, GuildMember, GuildMemberRoleManager, SlashCommandStringOption } from 'discord.js';
import { LanguageHandler } from '../../misc/LanguageHandler.js';
import CommandInteractionHandle from '../../model/commands/CommandInteractionHandle';

export default class Help extends ChatInputCommandInteractionHandle {
  commands: CommandInteractionHandle[];
  constructor() {
    super(
      'help',
      ()=>LanguageHandler.language.commands.help.description,
      'help\nhelp signup',
      'Misc',
      `help [${LanguageHandler.language.commands.help.labels.command.toLowerCase()}]`,
      [new SlashCommandStringOption().setName('command').setDescription(LanguageHandler.language.commands.help.options.command).setRequired(false)],
      false
    );
  }

  init(commands: CommandInteractionHandle[]) {
    this.commands = commands;
  }

  override async handle(interaction: ChatInputCommandInteraction) {
    try {
      await super.handle(interaction);
    } catch(err) {
      return;
    }
    const member = await (interaction.member as GuildMember).fetch();
    const command = interaction.options.getString('command', false);
    const memberRoles = (member.roles as GuildMemberRoleManager).cache;
    if (command) {
      const commandHandle = this.commands.find((c: CommandInteractionHandle)=> command.startsWith(c.command));
      if (commandHandle) {
        let found: boolean = false;
        if(member.user.id === process.env.OWNER_ID) {
          found = true;
        }
        for (const memberRole of memberRoles.values()) {
          if(config.signupRoles.find((signupRole: string) => signupRole === memberRole.name)) {
            found = true;
            break;
          }
        }
        if(!found) {
          await messageHandler.replyRichErrorText({
            interaction,
            title: 'Help Info',
            categories: [{
              title: 'Info',
              text: LanguageHandler.replaceArgs(LanguageHandler.language.commands.help.error.unknown, [config.botPrefix])
            }],
          });
          return;
        }
        const example = '\`\`\`' + config.botPrefix +
            commandHandle.example
                .split('\n')
                .reduce((acc, val) => acc + '\`\`\`\n\`\`\`' + config.botPrefix + val) + '\`\`\`';

         await messageHandler.replyRichText({
            interaction,
            categories: [{
              title: LanguageHandler.language.commands.help.labels.command,
              text: `\`${config.botPrefix}${commandHandle.command}\``,
              inline: true,
            },
            {
              title: LanguageHandler.language.general.description,
              text: commandHandle.description(),
              inline: true,
            },
            {
              title: LanguageHandler.language.general.usage,
              text: `\`\`\`${config.botPrefix}${commandHandle.usage}\`\`\``,
            },
            {
              title: LanguageHandler.language.general.example,
              text: example,
            },
            ],
        });
      } else {
        await messageHandler.replyRichErrorText({
          interaction,
          title: 'Help Info',
          categories: [{
            title: 'Info',
            text: LanguageHandler.replaceArgs(LanguageHandler.language.commands.help.error.unknown, [config.botPrefix])
          }],
        });

      }
      return;
    }

    const categories: Map<string, string[]> = new Map();
    for(const cmd of this.commands) {
      let found: boolean = false;
      if(cmd.requirePermissions) {
        if (member.user.id === process.env.OWNER_ID) {
          found = true;
        }
        for (const memberRole of memberRoles.values()) {
          if(config.signupRoles.find((signupRole: string) => signupRole === memberRole.name)) {
            found = true;
            break;
          }
        }
      } else {
        found = true;
      }
      if(found) {
        if (categories.has(cmd.category)) {
          categories.get(cmd.category).push(cmd.command);
        } else {
          categories.set(cmd.category, new Array(cmd.command));
        }
      }
    }
    const embededCategories: {title: string, text: string, inline?: boolean}[] =[{
      title: 'Info',
      text: LanguageHandler.replaceArgs(LanguageHandler.language.commands.help.success.type, [config.botPrefix, LanguageHandler.language.commands.help.labels.command]),
    }];
    categories.forEach((value, key, map) => {
      const commands = '\`' + config.botPrefix + value
          .reduce((acc, val) => acc + '\`\n\`' + config.botPrefix + val) + '\`';
      embededCategories.push({
        title: key,
        text: commands,
        inline: true,
      });
    });
    await messageHandler.replyRichText({
      interaction,
      title: 'Help Info',
      categories: embededCategories,
      color: 0x616161
    });
  }
}