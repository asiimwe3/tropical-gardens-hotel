// ===========================
//  TROPICAL GARDENS HOTEL JS
//  Device-aware + mobile bottom nav
// ===========================

// ---- DEVICE DETECTION ----
const isMobile = () => window.innerWidth <= 768
const API_BASE = (window.TGH_API_BASE || localStorage.getItem('tgh_api_base') || '').replace(/\/$/, '')
const THEME_KEY = 'tgh_theme'
const NOTIFICATIONS_KEY = 'tgh_public_notifications'

function preferredTheme() {
  return localStorage.getItem(THEME_KEY) ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

function applyTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light'
  document.documentElement.dataset.theme = nextTheme
  localStorage.setItem(THEME_KEY, nextTheme)
  document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    const icon = button.querySelector('[data-theme-icon]')
    const label = button.querySelector('[data-theme-label]')
    const isDark = nextTheme === 'dark'
    if (icon) icon.textContent = isDark ? '☀' : '☾'
    if (label) label.textContent = isDark ? 'Light' : 'Dark'
    button.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme')
  })
}

applyTheme(preferredTheme())

function apiUrl(path) {
  return `${API_BASE}${path}`
}

async function apiFetch(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || data.message || 'Request failed')
  return data
}

function setButtonLoading(button, loading, text) {
  if (!button) return
  if (loading) {
    button.dataset.originalText = button.textContent
    button.textContent = text
    button.disabled = true
  } else {
    button.textContent = button.dataset.originalText || button.textContent
    button.disabled = false
  }
}

function escapeHTML(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]))
}

function normalizeNotification(notification) {
  return {
    id: notification.id || `local-${Date.now()}`,
    title: notification.title || 'Hotel update',
    body: notification.body || notification.message || '',
    channel: notification.channel || 'Website',
    audience: notification.audience || 'All Guests',
    type: notification.type || 'update',
    createdAt: notification.createdAt || notification.created_at || notification.time || ''
  }
}

function readStoredNotifications() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]').map(normalizeNotification)
  } catch (error) {
    return []
  }
}

