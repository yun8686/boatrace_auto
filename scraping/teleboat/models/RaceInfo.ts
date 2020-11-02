import { getConnection, logQuery } from "../../../database/database";

export type RaceInfo = {
  racedate: Date;
  jyoCode: string;
  raceNo: string;
  time: number;
  daynum: number;
  // tbgradename: string;
  // nj: string;
  // nightflag: number;
};
export type BeforeInfo = {
  racedate: Date;
  jyoCode: string;
  raceNo: string;
  wind: number;
  windtext: string;
  weather: string;
};
const tableColumns = {
  raceinfo: ["racedate", "jyoCode", "raceNo", "time", "daynum"],
  beforeinfo: ["racedate", "jyoCode", "raceNo", "wind", "windtext", "weather"],
};
const createTableQueries = [
  `
    CREATE TABLE jyoinfo (
      racedate date NOT NULL ,
      jyoCode varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
      tbgradename varchar(10)  CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
      nj varchar(10)  CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
      nightflag int(2),
      primary key(racedate, jyoCode)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  `,
  `
    CREATE TABLE raceinfo (
      racedate date NOT NULL ,
      jyoCode varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
      raceNo varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
      time int(4) not null,
      primary key(racedate, jyoCode, raceNo)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  `,
  `
    CREATE TABLE beforeinfo (
      racedate date NOT NULL ,
      jyoCode varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
      raceNo varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
      wind double(10,2),
      windtext varchar(10) CHARACTER SET utf8 COLLATE utf8_unicode_ci ,
      weather varchar(10) CHARACTER SET utf8 COLLATE utf8_unicode_ci ,
      primary key(racedate, jyoCode, raceNo)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  `,
];

export const isExistsRaceInfo = async (data: RaceInfo) => {
  const result = await logQuery<{ cnt: number }>(
    "select count(1) as cnt from raceinfo where racedate = Date(?) and jyoCode = ? and raceNo = ?;",
    [data.racedate, data.jyoCode, data.raceNo],
  );
  return result[0].cnt > 0;
};
export const insertRaceInfo = async (data: RaceInfo[]) => {
  const columns = tableColumns.raceinfo;
  for (const raceInfo of data) {
    const rowData = columns.map((key) => raceInfo[key]);
    if (!(await isExistsRaceInfo(raceInfo))) {
      await logQuery(`insert into raceinfo (${columns.join(",")}) values ?`, [[rowData]]);
    }
  }
};

export const isExistsBeforeInfo = async (data: BeforeInfo) => {
  const result = await logQuery<{ cnt: number }>(
    "select count(1) as cnt from beforeinfo where racedate = Date(?) and jyoCode = ? and raceNo = ?;",
    [data.racedate, data.jyoCode, data.raceNo],
  );
  return result[0].cnt > 0;
};
export const insertBeforeInfo = async (data: BeforeInfo[]) => {
  const columns = tableColumns.beforeinfo;
  for (const beforeInfo of data) {
    const rowData = columns.map((key) => beforeInfo[key]);
    if (!(await isExistsBeforeInfo(beforeInfo))) {
      await logQuery(`insert into beforeinfo (${columns.join(",")}) values ?`, [[rowData]]);
    }
  }
};
