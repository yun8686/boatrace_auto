import { login } from "../teleboat/login";
import { setWatcher } from "../teleboat/watcher";
import { OddsData, ResultData } from "../teleboat/types";
import { insertRaceData, RaceOddsData } from "../teleboat/models/RaceData";
import { getNextRaces } from "../teleboat/checkOdds";
import { checkResults } from "../teleboat/checkResults";
import { insertRaceResultData, RaceResultData } from "../teleboat/models/RaceResultData";

(async () => {
  const page = await login();
  console.log("logined");
  setWatcher(page, {
    oddsCallback: [saveOddsData],
    resultCallback: [saveResultData],
  });
  await getNextRaces(page);
  await checkResults(page);
})();

const saveOddsData = async (oddsData: OddsData) => {
  console.log(oddsData.jyoCode, oddsData.raceNo);
  const raceData: RaceOddsData = {
    racedate: new Date(),
    ...oddsData,
  };
  //  insertRaceData([raceData]);
};
const saveResultData = async (resultData: ResultData[]) => {
  console.log("resultData", resultData);
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
