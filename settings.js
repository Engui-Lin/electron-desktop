document.addEventListener("DOMContentLoaded", function () {
  console.log("Script Loaded!");

  // Default values
  let settings = {
    schedule: {
      selectedDays: [],
      focusStartTime: "",
      focusEndTime: "",
      interruptionFrequency: 5, // Default
    },
    audio: {
      volume: 50, // Default volume (0-100)
      voice: "default", // Default voice
      enablePostProcessing: true, // Default enabled
    },
    temperament: {
      profanityLevel: 5, // Default profanity filter (0-10)
      enableFlirting: false, // Default disabled
    },
  };

  // Load settings if they exist
  function loadSettings() {
    window.electronAPI.loadSettings().then((savedSettings) => {
      console.log("Loaded settings from file:", savedSettings); // Debugging log

      // If savedSettings exists and has the correct structure, use it
      if (
        savedSettings &&
        savedSettings.schedule &&
        savedSettings.audio &&
        savedSettings.temperament
      ) {
        settings = savedSettings;
      } else {
        console.warn("Invalid or missing settings. Falling back to defaults.");
      }

      // Load Schedule Settings
      const {
        selectedDays = [],
        focusStartTime = "",
        focusEndTime = "",
        interruptionFrequency = 5,
      } = settings.schedule || {};

      document.querySelectorAll(".day-box").forEach((day) => {
        if (selectedDays.includes(day.innerText.toLowerCase())) {
          day.style.background = "var(--color-secondary)";
          day.style.color = "var(--color-primary)";
        }
      });
      document.querySelectorAll(".time-box")[0].value = focusStartTime;
      document.querySelectorAll(".time-box")[1].value = focusEndTime;
      document.getElementById("interruption-slider").value =
        interruptionFrequency;

      // Load Audio Settings
      const {
        volume = 50,
        voice = "default",
        enablePostProcessing = true,
      } = settings.audio || {};
      document.getElementById("volume-slider").value = volume;
      document.getElementById("voice-select").value = voice;
      document.getElementById("enable-postprocessing").checked =
        enablePostProcessing;

      // Load Temperament Settings
      const { profanityLevel = 5, enableFlirting = false } =
        settings.temperament || {};
      document.getElementById("profanity-slider").value = profanityLevel;
      document.getElementById("enable-flirting").checked = enableFlirting;

      console.log("Settings Loaded:", settings);
    });
  }

  // Save settings to settings.json
  function saveSettings() {
    window.electronAPI.saveSettings(settings);
    console.log("Settings Saved:", settings);
  }

  // Handle Day Selection
  document.querySelectorAll(".day-box").forEach((day) => {
    day.addEventListener("click", () => {
      const dayValue = day.innerText.toLowerCase();
      if (settings.schedule.selectedDays.includes(dayValue)) {
        settings.schedule.selectedDays = settings.schedule.selectedDays.filter(
          (d) => d !== dayValue
        );
        day.style.background = "";
        day.style.color = "";
      } else {
        settings.schedule.selectedDays.push(dayValue);
        day.style.background = "var(--color-secondary)";
        day.style.color = "var(--color-primary)";
      }
      saveSettings();
    });
  });

  // Handle Time Inputs
  document.querySelectorAll(".time-box").forEach((input, index) => {
    input.addEventListener("input", () => {
      if (index === 0) settings.schedule.focusStartTime = input.value;
      if (index === 1) settings.schedule.focusEndTime = input.value;
      saveSettings();
    });
  });

  // Handle Interruption Frequency Slider
  document
    .getElementById("interruption-slider")
    .addEventListener("input", function () {
      settings.schedule.interruptionFrequency = this.value;
      saveSettings();
    });

  // Handle Volume Slider
  document
    .getElementById("volume-slider")
    .addEventListener("input", function () {
      settings.audio.volume = this.value;
      saveSettings();
    });

  // Handle Voice Dropdown
  document
    .getElementById("voice-select")
    .addEventListener("change", function () {
      settings.audio.voice = this.value;
      saveSettings();
    });

  // Handle Audio Enable Checkbox
  document
    .getElementById("enable-postprocessing")
    .addEventListener("change", function () {
      settings.audio.enablePostProcessing = this.checked;
      saveSettings();
    });

  // Handle Profanity Slider
  document
    .getElementById("profanity-slider")
    .addEventListener("input", function () {
      settings.temperament.profanityLevel = this.value;
      saveSettings();
    });

  // Handle Profanity Enable Checkbox
  document
    .getElementById("enable-flirting")
    .addEventListener("change", function () {
      settings.temperament.enableFlirting = this.checked;
      saveSettings();
    });
  // AI Trigger Function
  function shouldTriggerAI() {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDay = now
      .toLocaleString("en-us", { weekday: "short" })
      .toLowerCase();

    if (
      selectedDays.includes(currentDay) &&
      currentTime >= focusStartTime &&
      currentTime <= focusEndTime
    ) {
      console.log("AI Triggered!");
      // We need to add the frequency here.
      return true;
    } else {
      console.log("AI Not Allowed to Speak");
      return false;
    }
  }

  // Load settings when the page loads
  loadSettings();
});
document.addEventListener("DOMContentLoaded", () => {
  // Function to play sound
  function playSound() {
    const audio = new Audio("assets/fx/old-radio-button-click-97549.mp3");
    audio.play().catch((error) => {
      console.error("Error playing sound:", error);
    });
  }

  // Attach event listeners to tabs
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", playSound);
  });

  // Attach event listeners to dropdowns
  document.querySelectorAll("select").forEach((dropdown) => {
    dropdown.addEventListener("change", playSound);
  });

  // Attach event listeners to days
  document.querySelectorAll(".day-box").forEach((day) => {
    day.addEventListener("click", playSound);
  });

  // Attach event listeners to sliders
  document.querySelectorAll('input[type="range"]').forEach((slider) => {
    slider.addEventListener("input", playSound);
  });

  // Attach event listeners to checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", playSound);
  });

  // Attach event listeners to time inputs
  document.querySelectorAll('input[type="time"]').forEach((timeInput) => {
    timeInput.addEventListener("input", playSound);
  });
});
