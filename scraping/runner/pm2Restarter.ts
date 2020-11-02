import pm2 from "pm2";
import cron from "node-cron";

(async () => {
  cron.schedule("30 08 * * *", async () => {
    pm2.restart("all", (err) => {
      if (err) console.log("restart all err", err);
      else console.log("restart all succeed");
    });
  });
})();
