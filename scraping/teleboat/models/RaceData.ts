import { Ren } from "../types";
import { getConnection } from "../../../database/database";
import { Connection } from "mysql";

export type RaceData = {
  racedate: Date;
  jyoCode: string;
  raceNo: string;
  rentan3: Ren[];
  rentan2: Ren[];
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
    day text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
    raceName text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
    time integer NOT NULL,
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
//createDatabase();

export const insertRaceData = async (data: RaceData[]) => {
  const connection = await getConnection();
  for (const raceData of data) {
    const rowData = tableColumns.racedata.map((key) => raceData[key]);
    const rentan3Data = raceData.rentan3.map((data, i) =>
      ([raceData.racedate, raceData.jyoCode, raceData.raceNo] as (Date | string | number)[]).concat([i + 1, data.kumiban, data.odds]),
    );
    const rentan2Data = raceData.rentan2.map((data, i) =>
      ([raceData.racedate, raceData.jyoCode, raceData.raceNo] as (Date | string | number)[]).concat([i + 1, data.kumiban, data.odds]),
    );
    await logQuery(connection, `insert into racedata (${tableColumns.racedata.join(",")}) values ?`, [[rowData]]);
    await logQuery(connection, `insert into rentan3 (${tableColumns.rentan3.join(",")}) values ?`, [rentan3Data]);
    await logQuery(connection, `insert into rentan2 (${tableColumns.rentan2.join(",")}) values ?`, [rentan2Data]);
  }
};

function logQuery(connection: Connection, sql: string, values: any[]) {
  const query = connection.format(sql, values);
  return connection.query(query);
}
