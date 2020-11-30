import { getConnection, logQuery } from "../../../database/database";

export type RaceInfo = {
  racedate: Date;
  jyoCode: string;
  raceNo: string;
  time: number;
  daynum: number;
  // tbgradename: string;
  nj?: string;
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

export type RacersInfo = {
  racedate: Date;
  jyoCode: string;
  raceNo: string;
  teino: number;
  racerno: string;
  racername: string;
  classname: string;
  zwinper: number;
  jwinper: number;
};
const tableColumns = {
  raceinfo: ["racedate", "jyoCode", "raceNo", "time", "daynum", "nj"],
  beforeinfo: ["racedate", "jyoCode", "raceNo", "wind", "windtext", "weather"],
  racersinfo: ["racedate", "jyoCode", "raceNo", "teino", "racerno", "racername", "classname", "zwinper", "jwinper"],
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
  `
  CREATE TABLE racersinfo (
    racedate date NOT NULL ,
    jyoCode varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
    raceNo varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
    teino integer not null,
    racerno varchar(5) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
    racername varchar(30) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
    classname varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
    zwinper double NOT NULL,
    jwinper double NOT NULL,
    primary key(racedate, jyoCode, raceNo, teino)
  ) ENGINE=InnoDB DEFAULT CHARSET=latin1;`,
];

export const isExistsRaceInfo = async (data: RaceInfo) => {
  const result = await logQuery<{ cnt: number }>(
    "select count(1) as cnt from raceinfo where racedate = Date(?) and jyoCode = ? and raceNo = ?;",
    [data.racedate, data.jyoCode, data.raceNo],
  );
  return result[0].cnt > 0;
};
export const replaceRaceInfo = async (data: RaceInfo[]) => {
  const columns = tableColumns.raceinfo;
  for (const raceInfo of data) {
    await logQuery<{ cnt: number }>("delete from raceinfo where racedate = Date(?) and jyoCode = ? and raceNo = ?;", [
      raceInfo.racedate,
      raceInfo.jyoCode,
      raceInfo.raceNo,
    ]);
    const rowData = columns.map((key) => raceInfo[key]);
    //    if (!(await isExistsRaceInfo(raceInfo))) {
    await logQuery(`insert into raceinfo (${columns.join(",")}) values ?`, [[rowData]]);
    //  }
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

export const insertRacersInfo = async (data: RacersInfo[]) => {
  const columns = tableColumns.racersinfo;
  for (const racersInfo of data) {
    const rowData = columns.map((key) => racersInfo[key]);
    await logQuery(`replace into racersinfo (${columns.join(",")}) values ?`, [[rowData]]);
  }
};
