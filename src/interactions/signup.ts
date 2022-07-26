import { ButtonInteractionHandle } from "../model/ButtonInteractionHandle";
import { ButtonInteraction, Guild, GuildMember } from "discord.js";
import InteractionHandler from "../misc/interactionHandler";
import { LanguageHandler } from "../misc/LanguageHandler";
import SqlHandler from "../misc/sqlHandler";
import { updateUnavailable, updateSignupMessage } from '../commands/Moderation/signup';
import messageHandler from '../misc/messageHandler';
import dateHandler from "../misc/dateHandler";

declare const sqlHandler: SqlHandler;
declare const interactionHandler: InteractionHandler;

class UnavailableEvent extends ButtonInteractionHandle {
  override async handle(interaction: ButtonInteraction) {
    await super.handle(interaction);
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
      messageHandler.replyRichText({
        interaction,
        title: LanguageHandler.language.interactions.unavailable.success.title,
        description: LanguageHandler.language.interactions.unavailable.success.description,
        ephemeral: true,
      });
      console.log('User signed out', userId, event);
    }
  }
}

class SignupEvent extends ButtonInteractionHandle {
  override async handle(interaction: ButtonInteraction) {
    await super.handle(interaction);
    // Retrieve user id from interaction
    const userId = interaction.member.user.id;

    // create or retrieve Discord direct Message Channel between user and bot
    const event = parseInt(interaction.customId.slice(this.id.length), 10);
    console.log('Signup request received', userId, event);
    // If player already registered himself once

    // check if sql database has him signed up
    if (await sqlHandler.getSqlSignup().isSignedIn(event, userId)) {
      try {
        await messageHandler.replyRichErrorText({
          interaction,
          title: LanguageHandler.language.interactions.signup.already_signed_up_title,
          description: LanguageHandler.language.interactions.signup.already_signed_up_desc,
          color: 0xFF8888,
        });
        // send already signed up message to user
      } catch (err) {
        console.error('Error sending Reply');
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
          await messageHandler.replyRichText({
            interaction,
            title: LanguageHandler.language.interactions.signup.success.title,
            description: LanguageHandler.language.interactions.signup.success.description,
            color: 0x00cc00,
            ephemeral: true,
          });
        } catch (err) {
          console.error('Error sending Reply');
        }
      } else {
        try {
          await messageHandler.replyRichErrorText({
            interaction,
            title: LanguageHandler.language.interactions.signup.error.sql,
            description: LanguageHandler.language.interactions.signup.error.sql_desc,
            color: 0xFF8888,
          });
        } catch (err) {
          console.error('Error sending Reply');
        }
      }
    }
  }
}

class SignoutEvent extends ButtonInteractionHandle {
  override async handle(interaction: ButtonInteraction) {
    await super.handle(interaction);

    const userId = interaction.member.user.id;
    const event = parseInt(interaction.customId.slice(this.id.length), 10);
    console.log('User signout received', userId, event);
    // retrieve Players data from google sheets

    if (await sqlHandler.getSqlSignup().isSignedIn(event, userId)) {
      if (!await sqlHandler.getSqlSignup().signOut(event, userId)) {
        try {
          // send Confirmation message to channel that user was signed out
          await messageHandler.replyRichErrorText({
            interaction,
            title: LanguageHandler.language.interactions.signout.error_title,
            description: LanguageHandler.language.interactions.signout.error_desc,
            color: 0xFF8888,
          });
        } catch (err) {
          console.error('Error sending Reply');
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
      await messageHandler.replyRichText({
        interaction,
        title: LanguageHandler.language.interactions.signout.confirmation_title,
        description: LanguageHandler.language.interactions.signout.confirmation_desc,
        color: 0x00cc00,
        ephemeral: true,
      });
      console.log('User signed out', userId, event);
    } catch (err) {
      console.error('Error sending Reply');
    }
  }
}

export default {
  UnavailableEvent,
  SignupEvent,
  SignoutEvent
}