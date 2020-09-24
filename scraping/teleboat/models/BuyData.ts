import { logQuery } from "../../../database/database";

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
};

const tableColumns = {
  buydata: ["racedate", "jyoCode", "raceNo", "kumiban", "price"],
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
  const results = await logQuery<BuyData & { winstatus: "win" | "lose" | "waiting" }>(
    "SELECT b.price, case " +
      " when r.santankumiban is null then 'waiting' " +
      " when b.kumiban = r.santankumiban then 'win' else 'lose' end as winstatus " +
      " FROM `buydata` b " +
      " left join raceresult r using (racedate, jyoCode, raceNo)" +
      "WHERE b.jyoCode = ? order by b.racedate desc, b.raceNo desc limit 10;",
    [jyoCode],
  );
  if (results.length <= 1 || results[0].winstatus === "win") return 100;
  else {
    return results[0].price + (results[1].winstatus === "win" ? 0 : results[1].price);
  }
}
export async function getNotBuyData() {
  const results = await logQuery<BuyData>(`select * from buydata where isbuy = false;`);
  return results;
}

// (async () => {
//   await insertBuyData({ racedate: new Date("2020-9-20"), jyoCode: "21", raceNo: "08", kumiban: "1-2-5", price: await getNextPrice("21") });
//   console.log(await getNextPrice("21"));
// })();
