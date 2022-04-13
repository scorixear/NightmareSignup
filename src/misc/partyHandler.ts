import { BMSettings } from "../model/BMSettings";
import { GlobalRole } from "../model/GlobalRole";
import { Role } from "../model/Role";
import messageHandler from "./messageHandler";

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
  }

  public static async getCategories(event: number) {
    const users = await sqlHandler.getSignups(event);
    const guild = await discordHandler.fetchGuild((await sqlHandler.getDiscordMessage(event)).guildId);
    if (!guild) {
      return undefined;
    }
    const discordUsers: { userId: string, date: number, roles: string[] }[] = [];
    for (const user of users) {
      const member = await discordHandler.fetchMember(user.userId, guild);
      const roles  = await sqlHandler.getRoles(user.userId);
      if (member) {
        discordUsers.push({ userId: user.userId, date: user.date, roles });
      }
    }
    discordUsers.sort((a, b) => a.date - b.date);

    const numberOfParties = Math.ceil((discordUsers.length + 1) / 20.0);
    let bms = Math.max(PartyHandler.BmSettings.Minimum, Math.floor(numberOfParties / PartyHandler.BmSettings.BmEveryParty) * PartyHandler.BmSettings.BmPerParty);
    bms = Math.min(bms, discordUsers.filter((user) => user.roles.find((role, index) => role === "Battlemount") !== undefined).length);
    const parties: { userId: string, date: number, role: string }[][] = new Array(numberOfParties).fill([]);

    let missingPlayers = 19;
    console.log(numberOfParties);
    for (let i = 0; i < numberOfParties; i++) {
      console.log("================== DISCORD USERS =====================");
      console.log(discordUsers.length);
      console.log("Party Index: " + i);
      console.log(parties[i]);
      // add bms
      for (let bmi = 0; bmi < PartyHandler.BmSettings.BmPerParty && bmi < bms; bmi++) {
        const reply = this.retrieveBattleMountUser(discordUsers);
        if(reply.player) {
          discordUsers.splice(reply.index,1);
          parties[i].push({
            userId: reply.player.userId,
            date: reply.player.date,
            role: "Battlemount"
          });
          
        }
      }
      bms -= parties[i].length;
      missingPlayers -= parties[i].length;
      // add required roles


      for (const role of PartyHandler.Roles) {
        if (role.Required && role.Required > 0) {
          for (let roleIndex = 0; roleIndex < role.Required; roleIndex++) {
            const reply = this.retrieveDiscordUser(discordUsers, role);
            if(reply.player) {
              discordUsers.splice(reply.index, 1);
              parties[i].push({
                userId: reply.player.userId,
                date: reply.player.date,
                role: role.RoleName
              });
              missingPlayers--;
              console.log("Player Added: "+reply.player.userId);
              console.log("Discord User Length: " + discordUsers.length);
              console.log("Removed at index: " + reply.index);
            }
          }
        }
      }

      for(const globalRole of PartyHandler.GlobalRoles) {
          for(let gI = 0; gI < globalRole.Required; gI++) {
            if(missingPlayers === 0) {
              break;
            }
            const reply = this.addUserToParty(discordUsers, parties[i], globalRole);
            if (reply.player) {
              discordUsers.splice(reply.index, 1);
              parties[i].push({
                userId: reply.player.userId,
                date: reply.player.date,
                role: reply.player.role
              });
              missingPlayers--;
            } else {
              break;
            }
          }
      }
      for(const globalRole of PartyHandler.GlobalRoles) {
        while(missingPlayers > 0 && discordUsers.length > 0) {
          const reply = this.addUserToParty(discordUsers, parties[i], globalRole);
          if (reply.player) {
            discordUsers.splice(reply.index, 1);
            parties[i].push({
              userId: reply.player.userId,
              date: reply.player.date,
              role: reply.player.role
            });
            missingPlayers--;
          } else {
            break;
          }
        }
      }
      console.log("Finished Party " + i);
      console.log(parties[i]);
      missingPlayers = 20;
    }

    console.log("================== PARTIES =====================");
    // console.log(parties);
    const categories: {title: string, text: string, inline: boolean}[] = [];
    let partyIndex = 1;
    for(const party of parties) {
      const partyLines = [];
      for(const user of party) {
        partyLines.push(`<@${user.userId}> - ${user.role}`);
      }
      const partyCategories = messageHandler.splitInCategories(partyLines, languageHandler.replaceArgs(languageHandler.language.handlers.party.partyTitle,[partyIndex.toString()]));
      categories.push(...partyCategories);
      partyIndex++;
    }
    return categories;

  }

  private static addUserToParty(discordUsers: {userId: string, date: number, roles: string[]}[], party: {userId: string, date: number, role: string}[], globalRole: GlobalRole) {
    let i = 0;
    let returnValue;
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
        if(!role.Maximum || role.Maximum > party.filter(p=>p.role===role.PriorityRole || p.role===role.RoleName).length) {
          foundRole = role;
          break;
        }
      }
      if (foundRole) {
        returnValue = {
          userId: user.userId,
          date: user.date,
          role: foundRole.RoleName
        };
        break;
      }
      i++;
    }
    if(!returnValue) {
      i=0;
      for(const user of discordUsers) {
        const roles: Role[] = [];
        for(const role of user.roles) {
          const partyRole = PartyHandler.Roles.find(pr => pr.RoleName === role);
          if(partyRole && partyRole.GlobalRole === globalRole) {
            roles.push(partyRole);
          }
        }
        let foundRole;
        for(const role of roles) {
          if(!role.Maximum || role.Maximum > party.filter(p=>p.role === role.PriorityRole || p.role === role.RoleName).length)
          {
            foundRole = role;
            break;
          }
        }
        if(foundRole) {
          returnValue = {
            userId: user.userId,
            date: user.date,
            role: foundRole.RoleName
          };
          break;
        }
        i++;
      }
    }
    return {player: returnValue, index: i};
  }

  private static retrieveDiscordUser(discordUsers: { userId: string, date: number, roles: string[] }[], role: Role) {
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
        if (user.roles.find(value => value === role.RoleName) !== undefined) {
          returnValue = user;
          break;
        }
        i++;
      }
    }
    return {player: returnValue, index: i};
  }

  private static retrieveBattleMountUser(discordUsers: {userId: string, date: number, roles: string[]}[]) {
    let i = 0;
    let returnValue;
    for(const user of discordUsers) {
      if (user.roles.find(value => value === "Battlemount")!== undefined) {
        returnValue = user;
        break;
      }
      i++;
    }
    return {player: returnValue, index: i};
  }

}