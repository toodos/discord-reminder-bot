const url = 'https://www.reddit.com/r/vibecoding/comments/1rngkp8/comment/o9vju2k';
const oembedUrl = `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`;
const discordUA = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';

async function debugLink() {
    try {
        const res = await fetch(oembedUrl, { headers: { 'User-Agent': discordUA } });
        if (res.ok) {
            const data = await res.json();
            console.log('Keys:', Object.keys(data));
            if (data.html) {
                console.log('HTML (Snippet):', data.html.substring(0, 500));
            }
            console.log('Full Data:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.log(e.message);
    }
}

debugLink();
