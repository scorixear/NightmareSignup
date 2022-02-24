import {Auth, google, sheets_v4} from 'googleapis';
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
  public async retrieveData() {
    const readData = await this.googleSheetsInstance.spreadsheets.values.get( {
      spreadsheetId: process.env.GOOGLESHEETSID,
      range: "A2:J",
    });
    return readData.data;
  }

}