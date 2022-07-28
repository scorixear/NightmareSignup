import { ButtonInteraction, User } from 'discord.js';

import { LanguageHandler } from '../handlers/languageHandler';
import SqlHandler from '../handlers/sqlHandler';
import { updateUnavailable, updateSignupMessage } from '../commands/Moderation/signup';

import dateHandler from '../handlers/dateHandler';
import { ButtonInteractionModel, Logger, MessageHandler, WARNINGLEVEL } from 'discord.ts-architecture';

declare const sqlHandler: SqlHandler;

class UnavailableEvent extends ButtonInteractionModel {
  override async handle(interaction: ButtonInteraction) {
    await super.handle(interaction);
    const userId = interaction.member.user.id;
    const event = parseInt(interaction.customId.slice(this.id.length), 10);
    if (!(await sqlHandler.getSqlUnavailable().isUnavailable(event, userId))) {
      if (await sqlHandler.getSqlSignup().isSignedIn(event, userId)) {
        if (!(await sqlHandler.getSqlSignup().signOut(event, userId))) {
          return;
        }
        await updateSignupMessage(event);
      }
      await sqlHandler.getSqlUnavailable().setUnavailable(event, userId);
      await updateUnavailable(event);
      await MessageHandler.reply({
        interaction,
        title: LanguageHandler.language.interactions.unavailable.success.title,
        description: LanguageHandler.language.interactions.unavailable.success.description,
        ephemeral: true
      });
      Logger.info(`${(interaction.member.user as User).tag} has signed out of event ${event} [Unavailable]`);
    } else {
      Logger.info(`${(interaction.member.user as User).tag} marked twice as unavailable ${event} [Unavailable]`);
      await MessageHandler.replyError({
        interaction,
        title: LanguageHandler.language.interactions.unavailable.error.title,
        description: LanguageHandler.language.interactions.unavailable.error.description
      });
    }
  }
}

class SignupEvent extends ButtonInteractionModel {
  override async handle(interaction: ButtonInteraction) {
    await super.handle(interaction);
    // Retrieve user id from interaction
    const userId = interaction.member.user.id;

    // create or retrieve Discord direct Message Channel between user and bot
    const event = parseInt(interaction.customId.slice(this.id.length), 10);
    Logger.info(`${(interaction.member.user as User).tag} has signed up for event ${event} [Signup]`);
    // If player already registered himself once

    // check if sql database has him signed up
    if (await sqlHandler.getSqlSignup().isSignedIn(event, userId)) {
      try {
        await MessageHandler.replyError({
          interaction,
          title: LanguageHandler.language.interactions.signup.already_signed_up_title,
          description: LanguageHandler.language.interactions.signup.already_signed_up_desc,
          color: 0xff8888
        });
        // send already signed up message to user
      } catch (err) {
        Logger.exception('Error while sending already signed up message', err, WARNINGLEVEL.WARN);
      }
      // else sign up user
    } else {
      const success = await sqlHandler
        .getSqlSignup()
        .signIn(event, userId, dateHandler.getUTCTimestampFromDate(new Date()));
      if (success) {
        if (await sqlHandler.getSqlUnavailable().isUnavailable(event, userId)) {
          await sqlHandler.getSqlUnavailable().removeUnavailable(event, userId);
          await updateUnavailable(event);
        }
        await updateSignupMessage(event);
        try {
          await MessageHandler.reply({
            interaction,
            title: LanguageHandler.language.interactions.signup.success.title,
            description: LanguageHandler.language.interactions.signup.success.description,
            color: 0x00cc00,
            ephemeral: true
          });
        } catch (err) {
          Logger.exception('Error while sending sign up message', err, WARNINGLEVEL.WARN);
        }
      } else {
        try {
          await MessageHandler.replyError({
            interaction,
            title: LanguageHandler.language.interactions.signup.error.sql,
            description: LanguageHandler.language.interactions.signup.error.sql_desc,
            color: 0xff8888
          });
        } catch (err) {
          Logger.exception('Error while sending sign up error message', err, WARNINGLEVEL.WARN);
        }
      }
    }
  }
}

class SignoutEvent extends ButtonInteractionModel {
  override async handle(interaction: ButtonInteraction) {
    await super.handle(interaction);

    const userId = interaction.member.user.id;
    const event = parseInt(interaction.customId.slice(this.id.length), 10);

    // retrieve Players data from google sheets

    if (await sqlHandler.getSqlSignup().isSignedIn(event, userId)) {
      if (!(await sqlHandler.getSqlSignup().signOut(event, userId))) {
        try {
          // send Confirmation message to channel that user was signed out
          await MessageHandler.replyError({
            interaction,
            title: LanguageHandler.language.interactions.signout.error_title,
            description: LanguageHandler.language.interactions.signout.error_desc,
            color: 0xff8888
          });
        } catch (err) {
          Logger.exception('Error while sending sign out error message', err, WARNINGLEVEL.WARN);
        }
        return;
      }
      await updateSignupMessage(event);
    }
    if (!(await sqlHandler.getSqlUnavailable().isUnavailable(event, userId))) {
      await sqlHandler.getSqlUnavailable().setUnavailable(event, userId);
      await updateUnavailable(event);
    }
    try {
      await MessageHandler.reply({
        interaction,
        title: LanguageHandler.language.interactions.signout.confirmation_title,
        description: LanguageHandler.language.interactions.signout.confirmation_desc,
        color: 0x00cc00,
        ephemeral: true
      });
      Logger.info(`${(interaction.member.user as User).tag} has signed out of event ${event} [Signout]`);
    } catch (err) {
      Logger.exception('Error while sending sign out confirmation message', err, WARNINGLEVEL.WARN);
    }
  }
}

export default {
  UnavailableEvent,
  SignupEvent,
  SignoutEvent
};
