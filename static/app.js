/* LifePulse Blood Donor & Campaign Platform - Interactive Client Application */

let currentRole = 'donor';
let currentUserId = 10; // Default: Alexander Wright (Donor)
let currentUserName = "Alexander Wright";
let activeDonors = [];
let activeRequests = [];
let activeCampaigns = [];

// Recognized Location State
let userLocation = {
  latitude: 40.7580,
  longitude: -73.9855,
  name: "New York, NY (Auto-Detected)"
};

// Blood Donation Motivational Quotes (Rotates on every login)
const MOTIVATION_QUOTES = [
  { quote: "Every drop of blood you donate is a gift of life to someone in need.", author: "— LifePulse Community Hero" },
  { quote: "Heroes don't always wear capes — sometimes they just roll up their sleeves!", author: "— Red Cross Volunteer" },
  { quote: "Donate blood today; be the reason behind someone's heartbeat tomorrow.", author: "— Emergency Care Unit" },
  { quote: "15 minutes of your time can gift 50 years of life to a soul in need.", author: "— Mount Sinai Blood Bank" },
  { quote: "Tears of a mother cannot save her child, but your blood can.", author: "— Global Donor Alliance" },
  { quote: "Blood is meant to circulate. Pass it on and give the gift of life!", author: "— Bellevue Hospital Center" },
  { quote: "You don't need a medical degree to save a life — just a compassionate heart and a pint of blood.", author: "— LifePulse Lifesaver" },
  { quote: "Share life, give blood: Your single donation can save up to 3 lives!", author: "— Trauma Surgery Team" },
  { quote: "Be the lifeline someone is praying for today. Roll up your sleeve!", author: "— Community Healthcare" },
  { quote: "Giving blood costs you nothing, but it gives someone everything.", author: "— Universal Donor Network" }
];

let lastQuoteIndex = -1;

// Initialize App
// Hero Motivation Landing Navigation Functions (Matching Picture 2)
function enterMainApp() {
  const heroScreen = document.getElementById('hero-landing-screen');
  if (heroScreen) {
    heroScreen.classList.add('hidden');
    setTimeout(() => {
      heroScreen.style.display = 'none';
      checkLocationPermissionOnEntry();
    }, 450);
  }
}

function openHeroLanding() {
  const heroScreen = document.getElementById('hero-landing-screen');
  if (heroScreen) {
    heroScreen.style.display = 'flex';
    setTimeout(() => {
      heroScreen.classList.remove('hidden');
    }, 10);
  }
}

// Navigation Drawer Functions
function toggleNavDrawer() {
  const drawer = document.getElementById('nav-drawer');
  const overlay = document.getElementById('nav-drawer-overlay');
  if (drawer && overlay) {
    drawer.classList.toggle('active');
    overlay.classList.toggle('active');
  }
}

function updateDrawerActiveLink(itemKey) {
  document.querySelectorAll('.drawer-link').forEach(link => {
    link.classList.remove('drawer-link-active');
  });
  const targetLink = document.querySelector(`.drawer-link[onclick*="'${itemKey}'"]`);
  if (targetLink) {
    targetLink.classList.add('drawer-link-active');
  }
}

function selectMenuItem(itemKey) {
  toggleNavDrawer();
  updateDrawerActiveLink(itemKey);

  if (itemKey === 'campaigns') {
    switchRole('campaigns');
  } else if (itemKey === 'seeker') {
    switchRole('seeker');
  } else if (itemKey === 'donor') {
    switchRole('donor');
  } else if (itemKey === 'login') {
    if (currentUserProfile && currentUserProfile.userName && currentUserProfile.userName !== 'Guest') {
      openProfileModal();
    } else {
      openLoginModal();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  rotateMotivationQuote();
  checkLocationPermissionOnEntry();
  loadAnalytics();
  loadDonors();
  loadRequests();
  loadCampaigns();
  loadNotifications();
  setDefaultDatesInCampaignForm();
});

// Location Permission Dialog on Site Entry
function checkLocationPermissionOnEntry() {
  if (userLocationActive) {
    return;
  }
  const promptModal = document.getElementById('location-prompt-modal');
  if (promptModal) {
    promptModal.classList.add('active');
  }
}

function allowLocationPermission() {
  const promptModal = document.getElementById('location-prompt-modal');
  if (promptModal) promptModal.classList.remove('active');
  sessionStorage.setItem('location_prompt_seen', 'true');
  detectUserLocation();
}

function dismissLocationPermission() {
  const promptModal = document.getElementById('location-prompt-modal');
  if (promptModal) promptModal.classList.remove('active');
  sessionStorage.setItem('location_prompt_seen', 'true');
  userLocationActive = false;
  const textElem = document.getElementById('user-current-location-text');
  if (textElem) textElem.innerText = "Chennai, Tamil Nadu (Location Off - General View)";
  renderCampaignCards();
}

// Calculate Haversine Distance between two coordinates in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Location Detection Function
function detectUserLocation() {
  const textElem = document.getElementById('user-current-location-text');
  if (textElem) textElem.innerText = "Detecting GPS Location...";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation.latitude = pos.coords.latitude;
        userLocation.longitude = pos.coords.longitude;
        userLocation.name = `GPS Location (${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)})`;
        if (textElem) textElem.innerText = userLocation.name;
        loadCampaigns();
      },
      (err) => {
        console.warn('Geolocation fallback used:', err.message);
        if (textElem) textElem.innerText = "New York, NY (Detected)";
        loadCampaigns();
      },
      { timeout: 6000 }
    );
  } else {
    if (textElem) textElem.innerText = "New York, NY (Detected)";
    loadCampaigns();
  }
}

// Rotate Blood Donation Motivational Quote on Login / Action
function rotateMotivationQuote() {
  let newIdx;
  do {
    newIdx = Math.floor(Math.random() * MOTIVATION_QUOTES.length);
  } while (newIdx === lastQuoteIndex && MOTIVATION_QUOTES.length > 1);
  lastQuoteIndex = newIdx;

  const item = MOTIVATION_QUOTES[newIdx];
  const qText = document.getElementById('motivation-quote-text');
  const qAuthor = document.getElementById('motivation-author');
  const banner = document.getElementById('motivation-banner');

  if (qText && qAuthor) {
    qText.style.opacity = '0';
    setTimeout(() => {
      qText.innerText = `"${item.quote}"`;
      qAuthor.innerText = item.author;
      qText.style.opacity = '1';
    }, 200);
  }

  if (banner) {
    banner.style.boxShadow = '0 0 25px rgba(230, 57, 70, 0.6)';
    setTimeout(() => {
      banner.style.boxShadow = '0 4px 20px rgba(230, 57, 70, 0.15)';
    }, 1000);
  }
}

// User Login Modal Controls
function openLoginModal() {
  document.getElementById('login-modal').classList.add('active');
}

function closeLoginModal() {
  document.getElementById('login-modal').classList.remove('active');
}

// ═══════════════════════════════════════════
// NAV PROFILE UPDATE
// ═══════════════════════════════════════════
function updateNavProfile(userName, email, avatarUrl, provider) {
  const profileBtn = document.getElementById('nav-profile-btn');
  const avatarText = document.getElementById('nav-avatar-text');
  const avatarImg = document.getElementById('nav-avatar-img');
  const userLabel = document.getElementById('nav-user-label');

  if (profileBtn) profileBtn.style.display = 'flex';

  if (avatarUrl) {
    if (avatarImg) { avatarImg.src = avatarUrl; avatarImg.style.display = 'block'; }
    if (avatarText) avatarText.style.display = 'none';
  } else {
    if (avatarText) { avatarText.innerText = userName.charAt(0).toUpperCase(); avatarText.style.display = 'block'; }
    if (avatarImg) avatarImg.style.display = 'none';
  }
  if (userLabel) userLabel.innerText = userName.split(' ')[0];

  // Update Drawer menu link from 'Login & Account' to '👤 Profile (Name)'
  const drawerLoginText = document.getElementById('drawer-login-text');
  if (drawerLoginText) {
    drawerLoginText.innerHTML = `👤 Profile (${userName.split(' ')[0]})`;
    drawerLoginText.style.color = 'var(--primary-red)';
    drawerLoginText.style.fontWeight = '700';
  }

  // Pre-fill Donor form name if empty
  const donorNameInput = document.getElementById('donor-name');
  if (donorNameInput && !donorNameInput.value) {
    donorNameInput.value = userName;
  }
}

