const CryptoJS = require('crypto-js');

const rootUrl = 'https://www.cls.cn';

const params = {
    appName: 'CailianpressWeb',
    os: 'web',
    sv: '7.7.5',
};

// 构造一个url参数请求串，参数按序排列并加上签名
const getSearchParams = (moreParams) => {
    const searchParams = new URLSearchParams({ ...params, ...moreParams });
    searchParams.sort();
    searchParams.append('sign', CryptoJS.MD5(CryptoJS.SHA1(searchParams.toString()).toString()).toString());
    return searchParams;
};

module.exports = {
    rootUrl,
    getSearchParams,
};
