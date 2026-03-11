const url = 'https://www.reddit.com/r/TwentiesIndia/s/w95VWOMNpd';
const discordUA = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';

async function debug() {
    console.log(`Resolving Share Link: ${url}`);
    try {
        // Step 1: Resolve the share link
        const res = await fetch(url, { 
            headers: { 'User-Agent': discordUA },
            redirect: 'follow' 
        });
        
        const finalUrl = res.url.split('?')[0];
        console.log(`Resolved URL: ${finalUrl}`);
        
        // Step 2: Use JSON logic on the resolved URL
        const jsonUrl = finalUrl.replace(/\/$/, '').replace(/https?:\/\/([a-z0-9-]+\.)?reddit\.com/i, 'https://old.reddit.com') + '.json';
        console.log(`JSON URL: ${jsonUrl}`);
        
        const jsonRes = await fetch(jsonUrl, { headers: { 'User-Agent': discordUA } });
        console.log(`JSON Status: ${jsonRes.status}`);
        
        if (jsonRes.ok) {
            const data = await jsonRes.json();
            // Standard existence check
            const isShowing = data && data[0] && data[0].data.children.length > 0;
            console.log(`Is Showing: ${isShowing}`);
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
}

debug();
