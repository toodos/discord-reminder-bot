const url = 'https://www.reddit.com/r/vibecoding/comments/1rngkp8/comment/o9vju2k';
const oembedUrl = `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`;
const discordUA = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';

async function testDiscordUA() {
    console.log(`Testing with Discord UA: ${discordUA}`);
    try {
        const res = await fetch(oembedUrl, {
            headers: { 'User-Agent': discordUA }
        });
        console.log(`OEmbed Status: ${res.status} ${res.statusText}`);
        
        const resJson = await fetch(`${url}.json`, {
            headers: { 'User-Agent': discordUA }
        });
        console.log(`JSON Status: ${resJson.status} ${resJson.statusText}`);
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

testDiscordUA();
