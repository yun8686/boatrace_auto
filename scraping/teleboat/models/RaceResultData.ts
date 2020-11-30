import { getConnection } from "../../../database/database";
import { Connection } from "mysql";

export type RaceResultData = {
  racedate: Date;
  jyoCode: string;
  raceNo: string;
  santankumiban: string;
  santanodds: number;
  nitankumiban: string;
  nitanodds: number;
};

const tableColumns = {
  raceresult: ["racedate", "jyoCode", "raceNo", "santankumiban", "santanodds", "nitankumiban", "nitanodds"],
};

const createTableQueries = [
  `
  CREATE TABLE raceresult (
    racedate date NOT NULL,
    jyoCode varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
    raceNo varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
    santankumiban varchar(5) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
    santanodds double(7, 2),
    nitankumiban varchar(5) CHARACTER SET utf8 COLLATE utf8_unicode_ci ,
    nitanodds double(7, 2),
    primary key(racedate, jyoCode, raceNo)
  ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
`,
];

async function createDatabase() {
  const connection = await getConnection();
  await Promise.all(createTableQueries.map((q) => connection.query(q))).then(() => console.log("ok"));
}

export const insertRaceResultData = async (data: RaceResultData[]) => {
  const connection = await getConnection();
  for (const raceResultData of data) {
    const rowData = tableColumns.raceresult.map((key) => raceResultData[key]);
    await query(connection, `replace into raceresult (${tableColumns.raceresult.join(",")}) values ?`, [[rowData]]);
  }
};

function query(connection: Connection, sql: string, values: any[]) {
  const query = connection.format(sql, values);
  return connection.query(query);
}
