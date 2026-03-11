const url = 'https://www.reddit.com/r/vibecoding/comments/1rngkp8/comment/o9vju2k';
const oembedUrl = `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`;
const jsonUrl = `${url}.json`;
const discordUA = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';

async function debugLink() {
    console.log(`\n--- JSON TEST ---`);
    try {
        const res = await fetch(jsonUrl, { headers: { 'User-Agent': discordUA } });
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            console.log('JSON Data (Snippet):', JSON.stringify(data[1].data.children[0].data, (k,v) => k === 'replies' ? undefined : v).substring(0, 500));
        }
    } catch (e) { console.log(e.message); }

    console.log(`\n--- OEMBED TEST ---`);
    try {
        const res = await fetch(oembedUrl, { headers: { 'User-Agent': discordUA } });
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            console.log('OEmbed Data:', JSON.stringify(data, null, 2));
        }
    } catch (e) { console.log(e.message); }
}

debugLink();
