import Twitter from "twitter";
import setting from "../settings/twitter.setting.json";
const client = new Twitter(setting);

type Response = {
  content: string;
  id: number;
};
export const postTweet = (content: string, in_reply_to_status_id?: string) => {
  return new Promise<Response>((resolve, reject) => {
    client.post("statuses/update", { status: content, in_reply_to_status_id }, function (error, _tweet, _response) {
      if (!error) {
        resolve({ content, id: _tweet.id_str });
      } else {
        reject(error);
      }
    });
  });
};