function formatNotificationDate(value) {
  if (!value) return 'Latest update'
  if (String(value).toLowerCase().includes('ago') || String(value).toLowerCase().includes('now') || String(value).toLowerCase().includes('yesterday')) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function renderPublicNotifications(notifications) {
  const grid = document.getElementById('public-notifications')
  if (!grid) return

  const websiteNotifications = notifications
    .map(normalizeNotification)
    .filter(item => String(item.channel || '').toLowerCase().includes('website'))
    .slice(0, 12)

  if (!websiteNotifications.length) {
    grid.innerHTML = '<div class="notification-empty">No guest notifications yet.</div>'
    return
  }

  grid.innerHTML = websiteNotifications.map(item => `
    <article class="notification-card">
      <span class="notification-type ${escapeHTML(item.type)}">${escapeHTML(item.type)}</span>
      <h3>${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.body)}</p>
      <div class="notification-meta">${escapeHTML(item.audience)} · ${escapeHTML(formatNotificationDate(item.createdAt))}</div>
    </article>
  `).join('')
}

async function loadPublicNotifications() {
  const stored = readStoredNotifications()
  renderPublicNotifications(stored)

  try {
    const data = await apiFetch('/api/notifications')
    const backendNotifications = (data.notifications || []).map(normalizeNotification)
    const merged = [...backendNotifications, ...stored]
    const seen = new Set()
    renderPublicNotifications(merged.filter(item => {
      const key = `${item.id}-${item.title}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }))
  } catch (error) {
    // Static GitHub Pages uses localStorage notifications when no backend is configured.
  }
}

// ---- HERO SLIDER ----
let currentSlide = 0
const slides = document.querySelectorAll('.hero-slide')
const dotsContainer = document.getElementById('slide-dots')
let autoplayInterval

slides.forEach((_, i) => {
  const dot = document.createElement('button')
  dot.className = 'slide-dot' + (i === 0 ? ' active' : '')
  dot.addEventListener('click', () => { goToSlide(i); resetAutoplay() })
  dotsContainer.appendChild(dot)
})

function goToSlide(n) {
  slides[currentSlide].classList.remove('active')
  dotsContainer.children[currentSlide].classList.remove('active')
  currentSlide = (n + slides.length) % slides.length
  slides[currentSlide].classList.add('active')
  dotsContainer.children[currentSlide].classList.add('active')
}

function changeSlide(dir) {
  goToSlide(currentSlide + dir)
  resetAutoplay()
}

function resetAutoplay() {
  clearInterval(autoplayInterval)
  autoplayInterval = setInterval(() => goToSlide(currentSlide + 1), 5000)
}

autoplayInterval = setInterval(() => goToSlide(currentSlide + 1), 5000)

// Touch swipe support for hero slider
let touchStartX = 0
const heroEl = document.querySelector('.hero')
if (heroEl) {
  heroEl.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX }, { passive: true })
  heroEl.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) { changeSlide(diff > 0 ? 1 : -1) }
  }, { passive: true })
}

// ---- DESKTOP HAMBURGER ----
const hamburger = document.getElementById('hamburger')
const navLinks = document.getElementById('nav-links')

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open')
    const spans = hamburger.querySelectorAll('span')
    if (navLinks.classList.contains('open')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)'
      spans[1].style.opacity = '0'
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)'
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = '' })
    }
  })

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open')
      hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = '' })
    })
  })
}

// ---- MOBILE BOTTOM NAV — ACTIVE STATE ----
function updateBottomNav() {
  const sections = ['home', 'signature', 'rooms', 'reservation', 'menu', 'gallery', 'contact']
  const navItems = document.querySelectorAll('.mob-nav-item')
  if (!navItems.length) return

  let current = 'home'
  const scrollY = window.scrollY + window.innerHeight / 3

  sections.forEach(id => {
    const el = document.getElementById(id)
    if (el && el.offsetTop <= scrollY) current = id
  })

  navItems.forEach(item => {
    const sec = item.dataset.section
    item.classList.toggle('active', sec === current)
  })
}

// Smooth scroll for bottom nav links
document.querySelectorAll('.mob-nav-item').forEach(item => {
  item.addEventListener('click', e => {
    const href = item.getAttribute('href')
    if (href && href.startsWith('#')) {
      e.preventDefault()
      const target = document.querySelector(href)
      if (target) {
        const offset = 70 // mobile header height
        const top = target.getBoundingClientRect().top + window.scrollY - offset
        window.scrollTo({ top, behavior: 'smooth' })
      }
    }
  })
})

// ---- DEFAULT DATES ----
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date()
  const fmt = d => d.toISOString().split('T')[0]
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 3)

  const cin = document.getElementById('checkin')
  const cout = document.getElementById('checkout')
  const quickCin = document.getElementById('quick-checkin')
  const quickCout = document.getElementById('quick-checkout')
  if (cin) { cin.value = fmt(tomorrow); cin.min = fmt(today) }
  if (cout) { cout.value = fmt(dayAfter); cout.min = fmt(tomorrow) }
  if (quickCin) { quickCin.value = fmt(tomorrow); quickCin.min = fmt(today) }
  if (quickCout) { quickCout.value = fmt(dayAfter); quickCout.min = fmt(tomorrow) }
  if (cin && cout) {
    cin.addEventListener('change', () => {
      const next = new Date(cin.value); next.setDate(next.getDate() + 1)
      cout.min = fmt(next)
      if (cout.value <= cin.value) cout.value = fmt(next)
    })
  }
  if (quickCin && quickCout) {
    quickCin.addEventListener('change', () => {
      const next = new Date(quickCin.value); next.setDate(next.getDate() + 1)
      quickCout.min = fmt(next)
      if (quickCout.value <= quickCin.value) quickCout.value = fmt(next)
    })
  }

  // Scroll reveal
  const revealEls = document.querySelectorAll('.service-card, .room-card, .contact-card, .gallery-item, .why-item, .menu-card, .event-card, .review-card, .tourism-cards div, .experience-list div, .proof-item, .signature-card, .notification-card, .journey-step')
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1'
          entry.target.style.transform = 'translateY(0)'
        }, i * 55)
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' })

  revealEls.forEach(el => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(18px)'
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease'
    observer.observe(el)
  })

  // Initial active state
  updateBottomNav()
  applyTheme(preferredTheme())

  document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')
    })
  })
})

function handleQuickBooking(e) {
  e.preventDefault()
  const room = document.getElementById('quick-room')?.value || 'Room'
  const checkin = document.getElementById('quick-checkin')?.value
  const checkout = document.getElementById('quick-checkout')?.value
  const guests = document.getElementById('quick-guests')?.value
  const reservation = document.getElementById('reservation')

  const roomSelect = document.querySelector('.res-form select')
  if (roomSelect) {
    const match = Array.from(roomSelect.options).find(option => room.includes(option.value) || option.value.includes(room))
    if (match) roomSelect.value = match.value
  }

  if (checkin) document.getElementById('checkin').value = checkin
  if (checkout) document.getElementById('checkout').value = checkout
  if (guests) {
    const guestSelects = document.querySelectorAll('.res-form select')
    const guestSelect = guestSelects[1]
    if (guestSelect) {
      const match = Array.from(guestSelect.options).find(option => option.textContent === guests)
      if (match) guestSelect.value = match.value
    }
  }

  if (reservation) {
    reservation.scrollIntoView({ behavior: 'smooth', block: 'start' })
    showToast('Availability request ready. Complete your reservation details.')
  }
}

loadPublicNotifications()

// ---- SCROLL EVENTS ----
window.addEventListener('scroll', () => {
  updateBottomNav()
}, { passive: true })

// ---- GALLERY FILTER ----
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    const filter = btn.dataset.filter
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.classList.toggle('hidden', filter !== 'all' && item.dataset.category !== filter)
    })
  })
})

// ---- GALLERY LIGHTBOX ----
document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    const img = item.querySelector('img')
    const overlay = document.createElement('div')
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:16px;'
    const imgEl = document.createElement('img')
    imgEl.src = img.src
    imgEl.style.cssText = 'max-width:100%;max-height:90vh;object-fit:contain;border-radius:8px;'
    overlay.appendChild(imgEl)
    overlay.addEventListener('click', () => { overlay.remove(); document.body.style.overflow = '' })
    document.body.appendChild(overlay)
    document.body.style.overflow = 'hidden'
  })
})

// ---- RESERVATION FORM ----
async function handleReservation(e) {
  e.preventDefault()
  const form = e.target
  const submit = form.querySelector('[type="submit"]')
  const cin = document.getElementById('checkin')?.value
  const cout = document.getElementById('checkout')?.value
  const nights = cin && cout ? Math.round((new Date(cout) - new Date(cin)) / 86400000) : 0
  const data = new FormData(form)
  const guestName = `${data.get('firstName') || ''} ${data.get('lastName') || ''}`.trim()
  const guests = String(data.get('guests') || '1').replace(/\D/g, '') || '1'

  setButtonLoading(submit, true, 'Sending...')
  try {
    await apiFetch('/api/reservations', {
      method: 'POST',
      body: JSON.stringify({
        guestName,
        phone: data.get('phone'),
        email: data.get('email') || '',
        roomName: data.get('roomName') || '',
        checkIn: cin,
        checkOut: cout,
        guests: Number(guests),
        notes: data.get('notes') || ''
      })
    })
    showToast(nights > 0
      ? `Reservation received. ${nights} night${nights > 1 ? 's' : ''}. We'll confirm shortly.`
      : 'Reservation received. We will contact you within 24 hours.')
    form.reset()
  } catch (error) {
    showToast(`Could not send online. Please call or WhatsApp us: ${error.message}`)
  } finally {
    setButtonLoading(submit, false)
  }
}

// ---- CONTACT FORM ----
async function handleContact(e) {
  e.preventDefault()
  const form = e.target
  const submit = form.querySelector('[type="submit"]')
  const data = new FormData(form)
  const name = `${data.get('firstName') || ''} ${data.get('lastName') || ''}`.trim()

  setButtonLoading(submit, true, 'Sending...')
  try {
    await apiFetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email: data.get('email') || '',
        message: data.get('message') || '',
        subject: 'Website contact form'
      })
    })
    form.reset()
    showToast('Message sent. Tropical Gardens Hotel will reply soon.')
  } catch (error) {
    showToast(`Could not send online. Please call or WhatsApp us: ${error.message}`)
  } finally {
    setButtonLoading(submit, false)
  }
}

