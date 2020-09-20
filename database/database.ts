const config = require("../settings/mysql.setting.json");
import mysql, { Connection, queryCallback } from "mysql";

let connection: mysql.Connection;
const connectDatabase = async () => {
  connection = await mysql.createConnection(config);
  return new Promise<mysql.Connection>((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        reject("Connect Error mysql" + err.stack);
      }
      resolve(connection);
    });
  });
};

export const getConnection = async () => {
  return connection ? connection : await connectDatabase();
};

export async function logQuery<T>(sql: string, values: any[]) {
  try {
    const connection = await getConnection();
    const query = connection.format(sql, values);
    console.log(query);
    return new Promise<T>((resolve) =>
      connection.query(query, (err, results) => {
        console.log("results", results);
        resolve(results);
      }),
    );
  } catch (e) {
    console.log(sql, e);
  }
}
