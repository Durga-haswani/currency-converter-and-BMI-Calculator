
const $ = (id) => document.getElementById(id);


document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    $(btn.dataset.tab).classList.add('active');
  });
});

// Basic, well-known currencies only
const CURRENCIES = [
  { code: 'USD', name: 'Dollar'        },
  { code: 'EUR', name: 'Euro'          },
  { code: 'GBP', name: 'Pound'         },
  { code: 'PKR', name: 'Rupee (PK)'    },
  { code: 'INR', name: 'Rupee (IN)'    },
  { code: 'CNY', name: 'Yuan'          },
  { code: 'AED', name: 'Dirham'        },
  { code: 'SAR', name: 'Riyal'         },
  { code: 'CAD', name: 'Dollar (CA)'   },
  { code: 'AUD', name: 'Dollar (AU)'   },
  { code: 'MXN', name: 'Peso'          },
  { code: 'BRL', name: 'Real'          },
  { code: 'CHF', name: 'Franc'         },
  { code: 'ZAR', name: 'Rand'          },
  { code: 'KRW', name: 'Won'           }
];

const POPULAR_PAIRS = ['EUR','GBP','JPY','INR','PKR','AED','SAR','MXN'];

const FALLBACK_RATES = {
  USD:1,    EUR:0.92, GBP:0.79, PKR:278,  INR:83.1,
  JPY:149.5,CNY:7.24, AED:3.67, SAR:3.75, CAD:1.36,
  AUD:1.53, MXN:17.2, BRL:4.97, CHF:0.90, ZAR:18.7,
  KRW:1325
};

let cachedRates = null;

function populateCurrencySelects() {
  const from = $('fromCurrency');
  const to   = $('toCurrency');
  from.innerHTML = '';
  to.innerHTML   = '';
  CURRENCIES.forEach(({ code, name }) => {
    const label = `${code} — ${name}`;
    from.innerHTML += `<option value="${code}" ${code==='USD'?'selected':''}>${label}</option>`;
    to.innerHTML   += `<option value="${code}" ${code==='PKR'?'selected':''}>${label}</option>`;
  });
}

// Fetch live rates
async function fetchRates() {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    cachedRates = data.rates;
    renderPopularRates();
    return data.rates;
  } catch {
    cachedRates = FALLBACK_RATES;
    renderPopularRates();
    return FALLBACK_RATES;
  }
}

function convert(amount, from, to, rates) {
  const toUSD = from === 'USD' ? amount : amount / rates[from];
  return to === 'USD' ? toUSD : toUSD * rates[to];
}

async function handleConvert() {
  const btn    = $('convertBtn');
  const amount = parseFloat($('amount').value);
  const from   = $('fromCurrency').value;
  const to     = $('toCurrency').value;

  if (isNaN(amount) || amount <= 0) {
    $('convertedValue').textContent = 'Enter a valid amount';
    $('conversionNote').textContent = '';
    return;
  }

  btn.innerHTML = '<i class="fa-solid fa-circle-notch spinner"></i> Fetching...';
  btn.classList.add('loading');

  const rates  = await fetchRates();
  const result = convert(amount, from, to, rates);
  const rate1  = convert(1, from, to, rates);

  btn.innerHTML = '<i class="fa-solid fa-calculator"></i> Convert Now';
  btn.classList.remove('loading');

  $('convertedValue').textContent = `${result.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4})} ${to}`;
  $('conversionNote').textContent = `1 ${from} = ${rate1.toFixed(4)} ${to}`;
  $('liveRate').textContent       = `1 ${from} = ${rate1.toFixed(4)} ${to}`;
}

function renderPopularRates() {
  const grid = $('popularRates');
  if (!grid || !cachedRates) return;
  grid.innerHTML = '';
  POPULAR_PAIRS.forEach(code => {
    const name = CURRENCIES.find(c => c.code === code)?.name || code;
    const val  = cachedRates[code] ? cachedRates[code].toFixed(4) : 'N/A';
    grid.innerHTML += `
      <div class="rate-card">
        <div class="pair">USD to ${code}</div>
        <div class="val">${val} <small>${name}</small></div>
      </div>`;
  });
}

$('convertBtn').addEventListener('click', handleConvert);
$('amount').addEventListener('keydown', e => { if (e.key === 'Enter') handleConvert(); });

$('swapBtn').addEventListener('click', () => {
  const from = $('fromCurrency');
  const to   = $('toCurrency');
  const tmp  = from.value;
  from.value = to.value;
  to.value   = tmp;
});

populateCurrencySelects();
fetchRates();

          /* BMI CALCULATOR */

let currentUnit = 'metric';

document.querySelectorAll('.unit-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentUnit = btn.dataset.unit;
    updateUnitLabels();
    resetBMIResult();
  });
});

function updateUnitLabels() {
  $('weightUnit').textContent = currentUnit === 'metric' ? '(kg)' : '(lb)';
  $('heightUnit').textContent = currentUnit === 'metric' ? '(ft)' : '(in)';
  $('weight').placeholder     = currentUnit === 'metric' ? 'e.g. 60'  : 'e.g. 132';
  $('height').placeholder     = currentUnit === 'metric' ? 'e.g. 5.5' : 'e.g. 65';
}

function resetBMIResult() {
  $('bmiScore').textContent    = '---';
  $('bmiScore').style.color    = '';
  $('bmiCategory').textContent = '';
  $('bmiCategory').className   = 'bmi-category';
  $('bmiPointer').style.left   = '0%';
  $('bmiTip').textContent      = '';
}

