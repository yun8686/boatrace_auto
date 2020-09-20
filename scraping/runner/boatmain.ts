import { login } from "../teleboat/login";
import { setWatcher } from "../teleboat/watcher";
import { OddsData, ResultData } from "../teleboat/types";
import { insertRaceData, RaceOddsData, isExistsRaceData } from "../teleboat/models/RaceData";
import { getNextRaces } from "../teleboat/checkOdds";
import { checkResults } from "../teleboat/checkResults";
import { insertRaceResultData, RaceResultData } from "../teleboat/models/RaceResultData";
import cron from "node-cron";

(async () => {
  const page = await login();
  console.log("logined");
  setWatcher(page, {
    oddsCallback: [saveOddsData],
    resultCallback: [saveResultData],
  });
  cron.schedule("1-59/2 8-20 * * *", async () => {
    console.log("start");
    try {
      await getNextRaces(page);
      await checkResults(page);
      console.log("end");
    } catch (e) {
      console.log("error", e);
      process.exit();
    }
  });
})();

const saveOddsData = async (oddsData: OddsData) => {
  console.log(oddsData.jyoCode, oddsData.raceNo);
  const raceData: RaceOddsData = {
    racedate: new Date(),
    ...oddsData,
  };
  if (!(await isExistsRaceData(raceData))) {
    insertRaceData([raceData]);
  }
};
const saveResultData = async (resultData: ResultData[]) => {
  const raceResultData = resultData.reduce((prev, data) => {
    return [
      ...prev,
      ...(data.raceList || []).reduce((prev, race) => {
        return [
          ...prev,
          {
            racedate: new Date(),
            jyoCode: data.jyoCode,
            raceNo: race.raceNo,
            santankumiban: race.santanList[0].kumiban,
            santanodds: race.santanList[0].odds,
          } as RaceResultData,
        ];
      }, [] as RaceResultData[]),
    ];
  }, []);
  await insertRaceResultData(raceResultData);
};
