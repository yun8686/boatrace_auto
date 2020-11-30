import { logQuery } from "../../database/database";

(async () => {
  const results = await logQuery<{ racedate: Date; iswin: boolean; odds: number }>(`
select
racedate,
jyocode,
raceno,
time,
kumiban,
kumiban = santankumiban as iswin,
odds,
holidays.holidayType
from raceresult
join raceinfo using (racedate, jyocode, raceno)
join rentan3 using (racedate, jyocode, raceno)
left join holidays using (racedate)
where
odds between 5 and 6 --  and rank = 1
and kumiban = '1-2-3'
and holidays.racedate is null
order by
racedate,
time`);
  let maxLose = 0;
  let renLose = 0;
  let dropCnt = 0;
  let winCnt = 0;
  let buysum = 0;
  let winsum = 0;
  const pricetable = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610];
  for (const result of results) {
    buysum += pricetable[renLose];
    if (result.iswin) {
      winsum += pricetable[renLose] * result.odds;
      renLose = 0;
      winCnt++;
    } else {
      renLose++;
    }
    if (renLose >= 10) {
      dropCnt++;
      renLose = 0;
    }
    maxLose = Math.max(maxLose, renLose);
  }
  console.log(dropCnt, winCnt, buysum, winsum);
})();
