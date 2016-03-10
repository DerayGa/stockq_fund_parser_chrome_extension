function createFundDiv() {
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

function updateFundDiv(fundDiv, title, raw) {
  var title = $('h1', $(title)).text();
  raw = $(raw);

  $('.title', fundDiv).html(title);
  var tds = $('td', raw);

  var value = $(tds[1]).text();
  $('.value', fundDiv).text(value);
  console.log(value);

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

  $(fundDiv).show();
}

function openTab(link) {
  chrome.tabs.create({
    url: link
  });
}

function restore_options(callback) {
  chrome.storage.sync.get({
    fundList: []
  }, callback);
}

function loadFund(link, fund){
  var fundDiv = createFundDiv();
  $(fundDiv).hide();

  if (fund.owned)
    $(fundDiv).addClass('have');

  $('.fundInfo').append(fundDiv);

  $(fundDiv).click(function() {
    openTab(link + fund.key);
  });

  $.ajax({
    url: link + fund.key,
    type: 'GET',
    success: function(data) {
      var i = data.indexOf('<tr class=\'row2\'>');
      var j = data.indexOf('</tr>', i) + 5;
      var raw = data.substring(i, j);

      var i = data.indexOf('<font color="#666666"><h1>');
      var j = data.indexOf('</h1></font>', i) + 12;
      var title = data.substring(i, j);

      updateFundDiv(fundDiv, title, raw);
    },
    /*error: function(data) {
        console.log(data);
    }*/
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var link = 'http://www.stockq.org/funds/fund/';

  $('footer .options').html(chrome.i18n.getMessage("options"));

  restore_options(function(items){
    var owned = [];
    var other = [];
    $.each(items.fundList, function(index, fund){
      if(!fund.key) return;

      if(fund.owned)
        owned.push(fund);
      else
        other.push(fund);
    });

    $.each(owned.concat(other), function(index, fund){
      loadFund(link, fund);
    });
  });
});
