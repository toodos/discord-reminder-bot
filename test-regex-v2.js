const regex = /(?:[a-z0-9-]+\.)?(?:reddit\.com|redd\.it)\/(?:r\/[^\/]+\/)?comments\/[^\/]+(?:\/[^\/]+\/([a-z0-9]+))?/i;
const urls = [
    'https://www.reddit.com/r/vibecoding/comments/1rngkp8/comment/o9vju2k',
    'https://sh.reddit.com/r/vibecoding/comments/1rngkp8/comment/o9vju2k',
    'https://www.reddit.com/r/vibecoding/comments/1rngkp8/title_of_post/',
    'https://redd.it/1rngkp8'
];

urls.forEach(url => {
    const match = url.match(regex);
    console.log(`URL: ${url}`);
    console.log(`Match: ${match ? 'YES' : 'NO'}`);
});
