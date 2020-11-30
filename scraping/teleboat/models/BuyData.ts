import { logQuery } from "../../../database/database";
import { RaceResultData } from "./RaceResultData";

export type BuyStatus = "complete" | "closed";
export type BuyData = {
  id?: number;
  racedate: Date;
  jyoCode: string;
  raceNo: string;
  kumiban: string;
  price: number;
  isbuy?: boolean;
  buystatus?: BuyStatus;
  isChecked?: boolean;
};

const tableColumns = {
  buydata: ["racedate", "jyoCode", "raceNo", "kumiban", "price", "isChecked"],
};

const createTableQueries = [
  `
    CREATE TABLE buydata (
      id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
      racedate date NOT NULL ,
      jyoCode varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
      raceNo varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
      kumiban varchar(5) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
      price int(11),
      isbuy boolean default false,
      buystatus varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci,
      isChecked boolean default false,
      index(racedate, jyoCode, raceNo)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  `,
];

export async function isExistsBuyData(buyData: BuyData) {
  const result = await logQuery<{ cnt: number }>(
    `select count(1) as cnt from buydata where racedate = Date(?) and jyoCode = ? and raceNo = ? ;`,
    [buyData.racedate, buyData.jyoCode, buyData.raceNo],
  );
  return result[0].cnt > 0;
}
export async function updateBuyData(id: number, buyData: Partial<BuyData>) {
  await logQuery(`update buydata set ? where id = ?`, [buyData, id]);
}

export async function insertBuyData(buyData: BuyData) {
  await logQuery(`insert into buydata set ?`, [
    {
      racedate: buyData.racedate,
      jyoCode: buyData.jyoCode,
      raceNo: buyData.raceNo,
      kumiban: buyData.kumiban,
      price: buyData.price,
    },
  ]);
}

export async function getNextPrice(jyoCode: string) {
  const RATE = 200;
  const results = await logQuery<BuyData & { winstatus: "win" | "lose" | "waiting" }>(
    "SELECT b.price, case " +
      " when r.santankumiban is null then 'waiting' " +
      " when b.kumiban = r.santankumiban then 'win' else 'lose' end as winstatus " +
      " FROM `buydata` b " +
      " left join raceresult r using (racedate, jyoCode, raceNo)" +
      " where buystatus = 'complete'" +
      " order by id desc limit 2;",
  );
  if (results.length <= 1 || results[0].winstatus === "win") return RATE;
  else {
    const price = results[0].price + (results[1].winstatus === "win" ? 0 : results[1].price);
    if (price > 11000) return RATE;
    else return price;
  }
}
export async function getNotBuyData() {
  const results = await logQuery<BuyData>(`select * from buydata where isbuy = false;`);
  return results;
}

export async function getNewResultData() {
  const results = await logQuery<BuyData & RaceResultData>(`
  select *
  from buydata b 
  join raceresult r using (racedate, jyoCode, raceNo)
  where isChecked = false and buystatus = 'complete'
  `);
  return results;
}
export async function getTodayResultData() {
  return await logQuery<{ paysum: number; payoutsum: number }>(`
  select 
    sum(price) paysum,
    round(sum(case when santankumiban = kumiban then santanodds * price end)) as payoutsum
  from buydata b
  join raceresult r using (racedate, jyoCode, raceNo)
  where  buystatus = 'complete' and id >= 496 and racedate = current_date;
  `);
}
export async function getAllResultData() {
  return await logQuery<{ paysum: number; payoutsum: number }>(`
  select 
    sum(price) paysum,
    round(sum(case when santankumiban = kumiban then santanodds * price end)) as payoutsum
  from buydata b
  join raceresult r using (racedate, jyoCode, raceNo)
  where  buystatus = 'complete' and id >= 496;
  `);
}
