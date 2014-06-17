var request = require('request'),
    cheerio = require('cheerio'),
    async   = require('async'),
    config  = require('./config'),
    $;

var request = request.defaults({jar: true}),
    ua = 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.137 Safari/537.36';
    defaultHeaders = {
        'User-Agent': ua
    },
    redeemHeaders = {
        'Referer': config.host + config.redeem.missionUrl,
        'User-Agent': ua
    },
    loginHeaders = {
        'Origin': config.host,
        'Referer': config.host + config.redeem.loginUrl,
        'User-Agent': ua
    },
    opts = {
        url: '',
        headers: defaultHeaders
    };

function isRedeem(body) {
    if (typeof body !== 'string') return false;
    $ = cheerio.load(body);
    var script = $('.super.normal.button').attr('onclick');
    return script.slice(script.indexOf("'") + 1, script.length - 2);
}

async.waterfall([
    function(callback) {
        opts.url = config.host + config.redeem.loginUrl;
        request(opts, function(err, res, body) {
            if (res.statusCode == 200) {
                $ = cheerio.load(body);
                var once = $('input[name="once"]').val();
                callback(err, once);
            }
        });
    },
    function(once, callback) {
        opts.headers = loginHeaders;
        request.post(opts, function(err, res, body){
            if (res.statusCode == 200 || res.statusCode == 302) {
                callback(err, body);
            } else {
                console.log(res.statusCode);
            }
        }).form({
            u: config.user,
            p: config.password,
            once: once,
            next: '/'
        });
    },
    function(body, callback) {
        opts.url = config.host + config.redeem.missionUrl;
        request(opts, function(err, res, body) {
            if (res.statusCode == 200) {
                var href = isRedeem(body);
                if (href.indexOf('balance') === -1) {
                    callback(null, href);
                } else {
                    console.log('已签到。');
                }
            }
        });
    }, 
    function(href, callback) {
        opts.headers = redeemHeaders;
        opts.url = config.host + href;
        console.log(opts);
        request(opts, function(err, res, body) {
            if (res.statusCode == 200 || res.statusCode == 302) {
                console.log(res);
                callback(null, body);
            } else {
                console.error(err);
                console.log(res.statusCode);
            }
        }); 
    }
], function(err, body) {
    if (err) {
        console.error(err);
    } else {
        var href = isRedeem(body);
        console.log(href);
        if (href.indexOf('balance') !== -1) {
            console.log('签到成功。');
        } else {
            console.log('签到失败。');
        }
    }
});
