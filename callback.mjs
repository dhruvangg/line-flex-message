import axios from "axios";

export const handler = async (event) => {
  try {
    const params = event.queryStringParameters || event.query || {};

    const action = params.action;
    const appointmentId = params.appointmentId; 
    const objectType = "appointments"; // need to change object type

    if (!action || !appointmentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing required query parameters: action or appointmentId",
        }),
      };
    }

    const confirmationMap = {
      reschedule: "Rescheduled",
      confirm: "YS06",
      cancel: "gjLJ",
    };

    const confirmationValue = confirmationMap[action.toLowerCase()];
    if (!confirmationValue) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid action value" }),
      };
    }

    const hubspotToken = process.env.HUBSPOT_ACCESS_TOKEN; 

    const url = `https://api.hubapi.com/crm/v3/objects/${objectType}/${appointmentId}`;

    const payload = {
      properties: {
        confirmation: confirmationValue,
      },
    };

    const response = await axios.patch(url, payload, {
      headers: {
        Authorization: `Bearer ${hubspotToken}`,
        "Content-Type": "application/json",
      },
    });

    return await HTMLresponse();
  } catch (error) {
    console.error("Error updating HubSpot:", error.response?.data || error.message);
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        message: "Error updating confirmation",
        error: error.response?.data || error.message,
      }),
    };
  }
};


async function HTMLresponse() {
    try {
        const apiResponse = await axios.get(
            "https://api.hubapi.com/cms/v3/hubdb/tables/131527577/rows/195694278199",
            {
                headers: {
                    Authorization: `Bearer ${hubspotToken}`,
                },
            }
        );

        const template = apiResponse.data;

        const html = `<!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${template.values.title}</title>
      <style>
        body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial; padding: 24px; max-width: 900px; margin: auto; }
      </style>
      <script>
        setTimeout(() => window.close(), 5000);
      </script>
    </head>
    <body>
      ${template.values.message}
    </body>
    </html>`;

        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
            body: html,
        };
    } catch (error) {
        console.error("Error fetching HubSpot data:", error.message);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Failed to fetch template",
                details: error.message,
            }),
        };
    }
}
