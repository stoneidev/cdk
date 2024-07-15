exports.handler = async function (event, context) {
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));

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
