import {IGoogleSheetsHandler} from '../src/interfaces/IGoogleSheetsHandler'
import {BMSettings} from '../src/model/BMSettings'
import {Role} from '../src/model/Role'
import {GlobalRole} from '../src/model/GlobalRole'

export class TestGoogleSheetsHandler implements IGoogleSheetsHandler {
  public CompositionData: {Roles: Role[], GlobalRoles: GlobalRole[], BmSettings: BMSettings};
  public async retrieveCompositionData(): Promise<{Roles: Role[], GlobalRoles: GlobalRole[], BmSettings: BMSettings}> {
    return new Promise((resolve, reject) => resolve(this.CompositionData));
  }
}