// ---- TOAST ----
function showToast(msg) {
  const toast = document.getElementById('toast')
  if (!toast) return
  toast.textContent = msg
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 4200)
}

// ==============================
//  BOOKING MODAL
// ==============================
const bookModal   = document.getElementById('book-modal')
const bookOverlay = document.getElementById('book-overlay')
const bookClose   = document.getElementById('book-modal-close')
const bookRoomEl  = document.getElementById('book-modal-room')
const bookWaBtn   = document.getElementById('book-whatsapp-btn')
const bookFormBtn = document.getElementById('book-form-btn')

const WA_NUMBER = '256782460683'

function openBookModal(roomName) {
  const label = roomName && roomName !== 'Room' ? roomName : 'Your Room'
  bookRoomEl.textContent = label

  // Build WhatsApp message
  const msg = encodeURIComponent(
    `Hello Tropical Gardens Hotel! 👋\nI'd like to book a *${label}*.\nPlease let me know availability and pricing. Thank you!`
  )
  bookWaBtn.href = `https://wa.me/${WA_NUMBER}?text=${msg}`

  bookModal.style.display = 'block'
  bookOverlay.classList.add('show')
  // Trigger animation on next tick
  requestAnimationFrame(() => {
    requestAnimationFrame(() => bookModal.classList.add('show'))
  })
  document.body.style.overflow = 'hidden'
}

