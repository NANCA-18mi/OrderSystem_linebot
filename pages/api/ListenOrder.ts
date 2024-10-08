import { NextApiRequest, NextApiResponse } from 'next'
import * as line from '@line/bot-sdk';
import { userStatus } from './linebot';
import {getOrderData} from './getter/getOrderData';


export async function listenOrser(event: any, client: line.Client) {
    console.log("きたよ");
    const userId = event.source.userId;
    const messageText = event.message.text;

    if (!userStatus[userId]) {
        userStatus[userId] = { status: 'chatStart', userNumber: 0, userName: '' };
    }

    switch (userStatus[userId].status) {
        case "chatStart":
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: '番号を入力してください。',
              });
              userStatus[userId].status = "watingNumber";
            break;
        case "watingNumber":
            // 入力された番号が全角の場合半角に変換
            const normalizedMessageText = messageText.replace(/[０-９]/g, (s: string) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
            if(!isNaN(Number(normalizedMessageText))){
                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '注文時に登録した名前を入力してください。',
                    });
                    userStatus[userId].userNumber = normalizedMessageText;
                    userStatus[userId].status = "watingName";
                break;
            }
            else{
                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '正しい番号を入力してください。',
                  });
                break;
            }
            case "watingName":
                await client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '名前きた。',
                  });
                  userStatus[userId].userName = messageText;
                  userStatus[userId].status = "watingName";
                  const userOrderData = await getOrderData(userStatus[userId].userNumber);
                  console.log("名前来てる");
                  if (Array.isArray(userOrderData)) {
                    // 成功時の処理
                    console.log(userOrderData); // データを処理
                  } else if (userOrderData.success === false) {
                    // エラー時の処理
                    console.log("Error fetching order data");
                  }
                 
                  userStatus[userId] = { status: '', userNumber: 0, userName: '' };    // テスト用にいったん消してる
                break;
        default:
            break;
    }
}