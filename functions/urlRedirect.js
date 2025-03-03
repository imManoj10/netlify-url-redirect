exports.handler = async (event) => {
    const path = event.path.replace("/.netlify/functions/urlRedirect", "");
    const parts = path.split("/").filter(Boolean);

    // Ensure "t" or "n" is present
    let typeIndex = parts.findIndex(p => p === "t" || p === "n");
    if (typeIndex === -1 || parts.length <= typeIndex + 3) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid URL format. Use /t/YYYY-MM-DD/formID/NID or /n/YYYY-MM-DD/formID/NID" })
        };
    }

    let [date, formId, nid] = parts.slice(typeIndex + 1, typeIndex + 4);

    // Validate Date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid date format." }) };
    }

    // Validate Form ID
    if (!/^[a-zA-Z0-9_]+$/.test(formId)) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid form ID." }) };
    }

    // Validate NID
    if (!/^\d{1,4}$/.test(nid)) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid NID format." }) };
    }

    // Ensure Date is today
    let today = new Date().toISOString().split("T")[0];
    if (date !== today) {
        return { statusCode: 400, body: JSON.stringify({ error: "Date must be today's date." }) };
    }

    // Expiration: Links expire in 3 days
    let expirationLimit = new Date(date);
    expirationLimit.setDate(expirationLimit.getDate() + 3);
    if (new Date() > expirationLimit) {
        return { statusCode: 400, body: JSON.stringify({ error: "The link has expired." }) };
    }

    // Determine the target URL (Tally or Notion)
    let sourceType = parts[typeIndex] === "t" ? "tally.so" : "notion.so";
    let queryLink = `https://${sourceType}/${formId}?NID=${encodeURIComponent(nid)}`;

    return {
        statusCode: 301,
        headers: { Location: queryLink },
        body: JSON.stringify({ redirect: queryLink })
    };
};
