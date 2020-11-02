import { WebClient, WebAPICallResult } from "@slack/web-api";
import slackSetting from "../settings/slack.setting.json";

const web = new WebClient(slackSetting.apiKey);

interface ChatPostMessageResult extends WebAPICallResult {
  channel: string;
  ts: string;
  message: {
    text: string;
  };
}

export const sendToSlack = async ({ text, channel }: { text: string; channel: "ボートレース結果" }) => {
  // The result is cast to the interface
  //  const res = (await web.chat.postMessage({ text: "Hello world", channel: "C012345" })) as ChatPostMessageResult;
  const res = (await web.chat.postMessage({
    username: "競艇くん",
    icon_url: "https://t.pimg.jp/047/457/909/1/47457909.jpg",
    text,
    channel,
  })) as ChatPostMessageResult;
  // Properties of the result are now typed
  console.log(`A message was posed to conversation ${res.channel} with id ${res.ts} which contains the message ${res.message}`);
};
