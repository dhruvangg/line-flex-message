import axios from "axios";

export const handler = async (event) => {
  let body = {};

  try {
    if (event.body) {
      body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    }
  } catch (err) {
    console.error("Invalid JSON:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid JSON input" }),
    };
  }

  const requiredFields = ["userId", "tableRowId"];
  const missing = requiredFields.filter((field) => !body[field]);

  if (missing.length > 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Missing required fields",
        missingFields: missing,
      }),
    };
  }

  try {
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!channelAccessToken) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "LINE channel access token not configured" }),
      };
    }

    const apiResponse = await axios.get(`https://api.hubapi.com/cms/v3/hubdb/tables/131527577/rows/${body.tableRowId}`, {
      headers: { Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}` },
    });
    const template = apiResponse.data;

    const data = {
      to: body.userId,
      messages: [
        {
          type: "flex",
          altText: template.values.title,
          contents: template.values.content,
        },
      ],
    };

    const response = await axios.post(
      "https://api.line.me/v2/bot/message/push",
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${channelAccessToken}`,
        },
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Push message sent successfully",
        data: response.data,
      }),
    };
  } catch (error) {
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        message: "Error sending message",
        error: error.response?.data || error.message,
      }),
    };
  }
};