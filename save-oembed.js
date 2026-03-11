const url = 'https://www.reddit.com/r/vibecoding/comments/1rngkp8/comment/o9vju2k';
const oembedUrl = `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`;
const discordUA = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';

async function debug() {
    const res = await fetch(oembedUrl, { headers: { 'User-Agent': discordUA } });
    const data = await res.json();
    require('fs').writeFileSync('oembed.json', JSON.stringify(data, null, 2));
    console.log('Saved oembed.json');
}
debug();
