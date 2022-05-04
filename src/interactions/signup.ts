import { ButtonInteractionHandle } from "../model/ButtonInteractionHandle";
import { ButtonInteraction, Guild, GuildMember } from "discord.js";
import InteractionHandler from "../misc/interactionHandler";
import { LanguageHandler } from "../misc/languageHandler";
import SqlHandler from "../misc/sqlHandler";
import { updateUnavailable, updateSignupMessage } from '../commands/Moderation/signup';
import messageHandler from '../misc/messageHandler';
import dateHandler from "../misc/dateHandler";

declare const sqlHandler: SqlHandler;
declare const languageHandler: LanguageHandler;
declare const interactionHandler: InteractionHandler;

class UnavailableEvent extends ButtonInteractionHandle {
  override async handle(interaction: ButtonInteraction) {
    super.handle(interaction);
    const userId = interaction.member.user.id;
    const event = parseInt(interaction.customId.slice(this.id.length), 10);
    if (!(await sqlHandler.getSqlUnavailable().isUnavailable(event, userId))) {
      if (await sqlHandler.getSqlSignup().isSignedIn(event, userId)) {
        if (!await sqlHandler.getSqlSignup().signOut(event, userId)) {
          return;
        }
        await updateSignupMessage(event);
      }
      await sqlHandler.getSqlUnavailable().setUnavailable(event, userId);
      await updateUnavailable(event);
      console.log('User signed out', userId, event);
    }
  }
}

class SignupEvent extends ButtonInteractionHandle {
  override async handle(interaction: ButtonInteraction) {
    super.handle(interaction);
    // Retrieve user id from interaction
    const userId = interaction.member.user.id;

    // create or retrieve Discord direct Message Channel between user and bot
    const event = parseInt(interaction.customId.slice(this.id.length), 10);
    // create or retrieve Discord direct Message Channel between user and bot
    const channel = await (interaction.member as GuildMember).createDM();
    console.log('Signup request received', userId, event);
    // If player already registered himself once

    // check if sql database has him signed up
    if (await sqlHandler.getSqlSignup().isSignedIn(event, userId)) {
      try {
        // send already signed up message to user
        await channel.send(await messageHandler.getRichTextExplicitDefault({
          guild: interaction.guild,
          title: languageHandler.language.interactions.signup.already_signed_up_title,
          description: languageHandler.language.interactions.signup.already_signed_up_desc,
          color: 0xFF8888,
        }));
      } catch (err) {
        console.error('Error sending DM');
        try {
          await interaction.deferUpdate();
        } catch {}
        await interaction.followUp({ content: languageHandler.replaceArgs(languageHandler.language.interactions.signup.error.dmChannel, [userId]), ephemeral: true });
      }
      // else sign up user
    } else {
      const success = await sqlHandler.getSqlSignup().signIn(event, userId, dateHandler.getUTCTimestampFromDate(new Date()));
      if (success) {
        if(await sqlHandler.getSqlUnavailable().isUnavailable(event, userId)) {
          await sqlHandler.getSqlUnavailable().removeUnavailable(event, userId);
          await updateUnavailable(event);
        }
        await updateSignupMessage(event);
        try {
          await channel.send(await messageHandler.getRichTextExplicitDefault({
            guild: interaction.guild,
            title: languageHandler.language.interactions.signup.success.title,
            description: languageHandler.language.interactions.signup.success.description,
            color: 0x00cc00,
          }));
        } catch (err) {
          console.error('Error sending DM');
          try {
            await interaction.deferUpdate();
          } catch {}
          await interaction.followUp({ content: languageHandler.replaceArgs(languageHandler.language.interactions.signup.error.dmChannel, [userId]), ephemeral: true });
        }
      } else {
        try {
          await channel.send(await messageHandler.getRichTextExplicitDefault({
            guild: interaction.guild,
            title: languageHandler.language.interactions.signup.error.sql,
            description: languageHandler.language.interactions.signup.error.sql_desc,
            color: 0xFF8888,
          }));
        } catch (err) {
          console.error('Error sending DM');
          try {
            await interaction.deferUpdate();
          } catch {}
          await interaction.followUp({ content: languageHandler.replaceArgs(languageHandler.language.interactions.signup.error.dmChannel, [userId]), ephemeral: true });
        }
      }
    }
  }
}

class SignoutEvent extends ButtonInteractionHandle {
  override async handle(interaction: ButtonInteraction) {
    super.handle(interaction);

    const userId = interaction.member.user.id;
    const event = parseInt(interaction.customId.slice(this.id.length), 10);
    console.log('User signout received', userId, event);
    // create or retrieve Direct Message channel
    const channel = await (interaction.member as GuildMember).createDM();
    // retrieve Players data from google sheets

    if (await sqlHandler.getSqlSignup().isSignedIn(event, userId)) {
      if (!await sqlHandler.getSqlSignup().signOut(event, userId)) {
        try {
          // send Confirmation message to channel that user was signed out
          await channel.send(await messageHandler.getRichTextExplicitDefault({
            title: languageHandler.language.interactions.signout.error_title,
            description: languageHandler.language.interactions.signout.error_desc,
            color: 0xFF8888,
          }));
        } catch (err) {
          console.error('Error sending DM');
          try {
            await interaction.deferUpdate();
          } catch {}
          await interaction.followUp({ content: languageHandler.replaceArgs(languageHandler.language.interactions.signup.error.dmChannel, [userId]), ephemeral: true });
        }
        return;
      }
      await updateSignupMessage(event);
    }
    if(!(await sqlHandler.getSqlUnavailable().isUnavailable(event, userId))) {
      await sqlHandler.getSqlUnavailable().setUnavailable(event, userId);
      await updateUnavailable(event);
    }
    try {
      await channel.send(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        title: languageHandler.language.interactions.signout.confirmation_title,
        description: languageHandler.language.interactions.signout.confirmation_desc,
        color: 0x00cc00,
      }));
      console.log('User signed out', userId, event);
    } catch (err) {
      console.error('Error sending DM');
      try {
        await interaction.deferUpdate();
      } catch {}
      await interaction.followUp({content: languageHandler.replaceArgs(languageHandler.language.interactions.signup.error.dmChannel, [userId]), ephemeral: true});
    }
  }
}

export default {
  UnavailableEvent,
  SignupEvent,
  SignoutEvent
}