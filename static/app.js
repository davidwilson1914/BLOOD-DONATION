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
  const promptModal = document.getElementById('location-prompt-modal');
  if (promptModal && !sessionStorage.getItem('location_prompt_seen')) {
    promptModal.classList.add('active');
  } else {
    detectUserLocation();
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
  const textElem = document.getElementById('user-current-location-text');
  if (textElem) textElem.innerText = userLocation.name;
  loadCampaigns();
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

// User Login & Session Switcher
function openLoginModal() {
  document.getElementById('login-modal').classList.add('active');
}

function closeLoginModal() {
  document.getElementById('login-modal').classList.remove('active');
}

function onLoginUserSelectChange(val) {
  const customFields = document.getElementById('custom-user-fields');
  if (val === 'custom') {
    customFields.style.display = 'block';
  } else {
    customFields.style.display = 'none';
  }
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const selectVal = document.getElementById('login-user-select').value;
  
  if (selectVal === 'custom') {
    const customName = document.getElementById('login-custom-name').value || "Guest Hero";
    const customRole = document.getElementById('login-custom-role').value;
    currentUserId = Math.floor(Math.random() * 900) + 100;
    currentUserName = customName;
    switchRole(customRole);
  } else {
    currentUserId = parseInt(selectVal);
    const selectElem = document.getElementById('login-user-select');
    currentUserName = selectElem.options[selectElem.selectedIndex].text.split('(')[0].trim();
    
    if ([2, 3].includes(currentUserId)) {
      switchRole('hospital');
    } else if (currentUserId === 1) {
      switchRole('admin');
    } else {
      switchRole('donor');
    }
  }

  document.getElementById('login-user-name').innerText = currentUserName;
  closeLoginModal();

  // Change Blood Donation Motivational Theme Quote upon login!
  rotateMotivationQuote();
  
  alert(`🔓 LOGGED IN SUCCESSFULLY!\n\nWelcome back, ${currentUserName}!\n\n✨ Motivational Theme Quote updated for your new session.`);
}

// Role Switching Handler
function switchRole(role) {
  currentRole = role;
  document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
  const btn = document.getElementById(`role-btn-${role}`);
  if (btn) btn.classList.add('active');

  document.getElementById('view-donor').style.display = role === 'donor' ? 'block' : 'none';
  document.getElementById('view-seeker').style.display = role === 'seeker' ? 'block' : 'none';
  document.getElementById('view-hospital').style.display = role === 'hospital' ? 'block' : 'none';
  document.getElementById('view-admin').style.display = role === 'admin' ? 'block' : 'none';

  if (role === 'donor') {
    handleActiveCampaignClick();
  } else if (role === 'hospital') {
    loadHospitalInventory(currentUserId === 3 ? 3 : 2);
  } else if (role === 'admin') {
    loadAuditLogs();
  }
}

// Load Top Analytics
async function loadAnalytics() {
  try {
    const res = await fetch('/api/analytics');
    const data = await res.json();
    
    const campElem = document.getElementById('stat-active-campaigns');
    if (campElem) {
      campElem.innerText = `${data.active_campaigns || 2} Drives Active`;
    }

    const donatedElem = document.getElementById('stat-donated-blood');
    if (donatedElem) {
      donatedElem.innerText = `${data.donors_donated_count || 141} Donors (${data.donors_donated_count || 141}+ Pints Donated)`;
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
  } catch (err) {
    console.error('Error loading donors:', err);
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

// Render Active Campaign Cards Sorted by Proximity under "Active Campaign Near Me"
function renderCampaignCards() {
  const container = document.getElementById('campaign-list-container');
  if (!container) return;

  if (activeCampaigns.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted); font-size:0.85rem; padding: 1.5rem; text-align: center;">No active campaigns near you. Click "Conduct / Update Campaign" to publish one!</div>`;
    return;
  }

  // Compute Distance & Sort Proximity (Closest First)
  activeCampaigns.forEach(c => {
    if (c.location) {
      c.distanceKm = calculateDistance(userLocation.latitude, userLocation.longitude, c.location.latitude, c.location.longitude);
    } else {
      c.distanceKm = 999;
    }
  });

  activeCampaigns.sort((a, b) => a.distanceKm - b.distanceKm);

  container.innerHTML = activeCampaigns.map(camp => {
    const percent = Math.min(100, Math.round((camp.units_collected / (camp.target_units || 1)) * 100));
    const bloodBadges = (camp.blood_types_needed || []).map(b => `<span class="badge badge-blood">${b}</span>`).join(' ');
    const encodedAddr = encodeURIComponent(camp.location.address || camp.location.city || camp.title);
    const encodedTitle = encodeURIComponent(camp.title);

    return `
      <div class="campaign-card">
        <div class="card-header-row">
          <span style="font-size:0.75rem; font-weight:800; color:var(--amber-orange);">📢 ACTIVE CAMPAIGN NEAR ME</span>
          <span class="badge badge-eligible">📍 ${camp.distanceKm} km near you</span>
        </div>

        <div style="font-weight: 800; font-size: 1.1rem; color:#fff; margin-top: 4px;">${camp.title}</div>
        
        <div style="font-size: 0.86rem; color: var(--emerald-green); font-weight: 600; margin-top: 3px;">
          🏥 Conducted by: <b>${camp.organizer_name}</b>
        </div>

        <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;">
          📍 Venue Location: <b>${camp.location.address || camp.location.city}</b>
        </div>

        <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 2px;">
          ⏰ Timing Schedule: <b>${camp.start_date} to ${camp.end_date} (Daily 9:00 AM - 5:00 PM)</b>
        </div>

        <div class="campaign-progress-bar">
          <div class="campaign-progress-fill" style="width: ${percent}%;"></div>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.78rem; color:var(--text-muted);">
          <span>Collected: <b>${camp.units_collected}</b> / ${camp.target_units} pints</span>
          <span style="color:var(--amber-orange); font-weight:700;">${percent}% Achieved</span>
        </div>

        <div style="margin-top: 0.6rem; display:flex; flex-wrap:wrap; gap:0.3rem;">
          ${bloodBadges}
        </div>

        <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
          <button class="btn-primary btn-gmaps" style="flex: 1.2; padding: 10px 14px; font-size: 0.86rem;" onclick="openInGoogleMaps(${camp.location.latitude}, ${camp.location.longitude}, '${encodedAddr}', '${encodedTitle}')">
            🗺️ Open in Google Maps
          </button>
          <button class="btn-primary" style="flex: 1; padding: 10px 14px; font-size: 0.86rem; background: linear-gradient(135deg, #10b981, #059669);" onclick="joinCampaign(${camp.id})">
            ✨ Register Drive
          </button>
        </div>
      </div>
    `;
  }).join('');
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
