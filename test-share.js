const url = 'https://old.reddit.com/r/vibecoding/s/O5WfH2V6Q1.json'; // Example share link structure
const ua = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';

async function testShare() {
    console.log(`Testing Share Link: ${url}`);
    try {
        const res = await fetch(url, { headers: { 'User-Agent': ua } });
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            console.log('Success! Data received.');
            // console.log(JSON.stringify(data, null, 2).substring(0, 500));
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
}
testShare();