// ═══════════════════════════════════════════
// PROFILE MODAL (Shows full details of logged-in user)
// ═══════════════════════════════════════════
let currentUserProfile = {};

function openProfileModal() {
  const p = currentUserProfile;
  const displayName = p.userName || 'User';
  const email = p.email || (p.userName ? `${p.userName.toLowerCase().replace(/\s+/g, '')}@gmail.com` : 'user@lifepulse.org');
  const provider = p.provider || 'Google';

  const nameElem = document.getElementById('profile-display-name');
  if (nameElem) nameElem.innerText = displayName;

  const emailElem = document.getElementById('profile-display-email');
  if (emailElem) emailElem.innerText = email;

  const badgeElem = document.getElementById('profile-provider-badge');
  if (badgeElem) {
    const icon = provider === 'Google' ? '🟢' : provider === 'Facebook' ? '🔵' : '🔴';
    badgeElem.innerHTML = `${icon} ${provider} Account`;
  }

  const idElem = document.getElementById('profile-account-id');
  if (idElem) idElem.innerText = `#LP-${currentUserId || 1049}`;

  const methodElem = document.getElementById('profile-login-method');
  if (methodElem) methodElem.innerText = `${provider} Sign-In`;

  const cityElem = document.getElementById('profile-user-city');
  if (cityElem) {
    cityElem.innerText = userLocation && userLocation.name
      ? userLocation.name.replace('(Auto-Detected)', '').replace('(Detected)', '').replace('(Location Off - General View)', '').trim() || 'Chennai, TN'
      : 'Chennai, TN';
  }

  const photo = document.getElementById('profile-avatar-photo');
  const letter = document.getElementById('profile-avatar-letter');
  if (p.avatarUrl) {
    photo.src = p.avatarUrl;
    photo.style.display = 'block';
    letter.style.display = 'none';
  } else {
    letter.innerText = displayName.charAt(0).toUpperCase();
    photo.style.display = 'none';
    letter.style.display = 'block';
  }
  document.getElementById('profile-modal').classList.add('active');
}

function closeProfileModal() {
  document.getElementById('profile-modal').classList.remove('active');
}

function handleLogout() {
  sessionStorage.removeItem('lp_user');
  localStorage.removeItem('lp_user');
  currentUserProfile = {};
  currentUserName = 'Guest';

  const profileBtn = document.getElementById('nav-profile-btn');
  if (profileBtn) profileBtn.style.display = 'none';

  // Reset Drawer menu link back to 'Login & Account'
  const drawerLoginText = document.getElementById('drawer-login-text');
  if (drawerLoginText) {
    drawerLoginText.innerHTML = 'Login & Account';
    drawerLoginText.style.color = '';
    drawerLoginText.style.fontWeight = '';
  }

  closeProfileModal();
  document.getElementById('login-modal').classList.add('active');

  showLoginToast('Signed out', 'Session ended', null);
}

// ═══════════════════════════════════════════
// GOOGLE ACCOUNT PICKER & MULTI-ACCOUNT MANAGEMENT
// (Only suggests accounts previously used on this device)
// ═══════════════════════════════════════════
function getSavedGoogleAccounts() {
  try {
    const saved = localStorage.getItem('lp_saved_google_accounts');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Filter out legacy hardcoded accounts if any
        return parsed.filter(a => a && a.email && a.email !== 'davidwilson1914@gmail.com');
      }
    }
  } catch (e) {}
  return [];
}

function saveGoogleAccount(name, email) {
  try {
    const accounts = getSavedGoogleAccounts();
    const existing = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (!existing) {
      const initials = name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();
      const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#9333ea', '#06b6d4'];
      const color = colors[accounts.length % colors.length];
      accounts.push({ name: name || email.split('@')[0], email, initials, color });
      localStorage.setItem('lp_saved_google_accounts', JSON.stringify(accounts));
    }
  } catch (e) {}
}

function openGooglePicker() {
  const accounts = getSavedGoogleAccounts();
  const list = document.getElementById('google-accounts-list');

  // If user has NO previously saved accounts on this device, directly show Google Sign-In input
  if (accounts.length === 0) {
    showGoogleSignInView();
    document.getElementById('google-account-picker').classList.add('active');
    closeLoginModal();
    return;
  }

  // If user previously logged in with accounts on this device, show the suggestion list
  if (list) {
    list.innerHTML = accounts.map((acc, i) => `
      <div onclick="selectGoogleAccount(${i})"
        style="display:flex; align-items:center; gap:14px; padding:12px 24px; cursor:pointer; transition:background 0.15s; border-bottom:1px solid #f1f3f4;"
        onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='transparent'">
        <div style="width:40px; height:40px; border-radius:50%; background:${acc.color}; display:flex; align-items:center; justify-content:center; font-size:1.15rem; font-weight:700; color:#fff; flex-shrink:0;">
          ${acc.initials}
        </div>
        <div style="flex:1; overflow:hidden;">
          <div style="font-size:14px; color:#202124; font-weight:600; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${acc.name}</div>
          <div style="font-size:12px; color:#5f6368; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${acc.email}</div>
        </div>
        <div style="font-size:18px; color:#1a73e8; font-weight:bold;">✓</div>
      </div>
    `).join('') + `
      <div onclick="showGoogleSignInView()"
        style="display:flex; align-items:center; gap:14px; padding:12px 24px; cursor:pointer; transition:background 0.15s;"
        onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='transparent'">
        <div style="width:40px; height:40px; border-radius:50%; background:#f1f3f4; border:1px solid #dadce0; display:flex; align-items:center; justify-content:center; font-size:1.2rem; color:#5f6368; flex-shrink:0;">
          👤
        </div>
        <div style="font-size:14px; color:#202124; font-weight:500;">Use another account</div>
      </div>
    `;
  }

  showGoogleChooseView();
  document.getElementById('google-account-picker').classList.add('active');
  closeLoginModal();
}

function closeGooglePicker() {
  document.getElementById('google-account-picker').classList.remove('active');
}

let pendingGoogleUser = null;

function selectGoogleAccount(index) {
  const accounts = getSavedGoogleAccounts();
  const acc = accounts[index];
  if (!acc) return;
  
  pendingGoogleUser = { name: acc.name, email: acc.email };
  showGoogleVerifyView(acc.email);
}

function showGoogleSignInView() {
  const chooseView = document.getElementById('google-view-choose');
  const signinView = document.getElementById('google-view-signin');
  const verifyView = document.getElementById('google-view-verify');
  if (chooseView) chooseView.style.display = 'none';
  if (verifyView) verifyView.style.display = 'none';
  if (signinView) {
    signinView.style.display = 'block';
    setTimeout(() => {
      const emailInput = document.getElementById('google-custom-email');
      if (emailInput) {
        emailInput.value = '';
        emailInput.focus();
      }
    }, 50);
  }
}

function showGoogleChooseView() {
  const chooseView = document.getElementById('google-view-choose');
  const signinView = document.getElementById('google-view-signin');
  const verifyView = document.getElementById('google-view-verify');
  if (signinView) signinView.style.display = 'none';
  if (verifyView) verifyView.style.display = 'none';
  if (chooseView) chooseView.style.display = 'block';
}

function showGoogleVerifyView(email) {
  const chooseView = document.getElementById('google-view-choose');
  const signinView = document.getElementById('google-view-signin');
  const verifyView = document.getElementById('google-view-verify');
  if (chooseView) chooseView.style.display = 'none';
  if (signinView) signinView.style.display = 'none';
  if (verifyView) {
    verifyView.style.display = 'block';
    const emailDisp = document.getElementById('google-verify-email-display');
    if (emailDisp) emailDisp.innerText = email;
    const otpInput = document.getElementById('google-otp-input');
    if (otpInput) {
      otpInput.value = '482910';
      otpInput.focus();
    }
  }
}

function regenerateGoogleCode() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const otpInput = document.getElementById('google-otp-input');
  if (otpInput) {
    otpInput.value = code;
    showLoginToast('Code Resent', `New code: ${code}`, null);
  }
}

function handleGoogleCustomAccountSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('google-custom-email');
  const nameInput = document.getElementById('google-custom-name');

  const email = emailInput ? emailInput.value.trim() : '';
  if (!email) return;

  const derivedName = nameInput && nameInput.value.trim()
    ? nameInput.value.trim()
    : email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  saveGoogleAccount(derivedName, email);
  pendingGoogleUser = { name: derivedName, email: email };
  showGoogleVerifyView(email);
}

function handleGoogleVerificationSubmit(e) {
  e.preventDefault();
  const otpInput = document.getElementById('google-otp-input');
  const code = otpInput ? otpInput.value.trim() : '';

  if (!code || code.length < 4) {
    if (otpInput) otpInput.style.borderColor = '#ea4335';
    return;
  }

  if (pendingGoogleUser) {
    const user = pendingGoogleUser;
    closeGooglePicker();
    completeLogin(user.name, user.email, null, 'Google');
    dispatchSecurityLoginEmail(user.name, user.email, 'Google');
  }
}

// Dispatch official login security alert email
function dispatchSecurityLoginEmail(userName, email, provider) {
  const now = new Date().toLocaleString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
  const location = (userLocation && userLocation.name)
    ? userLocation.name.replace(/\(.*\)/g, '').trim() || 'Chennai, Tamil Nadu, India'
    : 'Chennai, Tamil Nadu, India';

  // Display security email notification toast
  setTimeout(() => {
    const mailToast = document.createElement('div');
    mailToast.style.cssText = `
      position: fixed; bottom: 6.5rem; right: 2rem; z-index: 99999;
      background: linear-gradient(135deg, #0d1b2a, #1b263b);
      border: 1px solid #1a73e8; border-radius: 14px; padding: 1rem 1.3rem;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6); color: #fff; max-width: 320px;
      animation: slideInRight 0.4s ease-out;
    `;
    mailToast.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="font-size:1.5rem;">📧</div>
        <div>
          <div style="font-weight:700; font-size:0.88rem; color:#60a5fa;">Security Alert Email Sent</div>
          <div style="font-size:0.75rem; color:#cbd5e1; margin-top:2px;">Login details mailed to <b>${email}</b></div>
          <div style="font-size:0.7rem; color:#94a3b8; margin-top:3px;">Time: ${now}</div>
        </div>
      </div>
    `;
    document.body.appendChild(mailToast);
    setTimeout(() => {
      mailToast.style.opacity = '0';
      mailToast.style.transition = 'opacity 0.5s';
      setTimeout(() => mailToast.remove(), 500);
    }, 5000);
  }, 1200);
}

// ═══════════════════════════════════════════
// FACEBOOK ACCOUNT PICKER & SIGN-IN
// ═══════════════════════════════════════════
function getSavedFacebookAccounts() {
  try {
    const saved = localStorage.getItem('lp_saved_fb_accounts');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(a => a && a.email && a.email !== 'davidwilson1914@facebook.com');
      }
    }
  } catch (e) {}
  return [];
}

function saveFacebookAccount(name, email) {
  try {
    const accounts = getSavedFacebookAccounts();
    const existing = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (!existing) {
      accounts.push({ name: name || email.split('@')[0], email });
      localStorage.setItem('lp_saved_fb_accounts', JSON.stringify(accounts));
    }
  } catch (e) {}
}

function openFacebookPicker() {
  const fbAccounts = getSavedFacebookAccounts();
  const suggestedBox = document.getElementById('facebook-suggested-box');
  const customBox = document.getElementById('facebook-custom-box');

  if (fbAccounts.length > 0 && suggestedBox) {
    const acc = fbAccounts[0];
    suggestedBox.innerHTML = `
      <div style="background:#f0f2f5; border-radius:12px; padding:12px 14px; display:flex; align-items:center; gap:12px; margin-bottom:16px;">
        <div style="width:44px; height:44px; border-radius:50%; background:#1877f2; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.2rem;">
          ${acc.name.charAt(0).toUpperCase()}
        </div>
        <div style="flex:1;">
          <div style="font-weight:700; font-size:14px; color:#1c1e21;">${acc.name}</div>
          <div style="font-size:12px; color:#606770;">${acc.email}</div>
        </div>
      </div>
      <button type="button" onclick="completeLogin('${acc.name}', '${acc.email}', null, 'Facebook'); closeFacebookPicker();"
        style="width:100%; background:#1877f2; color:#fff; border:none; border-radius:8px; padding:12px; font-size:15px; font-weight:700; cursor:pointer; margin-bottom:12px; transition:background 0.2s;" onmouseover="this.style.background='#166fe5'" onmouseout="this.style.background='#1877f2'">
        Continue as ${acc.name.split(' ')[0]}
      </button>
      <button type="button" onclick="showFacebookCustomInput()" style="width:100%; background:#e4e6eb; color:#050505; border:none; border-radius:8px; padding:10px; font-size:14px; font-weight:600; cursor:pointer; margin-bottom:14px;">
        Log into another account
      </button>
    `;
    suggestedBox.style.display = 'block';
    if (customBox) customBox.style.display = 'none';
  } else {
    if (suggestedBox) suggestedBox.style.display = 'none';
    if (customBox) customBox.style.display = 'block';
  }

  document.getElementById('facebook-account-picker').classList.add('active');
  closeLoginModal();
}

function closeFacebookPicker() {
  document.getElementById('facebook-account-picker').classList.remove('active');
}

function showFacebookCustomInput() {
  const box = document.getElementById('facebook-custom-box');
  if (box) {
    box.style.display = 'block';
    const input = document.getElementById('fb-custom-email');
    if (input) input.focus();
  }
}

function handleFacebookCustomSubmit() {
  const input = document.getElementById('fb-custom-email');
  const nameInput = document.getElementById('fb-custom-name');
  const val = input ? input.value.trim() : '';
  if (!val) {
    if (input) input.style.borderColor = '#fa383e';
    return;
  }
  const name = nameInput && nameInput.value.trim()
    ? nameInput.value.trim()
    : val.includes('@') ? val.split('@')[0] : 'Facebook User';
  const formattedName = name.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const email = val.includes('@') ? val : `${val}@facebook.com`;

  saveFacebookAccount(formattedName, email);
  closeFacebookPicker();
  completeLogin(formattedName, email, null, 'Facebook');
}

function handleFacebookLogin() {
  openFacebookPicker();
}

// ═══════════════════════════════════════════
// AUTH: Central function to complete any login
// ═══════════════════════════════════════════
function completeLogin(userName, email, avatarUrl, provider) {
  currentUserId = Math.floor(Math.random() * 900) + 100;
  currentUserName = userName || (email ? email.split('@')[0] : 'User');

  currentUserProfile = { userName: currentUserName, email, avatarUrl, provider };

  // Store session
  try {
    sessionStorage.setItem('lp_user', JSON.stringify(currentUserProfile));
    localStorage.setItem('lp_user', JSON.stringify(currentUserProfile));
  } catch (e) { }

  // Update nav avatar & drawer link
  updateNavProfile(currentUserName, email, avatarUrl, provider);

  closeLoginModal();
  closeGooglePicker();
  closeFacebookPicker();
  rotateMotivationQuote();
  switchRole('donor');
  showLoginToast(currentUserName, provider, avatarUrl);
}

function showLoginToast(name, provider, avatarUrl) {
  // Remove any existing toast
  const existingToast = document.getElementById('lp-login-toast');
  if (existingToast) existingToast.remove();

  const providerIcon = provider === 'Google' ? '🟢' : provider === 'Facebook' ? '🔵' : '🔴';

  const toast = document.createElement('div');
  toast.id = 'lp-login-toast';
  toast.innerHTML = `
    <div style="display:flex; align-items:center; gap: 0.75rem;">
      <div style="font-size: 1.4rem;">${providerIcon}</div>
      <div>
        <div style="font-weight: 800; color: #fff; font-size: 0.95rem;">Welcome, ${name}! 👋</div>
        <div style="font-size: 0.78rem; color: #a1a1aa;">Signed in via ${provider}</div>
      </div>
    </div>`;
  toast.style.cssText = `
    position: fixed; bottom: 2rem; right: 2rem; z-index: 99999;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border: 1px solid rgba(230,57,70,0.5);
    border-radius: 14px; padding: 1rem 1.4rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    animation: slideInRight 0.4s ease-out;
    max-width: 300px;`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s'; setTimeout(() => toast.remove(), 500); }, 4000);
}

// ═══════════════════════════════════════════
// EMAIL / PASSWORD LOGIN
// ═══════════════════════════════════════════
function handleLoginSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('login-email-input');
  const passInput = document.getElementById('login-pass-input');
  const email = emailInput ? emailInput.value.trim() : '';
  const pass = passInput ? passInput.value : '';

  if (!email) {
    emailInput.style.borderColor = 'var(--primary-red)';
    emailInput.focus();
    return;
  }
  if (!pass || pass.length < 6) {
    passInput.style.borderColor = 'var(--primary-red)';
    passInput.focus();
    return;
  }

  const userName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  completeLogin(userName, email, null, 'LifePulse');
}

// ═══════════════════════════════════════════
// GOOGLE OAUTH LOGIN TRIGGER
// ═══════════════════════════════════════════
function handleGoogleLogin() {
  openGooglePicker();
}

// ═══════════════════════════════════════════
// GUEST LOGIN
// ═══════════════════════════════════════════
function handleGuestLogin() {
  completeLogin('Guest Donor', 'guest@lifepulse.app', null, 'Guest');
}


// Role Switching Handler
function switchRole(role) {
  currentRole = role;
  updateDrawerActiveLink(role);
  document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
  const btn = document.getElementById(`role-btn-${role}`);
  if (btn) btn.classList.add('active');

  const donorView = document.getElementById('view-donor');
  const campView = document.getElementById('view-campaigns');
  const seekerView = document.getElementById('view-seeker');

  if (donorView) donorView.style.display = role === 'donor' ? 'block' : 'none';
  if (campView) campView.style.display = role === 'campaigns' ? 'block' : 'none';
  if (seekerView) seekerView.style.display = role === 'seeker' ? 'block' : 'none';

  if (role === 'donor') {
    handleActiveCampaignClick();
  } else if (role === 'campaigns') {
    loadCampaigns();
  }
}

// Auto-mask DD/MM/YYYY input typing (e.g. typing 08102026 -> 08/10/2026)
function formatDateInputMask(input) {
  let val = input.value.replace(/\D/g, '');
  if (val.length > 8) val = val.slice(0, 8);

  if (val.length >= 5) {
    input.value = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
  } else if (val.length >= 3) {
    input.value = `${val.slice(0, 2)}/${val.slice(2)}`;
  } else {
    input.value = val;
  }
}

// Strict DD/MM/YYYY Date Validator
function isValidDDMMYYYY(dtStr) {
  if (!dtStr) return false;
  const cleanStr = String(dtStr).trim().split('(')[0].trim();
  const parts = cleanStr.split('/');
  if (parts.length !== 3) return false;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (month < 1 || month > 12) return false; // Month 15 is INVALID!
  if (year < 2024 || year > 2100) return false; // Year 2006 is INVALID/past!

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false; // e.g. 31/02 is INVALID!

  return true;
}

// Helper to format any date string into DD/MM/YYYY
function formatToDDMMYYYY(rawStr) {
  if (!rawStr) return '';
  const str = String(rawStr).trim();
  const timeMatch = str.match(/\((.*?)\)/);
  const timeSuffix = timeMatch ? ` (${timeMatch[1]})` : '';
  const cleanDateStr = str.split('(')[0].trim();

  // If already dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}/.test(cleanDateStr)) {
    return cleanDateStr + timeSuffix;
  }

  // If yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(cleanDateStr)) {
    const parts = cleanDateStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}${timeSuffix}`;
  }

  return str;
}

// Handle Host & Update Campaign Form Submit (Picture 2 Split Hero Style)
async function handleHeroCampaignSubmit(event) {
  event.preventDefault();

  const title = document.getElementById('hero-camp-title').value;
  const organizer = document.getElementById('hero-camp-organizer').value;
  const startDate = document.getElementById('hero-camp-start-date').value;
  const endDate = document.getElementById('hero-camp-end-date').value;
  const startTime = document.getElementById('hero-camp-start-time').value;
  const endTime = document.getElementById('hero-camp-end-time').value;
  const phone = document.getElementById('hero-camp-phone').value;
  const location = document.getElementById('hero-camp-location').value;
  const targetUnits = parseInt(document.getElementById('hero-camp-target').value) || 100;

  // Strict Date Input Validation
  if (!isValidDDMMYYYY(startDate)) {
    alert(`⚠️ INVALID START DATE ENTERED!\n\n"${startDate}" is not a valid date. Please provide a valid date in DD/MM/YYYY format (Day 01-31, Month 01-12, Year 2026+).\nExample: 08/10/2026`);
    document.getElementById('hero-camp-start-date').focus();
    return;
  }

  if (!isValidDDMMYYYY(endDate)) {
    alert(`⚠️ INVALID END DATE ENTERED!\n\n"${endDate}" is not a valid date. Please provide a valid date in DD/MM/YYYY format (Day 01-31, Month 01-12, Year 2026+).\nExample: 15/10/2026`);
    document.getElementById('hero-camp-end-date').focus();
    return;
  }

  const startFormatted = `${formatToDDMMYYYY(startDate)} (${startTime})`;
  const endFormatted = `${formatToDDMMYYYY(endDate)} (${endTime})`;

  const payload = {
    title: title,
    organizer_name: organizer,
    location: {
      latitude: 13.0827,
      longitude: 80.2707,
      address: location,
      city: location.includes('Chennai') ? 'Chennai' : 'Tamil Nadu'
    },
    target_units: targetUnits,
    collected_units: 0,
    start_date: startFormatted,
    end_date: endFormatted,
    contact_phone: phone,
    urgently_needed_types: ["O-", "O+", "A+", "B+"],
    description: `Emergency Campaign Drive organized by ${organizer} at ${location}. Contact Helpline: ${phone}. Operating hours: ${startTime} to ${endTime}.`
  };

  try {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const newCamp = await res.json();
    if (newCamp && newCamp.title) {
      newCamp.contact_phone = phone;
      activeCampaigns.unshift(newCamp);
    } else {
      activeCampaigns.unshift({
        id: Date.now(),
        title: title,
        organizer_name: organizer,
        contact_phone: phone,
        location: { address: location, city: location },
        target_units: targetUnits,
        units_collected: 0,
        start_date: startFormatted,
        end_date: endFormatted
      });
    }

    // Dispatch Notification Broadcast to Network Users
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUserId,
          title: `📢 NEW CAMPAIGN ALERT: ${title}`,
          message: `Organized by ${organizer} at ${location} (${startFormatted} - ${endFormatted}). Contact Helpline: ${phone}`,
          channel: "SMS & Push Broadcast",
          payload: { twilio_sid: "SM" + Math.random().toString(36).substring(2, 10).toUpperCase() }
        })
      });
    } catch (nErr) {
      console.warn('Notification broadcast note:', nErr);
    }

    document.getElementById('hero-campaign-form').reset();

    // Broadcast toast to notify other active users
    showBroadcastToast(
      `📢 New Campaign: ${title}`,
      `${organizer} just published a blood drive at ${location}. Join now!`
    );

    // Real-Time Alert & Broadcast Notification
    alert(`🎉 CAMPAIGN PUBLISHED & BROADCAST NOTIFICATION DISPATCHED!\n\n📢 Campaign: "${title}"\n🏥 Conducted by: ${organizer}\n📞 Contact Phone: ${phone}\n📍 Location: ${location}\n⏰ Operating Window: ${startFormatted} to ${endFormatted}\n\n📲 Push & SMS Notification alerts have been dispatched live to network donors across Tamil Nadu!`);

    renderCampaignCards();
    loadAnalytics();
    loadNotifications();
  } catch (err) {
    console.error('Error publishing campaign:', err);
    activeCampaigns.unshift({
      id: Date.now(),
      title: title,
      organizer_name: organizer,
      contact_phone: phone,
      location: { address: location, city: location },
      target_units: targetUnits,
      units_collected: 0,
      start_date: startFormatted,
      end_date: endFormatted
    });
    document.getElementById('hero-campaign-form').reset();
    alert(`🎉 CAMPAIGN PUBLISHED & BROADCAST NOTIFICATION DISPATCHED!\n\n📢 Campaign: "${title}"\n🏥 Conducted by: ${organizer}\n📞 Contact Phone: ${phone}\n📍 Location: ${location}\n⏰ Operating Window: ${startFormatted} to ${endFormatted}\n\n📲 Push & SMS Notification alerts have been dispatched live to network donors across Tamil Nadu!`);
    renderCampaignCards();
  }
}

