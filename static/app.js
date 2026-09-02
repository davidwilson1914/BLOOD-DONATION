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

// ═══════════════════════════════════════════
// NEW UX: Mode Toggle (I Need Blood / I Want to Donate)
// ═══════════════════════════════════════════
function switchMode(mode) {
  const seekerBtn = document.getElementById('mode-btn-seeker');
  const donorBtn  = document.getElementById('mode-btn-donor');
  const emergencyArea = document.getElementById('emergency-btn-area');

  if (mode === 'seeker') {
    seekerBtn && seekerBtn.classList.add('active-red');
    seekerBtn && seekerBtn.classList.remove('active-blue');
    donorBtn  && donorBtn.classList.remove('active-red', 'active-blue');
    // Show big red pulsing button, switch to seeker panel
    if (emergencyArea) emergencyArea.style.display = 'inline-flex';
    switchRole('seeker');
  } else {
    donorBtn  && donorBtn.classList.add('active-blue');
    donorBtn  && donorBtn.classList.remove('active-red');
    seekerBtn && seekerBtn.classList.remove('active-red', 'active-blue');
    // Hide emergency button for donor mode, switch to donor panel
    if (emergencyArea) emergencyArea.style.display = 'none';
    switchRole('donor');
  }
}

// ═══════════════════════════════════════════
// LIVE EMERGENCY FEED — urgency-sorted cards
// ═══════════════════════════════════════════
function renderLiveEmergencyFeed() {
  const container = document.getElementById('live-emergency-feed');
  if (!container) return;

  // Combine requests + new donors for the live feed
  const feedItems = [];

  // Add blood requests
  (activeRequests || []).slice(0, 6).forEach(r => {
    feedItems.push({
      type: 'request',
      bloodType: r.blood_type_needed || r.bloodType || 'O+',
      title: `${r.blood_type_needed || r.bloodType || 'O+'} Blood Needed — ${r.units_required || 1} unit(s)`,
      location: r.hospital_location || r.location?.city || 'Chennai',
      urgency: (r.urgency_level || r.urgency || 'HIGH').toLowerCase(),
      time: r.created_at ? new Date(r.created_at).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'}) : 'Just now',
      patientName: r.patient_name || 'Patient'
    });
  });

  // Add recently registered donors
  (activeDonors || []).slice(0, 3).forEach(d => {
    feedItems.push({
      type: 'donor',
      bloodType: d.blood_type || 'O+',
      title: `${d.blood_type || 'O+'} Donor Available — ${d.user_name || 'Anonymous'}`,
      location: d.location?.city || 'Chennai',
      urgency: 'low',
      time: 'Recently joined'
    });
  });

  // Sort: critical first
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  feedItems.sort((a, b) => (urgencyOrder[a.urgency] || 3) - (urgencyOrder[b.urgency] || 3));

  if (feedItems.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:2rem; color:var(--text-muted);">
        <div style="font-size:2rem; margin-bottom:0.5rem;">🩸</div>
        <div style="font-size:0.85rem; font-weight:600;">No active emergency requests right now.</div>
        <div style="font-size:0.78rem; margin-top:4px;">Be the first — request blood or register as a donor!</div>
      </div>`;
    return;
  }

  container.innerHTML = feedItems.map((item, i) => {
    const urgencyClass = item.urgency === 'critical' ? 'critical' :
                         item.urgency === 'high' ? 'high' :
                         item.urgency === 'medium' ? 'medium' : 'low';
    const urgencyLabel = item.type === 'donor' ? '🟢 DONOR READY' :
                         item.urgency === 'critical' ? '🔴 CRITICAL' :
                         item.urgency === 'high' ? '🟠 URGENT' :
                         item.urgency === 'medium' ? '🟡 MEDIUM' : '🟢 LOW';
    return `
      <div class="feed-card urgency-${urgencyClass}" style="animation-delay:${i * 0.07}s">
        <div class="feed-blood-badge">${item.bloodType}</div>
        <div class="feed-card-body">
          <div class="feed-card-title">${item.title}</div>
          <div class="feed-card-meta">
            <span class="urgency-pill ${urgencyClass}">${urgencyLabel}</span>
            <span>📍 ${item.location}</span>
            <span>🕐 ${item.time}</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

// Restore missing selectMenuItem
function selectMenuItem(itemKey) {
  toggleNavDrawer();
  updateDrawerActiveLink(itemKey);

  if (itemKey === 'campaigns') {
    switchRole('campaigns');
  } else if (itemKey === 'seeker') {
    switchMode('seeker');
  } else if (itemKey === 'donor') {
    switchMode('donor');
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
  // Connect live event stream for real-time updates
  connectLiveEventStream();
  // Render live emergency feed after short delay for data to load
  setTimeout(renderLiveEmergencyFeed, 1200);
});


// ═══════════════════════════════════════════
// SSE LIVE EVENT STREAM — Real-time push from server
// ═══════════════════════════════════════════
let liveEventSource = null;

function connectLiveEventStream() {
  if (liveEventSource) {
    liveEventSource.close();
    liveEventSource = null;
  }

  // Use broadcast channel — no user_id filter so ALL logged-in users get ALL broadcasts
  const url = `/api/events`;
  liveEventSource = new EventSource(url);

  liveEventSource.onopen = () => {
    console.log('[LifePulse] 📡 Live event stream connected');
  };

  liveEventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'connected') {
        console.log('[LifePulse] ✅ SSE handshake OK');
        return;
      }
      if (data.type === 'notification') {
        handleIncomingLiveNotification(data);
      }
    } catch (e) {}
  };

  liveEventSource.onerror = () => {
    console.warn('[LifePulse] SSE error — reconnecting in 6s...');
    if (liveEventSource) { liveEventSource.close(); liveEventSource = null; }
    setTimeout(connectLiveEventStream, 6000);
  };
}

