document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const suggestionsContainer = document.getElementById('suggestions');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const weatherContent = document.getElementById('weather-content');
    const backgroundGradient = document.querySelector('.background-gradient');
    
    // Weather elements
    const cityName = document.getElementById('city-name');
    const countryName = document.getElementById('country-name');
    const currentTemp = document.getElementById('current-temp');
    const weatherCondition = document.getElementById('weather-condition');
    const feelsLike = document.getElementById('feels-like');
    const weatherIconMain = document.getElementById('weather-icon-main');
    const windSpeed = document.getElementById('wind-speed');
    const humidity = document.getElementById('humidity');
    const pressure = document.getElementById('pressure');
    const visibility = document.getElementById('visibility');
    const sunrise = document.getElementById('sunrise');
    const sunset = document.getElementById('sunset');
    
    // Forecast elements
    const hourlyContainer = document.getElementById('hourly-container');
    const dailyContainer = document.getElementById('daily-container');
    
    // App state
    let currentCity = '';
    let currentUnits = 'imperial'; // Using imperial for Fahrenheit
    let searchTimeout;
    
    // API key - Replace with your actual API key
    const API_KEY = 'YOUR_API_KEY';
    
    // Weather icon mapping
    const weatherIcons = {
        '01d': 'fas fa-sun',
        '01n': 'fas fa-moon',
        '02d': 'fas fa-cloud-sun',
        '02n': 'fas fa-cloud-moon',
        '03d': 'fas fa-cloud',
        '03n': 'fas fa-cloud',
        '04d': 'fas fa-cloud',
        '04n': 'fas fa-cloud',
        '09d': 'fas fa-cloud-showers-heavy',
        '09n': 'fas fa-cloud-showers-heavy',
        '10d': 'fas fa-cloud-sun-rain',
        '10n': 'fas fa-cloud-moon-rain',
        '11d': 'fas fa-bolt',
        '11n': 'fas fa-bolt',
        '13d': 'fas fa-snowflake',
        '13n': 'fas fa-snowflake',
        '50d': 'fas fa-smog',
        '50n': 'fas fa-smog'
    };
    
    // Initialize app
    init();
    
    function init() {
        // Set up event listeners
        setupEventListeners();
        
        // Get user's location on page load
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    getWeatherByCoords(latitude, longitude);
                },
                error => {
                    console.error('Error getting location:', error);
                    // Default to San Francisco
                    getWeatherData('San Francisco');
                }
            );
        } else {
            // Default to San Francisco if geolocation is not supported
            getWeatherData('San Francisco');
        }
    }
    
    function setupEventListeners() {
        // Search functionality
        searchBtn.addEventListener('click', () => {
            const city = cityInput.value.trim();
            if (city) {
                getWeatherData(city);
            }
        });
        
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const city = cityInput.value.trim();
                if (city) {
                    getWeatherData(city);
                }
            }
        });
        
        // City input autocomplete
        cityInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            const query = cityInput.value.trim();
            
            if (query.length < 2) {
                suggestionsContainer.style.display = 'none';
                return;
            }
            
            searchTimeout = setTimeout(() => {
                getCitySuggestions(query);
            }, 300);
        });
        
        // Click outside to close suggestions
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                suggestionsContainer.style.display = 'none';
            }
        });
        
        // Retry button
        retryBtn.addEventListener('click', () => {
            if (currentCity) {
                getWeatherData(currentCity);
            }
        });
    }
    
    // Get weather data by city name
    async function getWeatherData(city) {
        showLoading(true);
        hideError();
        hideWeatherContent();
        
        try {
            // First get coordinates for the city
            const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`);
            
            if (!geoResponse.ok) {
                throw new Error('City not found');
            }
            
            const geoData = await geoResponse.json();
            
            if (geoData.length === 0) {
                throw new Error('City not found');
            }
            
            const { lat, lon, name, country } = geoData[0];
            currentCity = name;
            
            // Then get weather data using coordinates
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnits}`);
            
            if (!weatherResponse.ok) {
                throw new Error('Failed to fetch weather data');
            }
            
            const weatherData = await weatherResponse.json();
            
            // Display the weather data
            displayWeatherData(name, country, weatherData);
            
        } catch (error) {
            showError(error.message);
        } finally {
            showLoading(false);
        }
    }
    
    // Get weather data by coordinates
    async function getWeatherByCoords(lat, lon) {
        showLoading(true);
        hideError();
        hideWeatherContent();
        
        try {
            // First get city name from coordinates
            const reverseGeoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
            
            if (!reverseGeoResponse.ok) {
                throw new Error('Failed to get location name');
            }
            
            const reverseGeoData = await reverseGeoResponse.json();
            
            if (reverseGeoData.length === 0) {
                throw new Error('Location not found');
            }
            
            const { name, country } = reverseGeoData[0];
            currentCity = name;
            
            // Then get weather data using coordinates
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnits}`);
            
            if (!weatherResponse.ok) {
                throw new Error('Failed to fetch weather data');
            }
            
            const weatherData = await weatherResponse.json();
            
            // Display the weather data
            displayWeatherData(name, country, weatherData);
            
        } catch (error) {
            showError(error.message);
        } finally {
            showLoading(false);
        }
    }
    
    // Get city suggestions for autocomplete
    async function getCitySuggestions(query) {
        try {
            const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`);
            
            if (!response.ok) {
                throw new Error('Failed to get suggestions');
            }
            
            const data = await response.json();
            
            if (data.length === 0) {
                suggestionsContainer.style.display = 'none';
                return;
            }
            
            // Clear previous suggestions
            suggestionsContainer.innerHTML = '';
            
            // Add new suggestions
            data.forEach(item => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.innerHTML = `
                    <i class="fas fa-location-dot"></i>
                    <div>
                        <div>${item.name}, ${item.state ? item.state + ', ' : ''}${item.country}</div>
                    </div>
                `;
                
                suggestionItem.addEventListener('click', () => {
                    cityInput.value = item.name;
                    suggestionsContainer.style.display = 'none';
                    getWeatherData(item.name);
                });
                
                suggestionsContainer.appendChild(suggestionItem);
            });
            
            suggestionsContainer.style.display = 'block';
            
        } catch (error) {
            console.error('Error getting suggestions:', error);
            suggestionsContainer.style.display = 'none';
        }
    }
    
    // Display weather data
    function displayWeatherData(city, country, data) {
        // Update location info
        cityName.textContent = city;
        countryName.textContent = country;
        
        // Current weather
        currentTemp.textContent = Math.round(data.current.temp);
        weatherCondition.textContent = capitalizeFirstLetter(data.current.weather[0].description);
        feelsLike.textContent = `Feels like ${Math.round(data.current.feels_like)}°F`;
        
        // Weather icon
        const iconCode = data.current.weather[0].icon;
        weatherIconMain.className = weatherIcons[iconCode] || 'fas fa-question';
        
        // Update background based on weather
        updateBackground(data.current.weather[0].main, data.current.dt);
        
        // Weather details
        windSpeed.textContent = `${Math.round(data.current.wind_speed)} mph`;
        humidity.textContent = `${data.current.humidity}%`;
        pressure.textContent = `${(data.current.pressure * 0.02953).toFixed(2)} in`; // Convert hPa to inches
        visibility.textContent = `${(data.current.visibility / 1609.34).toFixed(1)} mi`; // Convert meters to miles
        
        // Sun times
        sunrise.textContent = formatTime(data.current.sunrise);
        sunset.textContent = formatTime(data.current.sunset);
        
        // Hourly forecast
        displayHourlyForecast(data.hourly.slice(0, 24));
        
        // Daily forecast
        displayDailyForecast(data.daily.slice(0, 7));
        
        // Show weather content
        weatherContent.classList.remove('hidden');
    }
    
    // Display hourly forecast
    function displayHourlyForecast(hourlyData) {
        hourlyContainer.innerHTML = '';
        
        hourlyData.forEach(hour => {
            const hourElement = document.createElement('div');
            hourElement.className = 'hourly-item';
            
            const iconCode = hour.weather[0].icon;
            const iconClass = weatherIcons[iconCode] || 'fas fa-question';
            
            hourElement.innerHTML = `
                <p class="hourly-time">${formatTime(hour.dt)}</p>
                <i class="${iconClass} hourly-icon"></i>
                <p class="hourly-temp">${Math.round(hour.temp)}°</p>
                <p class="hourly-rain"><i class="fas fa-droplet"></i> ${Math.round(hour.pop * 100)}%</p>
            `;
            
            hourlyContainer.appendChild(hourElement);
        });
    }
    
    // Display daily forecast
    function displayDailyForecast(dailyData) {
        dailyContainer.innerHTML = '';
        
        dailyData.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'daily-item';
            
            const iconCode = day.weather[0].icon;
            const iconClass = weatherIcons[iconCode] || 'fas fa-question';
            
            dayElement.innerHTML = `
                <div class="daily-left">
                    <p class="day-name">${formatDay(day.dt)}</p>
                    <i class="${iconClass} daily-icon"></i>
                    <p class="daily-temps">${Math.round(day.temp.max)}° / ${Math.round(day.temp.min)}°</p>
                </div>
                <div class="daily-right">
                    <p class="daily-rain"><i class="fas fa-droplet"></i> ${Math.round(day.pop * 100)}%</p>
                </div>
            `;
            
            dailyContainer.appendChild(dayElement);
        });
    }
    
    // Update background based on weather
    function updateBackground(weatherMain, timestamp) {
        const hour = new Date(timestamp * 1000).getHours();
        const isDayTime = hour >= 6 && hour < 20;
        
        // Remove all background classes
        backgroundGradient.classList.remove('sunny-bg', 'cloudy-bg', 'rainy-bg', 'night-bg', 'snowy-bg');
        
        if (!isDayTime) {
            backgroundGradient.classList.add('night-bg');
        } else {
            switch (weatherMain.toLowerCase()) {
                case 'clear':
                    backgroundGradient.classList.add('sunny-bg');
                    break;
                case 'clouds':
                    backgroundGradient.classList.add('cloudy-bg');
                    break;
                case 'rain':
                case 'drizzle':
                case 'thunderstorm':
                    backgroundGradient.classList.add('rainy-bg');
                    break;
                case 'snow':
                    backgroundGradient.classList.add('snowy-bg');
                    break;
                default:
                    backgroundGradient.classList.add('sunny-bg');
            }
        }
    }
    
    // Format time from timestamp
    function formatTime(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    // Format day from timestamp
    function formatDay(timestamp) {
        const date = new Date(timestamp * 1000);
        const today = new Date();
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        }
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        }
        
        return date.toLocaleDateString('en-US', {
            weekday: 'short'
        });
    }
    
    // Capitalize first letter
    function capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    // Show/hide loading indicator
    function showLoading(show) {
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }
    
    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        error.classList.remove('hidden');
    }
    
    // Hide error message
    function hideError() {
        error.classList.add('hidden');
    }
    
    // Hide weather content
    function hideWeatherContent() {
        weatherContent.classList.add('hidden');
    }
});
