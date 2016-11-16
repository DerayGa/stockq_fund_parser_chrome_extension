const LINK = 'http://www.stockq.org/funds/fund/';

const createFundDiv = () => {
  const fundDiv = document.createElement('div');
  fundDiv.classList.add('fund');
  fundDiv.innerHTML = `
    <div class='title'></div>
    <hr />
    <div class='info'>
      <span class='value'></span>
      <span class='diff'></span>
      <span class='update'></span>
    </div>
  `;

  return fundDiv;
}

const updateFundDiv = (fundDiv, title, raw) => {
  const titleDiv = document.createElement('div');
  titleDiv.innerHTML = title;
  const rawDiv = document.createElement('table');
  rawDiv.innerHTML = raw;

  fundDiv.querySelector('.title').textContent = titleDiv.querySelector('h1').textContent;

  const tds = rawDiv.querySelectorAll('td');

  fundDiv.querySelector('.value').textContent = tds[1].textContent;

  const diff = parseFloat(tds[2].textContent, 10);
  const percent = parseFloat(tds[3].textContent, 10);

  const update = tds[4].textContent.trim();
  fundDiv.querySelector('.update').textContent = update;

  let symbol = ''
  if (diff >= 0) {
    fundDiv.querySelector('.info').classList.add('red');
    symbol = '▲';
  } else {
    fundDiv.querySelector('.info').classList.add('green');
    symbol = '▼';
  }
  fundDiv.querySelector('.diff').textContent = `${symbol} ${Math.abs(diff)} (${Math.abs(percent)}%)`;

  return update;
}

const openTab = (link) => {
  chrome.tabs.create({
    url: link
  });
}

const restore_options = (callback = () => {} ) => {
  chrome.storage.sync.get({
    fundList: []
  }, callback);
}

const restore_fund = (key, callback = () => {} ) => {
  chrome.storage.sync.get({
    [key]: {}
  }, callback);
}

const save_options = (fundList, callback = () => {}) => {
  chrome.storage.sync.set({
    fundList,
  }, callback);
}

const getYesterday = () => {
  const now = new Date();
  const day = now.getDay();

  let num = 1;
  if (day == 0)
    num = 2;
  else if (day == 1)
    num = 3;

  const yesterday = new Date(now.getTime() - 1000 * 60 * 60 * 24 * num);
  const yyyy = yesterday.getFullYear();
  let mm = yesterday.getMonth() + 1;
  let dd = yesterday.getDate();
  mm = (mm < 10) ? ('0' + mm) : mm;
  dd = (dd < 10) ? ('0' + dd) : dd;

  return `${yyyy}/${mm}/${dd}`;
}

const loadFund = (link, fund) => {
  const yesterday = getYesterday();
  const fundDiv = createFundDiv();
  document.querySelector('.fundInfo').appendChild(fundDiv);

  if (fund.owned)
    fundDiv.classList.add('have');

  fundDiv.onclick = () => {
    openTab(link + fund.key);
  }
  //--------------
  restore_fund(fund.key, function(items) {
    const cache = items[fund.key];

    if (cache[yesterday]) {
      updateFundDiv(fundDiv, cache.title, cache[yesterday]);
    } else {
      fundDiv.querySelector('.title').textContent = chrome.i18n.getMessage('loading');
      loadByAJAX();
    }
  });

  //--------------
  const loadByAJAX = () => {
    fetch(`${link}${fund.key}`)
      .then((response) => (
        response.text()
      ))
      .then((responseText) => {
        const dataStartStr = '<tr class=\'row2\'>';
        const dataEndStr = '</tr>';
        const titleStartStr = '<font color="#666666"><h1>';
        const titleEndStr = '</h1></font>';

        let i = responseText.indexOf(dataStartStr);
        const raw = responseText.substring(i,
          responseText.indexOf(dataEndStr, i) + dataEndStr.length);

        i = responseText.indexOf(titleStartStr);
        const title = responseText.substring(i,
          responseText.indexOf(titleEndStr, i) + titleEndStr.length);

        const updateDate = updateFundDiv(fundDiv, title, raw);

        chrome.storage.sync.set({
          [fund.key]: {
            title,
            [updateDate]: raw
          }
        }, () => {});
      });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelector('footer .options').textContent = chrome.i18n.getMessage('options');
  document.querySelector('footer .addNew').textContent = chrome.i18n.getMessage('addNew');
  document.querySelector('footer .addNew').onclick = () => {
    chrome.tabs.getSelected(null, (tab) => {
      let tablink = tab.url;

      if (tablink.indexOf(LINK) >= 0) {
        tablink = tablink.replace(LINK, '');

        restore_options(({ fundList }) => {
          if(filter = fundList.filter((fund) => (fund.key == tablink)).length == 0) {
            fundList.push(
              {
                key: tablink,
                owned: true,
              }
            );

            save_options(fundList);
          }
        });
      }
    });
  };

  restore_options((items) => {
    const owned = [];
    const other = [];

    items.fundList.forEach((fund) => {
      if (!fund.key) return;

      if (fund.owned)
        owned.push(fund);
      else
        other.push(fund);
    });

    owned.concat(other).forEach((fund) => {
      loadFund(LINK, fund);
    });
  });
});