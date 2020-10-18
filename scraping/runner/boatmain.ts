import { login } from "../teleboat/login";
import { setWatcher } from "../teleboat/watcher";
import { OddsData, ResultData } from "../teleboat/types";
import { insertRaceData, RaceOddsData, isExistsRaceData } from "../teleboat/models/RaceData";
import { getNextRaces } from "../teleboat/checkOdds";
import { checkResults } from "../teleboat/checkResults";
import { insertRaceResultData, RaceResultData } from "../teleboat/models/RaceResultData";
import cron from "node-cron";
import { buyTicket } from "../teleboat/buyTicket";
import { getBuyTicketPage } from "../puppeteer";
import { getNextPrice, insertBuyData, isExistsBuyData, BuyData } from "../teleboat/models/BuyData";
import { postTweet } from "../../twitter/twitter";
import { getJyoName } from "../teleboat/models/JyoMaster";
import { barance01_OddsCallback, barance01_ResultCallback } from "./barance01/watcher";
import { sleep } from "../teleboat/common";
import { getDailyResults } from "./barance01/models";

const limitDiff = 3; // 何分前オッズを集計するか
const isBuyDebug = true; // 実際に購入するか(trueの場合は購入しない)

(async () => {
  console.log("rerun boatmain");
  const page = await login();
  setWatcher(page, {
    oddsCallback: [saveOddsData, runBuyTicket, barance01_OddsCallback],
    resultCallback: [saveResultData, barance01_ResultCallback],
  });

  try {
    console.log("checkResults");
    await checkResults(page);
    console.log("getNextRaces");
    await getNextRaces(page, { limitDiff });
  } catch (e) {
    console.log("error", e);
    await page.screenshot({
      path: `./mainerror.png`,
    });
    process.exit();
  }

  cron.schedule("1-59/2 8-20 * * *", async () => {
    console.log("start");
    try {
      console.log("checkResults");
      await checkResults(page);
      console.log("getNextRaces");
      await getNextRaces(page, { limitDiff });
      console.log("end");
    } catch (e) {
      console.log("error", e);
      await sleep(1000);
      process.exit();
    }
  });
  cron.schedule("00 21 * * *", async () => {
    const result = (await getDailyResults())[0];
    const returnRate = (result.payout / result.paysum) * 100;
    await postTweet(`本日の結果 ローリスク・ローリターン
回収率: ${Number.isNaN(returnRate) ? "0" : Math.round(returnRate)}%
購入額: ${Number.isNaN(result.paysum) ? "0" : result.paysum}円
回収額: ${Number.isNaN(result.payout) ? "0" : result.payout}円
#資産運用 #不労所得 #${returnRate > 100 ? "プラス収支" : "マイナス収支"}`);
  });
  console.log("set cron schedule");
})();

const saveOddsData = async (oddsData: OddsData) => {
  const raceData: RaceOddsData = {
    racedate: new Date(),
    ...oddsData,
  };
  if (!(await isExistsRaceData(raceData))) {
    insertRaceData([raceData]);
  }
};

const runBuyTicket = async (oddsData: OddsData) => {
  if (oddsData.rentan3[0].odds <= 6.0 && oddsData.jyoCode === "12") {
    const price = await getNextPrice(oddsData.jyoCode);
    const buyData: BuyData = {
      racedate: new Date(),
      jyoCode: oddsData.jyoCode,
      raceNo: oddsData.raceNo,
      kumiban: oddsData.rentan3[0].kumiban,
      price: price,
    };
    if (!(await isExistsBuyData(buyData))) {
      await insertBuyData(buyData);
    }
  }
};

const saveResultData = async (resultData: ResultData[]) => {
  const raceResultData = resultData.reduce<RaceResultData[]>((prev, data) => {
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
