'use strict';

import bunyan from 'bunyan';

const logger = bunyan.createLogger({name: "generator", level: 'info'});

export default class {
    /**
     * @param {axios} httpClient
     */
    constructor(httpClient) {
        this._httpClient = httpClient;
    }

    /**
     * @returns {Promise}
     * @private
     */
    _loadHomePage() {
        return new Promise((resolve, reject) => {
            this._httpClient
                .get('/')
                .then(response => {
                    logger.info('Home Page Loaded');
                    resolve(response.data);
                })
                .catch(reject)
        });
    }

    _findCacheJsUri(html) {
        return new Promise((resolve, reject) => {
            try {
                const jsUri = html.match('\\/cache\\/js\\/(.+)\\.js')[0];
                logger.info('CacheJS URI found');
                resolve(jsUri);
            } catch (er) {
                reject(er)
            }
        });
    }

    _loadPackedCacheJs(cacheJsUri) {
        return new Promise((resolve, reject) => {
            this._httpClient.get(cacheJsUri, {
                responseType: 'text'
            }).then(response => {
                logger.info('Packed JS loaded');
                resolve(response.data)
            }).catch(error => {
                logger.error('PackedJS could not be loaded', e);
                reject(error);
            })
        });
    }

    _clearPackedJs(sourceCode) {
        return new Promise((resolve, reject) => {
            try {
                let script = sourceCode.trim().match('^eval\((.*)\)$')[1];
                script = (new Function('data', 'return eval(data);'))(script);
                script = script.replace(/var\ language.*\.language\;/g, '')
                script = script.replace(/(\$\.ajaxSetup\(.*\))/, '');
                script = script.replace('$(\'.layout-tab-pane\').each(function(){tmp+=2});', 'tmp+= 6;');

                logger.info('PackedJS cleaned up');

                const acceptLangQuery = (new Function('data', 'var sessId = eval(data); return startCache(sessId);'))(script);

                logger.info('Accept-Language cookie calculated: ' + acceptLangQuery);

                resolve(acceptLangQuery);
            } catch (e) {
                logger.error('PackedJS could not be clean up', e);
                reject(e);
            }
        })
    }

    /**
     * @returns {Promise}
     */
    generate() {
        return new Promise((resolve, reject) => {
            this._loadHomePage()
                .then(html => this._findCacheJsUri(html))
                .then(cacheJsUri => this._loadPackedCacheJs(cacheJsUri))
                .then(source => this._clearPackedJs(source))
                .then(acceptLangQuery => resolve(acceptLangQuery))
                .catch(error => { reject(error) })
            ;
        })
    }
}
