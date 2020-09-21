import { getConnection, logQuery } from "../../../database/database";

export type RaceInfo = {
  racedate: Date;
  jyoCode: string;
  raceNo: string;
  time: number;
};

const tableColumns = {
  raceinfo: ["racedate", "jyoCode", "raceNo", "time"],
};
const createTableQueries = [
  `
    CREATE TABLE raceinfo (
      racedate date NOT NULL ,
      jyoCode varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
      raceNo varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL ,
      time int(4) not null,
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
  for (const raceInfo of data) {
    const rowData = tableColumns.raceinfo.map((key) => raceInfo[key]);
    if (!(await isExistsRaceInfo(raceInfo))) {
      await logQuery(`insert into raceinfo (${tableColumns.raceinfo.join(",")}) values ?`, [[rowData]]);
    }
  }
};
