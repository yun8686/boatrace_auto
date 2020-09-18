import { login } from "../teleboat/login";
import { setWatcher } from "../teleboat/watcher";
import { OddsData, ResultData } from "../teleboat/types";
import { insertRaceData, RaceData } from "../teleboat/models/RaceData";
import { getNextRaces } from "../teleboat/checkOdds";

(async () => {
  const page = await login();
  console.log("logined");
  setWatcher(page, {
    oddsCallback: [saveOddsData],
    resultCallback: [saveResultData],
  });
  getNextRaces(page);
})();

const saveOddsData = async (oddsData: OddsData) => {
  console.log(oddsData);
  const raceData: RaceData = {
    racedate: new Date(),
    ...oddsData,
  };
  insertRaceData([raceData]);
};
const saveResultData = async (resultData: ResultData[]) => {};
