import { GuildMember, Role as DiscordRole } from "discord.js";
import { BMSettings } from "../model/BMSettings";
import { GlobalRole } from "../model/GlobalRole";
import { Role } from "../model/Role";

export default class PartyHandler {

  static Roles: Role[];
  static GlobalRoles: GlobalRole[];
  static BmSettings: BMSettings;


  public static async updateComposition() {
    const result = await googleSheetsHandler.retrieveCompositionData();
    PartyHandler.Roles = result.Roles;
    PartyHandler.GlobalRoles = result.GlobalRoles;
    PartyHandler.GlobalRoles.sort((a, b) => a.FillUpOrder - b.FillUpOrder);
    PartyHandler.BmSettings = result.BmSettings;

    const guild = discordHandler.client.guilds.cache.first();
    if(guild) {
      const roles = await guild.roles.fetch();
      for (const role of PartyHandler.Roles) {
        role.DiscordRole = roles.find((value, key) => value.name === role.RoleName);
        role.PriorityRole = roles.find((value, key) => value.name === "FullSpec "+role.RoleName);
      }
    }


  }

  public static async getCategories(event: number) {
    const users = await sqlHandler.getSignups(event);
    const guild = await discordHandler.client.guilds.fetch((await sqlHandler.getDiscordMessage(event)).guildId);
    if (!guild) {
      return undefined;
    }
    const discordUsers: { member: GuildMember, date: number, roles: DiscordRole[] }[] = [];
    for (const user of users) {
      const member = await guild.members.fetch(user.userId);
      if (member) {
        discordUsers.push({ member, date: user.date, roles: member.roles.cache.map(r=>r) });
      }
    }
    discordUsers.sort((a, b) => a.date - b.date);

    const numberOfParties = Math.ceil((discordUsers.length + 1) / 20.0);
    let bms = Math.max(PartyHandler.BmSettings.Minimum, Math.floor(numberOfParties / PartyHandler.BmSettings.BmEveryParty) * PartyHandler.BmSettings.BmPerParty);
    bms = Math.min(bms, discordUsers.filter((user) => user.roles.find((role, index) => role.name === "Battlemount") !== undefined).length);
    const parties: { member: GuildMember, date: number, role: DiscordRole }[][] = new Array(numberOfParties).fill([]);

    let missingPlayers = 19;
    for (let i = 0; i < numberOfParties; i++) {
      // add bms
      for (let bmi = 0; bmi < PartyHandler.BmSettings.BmPerParty && bmi < bms; bmi++) {
        const bmPlayer = this.retrieveBattleMountUser(discordUsers);
        parties[i].push({
          member: bmPlayer.member,
          date: bmPlayer.date,
          role: bmPlayer.member.roles.cache.find(r => r.name === "Battlemount")
        });
      }
      bms -= parties[i].length;
      missingPlayers -= parties[i].length;
      // add required roles


      for (const role of PartyHandler.Roles) {
        if (role.Required && role.Required > 0) {
          for (let roleIndex = 0; roleIndex < role.Required; roleIndex++) {
            const user = this.retrieveDiscordUser(discordUsers, role);
            if(user) {
              parties[i].push({
                member: user.member,
                date: user.date,
                role: role.DiscordRole
              });
              missingPlayers--;
            }
          }
        }
      }

      for(const globalRole of PartyHandler.GlobalRoles) {
          for(let gI = 0; gI < globalRole.Required; gI++) {
            if(missingPlayers === 0) {
              break;
            }
            const user = this.addUserToParty(discordUsers, parties[i], globalRole);
            if (!user) {
              break;
            }
            missingPlayers--;
          }
      }
      for(const globalRole of PartyHandler.GlobalRoles) {
        while(missingPlayers > 0 && discordUsers.length > 0) {
          const user = this.addUserToParty(discordUsers, parties[i], globalRole);
          if(!user) {
            break;
          }
        }
      }
      missingPlayers = 20;
    }

    const categories: {title: string, text: string, inline: boolean}[] = [];
    let partyIndex = 1;
    let inline = false;
    for(const party of parties) {
      let partyString = "";
      for(const user of party) {
        partyString += `<@${user.member.id}> - <@&${user.role.id}>\n`
      }
      categories.push({
        title: languageHandler.replaceArgs(languageHandler.language.handlers.party.partyTitle,[partyIndex.toString()]),
        text: partyString,
        inline
      });
      inline = true;
      partyIndex++;
    }
    return categories;

  }

