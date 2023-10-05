const cheerio = require('cheerio');

module.exports = async (ctx) => {
    const actress = ctx.params.actress ?? '波多野結衣';

    const baseUrl = 'https://zh-cn.javmix.tv/actress/';

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
            title: $('head title').text(),
            description: $('meta[name=description]').attr('content'),
            items: $('#main .post-list a')
                .toArray()
                .map((item) => {
                    item = $(item);
                    return {
                        title: $(item).find('span').html(),
                        link: $(item).attr('href'),
                        pubDate: $(item).find('.post-list-time').html(),
                    };
                }),
        };
    });

    const items = await Promise.all(
        data.items.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const page = await browser.newPage();
                await page.setRequestInterception(true);
                page.on('request', (request) => {
                    request.resourceType() === 'document' || request.resourceType() === 'script' ? request.continue() : request.abort();
                });
                await page.goto(item.link, {
                    waitUntil: 'domcontentloaded',
                });
                // await page.waitForSelector('.nx_mfbox');

                // 加载详情页
                const html = await page.evaluate(() => document.documentElement.innerHTML);
                const $ = cheerio.load(html);
                item.description = $('#post-content').html();
                await page.close();
                return item;
            })
        )
    );

    await browser.close();

    ctx.state.data = {
        title: `MissAV-${actress}`,
        link: String(url),
        item: items,
    };
};