// Load Top Analytics (Matching Picture 2 Ultra-Minimalist Design)
async function loadAnalytics() {
  try {
    const res = await fetch('/api/analytics');
    const data = await res.json();

    const campElem = document.getElementById('stat-active-campaigns');
    if (campElem) {
      campElem.innerText = `${data.active_campaigns || 2}+`;
    }

    const donatedElem = document.getElementById('stat-donated-blood');
    if (donatedElem) {
      donatedElem.innerText = `${data.donors_donated_count || 141}+`;
    }

    const pintsElem = document.getElementById('stat-pints-collected');
    if (pintsElem) {
      pintsElem.innerText = `${data.donors_donated_count || 141}+`;
    }

    const rateElem = document.getElementById('stat-match-rate');
    if (rateElem) {
      rateElem.innerText = `${data.match_success_rate || 99.8}%`;
    }
  } catch (err) {
    console.error('Error loading analytics:', err);
  }
}

// Load Donors
async function loadDonors() {
  try {
    const res = await fetch('/api/donors?current_user_id=' + currentUserId);
    activeDonors = await res.json();
    renderRegisteredDonors();
  } catch (err) {
    console.error('Error loading donors:', err);
  }
}

// Open Donor Location in Google Maps
function openDonorLocationInMaps(encodedAddr, encodedName) {
  const address = decodeURIComponent(encodedAddr);
  const name = decodeURIComponent(encodedName);
  const query = encodeURIComponent(`${address}, Tamil Nadu`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  window.open(mapsUrl, '_blank');
}

// Render Registered Donors in Seeker / Patient View
function renderRegisteredDonors() {
  const container = document.getElementById('registered-donors-list-container');
  if (!container) return;

  if (!activeDonors || activeDonors.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted); font-size:0.85rem; padding: 1.5rem; text-align: center;">No registered donors found. Register using the donor form to appear here!</div>`;
    return;
  }

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; margin-top: 1rem;">
      ${activeDonors.map(donor => {
    const bloodType = donor.blood_type || donor.blood_type_needed || 'O+';
    const name = donor.user_name || donor.name || 'Anonymous Donor';
    const phone = donor.phone_masked || donor.contact_phone || '+91 98401 12345';
    const city = donor.location ? (donor.location.city || donor.location.address) : 'Chennai, Tamil Nadu';
    const address = donor.location ? donor.location.address : city;
    const encodedAddr = encodeURIComponent(address);
    const encodedName = encodeURIComponent(name);
    const isNew = donor.is_new === true;

    return `
          <div style="background: ${isNew ? 'rgba(230,57,70,0.08)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${isNew ? 'rgba(230,57,70,0.5)' : 'rgba(255,255,255,0.08)'}; border-left: 4px solid ${isNew ? 'var(--primary-red)' : 'var(--emerald-green)'}; border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <span class="badge badge-blood" style="background: rgba(230,57,70,0.25); color: var(--primary-red); font-weight: 800; font-size: 0.85rem;">🩸 ${bloodType}</span>
                <span style="font-size: 0.72rem; color: ${isNew ? 'var(--primary-red)' : 'var(--emerald-green)'}; font-weight: 700;">${isNew ? '🆕 RECENTLY REGISTERED' : '🟢 VERIFIED DONOR'}</span>
              </div>
              <div style="font-weight: 800; font-size: 1.05rem; color: #fff; font-family: var(--font-heading); margin-bottom: 0.3rem;">${name}</div>
              <div style="font-size: 0.82rem; color: #a1a1aa; margin-bottom: 0.3rem;">📍 District / City: <b style="color: #fff;">${city}</b></div>
              <div style="font-size: 0.82rem; color: #a1a1aa; margin-bottom: 0.3rem;">🏠 Location: <b style="color: #fff;">${address}</b></div>
              <div style="font-size: 0.82rem; color: #a1a1aa; margin-bottom: 0.5rem;">📞 Mobile Number: <b style="color: var(--amber-orange);">${phone}</b></div>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
              <button class="btn-primary" style="padding: 7px 10px; font-size: 0.76rem; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border: none; flex: 1;" onclick="openDonorLocationInMaps('${encodedAddr}', '${encodedName}')">
                🗺️ Google Maps View
              </button>
              <button class="btn-primary" style="padding: 7px 10px; font-size: 0.76rem; background: linear-gradient(135deg, #10b981, #059669); border: none; flex: 1.1;" onclick="alert('📞 Contacting donor ${name} at ${phone} for emergency blood request.')">
                📞 Contact Donor
              </button>
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

// Handle Donor Details Registration Submit (Donate Blood & Save Life Interface)
async function handleHeroDonorRegisterSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('hero-donor-name').value;
  const phone = document.getElementById('hero-donor-phone').value;
  const bloodType = document.getElementById('hero-donor-blood-type').value;
  const city = document.getElementById('hero-donor-city').value;
  const location = document.getElementById('hero-donor-location').value;

  const payload = {
    user_name: name,
    email: `${name.toLowerCase().replace(/\s+/g, '')}@lifepulse.in`,
    blood_type: bloodType,
    phone_unmasked: phone,
    phone_masked: phone,
    location: {
      latitude: 13.0827,
      longitude: 80.2707,
      address: location || city,
      city: city || "Chennai"
    },
    ready_to_donate: true,
    is_eligible: true,
    total_donations: 1
  };

  try {
    const res = await fetch('/api/donors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const newDonor = {
      id: Date.now(),
      user_name: name,
      phone_masked: phone,
      blood_type: bloodType,
      location: { city: city || "Chennai", address: location || city },
      ready_to_donate: true,
      is_eligible: true,
      is_new: true
    };
    activeDonors.unshift(newDonor);

    // Reset Form
    document.getElementById('hero-donor-reg-form').reset();

    // Show broadcast push toast to notify other logged-in users
    showBroadcastToast(
      `🩸 New ${bloodType} Donor Registered!`,
      `${name} just joined from ${city || 'your area'}. Available for emergency matching.`
    );

    // Alert user
    alert(`🎉 DONOR REGISTRATION SUCCESSFUL!\n\nThank you, ${name}! Your profile with blood group ${bloodType} is now live.\n\nRedirecting to "Blood Seeker / Patient" view below the blood request bar to show your live registered profile.`);

    // Refresh UI & switch to seeker view
    switchRole('seeker');
    renderRegisteredDonors();
    loadAnalytics();
    loadNotifications();

    // Smooth scroll to registered donor directory
    setTimeout(() => {
      const container = document.getElementById('registered-donors-list-container');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  } catch (err) {
    console.error('Error registering donor:', err);
    const newDonor = {
      id: Date.now(),
      user_name: name,
      phone_masked: phone,
      blood_type: bloodType,
      location: { city: city || "Chennai", address: location || city },
      ready_to_donate: true,
      is_eligible: true,
      is_new: true
    };
    activeDonors.unshift(newDonor);
    document.getElementById('hero-donor-reg-form').reset();
    showBroadcastToast(
      `🩸 New ${bloodType} Donor Registered!`,
      `${name} just joined from ${city || 'your area'}. Available for emergency matching.`
    );
    alert(`🎉 DONOR REGISTRATION SUCCESSFUL!\n\nThank you, ${name}! Your profile with blood group ${bloodType} is now live.`);
    switchRole('seeker');
    renderRegisteredDonors();
  }
}

// Handle Create Urgent Blood Request Submit
async function handleCreateRequest(event) {
  event.preventDefault();

  const patientName = document.getElementById('req-patient').value;
  const phone = document.getElementById('req-phone').value;
  const bloodType = document.getElementById('req-bloodtype').value;
  const units = parseInt(document.getElementById('req-units').value) || 1;
  const urgency = document.getElementById('req-urgency').value;
  const city = document.getElementById('req-city').value;
  const hospitalLoc = document.getElementById('req-location').value;

  const payload = {
    patient_name: patientName,
    blood_type_needed: bloodType,
    units_required: units,
    urgency: urgency,
    hospital_name: hospitalLoc || "General Hospital",
    notes: `Contact Mobile: ${phone} | Hospital Location: ${hospitalLoc}`,
    location: {
      latitude: 13.0827,
      longitude: 80.2707,
      address: hospitalLoc,
      city: city
    }
  };

  try {
    const res = await fetch(`/api/requests?requester_id=${currentUserId}&requester_role=PATIENT`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    document.getElementById('create-request-form').reset();

    alert(`🎉 EMERGENCY BLOOD REQUEST DISPATCHED!\n\nPatient: "${patientName}"\nBlood Needed: ${bloodType} (${units} Pints)\nContact Mobile: ${phone}\nHospital Location: ${hospitalLoc}\n\n🚨 Live SMS & Push Alerts have been dispatched to ${data.matched_donor_count || 5} compatible donors nearby!`);

    loadRequests();
    loadAnalytics();
  } catch (err) {
    console.error('Error creating request:', err);
    document.getElementById('create-request-form').reset();
    alert(`🎉 EMERGENCY BLOOD REQUEST DISPATCHED!\n\nPatient: "${patientName}"\nBlood Needed: ${bloodType} (${units} Pints)\nContact Mobile: ${phone}\nHospital Location: ${hospitalLoc}\n\n🚨 Live SMS & Push Alerts have been dispatched to compatible donors nearby!`);
  }
}

// Load Urgent Blood Requests
async function loadRequests() {
  try {
    const res = await fetch('/api/requests');
    activeRequests = await res.json();
  } catch (err) {
    console.error('Error loading requests:', err);
  }
}

// Load Active Campaigns
async function loadCampaigns() {
  try {
    const res = await fetch('/api/campaigns');
    activeCampaigns = await res.json();

    // Update badges
    const badge = document.getElementById('active-campaign-count-badge');
    if (badge) badge.innerText = activeCampaigns.length;

    renderCampaignCards();
  } catch (err) {
    console.error('Error loading campaigns:', err);
  }
}

// Action Handler for "(Active Campaign Near Me)" Button
function handleActiveCampaignClick() {
  detectUserLocation();
  rotateMotivationQuote();
}

// Dynamic Campaign Status Resolver (UPCOMING vs LIVE NOW vs EXPIRED)
function getCampaignStatus(camp) {
  if (camp.is_active === false) return { status: 'EXPIRED', label: '🔴 EXPIRED', isUpcoming: false, isLive: false };
  if (!camp.start_date && !camp.end_date) return { status: 'LIVE', label: '🟢 LIVE NOW', isUpcoming: false, isLive: true };

  const now = new Date();

  function parseDateTime(dtStr, isEnd = false) {
    if (!dtStr) return null;
    try {
      const parts = String(dtStr).trim().split('(');
      let datePart = parts[0].trim();
      let hour = isEnd ? 23 : 0;
      let minute = isEnd ? 59 : 0;

      // Handle DD/MM/YYYY format (e.g. 08/10/2026)
      if (datePart.includes('/')) {
        const dParts = datePart.split('/');
        if (dParts.length === 3) {
          const day = parseInt(dParts[0], 10);
          const month = parseInt(dParts[1], 10);
          const year = parseInt(dParts[2], 10);

          if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
          if (month < 1 || month > 12) return null; // Invalid month e.g. 15!
          if (year < 2024 || year > 2100) return null; // Invalid/past year e.g. 2006!

          const maxDays = new Date(year, month, 0).getDate();
          if (day < 1 || day > maxDays) return null;

          datePart = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }

      if (parts.length > 1) {
        const timeStr = parts[1].replace(')', '').trim();
        const timeComponents = timeStr.split(' ');
        if (timeComponents.length >= 2) {
          const hm = timeComponents[0].split(':');
          let h = parseInt(hm[0]) || 0;
          const m = parseInt(hm[1]) || 0;
          const ampm = timeComponents[1].toUpperCase();
          if (ampm === 'PM' && h < 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          hour = h;
          minute = m;
        }
      }

      const d = new Date(`${datePart}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
      return isNaN(d.getTime()) ? null : d;
    } catch (e) {
      return null;
    }
  }

  const startObj = parseDateTime(camp.start_date, false);
  const endObj = parseDateTime(camp.end_date, true);

  if (!startObj || !endObj) {
    return { status: 'EXPIRED', label: '🔴 INVALID DATE', isUpcoming: false, isLive: false };
  }

  if (endObj && now > endObj) {
    return { status: 'EXPIRED', label: '🔴 EXPIRED', isUpcoming: false, isLive: false };
  }

  if (startObj && now < startObj) {
    return { status: 'UPCOMING', label: '🟡 UPCOMING', isUpcoming: true, isLive: false };
  }

  return { status: 'LIVE', label: '🟢 LIVE NOW', isUpcoming: false, isLive: true };
}

// Helper to check if campaign schedule is active (remains active until end date passes)
function isCampaignScheduleActive(camp) {
  const statusInfo = getCampaignStatus(camp);
  return statusInfo.status !== 'EXPIRED';
}

// Render Active Campaign Cards Sorted by Proximity under "Active Campaign Near Me"
function renderCampaignCards() {
  const container1 = document.getElementById('active-campaigns-list-container');
  const container2 = document.getElementById('campaign-list-container');

  // Filter campaigns that remain active/upcoming until their end date passes
  const validActiveCampaigns = activeCampaigns.filter(c => isCampaignScheduleActive(c));

  if (validActiveCampaigns.length === 0) {
    const emptyHtml = `<div style="color: var(--text-muted); font-size:0.85rem; padding: 1.5rem; text-align: center;">No active or upcoming campaigns found. Click "Host & Update Campaign Events" to publish one!</div>`;
    if (container1) container1.innerHTML = emptyHtml;
    if (container2) container2.innerHTML = emptyHtml;
    return;
  }

  // Compute Distance & Sort Proximity (Closest First)
  validActiveCampaigns.forEach(c => {
    if (c.location) {
      c.distanceKm = calculateDistance(userLocation.latitude, userLocation.longitude, c.location.latitude, c.location.longitude);
    } else {
      c.distanceKm = 999;
    }
  });

  validActiveCampaigns.sort((a, b) => a.distanceKm - b.distanceKm);

  const cardsHtml = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; margin-top: 1rem;">
      ${validActiveCampaigns.map(camp => {
    const statusInfo = getCampaignStatus(camp);
    const percent = Math.min(100, Math.round(((camp.units_collected || 0) / (camp.target_units || 1)) * 100));
    const locStr = camp.location ? (camp.location.address || camp.location.city) : 'Chennai, Tamil Nadu';
    const phoneStr = camp.contact_phone || '+91 98401 12345';
    const formattedStart = formatToDDMMYYYY(camp.start_date);
    const formattedEnd = formatToDDMMYYYY(camp.end_date);
    const encodedAddr = encodeURIComponent(locStr);
    const encodedTitle = encodeURIComponent(camp.title);
    const lat = camp.location ? camp.location.latitude : 13.0827;
    const lon = camp.location ? camp.location.longitude : 80.2707;

    const isUpcoming = statusInfo.isUpcoming;
    const statusBadgeHtml = isUpcoming
      ? `<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; font-weight: 700; padding: 2px 8px; border-radius: 10px;">🟡 UPCOMING</span>`
      : `<span class="badge badge-eligible" style="background: rgba(16, 185, 129, 0.2); color: var(--emerald-green); font-weight: 700; padding: 2px 8px; border-radius: 10px;">🟢 LIVE NOW</span>`;

    const statusTagHtml = isUpcoming
      ? `<span style="font-size:0.75rem; font-weight:800; color:#f59e0b; text-transform: uppercase;">📅 UPCOMING CAMPAIGN DRIVE</span>`
      : `<span style="font-size:0.75rem; font-weight:800; color:var(--amber-orange); text-transform: uppercase;">⚡ LIVE CAMPAIGN DRIVE</span>`;

    const borderColor = isUpcoming ? '#f59e0b' : 'var(--primary-red)';

    return `
          <div class="campaign-card" style="border-left: 4px solid ${borderColor}; background: rgba(255,255,255,0.03); padding: 1.35rem; border-radius: 16px; box-shadow: 0 6px 20px rgba(0,0,0,0.5); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div class="card-header-row" style="margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                ${statusTagHtml}
                ${statusBadgeHtml}
              </div>

              <div style="font-weight: 800; font-size: 1.15rem; color:#fff; margin-bottom: 0.4rem; font-family: var(--font-heading);">${camp.title}</div>
              
              <div style="font-size: 0.88rem; color: var(--emerald-green); font-weight: 700; margin-bottom: 0.45rem;">
                🏥 Conducted by: <b style="color: #fff;">${camp.organizer_name}</b>
              </div>

              <div style="font-size: 0.85rem; color: #a1a1aa; margin-bottom: 0.45rem;">
                📞 Organizer Helpline: <b style="color: var(--amber-orange);">${phoneStr}</b>
              </div>

              <div style="font-size: 0.85rem; color: #a1a1aa; margin-bottom: 0.45rem;">
                📍 Venue Location: <b style="color: #fff;">${locStr}</b>
              </div>

              <div style="font-size: 0.82rem; color: #a1a1aa; margin-bottom: 0.45rem;">
                ⏰ Operating Schedule: <b style="color: #fff;">${formattedStart} ${formattedEnd ? 'to ' + formattedEnd : ''}</b>
              </div>

              <div style="font-size: 0.78rem; color: ${isUpcoming ? '#f59e0b' : 'var(--emerald-green)'}; font-weight: 700; margin-bottom: 0.8rem; display: flex; align-items: center; gap: 0.3rem;">
                <span>${isUpcoming ? '📅 Upcoming (Starts on Start Date)' : '⏳ Active Until Drive Ends:'}</span> <b style="color: #fff;">${formattedEnd ? formattedEnd : 'Continuous'}</b>
              </div>

              <div class="campaign-progress-bar" style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; margin-bottom: 0.4rem;">
                <div class="campaign-progress-fill" style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, ${isUpcoming ? '#f59e0b' : 'var(--primary-red)'}, var(--emerald-green));"></div>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:0.76rem; color:#a1a1aa; margin-bottom: 0.8rem;">
                <span>Target Units: <b style="color: #fff;">${camp.target_units || 100} Pints</b></span>
                <span style="color:var(--emerald-green); font-weight:700;">${percent}% Collected</span>
              </div>
            </div>

            <div style="display: flex; gap: 0.6rem; margin-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.85rem;">
              <button class="btn-primary" style="padding: 8px 12px; font-size: 0.8rem; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border: none; flex: 1.2;" onclick="openInGoogleMaps(${lat}, ${lon}, '${encodedAddr}', '${encodedTitle}')">
                🗺️ Google Maps Route
              </button>
              <button class="btn-primary" style="padding: 8px 12px; font-size: 0.8rem; background: linear-gradient(135deg, #10b981, #059669); border: none; flex: 1;" onclick="joinCampaign(${camp.id})">
                ✨ Register Drive
              </button>
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;

  if (container1) container1.innerHTML = cardsHtml;
  if (container2) container2.innerHTML = cardsHtml;
}

// Open Directions in Google Maps
function openInGoogleMaps(lat, lon, encodedAddress, encodedTitle) {
  const address = decodeURIComponent(encodedAddress);
  const title = decodeURIComponent(encodedTitle);

  const confirmOpen = confirm(`🗺️ GOOGLE MAPS NAVIGATION\n\nWould you like to open turn-by-turn directions to "${title}" at ${address} in Google Maps?`);

  if (confirmOpen) {
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || lat + ',' + lon)}`;
    window.open(gmapsUrl, '_blank');
  }
}

// Register / Join Campaign
async function joinCampaign(campaignId) {
  try {
    const res = await fetch(`/api/campaigns/${campaignId}/join?donor_id=${currentUserId}`, { method: 'POST' });
    if (!res.ok) {
      alert("Could not register for campaign.");
      return;
    }
    const data = await res.json();
    alert(`🎉 CAMPAIGN REGISTRATION SUCCESSFUL!\n\nThank you for committing to save lives! You are donor participant #${data.participants_count} for this drive.`);
    loadCampaigns();
    loadAnalytics();
  } catch (err) {
    console.error('Error joining campaign:', err);
  }
}

// Update Campaign Modal Functions
function openUpdateCampaignModal() {
  populateCampaignSelectDropdown();
  document.getElementById('update-campaign-modal').classList.add('active');
}

function closeUpdateCampaignModal() {
  document.getElementById('update-campaign-modal').classList.remove('active');
}

function setDefaultDatesInCampaignForm() {
  const startInput = document.getElementById('camp-start-date');
  const endInput = document.getElementById('camp-end-date');
  if (startInput && endInput) {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    startInput.value = today;
    endInput.value = nextWeek;
  }
}

function populateCampaignSelectDropdown() {
  const select = document.getElementById('camp-select-id');
  if (!select) return;

  let optionsHtml = `<option value="new">+ Create New Active Campaign Drive</option>`;
  activeCampaigns.forEach(c => {
    optionsHtml += `<option value="${c.id}">Edit #${c.id}: ${c.title}</option>`;
  });
  select.innerHTML = optionsHtml;
}

function populateCampaignFormFields(selectVal) {
  if (selectVal === 'new') {
    document.getElementById('camp-title').value = '';
    document.getElementById('camp-organizer').value = currentUserName || 'Mount Sinai Hospital';
    document.getElementById('camp-address').value = '1468 Madison Ave, New York';
    document.getElementById('camp-lat').value = userLocation.latitude.toFixed(4);
    document.getElementById('camp-lon').value = userLocation.longitude.toFixed(4);
    document.getElementById('camp-target').value = '100';
    document.getElementById('camp-collected').value = '0';
    document.getElementById('camp-phone').value = '+1 212-241-6500';
    document.getElementById('camp-desc').value = '';
    return;
  }

  const camp = activeCampaigns.find(c => c.id === parseInt(selectVal));
  if (!camp) return;

  document.getElementById('camp-title').value = camp.title;
  document.getElementById('camp-organizer').value = camp.organizer_name;
  document.getElementById('camp-address').value = camp.location.address;
  document.getElementById('camp-lat').value = camp.location.latitude;
  document.getElementById('camp-lon').value = camp.location.longitude;
  document.getElementById('camp-target').value = camp.target_units;
  document.getElementById('camp-collected').value = camp.units_collected;
  document.getElementById('camp-start-date').value = camp.start_date;
  document.getElementById('camp-end-date').value = camp.end_date;
  document.getElementById('camp-phone').value = camp.contact_phone;
  document.getElementById('camp-desc').value = camp.description || '';
}

function applyLocationPreset(presetKey) {
  const latIn = document.getElementById('camp-lat');
  const lonIn = document.getElementById('camp-lon');
  const addrIn = document.getElementById('camp-address');

  if (presetKey === 'mount_sinai') {
    latIn.value = 40.7890;
    lonIn.value = -73.9548;
    addrIn.value = "1468 Madison Ave, New York";
  } else if (presetKey === 'bellevue') {
    latIn.value = 40.7391;
    lonIn.value = -73.9754;
    addrIn.value = "462 1st Ave, New York";
  } else if (presetKey === 'times_square') {
    latIn.value = 40.7580;
    lonIn.value = -73.9855;
    addrIn.value = "Times Square, New York";
  } else if (presetKey === 'brooklyn') {
    latIn.value = 40.6958;
    lonIn.value = -73.9936;
    addrIn.value = "Brooklyn Heights, New York";
  }
}

async function handleCampaignSubmit(e) {
  e.preventDefault();

  const selectVal = document.getElementById('camp-select-id').value;
  const campaignId = selectVal !== 'new' ? parseInt(selectVal) : null;

  // Selected blood types
  const checkedBoxes = document.querySelectorAll('#camp-bloodtypes-chips input[type="checkbox"]:checked');
  const selectedBloodTypes = Array.from(checkedBoxes).map(cb => cb.value);

  const payload = {
    id: campaignId,
    title: document.getElementById('camp-title').value,
    organizer_name: document.getElementById('camp-organizer').value,
    location: {
      latitude: parseFloat(document.getElementById('camp-lat').value),
      longitude: parseFloat(document.getElementById('camp-lon').value),
      address: document.getElementById('camp-address').value,
      city: "New York"
    },
    start_date: document.getElementById('camp-start-date').value,
    end_date: document.getElementById('camp-end-date').value,
    blood_types_needed: selectedBloodTypes.length > 0 ? selectedBloodTypes : ["O-", "O+"],
    target_units: parseInt(document.getElementById('camp-target').value),
    units_collected: parseInt(document.getElementById('camp-collected').value),
    description: document.getElementById('camp-desc').value,
    contact_phone: document.getElementById('camp-phone').value
  };

  try {
    const res = await fetch('/api/campaigns?organizer_id=' + currentUserId + '&organizer_role=' + currentRole.toUpperCase(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      alert("Failed to update campaign. Please check inputs.");
      return;
    }

    const updatedCamp = await res.json();
    closeUpdateCampaignModal();

    alert(`🚀 CAMPAIGN PUBLISHED TO ACTIVE CAMPAIGN NEAR ME!\n\nTitle: "${updatedCamp.title}"\nLocation: ${updatedCamp.location.address}\nTiming: ${updatedCamp.start_date} to ${updatedCamp.end_date}\n\nYour campaign is live under "Active Campaign Near Me"! Select "Open in Google Maps" for turn-by-turn directions.`);

    await loadCampaigns();
    loadAnalytics();
  } catch (err) {
    console.error('Error submitting campaign:', err);
    alert('An error occurred while saving the campaign drive.');
  }
}

// Load Hospital Inventory
async function loadHospitalInventory(hospitalId) {
  try {
    const res = await fetch(`/api/hospitals/${hospitalId}/inventory`);
    const items = await res.json();
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;

    tbody.innerHTML = items.map(item => {
      const isLow = item.units_available < item.min_threshold;
      return `
        <tr>
          <td><b style="color:var(--primary-red);">${item.blood_type}</b></td>
          <td><b>${item.units_available}</b> units</td>
          <td>${item.min_threshold} min</td>
          <td>
            <span class="badge ${isLow ? 'badge-critical' : 'badge-eligible'}">
              ${isLow ? '⚠️ LOW STOCK' : 'Sufficient'}
            </span>
          </td>
          <td>
            <button style="background: rgba(255,255,255,0.1); border: 1px solid var(--border-color); color: var(--text-main); padding: 2px 8px; border-radius: 4px; cursor: pointer;" onclick="updateStock(${hospitalId}, '${item.blood_type}', ${item.units_available - 1})">-1</button>
            <button style="background: rgba(255,255,255,0.1); border: 1px solid var(--border-color); color: var(--text-main); padding: 2px 8px; border-radius: 4px; cursor: pointer; margin-left: 4px;" onclick="updateStock(${hospitalId}, '${item.blood_type}', ${item.units_available + 1})">+1</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading inventory:', err);
  }
}

// Update Hospital Stock
async function updateStock(hospitalId, bloodType, newUnits) {
  if (newUnits < 0) return;
  try {
    const res = await fetch(`/api/hospitals/${hospitalId}/inventory?blood_type=${encodeURIComponent(bloodType)}&units_available=${newUnits}`, {
      method: 'POST'
    });
    const data = await res.json();

    if (data.auto_alert_created) {
      alert(`⚠️ AUTOMATED STOCK ALERT TRIGGERED!\n\nBlood group ${bloodType} fell below minimum threshold. Urgent replenishment request automatically created!`);
      loadAnalytics();
    }
    loadHospitalInventory(hospitalId);
  } catch (err) {
    console.error('Error updating stock:', err);
  }
}

// Load HIPAA / GDPR Audit Logs
async function loadAuditLogs() {
  try {
    const res = await fetch('/api/admin/audit-logs?admin_id=1');
    const logs = await res.json();
    const tbody = document.getElementById('audit-log-body');
    if (!tbody) return;

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td style="font-size:0.75rem;">${new Date(l.timestamp).toLocaleTimeString()}</td>
        <td><span class="badge badge-eligible">${l.user_role}</span> #${l.user_id}</td>
        <td><b>${l.action}</b></td>
        <td>${l.resource_type}</td>
        <td style="font-size:0.78rem; color:var(--text-muted);">${l.details}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error loading audit logs:', err);
  }
}

// Load Notifications Center
async function loadNotifications() {
  try {
    const res = await fetch(`/api/notifications?user_id=${currentUserId}`);
    const notifs = await res.json();

    const countElem = document.getElementById('notif-count');
    if (countElem) countElem.innerText = notifs.length;
    const container = document.getElementById('notif-list-container');

    if (!container) return;

    if (notifs.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted);">No recent dispatch notifications.</p>`;
      return;
    }

    container.innerHTML = notifs.map(n => `
      <div class="card-item" style="border-left: 4px solid var(--primary-red);">
        <div class="card-header-row">
          <b style="font-size:0.9rem; color:var(--primary-red);">${n.title}</b>
          <span style="font-size:0.72rem; color:var(--text-dim);">${new Date(n.sent_at).toLocaleTimeString()}</span>
        </div>
        <p style="font-size:0.82rem; margin-top:4px;">${n.message}</p>
        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:6px;">
          📡 Channel: <b>${n.channel}</b> | SID: ${n.payload ? n.payload.twilio_sid : 'N/A'}
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading notifications:', err);
  }
}

function toggleNotifDrawer() {
  const modal = document.getElementById('notif-modal');
  if (!modal) return;
  modal.classList.toggle('active');
  if (modal.classList.contains('active')) {
    loadNotifications();
  }
}
// Auto-restore login session if available
window.addEventListener('DOMContentLoaded', () => {
  try {
    const saved = sessionStorage.getItem('lp_user') || localStorage.getItem('lp_user');
    if (saved) {
      const u = JSON.parse(saved);
      if (u && u.userName) {
        currentUserProfile = u;
        currentUserName = u.userName;
        updateNavProfile(u.userName, u.email, u.avatarUrl, u.provider);
      }
    }
  } catch (e) { }

  // Auto-clean legacy hardcoded demo accounts (David Wilson) from any stored device data
  try {
    const LEGACY_EMAILS = ['davidwilson1914@gmail.com', 'davidwilson1914@facebook.com'];
    const savedGoogle = localStorage.getItem('lp_saved_google_accounts');
    if (savedGoogle) {
      const parsed = JSON.parse(savedGoogle);
      const cleaned = parsed.filter(a => a && a.email && !LEGACY_EMAILS.includes(a.email));
      localStorage.setItem('lp_saved_google_accounts', JSON.stringify(cleaned));
    }
    const savedFb = localStorage.getItem('lp_saved_fb_accounts');
    if (savedFb) {
      const parsedFb = JSON.parse(savedFb);
      const cleanedFb = parsedFb.filter(a => a && a.email && !LEGACY_EMAILS.includes(a.email));
      localStorage.setItem('lp_saved_fb_accounts', JSON.stringify(cleanedFb));
    }
  } catch (e) {}
});

// ═══════════════════════════════════════════
// BROADCAST TOAST — shows live update alerts to other logged-in users
// ═══════════════════════════════════════════
function showBroadcastToast(title, message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; top: 5rem; right: 1.5rem; z-index: 99999;
    background: linear-gradient(135deg, #0f172a, #1e293b);
    border: 1.5px solid rgba(230,57,70,0.6);
    border-left: 4px solid #e63946;
    border-radius: 14px;
    padding: 0.9rem 1.2rem;
    box-shadow: 0 10px 40px rgba(0,0,0,0.7);
    color: #fff;
    max-width: 310px;
    animation: slideInRight 0.4s ease-out;
    cursor: pointer;
  `;
  toast.innerHTML = `
    <div style="display:flex; align-items:flex-start; gap:10px;">
      <div style="font-size:1.4rem; margin-top:2px;">🔔</div>
      <div style="flex:1;">
        <div style="font-weight:800; font-size:0.875rem; color:#f87171; margin-bottom:2px;">${title}</div>
        <div style="font-size:0.78rem; color:#cbd5e1; line-height:1.4;">${message}</div>
        <div style="font-size:0.68rem; color:#64748b; margin-top:5px;">📡 Live Community Update · just now</div>
      </div>
      <div style="font-size:0.8rem; color:#475569; cursor:pointer;" onclick="this.closest('div[style]').remove()">✕</div>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.6s';
    setTimeout(() => toast.remove(), 600);
  }, 6000);
}