const LINK = 'http://www.stockq.org/funds/fund/';

const createFundDiv = () => {
  var content = $('<div class="fund">' +
    '<div class="title"></div>' +
    '<hr>' +
    '<div class="info">' +
    '<span class="value" />' +
    '<span class="diff" />' +
    '<span class="update" />' +
    '</div>' +
    '</div>');

  return $(content);
}

const updateFundDiv = (fundDiv, title, raw) => {
  var title = $('h1', $(title)).text();
  raw = $(raw);

  $('.title', fundDiv).html(title);
  var tds = $('td', raw);

  var value = $(tds[1]).text();
  $('.value', fundDiv).text(value);

  var diff = parseFloat($(tds[2]).text(), 10);
  var percent = parseFloat($(tds[3]).text(), 10);

  var update = $(tds[4]).text();
  $('.update', fundDiv).text(update);

  var symbol = ''
  if (diff >= 0) {
    $('.info', fundDiv).addClass('red');
    symbol = '▲';
  } else {
    $('.info', fundDiv).addClass('green');
    symbol = '▼';
  }

  $('.diff', fundDiv).text(symbol + Math.abs(diff) + '(' + Math.abs(percent) + '%)');

  return update.trim();
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
  const json = {};
  json[key] = {};
  chrome.storage.sync.get(json, callback);
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
  var fundDiv = createFundDiv();
  $('.fundInfo').append(fundDiv);

  if (fund.owned)
    $(fundDiv).addClass('have');
//fundDiv.classList.add('have');
  $(fundDiv).click(function() {
    openTab(link + fund.key);
  });
  //--------------
  restore_fund(fund.key, function(items) {
    var cache = items[fund.key];
    var yesterday = getYesterday();

    if (cache[yesterday]){
      loadByCache(cache.title, cache[yesterday]);
    } else {
      $(fundDiv).hide();
      loadByAJAX(yesterday);
    }
  });

  //--------------
  const loadByCache = (title, raw) => {
    updateFundDiv(fundDiv, title, raw);
  }
  //--------------
  const loadByAJAX = (yesterday) => {
    fetch(`${link}${fund.key}`)
      .then((response) => (
        response.text()
      ))
      .then((responseText) => {
        let i = responseText.indexOf('<tr class=\'row2\'>');
        let j = responseText.indexOf('</tr>', i) + 5;
        const raw = responseText.substring(i, j);

        i = responseText.indexOf('<font color="#666666"><h1>');
        j = responseText.indexOf('</h1></font>', i) + 12;
        const title = responseText.substring(i, j);

        const updateDate = updateFundDiv(fundDiv, title, raw);
        $(fundDiv).show();

        //save
        const cache = {};
        cache.title = title;
        cache[updateDate] = raw;
        const json = {};
        json[fund.key] = cache;
        chrome.storage.sync.set(json, function() {
        });
      });
  }
}

document.addEventListener('DOMContentLoaded', function() {

  document.querySelector('footer .options').textContent = chrome.i18n.getMessage("options");
  document.querySelector('footer .addNew').textContent = chrome.i18n.getMessage("addNew");
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