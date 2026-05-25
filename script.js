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
