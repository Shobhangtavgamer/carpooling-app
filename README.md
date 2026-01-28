# Carpooling App

A modern carpooling platform that connects drivers and passengers for shared rides, built with Spring Boot backend and interactive frontend.

## Features

- **User Authentication**: Secure login and registration system
- **Driver Dashboard**: Manage rides, view passenger requests, and track earnings
- **Passenger Dashboard**: Browse available rides, book seats, and track trips
- **Ride Management**: Create, browse, and manage carpool rides
- **User Profiles**: Complete user profiles with ratings and preferences
- **Maps Integration**: Real-time location tracking and route visualization
- **Ride Details**: Comprehensive ride information including duration, cost, and route

## Tech Stack

### Backend
- **Framework**: Spring Boot
- **Build Tool**: Maven
- **Language**: Java

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Responsive styling
- **JavaScript**: Dynamic interactions
  - Authentication handling
  - Driver management
  - Passenger management
  - Maps integration
  - Utility functions

## Project Structure

```
carpooling-app/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/carpool/
│   │   │       └── CarpoolApplication.java
│   │   └── resources/
│   │       └── static/
│   │           ├── index.html
│   │           ├── login.html
│   │           ├── js/
│   │           └── ...
├── css/
│   ├── main.css
│   └── components.css
├── js/
│   ├── auth.js
│   ├── config.js
│   ├── driver.js
│   ├── passenger.js
│   ├── maps.js
│   └── utils.js
├── pom.xml
└── README.md
```

## Pages

- **index.html** - Home page
- **login.html** - User login
- **register.html** - User registration
- **profile.html** - User profile management
- **driver-dashboard.html** - Driver interface
- **passenger-dashboard.html** - Passenger interface
- **ride-details.html** - Detailed ride information

## Installation

### Prerequisites
- Java 8 or higher
- Maven 3.6+
- Node.js (optional, for frontend development)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shobhangtavgamer/carpooling-app.git
   cd carpooling-app
   ```

2. **Build the project**
   ```bash
   mvn clean package
   ```

3. **Run the application**
   ```bash
   mvn spring-boot:run
   ```

4. **Access the app**
   - Open your browser and navigate to `http://localhost:8080`

## Usage

### For Drivers
1. Register and create a driver profile
2. Access the driver dashboard
3. Create new rides with route and schedule
4. Manage passenger requests
5. Track ride history and earnings

### For Passengers
1. Register and create a user profile
2. Browse available rides in your area
3. Book seats for desired rides
4. View ride details and driver information
5. Track your bookings and ride history

## API Endpoints

The application provides REST APIs for:
- User authentication
- Ride management
- Booking management
- User profiles
- Driver information

## Contributing

Contributions are welcome! To contribute:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- Payment integration
- Real-time notifications
- Advanced search filters
- Ride ratings and reviews
- Insurance integration
- Emergency contact alerts

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

**Author**: Shobhan And AmanKumar

**GitHub**: [Shobhangtavgamer](https://github.com/Shobhangtavgamer) , [programmer-sultan786](https://github.com/programmer-sultan786)  

**Project Repository**: [carpooling-app](https://github.com/Shobhangtavgamer/carpooling-app)

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/Shobhangtavgamer/carpooling-app/issues) page.

## Live Server
**Link**:- https://shobhangtavgamer.github.io/carpooling-app/

---

**Happy Carpooling!** 🚗
