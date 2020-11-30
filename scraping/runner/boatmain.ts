import { login } from "../teleboat/login";
import { setWatcher } from "../teleboat/watcher";
import { OddsData, ResultData } from "../teleboat/types";
import { insertRaceData, RaceOddsData, isExistsRaceData } from "../teleboat/models/RaceData";
import { getNextRaces } from "../teleboat/checkOdds";
import { checkResults } from "../teleboat/checkResults";
import { insertRaceResultData, RaceResultData } from "../teleboat/models/RaceResultData";
import cron from "node-cron";
import { checkDeposit } from "../teleboat/buyTicket";
import {
  getNextPrice,
  insertBuyData,
  isExistsBuyData,
  BuyData,
  getNewResultData,
  updateBuyData,
  getTodayResultData,
  getAllResultData,
} from "../teleboat/models/BuyData";
import { postTweet } from "../../sns/twitter";
import { barance01_OddsCallback, barance01_ResultCallback } from "./barance01/watcher";
import { sleep } from "../teleboat/common";
import { getDailyResults } from "./barance01/models";
import { sendToSlack } from "../../sns/slack";
import { getJyoName } from "../teleboat/models/JyoMaster";

const limitDiff = 3; // 何分前オッズを集計するか

(async () => {
  console.log("rerun boatmain");
  const page = await login({ timeout: 20000 });
  await checkDeposit(page, 50000);
  //  const page2 = await login();
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
    process.exit();
  }

  cron.schedule("* 8-20 * * *", async () => {
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

  cron.schedule("03 21 * * *", async () => {
    const buyResult = await getTodayResultData();
    await sendToSlack({
      text: `本日の結果\n購入額: ${buyResult[0].paysum}\n払戻額: ${buyResult[0].payoutsum}`,
      channel: "ボートレース結果",
    });
    const allResult = await getAllResultData();
    await sendToSlack({
      text: `累計結果\n購入額: ${allResult[0].paysum}\n払戻額: ${allResult[0].payoutsum}`,
      channel: "ボートレース結果",
    });
  });

  console.log("set cron schedule");
})().catch((err) => {
  console.error("error", err);
  process.exit();
});

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
  if (oddsData.rentan3[0].odds >= 2.0 && oddsData.rentan3[0].odds <= 4.0) {
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
  await checkBuyData();
};

const checkBuyData = async () => {
  const result = await getNewResultData();
  for (const data of result) {
    sendToSlack({
      text: `結果がでました\n${getJyoName(data.jyoCode)}${parseInt(data.raceNo)}R\n${
        data.santankumiban === data.kumiban ? "的中" : "不的中"
      }`,
      channel: "ボートレース結果",
    });
    await updateBuyData(data.id, { isChecked: true });
  }
};
