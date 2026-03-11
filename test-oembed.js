const url = 'https://www.reddit.com/r/vibecoding/comments/1rngkp8/comment/o9vju2k';
const oembedUrl = `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`;
const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function testOEmbed() {
    console.log(`Testing OEmbed: ${oembedUrl}`);
    try {
        const res = await fetch(oembedUrl, {
            headers: { 'User-Agent': ua }
        });
        console.log(`Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const data = await res.json();
            console.log('Success! OEmbed data:');
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log('Failed to fetch OEmbed');
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

testOEmbed();
