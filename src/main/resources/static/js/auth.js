// Authentication Logic

// Login with email and password
async function loginWithEmail(email, password) {
  try {
    showLoading('Logging in...');
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    hideLoading();
    showToast('Login successful!', 'success');
    
    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = 'passenger-dashboard.html';
    }, 1000);
    
    return userCredential.user;
  } catch (error) {
    hideLoading();
    console.error('Login error:', error);
    
    let errorMessage = 'Login failed. Please try again.';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled.';
    }
    
    showToast(errorMessage, 'error');
    throw error;
  }
}

// Login with Google
async function loginWithGoogle() {
  try {
    showLoading('Signing in with Google...');
    const result = await auth.signInWithPopup(googleProvider);
    const user = result.user;
    
    // Check if user exists in Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (!userDoc.exists) {
      // Create new user document
      await db.collection('users').doc(user.uid).set({
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL || APP_CONFIG.defaultProfileImage,
        phone: user.phoneNumber || '',
        role: 'both',
        rating: 5.0,
        totalRides: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    
    hideLoading();
    showToast('Login successful!', 'success');
    
    setTimeout(() => {
      window.location.href = 'passenger-dashboard.html';
    }, 1000);
    
    return user;
  } catch (error) {
    hideLoading();
    console.error('Google login error:', error);
    
    let errorMessage = 'Google sign-in failed.';
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in cancelled.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Popup blocked. Please allow popups for this site.';
    }
    
    showToast(errorMessage, 'error');
    throw error;
  }
}

// Register with email and password
async function registerWithEmail(email, password, userData) {
  try {
    showLoading('Creating account...');
    
    // Create user account
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Send email verification
    await user.sendEmailVerification();
    
    // Create user document in Firestore
    await db.collection('users').doc(user.uid).set({
      email: email,
      name: userData.name,
      phone: userData.phone,
      photoURL: userData.photoURL || APP_CONFIG.defaultProfileImage,
      role: userData.role || 'both',
      rating: 5.0,
      totalRides: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    hideLoading();
    showToast('Account created! Please verify your email.', 'success');
    
    setTimeout(() => {
      window.location.href = 'passenger-dashboard.html';
    }, 1500);
    
    return user;
  } catch (error) {
    hideLoading();
    console.error('Registration error:', error);
    
    let errorMessage = 'Registration failed. Please try again.';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'An account with this email already exists.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters.';
    }
    
    showToast(errorMessage, 'error');
    throw error;
  }
}

// Reset password
async function resetPassword(email) {
  try {
    showLoading('Sending reset email...');
    await auth.sendPasswordResetEmail(email);
    hideLoading();
    showToast('Password reset email sent!', 'success');
    return true;
  } catch (error) {
    hideLoading();
    console.error('Password reset error:', error);
    
    let errorMessage = 'Failed to send reset email.';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    }
    
    showToast(errorMessage, 'error');
    throw error;
  }
}

// Update user profile
async function updateProfile(userId, updates) {
  try {
    showLoading('Updating profile...');
    
    // Update Firebase Auth profile if name or photo changed
    const currentUser = auth.currentUser;
    if (currentUser) {
      const profileUpdates = {};
      if (updates.name) profileUpdates.displayName = updates.name;
      if (updates.photoURL) profileUpdates.photoURL = updates.photoURL;
      
      if (Object.keys(profileUpdates).length > 0) {
        await currentUser.updateProfile(profileUpdates);
      }
    }
    
    // Update Firestore document
    await db.collection('users').doc(userId).update(updates);
    
    hideLoading();
    showToast('Profile updated successfully!', 'success');
    return true;
  } catch (error) {
    hideLoading();
    console.error('Profile update error:', error);
    showToast('Failed to update profile.', 'error');
    throw error;
  }
}

// Check if user is authenticated
function requireAuth() {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        // Redirect to login
        window.location.href = 'login.html';
        reject(new Error('Not authenticated'));
      }
    });
  });
}

// Initialize auth state listener
function initAuthListener() {
  auth.onAuthStateChanged(async (user) => {
    const authLinks = document.querySelectorAll('.auth-link');
    const userMenu = document.querySelector('.user-menu');
    
    if (user) {
      // User is signed in
      authLinks.forEach(link => link.style.display = 'none');
      if (userMenu) {
        userMenu.style.display = 'flex';
        
        // Update user info
        const userData = await getUserData(user.uid);
        if (userData) {
          const userAvatar = userMenu.querySelector('.user-avatar');
          const userName = userMenu.querySelector('.user-name');
          
          if (userAvatar) userAvatar.src = userData.photoURL;
          if (userName) userName.textContent = userData.name;
        }
      }
    } else {
      // User is signed out
      authLinks.forEach(link => link.style.display = 'block');
      if (userMenu) userMenu.style.display = 'none';
    }
  });
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loginWithEmail,
    loginWithGoogle,
    registerWithEmail,
    resetPassword,
    updateProfile,
    requireAuth,
    initAuthListener
  };
}