function closeBookModal() {
  bookModal.classList.remove('show')
  bookOverlay.classList.remove('show')
  setTimeout(() => { bookModal.style.display = 'none' }, 250)
  document.body.style.overflow = ''
}

// Wire all .book-trigger buttons
document.querySelectorAll('.book-trigger').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    openBookModal(btn.dataset.room || 'Room')
  })
})

// Close on X button
if (bookClose) bookClose.addEventListener('click', closeBookModal)

// Close on overlay click
if (bookOverlay) bookOverlay.addEventListener('click', closeBookModal)

// Close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeBookModal()
})

// Form option — close modal first, then scroll to form
if (bookFormBtn) {
  bookFormBtn.addEventListener('click', (e) => {
    e.preventDefault()
    closeBookModal()
    setTimeout(() => {
      const target = document.getElementById('reservation')
      if (target) {
        const offset = 80
        const top = target.getBoundingClientRect().top + window.scrollY - offset
        window.scrollTo({ top, behavior: 'smooth' })
      }
    }, 260)
  })
}

// ==============================
//  LOAD SITE DATA (Menu, Rooms, Offers)
// ==============================

async function loadSiteData() {
  try {
    const [menuResult, roomsResult, offersResult] = await Promise.allSettled([
      apiFetch('/api/menu'),
      apiFetch('/api/rooms'),
      apiFetch('/api/offers')
    ])

    if (menuResult.status === 'fulfilled' && menuResult.value.menuItems?.length) {
      menuItems = menuResult.value.menuItems
      renderMenuGrid()
    } else {
      loadDefaultMenu()
    }

    if (roomsResult.status === 'fulfilled' && roomsResult.value.rooms?.length) {
      updateRoomsDisplay(roomsResult.value.rooms)
    }

    if (offersResult.status === 'fulfilled' && offersResult.value.offers?.length) {
      displayOffers(offersResult.value.offers)
    }
  } catch (e) {
    console.log('API data not available, using local fallback data');
    loadDefaultMenu();
  }
}

// ==============================
//  FOOD MENU WITH PICTURES
// ==============================
let menuItems = [];
let activeMenuCat = 'Breakfast';

// Food category colors for fallback images
const categoryEmojis = {
  'Breakfast': '🌅',
  'Lunch': '☀️',
  'Dinner': '🌙',
  'Drinks': '🍹',
  'Desserts': '🍰',
  'Snacks': '🥨'
};

// Generate food images based on item name
function generateFoodImage(itemName, category) {
  // Using placeholder images with item names
  const encodedName = encodeURIComponent(itemName.substring(0, 20));
  const emoji = categoryEmojis[category] || '🍽️';
  
  return `https://ui-avatars.com/api/?name=${encodedName}&background=8B7355&color=fff&size=300&font-size=0.4`;
}