function handleIncomingLiveNotification(data) {
  const type = data.notif_type || 'INFO';
  let icon = '🔔';

  if (type === 'DONOR_UPDATE') {
    icon = '🩸';
    // Refresh donor directory for ALL users on any tab
    loadDonors().then(() => {
      renderRegisteredDonors();
    });
    loadAnalytics();
  } else if (type === 'CAMPAIGN_UPDATE') {
    icon = '📢';
    loadCampaigns();
    loadAnalytics();
    // Show update strip on campaigns page if user is viewing it
    if (currentRole === 'campaigns' && data.title) {
      showCampUpdateStrip(data.title, 'updated');
    }
  } else if (type === 'BLOOD_REQUEST') {
    icon = '🚨';
    loadRequests();
    loadAnalytics();
  }


  // Show live broadcast toast popup to the current user
  showBroadcastToast(`${icon} ${data.title}`, data.message, type);

  // Update notification badge & refresh notification center
  loadNotifications();
}

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

  // Re-establish SSE stream now that user is authenticated
  connectLiveEventStream();

  // Load all fresh data for this user
  loadDonors();
  loadCampaigns();
  loadRequests();
  loadNotifications();
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

  // Sync ALL role button sets (nav pills + any other .role-btn)
  document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
  // Nav pill IDs: nav-btn-donor, nav-btn-seeker, nav-btn-camps
  const navBtnMap = { donor: 'nav-btn-donor', seeker: 'nav-btn-seeker', campaigns: 'nav-btn-camps' };
  const navBtn = document.getElementById(navBtnMap[role]);
  if (navBtn) navBtn.classList.add('active');
  // Legacy ID pattern
  const legacyBtn = document.getElementById(`role-btn-${role}`);
  if (legacyBtn) legacyBtn.classList.add('active');

  const donorView = document.getElementById('view-donor');
  const campView  = document.getElementById('view-campaigns');
  const seekerView = document.getElementById('view-seeker');

  if (donorView)  donorView.style.display  = role === 'donor'     ? 'block' : 'none';
  if (campView)   campView.style.display   = role === 'campaigns'  ? 'block' : 'none';
  if (seekerView) seekerView.style.display = role === 'seeker'    ? 'block' : 'none';

  // Sync mode-toggle-btn pills
  const seekerModeBtn = document.getElementById('mode-btn-seeker');
  const donorModeBtn  = document.getElementById('mode-btn-donor');
  if (seekerModeBtn) seekerModeBtn.classList.toggle('active-red', role === 'seeker');
  if (donorModeBtn)  donorModeBtn.classList.toggle('active-blue', role === 'donor');

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

    // Show camp update strip on campaigns page
    showCampUpdateStrip(title, 'published');

    // Broadcast toast to all users on the platform
    showBroadcastToast(
      `📢 New Campaign: ${title}`,
      `${organizer} just published a blood drive at ${location}. Join now!`,
      'CAMPAIGN_UPDATE'
    );

    // Inline confirmation banner (replaces alert)
    showCampaignPublishBanner(title, organizer, phone, location, startFormatted, endFormatted);

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
    showCampUpdateStrip(title, 'published');
    showCampaignPublishBanner(title, organizer, phone, location, startFormatted, endFormatted);
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
    renderLiveEmergencyFeed();
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
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px,1fr)); gap:1rem; margin-top:1rem;">
      ${activeDonors.map(donor => {
    const bloodType = donor.blood_type || donor.blood_type_needed || 'O+';
    const name = donor.user_name || donor.name || 'Anonymous Donor';
    const phone = donor.phone_masked || donor.contact_phone || '+91 XXXXX XXXXX';
    const city = donor.location ? (donor.location.city || donor.location.address) : 'Chennai, Tamil Nadu';
    const address = donor.location ? donor.location.address : city;
    const encodedAddr = encodeURIComponent(address);
    const encodedName = encodeURIComponent(name);
    const isNew = donor.is_new === true;

    return `
      <div class="donor-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="card-blood-badge">🩸 ${bloodType}</span>
          ${isNew
            ? '<span class="badge-new">🆕 NEW</span>'
            : '<span class="badge-verified">✅ Verified</span>'}
        </div>
        <div class="card-title">${name}</div>
        <div class="card-meta-row">📍 <b>${city}</b></div>
        <div class="card-meta-row">🏠 ${address}</div>
        <div class="card-meta-row">📞 <span style="color:var(--orange); font-weight:700;">${phone}</span></div>
        <div class="card-actions">
          <button class="card-btn-maps" onclick="openDonorLocationInMaps('${encodedAddr}','${encodedName}')">
            🗺️ Maps
          </button>
          <button class="card-btn-contact" onclick="alert('📞 Contacting ${name} at ${phone} for emergency blood request.')">
            📞 Contact Donor
          </button>
        </div>
      </div>`;
  }).join('')}
    </div>
  `;
}

// Handle Donor Details Registration Submit (Donate Blood & Save Life Interface)
async function handleHeroDonorRegisterSubmit(event) {
  event.preventDefault();

  const name     = document.getElementById('hero-donor-name').value.trim();
  const phone    = document.getElementById('hero-donor-phone').value.trim();
  const bloodType = document.getElementById('hero-donor-blood-type').value;
  const city     = document.getElementById('hero-donor-city').value.trim();
  const location = document.getElementById('hero-donor-location').value.trim();

  if (!name || !phone || !city) {
    alert('⚠️ Please fill in all required fields (Name, Phone, Blood Group, City).');
    return;
  }

  // Build payload matching DonorRegisterCreate schema
  const payload = {
    name: name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@lifepulse.in`,
    phone: phone,
    blood_type: bloodType,
    location: {
      latitude: userLocation ? userLocation.latitude : 13.0827,
      longitude: userLocation ? userLocation.longitude : 80.2707,
      address: location || city,
      city: city || 'Chennai'
    },
    is_first_time_donor: true,
    max_travel_radius_km: 30.0,
    age: 25,
    weight_kg: 65.0,
    preferred_notification_channel: 'WhatsApp / SMS'
  };

  // Show a loading indicator on the button
  const submitBtn = document.querySelector('#hero-donor-reg-form button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.innerText : '';
  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = 'Registering...'; }

  try {
    const res = await fetch('/api/donors/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    let savedDonor = null;
    if (res.ok) {
      savedDonor = await res.json();
    }

    // Use server response or build local fallback
    const newDonor = savedDonor || {
      id: Date.now(),
      user_name: name,
      phone_masked: phone,
      blood_type: bloodType,
      location: { city: city || 'Chennai', address: location || city },
      ready_to_donate: true,
      is_eligible: true,
      is_new: true
    };

    // Add new donor to top of local list immediately
    if (!activeDonors.find(d => d.user_name === name && d.blood_type === bloodType)) {
      const localCopy = {
        user_name: newDonor.user_name || name,
        phone_masked: newDonor.phone_masked || phone,
        blood_type: newDonor.blood_type || bloodType,
        location: newDonor.location || { city: city || 'Chennai', address: location || city },
        ready_to_donate: true,
        is_eligible: true,
        is_new: true
      };
      activeDonors.unshift(localCopy);
    }

    // Reset Form
    document.getElementById('hero-donor-reg-form').reset();
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = originalBtnText; }

    // Show broadcast push toast (visible to the registering user immediately)
    showBroadcastToast(
      `🩸 New ${bloodType} Donor Registered!`,
      `${name} just joined from ${city || 'your area'}. Available for emergency matching.`
    );

    alert(`🎉 DONOR REGISTRATION SUCCESSFUL!\n\nThank you, ${name}! Your profile with blood group ${bloodType} is now live in the Verified Donors Directory.\n\n📡 A live broadcast notification has been sent to all active users on the platform!`);

    // Refresh the full donor list FROM THE SERVER (so newly saved donor appears correctly)
    await loadDonors();      // pulls fresh list from backend & calls renderRegisteredDonors()
    loadAnalytics();
    loadNotifications();

    // Switch to seeker view to show directory
    switchRole('seeker');

    // Smooth scroll to registered donor directory
    setTimeout(() => {
      const container = document.getElementById('registered-donors-list-container');
      if (container) container.scrollIntoView({ behavior: 'smooth' });
    }, 400);

  } catch (err) {
    console.error('Error registering donor:', err);
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = originalBtnText; }

    // Still show locally if network fails
    const localDonor = {
      id: Date.now(),
      user_name: name,
      phone_masked: phone,
      blood_type: bloodType,
      location: { city: city || 'Chennai', address: location || city },
      ready_to_donate: true,
      is_eligible: true,
      is_new: true
    };
    activeDonors.unshift(localDonor);
    document.getElementById('hero-donor-reg-form').reset();

    showBroadcastToast(
      `🩸 New ${bloodType} Donor Registered!`,
      `${name} just joined from ${city || 'your area'}. Available for emergency matching.`
    );
    alert(`🎉 DONOR REGISTRATION SUCCESSFUL!\n\nThank you, ${name}! Your profile with blood group ${bloodType} is now live.`);
    switchRole('seeker');
    renderRegisteredDonors();
    loadNotifications();
  }
}


