import {Auth, google, sheets_v4} from 'googleapis';
import { BMSettings } from '../model/BMSettings';
import { GlobalRole } from '../model/GlobalRole';
import { Role } from '../model/Role';
export default class GoogleSheetsHandler {
  private googleSheetsInstance: sheets_v4.Sheets;

  constructor() {
    this.googleSheetsInstance = google.sheets('v4');
    const auth: Auth.GoogleAuth = new google.auth.GoogleAuth({
      keyFile: './src/assets/key.json',
      // Scopes can be specified either as an array or as a single, space-delimited string.
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });

    // Acquire an auth client, and bind it to all future calls
    auth.getClient().then((authClient)=> {
      google.options({auth: authClient});
    });
  }

  /**
   *
   * @param sheetId
   * @param range
   * @return
   */
  private async retrieveData() {
    const readData = await this.googleSheetsInstance.spreadsheets.values.get( {
      spreadsheetId: process.env.GOOGLESHEETSID,
      range: "A2:J",
    });
    return readData.data;
  }

  public async retrieveCompositionData() {
    const data = await this.retrieveData();
    const rolesData = data.values[0]
    const required = data.values[1];
    const maximum = data.values[2];
    const globalRoleAssignment = data.values[3];
    const globalRolesData = data.values[4];
    const globalRequired = data.values[5];
    const globalFillUpPosition = data.values[6];
    const bmPerParty = data.values[7][0];
    const bmEveryParty = data.values[8][0];
    const minimumBms = data.values[9][0];
    const roles: Role[] = [];
    const globalRoles: GlobalRole[] = [];
    const bmSettings: BMSettings = { 
      BmPerParty: bmPerParty, 
      BmEveryParty: bmEveryParty, 
      Minimum: minimumBms
    };
    globalRolesData.forEach((value, index) => {
      globalRoles.push({
        Name: value,
        Required: globalRequired[index],
        FillUpOrder: globalFillUpPosition[index]
      });
    });
    rolesData.forEach((value, index) => {
      roles.push({
        DiscordRole: value,
        Required: required[index],
        Maximum: maximum[index],
        GlobalRole: globalRoles.find(gr => gr.Name===globalRoleAssignment[index])
      });
    });
    return {
      Roles: roles,
      GlobalRoles: globalRoles,
      BmSettings: bmSettings
    };
  }
}