// Convert lb to kg and inches to feet if imperial
function toMetric(weight, height, unit) {
  if (unit === 'imperial') {
    return { weightKg: weight * 0.453592, heightft: height * 2.54 };
  }
  return { weightKg: weight, heightft: height };
}

// Calculate BMI from kg and ft
function calcBMI(weightKg, heightft) {
  const h = heightft * 0.3048; // Convert feet to meters
  return weightKg / (h * h);
}

// Weight-based category using kg
function getWeightCategory(weightKg) {
  if (weightKg < 40)  return { label: 'Underweight', cls: 'cat-under', tip: 'Your weight is below the normal range (under 40 kg). Consider a nutrient-rich diet and consult a healthcare provider.' };
  if (weightKg <= 50) return { label: 'Normal Weight', cls: 'cat-normal', tip: 'Your weight is in the healthy range (40-50 kg). Keep maintaining a balanced diet and regular exercise!' };
  if (weightKg <= 65) return { label: 'Overweight', cls: 'cat-over',  tip: 'Your weight is above the normal range (50-65 kg). Regular physical activity and mindful eating can help.' };
  return                     { label: 'Obese', cls: 'cat-obese',       tip: 'Your weight is above 65 kg. Please consult a healthcare professional for a personalized health plan.' };
}

function weightToPercent(weightKg) {
  const bp = [ [20,0], [40,25], [50,55], [65,78], [85,100] ];
  if (weightKg <= 20) return 0;
  if (weightKg >= 85) return 100;
  for (let i = 0; i < bp.length - 1; i++) {
    const [x0,y0] = bp[i], [x1,y1] = bp[i+1];
    if (weightKg >= x0 && weightKg <= x1) {
      return y0 + ((weightKg - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return 50;
}

function handleBMI() {
  const rawWeight = parseFloat($('weight').value);
  const rawHeight = parseFloat($('height').value);

  // Validation - check both inputs exist
  if (isNaN(rawWeight) || rawWeight <= 0 || isNaN(rawHeight) || rawHeight <= 0) {
    $('bmiScore').textContent    = '!';
    $('bmiScore').style.color    = '#fc5c7d';
    $('bmiCategory').textContent = 'Please enter valid weight and height';
    $('bmiCategory').className   = 'bmi-category';
    $('bmiTip').textContent      = '';
    return;
  }

  // Height range check (catches common mistake of entering 1.65 instead of 165)
  const minH = currentUnit === 'metric' ? 50  : 20;
  const maxH = currentUnit === 'metric' ? 300 : 120;
  if (rawHeight < minH || rawHeight > maxH) {
    $('bmiScore').textContent    = '!';
    $('bmiScore').style.color    = '#fceb5c';
    $('bmiCategory').textContent = 'Check your height input';
    $('bmiCategory').className   = 'bmi-category';
    $('bmiTip').textContent      = currentUnit === 'metric'
      ? 'Height must be in centimeters (e.g. 165, not 1.65). Enter a value between 50 and 300 cm.'
      : 'Height must be in inches (e.g. 65). Enter a value between 20 and 120 inches.';
    return;
  }

  // Convert to metric if needed
  const { weightKg, heightCm } = toMetric(rawWeight, rawHeight, currentUnit);

  // Calculate BMI
  const bmi  = calcBMI(weightKg, heightCm);

  // Get category based on weight in kg
  const info = getWeightCategory(weightKg);
  const pct  = weightToPercent(weightKg);

  // Display BMI score
  $('bmiScore').textContent    = bmi.toFixed(1);
  $('bmiLabel').textContent    = 'Your BMI';
  $('bmiCategory').textContent = info.label;
  $('bmiCategory').className   = `bmi-category ${info.cls}`;
  $('bmiTip').textContent      = info.tip;

  // Color the score number
  const colors = {
    'cat-under':'#5cf8fc',
    'cat-normal':'#5cf8b0',
    'cat-over':'#fceb5c',
    'cat-obese':'#fc5c7d'
  };
  $('bmiScore').style.color = colors[info.cls] || '';

  // Move bar pointer with animation
  setTimeout(() => { $('bmiPointer').style.left = `${pct}%`; }, 80);

  // Add age & gender note if provided
  const age    = parseInt($('age').value);
  const gender = $('gender').value;
  if (!isNaN(age) && age > 0 && gender) {
    const extra = gender === 'male'
      ? ' Note: Men generally have higher muscle mass which can affect weight.'
      : ' Note: Women naturally carry a higher body fat percentage.';
    $('bmiTip').textContent += extra;
  }
}

// Button click
$('calcBMI').addEventListener('click', handleBMI);

// REAL-TIME: recalculate instantly as user types
['weight', 'height'].forEach(id => {
  $(id).addEventListener('input', () => {
    const w = $('weight').value;
    const h = $('height').value;
    if (w && h) handleBMI();
  });
});

// Gender and age also trigger update
['age', 'gender'].forEach(id => {
  $(id).addEventListener('change', () => {
    const w = $('weight').value;
    const h = $('height').value;
    if (w && h) handleBMI();
  });
});

// Enter key support
['weight', 'height'].forEach(id => {
  $(id).addEventListener('keydown', e => { if (e.key === 'Enter') handleBMI(); });
});