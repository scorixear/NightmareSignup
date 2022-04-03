import {Auth, google, sheets_v4} from 'googleapis';
import { BMSettings } from '../model/BMSettings';
import { GlobalRole } from '../model/GlobalRole';
import { Role } from '../model/Role';
import { IGoogleSheetsHandler } from '../interfaces/IGoogleSheetsHandler';
import fs from 'fs';
import readline from 'readline';
import { OAuth2Client } from 'google-auth-library';
export default class GoogleSheetsHandler implements IGoogleSheetsHandler {
  private googleSheetsInstance: sheets_v4.Sheets;
  private TOKEN_PATH = "token.json";
  private SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
  public Ready: Promise<any>;
  constructor() {
    this.googleSheetsInstance = google.sheets({
      version: 'v4',
      auth: process.env.GOOGLESHEETSAPI
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
        RoleName: value[0],
        PriorityRole: "FullSpec "+value[0],
        Required: required[index]?required[index][0]:undefined,
        Maximum: maximum[index]?maximum[index][0]:undefined,
        GlobalRole: globalRoles.find(gr => gr.Name===globalRoleAssignment[index][0]),
      });
    });
    return {
      Roles: roles,
      GlobalRoles: globalRoles,
      BmSettings: bmSettings
    };
  }
}