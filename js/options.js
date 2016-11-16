const MINIMUM_FUND_AMOUNT = 3;

const createFund = (fund) => {
  const fundList = document.querySelector('#fundList');

  const fundDiv = document.createElement('div');
  fundDiv.setAttribute('class', 'fund');

  const keyInput = document.createElement('input');
  keyInput.setAttribute('class', 'key');
  keyInput.setAttribute('type', 'text');

  const checkboxId = `owned${fundList.childNodes.length}`;
  const ownedCheckbox = document.createElement('input');
  ownedCheckbox.setAttribute('class', 'owned');
  ownedCheckbox.setAttribute('type', 'checkbox');
  ownedCheckbox.setAttribute('id', checkboxId);

  const ownedLabel = document.createElement('label');
  ownedLabel.textContent = chrome.i18n.getMessage('owned');
  ownedLabel.setAttribute('for', checkboxId);

  fundDiv.appendChild(keyInput);
  fundDiv.appendChild(ownedCheckbox);
  fundDiv.appendChild(ownedLabel);

  if (fund) {
    keyInput.value = fund.key;
    if (fund.owned) {
      ownedCheckbox.setAttribute('checked', 'checked');
    }
  }
  return fundDiv;
}

const getFundList = () => {
  const list = [];
  const fundList = document.querySelector('#fundList');

  fundList.childNodes.forEach((fundDiv) => {
    const keyInput = fundDiv.querySelector('.key');
    const checked = fundDiv.querySelector('.owned:checked');
    list.push({
      key: keyInput.value,
      owned: (checked) ? (checked.value === 'on') : false,
    });
  });

  return list;
}

function restore_options() {
  chrome.storage.sync.get({
    fundList: []
  }, (items) => {
    const fundList = document.querySelector('#fundList');
    items.fundList.forEach((fund) => {
      fundList.appendChild(createFund(fund));
    });
    while(fundList.childNodes.length < MINIMUM_FUND_AMOUNT){
      fundList.appendChild(createFund());
    }
  });
}

const save_options = (callback = () => {}) => {
  chrome.storage.sync.set({
    fundList: getFundList()
  }, callback);
}

document.addEventListener('DOMContentLoaded', () => {
  document.title = chrome.i18n.getMessage("options_title");

  const header = document.querySelector('header');
  const save = document.querySelector('#save');
  const add = document.querySelector('#add');
  header.textContent = chrome.i18n.getMessage("fund_list");
  save.textContent = chrome.i18n.getMessage("save");
  add.textContent = chrome.i18n.getMessage("add_fund");
  save.onclick = () => (save_options());
  add.onclick = () => {
    document.querySelector('#fundList').appendChild(createFund());
  };

  restore_options();
});