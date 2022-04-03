import { BMSettings } from "../model/BMSettings";
import { Role } from "../model/Role";
import { GlobalRole } from "../model/GlobalRole";

export interface IGoogleSheetsHandler {
  Ready: Promise<any>;
  retrieveCompositionData(): Promise<{Roles: Role[], GlobalRoles: GlobalRole[], BmSettings: BMSettings}>;
}
