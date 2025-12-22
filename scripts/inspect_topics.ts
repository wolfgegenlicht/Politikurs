const CURRENT_LEGISLATURE_ID = 161;
async function fetchOne() {
    const response = await fetch(
        `https://www.abgeordnetenwatch.de/api/v2/polls?field_legislature=${CURRENT_LEGISLATURE_ID}&range_end=1&sort_by=field_poll_date&sort_direction=desc`,
        { headers: { 'Accept': 'application/json' } }
    );
    const data = await response.json();
    if (data.data && data.data.length > 0) {
        console.log("Topics Structure:", JSON.stringify(data.data[0].field_topics, null, 2));
    } else {
        console.log("No polls found.");
    }
}
fetchOne();
