import { login } from "../teleboat/login";

(async () => {
  console.log("rerun dayrun");
  const page = await login();
  try {
    console.log("ok");
  } catch (e) {
    await page.screenshot({
      path: `./dayrunerror.png`,
    });
    process.exit();
  }

  //  cron.schedule("1-59/2 8-20 * * *", async () => {});
})();
