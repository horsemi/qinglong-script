const { requestApi } = require('./bot');
const notify = require('./sendNotify');
const Env = require('./env');

const $ = new Env('xiaolu 每日Epic免费游戏推送指南');

const EPIC_FREE_GAME_URL =
  'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=zh-Hant&country=CN&allowCountries=CN,HK';

class EpicFreeGameBot {
  async run() {
    const { markdownContent } = await this.getEpicFreeGame();

    return {
      markdownContent,
    };
  }

  async getEpicFreeGame() {
    const { isSuccess, data, response } = await requestApi(EPIC_FREE_GAME_URL, {
      method: 'get',
    });

    if (isSuccess) {
      const _responseData = data;
      // $.log(`请求成功，信息为: ${JSON.stringify(_responseData)}`);

      const games = [];
      let msg = '';
      let elements = _responseData.data.Catalog.searchStore.elements;
      const currentDate = new Date();
      for (const key in elements) {
        const effectiveDateObj = new Date(elements[key].effectiveDate);
        // 判断当前折后价格是否为0，并且有效时间小于当前时间
        if (
          elements[key].price.totalPrice.fmtPrice.discountPrice === '0' &&
          effectiveDateObj < currentDate
        ) {
          if (elements[key].status == 'ACTIVE') {
            msg += elements[key].title + '; ';
            let img = '';
            for (const imgkey in elements[key].keyImages) {
              if (
                elements[key].keyImages[imgkey].type == 'DieselStoreFrontWide'
              ) {
                img = elements[key].keyImages[imgkey].url;
                break;
              }
            }
            games.push({
              title: elements[key].title,
              url:
                'https://www.epicgames.com/store/zh-Hant/p/' +
                elements[key].productSlug,
              id: elements[key].id,
              image: img,
            });
          }
        }
      }

      console.log('found_games', games);

      // 拼接成Markdown格式
      const markdownContent = games
        .map((game) => {
          return `# ${game.title}\n#### [点击领取](${game.url})\n![游戏图片](${game.image})`;
        })
        .join('\n');
      console.log(markdownContent);

      return {
        markdownContent,
      };
    } else {
      throw new Error('请求失败, epic白嫖失败，网站检测错误');
    }
  }
}

!(async () => {
  const bot = new EpicFreeGameBot();

  const { markdownContent } = await bot.run();

  const msg = `现在是${new Date().toLocaleString()}，${markdownContent}`;

  await notify.sendNotify(`Epic白嫖小贴士`, msg, {}, '本通知 By：小鹿');
})()
  .catch((e) => {
    $.log('', `❌失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });
