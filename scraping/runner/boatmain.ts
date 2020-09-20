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
import { getNextPrice, insertBuyData, BuyData } from "../teleboat/models/BuyData";
import { postTweet } from "../../twitter/twitter";
import { getJyoName } from "../teleboat/models/JyoMaster";

const limitDiff = 3; // 何分前オッズを集計するか
const isBuyDebug = true; // 実際に購入するか(trueの場合は購入しない)

(async () => {
  console.log("rerun boatmain");
  const page = await login();
  setWatcher(page, {
    oddsCallback: [saveOddsData, runBuyTicket],
    resultCallback: [saveResultData],
  });

  await getNextRaces(page, { limitDiff });
  await checkResults(page);

  cron.schedule("1-59/2 8-20 * * *", async () => {
    console.log("start");
    try {
      await getNextRaces(page, { limitDiff });
      await checkResults(page);
      console.log("end");
    } catch (e) {
      console.log("error", e);
      process.exit();
    }
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
  if (oddsData.rentan3[0].odds <= 6.0) {
    const buyTicketPage = await getBuyTicketPage();
    buyTicket(
      buyTicketPage,
      {
        jyoCode: oddsData.jyoCode,
        raceNo: oddsData.raceNo,
        oddsType: "rentan3",
        kumiban: oddsData.rentan3[0].kumiban,
        price: await getNextPrice(oddsData.jyoCode),
      },
      isBuyDebug,
    );
    const price = await getNextPrice(oddsData.jyoCode);
    const buyData: BuyData = {
      racedate: new Date(),
      jyoCode: oddsData.jyoCode,
      raceNo: oddsData.raceNo,
      kumiban: oddsData.rentan3[0].kumiban,
      price: price,
    };
    insertBuyData(buyData);
    console.log("run buyTicket End", buyData);
    await postTweet(`競艇ココモ法テスト中
${getJyoName(oddsData.jyoCode)}${parseInt(oddsData.raceNo)}R
${price} ${oddsData.rentan3[0].odds} ${oddsData.rentan3[0].kumiban}円
#競艇 #ココモ法 #資産運用`);
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
