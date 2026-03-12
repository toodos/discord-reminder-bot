const regex = /(?:[a-z0-9-]+\.)?(?:reddit\.com|redd\.it)\/(?:r\/[^\/]+\/)?comments\/[^\/]+(?:\/[^\/]+\/([a-z0-9]+))?/i;
const urls = [
    'https://www.reddit.com/r/vibecoding/comments/1rngkp8/comment/o9vju2k',
    'https://sh.reddit.com/r/vibecoding/comments/1rngkp8/comment/o9vju2k',
    'https://www.reddit.com/r/vibecoding/comments/1rngkp8/title_of_post/',
    'https://redd.it/1rngkp8',
    'https://www.reddit.com/r/Btechtards/comments/1rqy6rx/comment/oa23jkj/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button'
];

urls.forEach(url => {
    const match = url.match(regex);
    console.log(`URL: ${url}`);
    console.log(`Match: ${match ? 'YES' : 'NO'}`);
});
