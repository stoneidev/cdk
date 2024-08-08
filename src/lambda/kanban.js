exports.handler = async (event) => {
  const dailyWorkItem = [
    {
      day: new Date("2024-08-06"),
      done: 2,
      doing: 9,
      backlog: 8,
    },
    {
      day: new Date("2024-08-07"),
      done: 7,
      doing: 8,
      backlog: 12,
    },
    {
      day: new Date("2024-08-08"),
      done: 7,
      doing: 8,
      backlog: 12,
    },
    {
      day: new Date("2024-08-09"),
      done: 7,
      doing: 8,
      backlog: 12,
    },
    {
      day: new Date("2024-08-10"),
      done: 7,
      doing: 8,
      backlog: 12,
    },
    {
      day: new Date("2024-08-11"),
      done: 7,
      doing: 8,
      backlog: 12,
    },
    {
      day: new Date("2024-08-12"),
      done: 7,
      doing: 8,
      backlog: 12,
    },
    {
      day: new Date("2024-08-13"),
      done: 7,
      doing: 8,
      backlog: 12,
    },
    {
      day: new Date("2024-08-14"),
      done: 7,
      doing: 8,
      backlog: 14,
    },
    {
      day: new Date("2024-08-15"),
      done: 7,
      doing: 8,
      backlog: 16,
    },
    {
      day: new Date("2024-08-16"),
      done: 7,
      doing: 8,
      backlog: 16,
    },
    {
      day: new Date("2024-08-17"),
      done: 7,
      doing: 8,
      backlog: 16,
    },
    {
      day: new Date("2024-08-18"),
      done: 10,
      doing: 8,
      backlog: 16,
    },
  ];

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

  const response = {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dailyWorkItem),
  };

  return response;
};
