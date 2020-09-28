import { login } from "../teleboat/login";
import cron from "node-cron";
import { Page } from "puppeteer";
import { buyTicket } from "../teleboat/buyTicket";
import { getNotBuyData, updateBuyData } from "../teleboat/models/BuyData";

(async () => {
  const page = await login();
  await runBuyTickets(page);

  cron.schedule("* 8-20 * * *", async () => {
    console.log("start");
    try {
      await runBuyTickets(page);
      console.log("end");
    } catch (e) {
      console.log("error", e);
      process.exit();
    }
  });

  console.log("set cron schedule");
})();

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
      true,
    );
    console.log("ticket buy ", result, data);
    await updateBuyData(data.id, { isbuy: true, buystatus: result });
  }
}
