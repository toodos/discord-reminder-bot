const url = 'https://www.reddit.com/r/TwentiesIndia/s/w95VWOMNpd';
const oembedUrl = `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`;
const discordUA = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';

async function debug() {
    console.log(`\n--- TESTING LOGIC FOR: ${url} ---\n`);
    
    console.log(`Testing OEmbed: ${oembedUrl}`);
    try {
        const res = await fetch(oembedUrl, { headers: { 'User-Agent': discordUA } });
        console.log(`OEmbed Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const data = await res.json();
            console.log('OEmbed Data:', JSON.stringify(data, null, 2));
        } else {
            console.log('OEmbed Failed');
        }
    } catch (e) { console.log('OEmbed Error:', e.message); }

    // Also testing if we can follow the redirect to get the real URL
    console.log(`\nTesting Redirect:`);
    try {
        const res = await fetch(url, { 
            headers: { 'User-Agent': discordUA },
            redirect: 'manual' 
        });
        console.log(`Redirect Status: ${res.status}`);
        console.log(`Location: ${res.headers.get('location')}`);
    } catch (e) { console.log('Redirect Error:', e.message); }
}

debug();
