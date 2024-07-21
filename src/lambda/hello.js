const AWS = require("aws-sdk");

// SES 설정
const ses = new AWS.SES({ region: "ap-northeast-2" });

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

  await sendMail();

  // 실제 요청 처리
  return {
    statusCode: 200,
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `Hello, CDK! You've hit ${event.path}`,
    }),
  };
};

sendMail = async () => {
  const params = {
    Destination: {
      ToAddresses: ["jngkim@amazon.com"], // 수신자 이메일 주소
    },
    Message: {
      Body: {
        Text: { Data: "This is a test email from AWS Lambda using SES." }, // 이메일 본문
      },
      Subject: { Data: "Test Email" }, // 이메일 제목
    },
    Source: "jngkim@amazon.com", // 발신자 이메일 주소
  };

  try {
    const data = await ses.sendEmail(params).promise();
    console.log("Email sent successfully:", data);
    return {
      statusCode: 200,
      body: JSON.stringify("Email sent successfully!"),
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      statusCode: 500,
      body: JSON.stringify("Failed to send email."),
    };
  }
};
