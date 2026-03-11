const url = 'https://old.reddit.com/r/vibecoding/comments/1rngkp8/comment/o9vju2k.json';
const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function debug() {
    console.log(`Fetching: ${url}`);
    const res = await fetch(url, { headers: { 'User-Agent': ua } });
    console.log(`Status: ${res.status}`);
    if (res.ok) {
        const data = await res.json();
        require('fs').writeFileSync('reddit_debug.json', JSON.stringify(data, null, 2));
        console.log('Saved reddit_debug.json');
    } else {
        const text = await res.text();
        console.log('Error Body Snippet:', text.substring(0, 200));
    }
}
debug();