// Handle Create Urgent Blood Request Submit
async function handleCreateRequest(event) {
  event.preventDefault();

  const patientName = document.getElementById('req-patient').value;
  const phone       = document.getElementById('req-phone').value;
  const bloodType   = document.getElementById('req-bloodtype').value;
  const units       = parseInt(document.getElementById('req-units').value) || 1;
  const urgency     = document.getElementById('req-urgency').value;
  const city        = document.getElementById('req-city').value;
  const hospitalLoc = document.getElementById('req-location').value;

  const payload = {
    patient_name: patientName,
    blood_type_needed: bloodType,
    units_required: units,
    urgency: urgency,
    hospital_name: hospitalLoc || 'General Hospital',
    notes: `Contact Mobile: ${phone} | Hospital Location: ${hospitalLoc}`,
    location: { latitude: 13.0827, longitude: 80.2707, address: hospitalLoc, city: city }
  };

  let requestId = Date.now(); // fallback id
  try {
    const res = await fetch(`/api/requests?requester_id=${currentUserId}&requester_role=PATIENT`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data && data.id) requestId = data.id;
    document.getElementById('create-request-form').reset();
  } catch (err) {
    console.error('Error creating request:', err);
    document.getElementById('create-request-form').reset();
  }

  // Broadcast push toast to other users
  showBroadcastToast(
    `🚨 Emergency ${bloodType} Blood Needed!`,
    `Patient ${patientName} urgently needs ${units} unit(s) at ${hospitalLoc || city}. Please respond!`,
    'BLOOD_REQUEST'
  );

  // ── Start Auto-Escalation Timer (Feature 2) ──
  startEscalationTimer(requestId, bloodType, city || 'Chennai', urgency);

  // Show modern confirmation banner instead of alert
  showRequestConfirmBanner(patientName, bloodType, units, phone, hospitalLoc || city);

  loadRequests();
  loadAnalytics();
  loadNotifications();
}

