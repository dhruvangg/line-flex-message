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

  const requiredFields = ["userId", "name", "date", "time"];
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

    const data = {
      to: body.userId,
      messages: [
        {
          type: "flex",
          altText: "This is a Flex Message",
          contents: {
            type: "bubble",
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "Appointment Confirmation Card",
                  weight: "bold",
                  size: "md",
                  color: "#00AA00",
                  wrap: true,
                },
                {
                  type: "text",
                  text: `Dear ${body.name},\nYour appointment is scheduled for ${body.date} at ${body.time}. Please reply "YES" to confirm, "NO" to cancel, or "RESCHEDULE" to request another time.\n\nClinic: Soma Health Longevity Wellness Clinic\nContact: 098 279 4738\nAddress: 4th Floor, Erawan Bangkok, 494 Phloen Chit Rd, Lumphini, Pathum Wan, Bangkok 10330\n\nWe look forward to supporting your journey to optimal health!`,
                  size: "sm",
                  margin: "md",
                  wrap: true,
                },
                {
                  type: "separator",
                  margin: "md",
                },
              ],
            },
            footer: {
              type: "box",
              layout: "vertical",
              spacing: "md",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  color: "#22C55E",
                  action: {
                    type: "postback",
                    label: "Confirm",
                    data: "action=confirm&appointmentId=123",
                  },
                },
                {
                  type: "button",
                  style: "secondary",
                  color: "#E5E7EB",
                  action: {
                    type: "postback",
                    label: "Reschedule",
                    data: "action=reschedule&appointmentId=123",
                  },
                },
                {
                  type: "button",
                  style: "primary",
                  color: "#EF4444",
                  action: {
                    type: "postback",
                    label: "Cancel",
                    data: "action=cancel&appointmentId=123",
                  },
                },
              ],
            },
          },
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
    console.error("LINE API error:", error.response?.data || error.message);
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        message: "Error sending message",
        error: error.response?.data || error.message,
      }),
    };
  }
};
