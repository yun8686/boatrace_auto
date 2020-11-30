import { login } from "../teleboat/login";
import cron from "node-cron";
import { Page } from "puppeteer";
import { buyTicket } from "../teleboat/buyTicket";
import { getNotBuyData, updateBuyData, getNewResultData } from "../teleboat/models/BuyData";
import { getJyoName } from "../teleboat/models/JyoMaster";
import { sendToSlack } from "../../sns/slack";

(async () => {
  const page = await login({
    timeout: 20000,
  });
  await runBuyTickets(page);

  cron.schedule("* 8-20 * * *", async () => {
    console.log("start");
    try {
      // 開始時間を20秒遅らせる
      const sleep = async (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
      await sleep(20000);

      await runBuyTickets(page);
      console.log("end");
    } catch (e) {
      console.log("error", e);
      process.exit();
    }
  });

  console.log("set cron schedule");
})().catch(() => process.exit());

async function runBuyTickets(page: Page) {
  const buyData = await getNotBuyData();
  console.log(buyData);
  for (const data of buyData) {
    const result = await buyTicket(
      page,
      {
        jyoCode: data.jyoCode,
        raceNo: data.raceNo,
        oddsType: "rentan3",
        kumiban: data.kumiban,
        price: data.price,
      },
      false,
    );
    console.log("ticket buy ", result, data);
    await updateBuyData(data.id, { isbuy: true, buystatus: result });
  }
}