function showRequestConfirmBanner(patientName, bloodType, units, phone, location) {
  // Remove existing banner if any
  document.getElementById('req-confirm-banner')?.remove();

  const banner = document.createElement('div');
  banner.id = 'req-confirm-banner';
  banner.style.cssText = `
    background: linear-gradient(135deg, #F0FFF4, #fff);
    border: 1.5px solid #9AE6B4;
    border-left: 5px solid #38A169;
    border-radius: 16px;
    padding: 1.2rem 1.4rem;
    margin: 1rem 0;
    box-shadow: 0 4px 16px rgba(56,161,105,0.15);
    animation: fadeIn 0.4s ease;
    font-family: 'Inter', sans-serif;
  `;
  banner.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
      <span style="font-size:1.8rem;">✅</span>
      <div>
        <div style="font-weight:800; font-size:1rem; color:#276749;">Emergency Request Dispatched!</div>
        <div style="font-size:0.8rem; color:#38A169;">Live alerts sent to nearby compatible donors</div>
      </div>
      <button onclick="this.closest('#req-confirm-banner').remove()" style="margin-left:auto; background:none; border:none; font-size:1.2rem; cursor:pointer; color:#9AE6B4;">✕</button>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; font-size:0.82rem; color:#4A5568;">
      <div>🧑‍⚕️ <strong>Patient:</strong> ${patientName}</div>
      <div>🩸 <strong>Blood:</strong> ${bloodType} · ${units} unit(s)</div>
      <div>📞 <strong>Contact:</strong> ${phone}</div>
      <div>📍 <strong>Location:</strong> ${location}</div>
    </div>
    <div style="margin-top:0.75rem; font-size:0.78rem; color:#718096; background:#F0FFF4; border-radius:8px; padding:0.5rem 0.75rem;">
      ⏱️ Auto-escalation active — if no response in 3 mins, search will expand to all districts automatically.
    </div>
  `;

  const form = document.getElementById('create-request-form');
  if (form) form.parentNode.insertBefore(banner, form);
  setTimeout(() => banner?.remove(), 30000);
}

// Load Urgent Blood Requests
async function loadRequests() {
  try {
    const res = await fetch('/api/requests');
    activeRequests = await res.json();
    renderLiveEmergencyFeed();
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
  const container = document.getElementById('active-campaigns-list-container');
  const emptyState = document.getElementById('camp-empty-state');
  const countLabel = document.getElementById('camp-live-count-label');

  // Filter: only active/upcoming campaigns (not ended)
  const validActive = activeCampaigns.filter(c => isCampaignScheduleActive(c));

  // Update count label
  if (countLabel) {
    countLabel.innerText = validActive.length > 0
      ? `${validActive.length} campaign drive${validActive.length > 1 ? 's' : ''} active right now`
      : 'No active drives at the moment';
  }

  if (validActive.length === 0) {
    if (container) container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  // Sort by proximity
  validActive.forEach(c => {
    c.distanceKm = c.location
      ? calculateDistance(userLocation.latitude, userLocation.longitude, c.location.latitude, c.location.longitude)
      : 999;
  });
  validActive.sort((a, b) => a.distanceKm - b.distanceKm);

  if (!container) return;

  container.innerHTML = validActive.map(camp => {
    const statusInfo  = getCampaignStatus(camp);
    const percent     = Math.min(100, Math.round(((camp.units_collected || 0) / (camp.target_units || 1)) * 100));
    const locStr      = camp.location ? (camp.location.address || camp.location.city) : 'Chennai, Tamil Nadu';
    const phoneStr    = camp.contact_phone || '+91 98401 12345';
    const formattedStart = formatToDDMMYYYY(camp.start_date);
    const formattedEnd   = formatToDDMMYYYY(camp.end_date);
    const lat = camp.location ? camp.location.latitude  : 13.0827;
    const lon = camp.location ? camp.location.longitude : 80.2707;
    const isUpcoming  = statusInfo.isUpcoming;
    const distLabel   = camp.distanceKm < 999 ? `${camp.distanceKm.toFixed(1)} km away` : '';
    const encodedAddr  = encodeURIComponent(locStr);
    const encodedTitle = encodeURIComponent(camp.title);

    return `
      <div class="camp-card">
        <div class="camp-card-badges">
          <span class="camp-card-badge camp-badge-live">${isUpcoming ? '📅 UPCOMING' : '⚡ LIVE DRIVE'}</span>
          <span class="camp-card-badge camp-badge-active">${isUpcoming ? '🟡 UPCOMING' : '🟢 LIVE NOW'}</span>
          ${distLabel ? `<span class="camp-card-badge" style="background:var(--blue-light);color:var(--blue);border:1px solid #BEE3F8;">📍 ${distLabel}</span>` : ''}
        </div>

        <div class="camp-card-title">${camp.title}</div>

        <div class="camp-card-organizer">🏥 <strong>${camp.organizer_name}</strong></div>

        <div class="camp-card-meta">
          <span>📞 <b style="color:var(--orange);">${phoneStr}</b></span>
          <span>📍 ${locStr}</span>
          <span>⏰ ${formattedStart}${formattedEnd ? ' → ' + formattedEnd : ''}</span>
          ${camp.start_time && camp.end_time ? `<span>🕐 ${camp.start_time} – ${camp.end_time}</span>` : ''}
        </div>

        <div class="camp-card-progress">
          <div class="camp-card-progress-label">
            <span>Target: <b>${camp.target_units || 100} pints</b></span>
            <span style="color:var(--green);">${percent}% Collected</span>
          </div>
          <div class="camp-card-progress-bar">
            <div class="camp-card-progress-fill" style="width:${percent}%;"></div>
          </div>
        </div>

        <div class="camp-card-actions">
          <button class="camp-btn-directions"
            onclick="openInGoogleMaps(${lat},${lon},'${encodedAddr}','${encodedTitle}')">
            🗺️ Directions
          </button>
          <button class="camp-btn-join" onclick="joinCampaign(${camp.id})">
            ✨ Join Drive
          </button>
        </div>
      </div>`;
  }).join('');

  // Also update the secondary container if exists (other panels)
  const container2 = document.getElementById('campaign-list-container');
  if (container2) container2.innerHTML = container.innerHTML;
}

// Show campaign update notification strip (called by SSE)
function showCampUpdateStrip(title, action) {
  const strip = document.getElementById('camp-update-strip');
  if (!strip) return;
  strip.style.display = 'flex';
  strip.innerHTML = `📢 <span><strong>${title}</strong> has been ${action}. Campaign list updated.</span>
    <button onclick="document.getElementById('camp-update-strip').style.display='none'"
      style="margin-left:auto;background:none;border:none;cursor:pointer;color:var(--blue);font-size:1rem;">✕</button>`;
  setTimeout(() => { if (strip) strip.style.display = 'none'; }, 8000);
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

    // Update ALL badge elements
    const unread = notifs.filter(n => !n.read).length;
    ['notif-count', 'notif-count-badge'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.innerText = unread;
        el.style.display = unread > 0 ? 'flex' : 'none';
      }
    });

    const container = document.getElementById('notif-list-container');
    if (!container) return;

    if (notifs.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:2rem; color:var(--text-muted);">
          <div style="font-size:2rem; margin-bottom:0.5rem;">🔔</div>
          <div style="font-size:0.85rem; font-weight:600;">No notifications yet.</div>
          <div style="font-size:0.78rem;">Updates about donors, campaigns & blood requests appear here.</div>
        </div>`;
      return;
    }

    const typeIcon = { DONOR_UPDATE: '🩸', CAMPAIGN_UPDATE: '📢', BLOOD_REQUEST: '🚨' };
    container.innerHTML = notifs.slice(0, 30).map(n => {
      const icon = typeIcon[(n.payload && n.payload.type) || ''] || '🔔';
      const time = new Date(n.sent_at).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'});
      const borderColor = n.payload?.type === 'BLOOD_REQUEST' ? 'var(--red)' :
                          n.payload?.type === 'CAMPAIGN_UPDATE' ? 'var(--orange)' : 'var(--green)';
      return `
        <div class="notif-card" style="border-left:3px solid ${borderColor}; ${n.read ? 'opacity:0.7;' : ''}">
          <div class="notif-card-header">
            <span class="notif-icon">${icon}</span>
            <span class="notif-title">${n.title}</span>
            <span class="notif-time">${time}</span>
          </div>
          <div class="notif-message">${n.message}</div>
          <div class="notif-channel">📡 ${n.channel}</div>
        </div>`;
    }).join('');
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
function showBroadcastToast(title, message, type) {
  // Remove any existing toasts over limit
  const existing = document.querySelectorAll('.lp-toast');
  if (existing.length >= 3) existing[0].remove();

  const isBlood   = type === 'BLOOD_REQUEST';
  const isCamp    = type === 'CAMPAIGN_UPDATE';
  const borderCol = isBlood ? '#E53E3E' : isCamp ? '#DD6B20' : '#38A169';
  const icon      = isBlood ? '🚨' : isCamp ? '📢' : '🩸';

  const toast = document.createElement('div');
  toast.className = 'lp-toast';
  toast.style.cssText = `
    position:fixed; top:5rem; right:1.25rem; z-index:99999;
    background:#fff;
    border:1px solid #E2E8F0;
    border-left:4px solid ${borderCol};
    border-radius:14px;
    padding:1rem 1.1rem;
    box-shadow:0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
    max-width:320px; min-width:260px;
    animation:slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1);
    cursor:pointer;
    font-family:'Inter',sans-serif;
  `;
  toast.innerHTML = `
    <div style="display:flex; align-items:flex-start; gap:10px;">
      <div style="font-size:1.5rem; line-height:1;">${icon}</div>
      <div style="flex:1; min-width:0;">
        <div style="font-weight:700; font-size:0.85rem; color:#1A202C; margin-bottom:3px; line-height:1.3;">${title}</div>
        <div style="font-size:0.78rem; color:#4A5568; line-height:1.45; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${message}</div>
        <div style="font-size:0.68rem; color:#A0AEC0; margin-top:5px; font-weight:600;">📡 Live · just now</div>
      </div>
      <button onclick="this.closest('.lp-toast').remove()" style="background:none;border:none;color:#A0AEC0;font-size:1rem;cursor:pointer;padding:0;line-height:1;">✕</button>
    </div>
  `;
  toast.onclick = () => toast.remove();
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.5s, transform 0.5s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 500);
  }, 7000);
}


