const fakeStock = {
  google_play: 15,
  steam: 8,
  itunes: 12,
  amazon: 5,
  netflix: 10,
  roblox: 20,
  valorant: 7,
  free_fire: 25
};

const commissionPercent = 10;

const form = document.getElementById('convertForm');
const fromSelect = document.getElementById('from');
const toSelect = document.getElementById('to');
const amountInput = document.getElementById('amount');
const codeInput = document.getElementById('code');
const stockCountElem = document.getElementById('stockCount');
const loadingElem = document.getElementById('loading');
const resultElem = document.getElementById('result');
const newCodeElem = document.getElementById('newCode');
const copyBtn = document.getElementById('copyBtn');
const newConversionBtn = document.getElementById('newConversion');
const errorElem = document.getElementById('error');
const commissionElem = document.getElementById('commissionPercent');

function updateStock() {
  const selectedTo = toSelect.value;
  const stock = fakeStock[selectedTo];
  stockCountElem.textContent = stock !== undefined ? stock : 'Bilinmiyor';
}

function generateFakeCode(type) {
  // Tipik kod formatlarını biraz gerçekçi yapalım
  const patterns = {
    steam: () => {
      // 5 grup 5 karakter alfanumerik (örnek: ABCDE-12345-FGHIJ-67890-KLMNO)
      return Array(5).fill(0).map(() => Math.random().toString(36).substr(2, 5).toUpperCase()).join('-');
    },
    google_play: () => {
      // 4x4 grup (örnek: ABCD-EFGH-IJKL-MNOP)
      return Array(4).fill(0).map(() => Math.random().toString(36).substr(2, 4).toUpperCase()).join('-');
    },
    itunes: () => {
      // 16 haneli
      return Math.random().toString(36).substr(2, 16).toUpperCase();
    },
    amazon: () => {
      // 6x5 grup (örnek: ABCDEF-12345-GHIJK-LMNOP-QRSTU-VWXYZ)
      return Array(6).fill(0).map(() => Math.random().toString(36).substr(2, 5).toUpperCase()).join('-');
    },
    netflix: () => {
      // 12 haneli
      return Math.random().toString(36).substr(2, 12).toUpperCase();
    },
    roblox: () => {
      return 'ROBLOX-' + Math.floor(Math.random() * 900000 + 100000);
    },
    valorant: () => {
      return 'VAL-' + Math.random().toString(36).substr(2, 10).toUpperCase();
    },
    free_fire: () => {
      return 'FF-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    }
  };

  return (patterns[type] || (() => 'XXXX-XXXX-XXXX'))();
}

function fakeApiVerifyCode(code) {
  // Kod yapısı geçerli mi regex ile kontrol
  // Mesela sadece büyük harf, sayı ve '-' olabilir
  const regex = /^[A-Z0-9\-]{12,30}$/;
  return regex.test(code);
}

function fakeApiCall(code) {
  // 2 saniyelik fake API çağrısı, %80 başarılı doğrulama
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const isValid = fakeApiVerifyCode(code);
      if (!isValid) {
        reject('Kod formatı geçersiz!');
        return;
      }
      // %80 başarı şansı
      if (Math.random() < 0.8) {
        resolve(true);
      } else {
        reject('Kod doğrulama başarısız. Lütfen tekrar deneyin.');
      }
    }, 2000);
  });
}

function calculateAfterCommission(amount) {
  return (amount * (100 - commissionPercent)) / 100;
}

function updateCommissionText() {
  commissionElem.textContent = commissionPercent + '%';
}

fromSelect.addEventListener('change', () => {
  if (fromSelect.value === toSelect.value) {
    errorElem.textContent = 'Kod türleri aynı olamaz.';
    errorElem.classList.remove('hidden');
  } else {
    errorElem.classList.add('hidden');
  }
});

toSelect.addEventListener('change', () => {
  updateStock();
  if (fromSelect.value === toSelect.value) {
    errorElem.textContent = 'Kod türleri aynı olamaz.';
    errorElem.classList.remove('hidden');
  } else {
    errorElem.classList.add('hidden');
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorElem.classList.add('hidden');

  if (fromSelect.value === toSelect.value) {
    errorElem.textContent = 'Kod türleri aynı olamaz.';
    errorElem.classList.remove('hidden');
    return;
  }

  const amount = parseInt(amountInput.value, 10);
  const stock = fakeStock[toSelect.value] ?? 0;

  if (amount < 10 || amount > 5000) {
    errorElem.textContent = 'Miktar 10₺ ile 5000₺ arasında olmalıdır.';
    errorElem.classList.remove('hidden');
    return;
  }

  if (stock <= 0) {
    errorElem.textContent = 'Seçilen kod türünde stok kalmamıştır.';
    errorElem.classList.remove('hidden');
    return;
  }

  loadingElem.classList.remove('hidden');
  form.classList.add('hidden');
  resultElem.classList.add('hidden');

  try {
    await fakeApiCall(codeInput.value.toUpperCase());

    // Başarılı
    // Komisyon sonrası miktar
    const finalAmount = calculateAfterCommission(amount);

    // Yeni kod üret (fake)
    const newCode = generateFakeCode(toSelect.value);

    newCodeElem.textContent = `${newCode} (Değer: ₺${finalAmount.toFixed(2)})`;

    loadingElem.classList.add('hidden');
    resultElem.classList.remove('hidden');

    // Stoğu azalt
    fakeStock[toSelect.value] = stock - 1;
    updateStock();

    // Geçici olarak localStorage' a kaydet
    saveConversion({
      from: fromSelect.value,
      to: toSelect.value,
      amount,
      finalAmount,
      newCode,
      date: new Date().toLocaleString()
    });
  } catch (error) {
    loadingElem.classList.add('hidden');
    form.classList.remove('hidden');
    errorElem.textContent = error;
    errorElem.classList.remove('hidden');
  }
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(newCodeElem.textContent).then(() => {
    alert('Kod kopyalandı!');
  });
});

newConversionBtn.addEventListener('click', () => {
  form.reset();
  resultElem.classList.add('hidden');
  form.classList.remove('hidden');
  errorElem.classList.add('hidden');
});

function saveConversion(record) {
  let history = JSON.parse(localStorage.getItem('conversionHistory') || '[]');
  history.unshift(record);
  if (history.length > 10) history.pop();
  localStorage.setItem('conversionHistory', JSON.stringify(history));
}

function loadLastConversion() {
  const history = JSON.parse(localStorage.getItem('conversionHistory') || '[]');
  if (history.length > 0) {
    const last = history[0];
    console.log('Son dönüşüm:', last);
  }
}

updateStock();
updateCommissionText();
loadLastConversion();
