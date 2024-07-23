const AWS = require("aws-sdk");

exports.handler = async function (event, context) {
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));

  // CORS 헤더 설정
  const headers = {
    "Access-Control-Allow-Origin": "*", // 또는 특정 도메인
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: headers,
      body: "",
    };
  }

  // 실제 요청 처리
  return {
    statusCode: 200,
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sales: {
        eanings: Array.from(
          { length: 8 },
          () => Math.floor(Math.random() * (500 - 150 + 1)) + 150
        ),
        expense: Array.from(
          { length: 8 },
          () => Math.floor(Math.random() * (500 - 150 + 1)) + 150
        ),
      },
    }),
  };
};
