// ===========================
//  TROPICAL GARDENS HOTEL JS
//  Real content from tropicalgardenshotel.com
// ===========================

// ----- HERO SLIDER -----
let currentSlide = 0
const slides = document.querySelectorAll('.hero-slide')
const dotsContainer = document.getElementById('slide-dots')
let autoplayInterval

// Create dots
slides.forEach((_, i) => {
  const dot = document.createElement('button')
  dot.className = 'slide-dot' + (i === 0 ? ' active' : '')
  dot.addEventListener('click', () => goToSlide(i))
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

// ----- HAMBURGER MENU -----
const hamburger = document.getElementById('hamburger')
const navLinks = document.getElementById('nav-links')

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

// ----- DEFAULT DATES -----
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
  const revealEls = document.querySelectorAll('.service-card, .room-card, .contact-card, .gallery-item, .why-item, .stat-item')
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1'
          entry.target.style.transform = 'translateY(0)'
        }, i * 60)
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' })

  revealEls.forEach(el => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(20px)'
    el.style.transition = 'opacity 0.55s ease, transform 0.55s ease'
    observer.observe(el)
  })
})

// ----- GALLERY FILTER -----
const filterBtns = document.querySelectorAll('.filter-btn')
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    const filter = btn.dataset.filter
    document.querySelectorAll('.gallery-item').forEach(item => {
      if (filter === 'all' || item.dataset.category === filter) {
        item.classList.remove('hidden')
      } else {
        item.classList.add('hidden')
      }
    })
  })
})

// ----- GALLERY LIGHTBOX -----
document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    const img = item.querySelector('img')
    const overlay = document.createElement('div')
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.94);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;'
    const imgEl = document.createElement('img')
    imgEl.src = img.src
    imgEl.style.cssText = 'max-width:94vw;max-height:90vh;object-fit:contain;border-radius:8px;box-shadow:0 20px 80px rgba(0,0,0,0.5);'
    overlay.appendChild(imgEl)
    overlay.addEventListener('click', () => { overlay.remove(); document.body.style.overflow = '' })
    document.body.appendChild(overlay)
    document.body.style.overflow = 'hidden'
  })
})

// ----- RESERVATION FORM -----
function handleReservation(e) {
  e.preventDefault()
  const cin = document.getElementById('checkin')?.value
  const cout = document.getElementById('checkout')?.value
  if (cin && cout) {
    const nights = Math.round((new Date(cout) - new Date(cin)) / 86400000)
    showToast(`✅ Reservation sent! ${nights} night${nights > 1 ? 's' : ''} confirmed. We'll contact you shortly.`)
  } else {
    showToast('✅ Your reservation request has been sent! We\'ll be in touch within 24 hours.')
  }
  e.target.reset()
}

// ----- CONTACT FORM -----
function handleContact(e) {
  e.preventDefault()
  e.target.reset()
  showToast('✅ Message sent! Tropical Gardens Hotel will reply soon.')
}

// ----- TOAST -----
function showToast(msg) {
  const toast = document.getElementById('toast')
  toast.textContent = msg
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 4500)
}
