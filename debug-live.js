const url = 'https://old.reddit.com/r/vibecoding/comments/1rngkp8/ive_been_testing_ai_app_builders_for_3_months/.json';
const ua = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';

async function debug() {
    console.log(`Fetching Live Link: ${url}`);
    const res = await fetch(url, { headers: { 'User-Agent': ua } });
    if (res.ok) {
        const data = await res.json();
        require('fs').writeFileSync('live_reddit_debug.json', JSON.stringify(data, null, 2));
        console.log('Saved live_reddit_debug.json');
    } else {
        console.log('Error:', res.status);
    }
}
debug();
