import { Ren } from "../types";
import { getConnection, logQuery } from "../../../database/database";
import { Connection } from "mysql";
import { RaceResultData } from "./RaceResultData";
import { RaceInfo } from "./RaceInfo";

type RaceDataKey = {
  racedate: Date;
  jyoCode: string;
  raceNo: string;
};
export type RaceOddsData = {
  racedate: Date;
  jyoCode: string;
  raceNo: string;
  rentan3: Ren[];
  rentan2?: Ren[];
};

const tableColumns = {
  racedata: ["racedate", "jyoCode", "raceNo"],
  rentan3: ["racedate", "jyoCode", "raceNo", "rank", "kumiban", "odds"],
  rentan2: ["racedate", "jyoCode", "raceNo", "rank", "kumiban", "odds"],
};

const createTableQueries = [
  `
  CREATE TABLE racedata (
    racedate date NOT NULL ,
    jyoCode varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
    raceNo varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
    primary key(racedate, jyoCode, raceNo)
  ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
`,
  `
CREATE TABLE rentan3 (
  racedate date NOT NULL ,
  jyoCode varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
  raceNo varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
  rank integer ,
  kumiban varchar(5) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  odds double NOT NULL,
  primary key(racedate, jyoCode, raceNo, rank)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
`,
  `
CREATE TABLE rentan2 (
  racedate date NOT NULL ,
  jyoCode varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
  raceNo varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
  rank integer ,
  kumiban varchar(5) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  odds double NOT NULL,
  primary key(racedate, jyoCode, raceNo, rank)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
`,
];

async function createDatabase() {
  const connection = await getConnection();
  await Promise.all(createTableQueries.map((q) => connection.query(q))).then(() => console.log("ok"));
}

export const isExistsRaceData = async (raceDataKey: RaceDataKey) => {
  const connection = await getConnection();
  return new Promise((resolve) => {
    connection
      .query("select count(1) as cnt from racedata where racedate = Date(?) and jyoCode = ? and raceNo = ?;", [
        raceDataKey.racedate,
        raceDataKey.jyoCode,
        raceDataKey.raceNo,
      ])
      .on("result", (result) => {
        resolve(result.cnt > 0);
      });
  });
};
//  isExistsRaceData({ racedate: new Date(), jyoCode: "24", raceNo: "03" }).then((v) => console.log("isExistsRaceData", v));

export const insertRaceData = async (data: RaceOddsData[]) => {
  const connection = await getConnection();
  for (const raceData of data) {
    const rowData = tableColumns.racedata.map((key) => raceData[key]);
    logQuery(`insert into racedata (${tableColumns.racedata.join(",")}) values ?`, [[rowData]]);

    const rentan3Data = raceData.rentan3.map((data, i) =>
      ([raceData.racedate, raceData.jyoCode, raceData.raceNo] as (Date | string | number)[]).concat([i + 1, data.kumiban, data.odds]),
    );
    logQuery(`insert into rentan3 (${tableColumns.rentan3.join(",")}) values ?`, [rentan3Data]);

    if (raceData.rentan2) {
      const rentan2Data = raceData.rentan2.map((data, i) =>
        ([raceData.racedate, raceData.jyoCode, raceData.raceNo] as (Date | string | number)[]).concat([i + 1, data.kumiban, data.odds]),
      );
      logQuery(`insert into rentan2 (${tableColumns.rentan2.join(",")}) values ?`, [rentan2Data]);
    }
  }
};

export const replaceRaceData = async (data: RaceOddsData[]) => {
  for (const raceData of data) {
    const rowData = tableColumns.racedata.map((key) => raceData[key]);
    await logQuery(`replace into racedata (${tableColumns.racedata.join(",")}) values ?`, [[rowData]]);

    const rentan3Data = raceData.rentan3.map((data, i) =>
      ([raceData.racedate, raceData.jyoCode, raceData.raceNo] as (Date | string | number)[]).concat([i + 1, data.kumiban, data.odds]),
    );
    await logQuery(`replace into rentan3 (${"`" + tableColumns.rentan3.join("`,`") + "`"}) values ?`, [rentan3Data]);

    if (raceData.rentan2) {
      const rentan2Data = raceData.rentan2.map((data, i) =>
        ([raceData.racedate, raceData.jyoCode, raceData.raceNo] as (Date | string | number)[]).concat([i + 1, data.kumiban, data.odds]),
      );
      await logQuery(`replace into rentan2 (${"`" + tableColumns.rentan2.join("`,`") + "`"}) values ?`, [rentan2Data]);
    }
  }
};

export const getRaceData = async (fromDate: Date, toDate: Date) => {
  let query = `
  select * from racedata r 
  join rentan3 t using (racedate, jyoCode, raceNo) 
  join raceresult res using (racedate,jyocode,raceno)
   join beforeinfo bef using (racedate,jyocode,raceno)
  `;
  const value = [];
  query += " where 1 = 1  and t.odds <= 6 and t.odds > 5 and t.rank = 1 ";
  query += " and r.racedate between Date(?) and Date(?) ";
  query += " and bef.wind <= 3 ";
  //  query += " and (jyocode = '06' or jyocode = '09' or jyocode = '07') ";
  //  query +=
  //  ("and not exists ( select * from v_racedata where racedate = r.racedate and jyocode = r.jyocode and raceno = r.raceno and rank = 2 and odds <= 7 )");
  query += " order by racedate, jyocode, raceno";
  return await logQuery<RaceOddsData & Ren & RaceResultData>(query, [fromDate, toDate]);
};

export const getRaceData2 = async (fromDate: Date, toDate: Date) => {
  let query = `
    select * from racedata r 
    join rentan3 t using (racedate, jyoCode, raceNo) 
    join raceresult res using (racedate,jyocode,raceno)
    join beforeinfo bef using (racedate,jyocode,raceno)
    join raceinfo inf using (racedate,jyocode,raceno)
  `;
  query += " where t.odds >= 10 and t.odds <= 15 and rank <= 10  ";
  query += " and r.racedate between Date(?) and Date(?) ";
  query += " and jyocode = '01' ";
  //  query += " and jyocode != '04' and jyocode != '23' ";
  //  query += " and bef.wind <= 5 ";
  query += " order by racedate, jyocode, raceno, rank";
  return await logQuery<RaceOddsData & Ren & RaceResultData & RaceInfo>(query, [fromDate, toDate]);
};

export const getTestData = async (fromDate: Date, toDate: Date) => {
  let query = `
  select racedate,jyocode,raceno,rank 
  from v_racedata where kumiban = santankumiban
  ;`;
  return await logQuery<RaceOddsData & Ren & RaceResultData>(query);
};
