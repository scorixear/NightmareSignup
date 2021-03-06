export class LanguageHandler {
  public static language = {
    commands: {
      help: {
        description: 'Returns a list of commands, you are able to use or informations about a specific command!',
        error: {
          unknown: 'This command is unknown. Use `$0help` for a list of commands.'
        },
        labels: {
          command: 'Command'
        },
        success: {
          type: 'Type in `$0<$1> [args]` to use a $1!'
        },
        options: {
          command: 'The command you need help with'
        }
      },
      signup: {
        description: 'Posts a Signup message into a specific channel',
        error: {
          missing_arguments_title: 'Missing Arguments',
          missing_arguments: 'There are arguments missing, see `$0help signup` for more information',
          voiceTitle: 'Wrong Channel',
          voiceDescription: 'The channel needs to be a Text channel!',
          eventTitle: 'Event already exists',
          eventDesc:
            'The Event `$0` at `$1` already exists.\nTo delete the event, please execute `$2deletesignup "$0" $1`',
          formatTitle: 'Wrong Format',
          formatDesc: 'Your Date and/or Time are in the wrong format.\nMake sure you follow DD.MM.YYYY HH:MM'
        },
        success: {
          title: 'Event created',
          description:
            'The Event `$0` at `$1` has been created.\nTo delete the event, please execute `$2deletesignup "$0" $1`\n The message can be found under $3'
        },
        options: {
          channel: 'The channel the Event will be posted in',
          event_name: 'The name of the Event',
          event_date: 'The date of the Event (Format DD.MM.YYYY)',
          event_time: 'The time of the Event (in UTC)',
          event_desc: 'The description shown in the Event Signup message',
          event_is_cta: 'If this event is a cta'
        }
      },
      deletesignup: {
        description: 'Deletes an Event registered with the `$0signup` command',
        error: {
          sql_title: 'Event not found',
          sql_desc: "Something went wrong. I could not find the event or couldn't delete it.",
          args_title: 'Missing Arguments',
          args_desc: 'There are Arguments missing. See `$0help deletesignup`.',
          formatTitle: 'Wrong Format',
          formatDesc: 'Your Date and/or Time are in the wrong format.\nMake sure you follow DD.MM.YYYY HH:MM'
        },
        success: {
          title: 'Event deleted',
          desc: 'Successfully deleted `$0`.'
        }
      },
      formParties: {
        success: {
          title: 'Message posted',
          description: 'Successfully posted the message in <#$0>.'
        }
      },
      unavailable: {
        description: 'Retrieves unavailable users from an Event registered with the `$0signup` command',
        error: {
          sql_title: 'Event not found',
          sql_desc: 'Something went wrong. I could not find the event.',
          args_title: 'Missing Arguments',
          args_desc: 'There are Arguments missing. See `$0help unavailable`.',
          formatTitle: 'Wrong Format',
          formatDesc: 'Your Date and/or Time are in the wrong format.\nMake sure you follow DD.MM.YYYY HH:MM'
        },
        success: {
          title: 'Unavailable Players'
        }
      },
      roles: {
        options: {
          user: 'Discord User',
          zvzrole: 'ZvZ Role'
        },
        add: {
          description: 'Adds a ZvZ Role to a Discord User and adds a Discord Role to the User',
          title: 'Roles added',
          successdesc: 'Successfully added Roles to $0.',
          error: {
            role_title: 'Role[s] not found',
            role_desc: 'One or more Roles do not exist.\n`$0`',
            discord: 'Error adding Discord-Role',
            discorddesc: 'Something went wrong while adding the Discord-Role to $0'
          },
          success: {
            added: 'Added Roles',
            ignored: 'Ignored Roles'
          }
        },
        check: {
          description: 'Returns Roles of a Discord User',
          title: 'Roles of $0'
        },
        clear: {
          description: 'Clears all ZvZ Roles of a Discord User and removes Discord Role',
          title: 'Roles cleared',
          successdesc: 'Successfully cleared $0 Roles.',
          error: {
            discord: 'Error removing Discord-Role',
            discorddesc: 'Something went wrong while removing the Discord-Role from $0'
          }
        },
        remove: {
          description: 'Removes a ZvZ Role from a Discord User',
          title: 'Role removed',
          successdesc: 'Successfully removed `$1` from $0.'
        },
        error: {
          sql_title: 'Internal Error',
          sql_desc: 'Something went wrong. I could not communicate with the database.'
        }
      },
      countplayers: {
        description: 'List all registered players',
        success: {
          title: 'Unique Players',
          count: 'Count',
          list: 'Players'
        }
      },
      countroles: {
        description: 'List all registered roles',
        success: {
          title: 'Players in Roles',
          list: 'Roles'
        }
      },
      attendance: {
        description:
          'List all players, that missed at least 2 cta-events\nor returns missing players for a specific event',
        success: {
          title: 'Attendance Tracker',
          description: 'A list of players and how many events they missed (out of all events registered)',
          list: 'Players',
          limit_desc: 'A list of players and how many events they missed (out of the last $0 events)'
        },
        missing_parameter: 'Missing Parameters, you need to specify the event name, event date and event time',
        error: {
          formatDesc: 'Your Date and/or Time are in the wrong format.\nMake sure you follow DD.MM.YYYY HH:MM',
          event_not_found: 'Could not find event'
        },
        description_event: 'Following players didn\'t react to the Event "$0" at $1 $2',
        event_name_desc: 'The name of the Event',
        event_date_desc: 'The date of the Event (Format DD.MM.YYYY)',
        event_time_desc: 'The time of the Event (Format HH:MM in UTC)',
        event_count_desc: 'The number of recent events to check'
      },
      vacation: {
        start: {
          description: 'Marks a player as on vacation',
          success: {
            title: 'Vacation started',
            description: 'Successfully marked <@$0> as on vacation.'
          }
        },
        end: {
          description: 'Unmarks a player from vacation',
          success: {
            title: 'Vacation ended',
            description: 'Successfully unmarked <@$0> from vacation.'
          }
        },
        remove: {
          description: 'Removes the latest vacation entry for a player',
          success: {
            title: 'Vacation removed',
            description: "Successfully removed <@$0>'s most recent vacation."
          }
        },
        check: {
          description: 'Check if player is currently on vacation',
          success: {
            title: 'Player is in vacation',
            description: '<@$0> is currently on vacation.'
          },
          not: {
            title: 'Player is not on vacation',
            description: '<@$0> is **not** currently on vacation.'
          }
        },
        options: {
          user: 'Discord User'
        },
        error: {
          title: 'Internal Error',
          description: 'Something went wrong. I could not communicate with the database.'
        },
        user_error: {
          title: 'User not found',
          description: 'Could not find user <@$0>.'
        }
      },
      optimalparty: {
        title: 'Optimal Party Setup',
        description: 'Returns the optimal party setup if every registered player signed up.',
        desc: 'This is the optimal Party Setup if $0 players signed up.'
      }
    },
    interactions: {
      signup: {
        already_signed_up_title: 'Already signed up',
        already_signed_up_desc: 'You already signed up for this Event.',
        edit_title: 'Edit your Information',
        edit_description: 'Please react with the given emoji to select which information you want to edit',
        error: {
          dmChannel:
            '<@$0> Seems like I am not allowed to send you a message. Make sure you allow users from this server to send you messages in the `Server Privacy Settings`',
          sql: 'Registration Error',
          sql_desc:
            'There was an error saving your data.\nPlease contact Scorix#0001 with a screenshot of this conversation.'
        },
        success: {
          title: 'Successfully signed up',
          description: 'We successfully signed you up for the upcoming event.'
        }
      },
      signout: {
        confirmation_title: 'Successfully signed out',
        confirmation_desc: 'We have successfully signed you out from the upcoming event!',
        error_title: 'Error while signing out!',
        error_desc: 'There was an error while signing you out.'
      },
      unavailable: {
        success: {
          title: 'Successfully marked as unavailable',
          description: 'We successfully marked you as unavailable for the upcoming event.'
        },
        error: {
          title: 'Already unavailable',
          description: 'You are already marked as unavailable for this event.'
        }
      }
    },
    handlers: {
      command: {
        error: {
          unknown: 'This command is unknown. Use `$0help` for a list of commands.',
          generic_error: 'There was an Error executing the command `$0$1`.',
          general_format: 'Your command is not well formated:\n`$0<Command> [args] [--<option> [option-arg]]`',
          args_format:
            'Your arguments are not well formated.\n*Hint: Arguments with spaces must be surrounded by one " and cannot contain any additional "*',
          params_format:
            "Your options are not well formated.\n*Hint: Options must start with '--' and __can__ contain one additional argument.*"
        }
      },
      emoji: {
        labels: {
          did_you_mean: 'Did you mean',
          synonyms: 'Synonyms',
          usage: 'React with the shown number to execute that command!'
        }
      },
      permissions: {
        error: 'Invalid permissions to use `$0$1`!'
      },
      party: {
        title: 'Party Setup',
        description: 'This is the Party Setup for the Event I have replied to.',
        partyTitle: 'Party #$0'
      }
    },
    messages: {},
    general: {
      error: 'Error',
      description: 'Description',
      example: 'Example',
      usage: 'Usage',
      reason: 'Reason',
      server: 'Server',
      user: 'User',
      message: 'Message',
      title: 'Title'
    },
    error: {
      user_mention: 'You must mention a user',
      user_not_found: 'User not found',
      invalid_permissions: 'Invalid permissions',
      invalid_usage: 'Invalid usage'
    }
  };
  /**
   * Replaces preset args with values in a string
   * @param input
   * @param args
   * @return the filled string
   */
  public static replaceArgs(input: string, args: string[]) {
    for (let i = 0; i < args.length; i++) {
      input = input.split('$' + i).join(args[i]);
    }
    return input;
  }
}
