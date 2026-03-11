const urls = [
    'https://www.reddit.com/r/vibecoding/comments/1rngkp8/comment/o9vju2k.json',
    'https://old.reddit.com/r/vibecoding/comments/1rngkp8/comment/o9vju2k.json',
    'https://sh.reddit.com/r/vibecoding/comments/1rngkp8/comment/o9vju2k.json'
];

async function testReddit() {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    
    for (const url of urls) {
        console.log(`\nTesting: ${url}`);
        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': ua }
            });
            console.log(`Status: ${res.status} ${res.statusText}`);
            if (res.ok) {
                const data = await res.json();
                console.log('Success! Data received.');
                // console.log(JSON.stringify(data[1].data.children[0].data.body, null, 2));
            } else {
                const text = await res.text();
                console.log(`Error Body: ${text.substring(0, 100)}...`);
            }
        } catch (err) {
            console.log(`Fetch Error: ${err.message}`);
        }
    }
}

testReddit();
