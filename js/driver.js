// Driver Dashboard Functionality

let currentRides = [];
let selectedOrigin = null;
let selectedDestination = null;
let routeInfo = null;

// Load driver's posted rides
async function loadDriverRides() {
  try {
    const user = await getCurrentUser();
    showLoading('Loading your rides...');
    
    const ridesSnapshot = await db.collection('rides')
      .where('driverId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    currentRides = [];
    ridesSnapshot.forEach(doc => {
      currentRides.push({ id: doc.id, ...doc.data() });
    });
    
    hideLoading();
    displayDriverRides(currentRides);
    
    return currentRides;
  } catch (error) {
    hideLoading();
    console.error('Error loading rides:', error);
    showToast('Error loading rides', 'error');
    return [];
  }
}

// Display driver's rides
function displayDriverRides(rides) {
  const container = document.getElementById('ridesContainer');
  if (!container) return;
  
  if (rides.length === 0) {
    container.innerHTML = `
      <div class="card text-center p-xl">
        <h3>No Rides Posted Yet</h3>
        <p class="text-secondary">Post your first ride to start earning!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = rides.map(ride => `
    <div class="card" data-ride-id="${ride.id}">
      <div class="card-header">
        <div class="flex justify-between items-center">
          <h3 class="card-title">${ride.origin.address} → ${ride.destination.address}</h3>
          <span class="badge ${getRideStatusBadge(ride.status)}">${ride.status}</span>
        </div>
      </div>
      
      <div class="card-body">
        <div class="grid grid-2 gap-md mb-md">
          <div>
            <p class="text-muted" style="font-size: 0.875rem;">📅 Date & Time</p>
            <p class="font-semibold">${formatDate(ride.date)} at ${formatTime(ride.time)}</p>
          </div>
          <div>
            <p class="text-muted" style="font-size: 0.875rem;">💺 Available Seats</p>
            <p class="font-semibold">${ride.seats - (ride.bookedSeats || 0)} / ${ride.seats}</p>
          </div>
          <div>
            <p class="text-muted" style="font-size: 0.875rem;">💰 Price per Seat</p>
            <p class="font-semibold">${formatCurrency(ride.price)}</p>
          </div>
          <div>
            <p class="text-muted" style="font-size: 0.875rem;">🚗 Vehicle</p>
            <p class="font-semibold">${ride.vehicleInfo || 'Not specified'}</p>
          </div>
        </div>
        
        ${ride.distance ? `<p class="text-secondary">📍 Distance: ${ride.distance} • Duration: ${ride.duration}</p>` : ''}
      </div>
      
      <div class="card-footer">
        <button class="btn btn-sm btn-primary" onclick="viewRideDetails('${ride.id}')">
          View Details
        </button>
        <button class="btn btn-sm btn-ghost" onclick="editRide('${ride.id}')">
          Edit
        </button>
        <button class="btn btn-sm btn-outline" onclick="deleteRide('${ride.id}')" style="border-color: var(--danger); color: var(--danger);">
          Delete
        </button>
      </div>
    </div>
  `).join('');
}

// Get badge class based on ride status
function getRideStatusBadge(status) {
  const badges = {
    'active': 'badge-success',
    'completed': 'badge-primary',
    'cancelled': 'badge-danger',
    'full': 'badge-warning'
  };
  return badges[status] || 'badge-primary';
}

// Post new ride
async function postRide(rideData) {
  try {
    const user = await getCurrentUser();
    const userData = await getUserData(user.uid);
    
    showLoading('Posting your ride...');
    
    const ride = {
      driverId: user.uid,
      driverName: userData.name,
      driverPhoto: userData.photoURL,
      driverRating: userData.rating || 5.0,
      origin: rideData.origin,
      destination: rideData.destination,
      date: rideData.date,
      time: rideData.time,
      seats: parseInt(rideData.seats),
      price: parseFloat(rideData.price),
      vehicleInfo: rideData.vehicleInfo,
      distance: rideData.distance,
      duration: rideData.duration,
      status: 'active',
      bookedSeats: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('rides').add(ride);
    
    hideLoading();
    showToast('Ride posted successfully!', 'success');
    
    // Reload rides
    await loadDriverRides();
    
    return docRef.id;
  } catch (error) {
    hideLoading();
    console.error('Error posting ride:', error);
    showToast('Error posting ride', 'error');
    throw error;
  }
}

// Update ride
async function updateRide(rideId, updates) {
  try {
    showLoading('Updating ride...');
    
    await db.collection('rides').doc(rideId).update(updates);
    
    hideLoading();
    showToast('Ride updated successfully!', 'success');
    
    await loadDriverRides();
    
    return true;
  } catch (error) {
    hideLoading();
    console.error('Error updating ride:', error);
    showToast('Error updating ride', 'error');
    throw error;
  }
}

// Delete ride
async function deleteRide(rideId) {
  if (!confirm('Are you sure you want to delete this ride?')) {
    return;
  }
  
  try {
    showLoading('Deleting ride...');
    
    // Check if there are any bookings
    const bookingsSnapshot = await db.collection('bookings')
      .where('rideId', '==', rideId)
      .where('status', '==', 'confirmed')
      .get();
    
    if (!bookingsSnapshot.empty) {
      hideLoading();
      showToast('Cannot delete ride with confirmed bookings', 'error');
      return;
    }
    
    await db.collection('rides').doc(rideId).delete();
    
    hideLoading();
    showToast('Ride deleted successfully!', 'success');
    
    await loadDriverRides();
  } catch (error) {
    hideLoading();
    console.error('Error deleting ride:', error);
    showToast('Error deleting ride', 'error');
  }
}

// View ride details
function viewRideDetails(rideId) {
  window.location.href = `ride-details.html?id=${rideId}`;
}

// Edit ride
function editRide(rideId) {
  const ride = currentRides.find(r => r.id === rideId);
  if (!ride) return;
  
  // Populate form with ride data
  document.getElementById('rideId').value = ride.id;
  document.getElementById('origin').value = ride.origin.address;
  document.getElementById('destination').value = ride.destination.address;
  document.getElementById('date').value = ride.date;
  document.getElementById('time').value = ride.time;
  document.getElementById('seats').value = ride.seats;
  document.getElementById('price').value = ride.price;
  document.getElementById('vehicleInfo').value = ride.vehicleInfo || '';
  
  selectedOrigin = ride.origin;
  selectedDestination = ride.destination;
  
  // Show route on map
  if (ride.origin && ride.destination) {
    calculateRoute(
      { lat: ride.origin.lat, lng: ride.origin.lng },
      { lat: ride.destination.lat, lng: ride.destination.lng }
    );
  }
  
  // Scroll to form
  document.getElementById('postRideForm').scrollIntoView({ behavior: 'smooth' });
}

// Load bookings for driver's rides
async function loadDriverBookings() {
  try {
    const user = await getCurrentUser();
    
    const ridesSnapshot = await db.collection('rides')
      .where('driverId', '==', user.uid)
      .get();
    
    const rideIds = ridesSnapshot.docs.map(doc => doc.id);
    
    if (rideIds.length === 0) {
      return [];
    }
    
    const bookingsSnapshot = await db.collection('bookings')
      .where('rideId', 'in', rideIds)
      .orderBy('createdAt', 'desc')
      .get();
    
    const bookings = [];
    bookingsSnapshot.forEach(doc => {
      bookings.push({ id: doc.id, ...doc.data() });
    });
    
    return bookings;
  } catch (error) {
    console.error('Error loading bookings:', error);
    return [];
  }
}

// Accept booking
async function acceptBooking(bookingId) {
  try {
    showLoading('Accepting booking...');
    
    await db.collection('bookings').doc(bookingId).update({
      status: 'confirmed'
    });
    
    hideLoading();
    showToast('Booking accepted!', 'success');
    
    // Reload bookings
    await loadDriverBookings();
  } catch (error) {
    hideLoading();
    console.error('Error accepting booking:', error);
    showToast('Error accepting booking', 'error');
  }
}

// Reject booking
async function rejectBooking(bookingId) {
  try {
    showLoading('Rejecting booking...');
    
    const booking = await db.collection('bookings').doc(bookingId).get();
    const bookingData = booking.data();
    
    // Update booking status
    await db.collection('bookings').doc(bookingId).update({
      status: 'cancelled'
    });
    
    // Update ride booked seats
    await db.collection('rides').doc(bookingData.rideId).update({
      bookedSeats: firebase.firestore.FieldValue.increment(-bookingData.seatsBooked)
    });
    
    hideLoading();
    showToast('Booking rejected', 'success');
    
    await loadDriverBookings();
  } catch (error) {
    hideLoading();
    console.error('Error rejecting booking:', error);
    showToast('Error rejecting booking', 'error');
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadDriverRides,
    displayDriverRides,
    postRide,
    updateRide,
    deleteRide,
    viewRideDetails,
    editRide,
    loadDriverBookings,
    acceptBooking,
    rejectBooking
  };
}
