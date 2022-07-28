import SqlDiscord from '../handlers/sql/SqlDiscord';
import SqlEvent from '../handlers/sql/SqlEvent';
import SqlRole from '../handlers/sql/SqlRole';
import SqlSignup from '../handlers/sql/SqlSignup';
import SqlUnavailable from '../handlers/sql/SqlUnavailable';
import SqlUser from '../handlers/sql/SqlUser';
import SqlVacation from '../handlers/sql/SqlVacation';

export interface ISqlHandler {
  initDB(): Promise<void>;
  getSqlDiscord(): SqlDiscord;
  getSqlEvent(): SqlEvent;
  getSqlRole(): SqlRole;
  getSqlSignup(): SqlSignup;
  getSqlUnavailable(): SqlUnavailable;
  getSqlUser(): SqlUser;
  getSqlVacation(): SqlVacation;
}
