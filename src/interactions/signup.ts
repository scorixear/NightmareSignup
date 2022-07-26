import { ButtonInteractionHandle } from "../model/ButtonInteractionHandle";
import { ButtonInteraction, Guild, GuildMember, User } from "discord.js";
import InteractionHandler from "../handlers/interactionHandler";
import { LanguageHandler } from "../handlers/languageHandler";
import SqlHandler from "../handlers/sqlHandler";
import { updateUnavailable, updateSignupMessage } from '../commands/Moderation/signup';
import messageHandler from '../handlers/messageHandler';
import dateHandler from "../handlers/dateHandler";
import { Logger, WARNINGLEVEL } from "../helpers/logger";

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
      await messageHandler.replyRichText({
        interaction,
        title: LanguageHandler.language.interactions.unavailable.success.title,
        description: LanguageHandler.language.interactions.unavailable.success.description,
        ephemeral: true,
      });
      Logger.Log(`${(interaction.member.user as User).tag} has signed out of event ${event} [Unavailable]`, WARNINGLEVEL.INFO);
    } else {
      Logger.Log(`${(interaction.member.user as User).tag} marked twice as unavailable ${event} [Unavailable]`, WARNINGLEVEL.INFO);
      await messageHandler.replyRichErrorText({
        interaction,
        title: LanguageHandler.language.interactions.unavailable.error.title,
        description: LanguageHandler.language.interactions.unavailable.error.description,
      });
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
    Logger.Log(`${(interaction.member.user as User).tag} has signed up for event ${event} [Signup]`, WARNINGLEVEL.INFO);
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
        Logger.Error("Error while sending already signed up message", err, WARNINGLEVEL.WARN);
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
          Logger.Error("Error while sending sign up message", err, WARNINGLEVEL.WARN);
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
          Logger.Error("Error while sending sign up error message", err, WARNINGLEVEL.WARN);
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
          Logger.Error("Error while sending sign out error message", err, WARNINGLEVEL.WARN);
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
      Logger.Log(`${(interaction.member.user as User).tag} has signed out of event ${event} [Signout]`, WARNINGLEVEL.INFO);
    } catch (err) {
      Logger.Error("Error while sending sign out confirmation message", err, WARNINGLEVEL.WARN);
    }
  }
}

export default {
  UnavailableEvent,
  SignupEvent,
  SignoutEvent
}