  private static addUserToParty(discordUsers: {member: GuildMember, date: number, roles: DiscordRole[]}[], party: {member: GuildMember, date: number, role: DiscordRole}[], globalRole: GlobalRole) {
    let i = 0;
    let foundUser;
    // find user of list
    for(const user of discordUsers) {
      // map user Roles (DiscordRoles) to BotRoles and filter only BotRoles that have the chorrect global role
      const roles: Role[] = [];
      for(const role of user.roles) {
        const partyRole = PartyHandler.Roles.find(pr => pr.PriorityRole === role);
        if(partyRole && partyRole.GlobalRole === globalRole) {
          roles.push(partyRole);
        }
      }
      // if no role found for priority, foundRole will be undefined
      // if roles are found that are priority and fit to GlobalRole
      let foundRole;
      for(const role of roles) {
        // get first BotRole that does not exceed maximum role cound (both Priority and DiscordRole)
        if(!role.Maximum || role.Maximum > party.filter(p=>p.role===role.PriorityRole || p.role===role.DiscordRole).length) {
          foundRole = role;
          break;
        }
      }
      if (foundRole) {
        foundUser = user;
        party.push({
          member: user.member,
          date: user.date,
          role: foundRole.DiscordRole
        });
        break;
      }
      i++;
    }
    if(!foundUser) {
      i=0;
      for(const user of discordUsers) {
        const roles: Role[] = [];
        for(const role of user.roles) {
          const partyRole = PartyHandler.Roles.find(pr => pr.DiscordRole === role);
          if(partyRole && partyRole.GlobalRole === globalRole) {
            roles.push(partyRole);
          }
        }
        let foundRole;
        for(const role of roles) {
          if(!role.Maximum || role.Maximum > party.filter(p=>p.role === role.PriorityRole || p.role === role.DiscordRole).length)
          {
            foundRole = role;
            break;
          }
        }
        if(foundRole) {
          foundUser = user;
          party.push({
            member: user.member,
            date: user.date,
            role: foundRole.DiscordRole
          });
          break;
        }
        i++;
      }
    }
    if(foundUser) {
      discordUsers.splice(i, 1)
    }
    return foundUser;
  }

  private static retrieveDiscordUser(discordUsers: { member: GuildMember, date: number, roles: DiscordRole[] }[], role: Role) {
    let i = 0;
    let returnValue;
    for (const user of discordUsers) {
      if (user.roles.find(value => value === role.PriorityRole) !== undefined) {
        returnValue = user;
        break;
      }
      i++;
    }
    if(!returnValue) {
      i=0
      for (const user of discordUsers) {
        if (user.roles.find(value => value === role.DiscordRole) !== undefined) {
          returnValue = user;
          break;
        }
        i++;
      }
    }
    if (returnValue) {
      discordUsers.splice(i, 1);
    }
    return returnValue;
  }

  private static retrieveBattleMountUser(discordUsers: {member: GuildMember, date: number, roles: DiscordRole[]}[]) {
    let i = 0;
    let returnValue;
    for(const user of discordUsers) {
      if (user.roles.find(value => value.name === "Battlemount")!== undefined) {
        returnValue = user;
        break;
      }
      i++;
    }
    if(returnValue) {
      discordUsers.splice(i,1);
    }
    return returnValue;
  }

}