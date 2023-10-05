module.exports = function (router) {
    router.get('/actress/:actress', require('./actress'));
};
