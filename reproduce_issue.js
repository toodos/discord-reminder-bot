const url = 'https://www.reddit.com/r/Btechtards/comments/1rqy6rx/comment/oa23jkj/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button';
const discordUA = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';

const fs = require('fs');

async function debug() {
    let verificationUrl = url.split('?')[0].replace(/\/$/, '');
    console.log(`Verification URL: ${verificationUrl}`);

    const isCommentLink = verificationUrl.includes('/comments/') && verificationUrl.split('/comments/')[1].split('/').filter(p => p).length >= 3;
    console.log(`Is Comment Link: ${isCommentLink}`);

    const jsonUrl = verificationUrl.replace(/https?:\/\/([a-z0-9-]+\.)?reddit\.com/i, 'https://old.reddit.com') + '.json';
    console.log(`JSON URL: ${jsonUrl}`);

    try {
        const response = await fetch(jsonUrl, { 
            headers: { 'User-Agent': discordUA }, 
        });
        
        console.log(`Status: ${response.status}`);
        if (response.ok) {
            const data = await response.json();
            fs.writeFileSync('debug_reddit.json', JSON.stringify(data, null, 2));
            console.log(`Data saved to debug_reddit.json`);
            
            if (Array.isArray(data)) {
                console.log(`Array Length: ${data.length}`);
                if (data[1] && data[1].data && data[1].data.children) {
                    const children = data[1].data.children;
                    if (children.length > 0) {
                        const firstChild = children[0];
                        console.log(`First child kind: ${firstChild.kind}`);
                        console.log(`First child author: ${firstChild.data?.author}`);
                        console.log(`First child body: ${firstChild.data?.body?.substring(0, 50)}...`);
                    } else {
                        console.log("No children in data[1]");
                    }
                }
            }
        } else {
            const text = await response.text();
            console.log(`Error Response: ${text.substring(0, 200)}`);
        }
    } catch (e) {
        console.log('Fetch Error:', e.message);
    }
}

debug();
