// Passenger Dashboard Functionality

let availableRides = [];
let searchFilters = {
  origin: null,
  destination: null,
  date: null,
  seats: 1,
  maxPrice: null
};

// Search for rides
async function searchRides(filters) {
  try {
    showLoading('Searching for rides...');
    
    let query = db.collection('rides')
      .where('status', '==', 'active');
    
    // Filter by date if provided
    if (filters.date) {
      query = query.where('date', '==', filters.date);
    }
    
    const ridesSnapshot = await query.get();
    
    let rides = [];
    ridesSnapshot.forEach(doc => {
      const ride = { id: doc.id, ...doc.data() };
      
      // Filter by available seats
      const availableSeats = ride.seats - (ride.bookedSeats || 0);
      if (availableSeats >= filters.seats) {
        
        // Filter by price if provided
        if (!filters.maxPrice || ride.price <= filters.maxPrice) {
          rides.push(ride);
        }
      }
    });
    
    // Filter by location if provided
    if (filters.origin && filters.destination) {
      rides = rides.filter(ride => {
        const originMatch = ride.origin.address.toLowerCase().includes(filters.origin.toLowerCase());
        const destMatch = ride.destination.address.toLowerCase().includes(filters.destination.toLowerCase());
        return originMatch && destMatch;
      });
    }
    
    hideLoading();
    availableRides = rides;
    displaySearchResults(rides);
    
    return rides;
  } catch (error) {
    hideLoading();
    console.error('Error searching rides:', error);
    showToast('Error searching rides', 'error');
    return [];
  }
}

