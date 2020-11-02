import { getNewResultData } from "../scraping/teleboat/models/BuyData";

(async () => {
  const d = await getNewResultData();
  console.log(d);
})();
