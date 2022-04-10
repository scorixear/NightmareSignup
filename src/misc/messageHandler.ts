import {DMChannel, Guild, Message, MessageActionRow, MessageEmbed, TextBasedChannel, TextChannel, User, UserResolvable} from 'discord.js';

/**
 * Prints a MessageEmbed
 * @param param0
 */
 async function sendRichTextDefault(param0 :{
  msg: Message,
  title?: string,
  categories?: {title: string, text?: string, inline?:boolean}[],
  color?: number,
  description?: string,
  thumbnail?: string,
  url?: string,
  components?: MessageActionRow[],
}) {
  return await sendRichText(param0.msg, param0.title, param0.categories, param0.color, param0.description, param0.thumbnail, param0.url, param0.components);
}

/**
 * Prints a Message Embed
 */
async function sendRichTextDefaultExplicit(param0: {
  guild?: Guild,
  channel: TextBasedChannel,
  author?: User,
  title?: string,
  categories?: {title: string, text?: string, inline?: boolean}[],
  color?: number,
  description?: string,
  thumbnail?: string,
  url?: string,
  components?: MessageActionRow[],
}) {
  return await sendRichTextExplicit(param0.guild, param0.channel, param0.author, param0.title, param0.categories, param0.color, param0.description, param0.thumbnail, param0.url, param0.components);
}

/**
 * Prints a Message Embed
 * @param guild the Guild to print to
 * @param channel the channel to print to
 * @param author the author of the message
 * @param title the title
 * @param categories the fields
 * @param color hex rgb color
 * @param description
 * @param thumbnail thumbnail url string
 * @param url an url
 * @param buttons
 */
async function sendRichTextExplicit(guild: Guild, channel: TextBasedChannel, author: User, title: string, categories: {title: string, text?: string, inline?: boolean}[], color: number, description: string, thumbnail: string, url: string, components: MessageActionRow[]) {
  channel.sendTyping();
  const richText: MessageEmbed = new MessageEmbed();
  if (title) {
    richText.setTitle(title);
  }

  if (categories) {
    categories.forEach((category) => {
      richText.addField(category.title, category.text || '\u200b', category.inline || false);
    });
  }
  if (color) {
    richText.setColor(color);
  }
  if (description) {
    richText.setDescription(description);
  }
  if (thumbnail) {
    richText.setThumbnail(thumbnail);
  }

  if (guild && author) {
    const guildMember = await guild.members.fetch(author);
    richText.setFooter({text: guildMember.nickname?guildMember.nickname.toString():guildMember.user.username.toString(), iconURL: author.avatarURL()});
  }

  richText.setTimestamp(new Date());
  if (url) {
    richText.setURL(url);
  }

  if (components) {
    return channel.send({embeds: [richText], components});
  }
  return channel.send({embeds: [richText]});
}

/**
 * Returns a Message Embed
 */
async function getRichTextExplicitDefault(param0: {
  guild?: Guild,
  author?: User,
  title?: string,
  categories?: {title: string, text?: string, inline?: boolean}[],
  color?: number,
  description?: string,
  thumbnail?: string,
  url?: string,
  components?: MessageActionRow[],
}) {
  return getRichTextExplicit(param0.guild, param0.author, param0.title, param0.categories, param0.color, param0.description, param0.thumbnail, param0.url, param0.components);
}

async function getRichTextExplicit(guild: Guild, author: User, title: string, categories: {title: string, text?: string, inline?: boolean}[], color: number, description: string, thumbnail: string, url: string, components: MessageActionRow[]) {
  const richText: MessageEmbed = new MessageEmbed();
  if (title) {
    richText.setTitle(title);
  }

  if (categories) {
    categories.forEach((category) => {
      richText.addField(category.title, category.text || '\u200b', category.inline || false);
    });
  }
  if (color) {
    richText.setColor(color);
  }
  if (description) {
    richText.setDescription(description);
  }
  if (thumbnail) {
    richText.setThumbnail(thumbnail);
  }

  if (guild && author) {
    const guildMember = await guild.members.fetch(author);
    richText.setFooter({text: guildMember.nickname?guildMember.nickname.toString():guildMember.user.username.toString(), iconURL: author.avatarURL()});
  }

  richText.setTimestamp(new Date());
  if (url) {
    richText.setURL(url.toString());
  }

  let returnValue: {embeds: MessageEmbed[], components?: MessageActionRow[]} = {embeds: [richText]};

  if (components) {
    returnValue = {embeds: [richText], components};
  }
  return returnValue;
}

/**
 * Prints a MessageEmbed
 * @param msg the message object to print from
 * @param title
 * @param categories the fields to add
 * @param color hex rgb number
 * @param image image path
 * @param description
 * @param thumbnail thumbnail url
 * @param url
 * @param buttons
 */
async function sendRichText(msg: Message, title: string, categories: {title: string, text?: string, inline?: boolean}[], color: number, description: string, thumbnail: string, url: string, components: MessageActionRow[]) {
  return await sendRichTextExplicit(msg.guild, msg.channel, msg.author,
      title, categories, color, description, thumbnail, url, components);
}

function splitInCategories(lines: string[], heading: string)
{
  // Clone lines array
  const linesClone = lines.slice();
  // categories
  const categoryStrings: string[] = [''];
  // count total lines
  const lineCount = lines.length;
  // as long as we need to add lines
  while (linesClone.length > 0) {
    const currentString = categoryStrings[categoryStrings.length - 1];
    // if current category + this line is not too long
    if (currentString.length + linesClone[0].length + 1 < 1024) {
      categoryStrings[categoryStrings.length - 1] = currentString + linesClone.shift() + '\n';
    } else {
      // remove last newline character
      categoryStrings[categoryStrings.length - 1] = categoryStrings[categoryStrings.length - 1].slice(0,-1);
      // add new category
      categoryStrings.push(linesClone.shift() + '\n');
    }
  }
  categoryStrings[categoryStrings.length - 1] = categoryStrings[categoryStrings.length - 1].slice(0,-1)
  const categories = [
    {
      title: heading,
      text: categoryStrings[0],
      inline: true,
    }
  ];
  for (let i = 1; i < categoryStrings.length; i++) {
    categories.push({
      title: '\u200b',
      text: categoryStrings[i],
      inline: true,
    });
  }
  return categories;
}

export default {
  sendRichText,
  sendRichTextExplicit,
  sendRichTextDefault,
  sendRichTextDefaultExplicit,
  getRichTextExplicit,
  getRichTextExplicitDefault,
  splitInCategories,
};
