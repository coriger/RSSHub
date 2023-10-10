const path = require('path');
const { chromium } = require('playwright');

// npx playwright codegen www.douyin.com --save-storage=douyin.auth.json --channel=msedge
// npx playwright codegen --load-storage=douyin.auth.json --channel=msedge www.douyin.com
module.exports = async (ctx) => {
    const uid = ctx.params.uid;
    if (!uid.startsWith('MS4wLjABAAAA')) {
        throw Error('Invalid UID. UID should start with <b>MS4wLjABAAAA</b>.');
    }

    const pageUrl = `https://www.douyin.com/user/${uid}`;

    // Setup
    const browser = await chromium.launch({
        // headless: false,
        args: ['--no-sandbox'],
        channel: 'msedge-dev',
    });

    const context = await browser.newContext({
        storageState: path.join(__dirname, 'douyin.auth.json'),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47',
    });
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('https://www.douyin.com', {
        waitUntil: 'domcontentloaded',
        extraHTTPHeaders: {
            Referer: 'https://www.douyin.com',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        },
    });

    // 跳转up主页面
    await page.goto(pageUrl, {
        waitUntil: 'networkidle',
        extraHTTPHeaders: {
            Referer: 'https://www.douyin.com',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        },
    });

    let cnt = 0;
    // 循环下拉
    while (true) {
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(200);
        cnt = cnt + 1;
        console.log('scrolling ...')
        // 判断是否加载到最后
        const loadFinish = page.getByText('暂时没有更多了');
        if (await loadFinish.isVisible() || cnt >=8) break;
    }

    console.log('scrolling finish...')

    // 获取列表
    locators = await page.locator('.Eie04v01').locator('a').all();
    const items = [];

    let index = 0;
    for (const lc of locators) {
        index = index + 1;
        let text = await lc.getAttribute('href');
        let title = await lc.locator('.iQKjW6dr').innerText();
        if (text.includes('note')) {
            console.log(index + '、' + text.replace('//www', 'www'));
        } else if (text.includes('video')) {
            console.log(index + '、www.douyin.com' + text);
            let videoId = text.replace('/video/','');
            // https://open.douyin.com/player/video?vid=7230960201719926077&autoplay=0
            const videoIframe = "<div style='position: relative; width: 100%;height:580px;padding-top: calc(100% * 720 / 1280);border: 2px black solid;'><iframe referrerpolicy='unsafe-url' width='1280' style='position: absolute; width: 100%; height: 100%; top: 0;' allow='autoplay' src='https://open.douyin.com/player/video?autoplay=1&vid="+videoId+"'></iframe><a style='font-color:red' target='_self' href='"+text+"'>详情页</a></div>";
    
            items.push({
                title: title,
                description: videoIframe,
                link: text,
            });
        }
    }

    // 获取up页面title和desc
    let title = await page.locator("head>title").innerText();
    title = title.replace("的主页","");
    const desc = await page.locator("meta[name='description']").getAttribute("content");
    // const image = await page.locator(".RPhIHafP>div>img").getAttribute("src");

    ctx.state.data = {
        title: title,
        description: desc,
        image: '',
        link: pageUrl,
        item: items,
    };
    // allowEmpty: true,
};
