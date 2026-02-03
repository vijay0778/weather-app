document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const locationBtn = document.querySelector('.location-btn');
    const themeBtn = document.querySelector('.theme-btn');
    const suggestionsContainer = document.getElementById('suggestions');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const weatherContent = document.getElementById('weather-content');
    const moodText = document.getElementById('mood-text');
    const gradientBg = document.querySelector('.gradient-bg');
    
    // Theme modal elements
    const themeModal = document.getElementById('theme-modal');
    const closeTheme = document.getElementById('close-theme');
    const themeOptions = document.querySelectorAll('.theme-option');
    
    // Weather elements
    const cityName = document.getElementById('city-name');
    const currentDate = document.getElementById('current-date');
    const weatherEmoji = document.getElementById('weather-emoji');
    const temperature = document.getElementById('temperature');
    const weatherDescription = document.getElementById('weather-description');
    const feelsLike = document.getElementById('feels-like');
    const tempHigh = document.getElementById('temp-high');
    const tempLow = document.getElementById('temp-low');
    const windSpeed = document.getElementById('wind-speed');
    const humidity = document.getElementById('humidity');
    const visibility = document.getElementById('visibility');
    const pressure = document.getElementById('pressure');
    
    // Forecast elements
    const hourlyContainer = document.getElementById('hourly-container');
    const dailyContainer = document.getElementById('daily-container');
    
    // Alert elements
    const weatherAlerts = document.getElementById('weather-alerts');
    const alertContent = document.getElementById('alert-content');
    
    // App state
    let currentCity = '';
    let currentUnits = 'metric';
    let currentTheme = 'sunny';
    let searchTimeout;
    
    // API key - Replace with your actual API key
    const API_KEY = 'YOUR_API_KEY';
    
    // Weather emojis and moods
    const weatherEmojis = {
        'clear': { day: '☀️', night: '🌙', mood: 'Feeling Sunny!' },
        'clouds': { day: '⛅', night: '☁️', mood: 'Cloudy Vibes!' },
        'rain': { day: '🌧️', night: '🌧️', mood: 'Rainy Day!' },
        'drizzle': { day: '🌦️', night: '🌦️', mood: 'Drizzly Weather!' },
        'thunderstorm': { day: '⛈️', night: '⛈️', mood: 'Stormy Ahead!' },
        'snow': { day: '❄️', night: '🌨️', mood: 'Snowy Wonderland!' },
        'mist': { day: '🌫️', night: '🌫️', mood: 'Misty Morning!' },
        'fog': { day: '🌫️', night: '🌫️', mood: 'Foggy Weather!' },
        'haze': { day: '🌤️', night: '🌤️', mood: 'Hazy Day!' },
        'dust': { day: '🌪️', night: '🌪️', mood: 'Dusty Winds!' },
        'sand': { day: '🏜️', night: '🏜️', mood: 'Sandy Weather!' },
        'ash': { day: '🌋', night: '🌋', mood: 'Ashy Skies!' },
        'squall': { day: '💨', night: '💨', mood: 'Windy Squall!' },
        'tornado': { day: '🌪️', night: '🌪️', mood: 'Tornado Warning!' }
    };
    
    // Initialize app
    init();
    
    function init() {
        // Load saved settings
        loadSettings();
        
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
                    // Default to a fun city
                    getWeatherData('Miami');
                }
            );
        } else {
            // Default to a fun city if geolocation is not supported
            getWeatherData('Miami');
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
            if (!e.target.closest('.search-wrapper')) {
                suggestionsContainer.style.display = 'none';
            }
        });
        
        // Location button
        locationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                showLoading(true);
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const { latitude, longitude } = position.coords;
                        getWeatherByCoords(latitude, longitude);
                    },
                    error => {
                        showLoading(false);
                        showError('Can\'t find your location! Try searching for a city 🗺️');
                    }
                );
            } else {
                showError('Your browser doesn\'t support location finding! 📍');
            }
        });
        
        // Theme button
        themeBtn.addEventListener('click', () => {
            themeModal.classList.remove('hidden');
        });
        
        closeTheme.addEventListener('click', () => {
            themeModal.classList.add('hidden');
        });
        
        // Theme options
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                applyTheme(theme);
                themeModal.classList.add('hidden');
            });
        });
        
        // Click outside to close theme modal
        themeModal.addEventListener('click', (e) => {
            if (e.target === themeModal) {
                themeModal.classList.add('hidden');
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
            
            const { lat, lon } = geoData[0];
            currentCity = geoData[0].name;
            
            // Then get weather data using coordinates
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnits}`);
            
            if (!weatherResponse.ok) {
                throw new Error('Failed to fetch weather data');
            }
            
            const weatherData = await weatherResponse.json();
            
            // Display the weather data
            displayWeatherData(currentCity, weatherData);
            
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
            
            currentCity = reverseGeoData[0].name;
            
            // Then get weather data using coordinates
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnits}`);
            
            if (!weatherResponse.ok) {
                throw new Error('Failed to fetch weather data');
            }
            
            const weatherData = await weatherResponse.json();
            
            // Display the weather data
            displayWeatherData(currentCity, weatherData);
            
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
                suggestionItem.textContent = `${item.name}, ${item.state ? item.state + ', ' : ''}${item.country}`;
                
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
    function displayWeatherData(city, data) {
        // Current weather
        cityName.textContent = city;
        currentDate.textContent = formatDate(data.current.dt);
        
        // Weather emoji and mood
        const weatherMain = data.current.weather[0].main.toLowerCase();
        const hour = new Date(data.current.dt * 1000).getHours();
        const isDayTime = hour >= 6 && hour < 20;
        
        let emojiData = weatherEmojis[weatherMain] || { day: '🌤️', night: '🌤️', mood: 'Interesting Weather!' };
        let emoji = isDayTime ? emojiData.day : emojiData.night;
        
        weatherEmoji.textContent = emoji;
        moodText.textContent = emojiData.mood;
        
        // Temperature and description
        temperature.textContent = Math.round(data.current.temp);
        weatherDescription.textContent = capitalizeFirstLetter(data.current.weather[0].description);
        feelsLike.textContent = Math.round(data.current.feels_like);
        tempHigh.textContent = Math.round(data.daily[0].temp.max);
        tempLow.textContent = Math.round(data.daily[0].temp.min);
        
        // Weather details
        windSpeed.textContent = Math.round(data.current.wind_speed * 3.6); // Convert m/s to km/h
        humidity.textContent = data.current.humidity;
        visibility.textContent = (data.current.visibility / 1000).toFixed(1);
        pressure.textContent = data.current.pressure;
        
        // Weather alerts
        if (data.alerts && data.alerts.length > 0) {
            displayWeatherAlerts(data.alerts);
        } else {
            weatherAlerts.classList.add('hidden');
        }
        
        // Hourly forecast
        displayHourlyForecast(data.hourly.slice(0, 24));
        
        // Daily forecast
        displayDailyForecast(data.daily.slice(0, 7));
        
        // Show weather content
        weatherContent.classList.remove('hidden');
        
        // Add floating animation to weather emoji
        weatherEmoji.style.animation = 'bounce 2s infinite';
    }
    
    // Display weather alerts
    function displayWeatherAlerts(alerts) {
        alertContent.innerHTML = '';
        
        alerts.forEach(alert => {
            const alertElement = document.createElement('div');
            alertElement.className = 'alert-item';
            alertElement.innerHTML = `
                <h4>${alert.event}</h4>
                <p>${alert.description}</p>
                <p class="alert-time">From: ${formatDate(alert.start)} To: ${formatDate(alert.end)}</p>
            `;
            alertContent.appendChild(alertElement);
        });
        
        weatherAlerts.classList.remove('hidden');
    }
    
    // Display hourly forecast
    function displayHourlyForecast(hourlyData) {
        hourlyContainer.innerHTML = '';
        
        hourlyData.forEach(hour => {
            const hourElement = document.createElement('div');
            hourElement.className = 'hourly-card';
            
            const weatherMain = hour.weather[0].main.toLowerCase();
            const hourTime = new Date(hour.dt * 1000).getHours();
            const isDayTime = hourTime >= 6 && hourTime < 20;
            
            let emojiData = weatherEmojis[weatherMain] || { day: '🌤️', night: '🌤️' };
            let emoji = isDayTime ? emojiData.day : emojiData.night;
            
            hourElement.innerHTML = `
                <p class="time">${formatTime(hour.dt)}</p>
                <div class="weather-icon">${emoji}</div>
                <p class="temp">${Math.round(hour.temp)}°</p>
                <p class="precip"><i class="fas fa-droplet"></i> ${Math.round(hour.pop * 100)}%</p>
            `;
            
            hourlyContainer.appendChild(hourElement);
        });
    }
    
    // Display daily forecast
    function displayDailyForecast(dailyData) {
        dailyContainer.innerHTML = '';
        
        dailyData.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'daily-card';
            
            const weatherMain = day.weather[0].main.toLowerCase();
            let emojiData = weatherEmojis[weatherMain] || { day: '🌤️' };
            let emoji = emojiData.day;
            
            dayElement.innerHTML = `
                <div class="daily-left">
                    <p class="day-name">${formatDay(day.dt)}</p>
                    <div class="daily-icon">${emoji}</div>
                    <p class="daily-temps">${Math.round(day.temp.max)}° / ${Math.round(day.temp.min)}°</p>
                </div>
                <div class="daily-right">
                    <p class="precip-chance"><i class="fas fa-droplet"></i> ${Math.round(day.pop * 100)}%</p>
                </div>
            `;
            
            dailyContainer.appendChild(dayElement);
        });
    }
    
    // Apply theme
    function applyTheme(theme) {
        currentTheme = theme;
        
        // Update CSS variables
        const root = document.documentElement;
        
        switch(theme) {
            case 'sunny':
                root.style.setProperty('--current-primary', 'var(--sunny-primary)');
                root.style.setProperty('--current-secondary', 'var(--sunny-secondary)');
                root.style.setProperty('--current-accent', 'var(--sunny-accent)');
                break;
            case 'ocean':
                root.style.setProperty('--current-primary', 'var(--ocean-primary)');
                root.style.setProperty('--current-secondary', 'var(--ocean-secondary)');
                root.style.setProperty('--current-accent', 'var(--ocean-accent)');
                break;
            case 'sunset':
                root.style.setProperty('--current-primary', 'var(--sunset-primary)');
                root.style.setProperty('--current-secondary', 'var(--sunset-secondary)');
                root.style.setProperty('--current-accent', 'var(--sunset-accent)');
                break;
            case 'night':
                root.style.setProperty('--current-primary', 'var(--night-primary)');
                root.style.setProperty('--current-secondary', 'var(--night-secondary)');
                root.style.setProperty('--current-accent', 'var(--night-accent)');
                break;
            case 'forest':
                root.style.setProperty('--current-primary', 'var(--forest-primary)');
                root.style.setProperty('--current-secondary', 'var(--forest-secondary)');
                root.style.setProperty('--current-accent', 'var(--forest-accent)');
                break;
            case 'candy':
                root.style.setProperty('--current-primary', 'var(--candy-primary)');
                root.style.setProperty('--current-secondary', 'var(--candy-secondary)');
                root.style.setProperty('--current-accent', 'var(--candy-accent)');
                break;
        }
        
        // Save theme preference
        localStorage.setItem('weatherTheme', theme);
        
        // Restart gradient animation
        gradientBg.style.animation = 'none';
        setTimeout(() => {
            gradientBg.style.animation = 'gradientShift 15s ease infinite';
        }, 10);
    }
    
    // Format date from timestamp
    function formatDate(timestamp) {
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
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }
    
    // Format time from timestamp
    function formatTime(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
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
    
    // Load settings from localStorage
    function loadSettings() {
        const savedTheme = localStorage.getItem('weatherTheme');
        if (savedTheme) {
            applyTheme(savedTheme);
        }
    }
});
