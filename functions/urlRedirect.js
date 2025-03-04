exports.handler = async (event) => {
    let path = event.path.replace("/.netlify/functions/urlRedirect", ""); 
    let parts = path.split("/").filter(Boolean); 

    
    const KV = { 't': 'tally.so', 'n': 'notion.so' };

    
    if (parts.length < 3 || !(parts[0] in KV)) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid URL format. Use /t/YYYY-MM-DD/formID/NID" }) };
    }

    
    let [type, date, formId, nid] = parts;

    
    let today = new Date().toISOString().split("T")[0];
    if (date === "{{today}}") {
        let newUrl = `https://sage-blini-d5e64b.netlify.app/t/${today}/${formId}/${nid}`;
        return {
            statusCode: 301,
            headers: { Location: newUrl } 
        };
    }

    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid date format." }) };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formId)) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid form ID." }) };
    }
    if (!/^\d{1,4}$/.test(nid)) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid NID format." }) };
    }


    if (date !== today) {
        return { statusCode: 400, body: JSON.stringify({ error: "Date must be today's date." }) };
    }

    let sourceType = KV[type];
    let queryLink = `https://${sourceType}/${formId}?NID=${encodeURIComponent(nid)}`;

    return {
        statusCode: 301,
        headers: { Location: queryLink }
    };
};
