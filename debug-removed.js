const url = 'https://old.reddit.com/r/ChaiApp/comments/14afzrx/comment/nqpel1p.json';
const ua = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';

async function debug() {
    console.log(`Fetching Removed Comment JSON: ${url}`);
    try {
        const res = await fetch(url, { headers: { 'User-Agent': ua } });
        if (res.ok) {
            const data = await res.json();
            require('fs').writeFileSync('removed_comment_debug.json', JSON.stringify(data, null, 2));
            console.log('Saved removed_comment_debug.json');
        } else {
            console.log('Error:', res.status);
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
}
debug();