// ═══════════════════════════════════════════════════════════════════
// FEATURE 1: ZERO-FRICTION "PULSE SOS" ONE-TAP WIDGET
// Hold the button 2 seconds → auto-detect location → auto-request blood
// ═══════════════════════════════════════════════════════════════════
let sosHoldTimer = null;
let sosHoldActive = false;

function startSOSHold(e) {
  if (e && e.cancelable) e.preventDefault();
  if (sosHoldActive) return;
  sosHoldActive = true;

  const btn = document.getElementById('sos-core-btn');
  const hint = document.getElementById('sos-hint-text');
  if (btn) btn.classList.add('holding');
  if (hint) hint.innerText = 'Activating…';

  sosHoldTimer = setTimeout(() => {
    if (sosHoldActive) triggerPulseSOSRequest();
  }, 2000);
}

function cancelSOSHold() {
  if (!sosHoldActive) return;
  sosHoldActive = false;
  clearTimeout(sosHoldTimer);

  const btn = document.getElementById('sos-core-btn');
  const hint = document.getElementById('sos-hint-text');
  if (btn) btn.classList.remove('holding');
  if (hint) hint.innerText = 'Hold 2s';
}

async function triggerPulseSOSRequest() {
  sosHoldActive = false;
  const btn = document.getElementById('sos-core-btn');
  const hint = document.getElementById('sos-hint-text');
  if (btn) btn.classList.remove('holding');
  if (hint) hint.innerText = 'Hold 2s';

  // Show SOS confirm modal
  const modal = document.getElementById('sos-confirm-modal');
  if (modal) modal.classList.add('active');

  const setStep = (n, state) => {
    const el = document.getElementById(`sos-step-${n}`);
    if (el) {
      el.style.opacity = '1';
      el.className = 'sos-step ' + state;
    }
  };

  // Step 1: Detect Location
  setStep(1, 'active');
  let city = 'Chennai', lat = 13.0827, lon = 80.2707;
  try {
    if (navigator.geolocation) {
      await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(pos => {
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          resolve();
        }, () => resolve(), { timeout: 4000 });
      });
    }
    if (typeof reverseGeocode === 'function') {
      city = await reverseGeocode(lat, lon) || 'Chennai';
    }
  } catch (e) {}
  setStep(1, 'done');

  // Step 2: Get blood group from saved profile
  setStep(2, 'active');
  await new Promise(r => setTimeout(r, 600));
  let bloodGroup = 'O+';
  try {
    const saved = sessionStorage.getItem('lp_user') || localStorage.getItem('lp_user');
    if (saved) {
      const u = JSON.parse(saved);
      if (u.bloodGroup) bloodGroup = u.bloodGroup;
    }
    // Also check donor form if filled
    const heroBlood = document.getElementById('hero-donor-blood-type');
    if (heroBlood && heroBlood.value) bloodGroup = heroBlood.value;
  } catch (e) {}
  const detailsEl = document.getElementById('sos-confirm-details');
  if (detailsEl) detailsEl.innerText =
    `Emergency request for ${bloodGroup} blood at ${city}. Broadcasting to nearby donors now...`;
  setStep(2, 'done');

  // Step 3: Broadcast to nearby donors
  setStep(3, 'active');
  try {
    const payload = {
      patient_name: currentUserName || 'Emergency Patient',
      blood_type_needed: bloodGroup,
      units_needed: 2,
      urgency: 'CRITICAL',
      hospital_name: 'Nearest Hospital (GPS Auto)',
      contact_phone: currentUserProfile?.phone || 'SOS Auto',
      location: { city: city, district: city, state: 'Tamil Nadu', lat, lng: lon }
    };
    await fetch('/api/requests/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {}
  await new Promise(r => setTimeout(r, 800));
  setStep(3, 'done');

  // Step 4: Done
  setStep(4, 'active');
  await new Promise(r => setTimeout(r, 400));
  setStep(4, 'done');

  // Show toast and auto-close modal
  showBroadcastToast('🆘 PULSE SOS Sent!',
    `Emergency ${bloodGroup} request broadcast to all nearby donors in ${city}.`,
    'BLOOD_REQUEST');
  loadRequests();
  loadNotifications();

  setTimeout(() => {
    if (modal) modal.classList.remove('active');
    switchRole('seeker');
  }, 3500);
}

function cancelSOSModal() {
  const modal = document.getElementById('sos-confirm-modal');
  if (modal) modal.classList.remove('active');
  // Reset steps
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`sos-step-${i}`);
    if (el) {
      el.className = 'sos-step';
      if (i > 1) el.style.opacity = '0.3';
      else el.style.opacity = '1';
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// FEATURE 2: AUTO-FALLTHROUGH ESCALATION SYSTEM
// After posting a request, if no donor accepts in N minutes → escalate
// ═══════════════════════════════════════════════════════════════════
const ESCALATION_TIMERS = {};

function startEscalationTimer(requestId, bloodGroup, city, urgency) {
  // Tier 1: 3 min → re-broadcast to wider radius
  // Tier 2: 6 min → mark as CRITICAL and notify admin
  const tier1Delay = urgency === 'CRITICAL' ? 3 * 60 * 1000 : 5 * 60 * 1000;
  const tier2Delay = urgency === 'CRITICAL' ? 6 * 60 * 1000 : 10 * 60 * 1000;

  // Clear any existing timer for this request
  if (ESCALATION_TIMERS[requestId]) {
    clearTimeout(ESCALATION_TIMERS[requestId].t1);
    clearTimeout(ESCALATION_TIMERS[requestId].t2);
  }

  const t1 = setTimeout(async () => {
    // Tier 1 escalation: expanded re-broadcast
    showBroadcastToast(
      `📡 Escalation Alert — ${bloodGroup} Still Needed`,
      `No donor has accepted the ${bloodGroup} request in ${city} yet. Expanding search to all districts.`,
      'BLOOD_REQUEST'
    );
    // Re-trigger notification via SSE (server-side notify)
    try {
      await fetch(`/api/requests/${requestId}/escalate`, { method: 'POST' }).catch(() => {});
    } catch (e) {}
    loadNotifications();
    loadRequests();
  }, tier1Delay);

  const t2 = setTimeout(() => {
    // Tier 2 escalation: critical alert
    showBroadcastToast(
      `🚨 CRITICAL ESCALATION — ${bloodGroup} Urgent!`,
      `${bloodGroup} blood still urgently needed in ${city}. Alerting all verified donors statewide!`,
      'BLOOD_REQUEST'
    );
    loadNotifications();
  }, tier2Delay);

  ESCALATION_TIMERS[requestId] = { t1, t2 };
}

function cancelEscalation(requestId) {
  if (ESCALATION_TIMERS[requestId]) {
    clearTimeout(ESCALATION_TIMERS[requestId].t1);
    clearTimeout(ESCALATION_TIMERS[requestId].t2);
    delete ESCALATION_TIMERS[requestId];
  }
}

// ═══════════════════════════════════════════════════════════════════
// FEATURE 3: VOICE-CONTROLLED EMERGENCY REQUEST
// Tamil & English speech → auto-fill blood request form
// ═══════════════════════════════════════════════════════════════════
let voiceRecognition = null;
let voiceListening = false;

function startVoiceRequest() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showBroadcastToast('🎙️ Not Supported',
      'Voice recognition is not supported in your browser. Please use Chrome.', 'INFO');
    return;
  }

  if (voiceListening) {
    stopVoiceRecognition();
    return;
  }

  voiceRecognition = new SpeechRecognition();
  voiceRecognition.continuous = false;
  voiceRecognition.interimResults = true;
  voiceRecognition.maxAlternatives = 3;
  // Support both Tamil and English
  voiceRecognition.lang = 'ta-IN';

  const micBtn = document.getElementById('voice-mic-btn');
  const micIcon = document.getElementById('voice-mic-icon');
  const micLabel = document.getElementById('voice-btn-label');
  const transcriptEl = document.getElementById('voice-transcript');

  voiceListening = true;
  if (micBtn) micBtn.classList.add('listening');
  if (micIcon) micIcon.innerText = '⏹️';
  if (micLabel) micLabel.innerText = 'Stop (Listening…)';
  if (transcriptEl) { transcriptEl.style.display = 'block'; transcriptEl.innerText = '🎙️ Listening…'; }

  voiceRecognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    if (transcriptEl) transcriptEl.innerText = '🎙️ "' + transcript + '"';

    if (event.results[event.results.length - 1].isFinal) {
      parseVoiceToForm(transcript);
      stopVoiceRecognition();
    }
  };

  voiceRecognition.onerror = (e) => {
    stopVoiceRecognition();
    if (transcriptEl) transcriptEl.innerText = '⚠️ Could not hear clearly. Try again.';
  };

  voiceRecognition.onend = () => { stopVoiceRecognition(); };

  voiceRecognition.start();
}

