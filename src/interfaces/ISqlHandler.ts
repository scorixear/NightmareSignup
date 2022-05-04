import SqlDiscord from "../misc/sql/SqlDiscord";
import SqlEvent from "../misc/sql/SqlEvent";
import SqlRole from "../misc/sql/SqlRole";
import SqlSignup from "../misc/sql/SqlSignup";
import SqlUnavailable from "../misc/sql/SqlUnavailable";
import SqlUser from "../misc/sql/SqlUser";
import SqlVacation from "../misc/sql/SqlVacation";


export interface ISqlHandler {
  initDB() : Promise<void>;
  getSqlDiscord(): SqlDiscord;
  getSqlEvent(): SqlEvent;
  getSqlRole(): SqlRole;
  getSqlSignup(): SqlSignup;
  getSqlUnavailable(): SqlUnavailable;
  getSqlUser(): SqlUser;
  getSqlVacation(): SqlVacation;
}