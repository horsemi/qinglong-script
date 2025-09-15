const { requestApi, removeTags, getEnvCookies, wait } = require('./bot');
const notify = require('./sendNotify');
const Env = require('./env');
const getToken = require('./getToken');

const $ = new Env('xiaolu 每日穿衣指南');

let ACC_WEATHER_API_KEY = '';
const ACC_WEATHER_URL = 'https://nq73jprfpp.re.qweatherapi.com';
const ACC_WEATHER_LANGUAGE = 'zh-hans';
const ACC_WEATHER_LOCATION_KEY = process.env.ACC_WEATHER_LOCATION_KEY; //  地区ID
const ACC_WEATHER_INDICES_KEY = '0'; //  穿衣指数

class WeatherTaskBot {
  async run() {
    try {
      ACC_WEATHER_API_KEY = await getToken();
    } catch (error) {
      $.logErr(error);
      throw error;
    }

    const { indicesDetail } = await this.getIndices();

    const { dailyForecastsDetail } = await this.getForecasts();

    return {
      indicesDetail,
      dailyForecastsDetail,
    };
  }

  async getIndices() {
    if (!ACC_WEATHER_LOCATION_KEY) {
      $.logErr(
        'ACC_WEATHER_LOCATION_KEY环境变量(地区ID)为空，请配置后再使用 url:https://developer.accuweather.com/'
      );
      throw new Error('LOCATION_KEY环境变量(地区ID)为空');
    }

    const { isSuccess, data, response } = await requestApi(
      `${ACC_WEATHER_URL}/v7/indices/3d`,
      {
        method: 'get',
        headers: {
          Authorization: `Bearer ${ACC_WEATHER_API_KEY}`,
        },
        data: {
          location: ACC_WEATHER_LOCATION_KEY,
          lang: ACC_WEATHER_LANGUAGE,
          type: ACC_WEATHER_INDICES_KEY,
        },
      }
    );

    if (isSuccess) {
      const _responseData = data.daily;
      $.log(`请求成功，信息为: ${JSON.stringify(_responseData)}`);

      return {
        indicesDetail: _responseData,
      };
    } else {
      throw new Error('请求失败, 请检查是否调用次数');
    }
  }

  async getForecasts() {
    if (!ACC_WEATHER_LOCATION_KEY) {
      $.logErr(
        'ACC_WEATHER_LOCATION_KEY变量(地区ID)为空，请配置后再使用 url:https://developer.accuweather.com/'
      );
      throw new Error('LOCATION_KEY变量(地区ID)为空');
    }

    const { isSuccess, data, response } = await requestApi(
      `${ACC_WEATHER_URL}/v7/weather/3d`,
      {
        method: 'get',
        headers: {
          Authorization: `Bearer ${ACC_WEATHER_API_KEY}`,
        },
        data: {
          location: ACC_WEATHER_LOCATION_KEY,
          lang: ACC_WEATHER_LANGUAGE,
        },
      }
    );

    if (isSuccess) {
      const _responseData = data.daily;
      $.log(`请求成功，信息为: ${JSON.stringify(_responseData)}`);

      return {
        dailyForecastsDetail: _responseData[1],
      };
    } else {
      throw new Error('请求失败, 请检查是否调用次数');
    }
  }
}

!(async () => {
  const bot = new WeatherTaskBot();

  const { indicesDetail, dailyForecastsDetail } = await bot.run();

  const msg = `蝶宝，现在是${new Date().toLocaleString()}，\n明天最高温度${
    dailyForecastsDetail.tempMax
  }℃，最低温度${dailyForecastsDetail.tempMin}℃，相对湿度为${
    dailyForecastsDetail.humidity
  }，日出时间为${dailyForecastsDetail.sunrise}，\n明日防晒指数：${
    indicesDetail.find((item) => item.type === '16').text
  }\n明日晾晒指数：${indicesDetail.find((item) => item.type === '14').text}`;

  await notify.sendNotify(
    `小鹿贴心穿衣指数预报: ${
      indicesDetail.find((item) => item.type === '3').text
    }`,
    msg,
    {
      // url: indicesDetail.MobileLink,
      // group: "xiaolu_trips",
      // sound: 'minuet.typewriters'
    },
    '本通知 By：小鹿'
  );
})()
  .catch((e) => {
    $.log('', `❌失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });
