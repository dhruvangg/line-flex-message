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

  const requiredFields = ["userId", "name", "date", "time", "appointmentId", "tableRowId"];
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

    const apiResponse = await axios.get(`https://api.hubapi.com/cms/v3/hubdb/tables/131527577/rows/${tableRowId}`, {
      headers: { Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}` },
    });

    const template = apiResponse.data;

    const messageContent = renderTemplate(template.values.content, {
      name: body.name,
      date: body.date,
      time: body.time,
    });

    const actionButtons = [];

    if (template.values.confirm_label) {
      actionButtons.push({
        type: "button",
        style: "primary",
        color: "#22C55E",
        action: {
          type: "postback",
          label: template.values.confirm_label,
          data: `action=confirm&appointmentId=${body.appointmentId}&tableRowId=${body.tableRowId}`,
        }
      })
    }
    if (template.values.reschedule_label) {
      actionButtons.push({
        type: "button",
        style: "secondary",
        color: "#E5E7EB",
        action: {
          type: "postback",
          label: template.values.reschedule_label,
          data: `action=reschedule&appointmentId=${body.appointmentId}&tableRowId=${body.tableRowId}`,
        }
      })
    }
    if (template.values.cancel_label) {
      actionButtons.push({
        type: "button",
        style: "primary",
        color: "#EF4444",
        action: {
          type: "postback",
          label: template.values.cancel_label || "Cancel",
          data: `action=cancel&appointmentId=${body.appointmentId}&tableRowId=${body.tableRowId}`,
        }
      })
    }

    const data = {
      to: body.userId,
      messages: [
        {
          type: "flex",
          altText: template.values.title,
          contents: {
            type: "bubble",
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  "text": template.values.name,
                  weight: "bold",
                  size: "md",
                  color: "#00AA00",
                  wrap: true,
                },
                {
                  type: "text",
                  text: messageContent,
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
              contents: actionButtons,
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
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        message: "Error sending message",
        error: error.response?.data || error.message,
      }),
    };
  }
};

function renderTemplate(content, patient) {
  if (!content || typeof content !== "string") {
    console.error("Template content is invalid:", content);
    return "";
  }

  return content
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\$\{name\}/g, patient.name)
    .replace(/\$\{date\}/g, patient.date)
    .replace(/\$\{time\}/g, patient.time);
}