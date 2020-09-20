import { login } from "../teleboat/login";
import { buyTicket } from "../teleboat/buyTicket";

(async () => {
  const page = await login({ headless: false });
  await buyTicket(page, {
    jyoCode: "06",
    raceNo: "11",
    oddsType: "rentan3",
    kumiban: "1-2-4",
    price: 100,
  });
})();