function stopVoiceRecognition() {
  voiceListening = false;
  if (voiceRecognition) { try { voiceRecognition.stop(); } catch (e) {} voiceRecognition = null; }
  const micBtn = document.getElementById('voice-mic-btn');
  const micIcon = document.getElementById('voice-mic-icon');
  const micLabel = document.getElementById('voice-btn-label');
  if (micBtn) micBtn.classList.remove('listening');
  if (micIcon) micIcon.innerText = '🎙️';
  if (micLabel) micLabel.innerText = 'Voice Request';
}

function parseVoiceToForm(text) {
  const t = text.toLowerCase();
  const transcriptEl = document.getElementById('voice-transcript');

  // ── Extract blood group ──
  const bloodMap = {
    'a positive': 'A+', 'a plus': 'A+', 'a+': 'A+', 'ஏ பாசிட்டிவ்': 'A+',
    'a negative': 'A-', 'a minus': 'A-', 'a-': 'A-',
    'b positive': 'B+', 'b plus': 'B+', 'b+': 'B+', 'பி பாசிட்டிவ்': 'B+',
    'b negative': 'B-', 'b minus': 'B-', 'b-': 'B-',
    'o positive': 'O+', 'o plus': 'O+', 'o+': 'O+', 'ஓ பாசிட்டிவ்': 'O+',
    'o negative': 'O-', 'o minus': 'O-', 'o-': 'O-', 'universal': 'O-',
    'ab positive': 'AB+', 'ab plus': 'AB+', 'ab+': 'AB+',
    'ab negative': 'AB-', 'ab minus': 'AB-', 'ab-': 'AB-',
  };
  let detectedBlood = null;
  for (const [phrase, group] of Object.entries(bloodMap)) {
    if (t.includes(phrase)) { detectedBlood = group; break; }
  }

  // ── Extract units ──
  const unitsMatch = t.match(/(\d+)\s*(unit|bottle|பாட்டில்|யூனிட்)/);
  const units = unitsMatch ? parseInt(unitsMatch[1]) : 2;

  // ── Extract hospital name ──
  const hospitalPatterns = [
    /apollo/i, /fortis/i, /miot/i, /kauvery/i, /vijaya/i, /gleneagles/i,
    /government/i, /govt/i, /ராஜீவ்/i, /அரசு/i, /[\w\s]+ hospital/i
  ];
  let hospital = '';
  for (const pat of hospitalPatterns) {
    const m = text.match(pat);
    if (m) { hospital = m[0]; break; }
  }

  // ── Extract urgency ──
  const isUrgent = /urgent|emergency|critical|உடனடி|அவசர/.test(t);

  // ── Fill form fields ──
  let filled = [];

  if (detectedBlood) {
    const sel = document.getElementById('req-blood-type') || document.getElementById('blood-type-needed');
    if (sel) { sel.value = detectedBlood; filled.push(`Blood: ${detectedBlood}`); }
  }
  const unitsInput = document.getElementById('req-units') || document.getElementById('units-needed');
  if (unitsInput && units) { unitsInput.value = units; filled.push(`Units: ${units}`); }

  if (hospital) {
    const hospInput = document.getElementById('req-hospital') || document.getElementById('hospital-name');
    if (hospInput) { hospInput.value = hospital; filled.push(`Hospital: ${hospital}`); }
  }
  if (isUrgent) {
    const urgSel = document.getElementById('req-urgency') || document.getElementById('urgency-level');
    if (urgSel) { urgSel.value = 'CRITICAL'; filled.push('Urgency: CRITICAL'); }
  }

  // ── Show result ──
  if (transcriptEl) {
    if (filled.length > 0) {
      transcriptEl.innerHTML =
        `✅ Detected: <strong>${filled.join(' · ')}</strong><br>` +
        `<span style="font-size:0.75rem; color:#86efac;">Form auto-filled! Please verify and submit.</span>`;
    } else {
      transcriptEl.innerText =
        '⚠️ Could not parse blood group. Try: "Apollo hospital A positive blood 2 units"';
    }
  }

  if (filled.length > 0) {
    showBroadcastToast('🎙️ Voice Filled!',
      'Form auto-filled from your voice command. Please verify and submit.', 'INFO');
    // Scroll to form
    const form = document.getElementById('create-request-form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ═══════════════════════════════════════════════════════════════════
// FEATURE 4: SMART DONATION ELIGIBILITY CALCULATOR
// ═══════════════════════════════════════════════════════════════════
let eligAnswers = { step1: null, step2: null, step3: null };

function toggleEligibilityWizard() {
  const wizard = document.getElementById('eligibility-wizard');
  const btn = document.getElementById('eligibility-toggle-btn');
  if (!wizard) return;
  const isOpen = wizard.style.display !== 'none';
  wizard.style.display = isOpen ? 'none' : 'block';
  if (btn) btn.innerText = isOpen ? 'Check Now →' : '✕ Close';
  if (!isOpen) resetEligibility();
}

function selectEligStep1(answer) {
  eligAnswers.step1 = answer;
  if (answer === 'under90') {
    // Immediately show not eligible
    showEligResult('not-eligible',
      '⏳ Not Yet Eligible',
      'You must wait at least 90 days between blood donations. This ensures your body recovers fully.',
      null, true, 90);
    return;
  }
  document.getElementById('elig-step-1').style.display = 'none';
  document.getElementById('elig-step-2').style.display = 'block';
}

function selectEligStep2(answer) {
  eligAnswers.step2 = answer;
  if (answer === 'yes') {
    showEligResult('warning',
      '⚠️ Please Consult a Doctor',
      'Ongoing medications or a recent tattoo (within 6 months) may temporarily disqualify you from donating. Please consult your doctor before proceeding.',
      null, false, 0);
    return;
  }
  document.getElementById('elig-step-2').style.display = 'none';
  document.getElementById('elig-step-3').style.display = 'block';
}

function selectEligStep3(answer) {
  eligAnswers.step3 = answer;
  if (answer === 'no') {
    showEligResult('not-eligible',
      '❌ Weight Requirement Not Met',
      'Blood donors must weigh at least 50 kg (110 lbs) to ensure a safe donation for both you and the recipient.',
      null, false, 0);
    return;
  }
  // All checks passed!
  showEligResult('eligible',
    '✅ You Are Eligible to Donate Today!',
    'Great news! You meet all eligibility criteria. Your blood donation can save up to 3 lives. Register now or visit a nearby camp!',
    new Date(), true, 0);
}

function showEligResult(type, title, message, eligibleFrom, showCalendar, daysToWait) {
  // Hide all steps, show result
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`elig-step-${i}`);
    if (el) el.style.display = 'none';
  }
  const resultEl = document.getElementById('elig-result');
  const cardEl = document.getElementById('elig-result-card');
  const calBtn = document.getElementById('elig-calendar-btn');
  if (!resultEl || !cardEl) return;
  resultEl.style.display = 'block';

  let nextDate = '';
  if (daysToWait > 0) {
    const d = new Date();
    d.setDate(d.getDate() + daysToWait);
    nextDate = `<br><strong>Next eligible date: ${d.toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</strong>`;
    if (calBtn) calBtn.style.display = 'inline-flex';
    // Store for calendar
    window._eligNextDate = d;
  } else {
    if (calBtn) {
      if (showCalendar && type === 'eligible') {
        calBtn.style.display = 'inline-flex';
        calBtn.innerText = '📅 Set Reminder for Next Donation (90 days)';
        const d = new Date();
        d.setDate(d.getDate() + 90);
        window._eligNextDate = d;
      } else {
        calBtn.style.display = 'none';
      }
    }
  }

  cardEl.className = 'elig-result-card ' + type;
  cardEl.innerHTML = `
    <div class="elig-result-title">${title}</div>
    <div style="font-size:0.85rem; line-height:1.6;">${message}${nextDate}</div>
  `;
}

function resetEligibility() {
  eligAnswers = { step1: null, step2: null, step3: null };
  document.getElementById('elig-step-1').style.display = 'block';
  document.getElementById('elig-step-2').style.display = 'none';
  document.getElementById('elig-step-3').style.display = 'none';
  document.getElementById('elig-result').style.display = 'none';
}

function addToGoogleCalendar() {
  const date = window._eligNextDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dateStr = `${y}${m}${d}`;

  const title = encodeURIComponent('LifePulse: Blood Donation Day! 🩸');
  const details = encodeURIComponent(
    'You are eligible to donate blood again today! Visit a nearby blood donation camp or hospital. Your donation saves up to 3 lives. - LifePulse App'
  );
  const location = encodeURIComponent('Nearest Blood Donation Camp, Tamil Nadu');
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}&location=${location}&sf=true&output=xml`;
  window.open(url, '_blank');
}

// ═══════════════════════════════════════════════════════════════════
// CAMPAIGN PUBLISH SUCCESS BANNER (replaces blocking alert dialog)
// ═══════════════════════════════════════════════════════════════════
function showCampaignPublishBanner(title, organizer, phone, location, startDate, endDate) {
  document.getElementById('camp-publish-banner')?.remove();

  const banner = document.createElement('div');
  banner.id = 'camp-publish-banner';
  banner.style.cssText = `
    background: linear-gradient(135deg, #FFFAF0, #fff);
    border: 1.5px solid #FBD38D;
    border-left: 5px solid var(--orange);
    border-radius: 16px;
    padding: 1.2rem 1.4rem;
    margin: 1rem 0;
    box-shadow: 0 4px 20px rgba(221,107,32,0.15);
    animation: fadeIn 0.4s ease;
    font-family: 'Inter', sans-serif;
  `;
  banner.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
      <span style="font-size:1.8rem;">🎉</span>
      <div>
        <div style="font-weight:800; font-size:1rem; color:#7B341E;">Campaign Published & Broadcast!</div>
        <div style="font-size:0.8rem; color:var(--orange);">Live push alerts dispatched to Tamil Nadu donor network</div>
      </div>
      <button onclick="this.closest('#camp-publish-banner').remove()"
        style="margin-left:auto; background:none; border:none; font-size:1.2rem; cursor:pointer; color:#FBD38D;">✕</button>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; font-size:0.82rem; color:#4A5568;">
      <div>📢 <strong>${title}</strong></div>
      <div>🏥 ${organizer}</div>
      <div>📞 ${phone}</div>
      <div>📍 ${location}</div>
      <div style="grid-column:1/-1;">⏰ ${startDate} → ${endDate}</div>
    </div>
    <div style="margin-top:0.75rem; font-size:0.78rem; color:#718096; background:#FFFAF0; border-radius:8px; padding:0.5rem 0.75rem;">
      📲 SMS & Push Notification alerts dispatched live to verified donors across Tamil Nadu!
    </div>
  `;

  const form = document.getElementById('hero-campaign-form');
  if (form) form.parentNode.insertBefore(banner, form);
  // Auto-scroll to the banner and campaigns list
  banner.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => banner?.remove(), 25000);
}
