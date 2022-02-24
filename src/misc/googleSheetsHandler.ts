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
  private async retrieveData(rangeIndex: string) {
    const readData = await this.googleSheetsInstance.spreadsheets.values.get( {
      spreadsheetId: process.env.GOOGLESHEETSID,
      range: rangeIndex,
    });
    return readData.data;
  }

  public async retrieveCompositionData() {
    const rolesData = (await this.retrieveData("A2:A")).values;
    const required = (await this.retrieveData("B2:B")).values;
    const maximum = (await this.retrieveData("C2:C")).values;
    const globalRoleAssignment = (await this.retrieveData("D2:D")).values;
    const globalRolesData = (await this.retrieveData("E2:E")).values;
    const globalRequired = (await this.retrieveData("F2:F")).values;
    const globalFillUpPosition = (await this.retrieveData("G2:G")).values;
    const bmData = await this.retrieveData("H2:J2");
    const bmPerParty = bmData.values[0][0];
    const bmEveryParty = bmData.values[0][1];
    const minimumBms = bmData.values[0][2];
    const roles: Role[] = [];
    const globalRoles: GlobalRole[] = [];
    const bmSettings: BMSettings = {
      BmPerParty: bmPerParty,
      BmEveryParty: bmEveryParty,
      Minimum: minimumBms
    };

    globalRolesData.forEach((value, index) => {
      globalRoles.push({
        Name: value[0],
        Required: globalRequired[index][0],
        FillUpOrder: globalFillUpPosition[index][0]
      });
    });
    rolesData.forEach((value, index) => {
      roles.push({
        DiscordRole: value[0],
        Required: required[index]?required[index][0]:undefined,
        Maximum: maximum[index]?maximum[index][0]:undefined,
        GlobalRole: globalRoles.find(gr => gr.Name===globalRoleAssignment[index][0])
      });
    });
    return {
      Roles: roles,
      GlobalRoles: globalRoles,
      BmSettings: bmSettings
    };
  }
}