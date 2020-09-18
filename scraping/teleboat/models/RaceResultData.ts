import { getConnection } from "../../../database/database";
import { Connection } from "mysql";

export type RaceResultData = {
  racedate: Date;
  jyoCode: string;
  raceNo: string;
  santankumiban: string;
  santanodds: number;
};

const tableColumns = {
  raceresult: ["racedate", "jyoCode", "raceNo", "santankumiban", "santanodds"],
};

const createTableQueries = [
  `
  CREATE TABLE raceresult (
    racedate date NOT NULL,
    jyoCode varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
    raceNo varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
    santankumiban varchar(5) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
    santanodds double,
    primary key(racedate, jyoCode, raceNo)
  ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
`,
];

async function createDatabase() {
  const connection = await getConnection();
  await Promise.all(createTableQueries.map((q) => connection.query(q))).then(() => console.log("ok"));
}
//createDatabase();

export const insertRaceResultData = async (data: RaceResultData[]) => {
  const connection = await getConnection();
  for (const raceResultData of data) {
    const rowData = tableColumns.raceresult.map((key) => raceResultData[key]);
    await query(connection, `insert into raceresult (${tableColumns.raceresult.join(",")}) values ?`, [[rowData]]);
  }
};

function query(connection: Connection, sql: string, values: any[]) {
  const query = connection.format(sql, values);
  return connection.query(query);
}
