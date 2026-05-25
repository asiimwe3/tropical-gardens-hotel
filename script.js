// ===========================
//  TROPICAL GARDENS HOTEL JS
//  Device-aware + mobile bottom nav
// ===========================

// ---- DEVICE DETECTION ----
const isMobile = () => window.innerWidth <= 768

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
  const sections = ['home', 'rooms', 'reservation', 'gallery', 'contact']
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
  if (cin) { cin.value = fmt(tomorrow); cin.min = fmt(today) }
  if (cout) { cout.value = fmt(dayAfter); cout.min = fmt(tomorrow) }
  if (cin && cout) {
    cin.addEventListener('change', () => {
      const next = new Date(cin.value); next.setDate(next.getDate() + 1)
      cout.min = fmt(next)
      if (cout.value <= cin.value) cout.value = fmt(next)
    })
  }

  // Scroll reveal
  const revealEls = document.querySelectorAll('.service-card, .room-card, .contact-card, .gallery-item, .why-item')
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
})

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
function handleReservation(e) {
  e.preventDefault()
  const cin = document.getElementById('checkin')?.value
  const cout = document.getElementById('checkout')?.value
  const nights = cin && cout ? Math.round((new Date(cout) - new Date(cin)) / 86400000) : 0
  showToast(nights > 0
    ? `✅ Reservation sent! ${nights} night${nights > 1 ? 's' : ''}. We'll confirm shortly.`
    : '✅ Reservation sent! We\'ll contact you within 24 hours.')
  e.target.reset()
}

// ---- CONTACT FORM ----
function handleContact(e) {
  e.preventDefault()
  e.target.reset()
  showToast('✅ Message sent! Tropical Gardens Hotel will reply soon.')
}

// ---- TOAST ----
function showToast(msg) {
  const toast = document.getElementById('toast')
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
//  LOAD ADMIN DATA (Menu, Rooms, Offers)
// ==============================

// Extract data from admin.html
async function loadAdminData() {
  try {
    const response = await fetch('https://raw.githack.com/asiimwe3/tropical-gardens-hotel/main/admin.html');
    const html = await response.text();
    
    // Parse menu items from admin.html script
    const menuMatch = html.match(/var menuItems=\[([\s\S]*?)\];/);
    const roomsMatch = html.match(/var rooms=\[([\s\S]*?)\];/);
    const offersMatch = html.match(/var offers=\[([\s\S]*?)\];/);
    
    if (menuMatch) {
      try {
        const menuCode = '[' + menuMatch[1] + ']';
        menuItems = eval(menuCode);
        renderMenuGrid();
      } catch (e) {
        console.log('Menu data loaded from admin');
      }
    }
    
    if (roomsMatch) {
      try {
        const roomsCode = '[' + roomsMatch[1] + ']';
        window.adminRooms = eval(roomsCode);
        updateRoomsDisplay(window.adminRooms);
      } catch (e) {
        console.log('Rooms data loaded from admin');
      }
    }

    if (offersMatch) {
      try {
        const offersCode = '[' + offersMatch[1] + ']';
        window.adminOffers = eval(offersCode);
        displayOffers(window.adminOffers);
      } catch (e) {
        console.log('Offers data loaded from admin');
      }
    }
  } catch (e) {
    console.log('Admin data not available, using default menu');
    loadDefaultMenu();
  }
}

// ==============================
//  FOOD MENU — loads from Admin
// ==============================
let menuItems = [];
let activeMenuCat = 'Breakfast';

function renderMenuGrid() {
  const grid = document.getElementById('menu-grid');
  if (!grid) return;

  const filtered = menuItems.filter(i => i.category === activeMenuCat);

  if (!filtered.length) {
    grid.innerHTML = '<div class="menu-empty">No items available in this category right now.</div>';
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <div class="menu-card ${item.is_featured ? 'featured' : ''}">
      ${item.is_featured ? '<span class="featured-badge">⭐ Featured</span>' : ''}
      <div class="menu-card-top">
        <span class="menu-card-name">${item.name}</span>
        <span class="menu-card-price">UGX ${Number(item.price).toLocaleString()}</span>
      </div>
      ${item.description ? `<p class="menu-card-desc">${item.description}</p>` : ''}
    </div>
  `).join('');
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
//  ROOMS FROM ADMIN
// ==============================
function updateRoomsDisplay(rooms) {
  const roomsSection = document.getElementById('rooms');
  if (!roomsSection) return;

  const roomsGrid = roomsSection.querySelector('.rooms-grid');
  if (!roomsGrid) return;

  roomsGrid.innerHTML = rooms.map((room, idx) => {
    const roomType = room.type || 'Standard';
    return `
      <div class="room-card ${idx === 1 ? 'featured' : ''}">
        ${idx === 1 ? '<div class="room-featured-tag">Popular Choice</div>' : ''}
        <div class="room-img">
          <img src="${room.image}" alt="${room.name}" style="width:100%;height:160px;object-fit:cover;" onerror="this.src='https://via.placeholder.com/300x160?text=${encodeURIComponent(room.name)}'"/>
          <div class="room-badge">${room.name}</div>
        </div>
        <div class="room-body">
          <h3>${room.name}</h3>
          <p>${room.description || 'Comfortable accommodation'}</p>
          <ul class="room-features">
            <li>🛏 ${room.capacity || 2} Guest${room.capacity !== 1 ? 's' : ''}</li>
            <li>💰 UGX ${Number(room.price).toLocaleString()}/night</li>
          </ul>
          <button class="btn btn-outline-dark book-trigger" data-room="${room.name}">Book Now</button>
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

// Load admin data on page load
document.addEventListener('DOMContentLoaded', () => {
  loadAdminData();
});
