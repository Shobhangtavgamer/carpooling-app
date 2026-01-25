// Utility Functions

// Show toast notification
function showToast(message, type = 'info') {
  const container = document.querySelector('.toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">
      ${getToastIcon(type)}
    </div>
    <div class="toast-message">${message}</div>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function getToastIcon(type) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  return icons[type] || icons.info;
}

// Show loading overlay
function showLoading(text = 'Loading...') {
  let overlay = document.querySelector('.loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="spinner"></div>
      <div class="loading-text">${text}</div>
    `;
    document.body.appendChild(overlay);
  }
  overlay.classList.add('active');
}

function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

// Format date
function formatDate(date, format = APP_CONFIG.dateFormat) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  if (format === 'DD/MM/YYYY') {
    return `${day}/${month}/${year}`;
  }
  return `${year}-${month}-${day}`;
}

// Format time
function formatTime(time) {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

// Format currency
function formatCurrency(amount) {
  return `₹${parseFloat(amount).toFixed(2)}`;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Validate email
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validate phone
function isValidPhone(phone) {
  const regex = /^[6-9]\d{9}$/;
  return regex.test(phone);
}

// Validate form
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;
  const inputs = form.querySelectorAll('.form-input, .form-select, .form-textarea');
  let isValid = true;
  
  inputs.forEach(input => {
    const formGroup = input.closest('.form-group');
    if (formGroup) {
      formGroup.classList.remove('error', 'success');
    }
    
    if (input.hasAttribute('required') && !input.value.trim()) {
      if (formGroup) {
        formGroup.classList.add('error');
        const errorMsg = formGroup.querySelector('.form-error');
        if (errorMsg) errorMsg.textContent = 'This field is required';
      }
      isValid = false;
    } else if (input.type === 'email' && input.value && !isValidEmail(input.value)) {
      if (formGroup) {
        formGroup.classList.add('error');
        const errorMsg = formGroup.querySelector('.form-error');
        if (errorMsg) errorMsg.textContent = 'Invalid email address';
      }
      isValid = false;
    } else if (input.type === 'tel' && input.value && !isValidPhone(input.value)) {
      if (formGroup) {
        formGroup.classList.add('error');
        const errorMsg = formGroup.querySelector('.form-error');
        if (errorMsg) errorMsg.textContent = 'Invalid phone number';
      }
      isValid = false;
    } else if (input.value) {
      if (formGroup) {
        formGroup.classList.add('success');
      }
    }
  });
  
  return isValid;
}

// Get current user
function getCurrentUser() {
  return new Promise((resolve, reject) => {
    auth.onAuthStateChanged(user => {
      if (user) {
        resolve(user);
      } else {
        reject(new Error('No user logged in'));
      }
    });
  });
}

// Get user data from Firestore
async function getUserData(userId) {
  try {
    const doc = await db.collection('users').doc(userId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

// Update user data
async function updateUserData(userId, data) {
  try {
    await db.collection('users').doc(userId).update(data);
    return true;
  } catch (error) {
    console.error('Error updating user data:', error);
    return false;
  }
}

// Check authentication
function checkAuth() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged(user => {
      if (!user) {
        window.location.href = 'login.html';
      } else {
        resolve(user);
      }
    });
  });
}

// Logout
async function logout() {
  try {
    await auth.signOut();
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error logging out:', error);
    showToast('Error logging out', 'error');
  }
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Get query parameter
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Set query parameter
function setQueryParam(param, value) {
  const url = new URL(window.location);
  url.searchParams.set(param, value);
  window.history.pushState({}, '', url);
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Truncate text
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

// Get relative time
function getRelativeTime(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(date);
}

// Modal functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

// Initialize modal close handlers
document.addEventListener('DOMContentLoaded', () => {
  // Close modal on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', () => {
      const modal = backdrop.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    });
  });
  
  // Close modal on close button click
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    });
  });
});

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showToast,
    showLoading,
    hideLoading,
    formatDate,
    formatTime,
    formatCurrency,
    calculateDistance,
    isValidEmail,
    isValidPhone,
    validateForm,
    getCurrentUser,
    getUserData,
    updateUserData,
    checkAuth,
    logout,
    debounce,
    getQueryParam,
    setQueryParam,
    generateId,
    truncateText,
    getRelativeTime,
    openModal,
    closeModal
  };
}
