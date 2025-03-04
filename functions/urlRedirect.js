exports.handler = async (event) => {
    let path = event.path.replace("/.netlify/functions/urlRedirect", "").toLowerCase(); // Ensure lowercase
    let parts = path.split("/").filter(Boolean);

    // KV Mapping for Redirection
    const KV = { 't': 'tally.so', 'n': 'notion.so' };

    // Step 1: Check for a valid structure
    if (parts.length < 4 || !(parts[0] in KV)) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid URL format. Use /t/YYYY-MM-DD/formID/NID or /n/YYYY-MM-DD/formID/NID" }) };
    }

    // Step 2: Extract Parameters
    let [type, date, formId, nid] = parts;

    // Step 3: Validate the Date Format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid date format." }) };
    }

    // Step 4: Validate Form ID and NID
    if (!/^[a-zA-Z0-9_]+$/.test(formId)) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid form ID." }) };
    }
    if (!/^\d{1,4}$/.test(nid)) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid NID format." }) };
    }

    // Step 5: Ensure the Date in the URL is Today’s Date
    let today = new Date().toISOString().split("T")[0];
    if (date !== today) {
        return { statusCode: 400, body: JSON.stringify({ error: "Date must be today's date." }) };
    }

    // Step 6: Expiration: Links expire in 3 days
    let expirationLimit = new Date(date);
    expirationLimit.setDate(expirationLimit.getDate() + 3);
    if (new Date() > expirationLimit) {
        return { statusCode: 400, body: JSON.stringify({ error: "The link has expired." }) };
    }

    // Step 7: Redirect to the Correct Source (Tally or Notion)
    let sourceType = KV[type];
    if (!sourceType) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid type. Use 't' for Tally or 'n' for Notion." }) };
    }

    let queryLink = `https://${sourceType}/${formId}?NID=${encodeURIComponent(nid)}`;

    return {
        statusCode: 301,
        headers: { Location: queryLink }
    };
};
