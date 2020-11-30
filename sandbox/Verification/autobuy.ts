import { getRaceData, getRaceData2, getTestData } from "../../scraping/teleboat/models/RaceData";
import PriorityQueue from "ts-priority-queue";
import { logQuery } from "../../database/database";

const allcoocmo = async () => {
  const sql = `
  select
  *
from (
    select
      *,
      kumiban = santankumiban as iswin
    from raceinfo
    join rentan3 using(racedate, jyocode, raceno)
    join raceresult using (racedate, jyocode, raceno)
    where
      rank = 1
      and odds <= 4
--      and nj != '初日'
    order by
      racedate,
      time
  ) a;  `;

  const result = await logQuery<{ racedate: Date; iswin: boolean }>(sql);
  let losecnt = 0;
  let maxLosecnt = 0;
  result.forEach((row) => {
    if (row.iswin) {
      if (losecnt > 10) {
        console.log("losecnt", losecnt, row.racedate);
      }
      losecnt = 0;
    } else {
      losecnt++;
    }
    maxLosecnt = Math.max(losecnt, maxLosecnt);
  });
  console.log("maxLosecnt", maxLosecnt);
};

(async () => {
  await allcoocmo();
})();