function renderMenuGrid() {
  const grid = document.getElementById('menu-grid');
  if (!grid) return;

  const filtered = menuItems.filter(i => i.category === activeMenuCat);

  if (!filtered.length) {
    grid.innerHTML = '<div class="menu-empty">No items available in this category right now.</div>';
    return;
  }

  grid.innerHTML = filtered.map(item => {
    // Try to use item image if available, otherwise generate one
    const imageUrl = item.imageUrl || item.image || item.img || generateFoodImage(item.name, item.category);
    
    return `
      <div class="menu-card ${item.is_featured ? 'featured' : ''}">
        <div class="menu-card-image">
          <img src="${imageUrl}" alt="${item.name}" 
               onerror="this.src='${generateFoodImage(item.name, item.category)}'"
               style="width:100%;height:200px;object-fit:cover;border-radius:8px 8px 0 0;"/>
          ${item.is_featured ? '<span class="featured-badge">⭐ Featured</span>' : ''}
        </div>
        <div class="menu-card-body">
          <div class="menu-card-top">
            <span class="menu-card-name">${item.name}</span>
            <span class="menu-card-price">UGX ${Number(item.price).toLocaleString()}</span>
          </div>
          ${item.description ? `<p class="menu-card-desc">${item.description}</p>` : ''}
          ${item.is_available ? '<span class="menu-card-status">✓ Available</span>' : '<span class="menu-card-status unavailable">Out of Stock</span>'}
        </div>
      </div>
    `;
  }).join('');

  // Add CSS styles for menu cards if not already added
  if (!document.getElementById('menu-card-styles')) {
    const style = document.createElement('style');
    style.id = 'menu-card-styles';
    style.textContent = `
      .menu-card {
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        cursor: pointer;
      }
      .menu-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      }
      .menu-card.featured {
        border: 2px solid #f57f17;
      }
      .menu-card-image {
        position: relative;
        width: 100%;
        height: 200px;
        overflow: hidden;
      }
      .menu-card-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .featured-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: #f57f17;
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 700;
      }
      .menu-card-body {
        padding: 16px;
      }
      .menu-card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }
      .menu-card-name {
        font-weight: 700;
        font-size: 0.95rem;
        color: #1a1a1a;
        flex: 1;
      }
      .menu-card-price {
        font-weight: 700;
        color: #2e7d32;
        font-size: 0.9rem;
        white-space: nowrap;
        margin-left: 8px;
      }
      .menu-card-desc {
        font-size: 0.8rem;
        color: #6b7280;
        margin: 8px 0;
        line-height: 1.4;
      }
      .menu-card-status {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 600;
        color: #2e7d32;
        background: #e8f5e9;
        padding: 3px 8px;
        border-radius: 4px;
      }
      .menu-card-status.unavailable {
        color: #d32f2f;
        background: #ffebee;
      }
      @media (max-width: 768px) {
        .menu-card-image {
          height: 160px;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Wire up menu tabs
document.querySelectorAll('.menu-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeMenuCat = tab.dataset.cat;
    renderMenuGrid();
  });
});

// ==============================
//  ROOMS FROM API
// ==============================
function updateRoomsDisplay(rooms) {
  const roomsSection = document.getElementById('rooms');
  if (!roomsSection) return;

  const roomsGrid = roomsSection.querySelector('.rooms-grid');
  if (!roomsGrid) return;

  roomsGrid.innerHTML = rooms.map((room, idx) => {
    const roomType = room.type || 'Standard';
    const imageUrl = room.imageUrl || room.image || generateFoodImage(room.name, roomType);
    const isAvailable = room.isAvailable ?? room.is_available ?? true;
    return `
      <div class="room-card ${idx === 1 ? 'featured' : ''}">
        ${idx === 1 ? '<div class="room-featured-tag">Popular Choice</div>' : ''}
        <div class="room-img">
          <img src="${imageUrl}" alt="${room.name}" style="width:100%;height:160px;object-fit:cover;" onerror="this.src='${generateFoodImage(room.name, roomType)}'"/>
          <div class="room-badge">${room.name}</div>
        </div>
        <div class="room-body">
          <h3>${room.name}</h3>
          <p>${room.description || 'Comfortable accommodation'}</p>
          <ul class="room-features">
            <li>🛏 ${room.capacity || 2} Guest${room.capacity !== 1 ? 's' : ''}</li>
            <li>💰 UGX ${Number(room.price).toLocaleString()}/night</li>
          </ul>
          <button class="btn btn-outline-dark book-trigger" data-room="${room.name}">${isAvailable ? 'Book Now' : 'Enquire'}</button>
        </div>
      </div>
    `;
  }).join('');

  // Re-wire booking triggers
  document.querySelectorAll('.book-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openBookModal(btn.dataset.room || 'Room');
    });
  });
}

// ==============================
//  OFFERS FROM ADMIN
// ==============================
function displayOffers(offers) {
  // Could display offers as banners or cards
  // For now, just ensure they're available
  window.adminOffers = offers;
  if (offers.length > 0) {
    console.log('Offers loaded from admin:', offers.length);
  }
}

// ==============================
//  DEFAULT FALLBACK MENU
// ==============================
function loadDefaultMenu() {
  menuItems = [
    {id:"m1",name:"Rolex (Egg Roll)",description:"Fresh chapati rolled with fried eggs, veggies and spices - a Ugandan street classic.",category:"Breakfast",price:8000,is_available:true,is_featured:false},
    {id:"m2",name:"Katogo (Offals & Matooke)",description:"Traditional Ugandan morning stew with banana and offals.",category:"Breakfast",price:12000,is_available:true,is_featured:false},
    {id:"m3",name:"Omelette & Toast",description:"Fluffy omelette with toasted bread, butter and fresh juice.",category:"Breakfast",price:15000,is_available:true,is_featured:false},
    {id:"m4",name:"Matooke & Groundnut Stew",description:"Steamed green bananas served with rich groundnut sauce.",category:"Lunch",price:18000,is_available:true,is_featured:true},
    {id:"m5",name:"Rice & Beans",description:"Soft white rice with well-seasoned beans.",category:"Lunch",price:12000,is_available:true,is_featured:false},
    {id:"m6",name:"Chicken Stew & Posho",description:"Tender chicken in tomato and onion stew with ugali.",category:"Lunch",price:22000,is_available:true,is_featured:false},
    {id:"m7",name:"Grilled Tilapia",description:"Fresh Lake tilapia marinated in herbs, grilled to perfection. Served with chips or rice.",category:"Dinner",price:35000,is_available:true,is_featured:true},
    {id:"m8",name:"Beef Rolex",description:"Large chapati wrap with seasoned beef strips, lettuce and tomato.",category:"Dinner",price:28000,is_available:true,is_featured:false},
    {id:"m9",name:"Mixed Grill Platter",description:"Assorted grilled meats - chicken, beef and goat - with kachumbari.",category:"Dinner",price:55000,is_available:false,is_featured:false},
    {id:"m10",name:"Nyama Choma (Goat)",description:"Slow-roasted goat meat served with ugali and kachumbari.",category:"Dinner",price:45000,is_available:true,is_featured:true},
    {id:"m11",name:"Fresh Passion Juice",description:"Freshly squeezed passion fruit juice, chilled and naturally sweet.",category:"Drinks",price:5000,is_available:true,is_featured:true},
    {id:"m12",name:"Mango Smoothie",description:"Blended fresh mango with milk and honey.",category:"Drinks",price:7000,is_available:true,is_featured:false},
    {id:"m13",name:"Tropical Cocktail",description:"Signature hotel mix of pineapple, passion, mint and ginger.",category:"Drinks",price:12000,is_available:true,is_featured:true},
    {id:"m14",name:"Soda / Water",description:"Assorted soft drinks and mineral water.",category:"Drinks",price:3000,is_available:true,is_featured:false},
    {id:"m15",name:"Banana Cake",description:"Moist homemade cake with fresh bananas and vanilla cream.",category:"Desserts",price:10000,is_available:true,is_featured:false},
  ];
  renderMenuGrid();
}

// Load API data on page load
document.addEventListener('DOMContentLoaded', () => {
  loadSiteData();
});
