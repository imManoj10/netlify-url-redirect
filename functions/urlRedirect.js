exports.handler = async (event) => {
    let path = event.path.replace("/.netlify/functions/urlRedirect",); // Ensure lowercase
    let parts = path.split("/").filter(Boolean);

    const KV = { 't': 'tally.so/r/', 'n': 'notion.so' };

    if (parts.length < 4 || !(parts[0] in KV)) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid URL format. Use /t/YYYY-MM-DD/formID/NID or /n/YYYY-MM-DD/formID/NID" }) };
    }

    let [type, date, formId, nid] = parts;

    // Validate date allowing both YYYY-MM-DD and YYYY-M-D formats
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(date)) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD or YYYY-M-D." }) };
    }

    let [year, month, day] = date.split("-").map(Number);
    let urlDate = new Date(year, month - 1, day); // Convert extracted date to JS Date object

    // Check if date is valid
    if (isNaN(urlDate.getTime()) || urlDate.getFullYear() !== year || urlDate.getMonth() + 1 !== month || urlDate.getDate() !== day) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid date provided." }) };
    }

    // Get today's date
    let today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize time to midnight for accurate comparison
    urlDate.setHours(0, 0, 0, 0); // Normalize URL date

    let diffInDays = Math.floor((today - urlDate) / (1000 * 60 * 60 * 24)); // Difference in days

    // Expire the link if it's older than 3 days
    if (diffInDays > 3) {
        return { statusCode: 400, body: JSON.stringify({ error: `The link has expired. (${diffInDays} days old)` }) };
    }

    // Validate formId (alphanumeric + underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(formId)) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid form ID." }) };
    }

    // Validate NID (1-4 digit numbers)
    if (!/^\d{1,4}$/.test(nid)) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid NID format." }) };
    }

    // Resolve source type
    let sourceType = KV[type];
    if (!sourceType) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid type. Use 't' for Tally or 'n' for Notion." }) };
    }

    // Construct the redirect URL
    let queryLink = `https://${sourceType}/${formId}?NID=${encodeURIComponent(nid)}`;

    return {
        statusCode: 301,
        headers: { Location: queryLink }
    };
};
