import { getNewResultData } from "../scraping/teleboat/models/BuyData";
import { sendToSlack } from "../sns/slack";

(async () => {
  const d = await sendToSlack({ text: "tesuto", channel: "ボートレース結果" });
  console.log(d);
})();