// Display search results
function displaySearchResults(rides) {
  const container = document.getElementById('searchResults');
  if (!container) return;
  
  if (rides.length === 0) {
    container.innerHTML = `
      <div class="card text-center p-xl">
        <h3>No Rides Found</h3>
        <p class="text-secondary">Try adjusting your search criteria</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = rides.map(ride => {
    const availableSeats = ride.seats - (ride.bookedSeats || 0);
    
    return `
      <div class="card" data-ride-id="${ride.id}">
        <div class="card-header">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-md">
              <img src="${ride.driverPhoto}" alt="${ride.driverName}" class="avatar">
              <div>
                <h4 class="font-semibold">${ride.driverName}</h4>
                <p class="text-muted" style="font-size: 0.875rem;">⭐ ${ride.driverRating.toFixed(1)}</p>
              </div>
            </div>
            <div class="text-right">
              <div class="font-bold" style="font-size: 1.5rem; color: var(--primary);">${formatCurrency(ride.price)}</div>
              <div class="text-muted" style="font-size: 0.875rem;">per seat</div>
            </div>
          </div>
        </div>
        
        <div class="card-body">
          <div class="mb-md">
            <div class="flex items-center gap-sm mb-sm">
              <span style="color: var(--success);">●</span>
              <span class="font-semibold">${ride.origin.address}</span>
            </div>
            <div style="margin-left: 1.5rem; border-left: 2px dashed var(--text-muted); height: 20px;"></div>
            <div class="flex items-center gap-sm">
              <span style="color: var(--danger);">●</span>
              <span class="font-semibold">${ride.destination.address}</span>
            </div>
          </div>
          
          <div class="grid grid-3 gap-md">
            <div>
              <p class="text-muted" style="font-size: 0.875rem;">📅 Date</p>
              <p class="font-semibold">${formatDate(ride.date)}</p>
            </div>
            <div>
              <p class="text-muted" style="font-size: 0.875rem;">🕐 Time</p>
              <p class="font-semibold">${formatTime(ride.time)}</p>
            </div>
            <div>
              <p class="text-muted" style="font-size: 0.875rem;">💺 Seats</p>
              <p class="font-semibold">${availableSeats} available</p>
            </div>
          </div>
          
          ${ride.distance ? `
            <div class="mt-md">
              <p class="text-secondary">📍 ${ride.distance} • ${ride.duration}</p>
            </div>
          ` : ''}
          
          ${ride.vehicleInfo ? `
            <div class="mt-sm">
              <p class="text-secondary">🚗 ${ride.vehicleInfo}</p>
            </div>
          ` : ''}
        </div>
        
        <div class="card-footer">
          <button class="btn btn-primary" onclick="viewRideDetails('${ride.id}')">
            View Details
          </button>
          <button class="btn btn-secondary" onclick="openBookingModal('${ride.id}')">
            Book Now
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Book a ride
async function bookRide(rideId, seatsToBook) {
  try {
    const user = await getCurrentUser();
    const userData = await getUserData(user.uid);
    
    showLoading('Booking ride...');
    
    // Get ride details
    const rideDoc = await db.collection('rides').doc(rideId).get();
    if (!rideDoc.exists) {
      throw new Error('Ride not found');
    }
    
    const ride = rideDoc.data();
    const availableSeats = ride.seats - (ride.bookedSeats || 0);
    
    // Check if enough seats available
    if (seatsToBook > availableSeats) {
      hideLoading();
      showToast('Not enough seats available', 'error');
      return;
    }
    
    // Create booking
    const booking = {
      rideId: rideId,
      passengerId: user.uid,
      passengerName: userData.name,
      passengerPhoto: userData.photoURL,
      passengerPhone: userData.phone,
      driverId: ride.driverId,
      seatsBooked: parseInt(seatsToBook),
      totalPrice: ride.price * seatsToBook,
      status: 'confirmed',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('bookings').add(booking);
    
    // Update ride booked seats
    await db.collection('rides').doc(rideId).update({
      bookedSeats: firebase.firestore.FieldValue.increment(parseInt(seatsToBook))
    });
    
    hideLoading();
    showToast('Ride booked successfully!', 'success');
    
    // Refresh search results
    await searchRides(searchFilters);
    
    return true;
  } catch (error) {
    hideLoading();
    console.error('Error booking ride:', error);
    showToast('Error booking ride', 'error');
    throw error;
  }
}

// Load passenger's bookings
async function loadPassengerBookings() {
  try {
    const user = await getCurrentUser();
    
    const bookingsSnapshot = await db.collection('bookings')
      .where('passengerId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const bookings = [];
    
    for (const doc of bookingsSnapshot.docs) {
      const booking = { id: doc.id, ...doc.data() };
      
      // Get ride details
      const rideDoc = await db.collection('rides').doc(booking.rideId).get();
      if (rideDoc.exists) {
        booking.ride = rideDoc.data();
      }
      
      bookings.push(booking);
    }
    
    return bookings;
  } catch (error) {
    console.error('Error loading bookings:', error);
    return [];
  }
}

// Display passenger bookings
function displayPassengerBookings(bookings) {
  const container = document.getElementById('bookingsContainer');
  if (!container) return;
  
  if (bookings.length === 0) {
    container.innerHTML = `
      <div class="card text-center p-xl">
        <h3>No Bookings Yet</h3>
        <p class="text-secondary">Search for rides and book your first trip!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = bookings.map(booking => {
    const ride = booking.ride;
    if (!ride) return '';
    
    return `
      <div class="card">
        <div class="card-header">
          <div class="flex justify-between items-center">
            <h4 class="card-title">${ride.origin.address} → ${ride.destination.address}</h4>
            <span class="badge ${getBookingStatusBadge(booking.status)}">${booking.status}</span>
          </div>
        </div>
        
        <div class="card-body">
          <div class="flex items-center gap-md mb-md">
            <img src="${ride.driverPhoto}" alt="${ride.driverName}" class="avatar">
            <div>
              <p class="font-semibold">${ride.driverName}</p>
              <p class="text-muted" style="font-size: 0.875rem;">⭐ ${ride.driverRating.toFixed(1)}</p>
            </div>
          </div>
          
          <div class="grid grid-3 gap-md">
            <div>
              <p class="text-muted" style="font-size: 0.875rem;">📅 Date</p>
              <p class="font-semibold">${formatDate(ride.date)}</p>
            </div>
            <div>
              <p class="text-muted" style="font-size: 0.875rem;">💺 Seats</p>
              <p class="font-semibold">${booking.seatsBooked}</p>
            </div>
            <div>
              <p class="text-muted" style="font-size: 0.875rem;">💰 Total</p>
              <p class="font-semibold">${formatCurrency(booking.totalPrice)}</p>
            </div>
          </div>
        </div>
        
        <div class="card-footer">
          <button class="btn btn-sm btn-primary" onclick="viewRideDetails('${booking.rideId}')">
            View Details
          </button>
          ${booking.status === 'confirmed' ? `
            <button class="btn btn-sm btn-outline" onclick="cancelBooking('${booking.id}')" style="border-color: var(--danger); color: var(--danger);">
              Cancel Booking
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Get booking status badge
function getBookingStatusBadge(status) {
  const badges = {
    'confirmed': 'badge-success',
    'pending': 'badge-warning',
    'cancelled': 'badge-danger',
    'completed': 'badge-primary'
  };
  return badges[status] || 'badge-primary';
}

// Cancel booking
async function cancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking?')) {
    return;
  }
  
  try {
    showLoading('Cancelling booking...');
    
    const bookingDoc = await db.collection('bookings').doc(bookingId).get();
    const booking = bookingDoc.data();
    
    // Update booking status
    await db.collection('bookings').doc(bookingId).update({
      status: 'cancelled'
    });
    
    // Update ride booked seats
    await db.collection('rides').doc(booking.rideId).update({
      bookedSeats: firebase.firestore.FieldValue.increment(-booking.seatsBooked)
    });
    
    hideLoading();
    showToast('Booking cancelled', 'success');
    
    // Reload bookings
    const bookings = await loadPassengerBookings();
    displayPassengerBookings(bookings);
    
  } catch (error) {
    hideLoading();
    console.error('Error cancelling booking:', error);
    showToast('Error cancelling booking', 'error');
  }
}

// View ride details
function viewRideDetails(rideId) {
  window.location.href = `ride-details.html?id=${rideId}`;
}

// Open booking modal
function openBookingModal(rideId) {
  const ride = availableRides.find(r => r.id === rideId);
  if (!ride) return;
  
  const availableSeats = ride.seats - (ride.bookedSeats || 0);
  
  const modal = document.getElementById('bookingModal');
  if (!modal) return;
  
  document.getElementById('bookingRideId').value = rideId;
  document.getElementById('bookingSeats').max = availableSeats;
  document.getElementById('bookingSeats').value = 1;
  document.getElementById('maxSeatsInfo').textContent = `Max ${availableSeats} seats available`;
  
  updateBookingTotal(ride.price, 1);
  
  openModal('bookingModal');
}

// Update booking total
function updateBookingTotal(pricePerSeat, seats) {
  const total = pricePerSeat * seats;
  document.getElementById('bookingTotal').textContent = formatCurrency(total);
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    searchRides,
    displaySearchResults,
    bookRide,
    loadPassengerBookings,
    displayPassengerBookings,
    cancelBooking,
    viewRideDetails,
    openBookingModal,
    updateBookingTotal
  };
}
