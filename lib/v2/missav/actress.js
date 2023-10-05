const cheerio = require('cheerio');

module.exports = async (ctx) => {
    // 第一次全量加载

    // 之后

    const actress = ctx.params.actress ?? '葵司';

    const baseUrl = 'https://missav.com/cn/actresses/';

    const url = `${baseUrl}${actress}`;

    const browser = await require('@/utils/puppeteer')({ stealth: true });
    const data = await ctx.cache.tryGet(url, async () => {
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            request.resourceType() === 'document' || request.resourceType() === 'script' ? request.continue() : request.abort();
        });
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
        });
        // await page.waitForSelector('.post-list');
        const html = await page.evaluate(() => document.documentElement.innerHTML);
        await page.close();

        const $ = cheerio.load(html);

        return {
            items: $('.gap-5>div')
                .toArray()
                .map((item) => {
                    item = $(item);
                    return {
                        title: $(item).find('.truncate').find('a').html(),
                        link: $(item).find('.truncate').find('a').attr('href'),
                    };
                }),
        };
    });

    // const items = await Promise.all(
    //     data.items.map((item) =>
    //         ctx.cache.tryGet(item.link, async () => {
    //             const page = await browser.newPage();
    //             await page.setRequestInterception(true);
    //             page.on('request', (request) => {
    //                 request.resourceType() === 'document' || request.resourceType() === 'script' ? request.continue() : request.abort();
    //             });
    //             await page.goto(item.link, {
    //                 waitUntil: 'domcontentloaded',
    //             });
    //             // await page.waitForSelector('.nx_mfbox');

    //             // 加载详情页
    //             const html = await page.evaluate(() => document.documentElement.innerHTML);
    //             // const $ = cheerio.load(html);
    //             item.description = html;
    //             await page.close();
    //             return item;
    //         })
    //     )
    // );

    await browser.close();

    ctx.state.data = {
        title: `MissAV-${actress}`,
        link: String(url),
        item: data.items,
    };
};
