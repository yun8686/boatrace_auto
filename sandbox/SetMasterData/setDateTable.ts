import dateHolidays from "date-holidays";
import { logQuery } from "../../database/database";

(async () => {
  const hd = new dateHolidays("JP");
  const holidays = hd.getHolidays();
  for (const holiday of holidays) {
    await logQuery(`insert into holidays set ?`, [{ racedate: holiday.date, holidayType: holiday.type }]);
  }
})();
