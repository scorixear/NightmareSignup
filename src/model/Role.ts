import { GlobalRole } from "./GlobalRole";

export class Role {
  RoleName: string;
  PriorityRole: string;
  Required: number;
  MaximumPerParty: number;
  MaximumPerZerg: number;
  GlobalRole: GlobalRole;
}