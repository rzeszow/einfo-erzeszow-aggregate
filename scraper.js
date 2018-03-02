'use strict';

import fs from 'fs';
import axios from 'axios';
import axiosCookieJarSupport from '@3846masa/axios-cookiejar-support';
import tough from 'tough-cookie';
import schedule from 'node-schedule';
import Generator from './generator';
import fx from 'mkdir-recursive';
import bunyan from 'bunyan';

axiosCookieJarSupport(axios);

const logger = bunyan.createLogger({name: "scraper", level: 'info'});
const cookieJar = new tough.CookieJar();
const httpClient = axios.create({
    'baseURL': 'http://einfo.erzeszow.pl',
    withCredentials: true,
    jar: cookieJar
});
const generator = new Generator(httpClient);
let acceptLangQuery = null;

const _generatorHandler = () => {
    return new Promise((resolve, reject) => {
        generator
            .generate()
            .then(cookie => {
                logger.info('Accept-Language cookie received');
                acceptLangQuery = cookie;
                resolve();
            })
            .catch(err => {
                logger.error('Accept-Language cookie unreceived');
                reject(err);
            })
        ;
    })
};

const _jobHandler = () => {
    httpClient.get('/Home/CNR_GetVehicles?r=&d=&nb=', {
        headers: {
            'Accept-Language': 'pl;q=' + acceptLangQuery
        },
        responseType: 'text',
    }).then(response => {

        let now = new Date();
        let fileName = Math.round(now.getTime() / 1000).toString().concat('.xml');
        let dirName = './data' + [now.getFullYear(), now.getMonth(), now.getDay(), now.getHours()].join('/');
        let filePath = [dirName, fileName].join('/');

        if (!fs.existsSync(dirName)){
            fx.mkdirSync(dirName);
        }

        fs.writeFileSync(filePath, response.data);
        logger.info('Saved new positions data to {path}'.replace('{path}', filePath));

    }).catch(error => {
        logger.error('GetVehicles endpoint throws an error', error);

        logger.info('Regenerate Accept-Language cookie');
        _generatorHandler().then(_jobHandler);
    });
};

const scheduledJob = schedule.scheduleJob('* * * * *', _jobHandler);