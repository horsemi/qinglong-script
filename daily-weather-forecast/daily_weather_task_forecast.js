const { requestApi, removeTags, getEnvCookies, wait } = require('./bot');
const notify = require('./sendNotify');
const Env = require('./env');

const $ = new Env('xiaolu 每日穿衣指南');

const ACC_WEATHER_API_KEY = process.env.ACC_WEATHER_API_KEY;
const ACC_WEATHER_URL = 'http://dataservice.accuweather.com';
const ACC_WEATHER_LANGUAGE = 'zh-CN';
const ACC_WEATHER_LOCATION_KEY = process.env.ACC_WEATHER_LOCATION_KEY; //  地区ID
const ACC_WEATHER_INDICES_KEY = '101'; //  穿衣指数

class WeatherTaskBot {
  async run() {
    const { indicesDetail } = await this.getIndices();

    const { headTitle, dailyForecastsDetail } = await this.getForecasts();

    return {
      indicesDetail,
      headTitle,
      dailyForecastsDetail,
    };
  }

  async getIndices() {
    if (!ACC_WEATHER_API_KEY) {
      $.logErr(
        'ACC_WEATHER_API_KEY环境变量为空，请配置后再使用 url:https://developer.accuweather.com/'
      );
      throw new Error('API_KEY环境变量为空');
    }

    if (!ACC_WEATHER_LOCATION_KEY) {
      $.logErr(
        'ACC_WEATHER_LOCATION_KEY环境变量(地区ID)为空，请配置后再使用 url:https://developer.accuweather.com/'
      );
      throw new Error('LOCATION_KEY环境变量(地区ID)为空');
    }

    const { isSuccess, data, response } = await requestApi(
      `${ACC_WEATHER_URL}/indices/v1/daily/5day/${ACC_WEATHER_LOCATION_KEY}/${ACC_WEATHER_INDICES_KEY}`,
      {
        method: 'get',
        data: {
          apikey: ACC_WEATHER_API_KEY,
          language: ACC_WEATHER_LANGUAGE,
          details: true,
        },
      }
    );

    if (isSuccess) {
      const _responseData = data[1];
      $.log(`请求成功，信息为: ${JSON.stringify(_responseData)}`);

      return {
        indicesDetail: _responseData,
      };
    } else {
      throw new Error('请求失败, 请检查是否调用次数');
    }
  }

  async getForecasts() {
    if (!ACC_WEATHER_API_KEY) {
      $.logErr(
        'ACC_WEATHER_API_KEY环境变量为空，请配置后再使用 url:https://developer.accuweather.com/'
      );
      throw new Error('API_KEY环境变量为空');
    }

    if (!ACC_WEATHER_LOCATION_KEY) {
      $.logErr(
        'ACC_WEATHER_LOCATION_KEY变量(地区ID)为空，请配置后再使用 url:https://developer.accuweather.com/'
      );
      throw new Error('LOCATION_KEY变量(地区ID)为空');
    }

    const { isSuccess, data, response } = await requestApi(
      `${ACC_WEATHER_URL}/forecasts/v1/daily/5day/${ACC_WEATHER_LOCATION_KEY}`,
      {
        method: 'get',
        data: {
          apikey: ACC_WEATHER_API_KEY,
          language: ACC_WEATHER_LANGUAGE,
          details: true,
          metric: true,
        },
      }
    );

    if (isSuccess) {
      const _responseData = data;
      $.log(`请求成功，信息为: ${JSON.stringify(_responseData)}`);

      return {
        headTitle: _responseData.Headline,
        dailyForecastsDetail: _responseData.DailyForecasts[1],
      };
    } else {
      throw new Error('请求失败, 请检查是否调用次数');
    }
  }
}

!(async () => {
  const bot = new WeatherTaskBot();

  const { indicesDetail, headTitle, dailyForecastsDetail } = await bot.run();

  const msg = `蝶宝，现在是${new Date().toLocaleString()}，${headTitle.Text}，\n明天温度最高温度${dailyForecastsDetail.Temperature.Maximum.Value}℃，最低温度${dailyForecastsDetail.Temperature.Minimum.Value}℃，${indicesDetail.Text}`;

  await notify.sendNotify(
    `小鹿贴心穿衣指数预报: ${indicesDetail.Category}`,
    msg,
    {
      url: indicesDetail.MobileLink,
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
