// 加载.env文件中的环境变量
// require('dotenv').config();

const { SignJWT, importPKCS8 } = require('jose');

const WEATHER_PRIVATE_KEY = process.env.WEATHER_PRIVATE_KEY;
const WEATHER_PROJECT_KEY_ID = process.env.WEATHER_PROJECT_KEY_ID;
const WEATHER_KEY_ID = process.env.WEATHER_KEY_ID;

function getToken() {
  return new Promise((resolve, reject) => {
    if (!WEATHER_PRIVATE_KEY || !WEATHER_PROJECT_KEY_ID || !WEATHER_KEY_ID) {
      throw new Error(
        'WEATHER_PRIVATE_KEY环境变量(私钥)、WEATHER_PROJECT_KEY_ID环境变量(项目ID)、WEATHER_KEY_ID环境变量(密钥ID)为空'
      );
    }

    importPKCS8(WEATHER_PRIVATE_KEY, 'EdDSA')
      .then((privateKey) => {
        const customHeader = {
          alg: 'EdDSA',
          kid: WEATHER_KEY_ID,
        };
        const iat = Math.floor(Date.now() / 1000) - 30;
        const exp = iat + 900;
        const customPayload = {
          sub: WEATHER_PROJECT_KEY_ID,
          iat: iat,
          exp: exp,
        };
        new SignJWT(customPayload)
          .setProtectedHeader(customHeader)
          .sign(privateKey)
          .then((token) => {
            console.log('JWT: ' + token);
            resolve(token);
          });
      })
      .catch((error) => reject(error));
  });
}

module.exports = getToken;
