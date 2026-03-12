const fs = require('fs');

const browserUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function verifyLink(url) {
    console.log(`\n--- Verifying: ${url} ---`);
    let verificationUrl = url.split('?')[0].replace(/\/$/, '');
    
    // Share link resolution simulation (since we can't easily follow redirects in a simple script without fetch)
    // But we know the user's link isn't a /s/ link, so it's fine for now.
    
    const jsonUrl = verificationUrl.replace(/https?:\/\/([a-z0-9-]+\.)?reddit\.com/i, 'https://old.reddit.com') + '.json';
    console.log(`JSON URL: ${jsonUrl}`);

    try {
        const response = await fetch(jsonUrl, { 
            headers: { 'User-Agent': browserUA }, 
        });
        
        if (!response.ok) {
            console.log(`Status: ${response.status} (FAILED)`);
            return;
        }

        const data = await response.json();
        let isShowing = false;

        const pathParts = verificationUrl.split('/');
        const isCommentLink = (verificationUrl.includes('/comments/') || verificationUrl.includes('/comment/')) && 
                             (pathParts.indexOf('comments') !== -1 ? pathParts.length - pathParts.indexOf('comments') >= 4 : pathParts.length - pathParts.indexOf('comment') >= 4);

        console.log(`Is Comment Link: ${isCommentLink}`);

        if (isCommentLink) {
            if (Array.isArray(data) && data[1] && data[1].data && data[1].data.children) {
                const commentId = pathParts[pathParts.length - 1];
                const children = data[1].data.children;
                let commentData = children.find(c => c.data && c.data.id === commentId)?.data;
                
                if (!commentData && children.length > 0 && children[0].kind === 't1') {
                    commentData = children[0].data;
                }

                if (commentData) {
                    isShowing = commentData.author !== '[deleted]' && 
                                commentData.body !== '[removed]' && 
                                commentData.body !== '[deleted]' &&
                                !commentData.removed_by_category;
                    console.log(`Comment Author: ${commentData.author}, Showing: ${isShowing}`);
                    console.log(`Body Snippet: ${commentData.body.substring(0, 50)}...`);
                } else {
                    console.log(`Comment ${commentId} not found`);
                }
            }
        } else {
            if (Array.isArray(data) && data[0] && data[0].data && data[0].data.children && data[0].data.children.length > 0) {
                const post = data[0].data.children[0].data;
                isShowing = post.author !== '[deleted]' && 
                            post.selftext !== '[removed]' && 
                            post.selftext !== '[deleted]' &&
                            !post.removed_by_category;
                console.log(`Post Author: ${post.author}, Showing: ${isShowing}`);
            }
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
}

async function run() {
    // Problematic link from user
    await verifyLink('https://www.reddit.com/r/Btechtards/comments/1rqy6rx/comment/oa23jkj/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button');
    
    // Normal comment link
    await verifyLink('https://www.reddit.com/r/vibecoding/comments/1rngkp8/comment/o9vju2k');
    
    // Post link
    await verifyLink('https://www.reddit.com/r/vibecoding/comments/1rngkp8/my_first_vibe_post/');
}

run();
